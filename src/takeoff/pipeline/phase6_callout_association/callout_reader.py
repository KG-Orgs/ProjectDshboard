"""
Substage 2.4: Callout Reading.

Extract nearby text for each callout candidate.
Uses native PDF text first, OCR fallback if needed.

For each callout, finds nearby text blocks within a threshold distance.
"""

from __future__ import annotations

import math
from typing import Any

from sqlalchemy.orm import Session

from takeoff.models.callout import Callout
from takeoff.models.drawing import ClassifiedEntity, EntityRole, View


class CalloutReader:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, view: View) -> None:
        """
        For each callout in the view, extract nearby text blocks.
        Updates Callout.nearby_texts.
        """
        callouts = self.db.query(Callout).filter(Callout.view_id == view.view_id).all()
        text_entities = self.db.query(ClassifiedEntity).filter(
            ClassifiedEntity.view_id == view.view_id,
            ClassifiedEntity.role == EntityRole.annotation_text
        ).all()

        for callout in callouts:
            nearby = self._find_nearby_texts(callout, text_entities)
            callout.nearby_texts = nearby
            self.db.add(callout)

        self.db.commit()

    def _find_nearby_texts(self, callout: Callout, text_entities: list[ClassifiedEntity]) -> list[dict[str, Any]]:
        """
        Find text entities near the callout bbox.
        Returns list of dicts with text, bbox, distance.
        """
        if not callout.bbox_x1 or not callout.bbox_y1 or not callout.bbox_x2 or not callout.bbox_y2:
            return []

        cx = (callout.bbox_x1 + callout.bbox_x2) / 2
        cy = (callout.bbox_y1 + callout.bbox_y2) / 2

        nearby = []
        threshold = 100.0  # PDF units, adjust as needed

        for entity in text_entities:
            if entity.entity_id == callout.callout_id:  # skip self
                continue
            if not entity.bbox_x1 or not entity.bbox_y1 or not entity.bbox_x2 or not entity.bbox_y2:
                continue

            ex = (entity.bbox_x1 + entity.bbox_x2) / 2
            ey = (entity.bbox_y1 + entity.bbox_y2) / 2

            distance = math.sqrt((cx - ex)**2 + (cy - ey)**2)
            if distance <= threshold:
                nearby.append({
                    "text": entity.properties.get("text", "") if entity.properties else "",
                    "bbox": [entity.bbox_x1, entity.bbox_y1, entity.bbox_x2, entity.bbox_y2],
                    "distance": distance,
                    "font_size": entity.properties.get("font_size") if entity.properties else None,
                })

        # Sort by distance
        nearby.sort(key=lambda x: x["distance"])
        return nearby