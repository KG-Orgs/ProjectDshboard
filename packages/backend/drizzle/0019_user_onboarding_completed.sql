-- ============================================================
-- Migration 0019: per-user product tour completion timestamp
-- (schema.ts types-only; apply via psql — never db:migrate)
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
