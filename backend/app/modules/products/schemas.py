from decimal import Decimal
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator


def _format_price(value: Decimal) -> str:
    return f"{value:.2f}"


class ProductCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1)
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    stock: int = Field(ge=0)
    image_url: str = Field(min_length=1, max_length=500)
    is_active: bool = True


class ProductPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, min_length=1)
    price: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    stock: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, min_length=1, max_length=500)
    is_active: bool | None = None

    @model_validator(mode="after")
    def reject_nulls_and_empty(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("Debe indicar al menos un campo")
        for field in self.model_fields_set:
            if getattr(self, field) is None:
                raise ValueError(f"El campo {field} no admite null")
        return self


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    price: Decimal
    stock: int
    image_url: str
    is_active: bool

    @field_serializer("price")
    def serialize_price(self, value: Decimal) -> str:
        return _format_price(value)
