-- Migration: Add sync_jobs and indexing_jobs tables for indexing pipeline

CREATE TABLE IF NOT EXISTS "sync_jobs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL,
    "job_type" text NOT NULL,
    "status" text DEFAULT 'pending',
    "bulk_job_id" text,
    "files_processed" integer DEFAULT 0,
    "files_total" integer,
    "error_message" text,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now(),
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
);

CREATE INDEX idx_sync_jobs_project ON "sync_jobs"("project_id");
CREATE INDEX idx_sync_jobs_status ON "sync_jobs"("status");

CREATE TABLE IF NOT EXISTS "indexing_jobs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "file_id" uuid NOT NULL,
    "sync_job_id" uuid,
    "bulk_job_id" text,
    "status" text DEFAULT 'pending',
    "processed_at" timestamp with time zone,
    "error_message" text,
    "retries_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    FOREIGN KEY ("file_id") REFERENCES "file_records"("id") ON DELETE CASCADE,
    FOREIGN KEY ("sync_job_id") REFERENCES "sync_jobs"("id") ON DELETE SET NULL
);

CREATE INDEX idx_indexing_jobs_file ON "indexing_jobs"("file_id");
CREATE INDEX idx_indexing_jobs_status ON "indexing_jobs"("status");
CREATE INDEX idx_indexing_jobs_sync ON "indexing_jobs"("sync_job_id");
