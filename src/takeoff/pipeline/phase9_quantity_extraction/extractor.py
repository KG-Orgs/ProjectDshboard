"""
Phase 9: Quantity Extraction Per Instance.

Measures each MaterialInstance using the correct basis and unit.
All math is deterministic — no AI.

Measurement types supported (MVP: length only):
- length  → polyline length × scale_ratio → real inches → convert to LF
- area    → polygon area × scale_ratio² → SF  (future)
- volume  → area × depth → CF           (future)
- count   → 1 per instance              (future, for columns/footings)
- weight  → LF × lbs_per_ft from catalog (future)

Formula (length):
  pdf_length (pts) × scale_ratio (in/pt) / 12 = real feet (LF)
"""

from __future__ import annotations

import math
import uuid
from pathlib import Path
import io

import fitz
from PIL import Image

from sqlalchemy.orm import Session, joinedload

from takeoff.config import settings
from takeoff.models.drawing import Drawing, View
from takeoff.models.material import MaterialInstance
from takeoff.models.quantity import Quantity


class QuantityExtractor:
    def __init__(self, db: Session) -> None:
        self.db = db

    def extract(self, drawing: Drawing) -> list[Quantity]:
        """
        For each MaterialInstance in the drawing, compute its quantity
        and persist a Quantity record.
        """
        # Query all MaterialInstances for the drawing's views
        instances = (
            self.db.query(MaterialInstance)
            .join(View)
            .filter(View.drawing_id == drawing.drawing_id)
            .options(joinedload(MaterialInstance.quantity), joinedload(MaterialInstance.view))
            .all()
        )
        
        quantities = []
        for instance in instances:
            if instance.quantity is not None:
                # Already has quantity
                continue
            
            view = instance.view  # Assuming loaded via join
            scale_ratio = view.scale_ratio
            scale_confidence = view.scale_confidence or 0.0
            
            if scale_ratio is None or scale_confidence < 0.5:
                # Scale uncertain, mark low confidence
                confidence = 0.1
                value = None
                needs_review = True
            else:
                # Compute quantity
                length_pts = self.polyline_length(instance.geometry)
                value = length_pts * scale_ratio / 12  # LF
                confidence = scale_confidence  # For now, just scale
                needs_review = False
            
            # For MVP, assume length
            measurement_type = "length"
            unit = "LF"
            
            confidence_breakdown = {
                "scale": scale_confidence,
                "quantity": 1.0 if not needs_review else 0.1
            }
            
            quantity = Quantity(
                quantity_id=str(uuid.uuid4()),
                instance_id=instance.instance_id,
                measurement_type=measurement_type,
                value=value,
                unit=unit,
                confidence=confidence,
                needs_review=needs_review,
                confidence_breakdown=confidence_breakdown
            )
            
            # Save provenance
            geometry = instance.geometry
            bbox = self.calculate_bbox(geometry)
            drawing = instance.view.drawing
            pdf_path = Path(drawing.source_file)
            doc = fitz.open(pdf_path)
            page = doc.load_page(instance.view.page_num)
            
            # Render page to image
            zoom = 2
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix)
            img = Image.open(io.BytesIO(pix.tobytes()))
            
            # Crop around bbox, with padding
            padding = 50
            x1, y1, x2, y2 = bbox
            x1_img = (x1 - page.rect.x0) * zoom
            y1_img = (page.rect.y1 - y2) * zoom
            x2_img = (x2 - page.rect.x0) * zoom
            y2_img = (page.rect.y1 - y1) * zoom
            x1_img = max(0, x1_img - padding)
            y1_img = max(0, y1_img - padding)
            x2_img = min(pix.width, x2_img + padding)
            y2_img = min(pix.height, y2_img + padding)
            cropped = img.crop((x1_img, y1_img, x2_img, y2_img))
            
            # Save
            storage_path = Path(settings.storage_path) / drawing.drawing_id
            storage_path.mkdir(exist_ok=True)
            image_filename = f"{quantity.quantity_id}_provenance.png"
            image_path = storage_path / image_filename
            cropped.save(image_path)
            
            # Set provenance
            quantity.provenance_image_path = str(image_path.relative_to(Path(settings.storage_path)))
            quantity.provenance_geometry = geometry
            
            doc.close()
            
            self.db.add(quantity)
            quantities.append(quantity)
        
        self.db.commit()
        return quantities

    @staticmethod
    def polyline_length(geometry: dict) -> float:
        """
        Calculate the total length of a polyline geometry in PDF user units.
        geometry = {"kind": "line"/"polyline", "points": [[x1,y1], [x2,y2], ...]}
        """
        points = geometry.get("points", [])
        if len(points) < 2:
            return 0.0
        total = 0.0
        for i in range(len(points) - 1):
            dx = points[i + 1][0] - points[i][0]
            dy = points[i + 1][1] - points[i][1]
            total += math.sqrt(dx * dx + dy * dy)
        return total

    @staticmethod
    def calculate_bbox(geometry: dict) -> tuple[float, float, float, float]:
        """
        Calculate bounding box of geometry.
        Returns (x1, y1, x2, y2)
        """
        points = geometry.get("points", [])
        if not points:
            return (0, 0, 0, 0)
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        return (min(xs), min(ys), max(xs), max(ys))
