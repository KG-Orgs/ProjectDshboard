"""
Substage 5j: Conflict Resolution and Review Flagging.

Applies the priority table to all associations for each pattern and flags
cases that require human review.

Priority table (from spec §3):
  1 leader
  2 schedule_lookup
  3 proximity (dominant)
  4 detail_reference
  5 proximity (contested)
  6 typ_propagation

Rules:
- Higher priority always wins.
- Same-priority conflicts → flag for review.
- Cross-source conflicts (plan says W10x77, detail says W10x88) → record both, flag.
- Complementary callouts (member mark + material designation + detail ref) → stack, not compete.
- Null associations → record as unresolved.

Review triggers (from spec §7.2):
- confidence < 0.65
- two+ candidates at same priority
- material conflict across sources
- no association found (unresolved null)
- TYP propagation with orientation delta > 5°
- annotation role = unknown or confidence < 0.70
- fuzzy schedule match with edit distance > 1
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from takeoff.models.drawing import View
from takeoff.models.callout import AssociationMode

_PRIORITY: dict[AssociationMode, int] = {
    AssociationMode.leader: 1,
    AssociationMode.schedule_lookup: 2,
    AssociationMode.proximity: 3,       # dominant vs contested differentiated by confidence
    AssociationMode.detail_reference: 4,
    AssociationMode.typ_propagation: 6,
}


class ConflictResolver:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, view: View) -> None:
        """
        For each pattern in the view:
        1. Load all CalloutAssociation records
        2. Apply priority table — keep highest-priority, mark others as is_override=True
        3. Flag review cases
        4. Mark patterns with no associations as unresolved
        """
        raise NotImplementedError(
            "5j not yet implemented. "
            "Group associations by pattern_id, sort by _PRIORITY, "
            "handle same-priority ties (flag for review), "
            "update flagged_for_review + review_reason on each association."
        )
