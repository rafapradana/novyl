# Chapter summary retrieval instead of full history dump

When gathering context for Chapter N, the pipeline does not load every prior chapter summary from Chapter 1. It always includes the last 20 **Chapter summaries** (**Recent chapter summaries**) plus the top 10 older summaries retrieved by relevance to the current **Chapter outline** (**Retrieved chapter summaries**), embedded and searched via pgvector on Supabase.

The brief's Phase 1 described concatenating all `ai_summary` rows. That breaks context windows around chapter 100–150 and wastes tokens on irrelevant history by chapter 500. **Prior chapter text** (full text of Chapter N−1) plus Mem0, retrieved summary chunks, and synopsis cover continuity; summaries handle everything older than the recent window.

Each **Chapter summary** is embedded into pgvector on completion so deep-history retrieval stays fast as novels grow.
