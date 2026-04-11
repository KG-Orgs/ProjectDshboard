# Chat/RAG System - Data Layer Integration

## Database Schema Usage

The Chat/RAG system (features 6.1-6.6) uses the following database tables:

### Tables Used

#### 1. **file_records** - Document Metadata
Stores metadata about uploaded construction documents.

**RAG Usage:**
- **6.3 Hybrid Search**: Filters by `docCategory`, `specSection`, `keyTopics`, `tags`
- **6.4 Context Assembly**: Retrieves file details for citations
- Extract `fileName`, `filePath`, `specSection`, `docCategory` for context

**Key Fields:**
```sql
SELECT 
  id,                    -- File reference
  fileName,              -- For citations
  specSection,           -- CSI MasterFormat (23 05 00)
  docCategory,           -- 'spec', 'drawing', 'submittal', 'rfi'
  keyTopics,             -- Array of extracted topics
  tags,                  -- Auto + manual tags
  summary,               -- Quick reference
  onedriveItemId         -- Link to OneDrive
FROM file_records
WHERE project_id = $1 AND index_status = 'indexed';
```

#### 2. **vector_chunks** - Embedding Metadata
Stores references to vectorized text chunks in Pinecone.

**RAG Usage:**
- **6.2 Vector Store**: Storage for chunk metadata
- **6.3 Hybrid Search**: Links vector IDs to file metadata
- **6.4 Context Assembly**: Retrieves chunk text for inclusion
- Tracks which chunks have been vectorized

**Key Fields:**
```sql
SELECT
  id,                    -- Chunk UUID
  file_id,               -- Reference to file_records
  chunk_index,           -- Sequential chunk number
  chunk_text,            -- First 500 chars of text
  vector_id,             -- Pinecone vector ID (e.g., "chunk-123")
  token_count            -- Approximate token count
FROM vector_chunks
WHERE file_id = $1
ORDER BY chunk_index ASC;
```

#### 3. **chat_sessions** - Conversation Containers
Stores chat session metadata.

**RAG Usage:**
- **6.6 WebSocket**: Session creation and retrieval
- Track conversations per project/user

**Key Fields:**
```sql
SELECT
  id,                    -- Session UUID
  project_id,            -- Which project
  user_id,               -- Which user
  created_at             -- Session start time
FROM chat_sessions;
```

#### 4. **chat_messages** - Conversation History
Individual messages in a conversation.

**RAG Usage:**
- **6.5 LLM**: Retrieve conversation history for context
- **6.6 WebSocket**: Store user queries and AI responses
- Track sources/citations with each message

**Key Fields:**
```sql
SELECT
  id,                    -- Message UUID
  session_id,            -- Which session
  role,                  -- 'user' or 'assistant'
  content,               -- Message text
  sources,               -- JSONB: [{fileId, fileName, chunkIndex, relevance, link}]
  created_at
FROM chat_messages
WHERE session_id = $1
ORDER BY created_at DESC;
```

## Data Flow

### Query Ingestion → Vectorization → Chat

```
1. FILE_RECORDS TABLE
   ↓
   User uploads document via OneDrive
   Indexing pipeline creates chunks
   AI extracts metadata: specSection, keyTopics, tags
   Stores in file_records table
   
2. VECTOR_CHUNKS TABLE
   ↓
   Document split into chunks
   Each chunk processed if > 100 tokens
   Stored in vector_chunks with metadata
   
3. PINECONE (External)
   ↓
   Chunks embedded using OpenAI
   Vectors stored with metadata:
   {
     projectId,
     fileId,
     fileName,
     specSection,
     category,
     chunkIndex,
     chunkText (preview)
   }
   
4. HYBRID SEARCH (6.3)
   ↓
   Step A: Query file_records with metadata filters
   Step B: Query Pinecone vectors
   Step C: Merge and rank results
   
5. CONTEXT ASSEMBLY (6.4)
   ↓
   Fetch full chunk_text from vector_chunks
   Select top N chunks within token budget
   Build context for LLM
   
6. CHAT_MESSAGES TABLE
   ↓
   User query → saved with role='user'
   AI response → saved with role='assistant'
   Sources array → links back to file_records + vector_chunks
```

## Query Examples

### Find Specs by Section
```sql
SELECT f.id, f.file_name, f.spec_section, count(vc.id) as chunk_count
FROM file_records f
LEFT JOIN vector_chunks vc ON f.id = vc.file_id
WHERE f.project_id = 'proj-123' 
  AND f.spec_section = '23 05 00'
  AND f.index_status = 'indexed'
GROUP BY f.id
ORDER BY f.created_at DESC;
```

### Chat History for Session
```sql
SELECT 
  cm.id,
  cm.role,
  cm.content,
  cm.sources,
  cm.created_at,
  (SELECT f.file_name FROM file_records f 
   WHERE f.id::text = (cm.sources->0->>'fileId')) as source_file
FROM chat_messages cm
WHERE cm.session_id = 'session-123'
ORDER BY cm.created_at ASC;
```

### Find Chunks for Specific File
```sql
SELECT 
  vc.chunk_index,
  vc.chunk_text,
  vc.token_count,
  vc.vector_id,
  f.spec_section
FROM vector_chunks vc
JOIN file_records f ON vc.file_id = f.id
WHERE vc.file_id = 'file-456'
ORDER BY vc.chunk_index ASC;
```

### Chat Statistics
```sql
SELECT
  cs.id,
  cs.project_id,
  COUNT(CASE WHEN cm.role = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN cm.role = 'assistant' THEN 1 END) as ai_responses,
  COUNT(DISTINCT jsonb_array_elements(cm.sources)->>'fileId') as unique_sources,
  MAX(cm.created_at) as last_message
FROM chat_sessions cs
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
GROUP BY cs.id, cs.project_id
ORDER BY cs.created_at DESC;
```

## Indexing Strategy

### Existing Indexes (from schema)
- `idx_file_records_project` - Fast project filtering
- `idx_file_records_category` - Fast category filtering
- `idx_file_records_tags` - Fast tag searching (GIN index)
- `idx_file_records_spec` - Fast spec section searching

### Recommended Additional Indexes
```sql
-- For chat history queries
CREATE INDEX idx_chat_messages_session 
  ON chat_messages(session_id, created_at DESC);

-- For searching by sources
CREATE INDEX idx_chat_messages_sources 
  ON chat_messages USING GIN(sources);

-- For vector chunk lookups
CREATE INDEX idx_vector_chunks_file 
  ON vector_chunks(file_id, chunk_index);

-- For finding indexed files quickly
CREATE INDEX idx_file_records_indexed 
  ON file_records(project_id, index_status) 
  WHERE index_status = 'indexed';
```

## Data Volume Expectations

### Small Project (1 year old)
- file_records: ~500 documents
- vector_chunks: ~50,000 chunks
- Pinecone vectors: ~50,000
- chat_messages: ~5,000
- Estimated storage: ~15-20MB database, Pinecone SaaS

### Large Project (multi-year)
- file_records: ~5,000 documents
- vector_chunks: ~500,000 chunks
- Pinecone vectors: ~500,000
- chat_messages: ~50,000
- Estimated storage: ~150-200MB database, Pinecone SaaS

## Performance Optimization

### Query Optimization
```typescript
// BAD: Fetches all records
const files = await db.query.fileRecords.findMany();

// GOOD: Filters before fetch
const files = await db.query.fileRecords.findMany({
  where: and(
    eq(fileRecords.projectId, projectId),
    eq(fileRecords.indexStatus, 'indexed'),
    eq(fileRecords.specSection, '23 05 00')
  ),
  limit: 100,
  orderBy: desc(fileRecords.createdAt)
});
```

### Caching Strategy
```typescript
// Cache metadata for 1 hour
const cacheKey = `files:${projectId}:${specSection}`;
let files = await redis.get(cacheKey);
if (!files) {
  files = await db.query.fileRecords.findMany({...});
  await redis.setex(cacheKey, 3600, JSON.stringify(files));
}
```

### Archive Old Data
```sql
-- Archive chat messages older than 6 months
INSERT INTO chat_messages_archive
SELECT * FROM chat_messages 
WHERE created_at < NOW() - INTERVAL '6 months';

DELETE FROM chat_messages 
WHERE created_at < NOW() - INTERVAL '6 months';
```

## Maintenance Tasks

### Daily
```sql
-- Monitor chat growth
SELECT DATE(created_at), COUNT(*) FROM chat_messages 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) DESC 
LIMIT 7;
```

### Weekly
```sql
-- Verify vector chunks match files
SELECT COUNT(*) as orphaned_chunks
FROM vector_chunks vc
WHERE NOT EXISTS (
  SELECT 1 FROM file_records f WHERE f.id = vc.file_id
);
```

### Monthly
```sql
-- Update statistics for query planner
ANALYZE file_records;
ANALYZE vector_chunks;
ANALYZE chat_messages;

-- Vacuum to reclaim space
VACUUM chat_messages;
```

## Integration Points

### In Projects/Files Schema
- `fileRecords.specSection` → Used in 6.1, 6.3, 6.4
- `fileRecords.docCategory` → Used in 6.3 filtering
- `fileRecords.keyTopics` → Used in 6.3 ranking
- `fileRecords.tags` → Used in 6.3 filtering

### In Vector Store
- `vectorChunks.chunkText` → Context for 6.4, 6.5
- `vectorChunks.vectorId` → Reference to Pinecone
- `vectorChunks.fileId` → Citation tracking

### In Chat History
- `chatMessages.sources` → Tracks which chunks answered which questions
- `chatMessages.content` → Conversation history for 6.5 context
- `chatSessions.projectId` → Scope conversations to project

## No Migration Needed

✅ The database schema already supports the Chat/RAG system:
- `vector_chunks` table ready for Pinecone metadata
- `chat_messages.sources` JSONB field for citation tracking
- `file_records.specSection` for spec-based filtering
- All necessary indexes in place

Just ensure:
1. Documents are indexed (via existing indexing pipeline)
2. Chunks are created and stored in vector_chunks
3. Pinecone index is populated with embeddings
