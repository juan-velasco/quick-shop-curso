from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import create_access_token
from app.main import app
from app.modules.users.models import User, UserRole
from tests.conftest import CLIENT_PASSWORD, login

REGISTER = "/api/v1/auth/register"
LOGIN = "/api/v1/auth/login"
VALID = {"email": "nuevo@example.com", "password": "Nuevo1234!", "full_name": "Nuevo Usuario"}


def test_register_creates_cliente(client, db):
    response = client.post(REGISTER, json=VALID)
    assert response.status_code == 201
    body = response.json()
    assert body["role"] == "cliente"
    assert body["email"] == "nuevo@example.com"
    assert "password" not in body and "password_hash" not in body
    stored = db.scalar(select(User).where(User.email == "nuevo@example.com"))
    assert stored.password_hash.startswith("$2")


def test_register_ignores_role_escalation(client, db):
    response = client.post(REGISTER, json={**VALID, "role": "admin"})
    assert response.status_code == 201
    assert response.json()["role"] == "cliente"


def test_register_duplicate_email_case_insensitive(client, make_user):
    make_user("Ana@Example.com")
    response = client.post(REGISTER, json={**VALID, "email": "ana@example.com"})
    assert response.status_code == 409
    assert "detail" in response.json()


def test_register_validation(client):
    for bad in (
        {**VALID, "password": "short1!"},
        {**VALID, "password": "alllowercase1!"},
        {**VALID, "password": "NoSymbol1234"},
        {**VALID, "email": "not-an-email"},
        {**VALID, "full_name": ""},
    ):
        response = client.post(REGISTER, json=bad)
        assert response.status_code == 422
        assert isinstance(response.json()["detail"], str)


def test_login_sets_httponly_cookie_and_token(client, make_user):
    make_user("cliente@example.com")
    response = client.post(
        LOGIN, json={"email": "cliente@example.com", "password": CLIENT_PASSWORD}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 7200
    assert body["user"]["role"] == "cliente"
    cookie = response.headers["set-cookie"].lower()
    assert "access_token=" in cookie and "httponly" in cookie and "samesite=lax" in cookie
    assert "secure" not in cookie
    from app.core.security import decode_access_token

    payload = decode_access_token(body["access_token"])
    assert payload["exp"] - payload["iat"] == 7200


def test_login_wrong_credentials_are_indistinguishable(client, make_user):
    make_user("cliente@example.com")
    wrong_password = client.post(
        LOGIN, json={"email": "cliente@example.com", "password": "Wrong1234!"}
    )
    unknown_email = client.post(
        LOGIN, json={"email": "nadie@example.com", "password": "Wrong1234!"}
    )
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_login_inactive_user(client, make_user):
    make_user("inactivo@example.com", is_active=False)
    response = client.post(
        LOGIN, json={"email": "inactivo@example.com", "password": CLIENT_PASSWORD}
    )
    assert response.status_code == 403


def test_me_with_cookie_and_without(client_session):
    response = client_session.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "cliente@example.com"
    assert TestClient(app).get("/api/v1/auth/me").status_code == 401


def test_me_with_bearer_header(client, make_user):
    user = make_user()
    token = create_access_token(user.id, user.role.value)
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_expired_token_returns_401(client, make_user):
    user = make_user()
    token = create_access_token(user.id, "cliente", now=datetime.now(UTC) - timedelta(hours=3))
    for path in ("/api/v1/auth/me", "/api/v1/users/me"):
        response = client.get(path, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401


def test_tampered_token_returns_401(client, make_user):
    user = make_user()
    token = create_access_token(user.id, "cliente")
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token[:-3]}abc"})
    assert response.status_code == 401


def test_token_of_deactivated_user_is_rejected(client, make_user, db):
    user = make_user()
    token = create_access_token(user.id, "cliente")
    user.is_active = False
    db.commit()
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_logout_clears_cookie(client_session):
    response = client_session.post("/api/v1/auth/logout")
    assert response.status_code == 204
    assert (
        'access_token=""' in response.headers["set-cookie"]
        or "Max-Age=0" in response.headers["set-cookie"]
    )
    assert client_session.get("/api/v1/auth/me").status_code == 401


def test_logout_requires_session(client):
    assert client.post("/api/v1/auth/logout").status_code == 401


def test_role_enforcement(client, client_session, admin_session):
    assert client_session.get("/api/v1/users").status_code == 403
    assert client.get("/api/v1/users").status_code == 401
    assert admin_session.get("/api/v1/users").status_code == 200


def test_cors_allows_only_configured_origin(client):
    allowed = client.options(
        LOGIN,
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    denied = client.options(
        LOGIN,
        headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert allowed.headers.get("access-control-allow-credentials") == "true"
    assert "access-control-allow-origin" not in denied.headers


def test_admin_role_login(make_user):
    make_user("admin@example.com", UserRole.admin)
    session = login(TestClient(app), "admin@example.com", CLIENT_PASSWORD)
    assert session.get("/api/v1/auth/me").json()["role"] == "admin"
