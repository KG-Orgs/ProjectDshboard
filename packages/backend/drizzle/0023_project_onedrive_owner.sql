-- Migration 0023: Project-scoped OneDrive owner for file access
-- When set, file content is fetched with this user's Graph token so project
-- members can view PDFs without connecting their own OneDrive.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS onedrive_connected_by_user_id uuid;

DO $$ BEGIN
  ALTER TABLE projects
    ADD CONSTRAINT projects_onedrive_connected_by_user_id_users_id_fk
    FOREIGN KEY (onedrive_connected_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_onedrive_owner
  ON projects (onedrive_connected_by_user_id);

-- Backfill: owner = user whose connected drive matches the project's driveId.
UPDATE projects p
SET onedrive_connected_by_user_id = oc.user_id
FROM onedrive_connections oc
WHERE p.onedrive_connected_by_user_id IS NULL
  AND p.onedrive_drive_id IS NOT NULL
  AND p.onedrive_drive_id = oc.drive_id;
