-- ============================================================
-- Migration: conversation sidebar
-- Adds title, pinned, updated_at to chat_sessions.
-- Adds conversation_documents and ai_feedback tables for
-- long-term AI memory and retrieval improvement hooks.
-- ============================================================

-- Extend chat_sessions ----------------------------------------
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS title       TEXT,
  ADD COLUMN IF NOT EXISTS pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_pinned     ON chat_sessions (pinned)       WHERE pinned = TRUE;

-- conversation_documents --------------------------------------
-- Tracks which project files were cited / surfaced per session.
-- Used later to build per-session document memory graphs and to
-- improve retrieval ranking (higher-relevance docs get boosted
-- weight when the same session context is reused).
CREATE TABLE IF NOT EXISTS conversation_documents (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID    NOT NULL REFERENCES chat_sessions (id) ON DELETE CASCADE,
  file_id         UUID             REFERENCES file_records  (id) ON DELETE SET NULL,
  file_name       TEXT    NOT NULL,
  chunk_ids       TEXT[],
  -- 0-100; higher = more central to the conversation
  relevance_score INTEGER NOT NULL DEFAULT 50,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_docs_session ON conversation_documents (session_id);
CREATE INDEX IF NOT EXISTS idx_conv_docs_file    ON conversation_documents (file_id) WHERE file_id IS NOT NULL;

-- ai_feedback -------------------------------------------------
-- Stores per-message user ratings and corrections.
-- Future use: fine-tuning dataset, retrieval quality signal,
-- RLHF / DPO training pairs.
CREATE TABLE IF NOT EXISTS ai_feedback (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID    NOT NULL REFERENCES chat_messages (id) ON DELETE CASCADE,
  -- 1 (poor) – 5 (excellent)
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  correction  TEXT,
  -- e.g. ['wrong_citation','off_topic']
  tags        TEXT[],
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_message ON ai_feedback (message_id);
