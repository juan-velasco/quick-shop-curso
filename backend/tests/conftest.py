import os
from collections.abc import Iterator
from pathlib import Path

import pytest

_test_db_url = os.environ.get("TEST_DATABASE_URL")
if not _test_db_url:
    raise RuntimeError("TEST_DATABASE_URL es obligatoria: apunta a un PostgreSQL de pruebas")

_ROOT = Path(__file__).resolve().parents[2]
os.environ["DATABASE_URL"] = _test_db_url
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-pytest-only-0123456789")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")
os.environ.setdefault("SMTP_HOST", "localhost")
os.environ.setdefault("SMTP_FROM", "no-reply@quickshop.local")
os.environ.setdefault("SEED_ADMIN_EMAIL", "admin@quickshop.com")
os.environ.setdefault("SEED_ADMIN_PASSWORD", "Admin1234!")
os.environ.setdefault("SEED_CLIENT1_EMAIL", "cliente1@quickshop.com")
os.environ.setdefault("SEED_CLIENT2_EMAIL", "cliente2@quickshop.com")
os.environ.setdefault("SEED_CLIENT_PASSWORD", "Cliente1234!")
os.environ.setdefault("SEED_PRODUCTS_FILE", str(_ROOT / "docs" / "products-images.json"))

from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from alembic import command  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.core.email import get_mailer  # noqa: E402
from app.db.session import get_engine, get_session_factory  # noqa: E402
from app.main import app  # noqa: E402
from app.modules.users import service as users_service  # noqa: E402
from app.modules.users.models import User, UserRole  # noqa: E402

CLIENT_PASSWORD = "Cliente1234!"
ADMIN_PASSWORD = "Admin1234!"


@pytest.fixture(scope="session", autouse=True)
def _schema() -> Iterator[None]:
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.downgrade(config, "base")
    command.upgrade(config, "head")
    yield


@pytest.fixture(autouse=True)
def _clean_db(_schema: None) -> Iterator[None]:
    yield
    with get_engine().begin() as connection:
        connection.execute(
            text("TRUNCATE users, products, password_reset_tokens RESTART IDENTITY CASCADE")
        )


@pytest.fixture
def settings():
    return get_settings()


@pytest.fixture
def db() -> Iterator[Session]:
    with get_session_factory()() as session:
        yield session


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def make_user(db: Session):
    def _make(
        email: str = "cliente@example.com",
        role: UserRole = UserRole.cliente,
        password: str = CLIENT_PASSWORD,
        full_name: str = "Cliente Test",
        is_active: bool = True,
    ) -> User:
        user = users_service.create_user(db, email, password, full_name, role)
        if not is_active:
            user.is_active = False
            db.commit()
        return user

    return _make


def login(client: TestClient, email: str, password: str) -> TestClient:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return client


@pytest.fixture
def client_session(make_user) -> TestClient:
    make_user()
    return login(TestClient(app), "cliente@example.com", CLIENT_PASSWORD)


@pytest.fixture
def admin_session(make_user) -> TestClient:
    make_user("admin@example.com", UserRole.admin, ADMIN_PASSWORD, "Admin Test")
    return login(TestClient(app), "admin@example.com", ADMIN_PASSWORD)


@pytest.fixture
def outbox() -> Iterator[list[tuple[str, str, str]]]:
    sent: list[tuple[str, str, str]] = []
    app.dependency_overrides[get_mailer] = lambda: (
        lambda to, subject, body: sent.append((to, subject, body))
    )
    yield sent
    app.dependency_overrides.pop(get_mailer, None)
