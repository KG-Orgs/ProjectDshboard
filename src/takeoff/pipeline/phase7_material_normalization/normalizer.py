"""
Phase 7: Material Type Normalization.

Converts raw resolved_material_text from callout associations into
normalized MaterialType records.

Methods (in order):
1. Catalog regex matching (catalog.py) — deterministic
2. rapidfuzz fuzzy match against existing MaterialType records — deterministic
3. Claude AI fallback for noisy / ambiguous callouts
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from takeoff.models.drawing import Drawing
from takeoff.models.material import MaterialType
from takeoff.pipeline.phase7_material_normalization.catalog import normalize_material_text


class MaterialNormalizer:
    def __init__(self, db: Session) -> None:
        self.db = db

    def normalize(self, drawing: Drawing) -> None:
        """
        For each CalloutAssociation with a resolved_material_text, find or create
        a matching MaterialType record and link it.
        """
        raise NotImplementedError(
            "Phase 7 not yet implemented. "
            "Load all CalloutAssociations with resolved_material_text for this drawing, "
            "call normalize_material_text() on each, "
            "if result is None try rapidfuzz against existing MaterialType.normalized_name, "
            "if still None call AI classifier, "
            "get_or_create MaterialType, link to the association."
        )

    def get_or_create_material_type(self, normalized_name: str, category: str,
                                     measurement_basis: str, unit: str) -> MaterialType:
        """Return existing MaterialType or create a new one."""
        existing = self.db.query(MaterialType).filter_by(normalized_name=normalized_name).first()
        if existing:
            return existing
        mt = MaterialType(
            material_type_id=str(uuid.uuid4()),
            normalized_name=normalized_name,
            category=category,
            default_measurement_basis=measurement_basis,
            default_unit=unit,
        )
        self.db.add(mt)
        self.db.flush()
        return mt
