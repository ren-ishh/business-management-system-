"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Break the transaction to allow EXTENSION creation
    op.execute("COMMIT")
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.execute("BEGIN")

    # 2. Full Bulldozer: Drop everything to clear the runway completely
    op.execute("DROP TABLE IF EXISTS financial_ledger CASCADE")
    op.execute("DROP TABLE IF EXISTS bookings CASCADE")
    op.execute("DROP TABLE IF EXISTS inventory CASCADE")
    op.execute("DROP TABLE IF EXISTS staff_users CASCADE")
    
    op.execute("DROP TYPE IF EXISTS user_role CASCADE")
    op.execute("DROP TYPE IF EXISTS dress_status CASCADE")
    op.execute("DROP TYPE IF EXISTS booking_status CASCADE")
    op.execute("DROP TYPE IF EXISTS payment_status CASCADE")

    # 3. Define Enums
    user_role = postgresql.ENUM("admin", "staff", name="user_role")
    dress_status = postgresql.ENUM("active", "retired", name="dress_status")
    booking_status = postgresql.ENUM(
        "reserved", "picked_up", "returned", "overdue", "cancelled", name="booking_status"
    )
    payment_status = postgresql.ENUM("unpaid", "partial", "settled", name="payment_status")

    # Note: We do NOT call .create() manually here! 
    # Alembic's op.create_table will automatically create the ENUMs for us.

    # --- staff_users ---
    op.create_table(
        "staff_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("username", sa.String(60), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="staff"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_staff_users_username", "staff_users", ["username"])

    # --- inventory ---
    op.create_table(
        "inventory",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("sku", sa.String(60), nullable=False, unique=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("category", sa.String(80), nullable=False),
        sa.Column("base_rental_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", dress_status, nullable=False, server_default="active"),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_inventory_sku", "inventory", ["sku"])
    op.create_index("ix_inventory_category", "inventory", ["category"])

    # --- bookings ---
    op.create_table(
        "bookings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "dress_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("inventory.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("customer_name", sa.String(150), nullable=False),
        sa.Column("customer_phone", sa.String(20), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=False),
        sa.Column("date_range", postgresql.DATERANGE, nullable=False),
        sa.Column("status", booking_status, nullable=False, server_default="reserved"),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("staff_users.id"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_bookings_dress_id", "bookings", ["dress_id"])
    op.create_index("ix_bookings_customer_phone", "bookings", ["customer_phone"])
    op.create_index("ix_bookings_status", "bookings", ["status"])
    op.create_index(
        "ix_bookings_dress_daterange", "bookings", ["dress_id", "date_range"], postgresql_using="gist"
    )

    op.execute(
        """
        ALTER TABLE bookings
        ADD CONSTRAINT no_overlapping_bookings
        EXCLUDE USING gist (
            dress_id WITH =,
            date_range WITH &&
        )
        WHERE (status IN ('reserved', 'picked_up', 'overdue'))
        """
    )

    # --- financial_ledger ---
    op.create_table(
        "financial_ledger",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "booking_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bookings.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("advance_paid", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("remaining_balance", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_status", payment_status, nullable=False, server_default="unpaid"),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_financial_ledger_booking_id", "financial_ledger", ["booking_id"])
    op.create_index("ix_financial_ledger_payment_status", "financial_ledger", ["payment_status"])


def downgrade() -> None:
    op.drop_table("financial_ledger")
    op.execute("ALTER TABLE bookings DROP CONSTRAINT no_overlapping_bookings")
    op.drop_table("bookings")
    op.drop_table("inventory")
    op.drop_table("staff_users")

    for enum_name in ("payment_status", "booking_status", "dress_status", "user_role"):
        op.execute(f"DROP TYPE IF EXISTS {enum_name} CASCADE")