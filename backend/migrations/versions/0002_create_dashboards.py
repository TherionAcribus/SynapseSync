"""create dashboards table

Revision ID: 0002_create_dashboards
Revises: 0001_create_events
Create Date: 2025-12-25

"""

from alembic import op
import sqlalchemy as sa


revision = "0002_create_dashboards"
down_revision = "0001_create_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "dashboards",
        sa.Column("id", sa.String(length=100), primary_key=True),
        sa.Column("config_json", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("dashboards")
