"""
AI-backed annotation role classifier.

Called by phase6_callout_association/annotation_role.py (substage 5b)
for text blocks that deterministic regex rules could not classify.
Wraps client.classify_annotation_role with batching and caching.
"""

from __future__ import annotations

from takeoff.ai.client import classify_annotation_role
from takeoff.models.callout import CalloutType


_ROLE_MAP: dict[str, CalloutType] = {
    "material_designation": CalloutType.material_designation,
    "member_mark": CalloutType.member_mark,
    "detail_ref": CalloutType.detail_ref,
    "section_ref": CalloutType.section_ref,
    "elevation_note": CalloutType.elevation_note,
    "dimension": CalloutType.dimension,
    "general_note": CalloutType.general_note,
    "unknown": CalloutType.unknown,
}


class AIAnnotationClassifier:
    def classify(
        self,
        text: str,
        font_size: float | None = None,
        nearby_pattern_class: str | None = None,
        is_leader_connected: bool = False,
        context_texts: list[str] | None = None,
    ) -> tuple[CalloutType, float]:
        """
        Returns (CalloutType, confidence).
        Falls back to (unknown, 0.0) on API error.
        """
        try:
            result = classify_annotation_role(
                text=text,
                font_size=font_size,
                nearby_pattern_class=nearby_pattern_class,
                is_leader_connected=is_leader_connected,
                context_texts=context_texts,
            )
            role = _ROLE_MAP.get(result.get("role", "unknown"), CalloutType.unknown)
            confidence = float(result.get("confidence", 0.0))
            return role, confidence
        except Exception:
            return CalloutType.unknown, 0.0
