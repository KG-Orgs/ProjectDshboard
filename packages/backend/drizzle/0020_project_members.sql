-- ============================================================
-- Migration 0020: Per-project membership (admin assigns teammates)
--
-- Applied manually via psql. schema.ts kept in sync as types only.
-- ============================================================

CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_members_project_user
  ON project_members (project_id, user_id);

CREATE INDEX IF NOT EXISTS idx_project_members_user
  ON project_members (user_id);

CREATE INDEX IF NOT EXISTS idx_project_members_project
  ON project_members (project_id);

-- Backfill: every user in a project's org gets access; org admins become project admins.
INSERT INTO project_members (project_id, user_id, role, created_at)
SELECT
  p.id,
  u.id,
  CASE WHEN u.role IN ('super', 'admin') THEN 'admin' ELSE 'member' END,
  COALESCE(p.created_at, now())
FROM projects p
JOIN users u ON u.org_id = p.org_id
ON CONFLICT (project_id, user_id) DO NOTHING;
