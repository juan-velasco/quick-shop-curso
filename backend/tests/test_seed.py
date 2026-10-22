import json

from sqlalchemy import func, select

from app.core.security import verify_password
from app.db.seed import run_seed
from app.modules.products.models import Product
from app.modules.users.models import User, UserRole


def test_seed_creates_users_and_products(db, settings):
    run_seed(db, settings)
    users = db.scalars(select(User).order_by(User.id)).all()
    assert [u.role for u in users].count(UserRole.admin) == 1
    assert [u.role for u in users].count(UserRole.cliente) == 2
    admin = next(u for u in users if u.role == UserRole.admin)
    assert admin.email == settings.seed_admin_email
    assert verify_password(settings.seed_admin_password, admin.password_hash)

    expected = json.loads(open(settings.seed_products_file, encoding="utf-8").read())
    products = db.scalars(select(Product).order_by(Product.id)).all()
    assert len(products) == len(expected) == 20
    for product, row in zip(products, expected, strict=True):
        assert product.name == row["producto"]
        assert product.description == row["descripcion"]
        assert str(product.price) == row["precio"]
        assert product.stock == row["stock"]
        assert product.image_url == row["imagen"]


def test_seed_is_idempotent_and_keeps_passwords(db, settings):
    run_seed(db, settings)
    before = {u.email: u.password_hash for u in db.scalars(select(User))}
    run_seed(db, settings)
    after = {u.email: u.password_hash for u in db.scalars(select(User))}
    assert before == after
    assert db.scalar(select(func.count()).select_from(Product)) == 20


def test_seed_does_not_touch_existing_data(db, settings, make_user):
    make_user("solo@example.com")
    run_seed(db, settings)
    assert db.scalar(select(func.count()).select_from(User)) == 1
    assert db.scalar(select(func.count()).select_from(Product)) == 20
