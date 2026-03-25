"""
Phase 9: Quantity Extraction Per Instance.

Measures each MaterialInstance using the correct basis and unit.
All math is deterministic — no AI.

Measurement types supported (MVP: length only):
- length  → polyline length × scale_ratio → real inches → convert to LF
- area    → polygon area × scale_ratio² → SF  (future)
- volume  → area × depth → CF           (future)
- count   → 1 per instance              (future, for columns/footings)
- weight  → LF × lbs_per_ft from catalog (future)

Formula (length):
  pdf_length (pts) × scale_ratio (in/pt) / 12 = real feet (LF)
"""

from __future__ import annotations

import math

from sqlalchemy.orm import Session

from takeoff.models.drawing import Drawing
from takeoff.models.quantity import Quantity


class QuantityExtractor:
    def __init__(self, db: Session) -> None:
        self.db = db

    def extract(self, drawing: Drawing) -> list[Quantity]:
        """
        For each MaterialInstance in the drawing, compute its quantity
        and persist a Quantity record.
        """
        raise NotImplementedError(
            "Phase 9 not yet implemented. "
            "Load MaterialInstances, get scale_ratio from parent View, "
            "compute polyline_length() from instance.geometry, "
            "apply: value = polyline_length * scale_ratio / 12  (PDF pts → LF), "
            "set confidence from per-stage breakdown, persist Quantity."
        )

    @staticmethod
    def polyline_length(geometry: dict) -> float:
        """
        Calculate the total length of a polyline geometry in PDF user units.
        geometry = {"kind": "line"/"polyline", "points": [[x1,y1], [x2,y2], ...]}
        """
        points = geometry.get("points", [])
        if len(points) < 2:
            return 0.0
        total = 0.0
        for i in range(len(points) - 1):
            dx = points[i + 1][0] - points[i][0]
            dy = points[i + 1][1] - points[i][1]
            total += math.sqrt(dx * dx + dy * dy)
        return total
