export interface Point {
  x: number;
  y: number;
}

/** Real-world scale derived from a calibration reference line on the drawing. */
export interface DocumentScale {
  realValue: number;
  unit: string;
  /** Distance of the calibration line in page-space points (aspect-ratio aware). */
  pageSpaceCalibrationDistance: number;
}

export const LENGTH_UNITS = ['ft', 'in', 'yd', 'm', 'mm'] as const;
export type LengthUnit = (typeof LENGTH_UNITS)[number];

export const DEFAULT_PAGE_WIDTH = 612;
export const DEFAULT_PAGE_HEIGHT = 792;

export function pageDimensionsFromRotation(rotation: number): { width: number; height: number } {
  if (rotation % 180 === 0) {
    return { width: DEFAULT_PAGE_WIDTH, height: DEFAULT_PAGE_HEIGHT };
  }
  return { width: DEFAULT_PAGE_HEIGHT, height: DEFAULT_PAGE_WIDTH };
}

export function pageSpaceDistance(
  p1: Point,
  p2: Point,
  pageWidth: number,
  pageHeight: number,
): number {
  const dx = (p2.x - p1.x) * pageWidth;
  const dy = (p2.y - p1.y) * pageHeight;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pageSpacePolygonArea(points: Point[], pageWidth: number, pageHeight: number): number {
  if (points.length < 3) return 0;
  let acc = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    acc += points[i].x * pageWidth * points[j].y * pageHeight
      - points[j].x * pageWidth * points[i].y * pageHeight;
  }
  return Math.abs(acc / 2);
}

export function scaleFactor(scale: DocumentScale): number {
  if (scale.pageSpaceCalibrationDistance <= 0 || scale.realValue <= 0) return 0;
  return scale.realValue / scale.pageSpaceCalibrationDistance;
}

export function calibratedLengthFromLineCoords(
  coords: { x1: number; y1: number; x2: number; y2: number },
  scale: DocumentScale,
  pageWidth: number,
  pageHeight: number,
): number {
  const dist = pageSpaceDistance(
    { x: coords.x1, y: coords.y1 },
    { x: coords.x2, y: coords.y2 },
    pageWidth,
    pageHeight,
  );
  return dist * scaleFactor(scale);
}

export function calibratedAreaFromPoints(
  points: Point[],
  scale: DocumentScale,
  pageWidth: number,
  pageHeight: number,
): number {
  const area = pageSpacePolygonArea(points, pageWidth, pageHeight);
  const factor = scaleFactor(scale);
  return area * factor * factor;
}

export function formatMeasurementValue(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

export function areaDisplayUnit(unit: string): string {
  const map: Record<string, string> = {
    ft: 'sf',
    in: 'sq in',
    yd: 'sy',
    m: 'sq m',
    mm: 'sq mm',
    sf: 'sf',
    cy: 'cy',
  };
  return map[unit] ?? `sq ${unit}`;
}

export function scaleStorageKey(fileId: string): string {
  return `contractorai-pdf-scale:${fileId}`;
}

export function loadDocumentScale(fileId: string | undefined): DocumentScale | null {
  if (!fileId || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(scaleStorageKey(fileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DocumentScale;
    if (
      typeof parsed.realValue === 'number'
      && parsed.realValue > 0
      && typeof parsed.unit === 'string'
      && typeof parsed.pageSpaceCalibrationDistance === 'number'
      && parsed.pageSpaceCalibrationDistance > 0
    ) {
      return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function saveDocumentScale(fileId: string | undefined, scale: DocumentScale): void {
  if (!fileId || typeof window === 'undefined') return;
  localStorage.setItem(scaleStorageKey(fileId), JSON.stringify(scale));
}

export function clearDocumentScale(fileId: string | undefined): void {
  if (!fileId || typeof window === 'undefined') return;
  localStorage.removeItem(scaleStorageKey(fileId));
}

export function formatScaleIndicator(scale: DocumentScale): string {
  return `Scale: ${formatMeasurementValue(scale.realValue)} ${scale.unit}`;
}

/** Build scale from a persisted calibrate markup (fallback when localStorage is empty). */
export function scaleFromCalibrateMarkup(
  coordinates: Record<string, unknown>,
  measurement: { calibration?: { realValue?: number; unit?: string }; unit?: string; value?: number } | undefined,
  pageWidth: number,
  pageHeight: number,
): DocumentScale | null {
  const realValue = measurement?.calibration?.realValue ?? measurement?.value;
  const unit = measurement?.calibration?.unit ?? measurement?.unit;
  if (typeof realValue !== 'number' || realValue <= 0 || !unit) return null;

  const x1 = typeof coordinates.x1 === 'number' ? coordinates.x1 : 0;
  const y1 = typeof coordinates.y1 === 'number' ? coordinates.y1 : 0;
  const x2 = typeof coordinates.x2 === 'number' ? coordinates.x2 : 0;
  const y2 = typeof coordinates.y2 === 'number' ? coordinates.y2 : 0;
  const pageSpaceCalibrationDistance = pageSpaceDistance({ x: x1, y: y1 }, { x: x2, y: y2 }, pageWidth, pageHeight);
  if (pageSpaceCalibrationDistance <= 0) return null;

  return { realValue, unit, pageSpaceCalibrationDistance };
}
