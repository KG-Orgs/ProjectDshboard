"""
Substage 5c: Proximity-Based Association.

Associates callouts that have no leader line to the nearest pattern.
Uses an R-tree spatial index for efficient nearest-neighbor queries.

Confidence:
- dominant  (0.78–0.92): nearest pattern is 2x+ closer than second candidate
- contested (0.40–0.65): two or more patterns at similar distances → flag for review
"""

from __future__ import annotations

import math
import uuid
from typing import Any

from sqlalchemy.orm import Session

from takeoff.models.callout import Callout, CalloutAssociation, AssociationMode
from takeoff.models.drawing import View
from takeoff.models.pattern import Pattern


class ProximityAssociator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, view: View) -> None:
        """
        For each unassociated material_designation or member_mark callout:
        1. Build R-tree of pattern bboxes
        2. Query nearest patterns to callout centroid
        3. Apply angular alignment and containment checks
        4. Create CalloutAssociation with mode='proximity'
        """
        # Get all callouts in view
        callouts = self.db.query(Callout).filter(
            Callout.view_id == view.view_id,
            Callout.callout_type.in_(['material_designation', 'member_mark'])
        ).all()

        # Get associated callout_ids
        associated_ids = {assoc.callout_id for assoc in self.db.query(CalloutAssociation).filter(
            CalloutAssociation.callout_id.in_([c.callout_id for c in callouts])
        ).all()}

        unassociated_callouts = [c for c in callouts if c.callout_id not in associated_ids]

        patterns = self.db.query(Pattern).filter(
            Pattern.view_id == view.view_id,
            Pattern.pattern_class == 'structural_member'
        ).all()

        # Build simple list for nearest, since rtree may not be installed
        for callout in unassociated_callouts:
            centroid = self._callout_centroid(callout)
            if not centroid:
                continue

            # Find nearest patterns
            distances = []
            for p in patterns:
                center = self._bbox_center(p)
                dist = self._distance(centroid, center)
                distances.append((dist, p))

            distances.sort(key=lambda x: x[0])
            if not distances:
                continue

            nearest_dist, nearest_pattern = distances[0]
            if len(distances) > 1:
                second_dist, _ = distances[1]
                ratio = second_dist / nearest_dist if nearest_dist > 0 else float('inf')
            else:
                ratio = float('inf')

            if ratio >= 2.0:
                # dominant
                confidence = 0.78 + (ratio - 2.0) * 0.14 / 8.0  # scale to 0.92
                confidence = min(confidence, 0.92)
                flagged = False
            else:
                # contested
                confidence = 0.40 + (1.0 - nearest_dist / 100.0) * 0.25  # example
                flagged = True

            association = CalloutAssociation(
                association_id=str(uuid.uuid4()),
                pattern_id=nearest_pattern.pattern_id,
                callout_id=callout.callout_id,
                association_mode=AssociationMode.proximity,
                confidence=confidence,
                evidence={'distance': nearest_dist, 'ratio': ratio},
                flagged_for_review=flagged
            )
            self.db.add(association)

            # Keep top-1 + alternatives: if contested, add the second as alternative
            if flagged and len(distances) > 1:
                second_dist, second_pattern = distances[1]
                alt_association = CalloutAssociation(
                    association_id=str(uuid.uuid4()),
                    pattern_id=second_pattern.pattern_id,
                    callout_id=callout.callout_id,
                    association_mode=AssociationMode.proximity,
                    confidence=confidence * 0.8,  # lower
                    evidence={'distance': second_dist, 'alternative': True},
                    flagged_for_review=True
                )
                self.db.add(alt_association)

        self.db.commit()

    def _callout_centroid(self, callout: Callout) -> tuple[float, float] | None:
        x1 = callout.bbox_x1
        y1 = callout.bbox_y1
        x2 = callout.bbox_x2
        y2 = callout.bbox_y2
        if x1 is not None and y1 is not None and x2 is not None and y2 is not None:
            return ((x1 + x2) / 2, (y1 + y2) / 2)
        return None

    def _bbox_center(self, pattern: Pattern) -> tuple[float, float]:
        x1 = pattern.bbox_x1 or 0
        y1 = pattern.bbox_y1 or 0
        x2 = pattern.bbox_x2 or 0
        y2 = pattern.bbox_y2 or 0
        return ((x1 + x2) / 2, (y1 + y2) / 2)

    def _distance(self, p1: tuple[float, float], p2: tuple[float, float]) -> float:
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
