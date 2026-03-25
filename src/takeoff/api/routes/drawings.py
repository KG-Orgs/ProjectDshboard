"""
Drawing upload and retrieval endpoints.

POST /drawings          — upload a CAD-exported PDF, trigger Phase 1 ingestion
GET  /drawings/{id}     — retrieve drawing metadata and view list
"""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from takeoff.config import settings
from takeoff.db import get_db
from takeoff.models.drawing import Drawing

router = APIRouter()


@router.post("/")
async def upload_drawing(file: UploadFile, db: Session = Depends(get_db)):
    """
    Accept a PDF upload, save to storage, run Phase 1 ingestion.
    Returns the drawing_id for subsequent pipeline calls.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    drawing_id = str(uuid.uuid4())
    storage = Path(settings.storage_path) / drawing_id
    storage.mkdir(parents=True, exist_ok=True)
    pdf_path = storage / "source.pdf"

    with pdf_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    # Phase 1: ingestion (synchronous for now; move to async queue in production)
    from takeoff.pipeline.phase1_ingestion.ingester import DrawingIngester
    try:
        drawing = DrawingIngester(db).ingest(pdf_path, drawing_id)
        db.commit()
    except NotImplementedError:
        # Return a stub response until Phase 1 is implemented
        drawing = Drawing(
            drawing_id=drawing_id,
            source_file=str(pdf_path),
            sheet_number=file.filename,
        )
        db.add(drawing)
        db.commit()

    return {"drawing_id": drawing_id, "status": "ingested", "source_file": str(pdf_path)}


@router.get("/{drawing_id}")
def get_drawing(drawing_id: str, db: Session = Depends(get_db)):
    drawing = db.get(Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")
    return {
        "drawing_id": drawing.drawing_id,
        "sheet_number": drawing.sheet_number,
        "source_file": drawing.source_file,
        "views": [
            {
                "view_id": v.view_id,
                "view_type": v.view_type,
                "title": v.title,
                "scale_ratio": v.scale_ratio,
                "status": v.status,
            }
            for v in drawing.views
        ],
    }
