from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.deps import COOKIE_NAME, get_current_user
from app.core.security import burn_password_check, create_access_token, verify_password
from app.db.session import get_db
from app.modules.auth.schemas import LoginRequest, LoginResponse, RegisterRequest
from app.modules.users import service as users_service
from app.modules.users.models import User
from app.modules.users.schemas import UserBrief

router = APIRouter(prefix="/auth", tags=["auth"])

INVALID_CREDENTIALS = "Credenciales invalidas"


@router.post("/register", response_model=UserBrief, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> User:
    try:
        return users_service.create_user(db, data.email, data.password, data.full_name)
    except users_service.EmailAlreadyRegistered:
        raise HTTPException(status.HTTP_409_CONFLICT, "El email ya esta registrado") from None


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)) -> LoginResponse:
    settings = get_settings()
    user = users_service.get_by_email(db, data.email)
    if user is None:
        burn_password_check(data.password)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_CREDENTIALS) from None
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, INVALID_CREDENTIALS) from None
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuario inactivo") from None

    token = create_access_token(user.id, user.role.value)
    expires_in = settings.access_token_expire_minutes * 60
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=expires_in,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )
    return LoginResponse(
        access_token=token, expires_in=expires_in, user=UserBrief.model_validate(user)
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, _: User = Depends(get_current_user)) -> Response:
    settings = get_settings()
    response.delete_cookie(
        COOKIE_NAME, httponly=True, samesite="lax", secure=settings.cookie_secure, path="/"
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserBrief)
def me(user: User = Depends(get_current_user)) -> User:
    return user
