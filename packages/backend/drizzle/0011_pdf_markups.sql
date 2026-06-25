-- ============================================================
-- Migration: pdf markups
-- Stores construction markups/measurements independently from PDF files.
-- ============================================================

CREATE TABLE IF NOT EXISTS pdf_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES file_records(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  coordinates JSONB NOT NULL DEFAULT '{}'::jsonb,
  measurement JSONB,
  category TEXT NOT NULL DEFAULT 'General Comment',
  status TEXT NOT NULL DEFAULT 'Open',
  comment TEXT,
  assigned_to TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pdf_markups_project ON pdf_markups(project_id);
CREATE INDEX IF NOT EXISTS idx_pdf_markups_file ON pdf_markups(file_id);
CREATE INDEX IF NOT EXISTS idx_pdf_markups_page ON pdf_markups(page_number);
CREATE INDEX IF NOT EXISTS idx_pdf_markups_status ON pdf_markups(status);
CREATE INDEX IF NOT EXISTS idx_pdf_markups_category ON pdf_markups(category);
CREATE INDEX IF NOT EXISTS idx_pdf_markups_updated_at ON pdf_markups(updated_at DESC);
