import type { CSSProperties } from 'react';

/** SVG overlay uses a 0–100 viewBox matching normalized page coordinates. */
export const MARKUP_SVG_VIEWBOX = '0 0 100 100';

export const MARKUP_SVG_LAYER_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
};

export const DEFAULT_TEXT_BOX_SIZE = { width: 0.15, height: 0.08 } as const;

export function normalizedLineEndpoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x1: number; y1: number; x2: number; y2: number } {
  return { x1: x1 * 100, y1: y1 * 100, x2: x2 * 100, y2: y2 * 100 };
}

export function normalizedPolylinePoints(points: Array<{ x: number; y: number }>): string {
  return points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ');
}

/** Use stored width/height when present; fall back only when missing or zero. */
export function resolveRectSize(
  coords: Record<string, unknown>,
  defaults: { width: number; height: number },
): { width: number; height: number } {
  const rawW = typeof coords.width === 'number' && Number.isFinite(coords.width) ? coords.width : 0;
  const rawH = typeof coords.height === 'number' && Number.isFinite(coords.height) ? coords.height : 0;
  return {
    width: rawW > 0 ? rawW : defaults.width,
    height: rawH > 0 ? rawH : defaults.height,
  };
}

export function percentRectStyle(
  x: number,
  y: number,
  width: number,
  height: number,
): CSSProperties {
  return {
    position: 'absolute',
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
    boxSizing: 'border-box',
  };
}

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable === true;
}
