"""
Substages 5f + 5g: TYP Detection and Propagation.

5f — Detect annotations containing TYP indicators:
     "(TYP)", "(TYPICAL)", "(TYP. U.N.O.)"

5g — Propagate the TYP callout's material to all similar unassociated patterns
     in scope. Uses conservative scope by default:
     same pattern_class + same orientation (± 5°) + same spatial cluster.

U.N.O. override: patterns that already have an explicit association are excluded.

Confidence:
- tight (0.60–0.80): TYP callout with leader to exemplar, same-bay propagation
- broad (0.40–0.60): TYP callout without leader, all same-class in view
"""

from __future__ import annotations

import re

from sqlalchemy.orm import Session

from takeoff.models.drawing import View

_TYP_PATTERN = re.compile(r'\(\s*(TYP\.?\s*(U\.N\.O\.?)?)|(TYPICAL)\s*\)', re.I)


class TypPropagator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, view: View) -> None:
        """
        5f: Detect TYP callouts.
        5g: Propagate material to unassociated same-class patterns within scope.
        """
        raise NotImplementedError(
            "5f/5g not yet implemented. "
            "Scan annotation_text for _TYP_PATTERN matches, "
            "for each TYP callout find its material (from leader or proximity), "
            "define scope: same pattern_class + orientation_delta < 5° + spatial cluster, "
            "exclude patterns with existing higher-priority association (U.N.O. logic), "
            "create CalloutAssociation mode='typ_propagation' for remaining patterns."
        )

    def _is_typ(self, text: str) -> bool:
        return bool(_TYP_PATTERN.search(text))
