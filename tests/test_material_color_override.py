"""
API tests for material override color persistence.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from takeoff.api.main import app
from takeoff.db import Base, get_db
from takeoff.models.drawing import Drawing, View
from takeoff.models.material import MaterialInstance, MaterialType
from takeoff.models.quantity import Quantity


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


def test_material_override_api_persists_color(db):
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

    instance = MaterialInstance(
        instance_id=str(uuid.uuid4()),
        material_type=material,
        source_pattern_id=str(uuid.uuid4()),
        view_id=view.view_id,
        geometry={"kind": "line", "points": []},
        unit="LF",
        source_sheet="S101",
        source_view_title=view.title,
    )
    quantity = Quantity(
        quantity_id=str(uuid.uuid4()),
        instance=instance,
        measurement_type="length",
        value=5.0,
        unit="LF",
        confidence=0.95,
    )

    db.add_all([drawing, view, material, instance, quantity])
    db.commit()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    response = client.patch(
        f"/takeoff/materials/{material.material_type_id}",
        json={"override_color": "#00ff00"},
    )
    assert response.status_code == 200
    assert response.json()["override_color"] == "#00ff00"

    response = client.get(f"/takeoff/materials/drawing/{drawing_id}")
    assert response.status_code == 200
    materials = response.json()
    assert len(materials) == 1
    assert materials[0]["override_color"] == "#00ff00"

    app.dependency_overrides.clear()
