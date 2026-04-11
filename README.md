# ContractorAI — MVP

A construction document management and AI chat platform for contractors. Connect your OneDrive, index your documents, and search them with natural language through an AI chatbot.

**One codebase → iOS App + Android App + Web App**

## What's In The Box

- **Mobile** (iOS + Android): React Native via Expo
- **Web**: Next.js 14 with App Router
- **Shared Logic**: TypeScript packages for API client, hooks, types, and state
- **Backend**: Node.js + Express, PostgreSQL, Pinecone vectors, Redis queue
- **Indexing**: OneDrive → document extraction → LLM classification → embeddings → RAG chat

## Project Structure

```
contractor-ai/
├── apps/
│   ├── mobile/              # Expo app (iOS + Android)
│   │   ├── app/             # Expo Router screens
│   │   ├── components/      # React Native components
│   │   ├── app.json         # Expo config
│   │   └── eas.json         # EAS Build config
│   │
│   └── web/                 # Next.js web app
│       ├── app/             # Next.js App Router
│       ├── components/      # Web components
│       └── next.config.js
│
├── packages/
│   ├── shared/              # Shared across all platforms
│   │   ├── src/
│   │   │   ├── api/         # API client
│   │   │   ├── hooks/       # React hooks
│   │   │   ├── types/       # TypeScript types
│   │   │   ├── state/       # Zustand stores
│   │   │   ├── utils/       # Validation, formatting, constants
│   │   │   └── features/    # Feature registry
│   │   └── package.json
│   │
│   ├── backend/             # Node.js express server
│   │   ├── src/
│   │   │   ├── auth/        # OAuth, tokens
│   │   │   ├── onedrive/    # OneDrive integration
│   │   │   ├── projects/    # Project CRUD
│   │   │   ├── chat/        # Chat & RAG
│   │   │   ├── indexing/    # Queue workers
│   │   │   ├── db/          # Database setup
│   │   │   └── server.ts    # Express entry
│   │   ├── migrations/      # Drizzle migrations
│   │   └── package.json
│   │
│   └── cli/                 # Command-line utilities (future)
│
├── turbo.json               # Turborepo config
├── tsconfig.json            # Shared TypeScript config
├── package.json             # Workspace root
└── README.md                # This file
```

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| **Mobile** | Expo SDK 52 + React Native | Single codebase → App Store + Play Store |
| **Web** | Next.js 14 + App Router | SSR, fast builds, Vercel deploy |
| **Shared** | TypeScript + Zustand | Type safety, shared logic |
| **Backend** | Node.js + Express | Same language, good integrations |
| **Auth** | Microsoft OAuth2 (MSAL) | Contractors already have M365 |
| **Database** | PostgreSQL | Relational + JSONB for metadata |
| **Vectors** | Pinecone | Simple vector search at scale |
| **Queue** | Redis + BullMQ | Reliable document indexing pipeline |
| **Chat** | Claude Sonnet | Strong document comprehension |
| **Classification** | Claude Haiku | Fast + cheap tagging |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm/yarn
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Clone the repo
git clone https://github.com/georgegao-ops/ProjectDshboard.git contractor-ai-mvp
cd contractor-ai-mvp

# Install dependencies (using workspace feature)
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm -F @contractor/backend run db:migrate

# Development: start all apps in parallel
pnpm dev

# Or individually:
pnpm -F @contractor/mobile dev
pnpm -F @contractor/web dev
pnpm -F @contractor/backend dev
```

## MVP Timeline

**14 weeks** to iOS + Android + Web with:

- OneDrive document sync & indexing
- AI chat with source citations
- Pluggable dashboard architecture
- Push notifications (mobile)
- App Store & Play Store ready

See the full plan: [Contractor MVP Plan](./CONTRACTOR_MVP_PLAN.md) (coming soon)

## Key Features (MVP)

✅ **OneDrive Integration**
- Connect & authorize OneDrive
- Delta sync for new/changed files
- Smart folder browser (mobile + web)

✅ **Document Indexing**
- Auto-extract text from PDFs, DOCX, images
- LLM-powered classification (category, spec section, tags, summary)
- Chunking + embedding → Pinecone

✅ **AI Chat with RAG**
- Hybrid search (metadata filters + vector similarity)
- Source citations with file links
- Stream responses in real-time

✅ **Native Mobile**
- iOS app via TestFlight
- Android app via Play Store beta
- Voice input for dirty hands
- Native components, not a web wrapper

✅ **Dashboard**
- Pluggable feature system
- Easy to add new icons (photos, reports, timesheets)
- Works on all platforms

## Development Workflow

### Running Tasks with Turbo

```bash
# Build all packages
pnpm build

# Run type checking everywhere
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test

# Filter to specific workspace
pnpm -F @contractor/shared build
```

### Making Changes

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `pnpm test`
4. Create a PR to `main`
5. Merge after review

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/contractor_ai
REDIS_URL=redis://localhost:6379

# Microsoft OAuth (Azure AD)
MSAL_CLIENT_ID=your-client-id
MSAL_CLIENT_SECRET=your-secret
MSAL_TENANT_ID=your-tenant

# OneDrive
ONEDRIVE_API_ENDPOINT=https://graph.microsoft.com/v1.0

# AI / Embeddings
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
PINECONE_API_KEY=your-key
PINECONE_ENVIRONMENT=your-environment

# Exports
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon)

## License

MIT

## Status

🔨 **MVP In Development**

- Phase 1 (Weeks 1-2): Monorepo + Auth ← Current
- Phase 2-3 (Weeks 3-4): OneDrive sync
- Phase 4-7 (Weeks 5-7): Indexing pipeline
- Phase 8-9 (Weeks 8-9): Chat system
- Phase 10-12 (Weeks 10-12): Polish
- Phase 13-14 (Weeks 13-14): Testing + App Store

---

**For the full MVP plan, see the attached PDF or run:**

```bash
cat CONTRACTOR_MVP_PLAN.md
```
