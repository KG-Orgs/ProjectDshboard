# Data Layer

Infrastructure for managing data storage, caching, and vector embeddings.

## Architecture

```
Data Layer
├── PostgreSQL Database
│   ├── Users
│   ├── Projects
│   ├── Tasks
│   ├── Documents
│   ├── Chat Messages
│   └── Activity Logs
├── Redis Cache
│   ├── Session management
│   ├── Rate limiting
│   ├── Job queues
│   └── Real-time data
└── Pinecone Vector Store
    ├── Document embeddings
    ├── Semantic search
    └── AI-powered indexing
```

## Components

### PostgreSQL Database

Primary data store with Drizzle ORM.

**Schema:**
- **users** - User accounts and authentication
- **projects** - Construction projects
- **tasks** - Project tasks
- **documents** - OneDrive documents
- **chat_messages** - Project collaboration chat
- **activity_log** - Audit trail
- **invitations** - User invitations

Run migrations:
```bash
npm run db:migrate
```

### Redis Cache

In-memory cache for performance and real-time features.

```typescript
import { cache } from './src/cache/redis';

// Get/Set cache
await cache.set('key', value, 3600); // 1 hour TTL
const value = await cache.get('key');

// Delete
await cache.delete('key');
```

### Pinecone Vector Store

Semantic search and AI-powered document indexing.

```typescript
import { initializeVectorStore } from './src/vector-store/pinecone';

const vectorStore = initializeVectorStore();
await vectorStore.initialize();

// Search similar documents
const results = await vectorStore.search(queryEmbedding, 10);
```

## Configuration

Set these environment variables:

```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=contractor
DB_PASSWORD=password
DB_NAME=contractor_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Pinecone
PINECONE_API_KEY=your-api-key
PINECONE_ENVIRONMENT=your-env
PINECONE_INDEX=contractor-index
```

## Database Migrations

Create new migrations in `src/migrations/`:

```typescript
// migrations/002_add_new_table.ts
export async function up() {
  // Create table
}

export async function down() {
  // Drop table
}
```

Run migrations:
```bash
npm run db:migrate
```

Open DB studio:
```bash
npm run db:studio
```

## Data Models

### Users
```typescript
{
  id: UUID,
  name: string,
  email: string (unique),
  passwordHash: string,
  role: 'admin' | 'manager' | 'worker',
  oneDriveId: string,
  lastLogin: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Projects
```typescript
{
  id: UUID,
  name: string,
  description: string,
  status: 'planning' | 'active' | 'on-hold' | 'completed',
  progress: 0-100,
  startDate: timestamp,
  endDate: timestamp,
  budget: decimal,
  spent: decimal,
  managerId: UUID (FK users),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Tasks
```typescript
{
  id: UUID,
  projectId: UUID (FK projects),
  title: string,
  description: string,
  status: 'todo' | 'in-progress' | 'review' | 'completed',
  priority: 'low' | 'medium' | 'high',
  assigneeId: UUID (FK users),
  dueDate: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Indexes

All tables have optimized indexes for common queries:
- `projects.manager_id_idx` - Filter projects by manager
- `projects.status_idx` - Filter by status
- `tasks.project_id_idx` - List project tasks
- `tasks.assignee_id_idx` - User's assigned tasks
- `tasks.status_idx` - Filter tasks by status
- `chat_messages.project_id_idx` - Project messages
- `chat_messages.created_at_idx` - Message timeline
- `activity_log.project_id_idx` - Project audit trail

## Scalability

- PostgreSQL connection pooling with pg-pool
- Redis pub/sub for real-time features
- Pinecone for horizontal scaling of search
- Drizzle ORM for efficient queries
- Strategic indexes for common access patterns

## Backup & Recovery

Set up automated PostgreSQL backups:
```bash
pg_dump contractor_db > backup.sql
```

Restore from backup:
```bash
psql contractor_db < backup.sql
```
