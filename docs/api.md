# API Documentation — Novyl v1

> **Status:** Draft — belum diimplementasi. Dokumen ini merinci semua endpoint, request/response format, error handling, SSE protocol, dan business rules.
>
> **Base URL:** `https://<project-url>.supabase.co` (Supabase) + `https://<vercel-url>` (Next.js API routes)
>
> **Referensi:** [`docs/prd-v1.md`](./prd-v1.md), [`docs/db-schema.md`](./db-schema.md), [`docs/brief.md`](./brief.md), [`CONTEXT.md`](../CONTEXT.md)

---

## Daftar Isi

1. [Authentication](#1-authentication)
2. [Novel Management](#2-novel-management)
3. [Chapter Management](#3-chapter-management)
4. [Chapter Generation & Streaming](#4-chapter-generation--streaming)
5. [Story Memory & Editing](#5-story-memory--editing)
6. [Plot Checkpoints](#6-plot-checkpoints)
7. [Stale Chapters](#7-stale-chapters)
8. [Account Management](#8-account-management)
9. [SSE Protocol](#9-sse-protocol)
10. [Error Handling](#10-error-handling)
11. [Business Rules & Validation](#11-business-rules--validation)
12. [Module Mapping](#12-module-mapping)

---

## 1. Authentication

Semua API routes (kecuali signup) memerlukan **authenticated session** dari Supabase Auth. Session di-validasi via Supabase server client di setiap request.

### Supabase Auth Endpoints

> **Catatan:** Endpoint auth di-handle oleh Supabase Auth, bukan Next.js route handler. Frontend memanggil Supabase client library langsung.

#### `POST /auth/v1/signup`

Daftar akun baru (open signup, v1).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "data": {
    "display_name": "Nama Penulis"
  }
}
```

**Response (200):**
```json
{
  "id": "uuid-of-user",
  "email": "user@example.com",
  "user_metadata": {
    "display_name": "Nama Penulis"
  },
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Business Rules:**
- Display name, email, password wajib
- Tidak ada email verification di v1
- Trigger `handle_new_user()` otomatis buat row di `profiles`

---

#### `POST /auth/v1/token?grant_type=password`

Sign in dengan email + password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc...",
  "expires_in": 3600,
  "token_type": "bearer",
  "user": {
    "id": "uuid-of-user",
    "email": "user@example.com"
  }
}
```

**Frontend Usage:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword123',
})
```

---

#### `POST /auth/v1/logout`

Sign out.

**Headers:** `Authorization: Bearer <access_token>`

**Response (204):** No content

---

#### `GET /auth/v1/user`

Get current user.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "id": "uuid-of-user",
  "email": "user@example.com",
  "user_metadata": {
    "display_name": "Nama Penulis"
  }
}
```

---

## 2. Novel Management

### `POST /api/novels`

Buat Novel baru.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "title": "Pedang Naga Api",
  "genre": "Fantasy",
  "writing_language": "id",
  "premise": "Seorang pedagang muda menemukan pedang kuno yang terkutuk, memaksanya memilih antara kekuatan yang ditawarkan atau jiwa yang perlahan lenyap.",
  "synopsis": "Raka, pedagang rempah di desa pesisir, menemukan pedang berukir naga di gua tersembunyi. Pedang itu berbisik, menawarkan kekuatan tak terbatas—tapi setiap kekuasan mengikis memorinya. Bersama dua sahabatnya, ia memulai perjalanan untuk memecahkan kutukan sebelum seluruh identitasnya lenyap.",
  "word_count_default": 2000,
  "plot_checkpoints_enabled": false,
  "writing_style_notes": "POV orang ketiga terbatas. Nada gelap tapi harapan. Hindari info-dump."
}
```

**Response (201):**
```json
{
  "id": "uuid-of-novel",
  "title": "Pedang Naga Api",
  "genre": "Fantasy",
  "writing_language": "id",
  "premise": "Seorang pedagang muda...",
  "synopsis": "Raka, pedagang rempah...",
  "blurb": null,
  "writing_style_notes": "POV orang ketiga...",
  "word_count_default": 2000,
  "plot_checkpoints_enabled": false,
  "completed_at": null,
  "archived_at": null,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

**Validation Rules:**
- `title`: wajib, minimal 1 karakter
- `genre`: wajib, preset atau teks bebas
- `writing_language`: wajib, ISO 639-1 code (mis. "id", "en")
- `premise`: wajib, minimal 10 karakter — user-authored, AI tidak generate
- `synopsis`: wajib, minimal 20 karakter — user-authored, AI tidak generate
- `word_count_default`: optional, harus > 0 jika diisi

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Validation failed (field missing atau terlalu pendek) |
| 401 | Tidak terautentikasi |
| 403 | Bukan pemilik novel |
| 500 | Server error |

---

### `GET /api/novels`

Ambil semua Novel milik user (library view).

**Headers:** `Authorization: Bearer <supabase_access_token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `archived` | `boolean` | `false` | Filter archived novels |

**Response (200):**
```json
{
  "novels": [
    {
      "id": "uuid-of-novel",
      "title": "Pedang Naga Api",
      "genre": "Fantasy",
      "writing_language": "id",
      "completed_at": null,
      "archived_at": null,
      "chapter_count": 12,
      "stale_count": 3,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-15T00:00:00Z"
    }
  ]
}
```

**Notes:**
- `chapter_count`: jumlah chapters ( semua status )
- `stale_count`: jumlah undismissed stale chapters
- Sorted by `updated_at DESC`

---

### `GET /api/novels/:id`

Ambil detail Novel lengkap (termasuk profiles).

**Headers:** `Authorization: Bearer <supabase_access_token>`

**Response (200):**
```json
{
  "id": "uuid-of-novel",
  "title": "Pedang Naga Api",
  "genre": "Fantasy",
  "writing_language": "id",
  "premise": "Seorang pedagang muda...",
  "synopsis": "Raka, pedagang rempah...",
  "blurb": "Dalam dunia yang dilanda...",
  "writing_style_notes": "POV orang ketiga...",
  "word_count_default": 2000,
  "plot_checkpoints_enabled": false,
  "completed_at": null,
  "archived_at": null,
  "character_profiles": [
    {
      "id": "uuid-of-char",
      "name": "Raka",
      "description": "Pedagang rempah berusia 24 tahun. Tubuh kurus, rambut hitam panjang. Penasaran tapi hati-hati.",
      "sort_order": 0
    }
  ],
  "location_profiles": [
    {
      "id": "uuid-of-loc",
      "name": "Desa Pesisir Tanjung",
      "description": "Desa nelayan kecil di tepi laut selatan. Rumah kayu berjajar, pasar rempah ramai.",
      "sort_order": 0
    }
  ],
  "chapters": [
    {
      "id": "uuid-of-chapter",
      "sequence_number": 1,
      "title": "Pedang di Gua",
      "status": "COMPLETED",
      "chapter_summary": "Raka menemukan pedang di gua...",
      "outline_hash": "abc123...",
      "error_message": null
    }
  ],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-15T00:00:00Z"
}
```

---

### `PATCH /api/novels/:id`

Update metadata Novel. Perubahan ke premise/synopsis akan flag semua COMPLETED chapters sebagai stale.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body (semua field optional):**
```json
{
  "title": "Pedang Naga Api (Edisi Baru)",
  "genre": "Epic Fantasy",
  "premise": "Diperbarui: premise baru...",
  "synopsis": "Diperbarui: sinopsis baru...",
  "blurb": "Copy pemasaran baru...",
  "writing_style_notes": "Tambahkan: hindari adegan kekerasan berlebihan.",
  "word_count_default": 2500,
  "plot_checkpoints_enabled": true
}
```

**Response (200):** Novel object yang di-update

**Business Rules:**
- Jika `premise` atau `synopsis` berubah → semua COMPLETED chapters di-flag stale (reason: `SYNOPSIS_CHANGED` atau `PREMISE_CHANGED`)
- Warning di-trigger ke frontend sebelum save (UI: AlertDialog peringatan)
- `plot_checkpoints_enabled`: toggle on/off, default false
- `blurb`: bisa di-edit manual setelah generate

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Validation failed |
| 401 | Tidak terautentikasi |
| 403 | Bukan pemilik novel |
| 404 | Novel tidak ditemukan |

---

### `DELETE /api/novels/:id`

Hard delete Novel. Semua data terkait (chapters, snapshots, embeddings, stale flags, generation jobs) di-cascade hapus.

**Headers:**
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "confirm_title": "Pedang Naga Api"
}
```

**Response (204):** No content

**Business Rules:**
- User harus ketik **Novel title** persis untuk konfirmasi
- `confirm_title` harus match dengan `novels.title`
- Cascade hapus semua data terkait
- Tidak ada grace period di v1

**Errors:**
| Code | Reason |
|------|--------|
| 400 | `confirm_title` tidak cocok |
| 401 | Tidak terautentikasi |
| 403 | Bukan pemilik novel |
| 404 | Novel tidak ditemukan |

---

### `PATCH /api/novels/:id/archive`

Arsipkan atau pulihkan Novel.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "archived": true
}
```

**Response (200):**
```json
{
  "id": "uuid-of-novel",
  "archived_at": "2026-01-15T00:00:00Z"
}
```

**Business Rules:**
- `archived: true` → set `archived_at = now()`
- `archived: false` → set `archived_at = null` (restore)
- Archived novels: AI generation diblokir, Tulis dinonaktifkan
- Data tidak dihapus, hanya hidden dari library aktif

---

### `PATCH /api/novels/:id/complete`

Tandai atau batalkan status Completed Novel.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "completed": true
}
```

**Response (200):**
```json
{
  "id": "uuid-of-novel",
  "completed_at": "2026-01-15T00:00:00Z",
  "suggest_blurb": true
}
```

**Business Rules:**
- `completed: true` → set `completed_at = now()`
- `completed: false` → set `completed_at = null` (unmark)
- Jika belum ada blurb saat mark complete → `suggest_blurb: true` (frontend tawarkan modal Blurb)
- Label reversible, tidak memblokir chapters baru atau edit

---

## 3. Chapter Management

### `POST /api/novels/:id/chapters`

Tambah Chapter slot baru.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "title": "Bab 1: Pedang di Gua",
  "outline": "Raka menjelajahi gua saat Badai. Dia menemukan pedang berukir naga. Saat menyentuhnya, dia mendengar bisikan pertama. Bab berakhir dengan dia meninggalkan gua dengan pedang."
}
```

**Response (201):**
```json
{
  "id": "uuid-of-chapter",
  "novel_id": "uuid-of-novel",
  "sequence_number": 1,
  "title": "Bab 1: Pedang di Gua",
  "outline": "Raka menjelajahi gua...",
  "chapter_text": "",
  "status": "OUTLINED",
  "chapter_summary": null,
  "word_count_target": null,
  "outline_hash": null,
  "error_message": null,
  "created_at": "2026-01-01T00:00:00Z"
}
```

**Business Rules:**
- `title`: optional di DRAFT (boleh kosong)
- `outline`: jika diisi → status = `OUTLINED`; jika kosong/null → status = `DRAFT`
- `sequence_number`: auto-increment berdasarkan max sequence di novel
- Novel tidak boleh archived

**Status Transitions:**
- Tanpa outline: `→ DRAFT`
- Dengan outline: `→ OUTLINED`

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Novel archived atau validation failed |
| 401 | Tidak terautentikasi |
| 403 | Bukan pemilik novel |
| 404 | Novel tidak ditemukan |

---

### `PATCH /api/chapters/:id`

Update Chapter (outline, title, chapter text). **Tidak bisa update saat WRITING.**

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body (semua field optional):**
```json
{
  "title": "Bab 1: Pedang di Gua (Revisi)",
  "outline": "Outline yang diperbarui...",
  "chapter_text": "Teks bab yang di-edit manual..."
}
```

**Response (200):** Chapter object yang di-update

**Business Rules:**
- **Outline edit saat COMPLETED:** tidak flag stale downstream; tapi chapter tampil **Outline drift** di editor
- **Chapter text edit (manual edit):** auto-save, tidak otomatis refresh story memory
- **Status DRAFT + outline diisi:** transisi ke OUTLINED
- **Tidak bisa edit saat WRITING atau QUEUED**

**Outline Drift Detection:**
- Saat outline di-edit pada chapter COMPLETED, bandingkan `outline_hash` dengan `md5(outline)` baru
- Jika berbeda → chapter menunjukkan **Outline drift** alert
- Resolve via: full chapter regeneration atau revert outline

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Validation failed |
| 401 | Tidak terautentikasi |
| 403 | Bukan pemilik chapter |
| 404 | Chapter tidak ditemukan |
| 409 | Chapter sedang WRITING/QUEUED |

---

### `DELETE /api/chapters/:id`

Hapus Chapter. Rules tergantung status.

**Headers:** `Authorization: Bearer <supabase_access_token>`

**Response (204):** No content

**Business Rules:**

| Status | Bisa Hapus? | Kondisi |
|--------|------------|---------|
| DRAFT | Ya | Bebas |
| OUTLINED | Ya | Bebas |
| QUEUED | **Tidak** | Diblokir |
| WRITING | **Tidak** | Diblokir |
| COMPLETED | Hanya jika **manuscript tail** | Tidak ada COMPLETED chapter setelahnya |

**Cascade Delete:**
- Hapus chapter COMPLETED → hapus chapter_text, chapter_summary, chapter_context_snapshot, chapter_summary_embedding, stale_chapter_flags, generation_jobs terkait
- Setelah hapus, sequence numbers tetap (tidak di-reindex) — gap diperbolehkan di v1

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Tidak bisa hapus (COMPLETED bukan tail, atau sedang WRITING/QUEUED) |
| 401 | Tidak terautentikasi |
| 403 | Bukan pemilik chapter |
| 404 | Chapter tidak ditemukan |

---

### `GET /api/chapters/:id`

Ambil detail Chapter (termasuk chapter_text).

**Headers:** `Authorization: Bearer <supabase_access_token>`

**Response (200):**
```json
{
  "id": "uuid-of-chapter",
  "novel_id": "uuid-of-novel",
  "sequence_number": 1,
  "title": "Bab 1: Pedang di Gua",
  "outline": "Raka menjelajahi gua...",
  "chapter_text": "Badai menghantam pesisir Tanjung...",
  "status": "COMPLETED",
  "chapter_summary": "Raka menemukan pedang terkutuk di gua...",
  "word_count_target": 2000,
  "outline_hash": "abc123def456...",
  "error_message": null,
  "has_outline_drift": false,
  "stale_flags": [],
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-10T00:00:00Z"
}
```

**Notes:**
- `has_outline_drift`: computed field — `true` jika outline hash berbeda dengan hash saat COMPLETED
- `stale_flags`: array of active (undismissed) stale flags untuk chapter ini

---

### `GET /api/novels/:id/chapters`

Ambil semua Chapter untuk sidebar (ringan, tanpa chapter_text).

**Headers:** `Authorization: Bearer <supabase_access_token>`

**Response (200):**
```json
{
  "chapters": [
    {
      "id": "uuid-of-chapter",
      "sequence_number": 1,
      "title": "Bab 1: Pedang di Gua",
      "status": "COMPLETED",
      "has_outline_drift": false,
      "stale_count": 0,
      "queue_position": null,
      "error_message": null
    },
    {
      "id": "uuid-of-chapter-2",
      "sequence_number": 2,
      "title": "Bab 2: Bisikan Pertama",
      "status": "QUEUED",
      "has_outline_drift": false,
      "stale_count": 1,
      "queue_position": 2,
      "error_message": null
    }
  ]
}
```

**Notes:**
- `chapter_text` tidak di-include (hemat bandwidth)
- `queue_position`: non-null jika status QUEUED
- `stale_count`: jumlah undismissed stale flags

---

## 4. Chapter Generation & Streaming

### `POST /api/chapters/:id/write`

Trigger generasi Chapter. Mengembalikan SSE stream URL atau job ID.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "generation_type": "WRITE"
}
```

`generation_type` values:
- `"WRITE"` — First-time chapter generation
- `"FULL_REGEN"` — Full chapter regeneration

**Response (202 Accepted):**
```json
{
  "job_id": "uuid-of-generation-job",
  "stream_url": "/api/chapters/:id/stream",
  "status": "WRITING"
}
```

atau jika slot penuh:
```json
{
  "job_id": "uuid-of-generation-job",
  "stream_url": null,
  "status": "QUEUED",
  "queue_position": 3
}
```

**Business Rules — Idempotency Guard:**
1. **Max 1 QUEUED + 1 WRITING** per User pada satu waktu
2. Tidak bisa trigger write jika chapter sudah WRITING atau QUEUED
3. Chapter N hanya bisa WRITING jika Chapter N−1 COMPLETED (atau N = 1)
4. Novel tidak boleh archived
5. Chapter harus berstatus OUTLINED

**State Machine:**
```
OUTLINED ──(slot free)──► WRITING
OUTLINED ──(slots full)──► QUEUED
WRITING ──(success)──► COMPLETED
WRITING ──(failure)──► OUTLINED (+ error_message)
QUEUED ──(job failure)──► OUTLINED (+ error_message)
```

**Context Gathering (dilakukan server-side):**
1. Synopsis, outline, profiles, writing style notes, word count target
2. Derived canon dari Mem0
3. Prior chapter text (seluruh teks Chapter N−1)
4. Recent 20 chapter summaries
5. Top 10 retrieved chapter summaries (pgvector)

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Chapter bukan OUTLINED, atau belum ada outline |
| 401 | Tidak terautentikasi |
| 403 | Bukan pemilik chapter |
| 404 | Chapter tidak ditemukan |
| 409 | Chapter sudah WRITING/QUEUED, atau Chapter N−1 belum COMPLETED |
| 429 | Max slot tercapai (1 QUEUED + 1 WRITING) |

---

### `GET /api/chapters/:id/stream`

SSE endpoint untuk streaming chapter text saat generasi.

**Headers:** `Authorization: Bearer <supabase_access_token>`

**Response:** `text/event-stream` (SSE)

**SSE Events:**

| Event | Data | Description |
|-------|------|-------------|
| `token` | `{ "content": "Badai " }` | Token text baru |
| `scene_start` | `{ "scene": 1, "total_scenes": 4` | Scene baru dimulai (internal) |
| `progress` | `{ "scene": 2, "percent": 50 }` | Progress update |
| `checkpoint` | `{ "type": "irreversible_beat", "description": "..." }` | Plot checkpoint — user harus approve/reject/edit |
| `done` | `{ "chapter_id": "uuid", "status": "COMPLETED" }` | Generasi selesai |
| `error` | `{ "code": "GENERATION_FAILED", "message": "..." }` | Generasi gagal |

**Frontend Usage:**
```typescript
const eventSource = new EventSource(streamUrl, {
  headers: { 'Authorization': `Bearer ${token}` }
})

eventSource.addEventListener('token', (e) => {
  const { content } = JSON.parse(e.data)
  editor.commands.insertContent(content)
})

eventSource.addEventListener('done', (e) => {
  const { status } = JSON.parse(e.data)
  if (status === 'COMPLETED') refreshChapter()
})

eventSource.addEventListener('checkpoint', (e) => {
  const checkpoint = JSON.parse(e.data)
  showPlotCheckpointDialog(checkpoint)
})

eventSource.addEventListener('error', (e) => {
  const { code, message } = JSON.parse(e.data)
  showErrorToast(message)
})
```

**Notes:**
- SSE connection dibuka saat write dimulai
- Frontend append token ke Tiptap editor secara real-time
- Saat `done` diterima, refresh chapter status → COMPLETED
- Jika `checkpoint` diterima, stream暂停 sampai user merespons

---

### `POST /api/chapters/:id/checkpoint`

Response ke plot checkpoint (approve, reject, edit).

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "decision": "EDIT",
  "feedback": "Jangan bunuh karakter utama. Alih-alih, buat dia kehilangan ingatan."
}
```

`decision` values:
- `"APPROVE"` — Lanjutkan generasi sesuai rencana
- `"REJECT"` — AI replan outline
- `"EDIT"` — User edit outline + arahan → update outline sebelum lanjut

**Response (200):**
```json
{
  "status": "accepted",
  "updated_outline": "Outline yang diperbarui..."
}
```

**Business Rules:**
- Hanya bisa di-respons saat chapter WRITING + checkpoint pending
- `APPROVE`: lanjut tanpa perubahan
- `REJECT`: AI replan outline, lanjut generasi
- `EDIT`: update chapter outline dengan feedback user, lanjut generasi
- Decision menjadi bagian dari **Declared canon** untuk chapter ini
- Tidak ada timeout di v1 — user bisa respond kapan saja

---

## 5. Story Memory & Editing

### `POST /api/chapters/:id/sync-memory`

Story memory sync — re-summarize chapter, refresh derived canon, update snapshot, flag downstream stale.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "chapter_text": "Teks bab yang sudah di-edit manual..."
}
```

**Response (200):**
```json
{
  "status": "synced",
  "chapter_summary": "Raka menemukan pedang terkutuk di gua...",
  "stale_chapters_flagged": 5,
  "snapshot_updated": true
}
```

**Business Rules:**
- User-triggered, tidak otomatis saat manual edit
- Re-summary chapter dengan model Flash-lite
- Refresh derived canon (extract entities ke Mem0)
- Update chapter context snapshot (frozen state)
- Flag semua COMPLETED chapters downstream sebagai stale (reason: `UPSTREAM_TEXT_CHANGED`)

**Side Effects:**
1. Update `chapters.chapter_summary`
2. Upsert `chapter_summary_embeddings` (re-embed summary)
3. Update `chapter_context_snapshots`
4. Insert `stale_chapter_flags` untuk chapters downstream
5. Update Mem0 derived canon

---

### `POST /api/chapters/:id/partial-rewrite`

AI rewrite bagian teks yang dipilih user. Tidak mengubah sisa chapter.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "selected_text": "Raka mengangkat pedang itu dengan tangan gemetar.",
  "selection_start": 1250,
  "selection_end": 1320,
  "feedback": "Buat lebih dramatis dan tambahkan detail sensoris."
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "uuid-of-job",
  "stream_url": "/api/chapters/:id/stream"
}
```

**Business Rules:**
- Chapter harus COMPLETED (atau ada chapter_text)
- Tidak diblokir oleh chapters yang lebih baru (v1)
- Setelah selesai, otomatis jalankan **Story memory sync** (re-summary, refresh snapshot, flag stale)
- Streaming SSE ke frontend untuk partial replace in-place
- Model: Flash (Tier 2) — voice matching + instruction following

---

### `POST /api/chapters/:id/regenerate`

Full chapter regeneration — ganti seluruh chapter text dari outline + snapshot point-in-time.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "confirm": true
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "uuid-of-job",
  "stream_url": "/api/chapters/:id/stream",
  "status": "WRITING"
}
```

**Business Rules:**
- Chapter harus COMPLETED
- Diblokir jika chapter sedang WRITING
- Menggunakan **Chapter context snapshot** (point-in-time), bukan current metadata atau derived canon
- Menggunakan **current** chapter outline
- Mengganti seluruh chapter_text (no version history v1)
- Setelah selesai, otomatis jalankan Story memory sync
- Flag semua chapters downstream sebagai stale

**Errors:**
| Code | Reason |
|------|--------|
| 409 | Chapter sedang WRITING |
| 400 | Chapter bukan COMPLETED |

---

## 6. Plot Checkpoints

Plot checkpoint di-handle via SSE stream event (`checkpoint`) dan response endpoint (`POST /api/chapters/:id/checkpoint`). Tidak ada endpoint terpisah untuk enable/disable — itu di-handle di novel settings.

### Flow

```
1. User klik Tulis → POST /api/chapters/:id/write
2. Pipeline mulai → SSE stream terbuka
3. ScenePlanner detect irreversible beat → kirim event 'checkpoint' ke stream
4. Frontend tampilkan PlotCheckpointDialog (blocking, overlay gelap)
5. User pilih: Approve / Reject / Edit
6. POST /api/chapters/:id/checkpoint dengan decision
7. Pipeline lanjut → stream dilanjutkan
8. COMPLETED → SSE event 'done'
```

### `POST /api/chapters/:id/checkpoint` (Detail)

Lihat [§6 — Plot Checkpoints](#6-plot-checkpoints) di atas.

---

## 7. Stale Chapters

### `GET /api/novels/:id/stale`

Ambil daftar stale chapters untuk novel.

**Headers:** `Authorization: Bearer <supabase_access_token>`

**Response (200):**
```json
{
  "stale_count": 5,
  "chapters": [
    {
      "chapter_id": "uuid-of-chapter",
      "sequence_number": 13,
      "title": "Bab 13: Pengkhianatan",
      "caused_by": {
        "chapter_id": "uuid-of-chapter-12",
        "sequence_number": 12,
        "title": "Bab 12: Perubahan"
      },
      "reason": "UPSTREAM_TEXT_CHANGED",
      "dismissed_at": null
    }
  ]
}
```

---

### `POST /api/stale/:id/dismiss`

Dismiss stale flag.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "dismiss": true
}
```

**Response (200):**
```json
{
  "id": "uuid-of-stale-flag",
  "dismissed_at": "2026-01-15T00:00:00Z"
}
```

**Business Rules:**
- Dismiss → set `dismissed_at = now()`
- Re-flag: jika upstream chapter berubah lagi, flag muncul kembali (dismissed_at di-reset ke null)
- User melihat count undismissed stale di header novel

---

## 8. Account Management

### `DELETE /api/account`

Hapus akun secara permanen (hard delete).

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "confirm_email": "user@example.com"
}
```

**Response (204):** No content

**Business Rules:**
- User harus ketik **email persis** untuk konfirmasi
- Cascade hapus: semua novels, chapters, snapshots, embeddings, stale flags, generation jobs, profiles
- Tidak ada grace period di v1
- Re-register dengan email sama → akun baru kosong
- Frontend redirect ke `/login` setelah sukses

**Errors:**
| Code | Reason |
|------|--------|
| 400 | `confirm_email` tidak cocok |
| 401 | Tidak terautentikasi |

---

### `PATCH /api/account/profile`

Update display name.

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <supabase_access_token>`

**Request Body:**
```json
{
  "display_name": "Nama Baru"
}
```

**Response (200):**
```json
{
  "id": "uuid-of-user",
  "display_name": "Nama Baru"
}
```

---

## 9. SSE Protocol

### Connection Lifecycle

```
1. Client buka SSE connection ke GET /api/chapters/:id/stream
2. Server mulai LangGraph pipeline
3. Server kirim events: token, scene_start, progress
4. Jika plot checkpoint → kirim event 'checkpoint', pause stream
5. User respond → POST /api/chapters/:id/checkpoint
6. Server lanjut → kirim token events lagi
7. Selesai → kirim event 'done' → close connection
8. Jika error → kirim event 'error' → close connection
```

### Event Format

```
event: token
data: {"content":"Badai menghantam "}

event: token
data: {"content":"pesisir Tanjung "}

event: scene_start
data: {"scene":1,"total_scenes":4}

event: progress
data: {"scene":2,"percent":50}

event: checkpoint
data: {"checkpoint_id":"uuid","type":"irreversible_beat","description":"Karakter utama akan terluka parah","outline_excerpt":"..."}

event: done
data: {"chapter_id":"uuid","status":"COMPLETED","word_count":2150}

event: error
data: {"code":"GENERATION_FAILED","message":"LLM timeout after 120s"}
```

### Error Recovery

- Jika SSE connection putus di tengah generasi, chapter status tetap WRITING
- Client bisa reconnect ke `/api/chapters/:id/stream` untuk resume
- Jika generation gagal, chapter status → OUTLINED + error_message di-set
- Client poll status chapter untuk detect completion tanpa SSE

---

## 10. Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Synopsis harus minimal 20 karakter",
    "details": {
      "field": "synopsis",
      "min_length": 20,
      "actual_length": 15
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Tidak terautentikasi |
| `FORBIDDEN` | 403 | Bukan pemilik resource |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `CONFLICT` | 409 | State conflict (chapter sedang WRITING, duplicate request) |
| `RATE_LIMITED` | 429 | Max generation slots tercapai |
| `GENERATION_FAILED` | 500 | LLM pipeline error |
| `LLM_TIMEOUT` | 504 | LLM response timeout |
| `MEM0_ERROR` | 502 | Mem0 Cloud API error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Rate Limiting

- Tidak ada billing/quota di v1 (early access)
- **Operational guards** (bukan billing guards):
  - Max 1 QUEUED + 1 WRITING per User
  - Idempotency: tolak duplicate request saat WRITING/QUEUED
  - Novel archived → block semua generation

---

## 11. Business Rules & Validation

### Novel Creation Rules

| Field | Required | Min Length | Max Length | Notes |
|-------|----------|-----------|------------|-------|
| `title` | Ya | 1 | - | Unique per user (opsional) |
| `genre` | Ya | 1 | - | Preset atau "Other" + teks |
| `writing_language` | Ya | 2 | 5 | ISO 639-1 |
| `premise` | Ya | 10 | - | User-authored, AI never generate |
| `synopsis` | Ya | 20 | - | User-authored, AI never generate |
| `blurb` | Tidak | - | - | Generated on request |
| `writing_style_notes` | Tidak | - | - | Included in generation prompts |
| `word_count_default` | Tidak | - | - | Must be > 0 if set |
| `plot_checkpoints_enabled` | Tidak | - | - | Default: false |

### Chapter Rules

| Rule | Description |
|------|-------------|
| Sequential generation | Chapter N hanya bisa WRITING jika N−1 COMPLETED (atau N = 1) |
| No duplicate trigger | Tidak bisa trigger write saat WRITING/QUEUED |
| Max slots | 1 QUEUED + 1 WRITING per User |
| Outline required | OUTLINED status memerlukan outline non-empty |
| COMPLETED deletion | Hanya jika manuscript tail (tidak ada COMPLETED setelahnya) |
| Draft deletion | Bebas |
| Archive block | Archived novel → block semua generation |

### Stale Chapter Rules

| Trigger | Reason | Effect |
|---------|--------|--------|
| Synopsis edited | `SYNOPSIS_CHANGED` | Semua COMPLETED chapters stale |
| Premise edited | `PREMISE_CHANGED` | Semua COMPLETED chapters stale |
| Chapter text changed (manual edit + sync) | `UPSTREAM_TEXT_CHANGED` | Semua COMPLETED chapters setelahnya stale |
| Chapter summary changed (re-summary) | `UPSTREAM_SUMMARY_CHANGED` | Semua COMPLETED chapters setelahnya stale |
| Profile/canon changed | `METADATA_CHANGED` | (opsional, v1 belum tentu implement) |

### Outline Drift Rules

| Situation | Status |
|-----------|--------|
| COMPLETED chapter outline diedit | **Outline drift** (alert, bukan stale) |
| Outline drift + chapter text belum berubah | Alert tampil di editor |
| Resolve: full chapter regeneration | Outline drift hilang, stale downstream di-flag |
| Resolve: revert outline ke hash asli | Outline drift hilang |

### Deletion Rules

| Entity | Rules |
|--------|-------|
| **DRAFT/OUTLINED chapter** | Hapus bebas |
| **COMPLETED chapter (tail)** | Hapus + cascade (summary, snapshot, embeddings, stale flags, jobs) |
| **COMPLETED chapter (bukan tail)** | **Tidak bisa hapus** — harus edit atau regenerate |
| **Novel** | Hard delete + cascade semua. Konfirmasi ketik judul |
| **Account** | Hard delete + cascade semua. Konfirmasi ketik email |

---

## 12. Module Mapping

Mapping endpoint ke module backend (dari PRD):

| Endpoint | Module | Responsibility |
|----------|--------|----------------|
| `POST /api/novels` | `NovelRepository` | CRUD, create novel |
| `PATCH /api/novels/:id` | `NovelRepository` | Update metadata |
| `DELETE /api/novels/:id` | `NovelRepository` | Hard delete cascade |
| `GET /api/novels` | `NovelRepository` | List user's novels |
| `GET /api/novels/:id` | `NovelRepository` | Get novel with profiles + chapters |
| `PATCH /api/novels/:id/archive` | `NovelRepository` | Archive/restore |
| `PATCH /api/novels/:id/complete` | `NovelRepository` | Mark/unmark complete |
| `POST /api/novels/:id/chapters` | `ChapterRepository` | Add chapter slot |
| `GET /api/novels/:id/chapters` | `ChapterRepository` | List chapters (sidebar) |
| `GET /api/chapters/:id` | `ChapterRepository` | Get chapter detail |
| `PATCH /api/chapters/:id` | `ChapterRepository` + `ChapterLifecycle` | Update + status transition |
| `DELETE /api/chapters/:id` | `ChapterRepository` + `ChapterLifecycle` | Delete + guard rules |
| `POST /api/chapters/:id/write` | `ChapterLifecycle` + `GenerationSlotGuard` + `ChapterGraph` | Trigger generation |
| `GET /api/chapters/:id/stream` | `StreamPublisher` | SSE streaming |
| `POST /api/chapters/:id/checkpoint` | `PlotCheckpointHandler` | Handle checkpoint decision |
| `POST /api/chapters/:id/sync-memory` | `StoryMemorySync` | Re-summarize + refresh |
| `POST /api/chapters/:id/partial-rewrite` | `PartialRewriteService` | Selection + feedback rewrite |
| `POST /api/chapters/:id/regenerate` | `FullRegenService` | Point-in-time regen |
| `POST /api/novels/:id/blurb` | `BlurbGenerator` | Generate marketing copy |
| `POST /api/stale/:id/dismiss` | `StaleChapterTracker` | Dismiss stale flag |
| `DELETE /api/account` | `AccountService` | Cascade delete + auth cleanup |
| `PATCH /api/account/profile` | `AccountService` | Update display name |

### Data Flow

```
User Click "Tulis"
       │
       ▼
POST /api/chapters/:id/write
       │
       ├──▶ GenerationSlotGuard.acquireSlot(userId)
       │       └── Cek: max 1 QUEUED + 1 WRITING
       │
       ├──▶ ChapterLifecycle.transition(chapterId, 'WRITE')
       │       └── Validasi: OUTLINED, N−1 COMPLETED, not archived
       │
       ├──▶ ContextAssembler.assembleForChapter(novelId, chapterNumber)
       │       ├── NovelRepository.getNovelContext()
       │       ├── SummaryRetriever.retrieve() [recent 20 + top 10]
       │       ├── Mem0Client.getState()
       │       └── CanonResolver.resolveForForwardGen()
       │
       ├──▶ ChapterGraph.run(chapterId, streamSink)
       │       ├── ScenePlanner.plan(outline, context)
       │       ├── Ghostwriter.writeScene() × 3-4 scenes
       │       │       └── SSE streaming ke browser
       │       ├── PlotCheckpointHandler (jika perlu)
       │       └── Summarizer.summarize(chapterText, outline)
       │
       └──▶ Finalization
               ├── Simpan chapter_text → chapters
               ├── Simpan chapter_summary → chapters
               ├── Embed summary → chapter_summary_embeddings
               ├── Extract → Mem0 (derived canon)
               ├── Write → chapter_context_snapshots
               └── ChapterLifecycle.transition(chapterId, 'COMPLETED')
```

---

## Appendix: A. Genre Presets

Preset genre v1 (UI dropdown):

| Preset | Value |
|--------|-------|
| Fantasy | `"Fantasy"` |
| Science Fiction | `"Science Fiction"` |
| Romance | `"Romance"` |
| Thriller | `"Thriller"` |
| Horror | `"Horror"` |
| Mystery | `"Mystery"` |
| Literary Fiction | `"Literary Fiction"` |
| Historical Fiction | `"Historical Fiction"` |
| Lainnya | Custom text (input bebas) |

---

## Appendix: B. Writing Language Codes

| Language | Code |
|----------|------|
| Indonesia | `id` |
| English | `en` |
| Melayu | `ms` |
| 日本語 | `ja` |
| 한국어 | `ko` |
| 中文 | `zh` |
| Español | `es` |
| Português | `pt` |
| Français | `fr` |
| Deutsch | `de` |

> UI v1: Bahasa Indonesia. **Writing language** = bahasa output AI untuk chapter text, summary, blurb. Terpisah dari bahasa UI.

---

## Appendix: C. Chapter Status Reference

```
                    ┌──────────┐
                    │  DRAFT   │ ← Slot ada, outline kosong
                    └────┬─────┘
                         │ (outline saved)
                         ▼
                    ┌──────────┐
               ┌───▶│ OUTLINED │ ← Outline ada, siap generate
               │    └────┬─────┘
               │         │ (write clicked)
               │    ┌────┴─────┐
               │    │          │
               │    ▼          ▼
               │ ┌────────┐ ┌────────┐
               │ │QUEUED  │ │WRITING │
               │ └───┬────┘ └───┬────┘
               │     │          │
               │     │    ┌─────┴──────┐
               │     │    │            │
               │     ▼    ▼            ▼
               │  ┌────────┐    ┌──────────┐
               └──│OUTLINED│    │COMPLETED │
                  │(failed)│    └──────────┘
                  └────────┘
```

---

## Appendix: D. Stale Reason Reference

| Reason | Trigger | Scope |
|--------|---------|-------|
| `UPSTREAM_TEXT_CHANGED` | Chapter text berubah + sync | Chapters setelahnya |
| `UPSTREAM_SUMMARY_CHANGED` | Chapter summary berubah | Chapters setelahnya |
| `SYNOPSIS_CHANGED` | Synopsis novel diedit | Semua COMPLETED |
| `PREMISE_CHANGED` | Premise novel diedit | Semua COMPLETED |
| `METADATA_CHANGED` | Profile/canon berubah | (v1: opsional) |
