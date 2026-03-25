import enum
from typing import Any

from sqlalchemy import JSON, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from takeoff.db import Base


class Drawing(Base):
    """A single PDF sheet / source file."""

    __tablename__ = "drawings"

    drawing_id: Mapped[str] = mapped_column(String, primary_key=True)
    sheet_number: Mapped[str | None] = mapped_column(String)
    source_file: Mapped[str] = mapped_column(Text)  # path or object-storage key
    metadata_: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON)

    views: Mapped[list["View"]] = relationship(back_populates="drawing", cascade="all, delete-orphan")


class ViewType(str, enum.Enum):
    plan = "plan"
    section = "section"
    detail = "detail"
    elevation = "elevation"
    schedule = "schedule"
    unknown = "unknown"


class ViewStatus(str, enum.Enum):
    unprocessed = "unprocessed"
    in_progress = "in_progress"
    complete = "complete"


class View(Base):
    """A detected region on a drawing sheet (plan, section, detail, etc.)."""

    __tablename__ = "views"

    view_id: Mapped[str] = mapped_column(String, primary_key=True)
    drawing_id: Mapped[str] = mapped_column(ForeignKey("drawings.drawing_id"))
    view_type: Mapped[ViewType] = mapped_column(Enum(ViewType), default=ViewType.unknown)
    title: Mapped[str | None] = mapped_column(String)
    # bbox: [x1, y1, x2, y2] in PDF user units
    bbox_x1: Mapped[float | None] = mapped_column(Float)
    bbox_y1: Mapped[float | None] = mapped_column(Float)
    bbox_x2: Mapped[float | None] = mapped_column(Float)
    bbox_y2: Mapped[float | None] = mapped_column(Float)
    # Scale
    scale_text: Mapped[str | None] = mapped_column(String)   # e.g. "1/8in=1ft"
    scale_ratio: Mapped[float | None] = mapped_column(Float)  # numeric multiplier (paper→real)
    scale_confidence: Mapped[float | None] = mapped_column(Float)
    view_confidence: Mapped[float | None] = mapped_column(Float)
    status: Mapped[ViewStatus] = mapped_column(Enum(ViewStatus), default=ViewStatus.unprocessed)

    drawing: Mapped["Drawing"] = relationship(back_populates="views")
    classified_entities: Mapped[list["ClassifiedEntity"]] = relationship(
        back_populates="view", cascade="all, delete-orphan"
    )
    patterns: Mapped[list["Pattern"]] = relationship(  # type: ignore[name-defined]
        back_populates="view", cascade="all, delete-orphan"
    )


class EntityRole(str, enum.Enum):
    structural_member = "structural_member"
    grid_line = "grid_line"
    dimension_line = "dimension_line"
    hatch_pattern = "hatch_pattern"
    leader_line = "leader_line"
    annotation_text = "annotation_text"
    schedule_grid = "schedule_grid"
    title_block = "title_block"
    detail_bubble = "detail_bubble"
    section_cut = "section_cut"
    symbol = "symbol"
    unknown = "unknown"


class ClassifiedEntity(Base):
    """A vector entity extracted from the PDF and classified by role."""

    __tablename__ = "classified_entities"

    entity_id: Mapped[str] = mapped_column(String, primary_key=True)
    view_id: Mapped[str] = mapped_column(ForeignKey("views.view_id"))
    role: Mapped[EntityRole] = mapped_column(Enum(EntityRole))
    geometry_type: Mapped[str] = mapped_column(String)  # line|polyline|circle|text_block|polygon|arc
    geometry: Mapped[dict[str, Any]] = mapped_column(JSON)  # coordinate data
    bbox_x1: Mapped[float | None] = mapped_column(Float)
    bbox_y1: Mapped[float | None] = mapped_column(Float)
    bbox_x2: Mapped[float | None] = mapped_column(Float)
    bbox_y2: Mapped[float | None] = mapped_column(Float)
    properties: Mapped[dict[str, Any] | None] = mapped_column(JSON)  # role-specific extras
    classification_method: Mapped[str | None] = mapped_column(String)
    classification_confidence: Mapped[float | None] = mapped_column(Float)

    view: Mapped["View"] = relationship(back_populates="classified_entities")


# Avoid circular import — Pattern is defined in pattern.py
from takeoff.models.pattern import Pattern  # noqa: E402, F401

View.patterns = relationship(Pattern, back_populates="view", cascade="all, delete-orphan")
