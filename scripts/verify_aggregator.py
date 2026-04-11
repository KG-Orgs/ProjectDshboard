"""Quick verification helper for phase 10 summary grouping."""

import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from takeoff.db import Base
from takeoff.models.drawing import Drawing, View
from takeoff.models.material import MaterialInstance, MaterialType
from takeoff.models.quantity import Quantity
from takeoff.pipeline.phase10_reporting.aggregator import TakeoffAggregator


def main() -> None:
    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = Session()

    drawing_id = str(uuid.uuid4())
    drawing = Drawing(drawing_id=drawing_id, source_file='/tmp/test.pdf', sheet_number='S001')
    view_a = View(view_id=str(uuid.uuid4()), drawing=drawing, page_num=1, title='LEVEL 1', bbox_x1=0.0, bbox_y1=0.0, bbox_x2=100.0, bbox_y2=100.0)
    view_b = View(view_id=str(uuid.uuid4()), drawing=drawing, page_num=2, title='LEVEL 2', bbox_x1=0.0, bbox_y1=0.0, bbox_x2=100.0, bbox_y2=100.0)
    material = MaterialType(material_type_id=str(uuid.uuid4()), normalized_name='W10x77', category='structural_steel', default_measurement_basis='length', default_unit='LF')
    inst_a = MaterialInstance(instance_id=str(uuid.uuid4()), material_type=material, source_pattern_id=str(uuid.uuid4()), view=view_a, geometry={'kind':'line','points':[]}, unit='LF', source_sheet='S101', source_view_title=view_a.title)
    qty_a = Quantity(quantity_id=str(uuid.uuid4()), instance=inst_a, measurement_type='length', value=10.0, unit='LF', confidence=0.95)
    inst_b = MaterialInstance(instance_id=str(uuid.uuid4()), material_type=material, source_pattern_id=str(uuid.uuid4()), view=view_a, geometry={'kind':'line','points':[]}, unit='LF', source_sheet='S101', source_view_title=view_a.title)
    qty_b = Quantity(quantity_id=str(uuid.uuid4()), instance=inst_b, measurement_type='length', value=5.0, unit='LF', confidence=0.94)
    inst_c = MaterialInstance(instance_id=str(uuid.uuid4()), material_type=material, source_pattern_id=str(uuid.uuid4()), view=view_b, geometry={'kind':'line','points':[]}, unit='EA', source_sheet='S102', source_view_title=view_b.title)
    qty_c = Quantity(quantity_id=str(uuid.uuid4()), instance=inst_c, measurement_type='count', value=3.0, unit='EA', confidence=0.92)

    session.add_all([drawing, view_a, view_b, material, inst_a, qty_a, inst_b, qty_b, inst_c, qty_c])
    session.commit()
    result = TakeoffAggregator(session).aggregate(drawing_id)
    print(result)
    assert result['drawing_id'] == drawing_id
    assert result['status'] == 'ok'
    assert len(result['summary']) == 2
    assert result['summary'][0]['unit'] == 'EA'
    assert result['summary'][0]['total_value'] == 3.0
    assert result['summary'][1]['unit'] == 'LF'
    assert result['summary'][1]['total_value'] == 15.0
    print('ok')
    session.close()


if __name__ == '__main__':
    main()
