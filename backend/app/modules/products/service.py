from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.modules.products.models import Product
from app.modules.products.schemas import ProductCreate, ProductPatch


class ProductNameTaken(Exception):
    pass


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def list_products(
    db: Session, q: str | None, page: int, page_size: int, include_inactive: bool
) -> tuple[list[Product], int]:
    query = select(Product)
    count_query = select(func.count()).select_from(Product)
    if not include_inactive:
        query = query.where(Product.is_active.is_(True))
        count_query = count_query.where(Product.is_active.is_(True))
    if q:
        pattern = f"%{_escape_like(q.strip())}%"
        query = query.where(Product.name.ilike(pattern, escape="\\"))
        count_query = count_query.where(Product.name.ilike(pattern, escape="\\"))
    items = db.scalars(
        query.order_by(Product.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return list(items), db.scalar(count_query) or 0


def get_product(db: Session, product_id: int) -> Product | None:
    return db.get(Product, product_id)


def _name_in_use(db: Session, name: str, exclude_id: int | None = None) -> bool:
    query = select(Product.id).where(Product.name == name)
    if exclude_id is not None:
        query = query.where(Product.id != exclude_id)
    return db.scalar(query) is not None


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ProductNameTaken from None


def create_product(db: Session, data: ProductCreate) -> Product:
    if _name_in_use(db, data.name):
        raise ProductNameTaken
    product = Product(**data.model_dump())
    db.add(product)
    _commit(db)
    return product


def update_product(db: Session, product: Product, data: ProductCreate | ProductPatch) -> Product:
    values = data.model_dump(exclude_unset=True)
    if "name" in values and _name_in_use(db, values["name"], exclude_id=product.id):
        raise ProductNameTaken
    for field, value in values.items():
        setattr(product, field, value)
    _commit(db)
    return product


def deactivate_product(db: Session, product: Product) -> None:
    product.is_active = False
    db.commit()
