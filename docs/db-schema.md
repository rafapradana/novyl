# Database Schema — Supabase (Novyl v1)

> **Status:** Draft — belum di-migrate. Schema ini menjabarkan semua tabel, relasi, indeks, RLS, dan utilitas yang dibutuhkan untuk v1.
>
> **Referensi:** [`CONTEXT.md`](../CONTEXT.md), [`docs/prd-v1.md`](./prd-v1.md), [`docs/brief.md`](./brief.md), [`docs/adr/0004-typescript-monolith-supabase.md`](./adr/0004-typescript-monolith-supabase.md)

---

## Daftar Isi

1. [Design Principles](#1-design-principles)
2. [Extensions](#2-extensions)
3. [Enum Types](#3-enum-types)
4. [Tables](#4-tables)
   - 4.1 [profiles](#41-profiles)
   - 4.2 [novels](#42-novels)
   - 4.3 [character_profiles](#43-character_profiles)
   - 4.4 [location_profiles](#44-location_profiles)
   - 4.5 [chapters](#45-chapters)
   - 4.6 [chapter_context_snapshots](#46-chapter_context_snapshots)
   - 4.7 [chapter_summary_embeddings](#47-chapter_summary_embeddings)
   - 4.8 [stale_chapter_flags](#48-stale_chapter_flags)
   - 4.9 [generation_jobs](#49-generation_jobs)
5. [Indexes](#5-indexes)
6. [Row Level Security (RLS)](#6-row-level-security-rls)
7. [Utility Functions & Triggers](#7-utility-functions--triggers)
8. [Migration Order](#8-migration-order)
9. [ER Diagram (text)](#9-er-diagram-text)
10. [Design Decisions](#10-design-decisions)

---

## 1. Design Principles

| Prinsip | Implementasi |
|---------|-------------|
| **Supabase Auth as source of truth** | Tabel `auth.users` untuk identitas; `profiles` untuk display name tambahan. Tabel `users` terpisah tidak diperlukan. |
| **UUID primary keys** | Semua tabel pakai `UUID PRIMARY KEY DEFAULT gen_random_uuid()` — konsisten dengan Supabase ecosystem. |
| **RLS on every table** | Setiap tabel di `public` schema harus punya RLS policies. Tanpa exception. |
| **Cascade deletes** | Hapus Novel → hapus chapters, snapshots, embeddings, stale flags, generation jobs secara cascade. |
| **JSONB untuk data fleksibel** | Chapter context snapshots pakai JSONB (state berubah seiring waktu). Profil pakai kolom terstruktur (query per field). |
| **pgvector dengan HNSW** | Index HNSW untuk cosine similarity — lebih baik dari IVFFlat untuk workload read-heavy dengan data yang sering insert. |
| **Timestamps everywhere** | `created_at` + `updated_at` pada semua tabel domain. |
| **Normalized, tidak denormalisasi** | Chapter summary di `chapters.chapter_summary`; embedding di tabel terpisah. Snapshot di tabel terpisah (bukan JSONB di chapters). |

---

## 2. Extensions

```sql
-- pgvector untuk RAG chapter summary embeddings
CREATE EXTENSION IF NOT EXISTS vector
WITH SCHEMA extensions;

-- pg_trgm untuk full-text search opsional (novel title search)
CREATE EXTENSION IF NOT EXISTS pg_trgm
WITH SCHEMA extensions;
```

> **Catatan:** Jalankan extension di migration pertama. Gunakan `IF NOT EXISTS` agar idempotent.

---

## 3. Enum Types

```sql
-- Chapter lifecycle status
CREATE TYPE chapter_status AS ENUM (
  'DRAFT',       -- Slot bab ada; outline belum ada
  'OUTLINED',    -- Outline sudah diisi; siap generate
  'QUEUED',      -- Menunggu worker tersedia; posisi antrian ditampilkan
  'WRITING',     -- Generasi sedang berlangsung
  'COMPLETED'    -- Chapter text tersimpan; chapter summary ditulis
);

-- Genre presets (opsional — bisa juga simpan sebagai text bebas)
-- Tidak dibuat enum karena user bisa pilih "Other" + teks bebas
-- Genre disimpan sebagai TEXT di tabel novels

-- Generation job status
CREATE TYPE job_status AS ENUM (
  'PENDING',     -- Job baru dibuat
  'RUNNING',     -- Sedang diproses worker
  'COMPLETED',   -- Selesai sukses
  'FAILED',      -- Gagal; chapter kembali ke OUTLINED
  'CANCELLED'    -- Dibatalkan (misal user archive novel saat WRITING)
);

-- Stale flag reason
CREATE TYPE stale_reason AS ENUM (
  'UPSTREAM_TEXT_CHANGED',       -- Teks bab sebelumnya berubah
  'UPSTREAM_SUMMARY_CHANGED',   -- Summary bab sebelumnya berubah
  'SYNOPSIS_CHANGED',           -- Synopsis novel berubah
  'PREMISE_CHANGED',            -- Premise novel berubah
  'METADATA_CHANGED'            -- Profile/canon berubah
);

-- Plot checkpoint decision
CREATE TYPE checkpoint_decision AS ENUM (
  'APPROVE',     -- Lanjutkan generasi
  'REJECT',      -- AI replan outline
  'EDIT'         -- User edit outline + arahan
);

-- Generation trigger type
CREATE TYPE generation_type AS ENUM (
  'WRITE',           -- First-time chapter generation
  'FULL_REGEN',      -- Full chapter regeneration
  'PARTIAL_REWRITE', -- Partial rewrite of selected text
  'SYNC_MEMORY',     -- Story memory sync (re-summarize)
  'BLURB'            -- Blurb generation
);
```

---

## 4. Tables

### 4.1 `profiles`

Data profil User yang tidak disimpan di `auth.users`. Display name di-supply via user_metadata Supabase Auth, tetapi kita tambahkan tabel `profiles` untuk data tambahan dan join yang lebih mudah.

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk lookup cepat
CREATE INDEX idx_profiles_display_name ON profiles (display_name);
```

**Relasi:**
- `profiles.id` → `auth.users.id` (1:1)
- `profiles.id` ← `novels.user_id` (1:N)

---

### 4.2 `novels`

Entitas utama. Satu Novel = satu buku lengkap.

```sql
CREATE TABLE novels (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  genre                   TEXT NOT NULL, -- preset atau teks bebas ("Other")
  writing_language        TEXT NOT NULL, -- bahasa output AI (mis. "id", "en")
  premise                 TEXT NOT NULL, -- user-authored; AI tidak generate
  synopsis                TEXT NOT NULL, -- user-authored; AI tidak generate
  blurb                   TEXT,          -- optional; generated on request; editable
  writing_style_notes     TEXT,          -- optional; tone, POV, constraints
  word_count_default      INT,          -- default word count target per chapter
  plot_checkpoints_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at            TIMESTAMPTZ,  -- null = belum selesai; non-null = marked complete
  archived_at             TIMESTAMPTZ,  -- null = aktif; non-null = archived
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

-- Index untuk library view (user's novels, sorted by updated_at)
CREATE INDEX idx_novels_user_id_updated_at ON novels (user_id, updated_at DESC);

-- Index untuk archive tab
CREATE INDEX idx_novels_user_id_archived ON novels (user_id, archived_at)
  WHERE archived_at IS NOT NULL;

-- Index untuk active novels
CREATE INDEX idx_novels_user_id_active ON novels (user_id)
  WHERE archived_at IS NULL;
```

**Relasi:**
- `novels.user_id` → `profiles.id` (N:1)
- `novels.id` ← `chapters.novel_id` (1:N)
- `novels.id` ← `character_profiles.novel_id` (1:N)
- `novels.id` ← `location_profiles.novel_id` (1:N)

---

### 4.3 `character_profiles`

Profil karakter opsional. User-authored only — AI tidak pernah generate.

```sql
CREATE TABLE character_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id    UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL, -- penampilan, kepribadian, rahasia, relasi
  sort_order  INT NOT NULL DEFAULT 0, -- urutan tampil di UI
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT character_profiles_name_length CHECK (char_length(name) >= 1)
);

-- Index untuk CRUD per novel
CREATE INDEX idx_character_profiles_novel_id ON character_profiles (novel_id, sort_order);
```

---

### 4.4 `location_profiles`

Profil lokasi/setting opsional. User-authored only.

```sql
CREATE TABLE location_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id    UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL, -- worldbuilding description
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT location_profiles_name_length CHECK (char_length(name) >= 1)
);

CREATE INDEX idx_location_profiles_novel_id ON location_profiles (novel_id, sort_order);
```

---

### 4.5 `chapters`

Tabel inti — menyimpan seluruh data Chapter termasuk text, outline, summary, dan status.

```sql
CREATE TABLE chapters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id          UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  sequence_number   INT NOT NULL, -- urutan bab dalam novel (1-based)
  title             TEXT,         -- judul bab; boleh kosong di DRAFT
  outline           TEXT,         -- chapter outline; wajib untuk OUTLINED+
  chapter_text      TEXT DEFAULT '', -- full chapter text; kosong sampai WRITING
  status            chapter_status NOT NULL DEFAULT 'DRAFT',
  chapter_summary   TEXT,         -- 3-5 poin ringkasan; diisi saat COMPLETED
  word_count_target INT,          -- override per chapter; null = pakai novel default
  outline_hash      TEXT,         -- hash outline saat pertama COMPLETED (untuk detect outline drift)
  error_message     TEXT,         -- error terakhir jika generasi gagal
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

-- Query: detect outline drift (COMPLETED + outline changed)
-- Uses outline_hash comparison in application logic
```

**Relasi:**
- `chapters.novel_id` → `novels.id` (N:1)
- `chapters.id` ← `chapter_context_snapshots.chapter_id` (1:1)
- `chapters.id` ← `chapter_summary_embeddings.chapter_id` (1:1)
- `chapters.id` ← `stale_chapter_flags.chapter_id` (1:N)
- `chapters.id` ← `stale_chapter_flags.caused_by_chapter_id` (1:N)
- `chapters.id` ← `generation_jobs.chapter_id` (1:N)

---

### 4.6 `chapter_context_snapshots`

Frozen record of character/world state saat chapter ditulis atau terakhir di-finalisasi. Digunakan untuk **Full chapter regeneration** — point-in-time context.

```sql
CREATE TABLE chapter_context_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id  UUID NOT NULL UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  snapshot    JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    Struktur snapshot (evolves over time):
    {
      "chapter_number": 12,
      "novel_metadata_version": "hash-or-timestamp",
      "character_states": [
        { "name": "John", "state": "hopeful", "chapter_introduced": 1 }
      ],
      "location_states": [
        { "name": "Castle", "state": "intact", "chapter_introduced": 5 }
      ],
      "world_state": {
        "key_fact_1": "value",
        "key_fact_2": "value"
      },
      "synopsis_at_time": "...",
      "premise_at_time": "...",
      "generated_at": "2025-01-01T00:00:00Z"
    }
  */
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Query: get snapshot for regeneration
-- chapter_id is UNIQUE, so no additional index needed beyond PK
```

**Relasi:**
- `chapter_context_snapshots.chapter_id` → `chapters.id` (1:1)

---

### 4.7 `chapter_summary_embeddings`

Embedding vector dari chapter summary untuk pgvector RAG. Digunakan oleh **SummaryRetriever** untuk mengambil top-10 retrieved chapter summaries berdasarkan similarity dengan current chapter outline.

```sql
CREATE TABLE chapter_summary_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id  UUID NOT NULL UNIQUE REFERENCES chapters(id) ON DELETE CASCADE,
  novel_id    UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  embedding   vector(1536), -- OpenAI ada-002 dimensions; sesuaikan dengan embedding model
  model       TEXT NOT NULL DEFAULT 'text-embedding-3-small', -- model yang digunakan
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HNSW index untuk cosine similarity search
-- Dipakai oleh SummaryRetriever: cari top-10 summary mirip dengan outline
CREATE INDEX idx_chapter_embeddings_hnsw ON chapter_summary_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index untuk lookup per novel (exclude recent chapters dari retrieval)
CREATE INDEX idx_chapter_embeddings_novel_id ON chapter_summary_embeddings (novel_id);

-- Composite index untuk filtered retrieval (exclude recent 20)
CREATE INDEX idx_chapter_embeddings_novel_chapter ON chapter_summary_embeddings (novel_id, chapter_id);
```

**Relasi:**
- `chapter_summary_embeddings.chapter_id` → `chapters.id` (1:1)
- `chapter_summary_embeddings.novel_id` → `novels.id` (N:1)

---

### 4.8 `stale_chapter_flags`

Menandai Chapter yang menjadi tidak konsisten karena perubahan upstream. Bukan blocker — hanya warning.

```sql
CREATE TABLE stale_chapter_flags (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id              UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  caused_by_chapter_id    UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  reason                  stale_reason NOT NULL,
  dismissed_at            TIMESTAMPTZ,  -- null = undismissed; non-null = dismissed
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Tidak bisa flag chapter sebagai stale oleh dirinya sendiri
  CONSTRAINT stale_no_self_flag CHECK (chapter_id != caused_by_chapter_id),
  -- Unique constraint: satu flag per chapter+cause combination
  CONSTRAINT stale_chapter_cause_unique UNIQUE (chapter_id, caused_by_chapter_id, reason)
);

-- Query: count undismissed stale chapters per novel (header badge)
CREATE INDEX idx_stale_chapter_flags_chapter_undismissed ON stale_chapter_flags (chapter_id)
  WHERE dismissed_at IS NULL;

-- Query: find all chapters flagged by a specific chapter (downstream propagation)
CREATE INDEX idx_stale_chapter_flags_caused_by ON stale_chapter_flags (caused_by_chapter_id);

-- Query: find stale chapters for a novel (stale list modal)
-- Requires join through chapters table
CREATE INDEX idx_stale_chapter_flags_chapter_id ON stale_chapter_flags (chapter_id, dismissed_at);
```

**Relasi:**
- `stale_chapter_flags.chapter_id` → `chapters.id` (N:1) — chapter yang stale
- `stale_chapter_flags.caused_by_chapter_id` → `chapters.id` (N:1) — chapter penyebab

---

### 4.9 `generation_jobs`

Tracking status generasi chapter. Digunakan untuk queue position, error handling, dan idempotency guard.

```sql
CREATE TABLE generation_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id        UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  generation_type   generation_type NOT NULL,
  status            job_status NOT NULL DEFAULT 'PENDING',
  queue_position    INT,           -- null jika tidak di-queue; 1-based saat QUEUED
  error_message     TEXT,          -- error details jika FAILED
  started_at        TIMESTAMPTZ,   -- kapan worker mulai proses
  completed_at      TIMESTAMPTZ,   -- kapan selesai (sukses atau gagal)
  metadata          JSONB DEFAULT '{}'::jsonb,
  /*
    Contoh metadata:
    {
      "model": "gemini-2.5-flash",
      "scene_count": 4,
      "tokens_used": { "input": 140000, "output": 2800 },
      "partial_rewrite_selection": "..."
    }
  */
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
```

**Relasi:**
- `generation_jobs.chapter_id` → `chapters.id` (N:1)
- `generation_jobs.user_id` → `profiles.id` (N:1)

---

## 5. Indexes

### Summary Index Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `novels` | `idx_novels_user_id_updated_at` | B-tree | Library view: user's novels sorted by recent |
| `novels` | `idx_novels_user_id_active` | Partial B-tree | Active novels (non-archived) |
| `novels` | `idx_novels_user_id_archived` | Partial B-tree | Archived novels |
| `chapters` | `idx_chapters_novel_id_sequence` | B-tree | Sidebar: chapters ordered by sequence |
| `chapters` | `idx_chapters_novel_id_status` | Partial B-tree | Find COMPLETED chapters for context |
| `chapters` | `idx_chapters_needing_embedding` | Partial B-tree | Chapters needing summary embedding |
| `character_profiles` | `idx_character_profiles_novel_id` | B-tree | Profiles per novel |
| `location_profiles` | `idx_location_profiles_novel_id` | B-tree | Profiles per novel |
| `chapter_summary_embeddings` | `idx_chapter_embeddings_hnsw` | HNSW | Cosine similarity search for RAG |
| `chapter_summary_embeddings` | `idx_chapter_embeddings_novel_id` | B-tree | Filter by novel |
| `stale_chapter_flags` | `idx_stale_chapter_flags_chapter_undismissed` | Partial B-tree | Count undismissed stale per chapter |
| `stale_chapter_flags` | `idx_stale_chapter_flags_caused_by` | B-tree | Downstream propagation |
| `generation_jobs` | `idx_generation_jobs_user_status` | Partial B-tree | Active jobs per user |
| `generation_jobs` | `idx_generation_jobs_chapter_active` | Partial B-tree | Active job per chapter |
| `generation_jobs` | `idx_generation_jobs_queue` | Partial B-tree | Queue drain |

---

## 6. Row Level Security (RLS)

### Prinsip

- **Semua tabel** di `public` schema harus punya RLS enabled
- Pakai `(SELECT auth.uid())` — bukan `auth.uid()` — untuk performance
- Separate policies per operasi: SELECT, INSERT, UPDATE, DELETE
- `TO authenticated` pada setiap policy
- Helper function untuk novel ownership check (reuse di semua tabel)

### Helper Function

```sql
-- Check if current user owns a novel
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

-- Get user's novel IDs (untuk cross-table ownership check)
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
```

### RLS Policies per Tabel

#### `profiles`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

-- Users can insert their own profile (signup)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Users cannot delete profile directly (cascade from auth.users delete)
-- No DELETE policy needed
```

#### `novels`

```sql
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
```

#### `character_profiles`

```sql
ALTER TABLE character_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read profiles for their novels
CREATE POLICY "character_profiles_select_own" ON character_profiles
  FOR SELECT TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

-- Users can insert profiles for their novels
CREATE POLICY "character_profiles_insert_own" ON character_profiles
  FOR INSERT TO authenticated
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

-- Users can update profiles for their novels
CREATE POLICY "character_profiles_update_own" ON character_profiles
  FOR UPDATE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()))
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

-- Users can delete profiles for their novels
CREATE POLICY "character_profiles_delete_own" ON character_profiles
  FOR DELETE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));
```

#### `location_profiles`

```sql
ALTER TABLE location_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "location_profiles_select_own" ON location_profiles
  FOR SELECT TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

CREATE POLICY "location_profiles_insert_own" ON location_profiles
  FOR INSERT TO authenticated
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

CREATE POLICY "location_profiles_update_own" ON location_profiles
  FOR UPDATE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()))
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

CREATE POLICY "location_profiles_delete_own" ON location_profiles
  FOR DELETE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));
```

#### `chapters`

```sql
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
```

#### `chapter_context_snapshots`

```sql
ALTER TABLE chapter_context_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_select_own" ON chapter_context_snapshots
  FOR SELECT TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

CREATE POLICY "snapshots_insert_own" ON chapter_context_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

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

CREATE POLICY "snapshots_delete_own" ON chapter_context_snapshots
  FOR DELETE TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));
```

#### `chapter_summary_embeddings`

```sql
ALTER TABLE chapter_summary_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "embeddings_select_own" ON chapter_summary_embeddings
  FOR SELECT TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));

CREATE POLICY "embeddings_insert_own" ON chapter_summary_embeddings
  FOR INSERT TO authenticated
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

CREATE POLICY "embeddings_update_own" ON chapter_summary_embeddings
  FOR UPDATE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()))
  WITH CHECK (novel_id IN (SELECT user_novel_ids()));

CREATE POLICY "embeddings_delete_own" ON chapter_summary_embeddings
  FOR DELETE TO authenticated
  USING (novel_id IN (SELECT user_novel_ids()));
```

#### `stale_chapter_flags`

```sql
ALTER TABLE stale_chapter_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stale_flags_select_own" ON stale_chapter_flags
  FOR SELECT TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

CREATE POLICY "stale_flags_insert_own" ON stale_chapter_flags
  FOR INSERT TO authenticated
  WITH CHECK (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));

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

CREATE POLICY "stale_flags_delete_own" ON stale_chapter_flags
  FOR DELETE TO authenticated
  USING (chapter_id IN (
    SELECT c.id FROM chapters c
    WHERE c.novel_id IN (SELECT user_novel_ids())
  ));
```

#### `generation_jobs`

```sql
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gen_jobs_select_own" ON generation_jobs
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "gen_jobs_insert_own" ON generation_jobs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "gen_jobs_update_own" ON generation_jobs
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "gen_jobs_delete_own" ON generation_jobs
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
```

---

## 7. Utility Functions & Triggers

### Updated_at Trigger

```sql
-- Generic function to set updated_at on row modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON novels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON character_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON location_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON chapter_context_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON chapter_summary_embeddings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON stale_chapter_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### Auto-create Profile on Signup

```sql
-- Automatically create profile row when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User')
  );
  RETURN NEW;
END;
$$;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Cascade Delete on Account Deletion

```sql
-- When a user is deleted from auth.users, cascade through profiles → novels → everything
-- This is already handled by ON DELETE CASCADE on foreign keys, but we add an explicit
-- function for the "Account deletion" feature that needs to clean up Mem0 externally

CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify the requesting user is deleting their own account
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Cannot delete another user account';
  END IF;

  -- Delete all novels (cascade will handle chapters, snapshots, embeddings, stale flags, jobs)
  DELETE FROM public.novels WHERE user_id = p_user_id;

  -- Delete profile (will cascade from auth.users deletion)
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- Note: auth.users deletion itself must be handled by Supabase Auth admin API
  -- This function cleans up our domain data first
END;
$$;
```

### Outline Hash for Drift Detection

```sql
-- Function to compute outline hash when chapter first becomes COMPLETED
CREATE OR REPLACE FUNCTION public.compute_outline_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When chapter transitions to COMPLETED, store hash of outline
  IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') THEN
    NEW.outline_hash = md5(NEW.outline);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER compute_outline_hash BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION public.compute_outline_hash();
```

### Stale Chapter Propagation Helper

```sql
-- Function to flag downstream chapters as stale
-- Called by application layer after chapter text/summary changes
CREATE OR REPLACE FUNCTION public.flag_downstream_chapters(
  p_chapter_id UUID,
  p_reason stale_reason
)
RETURNS INT -- number of chapters flagged
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_novel_id UUID;
  v_sequence INT;
  v_count INT := 0;
BEGIN
  -- Get the chapter's novel and sequence
  SELECT novel_id, sequence_number INTO v_novel_id, v_sequence
  FROM chapters WHERE id = p_chapter_id;

  -- Flag all later COMPLETED chapters as stale
  INSERT INTO stale_chapter_flags (chapter_id, caused_by_chapter_id, reason)
  SELECT c.id, p_chapter_id, p_reason
  FROM chapters c
  WHERE c.novel_id = v_novel_id
    AND c.sequence_number > v_sequence
    AND c.status = 'COMPLETED'
  ON CONFLICT (chapter_id, caused_by_chapter_id, reason) DO UPDATE
    SET dismissed_at = NULL, updated_at = now(); -- re-flag if previously dismissed

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
```

### Chapter Status Transition Guard

```sql
-- Function to validate chapter status transitions
CREATE OR REPLACE FUNCTION public.validate_chapter_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cannot change status of a chapter that is currently WRITING
  -- (application layer should handle this, but database guard as safety net)

  -- Cannot transition from COMPLETED back to DRAFT or OUTLINED
  -- (only via full regeneration which goes through a new generation job)
  IF OLD.status = 'COMPLETED' AND NEW.status IN ('DRAFT', 'OUTLINED') THEN
    -- Allow only if this is a full regeneration (chapter_text is being replaced)
    -- Application layer must set chapter_text = '' before triggering this
    IF NEW.chapter_text != '' AND NEW.chapter_text IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot transition COMPLETED chapter to % without clearing chapter_text', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_chapter_transition BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION public.validate_chapter_transition();
```

---

## 8. Migration Order

```
supabase/migrations/
├── 20260101000000_enable_extensions.sql       -- pgvector, pg_trgm
├── 20260101000001_create_enums.sql            -- chapter_status, job_status, stale_reason, etc.
├── 20260101000002_create_profiles.sql         -- profiles + RLS + trigger
├── 20260101000003_create_novels.sql           -- novels + RLS
├── 20260101000004_create_character_profiles.sql
├── 20260101000005_create_location_profiles.sql
├── 20260101000006_create_chapters.sql         -- chapters + RLS + outline_hash trigger
├── 20260101000007_create_snapshots.sql        -- chapter_context_snapshots + RLS
├── 20260101000008_create_embeddings.sql       -- chapter_summary_embeddings + HNSW + RLS
├── 20260101000009_create_stale_flags.sql      -- stale_chapter_flags + RLS
├── 20260101000010_create_generation_jobs.sql  -- generation_jobs + RLS
├── 20260101000011_create_functions.sql        -- helper functions, triggers, propagation
└── 20260101000012_create_indexes.sql          -- additional composite indexes
```

**Catatan:**
- Setiap migration harus idempotent (`IF NOT EXISTS`)
- Jalankan `supabase db reset` untuk test local
- Deploy ke production via `supabase db push --db-url $PROD_URL`

---

## 9. ER Diagram (text)

```
┌──────────────┐
│  auth.users  │ (Supabase Auth)
│  ────────────│
│  id (PK)     │
│  email       │
│  raw_user_   │
│  meta_data   │
└──────┬───────┘
       │ 1:1
       ▼
┌──────────────┐     1:N     ┌──────────────┐
│  profiles    │────────────▶│   novels     │
│  ────────────│             │  ────────────│
│  id (PK,FK)  │             │  id (PK)     │
│  display_name│             │  user_id(FK) │
│  created_at  │             │  title       │
│  updated_at  │             │  genre       │
└──────────────┘             │  writing_    │
                             │  language    │
                             │  premise     │
                             │  synopsis    │
                             │  blurb       │
                             │  writing_    │
                             │  style_notes │
                             │  word_count_ │
                             │  default     │
                             │  plot_check- │
                             │  points_     │
                             │  enabled     │
                             │  completed_at│
                             │  archived_at │
                             │  created_at  │
                             │  updated_at  │
                             └──────┬───────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │  character_  │ │  location_   │ │   chapters   │
          │  profiles    │ │  profiles    │ │  ────────────│
          │  ────────────│ │  ────────────│ │  id (PK)     │
          │  id (PK)     │ │  id (PK)     │ │  novel_id(FK)│
          │  novel_idFK) │ │  novel_idFK) │ │  sequence_   │
          │  name        │ │  name        │ │  number      │
          │  description │ │  description │ │  title       │
          │  sort_order  │ │  sort_order  │ │  outline     │
          │  created_at  │ │  created_at  │ │  chapter_text│
          │  updated_at  │ │  updated_at  │ │  status      │
          └──────────────┘ └──────────────┘ │  chapter_    │
                                            │  summary     │
                                            │  word_count_ │
                                            │  target      │
                                            │  outline_hash│
                                            │  error_      │
                                            │  message     │
                                            │  created_at  │
                                            │  updated_at  │
                                            └──────┬───────┘
                                                   │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                              ▼                     ▼                     ▼
                    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                    │  chapter_    │     │  chapter_    │     │  stale_      │
                    │  context_    │     │  summary_    │     │  chapter_    │
                    │  snapshots   │     │  embeddings  │     │  flags       │
                    │  ────────────│     │  ────────────│     │  ────────────│
                    │  id (PK)     │     │  id (PK)     │     │  id (PK)     │
                    │  chapter_id  │     │  chapter_id  │     │  chapter_id  │
                    │  (FK,UNIQUE) │     │  (FK,UNIQUE) │     │  (FK)        │
                    │  snapshot    │     │  novel_id    │     │  caused_by_  │
                    │  (JSONB)     │     │  (FK)        │     │  chapter_id  │
                    │  created_at  │     │  embedding   │     │  (FK)        │
                    │  updated_at  │     │  (vector)    │     │  reason      │
                    └──────────────┘     │  model       │     │  dismissed_at│
                                         │  created_at  │     │  created_at  │
                                         │  updated_at  │     │  updated_at  │
                                         └──────────────┘     └──────────────┘
                                                                       │
                                                                       │
                                                      ┌───────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────┐
                                            │  generation_ │
                                            │  jobs        │
                                            │  ────────────│
                                            │  id (PK)     │
                                            │  chapter_id  │
                                            │  (FK)        │
                                            │  user_id(FK) │
                                            │  generation_ │
                                            │  type        │
                                            │  status      │
                                            │  queue_      │
                                            │  position    │
                                            │  error_      │
                                            │  message     │
                                            │  started_at  │
                                            │  completed_at│
                                            │  metadata    │
                                            │  (JSONB)     │
                                            │  created_at  │
                                            │  updated_at  │
                                            └──────────────┘
```

---

## 10. Design Decisions

### 10.1 Profiles vs Auth Metadata

| Approach | Kelebihan | Kekurangan |
|----------|-----------|------------|
| **Display name di `user_metadata` saja** | Tidak perlu tabel tambahan | Join sulit; query manual |
| **Tabel `profiles` (dipilih)** | Join mudah; RLS konsisten; ekstensibel | Satu tabel tambahan |

**Keputusan:** Pakai `profiles` — lebih scalable dan konsisten dengan pattern Supabase.

### 10.2 Snapshot Storage

| Approach | Kelebihan | Kekurangan |
|----------|-----------|------------|
| **JSONB di `chapters`** | Tidak perlu tabel baru | Table chapters makin lebar; tidak bisa query individual snapshot |
| **Tabel terpisah (dipilih)** | Clean separation; query per chapter mudah; bisa di-swap nanti | Satu join tambahan |

**Keputusan:** Tabel terpisah — karena snapshot adalah frozen state yang di-read/write terpisah dari chapter text.

### 10.3 Embedding Separation

| Approach | Kelebihan | Kekurangan |
|----------|-----------|------------|
| **Kolom vector di `chapters`** | Tidak perlu tabel baru | Chapters table jadi wide; index vector mengganggu B-tree performance |
| **Tabel terpisah (dipilih)** | Index vector terisolasi; bisa rebuild tanpa affect chapters; embedding model bisa berubah | Satu tabel tambahan |

**Keputusan:** Tabel terpisah — pgvector index berat dan sebaiknya terisolasi.

### 10.4 Genre Storage

| Approach | Kelebihan | Kekurangan |
|----------|-----------|------------|
| **ENUM genre** | Validasi di DB; konsisten | Harus update enum saat tambah preset; "Other" sulit |
| **TEXT dengan CHECK (dipilih)** | Fleksibel untuk "Other" + teks bebas; UI handle validasi | Tidak ada validasi di DB |

**Keputusan:** TEXT — karena user bisa pilih "Other" + custom text, dan genre presets bisa berubah tanpa DB migration.

### 10.5 Generation Jobs vs Supabase Queues (pgmq)

| Approach | Kelebihan | Kekurangan |
|----------|-----------|------------|
| **pgmq bawaan Supabase** | Managed; built-in dequeue | API berbeda; visibility timeout; complex |
| **Tabel `generation_jobs` (dipilih)** | Full kontrol; bisa query; RLS konsisten; metadata fleksibel | Harus handle queue logic sendiri |

**Keputusan:** Tabel `generation_jobs` — karena kita perlu kontrol penuh atas queue position, metadata, dan error handling. pgmq bisa ditambahkan nanti sebagai backup untuk overload path.

### 10.6 Outline Hash untuk Drift Detection

`outline_hash` disimpan di chapter saat pertama kali COMPLETED. Saat user edit outline, hash berubah. Application layer compare hash untuk detect outline drift — tidak perlu tabel terpisah.

### 10.7 Foreign Key Cascade Behavior

| onDelete | Kapan dipakai |
|----------|---------------|
| `CASCADE` | Semua tabel domain — hapus novel → hapus semua data terkait |
| `CASCADE` via profiles → auth.users | Hapus user → hapus profile → hapus semua novels |

Tidak ada `SET NULL` atau `RESTRICT` karena semua data milik user dan harus bisa dihapus bersih.

### 10.8 LangGraph Checkpointer

LangGraph state persist via `@langchain/langgraph-checkpoint-postgres` menggunakan tabel bawaan library (bukan tabel custom kita). Tabel checkpointer dibuat otomatis oleh LangGraph saat pertama kali diinisialisasi. Kita tidak perlu membuat migration untuk ini.

---

## Appendix: A. Supabase Config Notes

### `config.toml` (Supabase CLI)

```toml
[db]
port = 54322
shadow_port = 54320

[auth]
enabled = true

[auth.email]
enable_signup = true
double_confirm_changes = false  # v1: no email verification
enable_confirmations = false    # v1: no email verification
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Database (for direct Postgres access — checkpointer, pgvector queries)
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
```

---

## Appendix: B. Query Examples

### Recent Chapter Summaries (last 20)

```sql
SELECT c.sequence_number, c.chapter_summary
FROM chapters c
WHERE c.novel_id = :novel_id
  AND c.status = 'COMPLETED'
  AND c.chapter_summary IS NOT NULL
ORDER BY c.sequence_number DESC
LIMIT 20;
```

### Retrieved Chapter Summaries (top 10 by pgvector similarity)

```sql
SELECT c.sequence_number, c.chapter_summary, cse.embedding <=> :outline_embedding AS distance
FROM chapter_summary_embeddings cse
JOIN chapters c ON c.id = cse.chapter_id
WHERE c.novel_id = :novel_id
  AND c.status = 'COMPLETED'
  AND c.sequence_number < :current_chapter_number
  AND c.sequence_number NOT IN (
    -- Exclude recent 20 (already included above)
    SELECT c2.sequence_number
    FROM chapters c2
    WHERE c2.novel_id = :novel_id
      AND c2.status = 'COMPLETED'
      AND c2.sequence_number < :current_chapter_number
    ORDER BY c2.sequence_number DESC
    LIMIT 20
  )
ORDER BY cse.embedding <=> :outline_embedding
LIMIT 10;
```

### Count Undismissed Stale Chapters

```sql
SELECT COUNT(*) as stale_count
FROM stale_chapter_flags scf
WHERE scf.chapter_id IN (
  SELECT c.id FROM chapters c WHERE c.novel_id = :novel_id
)
AND scf.dismissed_at IS NULL;
```

### Acquire Generation Slot (Idempotency Guard)

```sql
-- Check if user already has 1 QUEUED + 1 WRITING
SELECT
  COUNT(*) FILTER (WHERE status = 'QUEUED') as queued_count,
  COUNT(*) FILTER (WHERE status = 'RUNNING') as running_count
FROM generation_jobs
WHERE user_id = :user_id
  AND status IN ('QUEUED', 'RUNNING');
```

### Get Prior Chapter Text (for generation)

```sql
SELECT chapter_text
FROM chapters
WHERE novel_id = :novel_id
  AND sequence_number = :current_sequence - 1
  AND status = 'COMPLETED';
```

---

> **Next steps:** Saat mulai implementasi, buat migration files per tabel mengikuti urutan di §8. Jalankan `supabase db reset` untuk validasi local. Deploy ke production via `supabase db push`.
