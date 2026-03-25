from typing import Any

from sqlalchemy import JSON, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

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
    reference_bbox_x1: Mapped[float | None] = mapped_column(Float)  # for UI overlay
    reference_bbox_y1: Mapped[float | None] = mapped_column(Float)
    reference_bbox_x2: Mapped[float | None] = mapped_column(Float)
    reference_bbox_y2: Mapped[float | None] = mapped_column(Float)
    measurement_type: Mapped[str] = mapped_column(String, default="length")
    unit: Mapped[str] = mapped_column(String, default="LF")
    # Provenance
    source_sheet: Mapped[str | None] = mapped_column(String)
    source_view_title: Mapped[str | None] = mapped_column(String)
    crop_image_path: Mapped[str | None] = mapped_column(Text)  # path in object storage

    material_type: Mapped["MaterialType"] = relationship(back_populates="instances")
    source_pattern: Mapped["Pattern"] = relationship(back_populates="material_instances")  # type: ignore[name-defined]
    quantity: Mapped["Quantity | None"] = relationship(  # type: ignore[name-defined]
        back_populates="instance", uselist=False, cascade="all, delete-orphan"
    )
