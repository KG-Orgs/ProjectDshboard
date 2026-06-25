-- ============================================================
-- Migration 0012: Reduce embedding dimensions to 1024 (F2)
-- Safe DROP/recreate because the corpus is empty at bootstrap.
-- OpenAI text-embedding-3-small supports Matryoshka truncation, so
-- 1024 dims retain ~full recall at ~2/3 the storage and faster ANN.
-- If a non-empty 1536 corpus ever exists, use the add-column +
-- backfill + drop variant instead (see plan "Deferred").
-- ============================================================

DROP INDEX IF EXISTS idx_file_chunks_embedding_hnsw;

ALTER TABLE file_chunks
  DROP COLUMN IF EXISTS embedding_vector;

ALTER TABLE file_chunks
  ADD COLUMN embedding_vector vector(1024);

CREATE INDEX IF NOT EXISTS idx_file_chunks_embedding_hnsw
  ON file_chunks
  USING hnsw (embedding_vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
