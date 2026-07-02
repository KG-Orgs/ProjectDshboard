# PDF Viewer Fix Plan — Markup, Calibrate, Zoom, Continuous Scroll

**Branch:** `fix/pdf-viewer-markup-zoom` (from `main`)  
**Date:** 2026-07-02  
**Primary file:** `apps/web/app/workspace/chat/ConstructionPdfViewer.tsx`

---

## 1. Reported Issues & Root Causes

### 1.1 Markup editing not smooth (select, handles, Delete)

| Symptom | Root cause |
|---------|------------|
| Click line/highlight hard to select | Line SVG hit target is only the visible stroke (~3px). Highlight/rect selection works on the div but competes with the text layer when pan is active. |
| Control-point editing flaky | Select mode is **not** treated as an interactive overlay mode — only drawing tools set `isMarkupDrawingActive`. Deselect-on-empty-click and pointer routing only run during drawing, not during select. |
| Can't drag rect/highlight body | Move drag `onMouseDown` is wired for `text` and `callout` only; rect/highlight/cloud rely on an invisible move handle overlay that users don't discover. |
| Delete key inconsistent | Works when `documentHost` is focused; selecting via PDF click doesn't focus the host. Keyboard handler is correct but focus model is weak. |
| Partial prior fix | Handles and PATCH-on-drag exist and pass tests when selecting via **table row** + select tool — not when clicking directly on the PDF in default pan mode. |

### 1.2 Calibrate tool doesn't work

| Symptom | Root cause |
|---------|------------|
| Tool appears dead | Markup toolbar is behind **Markups** toggle (`showMarkupTools` default `false`). Calibrate is only reachable after expanding Markups. |
| Continuous mode (default) | Calibration flow works in tests on single-page mode; continuous mode uses page-container pointer handlers — functionally OK but untested end-to-end. Dialog + `confirmCalibration` + `localStorage` path is implemented. |
| Line drawn but no dialog | `finishDraw` clears draft on `mouseLeave` during drag can complete early; threshold `normalizedDistance > 0.002` rejects very short lines. |

### 1.3 Ctrl+scroll zoom broken (post-78bbfe2)

| Symptom | Root cause |
|---------|------------|
| Wheel does nothing | Listener is on `documentHostRef` only; some browsers deliver `wheel` to the scroll child first and may not bubble with `ctrlKey` reliably. |
| Mac pinch | Pinch emits `wheel` + `ctrlKey` — handled, but `metaKey` also checked for legacy paths. |
| Preview stuck / jumpy | 78bbfe2 fixed accumulation via `effectiveZoomPercent` but commit still clears CSS transform in `useLayoutEffect` same frame as `scale` prop change → visible flash. |

### 1.4 Zoom not smooth (white flash on commit)

| Symptom | Root cause |
|---------|------------|
| Page turns white then reloads | On commit, `setZoom` changes react-pdf `scale` → every `Page` re-rasterizes (`loading={null}` = blank canvas during paint). CSS preview transform is cleared in the same layout pass, so there is a frame with no transform and no canvas. |
| Worse in continuous mode | All mounted pages receive new `scale` simultaneously; slot dimensions (`continuousPageSlotSize`) change, causing layout reflow across the stack. |

### 1.5 Normal scroll / continuous mode regressions

| Symptom | Root cause |
|---------|------------|
| Scroll breaks after zoom | Scroll offset correction runs in `useLayoutEffect` but preview clear + scale change can fight scroll restoration on large documents. |
| Blank pages | Prior `c25bc87` fix addressed parent↔child page feedback loop; remaining blanks are likely zoom-commit re-render flashes, not mode flip. |
| Mode flip | No code path toggles `scrollMode` on zoom; user perception may be white flash feeling like a reload. |

---

## 2. Implementation Approach (Prioritized)

### P0 — Markup select / edit / delete (continuous scroll default)

1. Introduce `isMarkupEditActive = showMarkupTools && tool === 'select'`.
2. `isMarkupPointerActive = isMarkupDrawingActive || isMarkupEditActive` — drives page pointer handlers and deselect-on-empty-click.
3. Widen line/arrow hit area: invisible `strokeWidth` slop (~12px) on `NormalizedLineSvg`.
4. Enable body drag for rect/highlight/cloud/stamp when selected + select tool (same pattern as text).
5. Focus `documentHostRef` on markup select click so Delete/Backspace works immediately.
6. Gate PDF click selection to `select` or `pan` tool (avoid accidental selection while drawing).

### P1 — Calibrate end-to-end

1. `handleToolChange('calibrate')` already opens markup tools — add continuous-mode test.
2. Prevent `mouseLeave` on page container from aborting an in-progress calibrate drag (only finish on `mouseUp`).
3. After successful calibration, switch to select tool and show scale indicator (already persists to `localStorage`).

### P2 — Ctrl+wheel zoom reliability

1. Attach `wheel` listener with `{ capture: true, passive: false }` on `documentHostRef` **and** the active scroll element (`continuousScrollRef` / `viewerRef`).
2. Keep `ctrlKey || metaKey` gate; call `preventDefault` + `stopPropagation` when zooming.
3. Flush preview commit on `wheel` end (existing debounce timer).

### P3 — Reduce zoom commit flash

1. Increase `ZOOM_COMMIT_IDLE_MS` from 120 → 180ms.
2. Defer `clearPreviewZoom` by double `requestAnimationFrame` after scroll restoration so the new scale layout settles first.
3. CSS: `.pdf-zoom-committing` opacity crossfade on page canvases (150ms) during commit.
4. Keep preview transform until fade completes (don't clear in same layout pass as `setZoom`).

**Tradeoff — transform zoom vs react-pdf scale:**

| Approach | Pros | Cons |
|----------|------|------|
| CSS transform only | Butter-smooth, no re-render | Blurry text, markup coord drift, breaks text selection |
| react-pdf scale only | Sharp, correct coords | Flash on every wheel tick |
| **Hybrid (current + improved)** | Preview via transform; commit via scale | Residual flash on commit; acceptable with crossfade + debounce |

### P4 — Continuous scroll stability

1. Stable page keys (`cont-${p}`) — already correct.
2. Do not change `scrollMode` on zoom commit.
3. Preserve scroll focal point (existing `pendingZoomScrollRef` math).
4. Suppress intersection observer during programmatic scroll (existing 150ms guard).

---

## 3. Test Plan

### Automated (vitest `apps/web`)

- [ ] All existing `ConstructionPdfViewer.test.tsx` (106 tests) pass
- [ ] New: click-select line markup on PDF in continuous + select mode
- [ ] New: Delete key after click-select on PDF (not just table row)
- [ ] New: calibrate dialog in continuous scroll mode
- [ ] New: ctrl+wheel on continuous scroll container (not only document host)
- [ ] `npm run test --workspace=apps/web -- --run app/workspace/chat`

### Manual verification

1. Open a multi-page plan set, stay in continuous scroll (default).
2. Markups → Select → click highlight, drag corner handle, Delete.
3. Markups → Calibrate → draw reference line → Apply scale → Length tool shows real units.
4. Ctrl+scroll (or pinch) zoom in/out — smooth preview, minimal flash on release.
5. Normal scroll through 10+ pages — no blank wipe, page indicator tracks scroll.
6. Repeat on macOS (pinch) and Windows (Ctrl+wheel).

---

## 4. Agential Review

*Self-critique of this plan — what may still fail or was missed.*

### Likely failure modes

1. **Line hit slop** may intercept clicks meant for text underneath when select tool is active — MITIGATION: only widen hit area when `tool === 'select'` or markup is selected.
2. **Double rAF deferred preview clear** may cause 1-frame scale mismatch (transform + new scale) — MITIGATION: keep ratio math tied to committed zoom, limit defer to 2 frames max.
3. **Capture-phase wheel** on both host and scroll child risks double-handling — MITIGATION: `stopPropagation` after first handler runs; use shared handler ref.
4. **Calibrate mouseLeave fix** could leave orphaned draft state if user drags off-window — MITIGATION: still call `finishDraw` on `mouseUp` at document level.

### Missing edge cases

- Rotated pages: calibration uses `pageSpaceDims` from rotation — OK but untested at 90/270°.
- Fit Width / Fit Page + wheel zoom: commits to manual mode (intended) but may surprise users expecting fit to stick.
- Very large PDFs (100+ pages): commit still re-renders all mounted pages — virtualization is out of scope but remains a performance ceiling.
- Touchscreen Windows: no `ctrlKey` on pinch — relies on touch pinch handlers (separate code path).
- Markup table focus: typing in table filters + Delete could delete markup — `isEditableKeyboardTarget` guards inputs; OK.

### Competitor parity gaps (post-fix)

| Feature | Bluebeam / Acrobat | After this fix |
|---------|-------------------|----------------|
| Click-to-select any markup | ✅ | ✅ (select tool) |
| Drag body to move | ✅ | ✅ (rect/highlight) |
| Delete key | ✅ | ✅ |
| Calibrate scale | ✅ | ✅ |
| Ctrl+wheel zoom | ✅ | ✅ (improved) |
| Smooth zoom | ✅ (~no flash) | ⚠️ Improved, not perfect |
| Undo/redo | ✅ | ❌ Still P1 backlog |
| Space-to-pan temporarily | ✅ | ❌ Still backlog |

### Recommendation if flash persists

If crossfade + debounce is insufficient, next step is **visible-page-only scale update** (only re-render pages in viewport ±1 buffer) — larger refactor, not in this PR.

---

## 5. Execution Log

| Step | Status | Notes |
|------|--------|-------|
| Plan written | ✅ | This document |
| Agential review | ✅ | Section 4 |
| Branch `fix/pdf-viewer-markup-zoom` | ✅ | Created from main |
| P0 markup fixes | ✅ | `isMarkupEditActive`, wide line hit area, body drag, focus on select, deselect on empty click |
| P1 calibrate | ✅ | Window mouseup completes draw; continuous-mode test; switches to select after apply |
| P2 ctrl+wheel | ✅ | Capture-phase wheel on host + scroll container; `numPages` re-bind |
| P3 zoom flash | ✅ | 180ms debounce, double-rAF deferred preview clear, `.pdf-zoom-committing` opacity fade |
| P4 continuous scroll | ✅ | Select/edit pointer handlers on page containers; no scroll mode flip |
| Tests green + commit | ✅ | 131 tests pass in `app/workspace/chat` |
