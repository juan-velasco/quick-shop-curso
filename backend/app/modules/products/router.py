from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_optional_user, require_role
from app.core.schemas import Page
from app.db.session import get_db
from app.modules.products import service
from app.modules.products.models import Product
from app.modules.products.schemas import (
    ProductCreate,
    ProductOut,
    ProductPatch,
)
from app.modules.users.models import User, UserRole

router = APIRouter(prefix="/products", tags=["products"])

NOT_FOUND = "Producto no encontrado"
NAME_TAKEN = "Ya existe un producto con ese nombre"


def _is_admin(user: User | None) -> bool:
    return user is not None and user.role == UserRole.admin


def _get_or_404(db: Session, product_id: int) -> Product:
    product = service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, NOT_FOUND) from None
    return product


@router.get("", response_model=Page[ProductOut])
def list_products(
    q: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    include_inactive: bool = False,
    user: User | None = Depends(get_optional_user),
    db: Session = Depends(get_db),
) -> Page[ProductOut]:
    items, total = service.list_products(
        db, q, page, page_size, include_inactive and _is_admin(user)
    )
    return Page(
        items=[ProductOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{product_id}", response_model=ProductOut)
def read_product(
    product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Product:
    product = _get_or_404(db, product_id)
    if not product.is_active and not _is_admin(user):
        raise HTTPException(status.HTTP_404_NOT_FOUND, NOT_FOUND) from None
    return product


@router.post(
    "",
    response_model=ProductOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.admin))],
)
def create_product(data: ProductCreate, db: Session = Depends(get_db)) -> Product:
    try:
        return service.create_product(db, data)
    except service.ProductNameTaken:
        raise HTTPException(status.HTTP_409_CONFLICT, NAME_TAKEN) from None


@router.put(
    "/{product_id}",
    response_model=ProductOut,
    dependencies=[Depends(require_role(UserRole.admin))],
)
def replace_product(product_id: int, data: ProductCreate, db: Session = Depends(get_db)) -> Product:
    product = _get_or_404(db, product_id)
    try:
        return service.update_product(db, product, data)
    except service.ProductNameTaken:
        raise HTTPException(status.HTTP_409_CONFLICT, NAME_TAKEN) from None


@router.patch(
    "/{product_id}",
    response_model=ProductOut,
    dependencies=[Depends(require_role(UserRole.admin))],
)
def patch_product(product_id: int, data: ProductPatch, db: Session = Depends(get_db)) -> Product:
    product = _get_or_404(db, product_id)
    try:
        return service.update_product(db, product, data)
    except service.ProductNameTaken:
        raise HTTPException(status.HTTP_409_CONFLICT, NAME_TAKEN) from None


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.admin))],
)
def delete_product(product_id: int, db: Session = Depends(get_db)) -> Response:
    service.deactivate_product(db, _get_or_404(db, product_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
