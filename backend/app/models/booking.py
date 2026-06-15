import enum
import uuid
from datetime import datetime, date

from sqlalchemy import String, Enum, Date, DateTime, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, DATERANGE, ExcludeConstraint
from sqlalchemy.dialects.postgresql import ranges

from app.db.session import Base


class BookingStatus(str, enum.Enum):
    RESERVED = "reserved"
    PICKED_UP = "picked_up"
    RETURNED = "returned"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dress_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inventory.id", ondelete="CASCADE"), nullable=False, index=True
    )
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Generated column: start_date to (end_date + buffer), used for overlap exclusion.
    # Populated via trigger/migration default; queried directly for availability checks.
    date_range: Mapped[object] = mapped_column(
        DATERANGE, nullable=False
    )

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status"),
        nullable=False,
        default=BookingStatus.RESERVED,
        index=True,
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("staff_users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        # GIST index for fast overlap queries (&& operator)
        Index("ix_bookings_dress_daterange", "dress_id", "date_range", postgresql_using="gist"),
    )
