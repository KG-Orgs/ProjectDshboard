"""
Takeoff pipeline trigger and results endpoints.

POST /takeoff/{drawing_id}/run     — trigger the full MVP pipeline for a drawing
GET  /takeoff/{drawing_id}/results — return aggregated takeoff JSON
"""

from __future__ import annotations

import hashlib
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from takeoff.db import get_db
from takeoff.models.drawing import Drawing, View
from takeoff.models.material import MaterialInstance, MaterialType, MaterialColorOverride

router = APIRouter()


class ColorOverrideRequest(BaseModel):
    """Request to set a color override for a material group."""
    color_hex: str  # e.g. "#FF5733"


class ColorOverrideResponse(BaseModel):
    """Response with color override details."""
    drawing_id: str
    material_group: str
    color_hex: str
    created_at: str
    updated_at: str


def _get_color_for_material_group(drawing_id: str, material_group: str, db: Session) -> str:
    """
    Get color for a material group.
    Returns user override if set, otherwise generates deterministic color.
    """
    override = (
        db.query(MaterialColorOverride)
        .filter(
            MaterialColorOverride.drawing_id == drawing_id,
            MaterialColorOverride.material_group == material_group,
        )
        .first()
    )
    if override:
        return override.color_hex
    return _color_for_material_group(material_group)


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


def _hsl_to_hex(hue: int, saturation: int, lightness: int) -> str:
    h = hue / 360.0
    s = saturation / 100.0
    l = lightness / 100.0
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h * 6) % 2 - 1))
    m = l - c / 2

    if h < 1 / 6:
        r1, g1, b1 = c, x, 0
    elif h < 2 / 6:
        r1, g1, b1 = x, c, 0
    elif h < 3 / 6:
        r1, g1, b1 = 0, c, x
    elif h < 4 / 6:
        r1, g1, b1 = 0, x, c
    elif h < 5 / 6:
        r1, g1, b1 = x, 0, c
    else:
        r1, g1, b1 = c, 0, x

    r = round((r1 + m) * 255)
    g = round((g1 + m) * 255)
    b = round((b1 + m) * 255)
    return f"#{r:02x}{g:02x}{b:02x}"


def _color_for_material_group(material_group: str) -> str:
    digest = hashlib.sha256(material_group.encode("utf-8")).digest()
    hue = int.from_bytes(digest[:2], "big") % 360
    return _hsl_to_hex(hue, saturation=72, lightness=58)


@router.get("/{drawing_id}/overlay-by-group/{material_group}")
def get_overlay_by_material_group(
    drawing_id: str,
    material_group: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    drawing = db.get(Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")

    instances = (
        db.query(MaterialInstance)
        .join(MaterialType)
        .join(View)
        .filter(View.drawing_id == drawing_id)
        .filter(MaterialType.normalized_name == material_group)
        .all()
    )

    if not instances:
        raise HTTPException(
            status_code=404,
            detail=f"Material group '{material_group}' not found in drawing.",
        )

    return {
        "drawing_id": drawing_id,
        "material": material_group,
        "color": _get_color_for_material_group(drawing_id, material_group, db),
        "regions": [
            {
                "instance_id": instance.instance_id,
                "material_type_id": instance.material_type_id,
                "material": instance.material_type.normalized_name,
                "category": instance.material_type.category,
                "view_id": instance.view_id,
                "view_title": instance.source_view_title,
                "pattern_id": instance.source_pattern_id,
                "geometry": instance.geometry,
                "reference_bbox": {
                    "x1": instance.reference_bbox_x1,
                    "y1": instance.reference_bbox_y1,
                    "x2": instance.reference_bbox_x2,
                    "y2": instance.reference_bbox_y2,
                },
                "source_sheet": instance.source_sheet,
            }
            for instance in instances
        ],
    }


@router.post("/{drawing_id}/color-override/{material_group}")
def set_color_override(
    drawing_id: str,
    material_group: str,
    request: ColorOverrideRequest,
    db: Session = Depends(get_db),
) -> ColorOverrideResponse:
    """
    Set a user-chosen color override for a material group in a drawing.
    Persists across refreshes and exports.
    """
    drawing = db.get(Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")

    # Check if override already exists
    existing = (
        db.query(MaterialColorOverride)
        .filter(
            MaterialColorOverride.drawing_id == drawing_id,
            MaterialColorOverride.material_group == material_group,
        )
        .first()
    )

    if existing:
        existing.color_hex = request.color_hex
        override = existing
    else:
        override = MaterialColorOverride(
            override_id=str(uuid.uuid4()),
            drawing_id=drawing_id,
            material_group=material_group,
            color_hex=request.color_hex,
        )
        db.add(override)

    db.commit()
    db.refresh(override)

    return ColorOverrideResponse(
        drawing_id=override.drawing_id,
        material_group=override.material_group,
        color_hex=override.color_hex,
        created_at=override.created_at.isoformat(),
        updated_at=override.updated_at.isoformat(),
    )


@router.get("/{drawing_id}/color-override/{material_group}")
def get_color_override(
    drawing_id: str,
    material_group: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Get the color (override or auto-generated) for a material group.
    """
    drawing = db.get(Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")

    override = (
        db.query(MaterialColorOverride)
        .filter(
            MaterialColorOverride.drawing_id == drawing_id,
            MaterialColorOverride.material_group == material_group,
        )
        .first()
    )

    return {
        "drawing_id": drawing_id,
        "material_group": material_group,
        "color_hex": override.color_hex if override else _color_for_material_group(material_group),
        "is_override": override is not None,
    }


@router.delete("/{drawing_id}/color-override/{material_group}")
def remove_color_override(
    drawing_id: str,
    material_group: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Remove a color override for a material group, reverting to auto-generated color.
    """
    drawing = db.get(Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")

    override = (
        db.query(MaterialColorOverride)
        .filter(
            MaterialColorOverride.drawing_id == drawing_id,
            MaterialColorOverride.material_group == material_group,
        )
        .first()
    )

    if not override:
        raise HTTPException(
            status_code=404,
            detail=f"No color override found for material group '{material_group}'.",
        )

    db.delete(override)
    db.commit()

    return {
        "drawing_id": drawing_id,
        "material_group": material_group,
        "status": "removed",
        "color_hex": _color_for_material_group(material_group),
    }


@router.get("/{drawing_id}/color-overrides")
def get_all_color_overrides(
    drawing_id: str,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    Get all color overrides for a drawing.
    """
    drawing = db.get(Drawing, drawing_id)
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found.")

    overrides = (
        db.query(MaterialColorOverride)
        .filter(MaterialColorOverride.drawing_id == drawing_id)
        .all()
    )

    return {
        "drawing_id": drawing_id,
        "overrides": [
            {
                "material_group": override.material_group,
                "color_hex": override.color_hex,
                "created_at": override.created_at.isoformat(),
                "updated_at": override.updated_at.isoformat(),
            }
            for override in overrides
        ],
    }
