# Backend Services

Express server providing REST API for the Contractor Dashboard.

## Architecture

```
Backend (Node.js + Express)
├── Auth Service - User authentication and authorization
├── Project Service - Project management and tracking
├── Task Service - Task creation and management
├── Chat Service - Real-time chat and notifications
├── OneDrive Sync - Document synchronization
└── Push Notifications - Browser/mobile push alerts
```

## Services

### Auth Service (`src/services/authService.ts`)
- JWT token generation and verification
- Password hashing and validation
- Session management

### API Routes

#### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /signup` - User registration
- `POST /logout` - User logout
- `POST /refresh` - Token refresh

#### Projects (`/api/projects`)
- `GET /` - List all projects
- `GET /:id` - Get project details
- `POST /` - Create new project
- `PATCH /:id` - Update project
- `DELETE /:id` - Delete project

#### Tasks (`/api/tasks`)
- `GET /` - List all tasks
- `GET /:id` - Get task details
- `POST /` - Create new task
- `PATCH /:id` - Update task
- `DELETE /:id` - Delete task

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   Copy `.env.backend` to `.env` and configure:
   ```bash
   cp .env.backend .env
   ```

3. **Run development server**
   ```bash
   pnpm --filter @contractor/backend dev
   ```

4. **Build for production**
   ```bash
   pnpm --filter @contractor/backend build
   pnpm --filter @contractor/backend start
   ```

5. **Run end-to-end smoke test**
   Start the backend in one terminal, then run:
   ```bash
   pnpm --filter @contractor/backend test:e2e
   ```

6. **Run backend integration tests**
   ```bash
   pnpm --filter @contractor/backend test
   ```

7. **Run backend linting**
   ```bash
   pnpm --filter @contractor/backend lint
   ```

   For a step-by-step request flow using `curl.exe` on Windows, run:
   ```powershell
   ./packages/backend/scripts/e2e-curl.ps1
   ```

The backend test suite now includes service unit tests, feature integration tests, and API contract tests for the shared success/error response envelope.

## Database Migrations

Migrations are managed with Drizzle ORM:

```bash
# Run migrations
pnpm --filter @contractor/backend db:migrate

# Open DB studio
pnpm --filter @contractor/backend db:studio
```

## Background Jobs

The server uses Bull (bullmq) for background job processing:

- **Chat Queue** - Process chat messages and notifications
- **Sync Queue** - Handle OneDrive document synchronization
- **Email Queue** - Send transactional emails

Access job status through Redis client.

## API Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Environment Variables

See `.env.backend` for all available configuration options.

Critical ones:
- `PORT` - Server port
- `JWT_SECRET` - Secret for JWT tokens
- `REDIS_HOST` / `REDIS_PORT` - Redis cache
- `DB_*` - PostgreSQL connection details

The API now persists auth, project, and task data to a local file-backed store under `packages/backend/.data/` by default. Set `DATA_DIR` to point at a different directory for tests or isolated local runs.

If Redis is unavailable, the server logs a warning and continues so local API smoke tests can run without full infrastructure.
