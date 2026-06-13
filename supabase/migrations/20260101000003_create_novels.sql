-- Novels table: one complete book
CREATE TABLE novels (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  genre                   TEXT NOT NULL,
  writing_language        TEXT NOT NULL,
  premise                 TEXT NOT NULL,
  synopsis                TEXT NOT NULL,
  blurb                   TEXT,
  writing_style_notes     TEXT,
  word_count_default      INT,
  plot_checkpoints_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at            TIMESTAMPTZ,
  archived_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT novels_title_length CHECK (char_length(title) >= 1),
  CONSTRAINT novels_premise_length CHECK (char_length(premise) >= 10),
  CONSTRAINT novels_synopsis_length CHECK (char_length(synopsis) >= 20),
  CONSTRAINT novels_word_count_default_positive CHECK (
    word_count_default IS NULL OR word_count_default > 0
  )
);

-- Index for library view (user's novels, sorted by updated_at)
CREATE INDEX idx_novels_user_id_updated_at ON novels (user_id, updated_at DESC);

-- Index for archive tab
CREATE INDEX idx_novels_user_id_archived ON novels (user_id, archived_at)
  WHERE archived_at IS NOT NULL;

-- Index for active novels
CREATE INDEX idx_novels_user_id_active ON novels (user_id)
  WHERE archived_at IS NULL;

-- Helper function: check if current user owns a novel
CREATE OR REPLACE FUNCTION public.user_owns_novel(p_novel_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.novels
    WHERE id = p_novel_id
      AND user_id = (SELECT auth.uid())
  );
$$;

-- Helper function: get user's novel IDs (for cross-table ownership check)
CREATE OR REPLACE FUNCTION public.user_novel_ids()
RETURNS SETOF UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id FROM public.novels
  WHERE user_id = (SELECT auth.uid())
$$;

-- Enable RLS
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;

-- Users can read their own novels
CREATE POLICY "novels_select_own" ON novels
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users can create novels
CREATE POLICY "novels_insert_own" ON novels
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can update their own novels
CREATE POLICY "novels_update_own" ON novels
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can delete their own novels
CREATE POLICY "novels_delete_own" ON novels
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON novels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
