"""create module_configs table

Revision ID: 0003_create_module_configs
Revises: 0002_create_dashboards
Create Date: 2025-12-26

"""

from alembic import op
import sqlalchemy as sa


revision = "0003_create_module_configs"
down_revision = "0002_create_dashboards"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "module_configs",
        sa.Column("module_id", sa.String(length=100), primary_key=True),
        sa.Column("config_json", sa.JSON(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("module_configs")
