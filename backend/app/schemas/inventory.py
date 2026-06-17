from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DressBase(BaseModel):
    name: str
    sku: str
    category: str
    base_rental_price: Decimal
    image_url: Optional[str] = None


class DressCreate(DressBase):
    pass


class DressUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    base_rental_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    status: Optional[str] = None  # "active" | "retired"


class DressOut(DressBase):
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}