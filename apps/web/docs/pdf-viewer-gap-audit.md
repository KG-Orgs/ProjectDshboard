# PDF Viewer Gap Audit — ContractorAI Chat Workspace

**Branch:** `feat/frontend-chat-viewer-improvements`  
**Date:** 2026-06-26  
**Scope:** `ConstructionPdfViewer.tsx`, workspace layout (`page.tsx`, `workspace.css`), citation/search/markup integration  
**Benchmarks:** Bluebeam Revu, Adobe Acrobat, PDF.js default viewer, browser native PDF  
**Markup deep-dive:** [construction-markup-premium-audit.md](./construction-markup-premium-audit.md) (tool matrix, construction workflows, competitor comparison, P0–P2 markup roadmap)

---

## 1. Executive Summary

The chat workspace PDF viewer is a **capable prototype with construction-specific markup ambition**, but it does not yet feel like a professional document tool. It sits roughly at **MVP+ for read-only viewing** and **early beta for markups**, well behind dedicated PDF software on polish, performance at scale, and everyday ergonomics.

**Maturity vs. pro tools (honest ranges):**

| Dimension | Our viewer | Bluebeam / Acrobat |
|-----------|------------|---------------------|
| Read & navigate | ~65% | Baseline |
| Find & text interaction | ~25% | Baseline |
| Markup & review | ~35% (features exist; UX split across modes) | Baseline |
| Performance (100+ page sets) | ~40% | Baseline |
| UI polish & shortcuts | ~45% | Baseline |
| AI/citation integration | ~75% (differentiator) | N/A or weak |

**What already feels good:** Three-panel workspace, citation chips that open the right file/page, bounding-box flash on AI citations, construction markup categories/statuses, bookmark tree from PDF outline, continuous scroll as default (after recent fixes).

**What breaks the “professional” feel:** Toolbar reads as a developer prototype (text buttons, inline styles, no icons); markups are hidden and **non-interactive in the default scroll mode**; in-document search UI was removed while backend logic remains; all pages mount at once in continuous mode; no keyboard shortcuts; no text selection in continuous mode.

**Scroll fix status:** Subagent [Fix PDF blank scroll bug](d0eceee7-bbf7-41b6-b3e4-bece5e617fae) **completed** in commit `c25bc87`. Root cause was a parent↔child feedback loop: scroll updated `page` → parent wrote it to `activePdfPage` → `initialPage` change reset `numPages` to 0 while `Document` stayed mounted → blank viewer. Fix: `onVisiblePageChange` only updates `displayedPdfPage`; document reset limited to `url`/`fileId`. **Verify in browser** on large plan sets; remaining risks are performance/memory, not the prior wipe bug.

---

## 2. What We Have Today

### Core viewer (`ConstructionPdfViewer.tsx`)

| Area | Capability |
|------|------------|
| **Engine** | `react-pdf` / PDF.js; worker from unpkg CDN |
| **Scroll modes** | **Continuous** (default) — stacked pages; **Single** — one page, pan via Hand tool |
| **Zoom** | Manual 40–300% (±10 steps), Fit Width, Fit Page |
| **Rotation** | 90° increments |
| **Page nav** | Prev/Next, page number input, thumbnail sidebar, bookmark outline jumps |
| **Sidebar tabs** | Thumbnails, Bookmarks (PDF outline), Markups list — **collapsed to 40px by default** |
| **Pan** | Hand tool — **single-page mode only** (`viewerRef` scroll drag) |
| **Markups toggle** | Second toolbar row behind **Markups** button (`showMarkupTools`, default off) |
| **Markup tools** | select, cloud, arrow, text, highlight, line, rectangle, calibrate, length, area, count |
| **Markup data** | Persisted via `/api/projects/.../markups`; categories (RFI, QC, etc.), statuses, assignee, comment; CSV/Excel export |
| **Markup table** | Bottom panel — **collapsed by default**; filter/sort; resizable height |
| **Citations** | `citationRequest` → jump to page, orange bounding-box flash (5s); optional `textSnippet` triggers programmatic search |
| **Search (internal)** | `runSearch()` scans all pages via `getTextContent`; highlights in **single mode only** when `searchApplied` set — **no user-facing Find UI** |
| **Download** | “Save” downloads original PDF URL |
| **Rendering** | `renderAnnotationLayer={false}`, `renderTextLayer={false}` in continuous mode; text layer only in single mode when search active |

### Workspace integration (`page.tsx`)

| Area | Capability |
|------|------------|
| **Layout** | Files (left, collapsed default) · Viewer (center) · Chat (right, expanded default) |
| **Doc tabs** | Multi-doc tabs with close |
| **Citations from chat** | Source chips → `openOrCreateDoc` with page when `pageOrigin === 'exact'` |
| **Programmatic API** | `window.openPdfCitation({ fileId, pageNumber, boundingBox, textSnippet })` |
| **Page sync** | `activePdfPage` = navigation target; `displayedPdfPage` = scroll-driven (display only, post-fix) |
| **Auto-open** | AI responses can auto-open cited PDFs and jump to `bestPage` |

### Styling (`workspace.css`)

- Polished **workspace chrome** (top bar, panels, chat, file explorer).
- Viewer **stage** uses dark gray tab bar (`#374151`) — intentional contrast.
- **No dedicated PDF toolbar styles** — viewer toolbar is inline styles in TSX.
- Leftover `.search-result-btn` CSS with no current UI wiring.

### Tests

- `ConstructionPdfViewer.test.tsx` — bookmarks, continuous scroll, markup handles, scroll feedback-loop regression (`c25bc87`).
- 65 tests under `app/workspace/chat` passing after scroll fix.

---

## 3. Gap Analysis by Category

### 3.1 Viewing & Navigation

| Feature | Status | Gap vs. pro |
|---------|--------|-------------|
| Continuous scroll | ✅ Default | Works after `c25bc87`; no page curl/shadow polish |
| Single-page mode | ✅ Toggle | Extra step; most users expect one scroll behavior |
| Thumbnails | ✅ Sidebar | Renders **all** thumbs when expanded — slow on large sets; no lazy load |
| Bookmarks / outline | ✅ Clickable tree | No search within outline; basic styling |
| Fit width / page | ✅ | No “fit visible”, no marquee zoom |
| Rotation | ✅ | No per-page vs document distinction |
| Spread / facing pages | ❌ | Expected in Acrobat, Bluebeam |
| Native PDF links | ❌ | `renderAnnotationLayer={false}` — internal links dead |
| Text selection / copy | ❌ continuous | Text layer off; single mode only when searching |
| Mini-map / scroll indicator | ❌ | Common in large drawing sets |
| Current page in chrome | ⚠️ Partial | Toolbar shows `page` input; `displayedPdfPage` in parent unused in UI |

**Known scroll issue (resolved):** Blank pages after scrolling — fixed in `c25bc87`. Prior commits (`2c1ea62`) added `StablePdfPage` memo and stable min-heights; together these address remount/feedback issues.

### 3.2 Performance

| Issue | Detail |
|-------|--------|
| **All pages mounted** | Continuous mode: `Array.from({ length: numPages })` renders every `Page` — 200-page plan set = 200 canvases in DOM |
| **No virtualization** | PDF.js viewer uses range/visible-page rendering; we do not |
| **Thumbnail storm** | Expanding sidebar renders full `Page` per thumb at width 160 |
| **CDN worker** | `unpkg.com` worker — latency/offline risk vs bundled worker |
| **Scale recalc** | `scale` useMemo reads `clientWidth` but may not re-run on panel resize without zoom/fit change |
| **Memory** | Long sessions with multiple large PDFs tabbed — no unload/cleanup strategy |

**Impact:** 20–50 page specs often fine; **100+ page drawing sets** will feel sluggish or crash tabs — unacceptable for construction workflows.

### 3.3 Markup & Annotation

| Feature | Status | Gap |
|---------|--------|-----|
| Tool breadth | ✅ Strong for v1 | Missing stamp, callout leader, freehand pen, polyline, dimension styles |
| **Continuous mode interaction** | ❌ **View only** | Overlay `pointerEvents: 'none'`; no `pageHostRef` / draw handlers — **must switch to single mode to mark up** |
| Handles / edit | ✅ Single mode | Drag resize/move works when selected |
| Measurements | ⚠️ Pixel-normalized | Not true scale from calibration chain; arbitrary `* 100` factors |
| Persistence | ✅ API-backed | No conflict resolution, versioning, or “who’s viewing” |
| Collaboration | ❌ | No real-time sync, review sessions, status workflows |
| PDF export with markups | ❌ | Markups are overlay-only, not burned in or XFDF |
| Layers / visibility | ❌ | No show/hide markup types |
| Native PDF annotations | ❌ | Ignored on import |

**UX regression from recent polish:** Markups moved behind toggle + default continuous scroll = **most users never discover or can use markup tools** without mode switching.

### 3.4 Search & Find

| Feature | Status |
|---------|--------|
| User Find bar (Ctrl+F) | ❌ **Removed from UI** |
| `runSearch()` implementation | ✅ Full-document scan, snippet list, hit cap 400 |
| Highlight on page | ✅ Single mode + `customTextRenderer` only |
| Citation `textSnippet` auto-search | ✅ Side effect on citation |
| Case / whole word / regex | ❌ |
| OCR / scanned PDFs | ❌ Message only: “OCR may be required later” |

**Impact:** Users cannot search a spec mid-review without asking the AI. This is a **major gap vs. every benchmark** (Acrobat, Bluebeam, PDF.js, browser).

### 3.5 UI/UX Polish

| Area | Current | Pro expectation |
|------|---------|-----------------|
| Toolbar | Text buttons (`Prev`, `Hand`, `Markups`), inline styles | Icon groups, tooltips, disabled states, consistent spacing |
| Visual hierarchy | Two cramped rows when markups open | Primary (nav/zoom) vs secondary (tools) vs overflow menu |
| Loading | Gray placeholder divs; `Document loading={null}` | Skeleton, progress, error retry |
| Responsive | Workspace `@media (max-width: 767px)` minimal | Viewer unusable on tablet without panel collapse rules |
| Dark mode | Viewer canvas area light gray; no theme sync | Bluebeam dark workspace common |
| Keyboard | None in viewer | Page Up/Down, +/-, Ctrl+F, Esc, tool hotkeys |
| Cursor / tool feedback | Basic | Crosshair, grab, precise hit targets |
| Page shadow / margin | Single box-shadow on single mode | Consistent page chrome in continuous mode |

Workspace **shell** polish improved in `2c1ea62`; **viewer chrome** did not receive the same treatment.

### 3.6 Integration (AI / Workspace)

| Feature | Status | Gap |
|---------|--------|-----|
| Chat → open citation | ✅ Strong | Chips, auto-open, page jump |
| Bounding box highlight | ✅ | No persistent pin; 5s flash only |
| `displayedPdfPage` | Set, unused | Could show “Viewing p. 12” in tab or toolbar |
| Split view / compare | ❌ | No side-by-side sheets, overlay diff |
| Chat + markup context | ❌ | AI doesn’t see user markups |
| Multi-file compare | ❌ | Prompt-only via chat |

**Differentiator:** Citation-driven navigation is ahead of generic PDF viewers; leverage it in polish (e.g. citation history strip, pin list).

### 3.7 Accessibility

| Criterion | Status |
|-----------|--------|
| Keyboard navigation in viewer | ❌ |
| Focus management on citation jump | ❌ |
| ARIA on toolbar tools | ❌ |
| Screen reader page announcements | ❌ |
| High-contrast / reduced motion | ❌ |
| Text layer for AT | Off in continuous mode |

### 3.8 Professional Benchmarks (summary)

| Capability | Browser native | PDF.js default | Our viewer | Bluebeam / Acrobat |
|------------|----------------|----------------|------------|---------------------|
| Scroll large PDFs | ✅ | ✅ (virtualized) | ⚠️ (fixed blank bug; no virt) | ✅ |
| Ctrl+F find | ✅ | ✅ | ❌ UI | ✅ |
| Text select/copy | ✅ | ✅ | ❌ continuous | ✅ |
| Click PDF links | ✅ | ✅ | ❌ | ✅ |
| Markup | Limited | Limited | ⚠️ single mode | ✅ Full |
| Measurements | ❌ | ❌ | ⚠️ Basic | ✅ Calibrated |
| Compare docs | ❌ | ❌ | ❌ | ✅ |
| Real-time review | ❌ | ❌ | ❌ | ✅ (Bluebeam) |

---

## 4. Priority Matrix

### P0 — Feels broken or blocks daily use

| # | Item | Rationale | Files |
|---|------|-----------|-------|
| P0-1 | **Confirm scroll fix on real plan sets** | `c25bc87` addresses logic bug; QA still needed on 100+ pages | `ConstructionPdfViewer.tsx`, `page.tsx` |
| P0-2 | **Markup usable in default scroll mode** | Default continuous + hidden tools + non-interactive overlay = markups effectively broken | `ConstructionPdfViewer.tsx` (~948–971) |
| P0-3 | **Restore Find UI** | Logic exists; removal is a regression vs. all benchmarks | `ConstructionPdfViewer.tsx` (`runSearch`, toolbar) |
| P0-4 | **Toolbar visual polish (icons, grouping)** | Biggest “prototype vs product” signal | Extract to component + `workspace.css` |
| P0-5 | **Loading & error states for PDF** | `loading={null}` feels broken on slow files | `ConstructionPdfViewer.tsx` Document props |

### P1 — Professional daily driver

| # | Item | Rationale | Files |
|---|------|-----------|-------|
| P1-1 | **Virtualize continuous scroll** (render window ±N pages) | Required for construction drawing sets | New hook/module; `StablePdfPage` |
| P1-2 | **Keyboard shortcuts** (page, zoom, find, hand) | Table stakes | `ConstructionPdfViewer.tsx` |
| P1-3 | **Enable text layer + selection in continuous mode** | Spec review requires copy/paste | Page `renderTextLayer` policy |
| P1-4 | **Lazy thumbnail sidebar** | Opening thumbs on 200-page doc hangs | Thumbnail tab loop (~829–849) |
| P1-5 | **Bundled PDF.js worker** | CDN dependency / CSP | worker import in TSX |
| P1-6 | **Show sync’d page in doc tab or toolbar** | Use `displayedPdfPage` from parent | `page.tsx`, tab label |
| P1-7 | **Native PDF link annotations** | Spec cross-refs | `renderAnnotationLayer` selective |

### P2 — Strategic / nice-to-have

| # | Item |
|---|------|
| P2-1 | Spread view, facing pages |
| P2-2 | Document compare / overlay |
| P2-3 | Real-time collaborative markups |
| P2-4 | XFDF export / PDF burn-in |
| P2-5 | OCR pipeline for scanned sheets |
| P2-6 | Viewer dark theme matching workspace |
| P2-7 | AI ↔ markup bridge (cite open markups) |

---

## 5. Quick Wins vs. Strategic Investments

### Quick wins (next sprint)

1. **Find bar** — Wire existing `runSearch`, `hits`, `hitIndex` to a compact toolbar field + prev/next match (single-mode highlight already works).
2. **Toolbar icons** — Use lucide icons (already in workspace); move `compactControlBase` to CSS classes in `workspace.css`.
3. **Keyboard: ←/→ page, +/- zoom, Ctrl+F find** — Single `useEffect` keydown handler in viewer.
4. **Continuous markup hit layer** — Per-page overlay with `pointerEvents: 'auto'` when `showMarkupTools`; route `pagePointFromEvent` to active page under cursor.
5. **Surface `displayedPdfPage`** — Append `· p. N` to active doc tab in `page.tsx`.
6. **Document loading spinner** — Replace `loading={null}` with centered spinner matching workspace style.
7. **Default markup panel** — Expand on first markup create; don’t hide tools from first-time users.

### Strategic investments (multi-sprint)

1. **Visible-page virtualization** — IntersectionObserver-driven mount/unmount with canvas cache (PDF.js `PDFPageView` pattern).
2. **Extract `PdfViewerToolbar` + `PdfMarkupLayer`** — Split 1055-line monolith; testable units.
3. **Calibration-backed measurements** — Store scale per sheet; compute real units from user calibration line.
4. **Compare mode** — Dual-pane or swiper in center panel; chat prompts “compare A vs B page 3”.
5. **Collaboration layer** — WebSocket markup sync; presence avatars (backend + viewer).

---

## 6. Recommendations Tied to Code

### `ConstructionPdfViewer.tsx`

- **Lines 178–179, 793–811:** Collapsed sidebar + hidden markup row — reconsider defaults for construction users; at minimum show Markups badge when markups exist.
- **Lines 429–477, 904–910:** Search is implemented but UI-less — restore Find control here before adding new search backends.
- **Lines 896–974:** Mode split is the root UX fracture — unify interaction model so continuous scroll supports pan (middle mouse?), text select, and markup on the page under cursor.
- **Lines 949–972:** Add virtualization boundary; keep `data-page` + `StablePdfPage` for visible range only.
- **Lines 139–140:** Re-enable annotation layer for links only (custom click handler) without full form widgets.
- **Line 8:** Bundle worker locally for reliability.

### `page.tsx`

- **Lines 419–420, 1234–1236:** `displayedPdfPage` is tracked — expose in UI; never feed back to `activePdfPage` (regression guard).
- **Lines 1122–1144:** Citation API is solid — extend chips to pass `boundingBox` when backend provides it.
- **Lines 1332–1355:** Source chips only jump when `pageOrigin === 'exact'` — document in UI when page is approximate.

### `workspace.css`

- **Lines 697–704, 844–893:** Extend viewer-stage patterns to a `.pdf-toolbar` block; remove inline duplication from TSX.
- **Lines 895–913:** `.search-result-btn` — reuse when Find UI returns.

### Tests to add with fixes

- Markup create in continuous mode (once enabled).
- Find UI navigates hits across modes.
- Virtualization: pages outside window unmount, scroll preserves position.
- Regression: scrolling does not change `initialPage` prop from parent (`ConstructionPdfViewer.test.tsx` already has one case — keep).

---

## Appendix: Recent Branch Commits (viewer-relevant)

| Commit | Summary |
|--------|---------|
| `c25bc87` | Fix blank scroll — stop `initialPage` feedback loop |
| `2c1ea62` | Continuous scroll stability, workspace UI polish, collapsed panels |
| `f1f47e5` | Test updates for collapsed panels / toolbar |
| `33653ed` | Streamline viewer chrome, markup toggle |

---

*Audit only — no implementation in this document. Intended as roadmap input for polish sprints on `feat/frontend-chat-viewer-improvements`.*
