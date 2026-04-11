"""
API tests for overlay-by-group highlighting.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from takeoff.api.main import app
from takeoff.db import Base, get_db
from takeoff.models.drawing import Drawing, View
from takeoff.models.material import MaterialInstance, MaterialType
from takeoff.models.quantity import Quantity


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


def test_overlay_by_group_returns_regions_with_color(db):
    drawing_id = str(uuid.uuid4())
    drawing = Drawing(drawing_id=drawing_id, source_file="/tmp/test.pdf", sheet_number="S101")
    view = View(
        view_id=str(uuid.uuid4()),
        drawing=drawing,
        page_num=1,
        title="LEVEL 1",
        bbox_x1=0.0,
        bbox_y1=0.0,
        bbox_x2=100.0,
        bbox_y2=100.0,
    )

    material = MaterialType(
        material_type_id=str(uuid.uuid4()),
        normalized_name="W10x77",
        category="structural_steel",
        default_measurement_basis="length",
        default_unit="LF",
    )

    instance_a = MaterialInstance(
        instance_id=str(uuid.uuid4()),
        material_type=material,
        source_pattern_id=str(uuid.uuid4()),
        view_id=view.view_id,
        geometry={"kind": "polygon", "points": [[0, 0], [10, 0], [10, 10], [0, 10]]},
        reference_bbox_x1=0.0,
        reference_bbox_y1=0.0,
        reference_bbox_x2=10.0,
        reference_bbox_y2=10.0,
        unit="LF",
        source_sheet="S101",
        source_view_title=view.title,
    )
    quantity_a = Quantity(
        quantity_id=str(uuid.uuid4()),
        instance=instance_a,
        measurement_type="length",
        value=10.0,
        unit="LF",
        confidence=0.95,
    )

    instance_b = MaterialInstance(
        instance_id=str(uuid.uuid4()),
        material_type=material,
        source_pattern_id=str(uuid.uuid4()),
        view_id=view.view_id,
        geometry={"kind": "polygon", "points": [[20, 20], [30, 20], [30, 30], [20, 30]]},
        reference_bbox_x1=20.0,
        reference_bbox_y1=20.0,
        reference_bbox_x2=30.0,
        reference_bbox_y2=30.0,
        unit="LF",
        source_sheet="S101",
        source_view_title=view.title,
    )
    quantity_b = Quantity(
        quantity_id=str(uuid.uuid4()),
        instance=instance_b,
        measurement_type="length",
        value=15.0,
        unit="LF",
        confidence=0.96,
    )

    db.add_all([drawing, view, material, instance_a, quantity_a, instance_b, quantity_b])
    db.commit()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.get(f"/takeoff/{drawing_id}/overlay-by-group/W10x77")
    data = response.json()

    assert response.status_code == 200
    assert data["drawing_id"] == drawing_id
    assert data["material"] == "W10x77"
    assert data["color"].startswith("#")
    assert len(data["regions"]) == 2
    assert {region["instance_id"] for region in data["regions"]} == {
        instance_a.instance_id,
        instance_b.instance_id,
    }

    for region in data["regions"]:
        assert region["material"] == "W10x77"
        assert region["category"] == "structural_steel"
        assert region["geometry"]["kind"] == "polygon"
        assert region["reference_bbox"]["x1"] is not None

    app.dependency_overrides.clear()


def test_overlay_by_group_missing_material_returns_404(db):
    drawing_id = str(uuid.uuid4())
    drawing = Drawing(drawing_id=drawing_id, source_file="/tmp/test.pdf", sheet_number="S101")
    db.add(drawing)
    db.commit()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.get(f"/takeoff/{drawing_id}/overlay-by-group/UNKNOWN")

    assert response.status_code == 404
    assert response.json()["detail"] == "Material group 'UNKNOWN' not found in drawing."

    app.dependency_overrides.clear()
