-- ============================================================
-- Migration 0011: Drop legacy JSONB embedding column (F1b)
-- The native pgvector column `embedding_vector` is the single source
-- of truth. The old JSONB `embedding` doubled per-row storage and is
-- no longer read or written.
-- ============================================================

ALTER TABLE file_chunks
  DROP COLUMN IF EXISTS embedding;
