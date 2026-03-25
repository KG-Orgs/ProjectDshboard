"""
Phase 4: Vector Entity Classification.

Tags every vector entity with a role BEFORE pattern detection runs.
Without this step, the pattern detector drowns in noise (60-70% of entities
in a typical CAD structural plan are hatch, dimensions, and grid lines).

Classification uses layered deterministic heuristics — NOT AI.
Order matters: classify by elimination, structural_member is the residual.

Roles (in classification order):
1. title_block       — large rect in outer margin
2. grid_line         — long dashed line with circle/hex terminator + single char
3. dimension_line    — short parallel witness lines + perpendicular + numeric text
4. hatch_pattern     — dense parallel lines within a bounded region
5. leader_line       — polyline: one end near text bbox, other end has arrowhead
6. annotation_text   — all native text blocks (classification_confidence = 1.0)
7. schedule_grid     — rectangular grid of lines forming a table
8. detail_bubble     — circle/ellipse containing "N/S-NNN" formatted text
9. section_cut       — heavy dashed lines with directional arrows
10. symbol           — blocks: north arrow, weld symbols, equipment
11. structural_member — residual after all above removed
12. unknown          — anything that doesn't fit
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from takeoff.models.drawing import ClassifiedEntity, EntityRole, View


class EntityClassifier:
    def __init__(self, db: Session) -> None:
        self.db = db

    def classify(self, view: View) -> list[ClassifiedEntity]:
        """
        Classify all raw vector entities for this view and persist ClassifiedEntity records.
        Returns the list of classified entities.
        """
        raise NotImplementedError(
            "Phase 4 not yet implemented. "
            "Load raw entities from the ingestion output, apply heuristic rules "
            "in order (title_block → grid_line → dimension → hatch → leader → "
            "annotation_text → schedule_grid → detail_bubble → section_cut → "
            "symbol → structural_member residual → unknown), persist results."
        )

    # ------------------------------------------------------------------
    # Individual classifiers (deterministic rules)
    # ------------------------------------------------------------------

    def _classify_title_block(self, entities: list[dict], sheet_bounds: tuple) -> set[str]:
        """
        Find the largest rectangle in the outer 15% margin zone.
        Returns entity_ids classified as title_block.
        """
        raise NotImplementedError

    def _classify_grid_lines(self, entities: list[dict], text_blocks: list[dict]) -> set[str]:
        """
        Long lines (>60% sheet width/height), dashed linetype,
        terminated by circle/hexagon with single alphanumeric text inside.
        """
        raise NotImplementedError

    def _classify_dimension_lines(self, entities: list[dict], text_blocks: list[dict]) -> set[str]:
        """
        Pairs of short parallel witness lines connected by a perpendicular line
        with a numeric text block at midpoint.
        """
        raise NotImplementedError

    def _classify_hatch_patterns(self, entities: list[dict]) -> set[str]:
        """
        Clusters of closely-spaced parallel lines with uniform spacing
        significantly denser than structural linework (>5x density ratio).
        """
        raise NotImplementedError

    def _classify_leader_lines(self, entities: list[dict], text_blocks: list[dict]) -> set[str]:
        """
        Polylines where one endpoint is within snap tolerance of a text block bbox
        and the other endpoint has an arrowhead/dot/tick terminator marker nearby.
        """
        raise NotImplementedError

    def _classify_structural_members(
        self, entities: list[dict], already_classified: set[str]
    ) -> set[str]:
        """
        Residual: all lines/polylines not yet classified.
        Structural member detection works by elimination, not positive ID.
        """
        return {e["entity_id"] for e in entities if e["entity_id"] not in already_classified
                and e["geometry_type"] in ("line", "polyline")}
