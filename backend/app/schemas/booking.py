from uuid import UUID
from decimal import Decimal
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class BookingCreate(BaseModel):
    dress_id: UUID
    customer_name: str
    customer_phone: str
    start_date: date
    end_date: date
    total_amount: Decimal
    advance_paid: Decimal = Decimal("0")


class LedgerOut(BaseModel):
    total_amount: Decimal
    advance_paid: Decimal
    remaining_balance: Decimal
    payment_status: str

    model_config = {"from_attributes": True}


class BookingOut(BaseModel):
    id: UUID
    dress_id: UUID
    customer_name: str
    customer_phone: str
    start_date: date
    end_date: date
    status: str
    created_at: datetime
    ledger: Optional[LedgerOut] = None
    dress_name: Optional[str] = None
    dress_sku: Optional[str] = None

    model_config = {"from_attributes": True}