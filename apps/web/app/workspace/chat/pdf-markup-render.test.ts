import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TEXT_BOX_SIZE,
  MARKUP_SVG_VIEWBOX,
  isEditableKeyboardTarget,
  normalizedLineEndpoints,
  normalizedPolylinePoints,
  resolveRectSize,
} from './pdf-markup-render';

describe('pdf-markup-render', () => {
  it('maps normalized line coords to SVG viewBox units', () => {
    expect(normalizedLineEndpoints(0.1, 0.2, 0.5, 0.8)).toEqual({
      x1: 10,
      y1: 20,
      x2: 50,
      y2: 80,
    });
  });

  it('maps polygon points to viewBox polyline string', () => {
    expect(
      normalizedPolylinePoints([
        { x: 0.1, y: 0.1 },
        { x: 0.5, y: 0.2 },
        { x: 0.4, y: 0.6 },
      ]),
    ).toBe('10,10 50,20 40,60');
  });

  it('preserves drawn rect size when width/height are stored', () => {
    expect(resolveRectSize({ width: 0.12, height: 0.05 }, DEFAULT_TEXT_BOX_SIZE)).toEqual({
      width: 0.12,
      height: 0.05,
    });
  });

  it('uses defaults only when width/height are missing or zero', () => {
    expect(resolveRectSize({}, DEFAULT_TEXT_BOX_SIZE)).toEqual(DEFAULT_TEXT_BOX_SIZE);
    expect(resolveRectSize({ width: 0, height: 0 }, DEFAULT_TEXT_BOX_SIZE)).toEqual(DEFAULT_TEXT_BOX_SIZE);
  });

  it('uses numeric SVG viewBox for reliable line/marker rendering', () => {
    expect(MARKUP_SVG_VIEWBOX).toBe('0 0 100 100');
  });

  it('detects editable keyboard targets', () => {
    expect(isEditableKeyboardTarget(document.createElement('textarea'))).toBe(true);
    expect(isEditableKeyboardTarget(document.createElement('input'))).toBe(true);
    expect(isEditableKeyboardTarget(document.createElement('div'))).toBe(false);
  });
});
