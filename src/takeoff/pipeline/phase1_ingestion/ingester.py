"""
Phase 1: Drawing Ingestion and Canonical Representation.

Converts a CAD-exported PDF into a unified internal representation:
- vector entities (lines, polylines, circles, text blocks)
- native text layer with exact bounding boxes
- raster rendering for the UI provenance overlay

Assumes input is always a CAD-exported PDF with a native vector/text layer.
Raster-only / flattened PDFs are rejected.

Primary library: pymupdf (fitz)
"""

from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any

import fitz

from sqlalchemy.orm import Session

from takeoff.models.drawing import Drawing, View, ViewType


class DrawingIngester:
    def __init__(self, db: Session) -> None:
        self.db = db

    def ingest(self, pdf_path: Path, drawing_id: str | None = None) -> Drawing:
        """
        Parse a CAD-exported PDF and persist a Drawing record.

        Returns the Drawing ORM object.
        """
        if drawing_id is None:
            drawing_id = str(uuid.uuid4())

        doc = fitz.open(pdf_path)
        drawing = Drawing(drawing_id=drawing_id, source_file=str(pdf_path))
        self.db.add(drawing)

        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            rect = page.rect
            view_id = str(uuid.uuid4())
            view = View(
                view_id=view_id,
                drawing_id=drawing_id,
                view_type=ViewType.unknown,
                bbox_x1=rect.x0,
                bbox_y1=rect.y0,
                bbox_x2=rect.x1,
                bbox_y2=rect.y1,
                scale_ratio=None,  # unknown
            )
            self.db.add(view)

        self.db.commit()
        doc.close()
        return drawing

    # ------------------------------------------------------------------
    # Internal helpers (to be implemented)
    # ------------------------------------------------------------------

    def _extract_vector_entities(self, page: Any) -> list[dict]:
        """
        Use page.get_drawings() to extract all vector paths.
        Returns a list of raw entity dicts before classification.
        """
        raise NotImplementedError

    def _extract_text_blocks(self, page: Any) -> list[dict]:
        """
        Use page.get_text('rawdict') to extract text with exact bbox + font size.
        Native text extraction only — no OCR.
        """
        raise NotImplementedError

    def _render_raster(self, page: Any, storage_path: Path) -> str:
        """
        Render the page to a PNG at 150 dpi and save to storage.
        Used only for the UI provenance overlay, never for data extraction.
        Returns the image file path.
        """
        raise NotImplementedError

    def _is_raster_only(self, page: Any) -> bool:
        """
        Detect flattened/rasterized PDFs and reject them.
        Heuristic: if vector entity count < 10 and text block count < 5 → likely raster.
        """
        raise NotImplementedError
