"""
Phase 10: Aggregation and Reporting.

Rolls up instance-level quantities into takeoff summaries.

Outputs:
- detailed_takeoff: one row per MaterialInstance (fully traceable)
- summary_takeoff:  quantities aggregated by MaterialType

Aggregation dimensions available: material_type, sheet, view, zone (future), trade (future).
"""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from sqlalchemy.orm import Session

from takeoff.models.material import MaterialInstance, MaterialType
from takeoff.models.quantity import Quantity


class TakeoffAggregator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def aggregate(self, drawing_id: str) -> dict[str, Any]:
        """
        Produce detailed and summary takeoff for a drawing.

        Returns:
        {
          "drawing_id": ...,
          "summary": [
            {"material": "W10x77", "total_lf": 210.0, "instance_count": 12, "unit": "LF",
             "source_sheets": ["S101"]},
            ...
          ],
          "detail": [
            {"instance_id": ..., "material": ..., "value": 10.0, "unit": "LF",
             "sheet": "S101", "view": "LEVEL 1 FRAMING PLAN",
             "pattern_id": ..., "confidence": {...}},
            ...
          ],
          "flagged_for_review": [...],
          "unresolved_patterns": [...]
        }
        """
        raise NotImplementedError(
            "Phase 10 not yet implemented. "
            "Query MaterialInstances + Quantities for the drawing, "
            "group by material_type_id for summary, "
            "join with View and Drawing for provenance fields, "
            "collect flagged CalloutAssociations and null-association patterns."
        )
