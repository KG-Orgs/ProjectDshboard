import enum
from typing import Any

from sqlalchemy import JSON, Boolean, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from takeoff.db import Base


class CalloutType(str, enum.Enum):
    material_designation = "material_designation"  # e.g. W10x77
    member_mark = "member_mark"                    # e.g. B12
    detail_ref = "detail_ref"                      # e.g. 3/S401
    section_ref = "section_ref"
    elevation_note = "elevation_note"
    dimension = "dimension"
    general_note = "general_note"
    unknown = "unknown"


class Callout(Base):
    """An annotation text block extracted from a view."""

    __tablename__ = "callouts"

    callout_id: Mapped[str] = mapped_column(String, primary_key=True)
    view_id: Mapped[str] = mapped_column(ForeignKey("views.view_id"))
    text: Mapped[str] = mapped_column(Text)
    bbox_x1: Mapped[float | None] = mapped_column(Float)
    bbox_y1: Mapped[float | None] = mapped_column(Float)
    bbox_x2: Mapped[float | None] = mapped_column(Float)
    bbox_y2: Mapped[float | None] = mapped_column(Float)
    font_size: Mapped[float | None] = mapped_column(Float)
    callout_type: Mapped[CalloutType] = mapped_column(Enum(CalloutType), default=CalloutType.unknown)
    confidence: Mapped[float | None] = mapped_column(Float)
    classification_method: Mapped[str | None] = mapped_column(String)
    nearby_texts: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON)


class AssociationMode(str, enum.Enum):
    leader = "leader"
    proximity = "proximity"
    typ_propagation = "typ_propagation"
    schedule_lookup = "schedule_lookup"
    detail_reference = "detail_reference"


class CalloutAssociation(Base):
    """
    Links a Pattern to a Callout with evidence and confidence.
    Priority order: leader > schedule_lookup > proximity (dominant) >
                    detail_reference > proximity (contested) > typ_propagation
    """

    __tablename__ = "callout_associations"

    association_id: Mapped[str] = mapped_column(String, primary_key=True)
    pattern_id: Mapped[str] = mapped_column(ForeignKey("patterns.pattern_id"))
    callout_id: Mapped[str | None] = mapped_column(ForeignKey("callouts.callout_id"), nullable=True)
    association_mode: Mapped[AssociationMode] = mapped_column(Enum(AssociationMode))
    confidence: Mapped[float] = mapped_column(Float)
    evidence: Mapped[dict[str, Any] | None] = mapped_column(JSON)  # mode-specific payload
    resolved_callout_type: Mapped[CalloutType | None] = mapped_column(Enum(CalloutType), nullable=True)
    resolved_material_text: Mapped[str | None] = mapped_column(String)
    material_type_id: Mapped[str | None] = mapped_column(ForeignKey("material_types.material_type_id"), nullable=True)
    is_override: Mapped[bool] = mapped_column(Boolean, default=False)
    flagged_for_review: Mapped[bool] = mapped_column(Boolean, default=False)
    review_reason: Mapped[str | None] = mapped_column(Text)

    pattern: Mapped["Pattern"] = relationship(back_populates="callout_associations")  # type: ignore[name-defined]
    material_type: Mapped["MaterialType"] = relationship()  # type: ignore[name-defined]


class ScheduleType(str, enum.Enum):
    beam = "beam"
    column = "column"
    footing = "footing"
    door = "door"
    window = "window"
    equipment = "equipment"
    generic = "generic"


class Schedule(Base):
    """A parsed schedule table found in a view."""

    __tablename__ = "schedules"

    schedule_id: Mapped[str] = mapped_column(String, primary_key=True)
    view_id: Mapped[str] = mapped_column(ForeignKey("views.view_id"))
    drawing_id: Mapped[str] = mapped_column(ForeignKey("drawings.drawing_id"))
    schedule_type: Mapped[ScheduleType] = mapped_column(Enum(ScheduleType), default=ScheduleType.generic)
    bbox_x1: Mapped[float | None] = mapped_column(Float)
    bbox_y1: Mapped[float | None] = mapped_column(Float)
    bbox_x2: Mapped[float | None] = mapped_column(Float)
    bbox_y2: Mapped[float | None] = mapped_column(Float)
    headers: Mapped[list[str] | None] = mapped_column(JSON)
    key_column: Mapped[str | None] = mapped_column(String)  # which header = member mark
    rows: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON)
    confidence: Mapped[float | None] = mapped_column(Float)

    members: Mapped[list["Member"]] = relationship(back_populates="schedule", cascade="all, delete-orphan")


class ResolutionStatus(str, enum.Enum):
    resolved = "resolved"
    partial = "partial"
    unresolved = "unresolved"


class Member(Base):
    """A member mark (e.g. B12) resolved to a MaterialType via a Schedule."""

    __tablename__ = "members"

    member_id: Mapped[str] = mapped_column(String, primary_key=True)
    mark: Mapped[str] = mapped_column(String)  # e.g. "B12"
    material_type_id: Mapped[str | None] = mapped_column(
        ForeignKey("material_types.material_type_id"), nullable=True
    )
    schedule_id: Mapped[str | None] = mapped_column(ForeignKey("schedules.schedule_id"), nullable=True)
    schedule_row_index: Mapped[int | None] = mapped_column(Integer)
    pattern_ids: Mapped[list[str] | None] = mapped_column(JSON)  # all views where this mark appears
    evidence_sources: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    resolution_status: Mapped[ResolutionStatus] = mapped_column(
        Enum(ResolutionStatus), default=ResolutionStatus.unresolved
    )

    schedule: Mapped["Schedule | None"] = relationship(back_populates="members")
