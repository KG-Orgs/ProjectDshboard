"""
Takeoff pipeline trigger and results endpoints.

POST /takeoff/{drawing_id}/run     — trigger the full MVP pipeline for a drawing
GET  /takeoff/{drawing_id}/results — return aggregated takeoff JSON
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from takeoff.db import get_db
from takeoff.models.drawing import Drawing

router = APIRouter()


@router.post("/{drawing_id}/run")
def run_pipeline(drawing_id: str, db: Session = Depends(get_db)):
    """
    Trigger the full 10-phase pipeline for an already-ingested drawing.
    Runs synchronously; move to Celery/ARQ queue in production.
    """
    drawing = db.get(Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")

    from takeoff.pipeline.orchestrator import PipelineOrchestrator

    try:
        result = PipelineOrchestrator(db).run(
            pdf_path=drawing.source_file,
            drawing_id=drawing_id,
        )
        return result
    except NotImplementedError as exc:
        # Pipeline phases not yet implemented — return a stub response.
        return {
            "drawing_id": drawing_id,
            "status": "pipeline_not_implemented",
            "detail": str(exc),
            "summary": [],
            "detail_rows": [],
        }


@router.get("/{drawing_id}/results")
def get_results(drawing_id: str, db: Session = Depends(get_db)):
    """
    Return the latest aggregated takeoff for a drawing.
    """
    drawing = db.get(Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")

    from takeoff.pipeline.phase10_reporting.aggregator import TakeoffAggregator

    try:
        return TakeoffAggregator(db).aggregate(drawing_id)
    except NotImplementedError as exc:
        return {
            "drawing_id": drawing_id,
            "status": "not_yet_processed",
            "detail": str(exc),
            "summary": [],
            "detail_rows": [],
        }
