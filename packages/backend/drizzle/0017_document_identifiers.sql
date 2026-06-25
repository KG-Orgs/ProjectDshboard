-- ============================================================
-- Migration 0015: First-class construction identifiers (MVP Slice 1, 1b/1e)
--
-- 1b: a flexible `document_identifiers` table makes exact identifiers
--     (QWP/SWP/CWP/RFI/DRFI/CSI/submittal-control/PRDC/CO/NCR/transmittal/DU)
--     a deterministic, indexed lookup signal. One file may carry several
--     identifiers (whole-filename scan), so this is one-row-per-identifier.
--     `value_normalized` stores the deterministic key (see normalizeIdentifier),
--     `raw` keeps the verbatim source token for display / debugging.
--
-- 1e: a `deep_link_url` on file_records captures the openable source link at
--     ingestion (Microsoft Graph webUrl when available, else local file:// path)
--     so it can flow into search results and citations.
--
-- Applied manually via psql (continuing the 0000–0014 sequence). schema.ts is
-- kept in sync as TYPES ONLY — never run db:migrate / drizzle-kit push.
-- ============================================================

CREATE TABLE IF NOT EXISTS document_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES file_records(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type text NOT NULL,
  value_normalized text NOT NULL,
  raw text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Deterministic exact-id lookup: (type, value_normalized) within a project.
CREATE INDEX IF NOT EXISTS idx_document_identifiers_type_value
  ON document_identifiers (type, value_normalized);

-- Reverse lookup: all identifiers attached to a file.
CREATE INDEX IF NOT EXISTS idx_document_identifiers_file
  ON document_identifiers (file_id);

-- Project-scoped scans.
CREATE INDEX IF NOT EXISTS idx_document_identifiers_project
  ON document_identifiers (project_id);

-- Idempotent re-ingestion: one row per (file, type, normalized value).
CREATE UNIQUE INDEX IF NOT EXISTS uq_document_identifiers_file_type_value
  ON document_identifiers (file_id, type, value_normalized);

-- Deep-link / source URL captured at ingestion (D7).
ALTER TABLE file_records
  ADD COLUMN IF NOT EXISTS deep_link_url text;
