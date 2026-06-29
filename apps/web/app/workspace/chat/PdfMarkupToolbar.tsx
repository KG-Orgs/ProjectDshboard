'use client';

import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Cloud,
  Download,
  FileSpreadsheet,
  Hand,
  Hash,
  Highlighter,
  MessageSquareText,
  Minus,
  MousePointer2,
  Pentagon,
  Ruler,
  Scale,
  Square,
  Stamp,
  Trash2,
  Type,
} from 'lucide-react';
import { formatScaleIndicator, type DocumentScale } from './pdf-scale';

export type MarkupToolbarTool =
  | 'select'
  | 'pan'
  | 'cloud'
  | 'arrow'
  | 'callout'
  | 'stamp'
  | 'text'
  | 'highlight'
  | 'line'
  | 'rectangle'
  | 'calibrate'
  | 'length'
  | 'area'
  | 'count';

type UnitOption = 'ft' | 'in' | 'yd' | 'sf' | 'cy' | 'm' | 'mm';

interface ToolDef {
  id: MarkupToolbarTool;
  label: string;
  title: string;
  Icon: LucideIcon;
}

const NAVIGATION_TOOLS: ToolDef[] = [
  { id: 'select', label: 'select', title: 'Select markup', Icon: MousePointer2 },
  { id: 'pan', label: 'pan', title: 'Pan (hand)', Icon: Hand },
];

const ANNOTATION_TOOLS: ToolDef[] = [
  { id: 'cloud', label: 'cloud', title: 'Revision cloud', Icon: Cloud },
  { id: 'arrow', label: 'arrow', title: 'Arrow', Icon: ArrowRight },
  { id: 'callout', label: 'callout', title: 'Callout with leader', Icon: MessageSquareText },
  { id: 'stamp', label: 'stamp', title: 'Construction stamp', Icon: Stamp },
  { id: 'text', label: 'text', title: 'Text box', Icon: Type },
  { id: 'highlight', label: 'highlight', title: 'Highlight', Icon: Highlighter },
  { id: 'line', label: 'line', title: 'Line', Icon: Minus },
  { id: 'rectangle', label: 'rectangle', title: 'Rectangle', Icon: Square },
];

const MEASUREMENT_TOOLS: ToolDef[] = [
  { id: 'calibrate', label: 'calibrate', title: 'Calibrate scale', Icon: Scale },
  { id: 'length', label: 'length', title: 'Measure length', Icon: Ruler },
  { id: 'area', label: 'area', title: 'Measure area', Icon: Pentagon },
  { id: 'count', label: 'count', title: 'Count marker', Icon: Hash },
];

function ToolButton({
  def,
  active,
  onClick,
}: {
  def: ToolDef;
  active: boolean;
  onClick: () => void;
}) {
  const { Icon } = def;
  return (
    <button
      type="button"
      className={`pdf-toolbar-btn${active ? ' pdf-toolbar-btn--active' : ''}`}
      aria-label={def.label}
      title={def.title}
      onClick={onClick}
    >
      <Icon size={15} strokeWidth={2} aria-hidden />
    </button>
  );
}

function ToolGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="pdf-toolbar-group" role="group" aria-label={label}>
      {children}
    </div>
  );
}

export interface PdfMarkupToolbarProps {
  tool: MarkupToolbarTool;
  onToolChange: (tool: MarkupToolbarTool) => void;
  stampLabels: readonly string[];
  selectedStampLabel: string;
  onStampLabelChange: (label: string) => void;
  unit: UnitOption;
  onUnitChange: (unit: UnitOption) => void;
  documentScale: DocumentScale | null;
  showFinishArea: boolean;
  onFinishArea: () => void;
  selectedMarkupId: string | null;
  onDeleteSelected: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
}

export default function PdfMarkupToolbar({
  tool,
  onToolChange,
  stampLabels,
  selectedStampLabel,
  onStampLabelChange,
  unit,
  onUnitChange,
  documentScale,
  showFinishArea,
  onFinishArea,
  selectedMarkupId,
  onDeleteSelected,
  onExportCsv,
  onExportExcel,
}: PdfMarkupToolbarProps) {
  const renderTools = (tools: ToolDef[]) =>
    tools.map((def) => (
      <ToolButton
        key={def.id}
        def={def}
        active={tool === def.id}
        onClick={() => onToolChange(def.id)}
      />
    ));

  return (
    <div className="pdf-markup-toolbar">
      <ToolGroup label="Navigation">{renderTools(NAVIGATION_TOOLS)}</ToolGroup>

      <div className="pdf-toolbar-divider" aria-hidden />

      <ToolGroup label="Annotation">{renderTools(ANNOTATION_TOOLS)}</ToolGroup>

      <div className="pdf-toolbar-divider" aria-hidden />

      <ToolGroup label="Measurement">{renderTools(MEASUREMENT_TOOLS)}</ToolGroup>

      {tool === 'stamp' ? (
        <select
          aria-label="Stamp preset"
          className="pdf-toolbar-select"
          value={selectedStampLabel}
          onChange={(e) => onStampLabelChange(e.target.value)}
        >
          {stampLabels.map((label) => (
            <option key={label} value={label}>{label}</option>
          ))}
        </select>
      ) : null}

      <select
        aria-label="Measurement unit"
        className="pdf-toolbar-select pdf-toolbar-select--compact"
        value={unit}
        onChange={(e) => onUnitChange(e.target.value as UnitOption)}
      >
        {(['ft', 'in', 'yd', 'sf', 'cy', 'm', 'mm'] as const).map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      {documentScale ? (
        <span className="pdf-scale-indicator" title="Drawing scale from calibration">
          {formatScaleIndicator(documentScale)}
        </span>
      ) : (
        <span className="pdf-scale-indicator pdf-scale-indicator--unset" title="Draw a calibrate line to set scale">
          No scale set
        </span>
      )}

      {showFinishArea ? (
        <button
          type="button"
          className="pdf-toolbar-btn pdf-toolbar-btn--success"
          onClick={onFinishArea}
        >
          Finish Area
        </button>
      ) : null}

      {selectedMarkupId ? (
        <button
          type="button"
          className="pdf-toolbar-btn pdf-toolbar-btn--danger"
          aria-label="Delete"
          title="Delete selected markup"
          onClick={onDeleteSelected}
        >
          <Trash2 size={15} strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      <div className="pdf-toolbar-spacer" />

      <ToolGroup label="Export">
        <button
          type="button"
          className="pdf-toolbar-btn pdf-toolbar-btn--labeled"
          aria-label="CSV"
          title="Export markups as CSV"
          onClick={onExportCsv}
        >
          <Download size={14} strokeWidth={2} aria-hidden />
          <span>CSV</span>
        </button>
        <button
          type="button"
          className="pdf-toolbar-btn pdf-toolbar-btn--labeled"
          aria-label="Excel"
          title="Export markups as Excel"
          onClick={onExportExcel}
        >
          <FileSpreadsheet size={14} strokeWidth={2} aria-hidden />
          <span>Excel</span>
        </button>
      </ToolGroup>
    </div>
  );
}
