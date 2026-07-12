-- Speed up intent-based retrieval pre-filters (schedule_risk, cost_risk, etc.)
-- that JOIN file_chunks to file_records and constrain doc_category by project.

CREATE INDEX IF NOT EXISTS idx_file_records_project_doc_category
  ON file_records (project_id, doc_category);
