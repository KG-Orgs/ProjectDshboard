-- Migration 0024: Persist project explorer snapshots between syncs
-- Folder trees change only when OneDrive sync rewrites file_records.

CREATE TABLE IF NOT EXISTS project_explorer_snapshots (
  project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  project_root_folder_name text NOT NULL DEFAULT '',
  sync_fingerprint text NOT NULL DEFAULT '',
  total_files integer NOT NULL DEFAULT 0,
  entries jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_explorer_snapshots_updated
  ON project_explorer_snapshots (updated_at);
