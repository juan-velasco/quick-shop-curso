import json
from decimal import Decimal
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import hash_password
from app.modules.products.models import Product
from app.modules.users.models import User, UserRole


def seed_users(db: Session, settings: Settings) -> None:
    if db.scalar(select(func.count()).select_from(User)):
        return
    client_hash = hash_password(settings.seed_client_password)
    db.add_all(
        [
            User(
                email=settings.seed_admin_email.lower(),
                password_hash=hash_password(settings.seed_admin_password),
                full_name="Administrador",
                role=UserRole.admin,
            ),
            User(
                email=settings.seed_client1_email.lower(),
                password_hash=client_hash,
                full_name="Cliente Uno",
                role=UserRole.cliente,
            ),
            User(
                email=settings.seed_client2_email.lower(),
                password_hash=client_hash,
                full_name="Cliente Dos",
                role=UserRole.cliente,
            ),
        ]
    )
    db.commit()


def seed_products(db: Session, settings: Settings) -> None:
    if db.scalar(select(func.count()).select_from(Product)):
        return
    rows = json.loads(Path(settings.seed_products_file).read_text(encoding="utf-8"))
    db.add_all(
        Product(
            name=row["producto"],
            description=row["descripcion"],
            price=Decimal(row["precio"]),
            stock=row["stock"],
            image_url=row["imagen"],
        )
        for row in rows
    )
    db.commit()


def run_seed(db: Session, settings: Settings) -> None:
    seed_users(db, settings)
    seed_products(db, settings)
