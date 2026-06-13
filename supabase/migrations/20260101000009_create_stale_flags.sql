-- Stale chapter flags: warn about inconsistency from upstream changes
CREATE TABLE stale_chapter_flags (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id              UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  caused_by_chapter_id    UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  reason                  stale_reason NOT NULL,
  dismissed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Cannot flag a chapter as stale by itself
  CONSTRAINT stale_no_self_flag CHECK (chapter_id != caused_by_chapter_id),
  -- Unique constraint: one flag per chapter+cause combination
  CONSTRAINT stale_chapter_cause_unique UNIQUE (chapter_id, caused_by_chapter_id, reason)
);

-- Query: count undismissed stale chapters per novel (header badge)
CREATE INDEX idx_stale_chapter_flags_chapter_undismissed ON stale_chapter_flags (chapter_id)
  WHERE dismissed_at IS NULL;

-- Query: find all chapters flagged by a specific chapter (downstream propagation)
CREATE INDEX idx_stale_chapter_flags_caused_by ON stale_chapter_flags (caused_by_chapter_id);

-- Query: find stale chapters for a novel (stale list modal)
CREATE INDEX idx_stale_chapter_flags_chapter_id ON stale_chapter_flags (chapter_id, dismissed_at);

-- Enable RLS
ALTER TABLE stale_chapter_flags ENABLE ROW LEVEL SECURITY;

-- Users can read stale flags for their chapters
CREATE POLICY "stale_flags_select_own" ON stale_chapter_flags
  FOR SELECT TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

-- Users can insert stale flags for their chapters
CREATE POLICY "stale_flags_insert_own" ON stale_chapter_flags
  FOR INSERT TO authenticated
  WITH CHECK (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

-- Users can update stale flags for their chapters
CREATE POLICY "stale_flags_update_own" ON stale_chapter_flags
  FOR UPDATE TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ))
  WITH CHECK (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

-- Users can delete stale flags for their chapters
CREATE POLICY "stale_flags_delete_own" ON stale_chapter_flags
  FOR DELETE TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON stale_chapter_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
