-- ============================================================
-- Migration 0016: chunk_links table for inter-chunk relationships
-- (schema.ts types-only; apply via psql — never db:migrate)
-- ============================================================

CREATE TABLE IF NOT EXISTS chunk_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  file_id uuid NOT NULL REFERENCES file_records(id),
  source_chunk_id uuid NOT NULL REFERENCES file_chunks(id),
  target_chunk_id uuid NOT NULL REFERENCES file_chunks(id),
  relation text NOT NULL,
  weight integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chunk_links_project ON chunk_links (project_id);
CREATE INDEX IF NOT EXISTS idx_chunk_links_source ON chunk_links (source_chunk_id);
CREATE INDEX IF NOT EXISTS idx_chunk_links_target ON chunk_links (target_chunk_id);
