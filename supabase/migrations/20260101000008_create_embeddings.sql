-- Chapter summary embeddings: pgvector RAG for chapter summaries
CREATE TABLE chapter_summary_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id  UUID NOT NULL UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  novel_id    UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  embedding   vector(1536),
  model       TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW index for cosine similarity search
CREATE INDEX idx_chapter_embeddings_hnsw ON chapter_summary_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for lookup per novel (exclude recent chapters from retrieval)
CREATE INDEX idx_chapter_embeddings_novel_id ON chapter_summary_embeddings (novel_id);

-- Composite index for filtered retrieval (exclude recent 20)
CREATE INDEX idx_chapter_embeddings_novel_chapter ON chapter_summary_embeddings (novel_id, chapter_id);

-- Enable RLS
ALTER TABLE chapter_summary_embeddings ENABLE ROW LEVEL SECURITY;

-- Users can read embeddings for their novels
CREATE POLICY "embeddings_select_own" ON chapter_summary_embeddings
  FOR SELECT TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

-- Users can insert embeddings for their novels
CREATE POLICY "embeddings_insert_own" ON chapter_summary_embeddings
  FOR INSERT TO authenticated
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

-- Users can update embeddings for their novels
CREATE POLICY "embeddings_update_own" ON chapter_summary_embeddings
  FOR UPDATE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()))
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

-- Users can delete embeddings for their novels
CREATE POLICY "embeddings_delete_own" ON chapter_summary_embeddings
  FOR DELETE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

-- Auto-update updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON chapter_summary_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
