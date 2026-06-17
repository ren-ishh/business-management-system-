from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.inventory import Dress, DressStatus
from app.schemas.inventory import DressCreate, DressUpdate, DressOut

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=list[DressOut])
async def list_dresses(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all dresses. Filter by category or status."""
    q = select(Dress)
    if category:
        q = q.where(Dress.category == category)
    if status:
        try:
            q = q.where(Dress.status == DressStatus(status))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status '{status}'. Use: active, retired")
    q = q.order_by(Dress.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=DressOut, status_code=201)
async def create_dress(
    body: DressCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a new dress to inventory."""
    # Check SKU unique
    existing = await db.execute(select(Dress).where(Dress.sku == body.sku))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"SKU '{body.sku}' already exists")

    dress = Dress(**body.model_dump())
    db.add(dress)
    await db.commit()
    await db.refresh(dress)
    return dress


@router.get("/{dress_id}", response_model=DressOut)
async def get_dress(dress_id: UUID, db: AsyncSession = Depends(get_db)):
    dress = await db.get(Dress, dress_id)
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")
    return dress


@router.patch("/{dress_id}", response_model=DressOut)
async def update_dress(
    dress_id: UUID,
    body: DressUpdate,
    db: AsyncSession = Depends(get_db),
):
    dress = await db.get(Dress, dress_id)
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(dress, field, value)

    await db.commit()
    await db.refresh(dress)
    return dress


@router.delete("/{dress_id}", status_code=204)
async def retire_dress(dress_id: UUID, db: AsyncSession = Depends(get_db)):
    """Soft-delete: marks dress as retired, not hard delete."""
    dress = await db.get(Dress, dress_id)
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")
    dress.status = DressStatus.RETIRED
    await db.commit()