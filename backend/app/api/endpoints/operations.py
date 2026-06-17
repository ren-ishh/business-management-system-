from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.inventory import Dress          # ← correct
from app.models.booking import Booking          # ← correct
from app.models.financial_ledger import FinancialLedger  # ← correct
from app.models.user import StaffUser           # ← correct
from app.schemas.inventory import DressOut, DressCreate  # ← correct

router = APIRouter()

# Bookings endpoint (inventory now handled by routers/inventory.py)
# from app.schemas.booking import BookingCreate   # Part 2 will add this schema
#
# @router.post("/bookings")
# async def create_booking(booking_in: BookingCreate, db: AsyncSession = Depends(get_db)):
#     staff_result = await db.execute(select(StaffUser).limit(1))
#     staff = staff_result.scalars().first()
#     if not staff:
#         raise HTTPException(status_code=400, detail="No staff users found. Seed the DB first.")
#
#     new_booking = Booking(
#         dress_id=booking_in.dress_id,
#         customer_name=booking_in.customer_name,
#         customer_phone=booking_in.customer_phone,
#         start_date=booking_in.start_date,
#         end_date=booking_in.end_date,
#         date_range=func.daterange(booking_in.start_date, booking_in.end_date, '[]'),
#         created_by=staff.id
#     )
#     db.add(new_booking)
#     await db.flush()
#
#     remaining = booking_in.total_amount - booking_in.advance_paid
#     payment_status = "settled" if remaining <= 0 else "partial" if booking_in.advance_paid > 0 else "unpaid"
#
#     ledger = FinancialLedger(
#         booking_id=new_booking.id,
#         total_amount=booking_in.total_amount,
#         advance_paid=booking_in.advance_paid,
#         remaining_balance=remaining,
#         payment_status=payment_status
#     )
#     db.add(ledger)
#     await db.commit()
#     return {"status": "success", "booking_id": str(new_booking.id)}