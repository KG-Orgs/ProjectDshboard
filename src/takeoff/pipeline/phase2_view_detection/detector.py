"""
Phase 2: View Identification.

Segments a drawing sheet into named view regions and classifies each as:
plan | section | detail | elevation | schedule

Methods (in order):
1. Title block detection (large rect in outer margin → excluded from views)
2. Viewport boundary detection (closed rectangles with nearby title text)
3. Title label matching (regex on text near bbox → view type)
4. Claude vision fallback for ambiguous layouts

Outputs a cross-sheet view index required by Phase 6 callout association.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from takeoff.models.drawing import Drawing, View


class ViewDetector:
    def __init__(self, db: Session) -> None:
        self.db = db

    def detect(self, drawing: Drawing) -> list[View]:
        """
        Detect and classify all views on the drawing sheet.
        Persists View records and returns the list.
        """
        raise NotImplementedError(
            "Phase 2 not yet implemented. "
            "Steps: (1) find title block rectangle in outer margin, "
            "(2) detect viewport boundaries as closed rectangles, "
            "(3) match nearby text labels to classify view type, "
            "(4) use Claude vision for ambiguous cases."
        )

    def _detect_title_block(self, entities: list[dict]) -> dict | None:
        """Find the largest rectangle in the outer 15% margin — the title block."""
        raise NotImplementedError

    def _detect_viewport_boundaries(self, entities: list[dict], title_block: dict | None) -> list[dict]:
        """Find closed rectangular regions that bound individual views."""
        raise NotImplementedError

    def _classify_view_type(self, bbox: tuple, text_blocks: list[dict]) -> tuple[str, float]:
        """
        Match text near the bbox to known view title patterns.
        Returns (view_type, confidence).
        Patterns: 'PLAN', 'SECTION', 'DETAIL', 'ELEVATION', 'SCHEDULE'.
        """
        raise NotImplementedError
