import re
import smtplib
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core import email as email_module
from app.core.email import build_message, send_email
from app.main import app
from app.modules.auth.models import PasswordResetToken
from tests.conftest import CLIENT_PASSWORD

FORGOT = "/api/v1/auth/forgot-password"
RESET = "/api/v1/auth/reset-password"
LOGIN = "/api/v1/auth/login"
NEW_PASSWORD = "Nueva1234!x"


def token_from(outbox: list, index: int = -1) -> str:
    match = re.search(r"reset-password\?token=([\w-]+)", outbox[index][2])
    assert match
    return match.group(1)


def can_login(password: str, email: str = "cliente@example.com") -> bool:
    response = TestClient(app).post(LOGIN, json={"email": email, "password": password})
    return response.status_code == 200


def test_forgot_existing_email_sends_link(client, make_user, outbox, settings):
    make_user()
    response = client.post(FORGOT, json={"email": "cliente@example.com"})
    assert response.status_code == 202
    assert len(outbox) == 1
    to, subject, body = outbox[0]
    assert to == "cliente@example.com"
    assert f"{settings.frontend_url}/reset-password?token=" in body
    assert "60 minutos" in body
    assert subject


def test_forgot_unknown_and_existing_have_same_response(client, make_user, outbox):
    make_user()
    known = client.post(FORGOT, json={"email": "cliente@example.com"})
    unknown = client.post(FORGOT, json={"email": "nadie@example.com"})
    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json()
    assert len(outbox) == 1


def test_forgot_inactive_user_sends_nothing(client, make_user, outbox):
    make_user(is_active=False)
    assert client.post(FORGOT, json={"email": "cliente@example.com"}).status_code == 202
    assert outbox == []


def test_forgot_invalid_email_is_422(client, outbox):
    assert client.post(FORGOT, json={"email": "no-es-email"}).status_code == 422


def test_token_is_stored_hashed(client, make_user, outbox, db):
    make_user()
    client.post(FORGOT, json={"email": "cliente@example.com"})
    token = token_from(outbox)
    stored = db.scalars(select(PasswordResetToken)).all()
    assert len(stored) == 1
    assert stored[0].token_hash != token
    assert token not in stored[0].token_hash and len(stored[0].token_hash) == 64


def test_reset_changes_password_and_consumes_token(client, make_user, outbox):
    make_user()
    client.post(FORGOT, json={"email": "cliente@example.com"})
    token = token_from(outbox)
    assert client.post(RESET, json={"token": token, "password": NEW_PASSWORD}).status_code == 204
    assert can_login(NEW_PASSWORD)
    assert not can_login(CLIENT_PASSWORD)
    again = client.post(RESET, json={"token": token, "password": "Otra1234!xx"})
    assert again.status_code == 400
    assert not can_login("Otra1234!xx")


def test_expired_token_is_rejected(client, make_user, outbox, db):
    make_user()
    client.post(FORGOT, json={"email": "cliente@example.com"})
    record = db.scalars(select(PasswordResetToken)).one()
    record.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db.commit()
    response = client.post(RESET, json={"token": token_from(outbox), "password": NEW_PASSWORD})
    assert response.status_code == 400
    assert can_login(CLIENT_PASSWORD)


def test_new_request_invalidates_previous_token(client, make_user, outbox):
    make_user()
    client.post(FORGOT, json={"email": "cliente@example.com"})
    client.post(FORGOT, json={"email": "cliente@example.com"})
    first, second = token_from(outbox, 0), token_from(outbox, 1)
    assert client.post(RESET, json={"token": first, "password": NEW_PASSWORD}).status_code == 400
    assert client.post(RESET, json={"token": second, "password": NEW_PASSWORD}).status_code == 204


def test_invalid_token_is_400(client):
    response = client.post(RESET, json={"token": "inexistente", "password": NEW_PASSWORD})
    assert response.status_code == 400
    assert isinstance(response.json()["detail"], str)


def test_weak_password_is_422_and_token_survives(client, make_user, outbox):
    make_user()
    client.post(FORGOT, json={"email": "cliente@example.com"})
    token = token_from(outbox)
    assert client.post(RESET, json={"token": token, "password": "debil"}).status_code == 422
    assert client.post(RESET, json={"token": token, "password": NEW_PASSWORD}).status_code == 204


def test_smtp_failure_still_returns_202(client, make_user, monkeypatch, caplog):
    make_user()

    class Broken:
        def __init__(self, *args, **kwargs):
            raise ConnectionRefusedError

    monkeypatch.setattr(email_module.smtplib, "SMTP", Broken)
    response = client.post(FORGOT, json={"email": "cliente@example.com"})
    assert response.status_code == 202
    assert "No se pudo enviar el email" in caplog.text
    assert "token=" not in caplog.text


def test_send_email_uses_smtp_and_builds_message(monkeypatch, settings):
    sent = []

    class FakeSMTP:
        def __init__(self, host, port, timeout):
            sent.append(("connect", host, port))

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def send_message(self, message):
            sent.append(("message", message))

    monkeypatch.setattr(smtplib, "SMTP", FakeSMTP)
    send_email("a@example.com", "Asunto", "Cuerpo")
    assert sent[0] == ("connect", settings.smtp_host, settings.smtp_port)
    message = sent[1][1]
    assert message["To"] == "a@example.com" and message["From"] == settings.smtp_from
    assert message["Subject"] == "Asunto"
    assert build_message("b@example.com", "S", "B", "x@y.z")["To"] == "b@example.com"
