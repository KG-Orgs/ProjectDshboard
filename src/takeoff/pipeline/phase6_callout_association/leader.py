"""
Substage 5a: Direct Leader Association.

Resolves leader_line entities → text block → structural_member pattern.
Confidence range: 0.92–0.99 (unambiguous), 0.55–0.80 (multi-headed or crossing).
"""

from __future__ import annotations

import math
import uuid
from typing import Any

from sqlalchemy.orm import Session

from takeoff.models.callout import Callout, CalloutAssociation, AssociationMode
from takeoff.models.drawing import ClassifiedEntity, EntityRole, View
from takeoff.models.pattern import Pattern


class LeaderAssociator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, view: View) -> None:
        """
        For each leader_line entity:
        1. Identify source text block (endpoint near text bbox)
        2. Identify target pattern (arrowhead endpoint snaps to nearest structural_member)
        3. Create CalloutAssociation with mode='leader'
        """
        leaders = self.db.query(ClassifiedEntity).filter(
            ClassifiedEntity.view_id == view.view_id,
            ClassifiedEntity.role == EntityRole.leader_line
        ).all()

        patterns = self.db.query(Pattern).filter(
            Pattern.view_id == view.view_id,
            Pattern.pattern_class == 'structural_member'
        ).all()

        callouts = {c.callout_id: c for c in self.db.query(Callout).filter(Callout.view_id == view.view_id).all()}

        for leader in leaders:
            source_id = leader.properties.get('source_text_block_id') if leader.properties else None
            if not source_id or source_id not in callouts:
                continue

            callout = callouts[source_id]

            arrowhead = self._get_arrowhead(leader.geometry)
            if not arrowhead:
                continue

            nearest_pattern = self._find_nearest_pattern(arrowhead, patterns)
            if nearest_pattern:
                center = self._bbox_center(nearest_pattern)
                distance = self._distance(arrowhead, center)
                snap_tolerance = 20.0  # pixels, adjust as needed
                if distance <= snap_tolerance:
                    confidence = 0.92 + (1.0 - distance / snap_tolerance) * 0.07
                    association = CalloutAssociation(
                        association_id=str(uuid.uuid4()),
                        pattern_id=nearest_pattern.pattern_id,
                        callout_id=callout.callout_id,
                        association_mode=AssociationMode.leader,
                        confidence=confidence,
                        evidence={'distance': distance, 'arrowhead': arrowhead}
                    )
                    self.db.add(association)

        self.db.commit()

    def _get_arrowhead(self, geometry: dict[str, Any]) -> tuple[float, float] | None:
        """Assume the last point in the polyline is the arrowhead."""
        points = geometry.get('points', [])
        if len(points) >= 2:
            return tuple(points[-1])
        return None

    def _find_nearest_pattern(self, point: tuple[float, float], patterns: list[Pattern]) -> Pattern | None:
        min_dist = float('inf')
        nearest = None
        for p in patterns:
            center = self._bbox_center(p)
            dist = self._distance(point, center)
            if dist < min_dist:
                min_dist = dist
                nearest = p
        return nearest

    def _bbox_center(self, pattern: Pattern) -> tuple[float, float]:
        x1 = pattern.bbox_x1 or 0
        y1 = pattern.bbox_y1 or 0
        x2 = pattern.bbox_x2 or 0
        y2 = pattern.bbox_y2 or 0
        return ((x1 + x2) / 2, (y1 + y2) / 2)

    def _distance(self, p1: tuple[float, float], p2: tuple[float, float]) -> float:
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
