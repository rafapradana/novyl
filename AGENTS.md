# Novyl — Agent Context

SaaS AI novel ghostwriter. **User** menulis **Novel** bab per bab dengan AI Agents yang menjaga konsistensi lore/plot pada manuskrip panjang. v1 = **early access**: open signup, tanpa billing/export, UI Bahasa Indonesia.

**Status repo:** dokumentasi lengkap; Next.js 16 scaffold ada (`app/`); Supabase & fitur domain belum diimplementasi.

---

## Baca ini dulu

| Prioritas | File | Kapan |
|-----------|------|-------|
| 1 | [`CONTEXT.md`](./CONTEXT.md) | Istilah domain, lifecycle Chapter, aturan bisnis — **wajib** sebelum kode fitur |
| 2 | [`docs/brief.md`](./docs/brief.md) | Stack, pipeline AI 4 fase, memory strategy |
| 3 | [`docs/prd-v1.md`](./docs/prd-v1.md) | User stories, modul backend, API contracts |
| 4 | [`docs/ui/README.md`](./docs/ui/README.md) | Halaman, modal CRUD, shadcn/ui |

**ADR** = keputusan arsitektur yang mengikat implementasi. Jangan melanggar tanpa ADR baru.

---

## Ringkasan teknis (v1)

| Lapisan | Pilihan |
|---------|---------|
| App | Next.js App Router monolith (TypeScript), Vercel Pro, **Node runtime** (bukan Edge) |
| AI | LangGraph.js di API routes, OpenRouter (Gemini Flash / Flash-lite) |
| Data | Supabase: Postgres + RLS, Auth, pgvector, checkpointer, pgmq |
| Entity memory | Mem0 Cloud (**Derived canon**) — bukan pengganti pgvector summary RAG |
| UI | shadcn/ui + blocks; CRUD berbasis **modal**; Tiptap untuk Chapter text |

**Jangan pakai:** Go/Python microservices, Qdrant lokal, Inngest, OAuth v1, export PDF/EPUB v1.

**Generasi Chapter:** sequential (N−1 harus `COMPLETED`); status `DRAFT` → `OUTLINED` → `QUEUED` → `WRITING` → `COMPLETED`.

**Core context Novel (user-authored, AI tidak generate):** Premise, Synopsis, Chapter outline, profiles opsional.

---

## Konvensi untuk agent

- Pakai vocabulary **CONTEXT.md** (mis. **Chapter text**, bukan "isi bab"; **User**, bukan "author" untuk akun).
- **Declared canon** > **Derived canon** saat generate bab baru; regenerate bab lama pakai **Chapter context snapshot** saja.
- Context gathering: prior chapter full text + recent 20 summaries + top 10 retrieved (pgvector) — bukan dump semua ringkasan.
- UI copy v1: Indonesia; pisahkan dari **Writing language** novel.
- Minimize diff; ikuti pola yang sudah ada; jangan over-engineer.

### Next.js

<!-- BEGIN:nextjs-agent-rules -->
**This is NOT the Next.js you know.** Versi di repo ini (Next.js 16) punya breaking changes — API, konvensi, dan struktur file bisa beda dari training data. Sebelum menulis kode Next.js, baca guide relevan di `node_modules/next/dist/docs/`. Perhatikan deprecation notices.
<!-- END:nextjs-agent-rules -->

- Route handlers generate/streaming: **`runtime = 'nodejs'`** (bukan Edge) — lihat ADR-0004.
- Jangan mengandalkan pola App Router / caching dari Next.js 13–14 tanpa cek docs versi terpasang.

---

## Dokumentasi (table of contents)

### Domain & produk

| Dokumen | Isi |
|---------|-----|
| [`CONTEXT.md`](./CONTEXT.md) | Glosarium, relasi entitas, lifecycle, example dialogues |
| [`docs/brief.md`](./docs/brief.md) | Executive summary, input/output, stack, pipeline, NFR |
| [`docs/prd-v1.md`](./docs/prd-v1.md) | PRD lengkap: stories, modul, testing, out of scope |
| [`docs/db-schema.md`](./docs/db-schema.md) | Schema Supabase: tabel, RLS, indeks, migrasi |
| [`docs/api.md`](./docs/api.md) | API contracts: endpoint, request/response, SSE, error codes |
| [`docs/slices.md`](./docs/slices.md) | Vertical slices: dependency, scope, acceptance criteria |

### Arsitektur (ADR)

| ADR | Keputusan |
|-----|-----------|
| [`docs/adr/0001-dual-token-jwt-auth.md`](./docs/adr/0001-dual-token-jwt-auth.md) | Email/password — **sebagian superseded** oleh Supabase Auth (ADR-0004) |
| [`docs/adr/0002-llm-model-tiers-by-use-case.md`](./docs/adr/0002-llm-model-tiers-by-use-case.md) | Model per use case, context window, biaya |
| [`docs/adr/0003-chapter-summary-retrieval.md`](./docs/adr/0003-chapter-summary-retrieval.md) | Recent 20 + top 10 retrieved summaries |
| [`docs/adr/0004-typescript-monolith-supabase.md`](./docs/adr/0004-typescript-monolith-supabase.md) | Stack v1: Next.js + Supabase + Mem0 Cloud |

### UI

| Dokumen | Isi |
|---------|-----|
| [`docs/ui/README.md`](./docs/ui/README.md) | Prinsip, route, core context form |
| [`docs/ui/pages.md`](./docs/ui/pages.md) | `/login`, `/novels`, `/novels/[id]` |
| [`docs/ui/modals.md`](./docs/ui/modals.md) | Semua Dialog / AlertDialog |
| [`docs/ui/flows.md`](./docs/ui/flows.md) | Alur user + diagram |
| [`docs/ui/components.md`](./docs/ui/components.md) | Struktur komponen, shadcn setup |

---

## Navigasi codebase

### Saat ini

```
novyl/
├── AGENTS.md
├── CONTEXT.md
├── app/                 # Next.js App Router (scaffold)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── docs/                # brief, prd, adr/, ui/
├── package.json         # next@16, react@19
└── ...
```

Belum ada: `components/`, `lib/`, `app/api/`, `supabase/`, tests.

### Target (struktur app)

```
app/
├── (auth)/login/               # sign-in / sign-up
├── (app)/
│   ├── layout.tsx              # App shell + sidebar
│   └── novels/
│       ├── page.tsx            # library
│       └── [novelId]/page.tsx
└── api/                        # CRUD, write, stream SSE, sync

components/
├── ui/                         # shadcn CLI — jangan fork sembarangan
├── layout/                     # shell, chapter sidebar, user nav
├── novels/                     # cards, create/settings dialogs
├── chapters/                   # editor, modals bab
└── account/

lib/
├── supabase/                   # client, server, middleware
├── validations/                # zod schemas
└── ...                         # services (lifecycle, context, RAG, dll.)
    # + lib/agents/ atau server/ untuk LangGraph graphs, LLM router

supabase/migrations/            # schema, RLS, pgvector
```

**Modul backend utama** (dari PRD): `ChapterLifecycle`, `ContextAssembler`, `SummaryRetriever`, `CanonResolver`, `ChapterGraph` (LangGraph), `StoryMemorySync`, `StaleChapterTracker`, `GenerationSlotGuard`, `Mem0Client`, `LlmRouter`.

**API surface (high level):** `POST /api/novels`, `PATCH /api/novels/:id`, `POST /api/chapters/:id/write` (+ SSE), `POST .../sync-memory`, `.../partial-rewrite`, `.../regenerate` — detail di [`docs/prd-v1.md`](./docs/prd-v1.md).

---

## Out of scope v1 (jangan implement tanpa diminta)

Billing/token quotas · export PDF/EPUB · OAuth · email verify / password reset · AI-generated Premise/Synopsis/profiles · user-facing scene plans · version history Chapter text · LangGraph di Edge Functions.
