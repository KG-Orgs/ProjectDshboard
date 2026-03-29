"""
Phase 6: Callout Association.

Runs in 10 substages (5a–5j) as specified in the engineering spec.
Delegates each substage to a focused submodule.

Association priority (highest → lowest):
  1. Direct leader   (leader line traces text → pattern)
  2. Schedule lookup (member mark → schedule row → material)
  3. Proximity dominant (unambiguously closest pattern)
  4. Detail reference (cross-view/cross-sheet)
  5. Proximity contested (flag for review)
  6. TYP propagation  (typical annotation)
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from takeoff.models.drawing import View


class CalloutAssociator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def associate(self, view: View) -> None:
        """Run all substages for a view in dependency order."""
        from takeoff.pipeline.phase6_callout_association.callout_reader import CalloutReader
        from takeoff.pipeline.phase6_callout_association.leader import LeaderAssociator
        from takeoff.pipeline.phase6_callout_association.annotation_role import AnnotationRoleClassifier
        from takeoff.pipeline.phase6_callout_association.proximity import ProximityAssociator
        from takeoff.pipeline.phase6_callout_association.schedule import ScheduleAssociator
        from takeoff.pipeline.phase6_callout_association.typ import TypPropagator
        from takeoff.pipeline.phase6_callout_association.conflict import ConflictResolver

        CalloutReader(self.db).run(view)             # 2.4: extract nearby text
        LeaderAssociator(self.db).run(view)          # 5a
        AnnotationRoleClassifier(self.db).run(view)  # 5b
        ProximityAssociator(self.db).run(view)       # 5c
        ScheduleAssociator(self.db).run(view)        # 5d + 5e
        TypPropagator(self.db).run(view)             # 5f + 5g
        # 5h + 5i (detail ref) deferred to post-MVP
        ConflictResolver(self.db).run(view)          # 5j
