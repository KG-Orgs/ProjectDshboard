# PDF Markup Keyboard Shortcuts

**Branch:** `feat/frontend-chat-viewer-improvements`  
**Date:** 2026-06-29  
**Primary code:** `apps/web/app/workspace/chat/ConstructionPdfViewer.tsx`

This document compares ContractorAI markup shortcuts with **Bluebeam Revu** and **Adobe Acrobat Pro**, and tracks what is implemented vs. backlog.

---

## 1. ContractorAI — Implemented Now

Shortcuts apply when the PDF viewer has focus and the event target is not an editable field (input, textarea, select).

| Action | Shortcut | Notes |
|--------|----------|-------|
| Find in document | `Ctrl/Cmd+F` | Focuses the find bar; does not conflict with browser find when viewer is focused |
| Delete selected markup | `Delete` or `Backspace` | Removes the selected markup |
| Deselect markup | `Escape` | Also cancels in-progress draw / area polygon / calibration dialog |
| Cancel draw / return to pan | `Escape` (no selection) | Switches to Hand (pan) tool |
| Select tool | `V` | Same as Bluebeam/Acrobat select |
| Hand / pan tool | `H` | Pan in single-page mode; continuous scroll uses native scroll |
| Zoom in | `+` or `=` | Switches to manual zoom, +10% |
| Zoom out | `-` | Switches to manual zoom, −10% |

---

## 2. Full Shortcut Matrix

Legend: ✅ Implemented · ⚠️ Partial · ❌ Not implemented · — N/A

### Navigation & view

| Action | ContractorAI | Bluebeam Revu | Adobe Acrobat Pro |
|--------|--------------|---------------|-------------------|
| Find in document | ✅ `Ctrl/Cmd+F` | `Ctrl/Cmd+F` | `Ctrl/Cmd+F` |
| Zoom in | ✅ `+` / `=` | `+` | `Ctrl/Cmd++` |
| Zoom out | ✅ `-` | `-` | `Ctrl/Cmd+-` |
| Zoom tool | ❌ | `Z` | `Z` |
| Fit width / fit page | ❌ (toolbar only) | Toolbar | `Ctrl/Cmd+0` page level |
| Pan (temporary) | ❌ | `Space` (hold) | `Space` (hold) |
| Next / previous page | ❌ (toolbar) | Arrow keys | Arrow keys |
| Rotate page | ❌ (toolbar) | Toolbar | Toolbar |

### Selection & edit

| Action | ContractorAI | Bluebeam Revu | Adobe Acrobat Pro |
|--------|--------------|---------------|-------------------|
| Select tool | ✅ `V` | `V` | `V` |
| Hand / pan tool | ✅ `H` | `Shift+V` | `H` |
| Deselect / cancel | ✅ `Escape` | `Esc` | `Esc` → Hand/Select |
| Delete markup | ✅ `Delete` / `Backspace` | `Del` | `Del` (selected annotation) |
| Undo | ❌ P1 | `Ctrl/Cmd+Z` | `Ctrl/Cmd+Z` |
| Redo | ❌ P1 | `Ctrl/Cmd+Y` | `Ctrl/Cmd+Y` |
| Copy / paste markup | ❌ P1 | `Ctrl/Cmd+C/V` | `Ctrl/Cmd+C/V` |
| Select all markups | ❌ P1 | `Ctrl/Cmd+A` | `Ctrl/Cmd+A` |

### Markup tools (single-key)

| Tool | ContractorAI | Bluebeam Revu | Adobe Acrobat Pro* |
|------|--------------|---------------|---------------------|
| Cloud | ❌ P1 | `C` | `Q` |
| Arrow | ❌ P1 | `A` | (via Drawing `D`) |
| Callout | ❌ P1 | `Q` | — |
| Text box | ❌ P1 | `T` | `X` |
| Highlight | ❌ P1 | `H` | `U` |
| Line | ❌ P1 | `L` | (via Drawing `D`) |
| Rectangle | ❌ P1 | `R` | (via Drawing `D`) |
| Stamp | ❌ P1 | `S` | `K` |
| Pen | ❌ P1 | `P` | — |
| Length / measure | ❌ P1 | `Shift+L` | — |

\*Acrobat single-key tool shortcuts require **Edit → Preferences → General → Use Single-Key Accelerators**.

---

## 3. P1 Backlog (recommended next)

| Item | Rationale | Reference |
|------|-----------|-----------|
| **Undo / redo stack** | `Ctrl/Cmd+Z` / `Ctrl/Cmd+Y` — expected in every markup app | Bluebeam Edit menu |
| **Tool hotkeys** | `C` cloud, `A` arrow, `T` text, `L` line, `R` rect, `S` stamp | Bluebeam markup keys |
| **Space to pan (hold)** | Pan while drawing without switching tools | Bluebeam, Acrobat |
| **Copy / duplicate markup** | `Ctrl/Cmd+C/V`, `Ctrl/Cmd+Shift+click` drag copy | Bluebeam |
| **Ortho / snap while drawing** | `Shift` constrain 45°/90° on lines | Bluebeam |
| **Page navigation keys** | `↑/↓` or `PgUp/PgDn` in single-page mode | Acrobat |
| **Zoom tool (`Z`)** | Marquee zoom | Acrobat |

---

## 4. P2 Backlog

- Custom shortcut map / preferences UI  
- Tool chest numeric hotkeys (Bluebeam My Tools)  
- `Ctrl/Cmd+0` fit page, `Ctrl/Cmd+1` actual size  
- Batch export markups (`Ctrl+F2` in Bluebeam)  
- Accessibility: shortcut cheat sheet in toolbar `?` menu  

---

## 5. Implementation Notes

- **Find (`Ctrl/Cmd+F`):** Intentionally captured in the viewer so search targets the PDF find bar, not the browser chrome.
- **Delete vs. Backspace:** Both delete the selected markup (Bluebeam uses `Del`; web users expect Backspace too).
- **Undo:** Requires an action history stack (create, move, resize, delete, text edit). Not yet wired — document as P1 until stack exists.
- **Focus model:** Viewer root receives focus on click; shortcuts are suppressed while typing in markup textareas or the markup table.

---

## Sources

- [Bluebeam Revu keyboard shortcuts](https://support.bluebeam.com/revu/resources/keyboard-shortcuts.html)
- [Adobe Acrobat tool shortcuts (Windows)](https://wehackwork.com/2024/08/06/adobe-acrobat-tool-comments-pdf-navigation-forms-and-portfolios-keyboard-shortcuts-windows-edition/)
- [Adobe Acrobat Pro 2026 shortcuts PDF](https://trainingonsite.com/images/downloads/Acrobat-Pro-2026-keyboard-shortcuts-2026-01-01.pdf)
