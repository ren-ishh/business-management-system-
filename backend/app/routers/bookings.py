from uuid import UUID
from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.booking import Booking, BookingStatus
from app.models.financial_ledger import FinancialLedger
from app.models.inventory import Dress
from app.models.user import StaffUser
from app.schemas.booking import BookingCreate, BookingOut

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingOut])
async def list_bookings(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Booking)
        .options(selectinload(Booking.ledger), selectinload(Booking.dress))
        .order_by(Booking.created_at.desc())
    )
    if status:
        try:
            q = q.where(Booking.status == BookingStatus(status))
        except ValueError:
            raise HTTPException(400, detail=f"Invalid status '{status}'")

    result = await db.execute(q)
    bookings = result.scalars().all()

    # Flatten dress info onto response
    out = []
    for b in bookings:
        d = BookingOut(
            id=b.id,
            dress_id=b.dress_id,
            customer_name=b.customer_name,
            customer_phone=b.customer_phone,
            start_date=b.start_date,
            end_date=b.end_date,
            status=b.status.value,
            created_at=b.created_at,
            ledger=b.ledger if b.ledger else None,
            dress_name=b.dress.name if b.dress else None,
            dress_sku=b.dress.sku if b.dress else None,
        )
        out.append(d)
    return out


@router.post("", status_code=201)
async def create_booking(
    body: BookingCreate,
    db: AsyncSession = Depends(get_db),
):
    # Need a staff user for created_by FK
    staff_result = await db.execute(select(StaffUser).limit(1))
    staff = staff_result.scalars().first()
    if not staff:
        import uuid as _uuid
        staff = StaffUser(
            id=_uuid.uuid4(),
            name="System",
            username="system",
            password_hash="__system__",
        )
        db.add(staff)
        await db.flush()

    # Verify dress exists
    dress = await db.get(Dress, body.dress_id)
    if not dress:
        raise HTTPException(404, detail="Dress not found")

    new_booking = Booking(
        dress_id=body.dress_id,
        customer_name=body.customer_name,
        customer_phone=body.customer_phone,
        start_date=body.start_date,
        end_date=body.end_date,
        date_range=func.daterange(
            str(body.start_date), str(body.end_date), "[]"
        ),
        created_by=staff.id,
    )
    db.add(new_booking)
    await db.flush()

    remaining = body.total_amount - body.advance_paid
    if remaining < 0:
        remaining = 0
    pstatus = (
        "settled" if remaining == 0
        else "partial" if body.advance_paid > 0
        else "unpaid"
    )

    ledger = FinancialLedger(
        booking_id=new_booking.id,
        total_amount=body.total_amount,
        advance_paid=body.advance_paid,
        remaining_balance=remaining,
        payment_status=pstatus,
    )
    db.add(ledger)
    await db.commit()

    return {
        "status": "success",
        "booking_id": str(new_booking.id),
        "payment_status": pstatus,
    }


@router.patch("/{booking_id}/status")
async def update_booking_status(
    booking_id: UUID,
    new_status: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, detail="Booking not found")
    try:
        booking.status = BookingStatus(new_status)
    except ValueError:
        raise HTTPException(400, detail=f"Invalid status '{new_status}'")
    await db.commit()
    return {"status": "updated", "new_status": new_status}