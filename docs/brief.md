------------------------------
## 📝 Brief ## Project: AI-Powered Agentic Novel Ghostwriter SaaS
------------------------------

> **Catatan:** Keputusan domain terkini ada di [`CONTEXT.md`](../CONTEXT.md). Keputusan arsitektur di [`docs/adr/`](adr/).

## 1. Executive Summary & Product Vision

Aplikasi ini adalah platform SaaS bagi penulis novel (amatir maupun profesional) untuk berkolaborasi dengan AI Agent dalam menulis novel panjang secara terstruktur dan konsisten. Berbeda dengan AI generator biasa yang sering mengalami plot hole atau lupa detail cerita, aplikasi ini menggunakan pendekatan Multi-Agent System dan Dynamic Context Management untuk menjaga konsistensi lore, perkembangan karakter, dan alur plot cerita hingga ratusan bab secara incremental (mencicil bab per bab).

**v1 (early access):** open signup, tanpa billing/kuota token, tanpa export PDF/EPUB.

------------------------------
## 2. User Input & Output Requirements

### A. Input Wajib (User-authored)

* **Judul novel**
* **Genre** — pilih dari preset (Fantasy, Science Fiction, Romance, Thriller, Horror, Mystery, Literary Fiction, Historical Fiction) atau **Other** + teks bebas
* **Bahasa tulis** (*Writing language*): bahasa output AI untuk teks bab, ringkasan bab, dan blurb
* **Premis** (*Premise*): hook / setup cerita — konflik inti dan ide utama — **selalu ditulis user; AI tidak pernah generate atau edit**
* **Sinopsis** (*Synopsis*): gambaran umum plot dari awal hingga akhir — **selalu ditulis user; AI tidak pernah generate atau edit**
* **Daftar bab** (incremental):
  * Judul per bab
  * Outline per bab (bisa dicicil sesuai pace penulis)

### B. Input Opsional (User-authored)

* **Profil karakter** (nama + deskripsi: penampilan, kepribadian, rahasia, relasi) — opsional, incremental; tidak wajib sebelum Bab 1
* **Profil lokasi** (nama + deskripsi worldbuilding) — opsional, incremental
* **Target word count per bab** — opsional (default per novel atau override per bab); soft guide ±20%
* **Writing style notes** — opsional per novel (tone, POV, hal yang dihindari); user-authored; masuk prompt generate, bukan RAG

Tidak ada AI auto-draft untuk input opsional di v1.

### C. Output Aplikasi

* **Teks bab** (*Chapter text*): naratif lengkap per bab, di-generate AI dalam *Writing language*
* **Blurb**: copy pemasaran pendek (~100–150 kata); on-demand setelah minimal satu bab selesai; bisa diedit manual

Export PDF/EPUB: **out of scope v1**.

User dapat menandai novel sebagai **selesai** (*Completed novel*) kapan saja — label reversible, tidak memblokir bab baru atau edit. Bisa memicu saran generate blurb jika belum ada.

------------------------------
## 3. Tech Stack & Architecture (v1)

Monolith **TypeScript**: satu codebase Next.js untuk UI, API, dan orkestrasi AI. Backend terpisah (Go/Python/VPS) **tidak dipakai**.

### 3.1 Topology

```
[ User Browser ]
       │
       ▼
[ Vercel — Next.js (Node.js runtime, bukan Edge) ]
  ├── UI (App Router, Rich Text Editor)
  ├── API Routes / Route Handlers (CRUD, auth, LangGraph, SSE streaming)
  └── LangGraph.js — jalan di sini (Node), bukan di Supabase Edge Function
        ├── OpenRouter SDK (Gemini Flash / Flash-lite per ADR-0002)
        └── SSE streaming → browser
       │
       ▼
[ Supabase (Cloud) ]
  ├── Auth (email + password; display name di user_metadata)
  ├── PostgreSQL + RLS (novel, bab, snapshot, ringkasan)
  ├── pgvector (RAG ringkasan bab lama)
  ├── LangGraph checkpointer (Postgres)
  ├── Queues / pgmq (overload saat Vercel penuh — lihat §3.3)
  ├── Edge Functions (tugas pendek saja — lihat §3.3)
  └── Storage (deferred v1)
       │
       ▼
[ Mem0 Cloud ] — derived canon / entity memory
```

| Komponen | Teknologi | Peran |
|---|---|---|
| Frontend + API | Next.js (Node runtime) | UI, CRUD, trigger, streaming |
| Agent framework | LangGraph.js (TypeScript) | Planner → Ghostwriter → Summarizer |
| LLM | OpenRouter TS SDK | Model per tier (lihat ADR-0002) |
| Auth | Supabase Auth | Email/password, open signup v1 |
| Database | Supabase PostgreSQL | Data transaksional + graph state |
| Vector / RAG | Supabase pgvector | *Retrieved chapter summaries* |
| Entity memory | Mem0 Cloud | *Derived canon* (fakta dari teks bab) |
| Queue overflow | Supabase Queues (pgmq) | Antrian saat kapasitas generate penuh (§3.3) |
| Edge Functions | Supabase Edge Functions | Hook/cron pendek; **bukan** LangGraph (§3.3) |
| Hosting app | **Vercel** (Pro, Node runtime) | Next.js + LangGraph API routes |
| Object storage | Supabase Storage | Deferred (no export v1) |

**Tidak dipakai:** Go Fiber, FastAPI, Nginx, Docker Compose single VPS, Neon, Inngest, Qdrant lokal, Mem0 OS lokal, Cloudflare R2, OAuth/goth.

Lihat [ADR-0004](adr/0004-typescript-monolith-supabase.md).

### 3.2 Deployment (Vercel)
   
* **LangGraph jalan di Node.js** — Route Handler Next.js dengan `runtime = 'nodejs'` dan `maxDuration` cukup (Vercel Pro)
* **Jangan** pakai Edge runtime untuk route generate/streaming
* Chapter generation: 1–3 menit, SSE streaming, NFR time-to-first-token ≤ 5 detik

### 3.3 Siapa ngapain: Node vs Queue vs Edge Function

| Lapisan | Jalan di mana | Buat apa |
|---|---|---|
| **Node API route (Vercel)** | `app/api/.../write/route.ts` | **Happy path:** klik Tulis → LangGraph → stream SSE langsung ke browser |
| **Supabase Queue (pgmq)** | Postgres | **Overload:** semua slot generate penuh → bab masuk status `QUEUED`, user lihat posisi antrian → `WRITING` saat worker pickup. Retry job gagal; gagal → kembali `OUTLINED`. **Bukan** tiap request lewat sini. |
| **Supabase Edge Function** | Deno, max ~150–400s | **Tugas pendek:** drain queue (poll + invoke worker), webhook, cron ringan, post-process setelah bab selesai (embed pgvector). **Bukan** pipeline LangGraph 3 menit. |

Alur normal: **Vercel Node saja.** Queue + Edge Function cuma backup kalau traffic spike melebihi concurrent limit Vercel.

------------------------------
## 4. Database & Memory Strategy

Lapisan penyimpanan (semua di Supabase kecuali Mem0 Cloud):

1. **novel_metadata** — judul, genre, *writing language*, premis, sinopsis, blurb, profil karakter & lokasi (opsional)
2. **chapters** — judul, outline, *chapter text*, status (`DRAFT` | `OUTLINED` | `QUEUED` | `WRITING` | `COMPLETED`), *chapter summary*
3. **chapter_context_snapshots** — state karakter/dunia saat bab ditulis/difinalisasi (untuk regenerate point-in-time)
4. **pgvector** — embedding *chapter summary* untuk *retrieved chapter summaries* (RAG bab lama)
5. **Mem0 Cloud** — *derived canon*: ekstraksi fakta/entitas otomatis dari teks bab (misal: John kehilangan pedang di Bab 25)

### Prioritas canon (lihat CONTEXT.md)

* **Declared canon** (metadata user) > **Derived canon** (Mem0) saat konflik, untuk generate bab baru
* Regenerate bab lama: pakai **snapshot** bab itu saja

### Context gathering untuk Bab N (ADR-0003)

* Premis, sinopsis, outline, profil, Mem0, **prior chapter text** (seluruh teks Bab N−1)
* **Recent chapter summaries**: 20 ringkasan bab terakhir (selalu lengkap)
* **Retrieved chapter summaries**: top **10** ringkasan bab lebih tua yang relevan dengan outline (pgvector)
* **Bukan** dump semua ringkasan Bab 1..N−1

------------------------------
## 5. Core AI Generation Strategy (4-Phase Pipeline)

[User klik: Tulis Bab 128]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ TRIGGER: Next.js API Route                             │
│ (Status bab → WRITING; idempotency guard aktif)      │
└─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ FASE 1: CONTEXT GATHERING (MAKRO)                      │
│ - Sinopsis, profil, outline Bab 128                    │
│ - Derived canon (Mem0 Cloud)                           │
│ - Prior chapter text (seluruh Bab 127)                 │
│ - Recent 20 chapter summaries + retrieved (pgvector)   │
└─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ FASE 2: SCENE-BY-SCENE PLANNING (internal)             │
│ - Planner → 3–4 scene beats + word targets             │
│ - Scene plan tidak ditampilkan ke user di v1           │
└─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ FASE 3: INCREMENTAL GENERATION & ROLLING CONTEXT       │
│ - Scene 1: makro + seluruh teks Bab 127                │
│ - Scene 2–4: makro + teks scene sebelumnya             │
│ - Streaming SSE → Next.js UI                           │
└─────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ FASE 4: AUTO-SUMMARY & FINALIZATION                    │
│ - Simpan chapter text → Supabase                       │
│ - Chapter summary (3–5 poin)                           │
│ - Embed summary → pgvector                             │
│ - Update derived canon → Mem0 Cloud                    │
└────────────────────────────────────────────────────────┘

### Model routing (ADR-0002)

| Tier | Use case | Model |
|---|---|---|
| Heavy | Ghostwriter, full regen, partial rewrite, planning, Mem0 extract | `gemini-2.5-flash` |
| Light | Chapter summary, blurb | `gemini-2.5-flash-lite` |

------------------------------
## 6. Advanced Features & Safeguards

1. **Partial rewrite** — user pilih teks + feedback; AI rewrite bagian itu saja
2. **Full chapter regeneration** — ulang seluruh bab dari outline + snapshot
3. **Manual edit + Story memory sync** — edit manual auto-save; sync memori AI via aksi eksplisit user
4. **Plot checkpoint** (opt-in per novel) — AI pause untuk approve/reject/edit beat irreversible
5. **Stale chapters** — peringatan inkonsistensi setelah edit upstream; bisa di-dismiss; bukan blocker
6. **Outline drift** — outline bab COMPLETED diubah tapi teks belum; selesaikan via full regen
7. **Idempotency guard** — tolak duplicate request saat bab `WRITING`; queue overflow via Supabase Queues saat replica penuh

------------------------------
## 7. Non-Functional Requirements

* **Performance:** teks mulai stream ≤ 5 detik setelah "Tulis"; job penuh 1–3 menit
* **Scale:** replika Next.js horizontal; Supabase managed scale untuk DB/vector
* **Token efficiency:** chapter summary + pgvector RAG + Mem0; bukan dump teks mentah semua bab lama
* **Auth v1:** Supabase email/password; tanpa verifikasi email & reset password di v1
* **Account deletion:** hard delete dengan konfirmasi ketik email; cascade semua novel & data; tanpa grace period
* **Billing v1:** tidak ada — early access unlimited
* **UI v1:** Bahasa Indonesia; string key-based agar i18n (English, dll.) mudah ditambah nanti. Terpisah dari *Writing language* novel.

------------------------------
