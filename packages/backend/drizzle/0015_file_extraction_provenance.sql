-- ============================================================
-- Migration 0013: File-level extraction provenance (F3)
-- Extraction provenance (parser name/version + optional V2 shadow)
-- is identical for every chunk of a file, so it is stored once on
-- file_records instead of being duplicated into each chunk's
-- metadata jsonb.
-- ============================================================

ALTER TABLE file_records
  ADD COLUMN IF NOT EXISTS extraction_provenance jsonb;
