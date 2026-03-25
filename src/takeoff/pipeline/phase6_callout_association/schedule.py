"""
Substages 5d + 5e: Schedule Parsing and Lookup.

5d — Parse schedule tables from views containing schedule_grid entities.
     Schedule grids in CAD PDFs are geometrically perfect; extraction is purely geometric.

5e — For patterns whose callout is classified as member_mark, look up the mark
     in all available Schedule tables. Supports exact and fuzzy matching (rapidfuzz).

Confidence:
- exact match:  0.92–0.98
- fuzzy match:  0.60–0.82 (edit distance ≤ 1)
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from takeoff.models.drawing import View
from takeoff.models.callout import Schedule


class ScheduleAssociator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, view: View) -> None:
        """Run 5d (parse) then 5e (lookup) for this view."""
        self._parse_schedules(view)
        self._lookup_member_marks(view)

    def _parse_schedules(self, view: View) -> list[Schedule]:
        """
        5d: Detect schedule_grid entities, extract bounding table, map headers → rows.
        Each cell's text is the positioned text block whose bbox falls within that cell.
        Persists Schedule + Member records.
        """
        raise NotImplementedError(
            "5d not yet implemented. "
            "Load schedule_grid entities, find their bounding rectangle, "
            "detect row/column lines by clustering horizontal/vertical line segments, "
            "map each text block to its cell by bbox containment, "
            "identify the key column (member mark), persist Schedule and Member rows."
        )

    def _lookup_member_marks(self, view: View) -> None:
        """
        5e: For each pattern with a member_mark callout, query Schedule.rows
        by exact then fuzzy (rapidfuzz) match. Create CalloutAssociation mode='schedule_lookup'.
        """
        raise NotImplementedError(
            "5e not yet implemented. "
            "Load patterns with unresolved member_mark callouts, "
            "normalize mark (strip whitespace, uppercase), "
            "exact match against all Schedule.rows[key_column], "
            "if no exact match try rapidfuzz.process.extractOne with score_cutoff=80, "
            "create CalloutAssociation with resolved_material_text from the matched row."
        )
