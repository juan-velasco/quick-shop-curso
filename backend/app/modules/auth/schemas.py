from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.users.schemas import Password, UserBrief


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    email: EmailStr
    password: Password
    full_name: str = Field(min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserBrief


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    detail: str = "Si el email existe, recibiras un enlace de recuperacion"


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    password: Password
