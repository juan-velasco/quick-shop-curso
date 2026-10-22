from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import UserUpdate


class InvalidCurrentPassword(Exception):
    pass


class EmailAlreadyRegistered(Exception):
    pass


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create_user(
    db: Session, email: str, password: str, full_name: str, role: UserRole = UserRole.cliente
) -> User:
    if get_by_email(db, email) is not None:
        raise EmailAlreadyRegistered
    user = User(
        email=normalize_email(email),
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
    )
    db.add(user)
    db.commit()
    return user


def update_profile(db: Session, user: User, data: UserUpdate) -> User:
    if data.password is not None:
        if data.current_password is None or not verify_password(
            data.current_password, user.password_hash
        ):
            raise InvalidCurrentPassword
        user.password_hash = hash_password(data.password)
    if data.full_name is not None:
        user.full_name = data.full_name
    db.commit()
    return user


def list_users(
    db: Session, role: UserRole | None, page: int, page_size: int
) -> tuple[list[User], int]:
    query = select(User)
    count_query = select(func.count()).select_from(User)
    if role is not None:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    items = db.scalars(
        query.order_by(User.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return list(items), db.scalar(count_query) or 0
