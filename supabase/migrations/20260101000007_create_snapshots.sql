-- Chapter context snapshots: frozen character/world state at time of writing
CREATE TABLE chapter_context_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id  UUID NOT NULL UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  snapshot    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- chapter_id is UNIQUE, so no additional index needed beyond PK

-- Enable RLS
ALTER TABLE chapter_context_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can read snapshots for their chapters
CREATE POLICY "snapshots_select_own" ON chapter_context_snapshots
  FOR SELECT TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

-- Users can insert snapshots for their chapters
CREATE POLICY "snapshots_insert_own" ON chapter_context_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

-- Users can update snapshots for their chapters
CREATE POLICY "snapshots_update_own" ON chapter_context_snapshots
  FOR UPDATE TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ))
  WITH CHECK (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

-- Users can delete snapshots for their chapters
CREATE POLICY "snapshots_delete_own" ON chapter_context_snapshots
  FOR DELETE TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON chapter_context_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
