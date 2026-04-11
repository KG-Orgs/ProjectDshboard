from typing import Any, Optional

from sqlalchemy import JSON, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from takeoff.db import Base


class MaterialType(Base):
    """
    A normalized material designation (e.g. W10x77).
    Multiple material instances may share one material type.
    """

    __tablename__ = "material_types"

    material_type_id: Mapped[str] = mapped_column(String, primary_key=True)
    normalized_name: Mapped[str] = mapped_column(String, index=True)  # e.g. "W10x77"
    category: Mapped[str] = mapped_column(String)                      # e.g. "structural_steel"
    default_measurement_basis: Mapped[str] = mapped_column(String, default="length")  # length|area|volume|count
    default_unit: Mapped[str] = mapped_column(String, default="LF")

    instances: Mapped[list["MaterialInstance"]] = relationship(
        back_populates="material_type", cascade="all, delete-orphan"
    )


class MaterialInstance(Base):
    """
    A distinct measurable occurrence of a MaterialType in the drawing.
    Quantity attaches here, NOT to the material type.
    One pattern → one material instance (geometry-disconnection rules apply).
    """

    __tablename__ = "material_instances"

    instance_id: Mapped[str] = mapped_column(String, primary_key=True)
    material_type_id: Mapped[str] = mapped_column(ForeignKey("material_types.material_type_id"))
    source_pattern_id: Mapped[str] = mapped_column(ForeignKey("patterns.pattern_id"))
    view_id: Mapped[str] = mapped_column(ForeignKey("views.view_id"))
    geometry: Mapped[dict[str, Any]] = mapped_column(JSON)          # {kind, points}
    reference_bbox_x1: Mapped[Optional[float]] = mapped_column(Float)  # for UI overlay
    reference_bbox_y1: Mapped[Optional[float]] = mapped_column(Float)
    reference_bbox_x2: Mapped[Optional[float]] = mapped_column(Float)
    reference_bbox_y2: Mapped[Optional[float]] = mapped_column(Float)
    measurement_type: Mapped[str] = mapped_column(String, default="length")
    unit: Mapped[str] = mapped_column(String, default="LF")
    # Provenance
    source_sheet: Mapped[Optional[str]] = mapped_column(String)
    source_view_title: Mapped[Optional[str]] = mapped_column(String)
    crop_image_path: Mapped[Optional[str]] = mapped_column(Text)  # path in object storage

    material_type: Mapped["MaterialType"] = relationship(back_populates="instances")
    source_pattern: Mapped["Pattern"] = relationship(back_populates="material_instances")  # type: ignore[name-defined]
    view: Mapped["View"] = relationship("View")  # type: ignore[name-defined]
    quantity: Mapped[Optional["Quantity"]] = relationship(  # type: ignore[name-defined]
        back_populates="instance", uselist=False, cascade="all, delete-orphan"
    )
    color_override: Mapped[Optional["MaterialColorOverride"]] = relationship(  # type: ignore[name-defined]
        back_populates="instance", uselist=False, cascade="all, delete-orphan"
    )


class MaterialColorOverride(Base):
    """
    User-chosen color override for a material group in a drawing.
    Persists user selections across refreshes and exports.
    """

    __tablename__ = "material_color_overrides"

    override_id: Mapped[str] = mapped_column(String, primary_key=True)  # UUID
    drawing_id: Mapped[str] = mapped_column(ForeignKey("drawings.drawing_id"), index=True)
    material_group: Mapped[str] = mapped_column(String, index=True)  # normalized_name
    color_hex: Mapped[str] = mapped_column(String)  # e.g. "#FF5733"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
