"""
Substage 5a: Direct Leader Association.

Resolves leader_line entities → text block → structural_member pattern.
Confidence range: 0.92–0.99 (unambiguous), 0.55–0.80 (multi-headed or crossing).
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from takeoff.models.drawing import View


class LeaderAssociator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, view: View) -> None:
        """
        For each leader_line entity:
        1. Identify source text block (endpoint near text bbox)
        2. Identify target pattern (arrowhead endpoint snaps to nearest structural_member)
        3. Create CalloutAssociation with mode='leader'
        """
        raise NotImplementedError(
            "5a not yet implemented. "
            "Load leader_line entities, resolve source text_block_id from properties, "
            "find nearest structural_member within snap_tolerance, "
            "handle multi-headed leaders by creating one association per termination point, "
            "set confidence based on snap_distance vs snap_tolerance ratio."
        )
