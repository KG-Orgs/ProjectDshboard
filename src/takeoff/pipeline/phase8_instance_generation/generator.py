"""
Phase 8: Material Instance Generation.

Creates a distinct MaterialInstance for each separate occurrence of a material type.

Key principle: ONE pattern → ONE material instance (for MVP steel beams).
Future: geometry-disconnection rules for multi-segment patterns.

Rules for splitting instances (from spec):
- geometry is disconnected
- endpoints differ (different span)
- member spans differ
- dimensions differ
- drawing logic implies separate pieces

Quantity attaches to the instance, NOT to the material type directly.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from takeoff.models.drawing import Drawing
from takeoff.models.material import MaterialInstance


class InstanceGenerator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def generate(self, drawing: Drawing) -> list[MaterialInstance]:
        """
        For each Pattern that has a resolved MaterialType (via CalloutAssociation),
        create one MaterialInstance record.

        Returns the list of created instances.
        """
        raise NotImplementedError(
            "Phase 8 not yet implemented. "
            "Load patterns with winning CalloutAssociation (highest priority, not overridden), "
            "resolve material_type_id from the association, "
            "create MaterialInstance with geometry copied from Pattern, "
            "set source_sheet and source_view_title for provenance, "
            "persist and return."
        )
