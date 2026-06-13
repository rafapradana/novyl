-- pgvector for RAG chapter summary embeddings
CREATE EXTENSION IF NOT EXISTS vector
WITH SCHEMA extensions;

-- pg_trgm for optional full-text search (novel title search)
CREATE EXTENSION IF NOT EXISTS pg_trgm
WITH SCHEMA extensions;
