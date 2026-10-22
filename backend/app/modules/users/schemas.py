from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

from app.core.validators import validate_password_policy
from app.modules.users.models import UserRole

Password = Annotated[str, AfterValidator(validate_password_policy)]


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole


class UserProfile(UserBrief):
    created_at: datetime


class UserDetail(UserProfile):
    is_active: bool


class UserListItem(UserDetail):
    pass


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    password: Password | None = None
    current_password: str | None = None
