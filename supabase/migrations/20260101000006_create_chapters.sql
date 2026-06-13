-- Chapters table: core entity for manuscript chapters
CREATE TABLE chapters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id          UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  sequence_number   INT NOT NULL,
  title             TEXT,
  outline           TEXT,
  chapter_text      TEXT DEFAULT '',
  status            chapter_status NOT NULL DEFAULT 'DRAFT',
  chapter_summary   TEXT,
  word_count_target INT,
  outline_hash      TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT chapters_sequence_unique UNIQUE (novel_id, sequence_number),
  CONSTRAINT chapters_sequence_positive CHECK (sequence_number >= 1),
  CONSTRAINT chapters_outline_for_outlined CHECK (
    (status = 'DRAFT') OR (outline IS NOT NULL AND char_length(outline) >= 1)
  ),
  CONSTRAINT chapters_text_not_null CHECK (chapter_text IS NOT NULL)
);

-- Core query: get chapters for workspace sidebar
CREATE INDEX idx_chapters_novel_id_sequence ON chapters (novel_id, sequence_number);

-- Query: find COMPLETED chapters for recent-20 + context gathering
CREATE INDEX idx_chapters_novel_id_status ON chapters (novel_id, status)
  WHERE status = 'COMPLETED';

-- Query: find chapters needing summary embedding
CREATE INDEX idx_chapters_needing_embedding ON chapters (novel_id, updated_at)
  WHERE chapter_summary IS NOT NULL AND status = 'COMPLETED';

-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Users can read chapters for their novels
CREATE POLICY "chapters_select_own" ON chapters
  FOR SELECT TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

-- Users can insert chapters for their novels
CREATE POLICY "chapters_insert_own" ON chapters
  FOR INSERT TO authenticated
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

-- Users can update chapters for their novels
CREATE POLICY "chapters_update_own" ON chapters
  FOR UPDATE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()))
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

-- Users can delete chapters for their novels
CREATE POLICY "chapters_delete_own" ON chapters
  FOR DELETE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Compute outline hash when chapter first becomes COMPLETED
CREATE OR REPLACE FUNCTION public.compute_outline_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') THEN
    NEW.outline_hash = md5(NEW.outline);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER compute_outline_hash BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION public.compute_outline_hash();
