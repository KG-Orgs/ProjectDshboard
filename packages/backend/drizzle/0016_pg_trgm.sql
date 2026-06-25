-- ============================================================
-- Migration 0014: Trigram fallback for keyword search (F18)
-- pg_trgm + GIN trigram indexes make the substring ILIKE fallback
-- in keywordSearch index-eligible (no more sequential scans for
-- "%token%" lookups on chunk_text / file_name).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_file_chunks_chunk_text_trgm
  ON file_chunks USING gin (chunk_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_file_chunks_file_name_trgm
  ON file_chunks USING gin (file_name gin_trgm_ops);
