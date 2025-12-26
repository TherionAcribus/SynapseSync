"""create events table

Revision ID: 0001_create_events
Revises: 
Create Date: 2025-12-25

"""

from alembic import op
import sqlalchemy as sa


revision = "0001_create_events"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("module_id", sa.String(length=100), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("summary_text", sa.Text(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
    )

    op.create_index("ix_events_timestamp", "events", ["timestamp"])
    op.create_index("ix_events_module_id", "events", ["module_id"])
    op.create_index("ix_events_module_id_timestamp", "events", ["module_id", "timestamp"])


def downgrade() -> None:
    op.drop_index("ix_events_module_id_timestamp", table_name="events")
    op.drop_index("ix_events_module_id", table_name="events")
    op.drop_index("ix_events_timestamp", table_name="events")
    op.drop_table("events")
