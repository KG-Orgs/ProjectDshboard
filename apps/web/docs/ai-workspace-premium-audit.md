# AI Workspace Premium Audit — ContractorAI

**Branch:** `feat/frontend-chat-viewer-improvements`  
**Date:** 2026-06-29  
**Scope:** Full AI chat workspace — layout, chat UX, file navigation, document viewer, onboarding, mobile, backend surface area, construction workflows  
**Companion docs:** [pdf-viewer-gap-audit.md](./pdf-viewer-gap-audit.md), [construction-markup-premium-audit.md](./construction-markup-premium-audit.md)

---

## 1. Executive Summary

ContractorAI's workspace is a **credible three-panel AI + document shell** with a genuine differentiator: **retrieval-backed answers that open cited PDFs at the right page**. It does not yet feel like a premium construction assistant when compared to ChatGPT Projects, Claude, Copilot, Procore, Bluebeam Studio, or Autodesk Build.

**Current maturity (honest ranges vs. category leaders):**

| Dimension | ContractorAI | ChatGPT / Claude Projects | Procore / Autodesk Build | Bluebeam Studio |
|-----------|--------------|---------------------------|--------------------------|-----------------|
| Chat UX & streaming | ~45% | Baseline | ~30% (not chat-first) | ~15% |
| Project file navigation | ~50% | ~60% (upload + memory) | ~90% | ~70% |
| Document viewer + citations | ~70% | ~40% | ~55% | ~95% |
| Construction markups / review | ~35% | N/A | ~75% | Baseline |
| Session / history management | ~25% | ~85% | ~50% | ~40% |
| Mobile / field use | ~15% | ~70% | ~80% | ~50% |
| Backend intelligence surfaced | ~40% | N/A | ~60% | ~20% |

**Strategic wedge:** AI plan/spec Q&A with **page-accurate citations** and an integrated PDF viewer — not a PM platform or full Bluebeam replacement yet.

**Recent UI consistency pass (this branch):** Maximized document canvas by default — Files, Chat, PDF thumbnails/bookmarks, markup tools, and markup table all **collapsed on load**; removed redundant PDF filename from toolbar (tabs carry filename); replaced raw `<`/`>` sidebar caret with Lucide panel icons; slimmed top bar and panel chrome.

---

## 2. What Exists Today

### 2.1 Layout (`page.tsx`, `workspace.css`)

| Area | Status |
|------|--------|
| Three-panel layout | Files (left) · Viewer (center) · Chat (right) |
| Default state | **All side panels collapsed** — vertical rails maximize viewer |
| Top bar | Back, project name, Files/Chat toggles, New chat, user avatar |
| Document tabs | Dark strip on viewer; filename only here (not duplicated in PDF toolbar) |
| Resize | Draggable dividers when panels expanded |
| Drag-drop | Drop files onto viewer to open |

### 2.2 Chat / Assistant

| Area | Status |
|------|--------|
| Message API | `POST /api/chat/sessions/:id/message` with history, openDocs, activeDoc context |
| Citations | Source chips with page numbers; click opens PDF at page |
| Streaming | **Not implemented** — full response returned at once |
| Suggested follow-ups | Rendered from API `suggestions` |
| Session persistence | DB + localStorage cache per session |
| Conversation sidebar | `ConversationSidebar.tsx` + `useConversationStore` exist but **not wired into workspace page** |
| Rename / pin / delete sessions | Backend + store support; **no UI in workspace** |
| Feedback / thumbs | Backend accepts `feedback` on message; **no UI** |
| Model picker | None |
| Attachments / @-mentions | None |
| Voice input | None |

### 2.3 File explorer

| Area | Status |
|------|--------|
| Data source | `GET /api/projects/:id/files` (paginated, 300 cap in UI) |
| Tree | Flat folder grouping from `filePath` |
| Search | Client-side filter only |
| Index status | `indexStatus` on file model — **not shown in UI** |
| Upload / sync | Dashboard OneDrive sync — **not triggerable from workspace** |
| RFI / submittal typing | No badges, filters, or Procore-style registers |

### 2.4 Document viewer

| Area | Status |
|------|--------|
| PDF | Full `ConstructionPdfViewer` — see companion audits |
| TXT | Monospace scroll view |
| Images | Inline preview |
| DOCX / XLSX | Placeholder — AI can cite, no render |
| Citation jump | `openPdfCitation` global + bounding-box flash |
| Split / compare | None |
| Workspace-level search | Removed; PDF has in-document find |
| **Save button** | Downloads **original PDF only** (no markup burn-in); markups persist separately via API |
| Markup persistence | `pdf_markups` table — overlay JSON, auto-saved on create/edit/delete |
| PDF byte source | Streamed on demand from OneDrive Graph (`Files.Read`) or local corpus path (`local:*` + `LOCAL_CORPUS_PARENT`) |
| OneDrive write-back | **Not implemented** — OAuth scopes are read-only; no Graph upload/PUT |

### 2.5 Backend capabilities not surfaced in UI

| API | Purpose | UI gap |
|-----|---------|--------|
| `PATCH/DELETE /api/chat/sessions/:id` | Rename, pin, delete | No session list in workspace |
| `GET /api/projects/:id/suggestions` | Proactive prompts | Not shown |
| `GET /api/projects/:id/context` | Project snapshot for AI | Invisible to user |
| `POST /api/projects/:id/search` | Direct retrieval preview | No search/debug UI |
| `GET /api/projects/:id/retrieval/preview` | Retrieval tuning | Admin-only potential |
| `GET /api/files/:fileId` | Chunk-level document detail | Was workspace search; removed |
| `POST /api/projects/:id/relationships/build` | Document graph | No graph UI |
| `GET /api/projects/:id/indexing/progress` | Index status | Dashboard only |
| `GET/PUT /api/projects/:id/features` | Feature flags per project | No settings panel |
| `GET /api/features/registry` | Available features | No settings panel |
| Markup CRUD + export | Full construction markup API | Partially surfaced in PDF viewer |

---

## 3. Gap Analysis by Area

### 3.1 Chat / Assistant UX (vs. ChatGPT, Claude, Copilot)

**Missing for premium feel:**
- **Streaming tokens** with stop button and scroll anchoring
- **Conversation history sidebar** (component exists, unwired)
- **Session titles** auto-generated and editable
- **Pin / archive / delete** conversations
- **Regenerate** and **edit last message**
- **Copy message** / export thread
- **Keyboard shortcuts** (⌘K command palette, ⌘Enter send — partial)
- **Rich inputs**: file attach, drag citation into prompt, @-file mentions
- **Tool use transparency**: show retrieval steps, sources panel expandable
- **Depth modes** (quick vs. thorough) — backend has depth; no toggle
- **Project instructions** (Claude Projects-style system context) — partial via project snapshot

### 3.2 File tree / project navigation

- No breadcrumbs or sync source indicator (OneDrive path)
- No file type icons consistency for construction doc types (RFI, submittal, spec section)
- No sort (date, name, type) or flat list toggle
- No recent / pinned files
- No upload from workspace
- No bulk actions or multi-select for AI context ("analyze these 3 specs")
- Pagination hidden — 300 file cap silent

### 3.3 Document viewer + chat integration

**Strengths:** Citation chips, auto-open on intent, page jump, citation bounding box.

**Gaps:**
- No **split view** (chat + full-page side by side on ultrawide without collapsing panels)
- No **highlight sync** — AI citation box doesn't persist while reading answer
- No **"ask about this selection"** from PDF text (text layer now enabled; chat bridge still missing)
- No **compare revisions** (critical for construction)
- No **sheet index / discipline filter** for drawing sets
- `displayedPdfPage` tracked but **not sent back** to chat as context on follow-up

### 3.4 Onboarding & empty states

- Empty viewer state is generic — no project-specific suggested actions from `/suggestions`
- No first-run tour (Files rail → ask question → citation jump)
- No index-health warning ("42 files still indexing")
- Chat empty state shows 2 hardcoded prompts, not project-aware
- No sample queries based on detected doc types (RFIs present, etc.)

### 3.5 Mobile / responsive

- Three fixed panels break below ~1024px — no stacked or tabbed mobile layout
- PDF toolbar overflows horizontally — scroll only, no compact mode
- Markup tools unusable on touch (no touch handlers)
- No PWA / offline / field photo capture
- Collapsed rails (32px) too narrow for touch targets (WCAG)

### 3.6 Construction-specific workflows

| Workflow | Competitor reference | ContractorAI today |
|----------|---------------------|-------------------|
| **RFI register** | Procore, Autodesk | AI can answer about RFI PDFs; no register, numbering, due dates, assignee workflow |
| **Submittal log** | Procore | Stamp markup types exist; no log, spec section linkage, approval chain |
| **Spec search by section** | MasterSpec tools | Retrieval works; no CSI division browser |
| **Plan sheet review** | Bluebeam Studio | Markups + categories; no sessions, status sync, publish |
| **Punch list** | Fieldwire, Procore | Markup statuses approximate; no location, trade, photo punch |
| **Change order / PCO** | Procore | Category exists; no CO workflow |
| **Meeting minutes → actions** | Various | Not supported |
| **Submittal ↔ spec cross-ref** | Autodesk | Relationship API exists; no UI |

---

## 4. Competitor Positioning

### vs. ChatGPT / Claude Projects
- **We win:** Native PDF viewer, page-level citations, construction retrieval, markups on same canvas
- **We lose:** Streaming, polish, mobile, conversation management, file upload simplicity, model choice

### vs. Microsoft Copilot (M365)
- **We win:** Construction-tuned retrieval, drawing markups, project-scoped file tree from OneDrive sync
- **We lose:** Enterprise SSO depth, Teams integration, familiar Office UX

### vs. Procore / Autodesk Build
- **We win:** AI Q&A across unstructured project files, fast citation navigation
- **We lose:** Authoritative registers (RFI, submittals), permissions, audit, field apps, ACC/BCF integration

### vs. Bluebeam Studio
- **We win:** AI assistant, semantic search across whole project
- **We lose:** Real-time multi-user markups, calibrated quantity takeoff maturity, tool palette depth, Studio Sessions

---

## 5. Priority Matrix

### P0 — Must ship for credible premium beta

| # | Item | Rationale |
|---|------|-----------|
| 1 | **Wire conversation history sidebar** | `ConversationSidebar` built but unused; users can't switch threads |
| 2 | **Streaming chat responses** | Table stakes vs. every AI product; reduces perceived latency |
| 3 | **Session title + rename** | Long projects need many threads; untitled sessions don't scale |
| 4 | **Index status in file tree** | Users must know if AI can "see" a file (`indexed` vs `pending`) |
| 5 | **Mobile breakpoint layout** | Tabbed Files / Viewer / Chat below 900px |
| 6 | **Continuous-mode text selection + ask** | Copy/select works (2026-06-29); ask-AI-on-selection still blocked |
| 7 | **Project suggestions API in empty states** | `/suggestions` already exists — surface it |
| 8 | **Send visible page to chat context** | Follow-ups like "what about this page?" need `displayedPdfPage` |

### P1 — High value for construction PM / superintendent persona

| # | Item | Rationale |
|---|------|-----------|
| 9 | RFI quick-create from markup (category → draft RFI) | Bridges AI viewer to PM workflow |
| 10 | Submittal log view (filter files + statuses) | Construction org expects register, not folder tree |
| 11 | DOCX / XLSX preview (Office or converted PDF) | Specs and schedules are core formats |
| 12 | Revision compare (two PDF tabs, overlay diff) | Drawing review essential |
| 13 | Markup → PDF export with burn-in | Record set deliverable |
| 14 | Real-time markup sync (WebSocket) | Multi-discipline review |
| 15 | Thumbs up/down on answers → `feedback` API | Quality loop for retrieval tuning |
| 16 | Upload / sync trigger from workspace | Don't force dashboard round-trip |
| 17 | Keyboard shortcut overlay (?) | Power users on plan sets |
| 18 | OCR pipeline for scanned sheets | Search + cite on image-only PDFs |

### P2 — Differentiators & platform depth

| # | Item | Rationale |
|---|------|-----------|
| 19 | Document relationship graph UI | Backend `relationships/build` unused |
| 20 | CSI division browser + spec-section filter | Construction-native navigation |
| 21 | Procore / ACC bi-directional RFI sync | Meet users in existing PM tool |
| 22 | Voice-to-RFI field capture | Superintendent workflow |
| 23 | Quantity takeoff export (CSV to estimate tools) | Extends calibrated measurements |
| 24 | Feature flags UI per project | `/features` API exists |
| 25 | Agent modes (plan review, spec compliance, schedule) | Depth beyond single chat |
| 26 | Shared review sessions (Bluebeam-style) | Formal design review |
| 27 | Audit log for markups + chat | Enterprise trust |
| 28 | PWA + offline cached drawings | Job-site connectivity |

---

## 6. UI / Design Consistency Notes (addressed this branch)

| Issue | Resolution |
|-------|------------|
| Redundant PDF filename in toolbar | Removed — tabs are canonical |
| Raw `<` / `>` sidebar toggle | `PanelLeft` / `PanelLeftClose` with labels |
| Panels open by default | Files, Chat, PDF sidebar, markup tools/table collapsed |
| Duplicate panel headers | Slim inline toolbars; top bar owns toggle affordances |
| Mixed iconography | Lucide throughout workspace + PDF sidebar |
| Wasted vertical chrome | Top bar 40px; doc tabs 30px; markup panel 24px collapsed rail |

**Remaining design debt:**
- PDF toolbar still text-heavy (Prev/Next vs icons)
- Dark doc tabs + light PDF toolbar — intentional contrast but could unify token set
- Inline styles remain in markup overlay rendering (acceptable for canvas)
- No shared design tokens file — colors duplicated across `workspace.css`

---

## 7. Recommended Roadmap (90 days)

**Month 1 — Chat credibility**
- Wire `ConversationSidebar`, streaming, session titles
- Empty states from `/suggestions`; index badges in file tree
- Mobile tab layout

**Month 2 — Construction workflows**
- RFI draft from markup; submittal file filter
- DOCX preview; page context in chat API
- Thumbs feedback UI

**Month 3 — Review parity**
- Markup PDF export; revision compare v1
- OCR for scanned sets
- Shared session prototype (read-only multi-user)

---

## 8. Test & Quality Notes

- Workspace tests: `page.test.tsx`, `pdf-open-from-tree.test.tsx`
- PDF viewer: `ConstructionPdfViewer.test.tsx` (large suite)
- **Gap:** No E2E Playwright for full citation flow
- **Gap:** No visual regression for layout collapse defaults
- **Gap:** No a11y audit (rails, toolbar, markup table)

---

## 9. Top 10 Feature Gaps (executive short list)

1. **Conversation history UI** — built but not integrated  
2. **Streaming responses** — non-negotiable for modern AI UX  
3. **File index status visibility** — trust in AI answers  
4. **Mobile layout** — field staff can't use workspace on tablet  
5. **Text selection → ask in PDF** — spec quoting workflow blocked  
6. **RFI / submittal registers** — construction users expect logs, not folders  
7. **DOCX/XLSX preview** — half of project docs unreadable in viewer  
8. **Revision compare** — drawing review without it feels amateur  
9. **Markup PDF export** — deliverable for design review meetings  
10. **Project-aware onboarding** — `/suggestions` and index health unused  

---

*This document should be updated when major workspace features ship or competitor baselines shift.*
