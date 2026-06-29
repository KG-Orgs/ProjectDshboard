# PDF Navigation & Viewer Features — Competitor Audit

**Branch:** `feat/frontend-chat-viewer-improvements`  
**Date:** 2026-06-29  
**Scope:** `ConstructionPdfViewer.tsx`, workspace layout, navigation ergonomics  
**Related docs:** [pdf-viewer-gap-audit.md](./pdf-viewer-gap-audit.md) · [markup-keyboard-shortcuts.md](./markup-keyboard-shortcuts.md)

**Competitors benchmarked:** Bluebeam Revu, Adobe Acrobat Pro, Mozilla PDF.js default viewer, browser native (Chrome/Safari/Firefox), Procore/PlanGrid sheet viewer, PDF Expert (Readdle)

---

## 1. Executive Summary

ContractorAI’s chat workspace PDF viewer now supports **continuous scroll (default)**, toolbar/keyboard zoom, and **pinch-to-zoom** (trackpad Ctrl+wheel and two-finger touch) with focal-point preservation. Navigation is adequate for MVP read-only review but still lags pro construction tools on **page virtualization**, **temporary pan (Space)**, **spread view**, **split/compare**, and **measurement-centric navigation**.

**Top navigation gaps to implement next (recommended order):**

| Priority | Gap | Why |
|----------|-----|-----|
| **P0** | Page virtualization in continuous scroll | 100+ sheet plan sets remain unusable without visible-window rendering |
| **P0** | Spacebar hold-to-pan | Expected in every pro viewer; blocks markup + pan workflow |
| **P1** | Page Up/Down / arrow-key page nav | Table stakes in Acrobat, Bluebeam, PDF.js |
| **P1** | Middle-mouse pan | Standard on desktop CAD/PDF tools |
| **P1** | Zoom presets & fit shortcuts (`Ctrl+0` fit page, `Ctrl+1` actual size) | Faster than toolbar clicks |
| **P1** | Mini-map / page scroll indicator | Large drawing sets need spatial orientation |
| **P2** | Spread / facing pages | Spec books and booklet PDFs |
| **P2** | Split view / side-by-side sheets | Compare revisions, details vs plans |
| **P2** | Native PDF link annotations | Cross-sheet references in specs |

---

## 2. Zoom

| Feature | Bluebeam Revu | Adobe Acrobat | PDF.js viewer | Browser native | Procore/PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|---------------|---------------|---------------|----------------|------------------|------------|------------------|-----|----------|
| Pinch / trackpad zoom | ✅ | ✅ | ✅ | ✅ | ✅ (mobile) | ✅ | ✅ **NEW** — Ctrl+wheel + touch pinch, focal point | — | — |
| Mouse wheel zoom (no modifier) | Optional | ✅ | ✅ | ✅ | — | ✅ | ❌ wheel scrolls page | Intentional in continuous mode | P2 |
| Toolbar +/- | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ ±10% | — | — |
| Keyboard +/- | ✅ | ✅ Ctrl/Cmd | ✅ | — | — | ✅ | ✅ `+`/`-` | — | — |
| Fit width | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ toolbar | No shortcut | P1 |
| Fit page | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ toolbar | No shortcut | P1 |
| Fit visible / marquee zoom | ✅ (Zoom tool) | ✅ (`Z` tool) | — | — | — | — | ❌ | Marquee zoom missing | P1 |
| Zoom presets (50/100/200%) | ✅ dropdown | ✅ | ✅ | — | — | ✅ | ❌ | Manual % only | P2 |
| Zoom toward cursor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **NEW** | — | — |
| Max zoom | 6400% | 6400% | high | browser limit | moderate | high | 300% | May be low for fine markup | P2 |

**Implemented this sprint:** Pinch-to-zoom on viewer stage (`ConstructionPdfViewer.tsx`), zoom anchored to cursor/finger midpoint, switches from fit-width/page to manual zoom, scroll position preserved via `useLayoutEffect`.

---

## 3. Pan

| Feature | Bluebeam | Acrobat | PDF.js | Browser | PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|----------|---------|--------|---------|----------|------------|------------------|-----|----------|
| Hand tool | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ single-page mode | — | — |
| Spacebar hold-to-pan | ✅ | ✅ | — | — | — | ✅ | ❌ | Documented P1 in shortcuts doc | **P0** |
| Middle-mouse drag pan | ✅ | ✅ | — | — | — | ✅ | ❌ | Desktop expectation | P1 |
| Two-finger pan (trackpad) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ native scroll | — | — |
| Pan in continuous scroll | scroll | scroll | scroll | scroll | scroll | scroll | ✅ native scroll | Hand tool N/A in continuous | — |
| Pan while markup tool active | ✅ (Space) | ✅ (Space) | — | — | — | — | ❌ | Must switch to Hand | **P0** |

---

## 4. Page Navigation

| Feature | Bluebeam | Acrobat | PDF.js | Browser | PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|----------|---------|--------|---------|----------|------------|------------------|-----|----------|
| Thumbnail sidebar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (collapsed default) | Lazy load missing | P1 |
| Bookmark / outline tree | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ clickable | No outline search | P2 |
| Prev / Next toolbar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Page number input | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | — |
| Page Up / Down keys | ✅ | ✅ | ✅ | ✅ | — | ✅ | ❌ | P1 in shortcuts backlog | P1 |
| Arrow keys (single page) | ✅ | ✅ | ✅ | — | — | ✅ | ❌ | — | P1 |
| Go to page dialog | ✅ | ✅ | ✅ | — | — | ✅ | ⚠️ spinbutton only | — | P2 |
| Scroll-synced page indicator | ✅ | — | — | — | ✅ | — | ⚠️ internal only | `displayedPdfPage` unused in UI | P1 |
| Hyperlink jump (in-PDF) | ✅ | ✅ | ✅ | ✅ | — | ✅ | ❌ | `renderAnnotationLayer={false}` | P1 |
| Citation / AI jump | — | — | — | — | — | — | ✅ **differentiator** | — | — |

---

## 5b. Text Selection & Copy

| Feature | Bluebeam | Acrobat | PDF.js | Browser | PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|----------|---------|--------|---------|----------|------------|------------------|-----|----------|
| Select & copy text | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **NEW** — continuous + single, native Ctrl/Cmd+C | — | — |
| Selection → highlight markup | ✅ | ✅ | — | — | — | ✅ | ❌ | P1 follow-up | P1 |
| Ask AI / comment on selection | plugins | — | — | — | — | — | ❌ | P1 — chat integration | P1 |
| Text selection while drawing | blocked | blocked | — | — | — | — | ⚠️ disabled during draw tools | Use select/pan to copy | — |

**Implemented this sprint:** `renderTextLayer={true}` on all viewer pages; markup overlay `z-index` above text layer with `pointer-events: none` except during active drawing tools; standard `::selection` highlight via `workspace.css`.

---

## 6. Rotation, Spread View, Facing Pages

| Feature | Bluebeam | Acrobat | PDF.js | Browser | PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|----------|---------|--------|---------|----------|------------|------------------|-----|----------|
| Rotate 90° | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ toolbar | No shortcut | P2 |
| Rotate view vs rotate page | both | both | view | view | view | both | view only | — | P2 |
| Single-page scroll mode | ✅ | ✅ | ✅ | — | — | ✅ | ✅ toggle | — | — |
| Continuous scroll | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ default | — | — |
| Spread (two-page) | ✅ | ✅ | — | — | — | ✅ | ❌ | Spec book reading | P2 |
| Facing pages (cover alone) | ✅ | ✅ | — | — | — | ✅ | ❌ | — | P2 |
| Page curl / shadow polish | — | ✅ | — | — | — | ✅ | ⚠️ minimal | Visual polish | P2 |

---

## 7. Split View / Tabs

| Feature | Bluebeam | Acrobat | PDF.js | Browser | PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|----------|---------|--------|---------|----------|------------|------------------|-----|----------|
| Multi-document tabs | ✅ | ✅ | — | ✅ | ✅ sets | ✅ | ✅ workspace doc tabs | — | — |
| Split view (same doc) | ✅ | ✅ | — | — | — | ✅ | ❌ | Compare sheet areas | P2 |
| Side-by-side compare | ✅ | ✅ | — | — | ✅ overlay | — | ❌ | Revision compare | P2 |
| Sync scroll between panes | ✅ | ✅ | — | — | — | — | ❌ | — | P2 |
| Detach to second window | ✅ | ✅ | — | ✅ | — | ✅ | ❌ | — | P2 |

---

## 8. Search / Find

| Feature | Bluebeam | Acrobat | PDF.js | Browser | PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|----------|---------|--------|---------|----------|------------|------------------|-----|----------|
| Find bar (Ctrl+F) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ find bar | Highlight limited in continuous | P1 |
| Next / prev match | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — |
| Case / whole word | ✅ | ✅ | ✅ | ✅ | — | ✅ | ❌ | — | P2 |
| Highlight all matches | ✅ | ✅ | ✅ | — | — | ✅ | ⚠️ single mode + one page | Continuous highlight weak | P1 |
| Search in thumbnails | — | — | — | — | — | — | ❌ | — | P2 |

See [pdf-viewer-gap-audit.md §3.4](./pdf-viewer-gap-audit.md) for search implementation detail.

---

## 9. Measurement Navigation

| Feature | Bluebeam | Acrobat | PDF.js | Browser | PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|----------|---------|--------|---------|----------|------------|------------------|-----|----------|
| Calibrated scale | ✅ | ✅ plugins | ❌ | ❌ | ✅ | ✅ | ✅ calibrate tool | — | — |
| Length / area tools | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | — | — |
| Snap / ortho while measuring | ✅ | ✅ | — | — | ✅ | — | ❌ | Shift-constrain | P1 |
| Jump to markup / issue | ✅ Studio | — | — | — | ✅ | — | ✅ sidebar + table | — | — |
| Measurement list panel | ✅ | — | — | — | ✅ | — | ⚠️ markup table | Filter by measure type | P2 |
| Scale display on sheet | ✅ | — | — | — | ✅ | — | ❌ | Show active scale in toolbar | P2 |

---

## 10. Touch / Tablet

| Feature | Bluebeam | Acrobat | PDF.js | Browser | PlanGrid | PDF Expert | **ContractorAI** | Gap | Priority |
|---------|----------|---------|--------|---------|----------|------------|------------------|-----|----------|
| Pinch zoom | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **NEW** | — | — |
| Two-finger pan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ native scroll | — | — |
| Apple Pencil markup | ✅ iOS | ✅ | — | — | ✅ | ✅ | ❌ | Tablet field use | P2 |
| Touch-friendly toolbar | ✅ | ✅ | ⚠️ | — | ✅ | ✅ | ⚠️ small targets | Responsive toolbar | P1 |
| Palm rejection | ✅ | — | — | — | — | ✅ | ❌ | — | P2 |

---

## 11. Cross-Reference: What We Have vs Gap Audit

| Area | pdf-viewer-gap-audit status | This audit update |
|------|----------------------------|-------------------|
| Zoom pinch | ❌ listed as gap | ✅ **Implemented** (2026-06-29) |
| Keyboard zoom | P1 quick win | ✅ implemented (`+`/`-`) |
| Find UI | P0 restore | ✅ find bar present; continuous highlight still partial |
| Space pan | Not explicit | **P0** for navigation + markup |
| Virtualization | P1 | Still **P0** for construction sheet sets |
| Spread view | P2 | Confirmed P2 |
| Split compare | P2 | Confirmed P2 |

---

## 12. Cross-Reference: Keyboard Shortcuts

From [markup-keyboard-shortcuts.md](./markup-keyboard-shortcuts.md):

| Shortcut area | Status | Navigation audit note |
|---------------|--------|----------------------|
| `Ctrl/Cmd+F` find | ✅ | Align with continuous highlight |
| `+`/`-` zoom | ✅ | Complements new pinch zoom |
| `H` / `V` tools | ✅ | Pan only in single-page mode |
| Space hold pan | ❌ P1 | Elevate to **P0** for navigation |
| Page keys | ❌ P1 | Confirmed gap vs all competitors |
| `Z` marquee zoom | ❌ P1 | Confirmed gap vs Acrobat/Bluebeam |
| Fit shortcuts | ❌ P2 | `Ctrl+0` / `Ctrl+1` |

---

## 13. Recommended Roadmap (Navigation-Focused)

### P0 — Blocks field / office daily use

1. **Visible-page virtualization** — render ±3 pages around viewport ([pdf-viewer-gap-audit P1-1](./pdf-viewer-gap-audit.md)).
2. **Spacebar hold-to-pan** — works in continuous scroll and during markup tools.
3. **Markup interaction in continuous scroll** — overlay hit targets without mode switch.

### P1 — Professional parity

4. **Page Up/Down and arrow keys** for page navigation.
5. **Middle-mouse pan** on viewer stage.
6. **Fit width/page keyboard shortcuts** (`Ctrl+0`, `Ctrl+1`).
7. **Zoom tool (marquee)** — `Z` key per shortcuts doc.
8. **Show scroll-synced page** in toolbar or doc tab (`displayedPdfPage`).
9. **Find highlight in continuous mode** across all visible pages.
10. **Lazy thumbnail sidebar** — IntersectionObserver per thumb.

### P2 — Differentiation & polish

11. Spread / facing pages.
12. Split view + sync scroll.
13. Native PDF link annotations.
14. Zoom preset dropdown.
15. Mini-map / sheet navigator for 50+ page sets.

---

## 14. Implementation Notes (Pinch Zoom)

**Files:** `ConstructionPdfViewer.tsx`, `workspace.css`

- **Trackpad:** `wheel` + `ctrlKey`/`metaKey` on `.pdf-viewer-document-host` (passive: false).
- **Touch:** two-finger `touchstart`/`touchmove` with distance ratio.
- **Focal point:** scroll offset adjusted as `(scroll + focal) * ratio - focal` before/after zoom percent change.
- **Fit modes:** pinch exits fit-width/page → manual zoom at current effective %.
- **Does not block:** one-finger scroll, pan (single mode), markup tools, find bar inputs (`isEditableKeyboardTarget` guard).

**Tests:** `ConstructionPdfViewer.test.tsx` — Ctrl+wheel zoom, focal scroll preservation, touch pinch mock.
