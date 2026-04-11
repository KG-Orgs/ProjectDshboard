"""add material type override color

Revision ID: b1a2c3d4e5f6
Revises: 693db3dbc8c7
Create Date: 2026-04-05 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1a2c3d4e5f6'
down_revision: Union[str, None] = '693db3dbc8c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('material_types', sa.Column('override_color', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('material_types', 'override_color')
