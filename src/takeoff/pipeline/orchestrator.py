"""
Pipeline orchestrator.

Runs the 10-phase pipeline for a given drawing. The orchestrator is event-driven:
views are processed through a queue with statuses (unprocessed → in_progress → complete)
so that detail-reference resolution can trigger re-processing of not-yet-seen views.

MVP simplification: runs phases sequentially for a single-sheet structural steel plan.
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    def __init__(self, db: Session) -> None:
        self.db = db

    def run(self, pdf_path: Path, drawing_id: str) -> dict:
        """
        Execute the full MVP pipeline for a CAD-exported PDF.

        Returns a summary dict with aggregated takeoff quantities.
        """
        from takeoff.pipeline.phase1_ingestion.ingester import DrawingIngester
        from takeoff.pipeline.phase2_view_detection.detector import ViewDetector
        from takeoff.pipeline.phase3_scale_detection.scale_engine import ScaleEngine
        from takeoff.pipeline.phase4_entity_classification.classifier import EntityClassifier
        from takeoff.pipeline.phase5_pattern_detection.detector import PatternDetector
        from takeoff.pipeline.phase6_callout_association import CalloutAssociator
        from takeoff.pipeline.phase7_material_normalization.normalizer import MaterialNormalizer
        from takeoff.pipeline.phase8_instance_generation.generator import InstanceGenerator
        from takeoff.pipeline.phase9_quantity_extraction.extractor import QuantityExtractor
        from takeoff.pipeline.phase10_reporting.aggregator import TakeoffAggregator

        logger.info("Phase 1: Ingestion")
        drawing = DrawingIngester(self.db).ingest(pdf_path, drawing_id)

        logger.info("Phase 2: View detection")
        views = ViewDetector(self.db).detect(drawing)

        logger.info("Phase 3: Scale detection")
        for view in views:
            ScaleEngine(self.db).detect(view)

        logger.info("Phase 4: Entity classification")
        for view in views:
            EntityClassifier(self.db).classify(view)

        logger.info("Phase 5: Pattern detection")
        for view in views:
            PatternDetector(self.db).detect(view)

        logger.info("Phase 6: Callout association")
        for view in views:
            CalloutAssociator(self.db).associate(view)

        logger.info("Phase 7: Material normalization")
        MaterialNormalizer(self.db).normalize(drawing)

        logger.info("Phase 8: Instance generation")
        InstanceGenerator(self.db).generate(drawing)

        logger.info("Phase 9: Quantity extraction")
        QuantityExtractor(self.db).extract(drawing)

        logger.info("Phase 10: Aggregation")
        return TakeoffAggregator(self.db).aggregate(drawing_id)
