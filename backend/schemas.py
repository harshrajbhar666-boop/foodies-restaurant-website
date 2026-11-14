"""Pydantic request/response schemas for the orders API."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OrderItemIn(BaseModel):
    dish_id: str | None = Field(default=None, max_length=64)
    name: str = Field(min_length=1, max_length=160)
    price: float = Field(ge=0)
    quantity: int = Field(ge=1, le=99)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=6, max_length=20)
    address: str | None = Field(default=None, max_length=400)
    order_type: Literal["delivery", "pickup"] = "delivery"
    notes: str | None = Field(default=None, max_length=400)
    items: list[OrderItemIn] = Field(min_length=1)

    @field_validator("customer_name", "phone")
    @classmethod
    def _strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("phone")
    @classmethod
    def _digits_only(cls, value: str) -> str:
        cleaned = value.strip().replace(" ", "").replace("-", "")
        if not cleaned.lstrip("+").isdigit():
            raise ValueError("phone must contain digits only")
        return cleaned


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dish_id: str | None = None
    name: str
    price: float
    quantity: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_name: str
    phone: str
    address: str | None = None
    order_type: str
    notes: str | None = None
    total: float
    status: str
    created_at: datetime
    items: list[OrderItemOut] = []


class StatusUpdate(BaseModel):
    status: Literal["pending", "preparing", "out_for_delivery", "completed", "cancelled"]
