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

from rapidfuzz import fuzz, process
from sqlalchemy.orm import Session, joinedload

from takeoff.models.callout import CalloutAssociation
from takeoff.models.drawing import Drawing
from takeoff.models.material import MaterialType
from takeoff.models.pattern import Pattern
from takeoff.models.view import View
from takeoff.ai.client import classify_material_type


class MaterialNormalizer:
    def __init__(self, db: Session) -> None:
        self.db = db

    def normalize(self, drawing: Drawing) -> None:
        """
        For each CalloutAssociation with a resolved_material_text, find or create
        a matching MaterialType record and link it.
        """
        # Load associations with resolved_material_text for this drawing
        associations = (
            self.db.query(CalloutAssociation)
            .join(CalloutAssociation.pattern)
            .join(Pattern.view)
            .filter(
                View.drawing_id == drawing.drawing_id,
                CalloutAssociation.resolved_material_text.isnot(None)
            )
            .options(joinedload(CalloutAssociation.pattern).joinedload(Pattern.view))
            .all()
        )

        for assoc in associations:
            raw = assoc.resolved_material_text.strip()
            norm = normalize_material_text(raw)
            if norm:
                mt = self.get_or_create_material_type(
                    norm['normalized_name'],
                    norm['category'],
                    norm['default_measurement_basis'],
                    norm['default_unit']
                )
                assoc.material_type_id = mt.material_type_id
            else:
                # Fuzzy match against existing MaterialType.normalized_name
                existing_names = [
                    mt.normalized_name for mt in self.db.query(MaterialType.normalized_name).all()
                ]
                if existing_names:
                    best_match = process.extractOne(raw, existing_names, scorer=fuzz.ratio)
                    if best_match and best_match[1] > 80:  # Confidence threshold
                        mt = self.db.query(MaterialType).filter_by(normalized_name=best_match[0]).first()
                        assoc.material_type_id = mt.material_type_id
                        continue

                # AI fallback
                ai_result = classify_material_type(raw)
                mt = self.get_or_create_material_type(
                    ai_result['normalized_name'],
                    ai_result['category'],
                    ai_result['default_measurement_basis'],
                    ai_result['default_unit']
                )
                assoc.material_type_id = mt.material_type_id

        self.db.commit()

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
