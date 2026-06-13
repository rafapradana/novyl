-- Additional composite indexes for common query patterns

-- Query: get recent chapter summaries for context gathering (last 20 completed)
-- This is covered by idx_chapters_novel_id_status partial index
-- but we add a composite index for the full query with sequence ordering
CREATE INDEX idx_chapters_novel_status_sequence ON chapters (novel_id, status, sequence_number DESC)
  WHERE status = 'COMPLETED';

-- Query: find stale flags for a novel (join through chapters)
CREATE INDEX idx_stale_flags_novel ON stale_chapter_flags (chapter_id, dismissed_at, reason);

-- Query: find generation jobs by type for a user
CREATE INDEX idx_generation_jobs_user_type ON generation_jobs (user_id, generation_type, created_at DESC);
