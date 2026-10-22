import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.email import Mailer
from app.core.security import hash_password
from app.modules.auth.models import PasswordResetToken
from app.modules.users import service as users_service
from app.modules.users.models import User


class InvalidResetToken(Exception):
    pass


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_reset_token(db: Session, user: User) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
        .values(used_at=now)
    )
    token = secrets.token_urlsafe(32)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(token),
            expires_at=now + timedelta(minutes=settings.password_reset_expire_minutes),
        )
    )
    db.commit()
    return token


def build_reset_email(token: str) -> tuple[str, str]:
    settings = get_settings()
    link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
    body = (
        "Hola,\n\n"
        "Hemos recibido una solicitud para restablecer tu password de QuickShop.\n"
        f"Usa este enlace (valido durante {settings.password_reset_expire_minutes} minutos "
        f"y de un solo uso):\n\n{link}\n\n"
        "Si no lo solicitaste, ignora este mensaje.\n"
    )
    return "Recuperacion de password de QuickShop", body


def request_reset(db: Session, email: str) -> tuple[str, str, str] | None:
    user = users_service.get_by_email(db, email)
    if user is None or not user.is_active:
        return None
    subject, body = build_reset_email(create_reset_token(db, user))
    return user.email, subject, body


def send_reset_email(mailer: Mailer, to: str, subject: str, body: str) -> None:
    mailer(to, subject, body)


def reset_password(db: Session, token: str, new_password: str) -> None:
    record = db.scalar(
        select(PasswordResetToken)
        .where(PasswordResetToken.token_hash == _hash_token(token))
        .with_for_update()
    )
    now = datetime.now(UTC)
    if record is None or record.used_at is not None or record.expires_at <= now:
        raise InvalidResetToken
    user = users_service.get_by_id(db, record.user_id)
    if user is None or not user.is_active:
        raise InvalidResetToken
    user.password_hash = hash_password(new_password)
    record.used_at = now
    db.commit()
