from typing import Any

from sqlalchemy import JSON, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from takeoff.db import Base


class Pattern(Base):
    """
    A recognized drawing object inside a view.
    A pattern is NOT a material instance — it is what the software sees in the drawing.
    Material instances are created from patterns + callout associations.
    """

    __tablename__ = "patterns"

    pattern_id: Mapped[str] = mapped_column(String, primary_key=True)
    view_id: Mapped[str] = mapped_column(ForeignKey("views.view_id"))
    pattern_class: Mapped[str] = mapped_column(String)  # e.g. "steel_beam"
    geometry: Mapped[dict[str, Any]] = mapped_column(JSON)
    bbox_x1: Mapped[float | None] = mapped_column(Float)
    bbox_y1: Mapped[float | None] = mapped_column(Float)
    bbox_x2: Mapped[float | None] = mapped_column(Float)
    bbox_y2: Mapped[float | None] = mapped_column(Float)
    confidence: Mapped[float | None] = mapped_column(Float)

    view: Mapped["View"] = relationship(back_populates="patterns")  # type: ignore[name-defined]
    callout_associations: Mapped[list["CalloutAssociation"]] = relationship(  # type: ignore[name-defined]
        back_populates="pattern", cascade="all, delete-orphan"
    )
    material_instances: Mapped[list["MaterialInstance"]] = relationship(  # type: ignore[name-defined]
        back_populates="source_pattern", cascade="all, delete-orphan"
    )
