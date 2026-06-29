import { describe, expect, it } from 'vitest';
import {
  areaDisplayUnit,
  calibratedAreaFromPoints,
  calibratedLengthFromLineCoords,
  DEFAULT_PAGE_HEIGHT,
  DEFAULT_PAGE_WIDTH,
  formatMeasurementValue,
  pageSpaceDistance,
  pageSpacePolygonArea,
  scaleFactor,
  type DocumentScale,
} from './pdf-scale';

const TEN_FOOT_SCALE: DocumentScale = {
  realValue: 10,
  unit: 'ft',
  pageSpaceCalibrationDistance: 100,
};

describe('pdf-scale calibration math', () => {
  it('computes page-space distance with aspect ratio', () => {
    const dist = pageSpaceDistance(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      DEFAULT_PAGE_WIDTH,
      DEFAULT_PAGE_HEIGHT,
    );
    expect(dist).toBeCloseTo(DEFAULT_PAGE_WIDTH, 5);
  });

  it('scale factor is real value divided by calibration distance', () => {
    expect(scaleFactor(TEN_FOOT_SCALE)).toBe(0.1);
  });

  it('calibrated length matches known scale on horizontal line', () => {
    // 0.5 page width = 306 pt; at 100 pt = 10 ft, 306 pt = 30.6 ft
    const length = calibratedLengthFromLineCoords(
      { x1: 0, y1: 0.5, x2: 0.5, y2: 0.5 },
      TEN_FOOT_SCALE,
      DEFAULT_PAGE_WIDTH,
      DEFAULT_PAGE_HEIGHT,
    );
    expect(length).toBeCloseTo(30.6, 1);
  });

  it('calibrated length is proportional to drawn line length', () => {
    const short = calibratedLengthFromLineCoords(
      { x1: 0.1, y1: 0.1, x2: 0.2, y2: 0.1 },
      TEN_FOOT_SCALE,
      DEFAULT_PAGE_WIDTH,
      DEFAULT_PAGE_HEIGHT,
    );
    const long = calibratedLengthFromLineCoords(
      { x1: 0.1, y1: 0.1, x2: 0.4, y2: 0.1 },
      TEN_FOOT_SCALE,
      DEFAULT_PAGE_WIDTH,
      DEFAULT_PAGE_HEIGHT,
    );
    expect(long).toBeCloseTo(short * 3, 5);
  });

  it('calibrated area scales with square of calibration factor', () => {
    const square = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.1 },
      { x: 0.2, y: 0.2 },
      { x: 0.1, y: 0.2 },
    ];
    const pageArea = pageSpacePolygonArea(square, DEFAULT_PAGE_WIDTH, DEFAULT_PAGE_HEIGHT);
    const realArea = calibratedAreaFromPoints(
      square,
      TEN_FOOT_SCALE,
      DEFAULT_PAGE_WIDTH,
      DEFAULT_PAGE_HEIGHT,
    );
    expect(realArea).toBeCloseTo(pageArea * scaleFactor(TEN_FOOT_SCALE) ** 2, 5);
  });

  it('formats measurement values to two decimal places', () => {
    expect(formatMeasurementValue(12.3456)).toBe(12.35);
  });

  it('maps length units to area display units', () => {
    expect(areaDisplayUnit('ft')).toBe('sf');
    expect(areaDisplayUnit('m')).toBe('sq m');
    expect(areaDisplayUnit('sf')).toBe('sf');
  });
});
