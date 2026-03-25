"""
Phase 1 smoke test.

Drop a CAD-exported PDF at tests/fixtures/sample.pdf, then run:

    uv run pytest tests/test_ingestion.py -v

The test verifies:
1. The ingester runs without crashing (or raises NotImplementedError cleanly).
2. If Phase 1 IS implemented, at least one vector entity is extracted.
3. A Drawing record is persisted in the DB.
"""

from __future__ import annotations

import uuid
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from takeoff.db import Base
from takeoff.models.drawing import Drawing

# ---------------------------------------------------------------------------
# In-memory SQLite DB fixture (no PostgreSQL required for CI)
# ---------------------------------------------------------------------------

FIXTURE_PDF = Path(__file__).parent / "fixtures" / "sample.pdf"


@pytest.fixture()
def db():
    """Provide an in-memory SQLite session for each test."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_drawing_model_persists(db):
    """Basic sanity: Drawing ORM model can be saved and retrieved."""
    drawing_id = str(uuid.uuid4())
    d = Drawing(drawing_id=drawing_id, source_file="/tmp/test.pdf", sheet_number="S101")
    db.add(d)
    db.commit()

    retrieved = db.get(Drawing, drawing_id)
    assert retrieved is not None
    assert retrieved.sheet_number == "S101"


@pytest.mark.skipif(not FIXTURE_PDF.exists(), reason="No fixture PDF at tests/fixtures/sample.pdf")
def test_phase1_ingestion_smoke(db):
    """
    If a fixture PDF exists, run Phase 1 ingestion and assert at least one
    vector entity was extracted.

    Phase 1 is not yet implemented — this test will xfail until it is.
    """
    from takeoff.pipeline.phase1_ingestion.ingester import DrawingIngester

    drawing_id = str(uuid.uuid4())
    try:
        drawing = DrawingIngester(db).ingest(FIXTURE_PDF, drawing_id)
        db.commit()
    except NotImplementedError:
        pytest.xfail("Phase 1 ingestion not yet implemented")

    assert drawing is not None, "Ingester should return a Drawing"
    # Once implemented, at least one entity should exist.
    total_entities = sum(len(v.classified_entities) for v in drawing.views)
    assert total_entities > 0, "Expected at least one vector entity after ingestion"
