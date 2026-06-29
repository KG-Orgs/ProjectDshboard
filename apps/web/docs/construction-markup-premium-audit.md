# Construction Markup Premium Audit — ContractorAI

**Branch:** `feat/frontend-chat-viewer-improvements`  
**Date:** 2026-06-29  
**Scope:** Markup/annotation capabilities vs. professional construction PDF software  
**Companion doc:** [pdf-viewer-gap-audit.md](./pdf-viewer-gap-audit.md) (viewer navigation, search, performance)  
**Primary code:** `apps/web/app/workspace/chat/ConstructionPdfViewer.tsx`

---

## 1. Executive Summary

ContractorAI has **more markup ambition than most web-based AI chat viewers**, but it is **not yet premium construction markup software**. The backend data model and construction-oriented categories/statuses are a solid foundation; the frontend implements a credible v1 tool palette. The experience falls short of Bluebeam, Procore Drawings, or Autodesk Build because of **mode-split UX**, **non-calibrated measurements**, **no collaboration**, and **missing construction staples** (stamps, callouts, photos, revision compare, layers, PDF export with markups).

**Maturity vs. construction benchmarks (markup-focused):**

| Dimension | ContractorAI | Bluebeam Revu | Procore / Autodesk Build | Adobe Acrobat Pro |
|-----------|--------------|---------------|--------------------------|-------------------|
| Tool breadth | ~45% | Baseline | ~70% (platform-integrated) | ~55% (general-purpose) |
| Markup UX & discoverability | ~30% | Baseline | ~75% | ~65% |
| Measurements / takeoffs | ~20% | Baseline | ~50% | ~35% |
| Punch / issue workflow | ~40% (table + statuses) | Baseline | ~85% (linked to PM tools) | ~25% |
| Collaboration | ~5% | Baseline | ~80% | ~40% |
| Export / reporting | ~35% (CSV/Excel only) | Baseline | ~70% | ~60% |
| AI + citation integration | ~80% (differentiator) | Weak / N/A | Weak / N/A | Weak / N/A |

**Bottom line for shipping broadly:** Treat markup as **early beta**. A superintendent or PM comparing us to Bluebeam on day one will notice: markups hidden behind a toggle, **cannot mark up in default scroll mode**, measurements that don't respect drawing scale, no stamps/callouts/photos, and no way to export a marked-up PDF for the record set.

**Strategic position:** ContractorAI's wedge is **AI-driven plan review with citation jump** — not yet a Bluebeam replacement. Premium feel requires closing the **P0 UX fractures** (continuous markup, tool palette polish, calibrated measurements) before marketing markup as a headline feature.

---

## 2. Current ContractorAI Markup Inventory

### 2.1 Architecture

| Layer | Location | Notes |
|-------|----------|-------|
| Viewer UI | `apps/web/app/workspace/chat/ConstructionPdfViewer.tsx` | ~1,055 lines; tools, render, persistence calls, export triggers |
| Next.js API proxy | `apps/web/app/api/projects/[id]/files/[fileId]/markups/**` | Proxies to backend with session auth |
| Backend routes | `packages/backend/src/server.ts` (lines ~619–769) | GET/POST/PATCH/DELETE + export |
| Service | `packages/backend/src/services/pdf-markup.service.ts` | CRUD; in-memory fallback when DB unavailable |
| Schema | `packages/backend/drizzle/0011_pdf_markups.sql`, `packages/backend/src/db/schema.ts` | `pdf_markups` table |
| Shared types | None in `packages/shared` | Types duplicated in viewer + backend service |
| Tests | `apps/web/app/workspace/chat/ConstructionPdfViewer.test.tsx` | Move/resize handles, continuous scroll; no continuous-markup tests |

### 2.2 Persistence Model

Markups are stored **independently from the PDF file** — overlay geometry and metadata in Postgres, not embedded in the PDF.

```
pdf_markups
├── id (UUID)
├── project_id, file_id (FK, cascade delete)
├── page_number
├── type (free text: cloud, arrow, length, …)
├── coordinates (JSONB — normalized 0–1 page space)
├── measurement (JSONB — kind, value, unit, calibration)
├── category, status, comment, assigned_to
├── created_by, created_at, updated_at
```

**Load:** `GET /api/projects/:id/files/:fileId/markups` on `url`/`fileId` change.  
**Create:** `POST` with page, type, coordinates, optional measurement; defaults `category: General Comment`, `status: Open`, `createdBy` from session.  
**Update:** `PATCH` for coordinates (after drag), comment (on blur), status/category/assignee (on change).  
**Delete:** `DELETE` selected markup.

**Fallback behavior:**
- Backend: in-memory `Map` when DB not initialized (`pdf-markup.service.ts`).
- Frontend: local-only markups (`local-*` ids) when `projectId`/`fileId` missing or API fails — **not persisted across refresh**.

**Not implemented:** versioning, audit trail beyond `updated_at`, optimistic locking, multi-user sync, markup layers, publish vs. personal draft state.

### 2.3 Tool Capability Matrix

Coordinates are **normalized to page width/height (0–1)**. All geometry survives zoom/rotation rendering because overlay is percentage-based.

| Tool | Implemented | Interactive create | Interactive edit (move/resize) | Visible in continuous scroll | Persists (DB) | In CSV/Excel export | Key limitations |
|------|-------------|-------------------|-------------------------------|------------------------------|---------------|---------------------|-----------------|
| **Select** | ✅ | Single mode | Single mode — handles on selected markup | View only; no selection | N/A | N/A | No multi-select; no box-select |
| **Pan (Hand)** | ✅ | Single mode only | N/A | ❌ | N/A | N/A | Continuous scroll uses native browser scroll only |
| **Cloud** | ✅ | Single mode | ✅ corners + move | View only (`pointerEvents: none`) | ✅ | ✅ (type, metadata) | Dashed rounded rect — not true revision-cloud SVG path |
| **Arrow** | ✅ | Single mode drag | ✅ endpoints p1/p2 | View only | ✅ | ✅ | No callout box / leader text |
| **Text** | ✅ | Single mode drag rect | ✅ corners + move | View only | ✅ | ✅ | Shows `comment` or placeholder "Text"; no rich text, no font control; comment edited in table not on-canvas |
| **Highlight** | ✅ | Single mode drag | ✅ corners + move | View only | ✅ | ✅ | Fixed yellow; no color picker |
| **Line** | ✅ | Single mode drag | ✅ endpoints | View only | ✅ | ✅ | No polyline, no orthogonal snap |
| **Rectangle** | ✅ | Single mode drag | ✅ corners + move | View only | ✅ | ✅ | No fill styles, line weights |
| **Calibrate** | ✅ | Single mode drag line | ✅ endpoints | View only | ✅ | ✅ | **Hardcoded `realValue: 10`**; not applied to other tools; no per-sheet scale store |
| **Length** | ✅ | Single mode drag | ✅ endpoints | View only | ✅ | ✅ | **Value = pixel distance × 100** — not calibrated; unit selector cosmetic until calibration chain exists |
| **Area** | ✅ | Multi-click polygon + "Finish Area" | ❌ no handles | View only | ✅ | ✅ | **Value = polygon area × 10000**; no vertex edit after create |
| **Count** | ✅ | Single click | ✅ move handle | View only | ✅ | ✅ | Fixed red dot; no running total UI; no count symbol library |

### 2.4 Metadata & Workflow Fields

**Categories (construction-oriented):** RFI, Design Conflict, QC Issue, Field Verify, Change Order Potential, Submittal Comment, Safety Issue, General Comment.

**Statuses:** Open, In Review, Answered, Closed, Void.

**Per-markup fields:** comment, assignedTo (free text), createdBy, createdAt, updatedAt.

**Markup table panel:** Filter by status, category, page, assignee; sort by page, date, status, category. Resizable, **collapsed by default**.

**Sidebar Markups tab:** List with jump-to-page; collapsed sidebar by default.

### 2.5 Scroll Mode Behavior (Critical UX Fracture)

| Capability | Single-page mode | Continuous scroll (default) |
|------------|------------------|----------------------------|
| View existing markups | ✅ | ✅ (read-only overlay) |
| Create new markups | ✅ | ❌ |
| Select / edit markups | ✅ | ❌ |
| Pan document | ✅ (Hand tool) | Native scroll only |
| Draw draft preview | ✅ | ❌ |
| Citation bounding-box flash | ✅ | ✅ (per-page overlay) |

Root cause: continuous mode overlay uses `pointerEvents: 'none'` and lacks `pageHostRef` / draw handlers (`ConstructionPdfViewer.tsx` ~948–971 vs ~896–947).

### 2.6 Export & Download

| Export | Supported | Implementation |
|--------|-----------|----------------|
| **CSV** | ✅ | `GET .../markups/export?format=csv` — Papa Parse |
| **Excel (.xlsx)** | ✅ | Same route, SheetJS |
| **PDF with markups burned in** | ❌ | "Save" downloads **original PDF URL only** |
| **PDF markup summary report** | ❌ | Bluebeam-style hyperlinked summary |
| **XFDF / FDF** | ❌ | No interchange with external tools |
| **XML** | ❌ | Bluebeam supports XML export |

Export columns: projectName, fileName, pageNumber, markupType, category, comment, status, assignedTo, createdBy, createdDate, updatedDate, measurementValue, measurementUnit.

### 2.7 What Works Well (Differentiators)

- Construction-specific **category taxonomy** and **status workflow** in schema + UI.
- **Markup table** with inline edit — closer to Bluebeam Markups List than browser PDF.
- **API-backed persistence** per project/file — foundation for multi-user.
- **Citation flash** + optional `textSnippet` search — AI-native review loop.
- **Normalized coordinates** — correct approach for responsive overlay.
- Move/resize handles with PATCH on mouse-up — solid single-mode interaction pattern.

---

## 3. Construction Industry Expectations (by Workflow)

### 3.1 Design / Submittal Review (Office)

**Expectation:** Redline conflicts, cloud revisions, link comments to spec sections, compare revision sets, stamp "Approved as noted," export marked PDF for record.

| Need | Industry standard | ContractorAI today |
|------|-------------------|-------------------|
| Revision clouds | Standard markup | ⚠️ Rectangular dashed "cloud" — not arc-based cloud |
| Callouts with leader | Bluebeam, Acrobat | ❌ |
| Stamps (APPROVED, REVISE & RESUBMIT) | All pro tools | ❌ |
| Compare two drawing versions | Bluebeam, Acrobat, Autodesk Build | ❌ |
| Text select / copy from spec | Acrobat, Bluebeam | ❌ in continuous mode |
| Link markup → RFI / submittal record | Procore, Autodesk Build | ❌ (category only) |

### 3.2 Punch List / Field Deficiency (Field + Closeout)

**Expectation:** Place punch symbol, photo attachment, assign trade, status color coding, filter by area/level, export punch report for owner walkthrough.

| Need | Industry standard | ContractorAI today |
|------|-------------------|-------------------|
| Punch key / symbol library | Bluebeam tool sets | ❌ (generic shapes) |
| Photo on markup | Bluebeam, Procore mobile | ❌ |
| Location / space / level | Bluebeam Spaces, Procore locations | ❌ |
| Status-driven pin colors | Procore punch pins | ⚠️ Status in table only, not pin color |
| Mobile / touch markup | All field tools | ❌ (desktop web, mouse-oriented) |
| Offline field capture | PlanGrid, Procore app | ❌ |

### 3.3 RFI Coordination

**Expectation:** Cloud area, create or link RFI, track draft → open → answered, notify responsible party, maintain drawing hyperlink in RFI record.

| Need | Industry standard | ContractorAI today |
|------|-------------------|-------------------|
| RFI category on markup | Procore creates Draft RFI from cloud | ✅ category "RFI" (manual) |
| Create/link RFI entity | Procore, Autodesk Build | ❌ |
| Status sync with RFI tool | Procore | ❌ |
| Hyperlink export to RFI | Procore | ❌ |

### 3.4 Takeoffs / Estimating (Precon)

**Expectation:** Calibrate scale once per sheet, measure length/area/count with assemblies, running totals, export to estimate spreadsheet.

| Need | Industry standard | ContractorAI today |
|------|-------------------|-------------------|
| Scale calibration | Bluebeam (gold standard) | ⚠️ UI exists, not functional chain |
| Length / area / count | All | ⚠️ Values not scale-accurate |
| Polylength, volume, perimeter | Bluebeam | ❌ |
| Running measurement totals | Bluebeam Markups List | ❌ |
| Assemblies / multipliers | Bluebeam | ❌ |

### 3.5 Closeout / Record Documents

**Expectation:** Flatten markups to PDF, batch summary across sheets, audit who marked what when.

| Need | Industry standard | ContractorAI today |
|------|-------------------|-------------------|
| Burn-in / flatten PDF | Bluebeam, Acrobat | ❌ |
| Batch markup report (multi-PDF) | Bluebeam | ❌ |
| Published vs. personal layers | Procore, Autodesk Build | ❌ |
| Full audit trail | Enterprise PM tools | ⚠️ createdBy + timestamps only |

---

## 4. Competitor Feature Matrix

Legend: ✅ Full · ⚠️ Partial · ❌ Missing · — Not focus

| Feature | ContractorAI | Bluebeam Revu | Procore Drawings | Autodesk Build | Adobe Acrobat Pro | PDF Expert | Foxit | Browser native PDF |
|---------|--------------|---------------|------------------|----------------|-------------------|------------|-------|-------------------|
| **Core shapes** (rect, line, arrow) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ Limited |
| **Revision cloud** (true arc cloud) | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Callout / leader text** | ❌ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ❌ |
| **Freehand pen** | ❌ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Text / highlight** | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Stamps** (custom + standard) | ❌ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Calibrated measurements** | ❌ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ⚠️ | ❌ |
| **Area / count takeoffs** | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ⚠️ | ❌ |
| **Markups list / punch table** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **Categories / disciplines** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Status workflow** | ✅ | ✅ | ✅ (via linked items) | ✅ (issues) | ❌ | ❌ | ❌ | ❌ |
| **Assignee / responsibility** | ⚠️ text | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| **Photo attachments** | ❌ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| **Link to RFI / punch / submittal** | ❌ | ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Personal vs. published layers** | ❌ | ⚠️ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ❌ |
| **Real-time collaboration** | ❌ | ✅ Studio | ⚠️ | ⚠️ | ⚠️ Cloud | ❌ | ⚠️ | ❌ |
| **Revision compare / overlay** | ❌ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Export CSV/Excel** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ❌ |
| **PDF summary w/ thumbnails** | ❌ | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ⚠️ | ❌ |
| **Flatten / burn-in markups** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **XFDF interchange** | ❌ | ✅ | ❌ | ❌ | ✅ | ⚠️ | ✅ | ❌ |
| **Tool chest / reusable sets** | ❌ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **Keyboard shortcuts** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Touch / stylus** | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| **AI citation → sheet jump** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Sources:** [Bluebeam markups](https://www.bluebeam.com/product/markups-and-data/), [Bluebeam punch](https://www.bluebeam.com/workflows/punch/), [Procore Drawings markup](https://v2.support.procore.com/product-manuals/drawings-project/tutorials/mark-up-a-drawing/), [Autodesk Build markups](https://help.plangrid.com/hc/en-us/articles/224133567), [Acrobat compare](https://helpx.adobe.com/acrobat/using/compare-documents.html), [PDF Expert](https://pdfexpert.com/), [Foxit annotations](https://www.foxit.com/blog/editing-and-annotating-pdf-documents/).

---

## 5. Gap Categories

### 5.1 Tools

| Gap | Priority | Notes |
|-----|----------|-------|
| True revision cloud path | P1 | Current cloud is dashed rounded rect |
| Callout with leader + text box | P0 | Expected on every redline |
| Stamp tool (APPROVED, RFI, etc.) | P0 | Construction record-set standard |
| Freehand pen / highlighter stroke | P1 | Field redlines, quick sketches |
| Polyline / orthogonal line | P1 | Dimension chains |
| Photo attachment on markup | P1 | Punch workflow blocker |
| Punch key / symbol library | P2 | Bluebeam tool chest equivalent |

### 5.2 UX & Discoverability

| Gap | Priority | Notes |
|-----|----------|-------|
| **Markup in continuous scroll mode** | **P0** | Default mode is non-interactive |
| Markup tools behind toggle, collapsed panels | P0 | Users never find the feature |
| Text-button toolbar (no icons/tooltips) | P0 | Reads as prototype |
| No tool hotkeys (C=cloud, M=measure) | P1 | Bluebeam muscle memory |
| No color / line weight picker | P1 | All markups same style |
| Text created on drag, edited in table only | P1 | Unnatural vs. callout-on-canvas |
| Area tool: no vertex edit, obscure finish flow | P1 | |

### 5.3 Persistence & Collaboration

| Gap | Priority | Notes |
|-----|----------|-------|
| Real-time multi-user sync | P2 | Strategic |
| Personal vs. published layers | P1 | Procore/ACC pattern |
| Markup versioning / history | P2 | |
| Link markup ↔ RFI/punch entity | P1 | Platform integration |
| Shared types in `packages/shared` | P1 | Reduce drift |
| Local fallback silently drops on refresh | P1 | Warn user |

### 5.4 Measurements

| Gap | Priority | Notes |
|-----|----------|-------|
| **Per-sheet scale calibration store** | **P0** | `calibrate` tool exists but doesn't chain |
| Apply calibration to length/area | P0 | Replace `* 100` / `* 10000` hacks |
| Running totals in UI | P1 | Markups List column totals |
| Polylength, perimeter, volume | P2 | Estimating depth |
| Snap to ortho / angle | P2 | |

### 5.5 Stamps & Standards

| Gap | Priority | Notes |
|-----|----------|-------|
| Built-in construction stamps | P0 | Review, QC, safety |
| Custom stamp upload | P2 | |
| Tool chest / saved markup sets | P2 | Bluebeam differentiator |
| Batch apply stamp | P2 | |

### 5.6 Layers & Visibility

| Gap | Priority | Notes |
|-----|----------|-------|
| Show/hide by markup type | P1 | |
| Show/hide by author / status | P1 | Filter exists in table, not on canvas |
| Published layer visibility | P1 | |

### 5.7 Keyboard, Touch, Performance

| Gap | Priority | Notes |
|-----|----------|-------|
| Keyboard shortcuts | P1 | See companion doc P1-2 |
| Touch / Apple Pencil | P2 | Field use |
| Virtualized continuous scroll | P1 | 100+ sheet sets |
| All markups re-render on every page in continuous mode | P1 | Performance at scale |

---

## 6. Priority Roadmap

### P0 — Blocks "premium" claim; fix before broad launch

| # | Item | Rationale | Files |
|---|------|-----------|-------|
| P0-1 | **Enable markup create/edit in continuous scroll** | Default mode is view-only; feature is effectively hidden | `ConstructionPdfViewer.tsx` (~948–971) — per-page hit layer, route events to page under cursor |
| P0-2 | **Functional scale calibration** | Measurements are misleading without it | Viewer: store scale per file/page in DB or `measurement.calibration`; apply in length/area math. Backend: extend schema or use JSONB convention. `pdf-markup.service.ts` |
| P0-3 | **Callout tool** | #1 missing redline tool vs. Bluebeam | New tool type + render in viewer |
| P0-4 | **Stamp tool** (5–10 construction defaults) | Record-set reviews expect stamps | Viewer + optional `stampId` in coordinates |
| P0-5 | **Markup toolbar polish** | Icons, grouping, badge when markups exist | Extract `PdfMarkupToolbar.tsx`, `workspace.css` |
| P0-6 | **Surface markup mode defaults** | Expand tools on first markup; show count badge | `showMarkupTools`, `markupPanelCollapsed` defaults |

### P1 — Professional daily driver

| # | Item | Files |
|---|------|-------|
| P1-1 | True revision cloud SVG renderer | Viewer render path |
| P1-2 | Freehand pen + color/weight picker | Viewer |
| P1-3 | Photo attachment (S3 + `attachment_url` column) | Schema migration, upload API, viewer |
| P1-4 | Running measurement totals in markup table header | Viewer + export |
| P1-5 | Canvas visibility filters (type, status, author) | Viewer |
| P1-6 | Personal vs. published markup state | Schema `published_at` / `layer`, API, UI |
| P1-7 | Shared markup types in `packages/shared` | New package exports |
| P1-8 | PDF export with burned-in markups | Backend render (pdf-lib or headless) |
| P1-9 | Link markup → RFI draft (API integration) | Backend + viewer pin flow |
| P1-10 | Area vertex edit handles | `renderHandles` for area type |

### P2 — Strategic / competitive parity

| # | Item |
|---|------|
| P2-1 | Real-time collaboration (WebSocket markup sync) |
| P2-2 | Revision compare / overlay diff |
| P2-3 | XFDF import/export |
| P2-4 | Tool chest / custom tool sets |
| P2-5 | Batch markup summary PDF (multi-file) |
| P2-6 | AI ↔ markup bridge (chat cites open markups) |
| P2-7 | Mobile touch markup |
| P2-8 | OCR for scanned sheets (measurement + search) |

---

## 7. Quick Wins vs. Strategic Investments

### Quick wins (1–2 sprints)

1. **Continuous markup hit layer** — Per-page `pointerEvents: 'auto'` when `showMarkupTools`; compute page from `data-page` under cursor; reuse `pagePointFromEvent` with per-page host ref.
2. **Toolbar icons + tooltips** — Lucide icons; `title` attributes; active state styling in CSS.
3. **Markup badge** — Show count on Markups button: `markups.length`.
4. **Default expand on create** — `setShowMarkupTools(true)`, `setMarkupPanelCollapsed(false)` in `createMarkup`.
5. **Calibration dialog** — After calibrate draw, prompt "This line represents ___ [unit]" instead of hardcoded 10; persist on file record.
6. **Warn on local-only markups** — Banner when `id.startsWith('local-')`.
7. **Export includes coordinates JSON** — Optional column for downstream GIS/BIM (low effort, backend export only).

### Strategic investments (multi-sprint)

1. **Extract `PdfMarkupLayer` + `PdfMarkupToolbar`** — Testable units; enables continuous/single parity.
2. **Scale service** — `file_sheet_scales` table: fileId, pageNumber, pixelsPerUnit, unit; viewer reads before measure.
3. **PDF burn-in pipeline** — Server-side render markups onto PDF pages for record exports.
4. **Published layer + notifications** — Procore-style publish flow; email/Slack on assignee change.
5. **Revision compare** — Diff two `fileId` versions with overlay; tie to AI "what changed" prompts.
6. **Platform entity links** — RFI/punch/submittal IDs on markup row; deep links to PM modules.

---

## 8. Recommendations Tied to Code

### `ConstructionPdfViewer.tsx`

| Lines / area | Recommendation |
|--------------|----------------|
| 12–17 | Extend `Tool` / `MarkupType` for `callout`, `stamp`, `pen`; add to toolbar |
| 179–180 | Consider default `showMarkupTools: true` when `markups.length > 0` |
| 245–255 | `loadMarkups` — poll or subscribe for multi-user (future) |
| 361–419 | `saveMarkup` / `createMarkup` — persist calibration to file-level store |
| 493–513 | `onPointerDown` — duplicate handlers for continuous per-page overlays |
| 612–620 | Replace `len * 100` with calibrated conversion |
| 636–688 | `renderMarkup` — true cloud path, callout, stamp sprites |
| 690–746 | `renderHandles` — add area vertex handles |
| 748–757 | `exportComments` — add PDF summary option (future) |
| 799–811 | Markup toolbar — extract component, icons, keyboard bindings |
| 896–947 | Single mode — keep as reference implementation for interaction |
| 948–971 | **P0:** Add `pageHostRef` per page, `pointerEvents: auto` when tools active |
| 979–1050 | Markup table — add measurement totals row; photo column when attachments exist |

### Backend

| File | Recommendation |
|------|----------------|
| `packages/backend/drizzle/0011_pdf_markups.sql` | Migration: `attachment_url`, `published_at`, `layer`, `linked_entity_type/id` |
| `packages/backend/src/services/pdf-markup.service.ts` | Validate `type` enum; scale lookup helper |
| `packages/backend/src/server.ts` ~619–769 | Add `GET .../markups/export?format=pdf`; sheet scale CRUD |
| `packages/backend/src/db/schema.ts` | `pdfMarkups` + new `pdfSheetScales` table |

### API routes (Next.js proxy)

| Path | Notes |
|------|-------|
| `apps/web/app/api/projects/[id]/files/[fileId]/markups/route.ts` | Unchanged until scale endpoints added |
| `.../markups/export/route.ts` | Pass through PDF format when implemented |

### Tests to add

- Markup create/select in continuous mode (after P0-1).
- Calibrated length matches known scale on test fixture.
- Export CSV includes expected columns for all tool types.
- Local fallback warning displayed.

### Cross-reference

Viewer navigation, search, virtualization, and general polish priorities remain in [pdf-viewer-gap-audit.md](./pdf-viewer-gap-audit.md). **This document owns markup-specific premium gaps**; that document owns viewer shell gaps. Many P0 items overlap (continuous interaction, toolbar polish).

---

## Appendix A: Export Row Schema

```typescript
// packages/backend/src/server.ts — MarkupExportRow
{
  projectName, fileName, pageNumber, markupType, category,
  comment, status, assignedTo, createdBy, createdDate, updatedDate,
  measurementValue, measurementUnit
}
```

## Appendix B: Coordinate Conventions

| Type | coordinates shape |
|------|-------------------|
| rectangle, highlight, cloud, text | `{ x, y, width, height }` normalized |
| arrow, line, length, calibrate | `{ x1, y1, x2, y2 }` normalized |
| area | `{ points: [{ x, y }, ...] }` normalized |
| count | `{ x, y }` center point normalized |

## Appendix C: Related Branch Commits

See [pdf-viewer-gap-audit.md](./pdf-viewer-gap-audit.md) appendix for viewer scroll fix (`c25bc87`) and workspace polish commits.

---

*Audit for roadmap input — markup premium experience on `feat/frontend-chat-viewer-improvements`. No implementation in this document.*
