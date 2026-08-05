-- Migration 0022: Add onedrive_drive_id to projects
-- Stores the Graph driveId (owner's personal OneDrive drive ID) so that
-- all project members can access files via /drives/{driveId}/items/{id}/...
-- instead of /me/drive/items/{id}/... (which only works for the owner).

ALTER TABLE projects ADD COLUMN IF NOT EXISTS onedrive_drive_id text;
