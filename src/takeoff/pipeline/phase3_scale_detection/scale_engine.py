"""
Phase 3: Scale Detection Per View.

Assigns a scale ratio to each view (paper units → real-world units).
Scale is stored per-view, not per-sheet.

Detection priority:
1. Regex parse of scale text near the view title: '1/8" = 1\'-0"', '1:100', etc.
2. Graphic scale bar detection (horizontal line with tick marks and dimension text)
3. Known-dimension inference (fallback only — requires a dimension string whose
   real-world value is known from context)

Output: scale_ratio (float) — multiply PDF user units by this to get inches.
"""

from __future__ import annotations

import re

from sqlalchemy.orm import Session

from takeoff.models.drawing import View

# Common imperial scale strings → ratio (PDF pt → real inches)
# PDF user unit = 1/72 inch at 72 dpi; pymupdf uses pts where 1 pt = 1/72 in
_SCALE_PATTERNS: list[tuple[re.Pattern, float]] = [
    # "1/8" = 1'-0"  →  1 paper inch = 8 real feet = 96 real inches → ratio = 96
    (re.compile(r'1/8["\u201d]\s*=\s*1\s*[\'\u2019]-\s*0["\u201d]', re.I), 96.0),
    (re.compile(r'1/4["\u201d]\s*=\s*1\s*[\'\u2019]-\s*0["\u201d]', re.I), 48.0),
    (re.compile(r'3/8["\u201d]\s*=\s*1\s*[\'\u2019]-\s*0["\u201d]', re.I), 32.0),
    (re.compile(r'1/2["\u201d]\s*=\s*1\s*[\'\u2019]-\s*0["\u201d]', re.I), 24.0),
    (re.compile(r'3/4["\u201d]\s*=\s*1\s*[\'\u2019]-\s*0["\u201d]', re.I), 16.0),
    (re.compile(r'1["\u201d]\s*=\s*1\s*[\'\u2019]-\s*0["\u201d]', re.I), 12.0),
    (re.compile(r'1["\u201d]\s*=\s*1["\u201d]', re.I), 1.0),  # full scale
    # Metric: 1:100, 1:50, etc.
    (re.compile(r'1\s*:\s*100', re.I), 100 / 25.4 * 72),  # mm scale to pt
    (re.compile(r'1\s*:\s*50', re.I), 50 / 25.4 * 72),
]


class ScaleEngine:
    def __init__(self, db: Session) -> None:
        self.db = db

    def detect(self, view: View) -> float | None:
        """
        Detect the scale for a view and persist it.
        Returns the numeric ratio (paper PDF units → real inches), or None if not found.
        """
        raise NotImplementedError(
            "Phase 3 not yet implemented. "
            "Steps: (1) search text blocks near view title for scale string, "
            "(2) try _SCALE_PATTERNS regex list, "
            "(3) detect graphic scale bar, "
            "(4) set view.scale_ratio and view.scale_confidence."
        )

    def _parse_scale_text(self, text: str) -> float | None:
        """Try each pattern in _SCALE_PATTERNS. Returns ratio or None."""
        for pattern, ratio in _SCALE_PATTERNS:
            if pattern.search(text):
                return ratio
        return None

    def _detect_graphic_scale_bar(self, entities: list[dict], text_blocks: list[dict]) -> float | None:
        """
        Detect a graphic scale bar: horizontal line with tick marks and a
        distance label (e.g. '0  10  20  40 FT').
        Returns ratio or None.
        """
        raise NotImplementedError
