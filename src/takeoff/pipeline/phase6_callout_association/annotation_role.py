"""
Substage 5b: Annotation Role Classification.

Classifies each annotation_text entity that was NOT resolved by leader association (5a).

Two-pass approach:
1. Deterministic regex rules (high confidence, no AI):
   - Material designations: W-shapes, HSS, pipe, angles, channels, rebar, concrete
   - Dimension strings: feet-inch or decimal notation
   - Detail references: N/S-NNN format
   - Section references: similar but near section_cut geometry

2. Claude AI fallback (remaining blocks):
   - member marks (e.g. B12, C4)
   - elevation notes (TOP OF STEEL EL. ...)
   - general notes (VERIFY IN FIELD)
   Input: text content + font_size + spatial position + is_leader_connected
"""

from __future__ import annotations

import re

from sqlalchemy.orm import Session

from takeoff.models.drawing import View
from takeoff.models.callout import CalloutType

# --- Deterministic regex patterns ---

_MATERIAL_PATTERNS: list[tuple[re.Pattern, str]] = [
    # W-shapes: W10x77, W10X77, W 10 X 77
    (re.compile(r'\bW\s*\d+\s*[xX]\s*\d+(\.\d+)?\b'), "structural_steel"),
    # HSS: HSS6x6x1/4, HSS6X6X0.25
    (re.compile(r'\bHSS\s*\d+(\.\d+)?\s*[xX]\s*\d+(\.\d+)?\s*[xX]\s*[\d./]+\b', re.I), "structural_steel"),
    # Pipe: PIPE 4 STD, PIPE4XS
    (re.compile(r'\bPIPE\s*\d+(\.\d+)?\s*(STD|XS|XXS|SCH\s*\d+)?\b', re.I), "structural_steel"),
    # Angles: L4x4x1/2, L3X3X1/4
    (re.compile(r'\bL\s*\d+(\.\d+)?\s*[xX]\s*\d+(\.\d+)?\s*[xX]\s*[\d./]+\b'), "structural_steel"),
    # Channels: C10x30, MC12x10.6
    (re.compile(r'\b(M?C)\s*\d+(\.\d+)?\s*[xX]\s*\d+(\.\d+)?\b'), "structural_steel"),
    # Rebar: #4, #5 BAR, NO.4
    (re.compile(r'\b(#\d+|NO\.\s*\d+)\s*(BAR|REBAR)?\b', re.I), "rebar"),
    # Concrete: 3000 PSI, 4000PSI, f'c=4000
    (re.compile(r"\bf'?c\s*=\s*\d+\s*(PSI|psi)?\b", re.I), "concrete"),
    (re.compile(r'\b\d{4,5}\s*PSI\b', re.I), "concrete"),
]

_DIMENSION_PATTERN = re.compile(
    r"^\s*\d+'\s*-?\s*\d+(\s*\d+/\d+)?\"?\s*$|"  # 22'-6", 22' - 6 1/2"
    r"^\s*\d+(\.\d+)?\s*(IN|FT|MM|M|CM)\s*$",     # 10.5 FT
    re.I,
)

_DETAIL_REF_PATTERN = re.compile(r"^\s*\d+\s*/\s*[A-Z]\d+\s*$", re.I)  # e.g. 3/S401


class AnnotationRoleClassifier:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, view: View) -> None:
        """
        Classify all unresolved annotation_text entities in this view.
        Updates Callout.callout_type and Callout.classification_method.
        """
        raise NotImplementedError(
            "5b not yet implemented. "
            "Load unresolved annotation_text entities, run deterministic regex first, "
            "then call AI classifier for remaining unknown blocks."
        )

    def classify_text(self, text: str, font_size: float | None = None) -> tuple[CalloutType, float, str]:
        """
        Classify a single text string.
        Returns (CalloutType, confidence, method).
        """
        stripped = text.strip()

        if _DETAIL_REF_PATTERN.match(stripped):
            return CalloutType.detail_ref, 0.97, "regex_detail_ref"

        if _DIMENSION_PATTERN.match(stripped):
            return CalloutType.dimension, 0.95, "regex_dimension"

        for pattern, _category in _MATERIAL_PATTERNS:
            if pattern.search(stripped):
                return CalloutType.material_designation, 0.96, "regex_material"

        return CalloutType.unknown, 0.0, "unclassified"
