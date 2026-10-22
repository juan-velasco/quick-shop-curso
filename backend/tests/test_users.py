from fastapi.testclient import TestClient

from app.main import app
from app.modules.users.models import UserRole
from tests.conftest import CLIENT_PASSWORD, login

ME = "/api/v1/users/me"


def test_all_endpoints_require_session(client):
    assert client.get(ME).status_code == 401
    assert client.patch(ME, json={"full_name": "X"}).status_code == 401
    assert client.get("/api/v1/users/1").status_code == 401


def test_get_me_never_returns_hash(client_session):
    response = client_session.get(ME)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"id", "email", "full_name", "role", "created_at"}


def test_patch_full_name(client_session):
    response = client_session.patch(ME, json={"full_name": "Nuevo Nombre"})
    assert response.status_code == 200
    assert response.json()["full_name"] == "Nuevo Nombre"
    assert client_session.get(ME).json()["full_name"] == "Nuevo Nombre"


def test_change_password_with_current_password(client_session):
    response = client_session.patch(
        ME, json={"password": "Otra1234!x", "current_password": CLIENT_PASSWORD}
    )
    assert response.status_code == 200
    fresh = TestClient(app)
    assert (
        fresh.post(
            "/api/v1/auth/login", json={"email": "cliente@example.com", "password": CLIENT_PASSWORD}
        ).status_code
        == 401
    )
    login(fresh, "cliente@example.com", "Otra1234!x")


def test_change_password_requires_correct_current_password(client_session):
    for payload in (
        {"password": "Otra1234!x"},
        {"password": "Otra1234!x", "current_password": "Wrong1234!"},
    ):
        assert client_session.patch(ME, json=payload).status_code == 400
    login(TestClient(app), "cliente@example.com", CLIENT_PASSWORD)


def test_new_password_must_meet_policy(client_session):
    response = client_session.patch(
        ME, json={"password": "weak", "current_password": CLIENT_PASSWORD}
    )
    assert response.status_code == 422


def test_cannot_change_role_active_or_email(client_session):
    for payload in ({"role": "admin"}, {"is_active": False}, {"email": "otro@example.com"}):
        assert client_session.patch(ME, json=payload).status_code == 422
    assert client_session.get(ME).json()["role"] == "cliente"


def test_list_users_as_admin_filters_and_paginates(admin_session, make_user):
    for index in range(3):
        make_user(f"c{index}@example.com")
    response = admin_session.get("/api/v1/users", params={"role": "cliente", "page_size": 2})
    body = response.json()
    assert response.status_code == 200
    assert body["total"] == 3 and body["page"] == 1 and body["page_size"] == 2
    assert len(body["items"]) == 2
    assert all(item["role"] == "cliente" for item in body["items"])
    assert "password_hash" not in body["items"][0]
    assert set(body["items"][0]) == {"id", "email", "full_name", "role", "is_active", "created_at"}


def test_list_users_page_size_limit(admin_session):
    assert admin_session.get("/api/v1/users", params={"page_size": 101}).status_code == 422


def test_list_users_forbidden_for_client(client_session):
    assert client_session.get("/api/v1/users").status_code == 403
    assert client_session.get("/api/v1/users/1").status_code == 403


def test_get_user_by_id_as_admin(admin_session, make_user):
    user = make_user("otro@example.com")
    response = admin_session.get(f"/api/v1/users/{user.id}")
    assert response.status_code == 200
    assert response.json()["email"] == "otro@example.com"
    assert admin_session.get("/api/v1/users/9999").status_code == 404


def test_admin_role_filter_returns_admins(admin_session):
    body = admin_session.get("/api/v1/users", params={"role": UserRole.admin.value}).json()
    assert body["total"] == 1
