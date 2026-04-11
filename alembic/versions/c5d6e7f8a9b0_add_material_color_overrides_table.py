"""add material color overrides table

Revision ID: c5d6e7f8a9b0
Revises: b1a2c3d4e5f6
Create Date: 2026-04-11 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, None] = 'b1a2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'material_color_overrides',
        sa.Column('override_id', sa.String(), nullable=False),
        sa.Column('drawing_id', sa.String(), nullable=False),
        sa.Column('material_group', sa.String(), nullable=False),
        sa.Column('color_hex', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['drawing_id'], ['drawings.drawing_id'], ),
        sa.PrimaryKeyConstraint('override_id'),
        sa.Index('ix_material_color_overrides_drawing_id', 'drawing_id'),
        sa.Index('ix_material_color_overrides_material_group', 'material_group'),
    )


def downgrade() -> None:
    op.drop_table('material_color_overrides')
