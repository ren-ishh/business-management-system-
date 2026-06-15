import enum
import uuid
from datetime import datetime

from sqlalchemy import String, Enum, Numeric, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class DressStatus(str, enum.Enum):
    ACTIVE = "active"
    RETIRED = "retired"


class Dress(Base):
    __tablename__ = "inventory"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    sku: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    base_rental_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[DressStatus] = mapped_column(
        Enum(DressStatus, name="dress_status"), nullable=False, default=DressStatus.ACTIVE
    )
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
