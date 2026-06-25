-- ============================================================
-- Migration 0010: Per-chunk extraction confidence (F7)
-- Stores the 0..1 extraction confidence produced by the indexing
-- pipeline so retrieval can use it as a mild ranking tie-breaker.
-- ============================================================

ALTER TABLE file_chunks
  ADD COLUMN IF NOT EXISTS confidence real;
