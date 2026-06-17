from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.domain import Inventory, Booking, FinancialLedger, StaffUser
from app.schemas.domain import InventoryOut, InventoryCreate, BookingCreate

router = APIRouter()

@router.get("/inventory", response_model=list[InventoryOut])
async def get_inventory(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Inventory))
    return result.scalars().all()

@router.post("/inventory", response_model=InventoryOut)
async def create_inventory(dress_in: InventoryCreate, db: AsyncSession = Depends(get_db)):
    # The try/except mask has been removed. 
    # If this fails now, it will print the EXACT database error in your terminal!
    new_dress = Inventory(
        name=dress_in.name,
        sku=dress_in.sku,
        category=dress_in.category,
        base_rental_price=dress_in.base_rental_price,
        image_url=dress_in.image_url
    )
    db.add(new_dress)
    await db.commit()
    await db.refresh(new_dress)
    return new_dress

@router.post("/bookings")
async def create_booking(booking_in: BookingCreate, db: AsyncSession = Depends(get_db)):
    # 1. Grab a dummy user to satisfy the foreign key
    staff_result = await db.execute(select(StaffUser).limit(1))
    staff = staff_result.scalars().first()
    if not staff:
        staff = StaffUser(name="Admin User", username="admin", password_hash="hash")
        db.add(staff)
        await db.flush()
        
    # 2. Save the Booking
    new_booking = Booking(
        dress_id=booking_in.dress_id,
        customer_name=booking_in.customer_name,
        customer_phone=booking_in.customer_phone,
        start_date=booking_in.start_date,
        end_date=booking_in.end_date,
        date_range=func.daterange(booking_in.start_date, booking_in.end_date, '[]'),
        created_by=staff.id
    )
    db.add(new_booking)
    await db.flush() 
    
    # 3. Save the Financial Ledger
    remaining = booking_in.total_amount - booking_in.advance_paid
    payment_status = "settled" if remaining <= 0 else "partial" if booking_in.advance_paid > 0 else "unpaid"
    
    ledger = FinancialLedger(
        booking_id=new_booking.id,
        total_amount=booking_in.total_amount,
        advance_paid=booking_in.advance_paid,
        remaining_balance=remaining,
        payment_status=payment_status
    )
    db.add(ledger)
    await db.commit()
    
    return {"status": "success", "message": "Booking saved to Neon Database!"}