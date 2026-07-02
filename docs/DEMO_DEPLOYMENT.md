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

`API_BASE_URL` and `WEB_ORIGIN` are wired from service hosts in `render.yaml`. After the first deploy, confirm:

- `API_BASE_URL` = `https://contractorai-api.onrender.com`
- `WEB_ORIGIN` = `https://contractorai-web.onrender.com`

### 3. Deploy

Click **Apply**. First build takes ~5–10 minutes (Docker images for web + API).

### 4. Verify health

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
| `BACKEND_API_URL` | Web | Internal or public API URL |
| `NEXT_PUBLIC_API_URL` | Web | Public API URL (build-time arg for Docker) |

### Demo users (George, etc.)

Demo users need **no env vars**. They only need:

1. The demo URL
2. A Microsoft account Kyle has granted org access (see below)

---

## Adding demo users

Projects are scoped by **organization**. Users in the same org see the same projects and indexed files.

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

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Redirect URI mismatch | Azure URI must exactly match `OAUTH_REDIRECT_URI` and deployed web URL + `/auth/callback` |
| Backend unreachable on login | Check `BACKEND_API_URL` on web service; API health at `/health/api` |
| Empty projects after login | Run `grant:org-access` for the user's email |
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
