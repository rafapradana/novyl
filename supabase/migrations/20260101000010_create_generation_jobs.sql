-- Generation jobs: track chapter generation status and queue
CREATE TABLE generation_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id        UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  generation_type   generation_type NOT NULL,
  status            job_status NOT NULL DEFAULT 'PENDING',
  queue_position    INT,
  error_message     TEXT,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Query: find active jobs per user (idempotency guard: max 1 QUEUED + 1 WRITING)
CREATE INDEX idx_generation_jobs_user_status ON generation_jobs (user_id, status)
  WHERE status IN ('PENDING', 'RUNNING');

-- Query: find job by chapter (check if chapter already has active job)
CREATE INDEX idx_generation_jobs_chapter_active ON generation_jobs (chapter_id, status)
  WHERE status IN ('PENDING', 'RUNNING');

-- Query: queue drain (find next job to process)
CREATE INDEX idx_generation_jobs_queue ON generation_jobs (queue_position, created_at)
  WHERE status = 'PENDING' AND queue_position IS NOT NULL;

-- Query: job history per chapter
CREATE INDEX idx_generation_jobs_chapter_created ON generation_jobs (chapter_id, created_at DESC);

-- Enable RLS
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own jobs
CREATE POLICY "gen_jobs_select_own" ON generation_jobs
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users can insert their own jobs
CREATE POLICY "gen_jobs_insert_own" ON generation_jobs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own jobs
CREATE POLICY "gen_jobs_update_own" ON generation_jobs
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own jobs
CREATE POLICY "gen_jobs_delete_own" ON generation_jobs
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
