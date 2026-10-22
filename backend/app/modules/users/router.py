from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.core.schemas import Page
from app.db.session import get_db
from app.modules.users import service
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import UserDetail, UserListItem, UserProfile, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
def read_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserProfile)
def update_me(
    data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> User:
    try:
        return service.update_profile(db, user, data)
    except service.InvalidCurrentPassword:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "La password actual es incorrecta"
        ) from None


@router.get("", response_model=Page[UserListItem])
def list_users(
    role: UserRole | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
) -> Page[UserListItem]:
    items, total = service.list_users(db, role, page, page_size)
    return Page(
        items=[UserListItem.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{user_id}", response_model=UserDetail)
def read_user(
    user_id: int,
    _: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
) -> User:
    user = service.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado") from None
    return user
