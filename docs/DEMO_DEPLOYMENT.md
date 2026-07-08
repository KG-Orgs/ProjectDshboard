# Demo Deployment Guide

Share a live ContractorAI demo with teammates (e.g. George) using the **shared Neon Postgres** index and Microsoft sign-in.

## Recommended path: Render (web + API)

**Why Render:** One blueprint deploys both services from this repo, gives public HTTPS URLs immediately, and uses your existing Neon database (no local Postgres). Alternative: `docker-compose.demo.yml` on any VM.

| Component | Provider |
|-----------|----------|
| Database | Neon (shared, already indexed) |
| API | Render Docker service (`contractorai-api`) |
| Web | Render Docker service (`contractorai-web`) |
| Redis | Optional — omit for read-only chat demo |

---

## Prerequisites

### 1. Shared Neon `DATABASE_URL`

Kyle provides the team connection string (never commit it). All demo users share the same projects and index.

### 2. Azure App Registration

In [Azure Portal](https://portal.azure.com/) → App registrations → your app:

1. **Authentication** → add a **Web** redirect URI:
   ```
   https://<your-web-host>/auth/callback
   ```
   Examples:
   - Render: `https://contractorai-web.onrender.com/auth/callback`
   - Local Docker: `http://localhost:3000/auth/callback`

2. Keep existing local URI for development.

3. API permissions: `openid`, `profile`, `email`, `offline_access`, `Files.Read`.

### 3. AI keys

At minimum one chat provider:

- `GEMINI_API_KEY` (preferred), or
- `OPENAI_API_KEY`

---

## Deploy to Render (step-by-step)

### 1. Connect the repo

1. Go to [render.com](https://render.com) → **New** → **Blueprint**.
2. Connect the GitHub repo and branch (`fix/pdf-viewer-markup-zoom` or `main`).
3. Render reads `render.yaml` at the repo root.

### 2. Set secret environment variables

In the Render dashboard, for **contractorai-api**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string (from Kyle) |
| `MICROSOFT_CLIENT_ID` | Azure app client ID |
| `MICROSOFT_CLIENT_SECRET` | Azure app secret |
| `OAUTH_REDIRECT_URI` | `https://contractorai-web.onrender.com/auth/callback` |
| `GEMINI_API_KEY` | Gemini key (or use `OPENAI_API_KEY`) |
| `PLATFORM_OPERATOR_EMAILS` | `kyle.xu4@gmail.com` (invite-only sign-in; only you can provision orgs) |

`API_BASE_URL` and `WEB_ORIGIN` are wired from service hosts in `render.yaml`. After the first deploy, confirm:

- `API_BASE_URL` = `https://contractorai-api.onrender.com`
- `WEB_ORIGIN` = `https://contractorai-web.onrender.com`

### 3. Database migrations

Apply SQL migrations against Neon **before** first deploy (or after pulling schema changes):

```bash
cd packages/backend
# Existing Neon DB (schema already present): baseline once, then apply new files only
pnpm db:apply-migrations -- --baseline
pnpm db:apply-migrations

# Fresh empty database: apply all migrations in order
pnpm db:apply-migrations
```

Uses `DATABASE_URL` from repo-root `.env`. Tracks applied files in `schema_sql_migrations`. Requires `psql`.

### 4. Deploy

Click **Apply**. First build takes ~5–10 minutes (Docker images for web + API).

### 5. Verify health

```bash
curl https://contractorai-api.onrender.com/health/api
curl -I https://contractorai-web.onrender.com/
```

### 5. Share the demo URL

Send teammates:

```
https://contractorai-web.onrender.com
```

They sign in with Microsoft. No local setup required.

---

## Alternative: Docker Compose demo (VM or laptop)

Good for a private server or quick local smoke test against Neon.

```bash
# 1. Copy and fill secrets
cp .env.example .env
# Edit: DATABASE_URL, MICROSOFT_*, GEMINI_API_KEY or OPENAI_API_KEY

# 2. Start
pnpm demo:up
# or: docker compose -f docker-compose.demo.yml up -d --build

# 3. Open
open http://localhost:3000
```

`.env` values for Docker demo:

```env
DATABASE_URL=postgresql://...@...neon.tech/...?sslmode=require
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
GEMINI_API_KEY=...
WEB_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`docker-compose.demo.yml` sets `BACKEND_API_URL=http://backend:3001` inside the web container automatically.

---

## Environment variable checklist

### Kyle (deploy owner)

| Variable | Where | Notes |
|----------|-------|-------|
| `DATABASE_URL` | API | Neon shared URL |
| `MICROSOFT_CLIENT_ID` | API | Azure app |
| `MICROSOFT_CLIENT_SECRET` | API | Azure secret |
| `OAUTH_REDIRECT_URI` | API | `https://<web-host>/auth/callback` |
| `API_BASE_URL` | API | Public API URL |
| `WEB_ORIGIN` | API | Public web URL (CORS) |
| `GEMINI_API_KEY` or `OPENAI_API_KEY` | API | Chat / RAG |
| `PLATFORM_OPERATOR_EMAILS` | API | **Required for locked-down deploy.** Your email only, e.g. `kyle.xu4@gmail.com` |
| `BACKEND_API_URL` | Web | Internal or public API URL |
| `NEXT_PUBLIC_API_URL` | Web | Public API URL (build-time arg for Docker) |

### Demo users (George, etc.)

Demo users need **no env vars**. They only need:

1. The demo URL
2. A Microsoft account Kyle has granted org access (see below)

---

## Platform operator (invite-only production)

When `PLATFORM_OPERATOR_EMAILS` is set on the API service:

- **Only listed emails** can sign in without a prior invite (your platform operator account).
- **Everyone else** must be added to an organization **before** their first Microsoft sign-in.
- **Only platform operators** can use **Platform Admin** (`/admin`) to create organizations and add users.

### Deploy workflow (Kyle)

1. Deploy to Render with `PLATFORM_OPERATOR_EMAILS=kyle.xu4@gmail.com`.
2. Run `pnpm db:apply-migrations` against Neon (use `--baseline` once if the DB already has the schema).
3. Sign in at the deployed web URL.
4. Open **Platform Admin** → create a customer organization → add users by email with role `admin` or `member`.
5. Those users sign in with Microsoft; they only see projects they are assigned to on the dashboard.

Org admins (not platform operators) can create projects and manage **project** members. Only you can create orgs and assign users to orgs.

### CLI fallback (bootstrap)

```bash
cd packages/backend
pnpm grant:org-access -- --email user@example.com --project-id <uuid> --role admin
pnpm grant:project-access -- --email user@example.com --role admin
```

---

## Adding demo users (legacy CLI)

Projects are scoped by **organization**. Users in the same org see projects they are assigned to (`project_members`).

### Preferred: Platform Admin UI

Use `/admin` after setting `PLATFORM_OPERATOR_EMAILS`.

### Personal Microsoft accounts (e.g. `@gmail.com` via Microsoft)

Often share the MSA consumer tenant (`9188040d-6c67-4c5b-b112-36a304b66dad`). After `pnpm link:mlj017-org`, no grant may be needed.

### Work / other tenants

After the user signs in once (or if you know their email), run from a machine with `DATABASE_URL` set:

```bash
cd packages/backend
pnpm grant:org-access -- --email georgegao1997@gmail.com
```

Options:

```bash
# Default: grant access to MLJ-017 project org
pnpm grant:org-access -- --email user@example.com

# Specific project
pnpm grant:org-access -- --email user@example.com --project-id 731cfd5d-e647-4551-89e7-0a3cc4915115

# Specific org + role
pnpm grant:org-access -- --email user@example.com --org-id <uuid> --role member
```

---

## Custom domain (optional)

### Render

1. Web service → **Settings** → **Custom Domains** → add `demo.yourdomain.com`.
2. API service → add `api.yourdomain.com`.
3. Update Azure redirect URI: `https://demo.yourdomain.com/auth/callback`.
4. Update env vars:
   - `OAUTH_REDIRECT_URI`
   - `WEB_ORIGIN`
   - `API_BASE_URL`
   - `NEXT_PUBLIC_API_URL`
   - Rebuild web service (NEXT_PUBLIC_* are baked at build time).

---

## Architecture

```
Browser → https://web-host (Next.js)
              ↓ server-side proxy (BACKEND_API_URL)
          https://api-host (Express)
              ↓
          Neon Postgres (shared index)
```

OAuth flow:

1. User clicks Sign in → `/api/auth/login` → Microsoft
2. Microsoft redirects to `https://web-host/auth/callback`
3. Web exchanges code with API → sets `app_session` cookie
4. Subsequent requests use Next.js `/api/*` routes (cookie auth)

---

## Product tour (first-time onboarding)

New users see a **5-step product tour** after sign-in (dashboard) or on first workspace visit. It covers:

1. What ContractorAI does (construction document intelligence)
2. Connecting a OneDrive project folder (e.g. MLJ-017)
3. Chatting with indexed documents
4. PDF viewer, markups, and citation jumps
5. Inviting teammates via shared Microsoft sign-in and Neon DB

- **Skip** or **Get started** sets `localStorage.onboarding_completed = true` so the tour does not auto-show again.
- **Take tour** on the dashboard header or **Tour** in the workspace top bar reopens it anytime.
- To reset for testing: `localStorage.removeItem('onboarding_completed')` in the browser console.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Redirect URI mismatch | Azure URI must exactly match `OAUTH_REDIRECT_URI` and deployed web URL + `/auth/callback` |
| Backend unreachable on login | Check `BACKEND_API_URL` on web service; API health at `/health/api` |
| Empty projects after login | User needs org + project membership via Platform Admin or `grant:org-access` |
| Access not granted on sign-in | Add user in Platform Admin before first login when `PLATFORM_OPERATOR_EMAILS` is set |
| CORS errors | Set `WEB_ORIGIN` to the web URL on the API service |
| 503 on `/health` | Check `DATABASE_URL`; Neon IP allowlist if enabled |

---

## Local development (unchanged)

```bash
pnpm install
cp .env.example .env   # local Postgres or Neon URL
pnpm dev
```

Open http://localhost:3000.
