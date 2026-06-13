# Implementation Slices — Novyl v1

> **Status:** S1, S2, S3 selesai; slice lainnya belum diimplementasi. Dokumen ini memecah PRD menjadi vertical slices (tracer bullet) yang bisa di-grab secara independen.
>
> **Referensi:** [`docs/prd-v1.md`](./prd-v1.md), [`CONTEXT.md`](../CONTEXT.md), [`docs/db-schema.md`](./db-schema.md), [`docs/api.md`](./api.md)

---

## Daftar Isi

1. [Prinsip](#prinsip)
2. [Dependency Graph](#dependency-graph)
3. [Slices](#slices)
   - [S1 — Supabase project + environment setup](#s1--supabase-project--environment-setup)
   - [S2 — Database schema + RLS](#s2--database-schema--rls)
   - [S3 — Auth: signup, login, logout + middleware](#s3--auth-signup-login-logout--middleware)
   - [S4 — Novel create + library view](#s4--novel-create--library-view)
   - [S5 — Novel settings + profiles CRUD](#s5--novel-settings--profiles-crud)
   - [S6 — Chapter CRUD + sidebar](#s6--chapter-crud--sidebar)
   - [S7 — Tiptap editor integration](#s7--tiptap-editor-integration)
   - [S8 — LLM infrastructure](#s8--llm-infrastructure)
   - [S9 — Chapter generation — happy path](#s9--chapter-generation--happy-path)
   - [S10 — Generation slot guard + QUEUED state](#s10--generation-slot-guard--queued-state)
   - [S11 — Stale chapter tracking](#s11--stale-chapter-tracking)
   - [S12 — Story memory sync](#s12--story-memory-sync)
   - [S13 — Partial rewrite](#s13--partial-rewrite)
   - [S14 — Full chapter regeneration](#s14--full-chapter-regeneration)
   - [S15 — Plot checkpoints](#s15--plot-checkpoints)
   - [S16 — Blurb generation](#s16--blurb-generation)
   - [S17 — Account deletion](#s17--account-deletion)
4. [User Story Coverage](#user-story-coverage)

---

## Prinsip

| Prinsip | Keterangan |
|---------|-----------|
| **Vertical slice** | Setiap slice memotong semua lapisan: schema → API → UI → test |
| **Tracer bullet** | Setiap slice yang selesai bisa di-demo / di-verifikasi sendiri |
| **HITL vs AFK** | HITL = butuh keputusan / setup manual manusia. AFK = bisa di-grab agent tanpa interaksi |
| **Banyak slice tipis** | Lebih baik banyak slice kecil daripada sedikit slice tebal |

---

## Dependency Graph

```
S1 (Supabase setup)
 └─▶ S2 (DB schema)
      └─▶ S3 (Auth) ──────────────────────────────────▶ S17 (Account deletion)
           └─▶ S4 (Novel CRUD)
                ├─▶ S5 (Novel settings + profiles)
                └─▶ S6 (Chapter CRUD) ─▶ S7 (Tiptap)
                                         └─▶ S9 (Generation happy path) ◀── S8 (LLM infra)
                                              ├─▶ S10 (Queue + idempotency)
                                              ├─▶ S11 (Stale tracking)
                                              │    └─▶ S12 (Story memory sync)
                                              │         ├─▶ S13 (Partial rewrite)
                                              │         └─▶ S14 (Full regen)
                                              ├─▶ S15 (Plot checkpoints)
                                              └─▶ S16 (Blurb)
```

---

## Slices

### S1 — Supabase project + environment setup

| | |
|---|---|
| **Type** | HITL |
| **Blocked by** | None |
| **User stories** | — (infrastructure) |

#### What to build

Create Supabase project (manual), install client libraries, configure environment variables, and set up the Supabase client/server/middleware helpers that every subsequent slice depends on.

#### Scope

- Create Supabase Cloud project (manual — HITL)
- Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`
- Install dependencies: `@supabase/ssr`, `@supabase/supabase-js`
- Create Supabase client helpers: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server), `lib/supabase/middleware.ts` (auth redirect logic)
- Supabase CLI init (`supabase init`) + link to project (HITL)
- Next.js 16 proxy (`proxy.ts`) for auth session refresh and redirect

#### Acceptance criteria

- [x] Supabase project exists with correct env vars in `.env.local`
- [x] `@supabase/ssr` and `@supabase/supabase-js` installed
- [x] `lib/supabase/client.ts`, `server.ts`, `middleware.ts` created and working
- [ ] Supabase CLI linked to project (HITL — requires human to create Supabase project)
- [x] Next.js proxy (`proxy.ts`) redirects unauthenticated users to `/login`
- [x] `npm run build` passes

> **Catatan:** Supabase CLI link dan `.env.local` dengan nilai nyata memerlukan aksi manual (HITL). File `.env.local.example` tersedia sebagai template.

---

### S2 — Database schema + RLS

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S1 |
| **User stories** | — (infrastructure) |

#### What to build

All database objects for v1: extensions, enum types, 9 tables, RLS policies, helper functions, triggers, and indexes. After this slice, the database is complete — no further schema changes needed for v1 features.

#### Scope

- 12 migration files per `docs/db-schema.md` §8:
  - Extensions: `vector`, `pg_trgm`
  - Enums: `chapter_status`, `job_status`, `stale_reason`, `checkpoint_decision`, `generation_type`
  - Tables: `profiles`, `novels`, `character_profiles`, `location_profiles`, `chapters`, `chapter_context_snapshots`, `chapter_summary_embeddings`, `stale_chapter_flags`, `generation_jobs`
  - RLS: every table, 4 policies each (SELECT, INSERT, UPDATE, DELETE)
  - Functions: `user_owns_novel()`, `user_novel_ids()`, `set_updated_at()`, `handle_new_user()`, `delete_user_account()`, `compute_outline_hash()`, `flag_downstream_chapters()`, `validate_chapter_transition()`
  - Triggers: `set_updated_at` on all tables, `on_auth_user_created`, `compute_outline_hash`, `validate_chapter_transition`
  - Indexes: all per `docs/db-schema.md` §5

#### Acceptance criteria

- [x] `supabase db reset` passes locally with all migrations
- [x] All 9 tables created with correct columns, constraints, and types
- [x] RLS enabled on every table; helper functions work
- [x] Triggers fire correctly: `updated_at`, `handle_new_user`, `compute_outline_hash`, `flag_downstream_chapters`
- [x] HNSW index on `chapter_summary_embeddings` created
- [x] `npm run build` passes

---

### S3 — Auth: signup, login, logout + middleware

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S2 |
| **User stories** | 1, 2, 3 |

#### What to build

End-to-end auth flow: User can sign up with display name + email + password, sign in, and see the app shell. No email verification, no forgot password (v1).

#### Scope

- `/login` page: shadcn `login-03` block with tab **Masuk** | **Daftar**
  - Sign-up fields: Display name, Email, Password
  - Sign-in fields: Email, Password
  - On submit: Supabase Auth → redirect `/novels`
- Auth middleware: redirect unauthenticated → `/login`, redirect `/` → `/novels` or `/login`
- App shell layout (`(app)/layout.tsx`): shadcn `sidebar-07` block
  - Header: Logo Novyl + Avatar menu (placeholder)
  - Sidebar: nav items (placeholder — Novel saya, Arsip)
- UI copy: Bahasa Indonesia
- No custom API routes — Supabase Auth handles signup/signin/signout directly via client library

#### Acceptance criteria

- [x] User can sign up with display name, email, password
- [x] User can sign in with email + password
- [x] User can sign out (redirect to `/login`)
- [x] Unauthenticated users redirected to `/login`
- [x] `/` redirects to `/novels` when authenticated
- [x] App shell layout renders (sidebar + header)
- [x] No email verification or forgot password flow
- [x] `npm run build` passes

---

### S4 — Novel create + library view

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S3 |
| **User stories** | 7, 8, 9, 22 |

#### What to build

User can create a Novel with required fields and see their library as a grid of cards. The `/novels` page becomes the first real interactive page.

#### Scope

- `POST /api/novels` route handler + zod validation
  - Required: title, genre, writing_language, premise, synopsis
  - Optional: word_count_default, writing_style_notes, plot_checkpoints_enabled
- `GET /api/novels` route — user's novels with chapter_count, stale_count
- `/novels` page: grid of `Card` components, tabs **Aktif** | **Arsip**
- "Novel baru" `Dialog`:
  - Fields: Novel title (`Input`), Genre (`Select` preset + **Lainnya** → `Input`), Writing language (`Select`), Premise (`Textarea`), Synopsis (`Textarea`)
  - Genre presets: Fantasy, Science Fiction, Romance, Thriller, Horror, Mystery, Literary Fiction, Historical Fiction, Lainnya
  - Helper text (ID) for Premise & Synopsis
- Empty state: illustration + text + CTA "Buat novel pertama"
- Each card: title (link to workspace), genre subtitle, badges (Completed, Archived), meta (chapter count, stale count)

#### Acceptance criteria

- [ ] User can create a Novel with all required fields
- [ ] Genre select shows presets + "Lainnya" with free text input
- [ ] Novel appears in library grid after creation
- [ ] Library shows Aktif/ Arsip tabs
- [ ] Card shows title, genre, chapter count
- [ ] Empty state shows CTA when no novels exist
- [ ] Validation errors shown inline (premise ≥ 10 chars, synopsis ≥ 20 chars)
- [ ] `npm run build` passes

---

### S5 — Novel settings + profiles CRUD

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S4 |
| **User stories** | 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 23 |

#### What to build

Full Novel management: edit metadata, manage character/location profiles, archive/restore, mark complete, hard delete with title confirmation. Novel settings as a tabbed Dialog.

#### Scope

- `GET /api/novels/:id` — novel detail with profiles + chapters
- `PATCH /api/novels/:id` — metadata update (with stale warning for premise/synopsis changes)
- `PATCH /api/novels/:id/archive` — archive/restore
- `PATCH /api/novels/:id/complete` — mark/unmark complete (suggest blurb if none)
- `DELETE /api/novels/:id` — hard delete with `confirm_title` body
- Novel settings `Dialog` with `Tabs`:
  - **Umum:** Premise, Synopsis, default word count
  - **Gaya:** Writing style notes
  - **Karakter:** List + CRUD nested dialogs (name + description)
  - **Lokasi:** List + CRUD nested dialogs (name + description)
  - **Lanjutan:** Plot checkpoints toggle, Writing language
- Character/Location profile CRUD routes: `POST`, `PATCH`, `DELETE` under `/api/novels/:id/characters` and `/api/novels/:id/locations`
- AlertDialogs: archive, restore, mark complete, hard delete (type title to confirm)
- Premise/Synopsis edit: AlertDialog warning if COMPLETED chapters exist → flag stale on save

#### Acceptance criteria

- [ ] Novel settings Dialog opens with all 5 tabs
- [ ] User can edit premise, synopsis, writing style notes, word count default
- [ ] User can add/edit/delete character profiles (name + description)
- [ ] User can add/edit/delete location profiles (name + description)
- [ ] Archive hides novel from Aktif tab; restore brings it back
- [ ] Mark complete sets `completed_at`; unmark clears it; suggests blurb if none
- [ ] Hard delete requires typing novel title exactly; cascades all data
- [ ] Editing premise/synopsis with COMPLETED chapters shows stale warning
- [ ] `npm run build` passes

---

### S6 — Chapter CRUD + sidebar

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S4 |
| **User stories** | 24, 25, 26, 27, 28, 29, 30, 64, 65, 66, 67 |

#### What to build

Chapter management in the workspace: add chapters (DRAFT/OUTLINED), edit outline, delete with guard rules, sidebar with status badges. The workspace page (`/novels/[novelId]`) becomes functional.

#### Scope

- `POST /api/novels/:id/chapters` — auto sequence_number, DRAFT if no outline, OUTLINED if outline provided
- `GET /api/novels/:id/chapters` — sidebar list (no chapter_text)
- `GET /api/chapters/:id` — detail with chapter_text, stale_flags, has_outline_drift
- `PATCH /api/chapters/:id` — outline, title, chapter_text; block WRITING/QUEUED
- `DELETE /api/chapters/:id` — guard: DRAFT/OUTLINED free, COMPLETED tail-only, WRITING/QUEUED blocked
- Workspace page (`/novels/[novelId]`):
  - Header: novel title (link to settings), stale badge, dropdown menu
  - Sidebar: chapter list items with status badges (DRAFT/OUTLINED/QUEUED/WRITING/COMPLETED)
  - Main panel: varies by status (empty state, preview, editor)
- "Bab baru" Dialog (title + outline)
- "Edit outline" Dialog (textarea; block WRITING)
- "Hapus bab" AlertDialog (guard rules enforced)
- Outline drift detection: compare `outline_hash` with `md5(outline)` on COMPLETED chapters
- `Alert` for outline drift in main panel

#### Acceptance criteria

- [ ] User can add chapters with or without outline (DRAFT vs OUTLINED)
- [ ] Chapter sidebar shows ordered list with status badges
- [ ] Clicking chapter loads it in main panel
- [ ] User can edit outline (except WRITING); DRAFT + outline → OUTLINED transition
- [ ] User can delete DRAFT/OUTLINED freely
- [ ] User can delete COMPLETED only if manuscript tail
- [ ] Deleting COMPLETED cascades: text, summary, snapshot, embeddings, stale flags, jobs
- [ ] Outline drift alert shows when COMPLETED outline differs from hash
- [ ] WRITING/QUEUED chapters cannot be edited or deleted
- [ ] `npm run build` passes

---

### S7 — Tiptap editor integration

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S6 |
| **User stories** | 50 |

#### What to build

Rich text editor for Chapter text using Tiptap, styled with shadcn tokens. Manual edit with auto-save. Foundation for streaming in S9.

#### Scope

- Install Tiptap + extensions (`@tiptap/react`, `@tiptap/starter-kit`, etc.)
- `chapter-editor.tsx` wrapper:
  - Props: `chapterId`, `status`, `content`, `onSave`
  - Extensions: bold, italic, heading (optional), paragraph
  - Styled: `prose prose-neutral dark:prose-invert` + border `rounded-md`
- Editor behavior by status:
  - **DRAFT/OUTLINED:** Empty state with Card + "Isi outline untuk mulai" CTA
  - **COMPLETED:** Full editor with toolbar
- Manual edit: auto-save via `PATCH /api/chapters/:id` (debounced chapter_text update)
- "Tersimpan ✓" indicator in toolbar
- Toolbar (stub buttons for now): Sinkron memori cerita, Tulis ulang bab, Hapus bab

#### Acceptance criteria

- [ ] Tiptap editor renders chapter text for COMPLETED chapters
- [ ] Bold, italic, heading formatting works
- [ ] Manual edits auto-save with debounce
- [ ] "Tersimpan ✓" indicator shows after save
- [ ] DRAFT/OUTLINED shows empty state / outline preview
- [ ] Toolbar renders with stub buttons
- [ ] `npm run build` passes

---

### S8 — LLM infrastructure

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S2 |
| **User stories** | 34, 35, 36, 44, 45 |

#### What to build

Backend infrastructure for AI generation: OpenRouter SDK setup, model routing, context assembly, summary retrieval, canon resolution, Mem0 client, snapshot store. No UI — pure library modules with unit tests.

#### Scope

- Install: `openai` (OpenRouter compatible), `@langchain/langgraph`, `@langchain/langgraph-checkpoint-postgres`
- `lib/llm/router.ts` — `LlmRouter`: map use case → model config per ADR-0002
  - Tier 1 (Ghostwriter, regen): `gemini-2.5-flash`
  - Tier 2 (Partial rewrite): `gemini-2.5-flash`; (Blurb): `gemini-2.5-flash-lite`
  - Tier 3 (Scene planning): `gemini-2.5-flash`
  - Tier 4 (Summary): `gemini-2.5-flash-lite`; (Mem0 extract): `gemini-2.5-flash`
- `lib/llm/openrouter.ts` — OpenRouter client wrapper (base URL, model routing)
- `lib/context/assembler.ts` — `ContextAssembler.assembleForChapter(novelId, chapterNumber)` → context bundle
- `lib/context/summary-retriever.ts` — `SummaryRetriever.retrieve(novelId, chapterOutline, excludeRecent)` → recent-20 + pgvector top-10
- `lib/context/canon-resolver.ts` — `CanonResolver.resolveForForwardGen(novelId)` → declared > derived
- `lib/context/snapshot-store.ts` — `SnapshotStore.getSnapshot(chapterId)` / `writeSnapshot(chapterId, snapshot)`
- `lib/mem0/client.ts` — `Mem0Client` wrapper (read state, extract from chapter)
- Zod schemas for context bundles in `lib/validations/context.ts`
- Unit tests (Vitest) for ContextAssembler, SummaryRetriever, CanonResolver
- Integration test: SummaryRetriever against test pgvector instance

#### Acceptance criteria

- [ ] `LlmRouter` returns correct model config per use case
- [ ] OpenRouter client initializes with correct base URL and API key
- [ ] `ContextAssembler` builds correct bundle: synopsis, outline, profiles, writing style, prior chapter text, recent-20, top-10, derived canon
- [ ] `SummaryRetriever` returns recent-20 (full) + top-10 by pgvector similarity, excluding recent from retrieval
- [ ] `CanonResolver` prioritizes declared canon over derived canon
- [ ] `SnapshotStore` reads/writes JSONB snapshots
- [ ] `Mem0Client` reads state and extracts from chapter text
- [ ] Unit tests pass for ContextAssembler, SummaryRetriever, CanonResolver
- [ ] `npm run build` passes

---

### S9 — Chapter generation — happy path

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S7, S8 |
| **User stories** | 31, 32, 33, 34, 37, 43, 44, 45, 71, 72 |

#### What to build

End-to-end chapter generation: User clicks "Tulis" on an OUTLINED chapter, sees streaming text in the editor, and chapter transitions to COMPLETED. This is the core AI feature — the happy path without queue, checkpoint, or advanced editing.

#### Scope

- `ChapterLifecycle` module: state machine (DRAFT→OUTLINED→WRITING→COMPLETED→OUTLINED on failure)
- `POST /api/chapters/:id/write` route:
  - Validate: OUTLINED status, N−1 COMPLETED (or N=1), novel not archived
  - Transition to WRITING
  - Create `generation_jobs` row
  - Return `{ job_id, stream_url, status: "WRITING" }`
- `ChapterGraph` LangGraph:
  - Node 1: ScenePlanner — 3–4 beats + word targets (Tier 3, Flash)
  - Node 2–5: Ghostwriter — per-scene prose (Tier 1, Flash); Scene 1 uses prior chapter full text; scenes 2–4 use rolling in-chapter text
  - Node 6: Summarizer — 3–5 point summary (Tier 4, Flash-lite)
  - `runtime = 'nodejs'` on route handler
- `GET /api/chapters/:id/stream` SSE endpoint:
  - Events: `token`, `scene_start`, `progress`, `done`, `error`
  - Stream tokens to browser in real-time
- Finalization (on success):
  - Save `chapter_text` to `chapters`
  - Save `chapter_summary` to `chapters`
  - Embed summary → `chapter_summary_embeddings` (pgvector)
  - Extract derived canon → Mem0 Cloud
  - Write `chapter_context_snapshots`
  - Transition to COMPLETED
- Editor streaming:
  - Append tokens to Tiptap in real-time during WRITING
  - On `done`: refresh sidebar badge, enable toolbar
- Error handling: WRITING → OUTLINED + `error_message` on failure

#### Acceptance criteria

- [ ] User can click "Tulis" on OUTLINED chapter
- [ ] Chapter status changes to WRITING immediately
- [ ] Tokens stream into editor within ~5 seconds (NFR)
- [ ] Full chapter generates in ~1–3 minutes
- [ ] On completion: chapter_text saved, status = COMPLETED
- [ ] Chapter summary auto-generated (3–5 points)
- [ ] Summary embedded in pgvector
- [ ] Derived canon extracted to Mem0
- [ ] Chapter context snapshot written
- [ ] Sidebar updates with COMPLETED badge
- [ ] Generation respects Writing language
- [ ] Scene 1 uses full prior chapter text (or empty for chapter 1)
- [ ] On failure: chapter returns to OUTLINED with error message
- [ ] `npm run build` passes

---

### S10 — Generation slot guard + QUEUED state

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S9 |
| **User stories** | 38, 39, 40, 41, 42, 73 |

#### What to build

Operational guards: max 1 QUEUED + 1 WRITING per user, queue overflow handling, idempotency. When all slots are full, chapters enter QUEUED state with queue position shown.

#### Scope

- `GenerationSlotGuard` module: `acquireSlot(userId)` / `releaseSlot(userId)`
  - Query `generation_jobs` for active PENDING + RUNNING count per user
  - Max 1 QUEUED (PENDING) + 1 WRITING (RUNNING)
- QUEUED path in `POST /api/chapters/:id/write`:
  - If slots full → status = QUEUED, create job with `queue_position`
  - Return `{ job_id, stream_url: null, status: "QUEUED", queue_position: N }`
- Queue drain: find next PENDING job → transition to WRITING → run ChapterGraph
- UI updates:
  - QUEUED panel: `Skeleton` + "Menunggu antrian — posisi #n"
  - Sidebar: QUEUED badge with position text
  - On worker pickup: transition to WRITING, open SSE stream
- Idempotency: reject duplicate write requests while WRITING or QUEUED
- Error: QUEUED job fails → OUTLINED + error_message

#### Acceptance criteria

- [ ] User can have at most 1 QUEUED + 1 WRITING chapter at a time
- [ ] Duplicate write requests blocked while WRITING/QUEUED
- [ ] When slots full, chapter enters QUEUED with queue position
- [ ] Queue position shown in sidebar and main panel
- [ ] Worker pickup transitions QUEUED → WRITING
- [ ] Failed QUEUED job returns chapter to OUTLINED with error message
- [ ] `npm run build` passes

---

### S11 — Stale chapter tracking

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S9 |
| **User stories** | 60, 61, 62, 63 |

#### What to build

Flag downstream chapters as stale when upstream text/summary changes. Show stale count, list, and allow dismiss. Re-flag on upstream change.

#### Scope

- `StaleChapterTracker` module:
  - `flagDownstream(chapterId, reason)` — uses `flag_downstream_chapters()` DB function
  - `dismiss(staleFlagId)` — set `dismissed_at = now()`
  - `count(novelId)` — undismissed stale count
  - `reFlag(chapterId)` — clear dismissed_at when upstream changes again
- `GET /api/novels/:id/stale` — list stale chapters with cause info
- `POST /api/stale/:id/dismiss` — dismiss flag
- UI:
  - Stale badge count on novel header (clickable)
  - "Bab usang" `Dialog`: list of stale chapters with caused_by info + dismiss button
  - "Abaikan bab usang" `AlertDialog` confirmation
  - Stale icon on chapter list items (undismissed)
- Stale reasons: `UPSTREAM_TEXT_CHANGED`, `UPSTREAM_SUMMARY_CHANGED`, `SYNOPSIS_CHANGED`, `PREMISE_CHANGED`
- Stale is warning, not blocker — user can still generate next chapter

#### Acceptance criteria

- [ ] Editing premise/synopsis flags all COMPLETED chapters stale
- [ ] Story memory sync flags downstream COMPLETED chapters stale
- [ ] Stale badge shows count on novel header
- [ ] "Bab usang" Dialog lists all stale chapters with cause
- [ ] User can dismiss individual stale flags
- [ ] Dismissed stale reappears when upstream changes again
- [ ] Stale icon shows on chapter list items
- [ ] Stale does not block generation of next chapter
- [ ] `npm run build` passes

---

### S12 — Story memory sync

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S9, S11 |
| **User stories** | 51, 52 |

#### What to build

Explicit user action to refresh AI memory after manual edits: re-summarize chapter, refresh derived canon, update snapshot, flag downstream stale.

#### Scope

- `StoryMemorySync` module:
  - `sync(chapterId)`:
    1. Re-summarize chapter (Flash-lite)
    2. Update `chapters.chapter_summary`
    3. Re-embed summary → `chapter_summary_embeddings`
    4. Extract derived canon → Mem0
    5. Update `chapter_context_snapshots`
    6. Flag downstream COMPLETED chapters stale (`UPSTREAM_TEXT_CHANGED` / `UPSTREAM_SUMMARY_CHANGED`)
- `POST /api/chapters/:id/sync-memory` route
  - Request body: `{ chapter_text }` (current text to sync from)
  - Response: `{ status, chapter_summary, stale_chapters_flagged, snapshot_updated }`
- "Sinkron memori cerita" `AlertDialog` in editor toolbar
  - Explains: re-summary, refresh derived canon, update snapshot, flag downstream
- Side effects listed in acceptance criteria

#### Acceptance criteria

- [ ] User can trigger story memory sync from toolbar
- [ ] AlertDialog confirms before sync
- [ ] Chapter summary updated (3–5 points)
- [ ] Summary re-embedded in pgvector
- [ ] Derived canon refreshed in Mem0
- [ ] Chapter context snapshot updated
- [ ] Downstream COMPLETED chapters flagged stale
- [ ] Response includes stale_chapters_flagged count
- [ ] `npm run build` passes

---

### S13 — Partial rewrite

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S9, S12 |
| **User stories** | 53, 54, 55 |

#### What to build

User selects text in editor, provides feedback, and AI rewrites only the selected passage. Auto-runs story memory sync after completion.

#### Scope

- `PartialRewriteService` module:
  - `rewrite(chapterId, selection, feedback)`:
    1. Get surrounding context from chapter text
    2. Call Tier 2 (Flash) with selection + feedback + surrounding voice
    3. Stream replacement text
    4. Auto story memory sync on completion
- `POST /api/chapters/:id/partial-rewrite` route:
  - Body: `{ selected_text, selection_start, selection_end, feedback }`
  - Response: `{ job_id, stream_url }` (202 Accepted)
- Editor integration:
  - Text selection → floating bubble "Tulis ulang bagian"
  - `partial-rewrite-dialog.tsx`: selected text preview (read-only) + feedback textarea
  - Stream replacement in-place (replace selection with streamed text)
  - Not blocked by later chapters (v1)
- Auto story memory sync after completion (no additional modal)

#### Acceptance criteria

- [ ] User can select text in editor to trigger partial rewrite
- [ ] Floating bubble appears on text selection
- [ ] Dialog shows selected text preview + feedback textarea
- [ ] AI rewrites only selected passage, matching surrounding voice
- [ ] Replacement streams in-place in editor
- [ ] Auto story memory sync runs after completion
- [ ] Downstream chapters flagged stale if they exist
- [ ] Not blocked by later chapters
- [ ] `npm run build` passes

---

### S14 — Full chapter regeneration

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S9, S12 |
| **User stories** | 56, 57, 58, 59 |

#### What to build

Complete AI rewrite of an entire COMPLETED chapter from its outline + point-in-time Chapter context snapshot. Replaces all chapter text, auto-syncs story memory.

#### Scope

- `FullRegenService` module:
  - `regenerate(chapterId)`:
    1. Get chapter's `Chapter context snapshot` (point-in-time)
    2. Get current `Chapter outline`
    3. Run ChapterGraph with snapshot context (not current metadata/derived canon)
    4. Replace all `chapter_text`
    5. Auto story memory sync
    6. Flag downstream stale
- `POST /api/chapters/:id/regenerate` route:
  - Body: `{ confirm: true }`
  - Response: `{ job_id, stream_url, status: "WRITING" }`
- "Tulis ulang bab" `AlertDialog` in toolbar:
  - Warning: replaces entire chapter text, downstream will be flagged stale
  - Confirm button
- Blocked if chapter is WRITING
- Uses current outline + snapshot (not current metadata or Mem0)

#### Acceptance criteria

- [ ] User can trigger full regen from toolbar on COMPLETED chapter
- [ ] AlertDialog warns about full replacement + stale downstream
- [ ] Blocked if chapter is WRITING
- [ ] Uses Chapter context snapshot (point-in-time), not current metadata
- [ ] Uses current chapter outline
- [ ] Replaces all chapter_text
- [ ] Auto story memory sync runs after completion
- [ ] Downstream COMPLETED chapters flagged stale
- [ ] `npm run build` passes

---

### S15 — Plot checkpoints

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S9 |
| **User stories** | 46, 47, 48, 49 |

#### What to build

Opt-in feature: AI pauses before irreversible story beats (death, revelation, relationship shift, major defeat/victory) and waits for user approval, rejection, or edit.

#### Scope

- Novel settings: `plot_checkpoints_enabled` toggle (tab Lanjutan) — already in S5
- `PlotCheckpointHandler` module:
  - `awaitDecision(checkpoint)`: pause graph, emit SSE `checkpoint` event, wait for response
  - Handle `APPROVE` (continue), `REJECT` (AI replans outline), `EDIT` (user direction → update outline)
- `POST /api/chapters/:id/checkpoint` route:
  - Body: `{ decision, feedback? }`
  - Response: `{ status: "accepted", updated_outline? }`
- SSE `checkpoint` event:
  - Data: `{ checkpoint_id, type: "irreversible_beat", description, outline_excerpt }`
- `plot-checkpoint-dialog.tsx`:
  - Blocking `Dialog` (overlay gelap, tidak dismiss dengan Esc)
  - Description of the irreversible beat
  - Three actions: **Setuju** (approve), **Tolak** (reject), **Edit** (textarea for free-text direction)
  - No timeout in v1
- ScenePlanner integration: detect irreversible beats, flag for checkpoint
- Decision becomes part of Declared canon for the chapter

#### Acceptance criteria

- [ ] Plot checkpoints default off per novel
- [ ] User can enable in novel settings (Lanjutan tab)
- [ ] When enabled, AI pauses before irreversible beats
- [ ] SSE `checkpoint` event emitted during generation
- [ ] Blocking Dialog shown with beat description
- [ ] Approve: generation continues without changes
- [ ] Reject: AI replans outline, then continues
- [ ] Edit: user provides direction, outline updated, generation continues
- [ ] Generation stays WRITING until user responds
- [ ] No timeout — user can respond anytime
- [ ] Decision stored as Declared canon
- [ ] `npm run build` passes

---

### S16 — Blurb generation

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S9 |
| **User stories** | 68, 69, 70 |

#### What to build

On-demand marketing copy (~100–150 words, minimal spoilers) generated after at least one COMPLETED chapter. User can edit result manually.

#### Scope

- `BlurbGenerator` module:
  - `generate(novelId)`:
    1. Get genre, synopsis, chapter summaries
    2. Call Tier 2 (Flash-lite) for short marketing copy
    3. Return blurb text
- `POST /api/novels/:id/blurb` route:
  - Response: `{ blurb }`
- Blurb `Dialog`:
  - Generate button → calls API → fills textarea
  - Editable textarea for manual editing
  - Save → `PATCH /api/novels/:id` with blurb field
- Prompt after "mark complete" if no blurb exists (`suggest_blurb: true`)
- Writing language, ~100–150 words, minimal spoilers

#### Acceptance criteria

- [ ] User can generate blurb from novel menu or after marking complete
- [ ] Blurb is ~100–150 words in Writing language
- [ ] Blurb has minimal spoilers
- [ ] User can edit generated blurb manually
- [ ] Blurb saved to novel metadata
- [ ] Requires at least 1 COMPLETED chapter
- [ ] `npm run build` passes

---

### S17 — Account deletion

| | |
|---|---|
| **Type** | AFK |
| **Blocked by** | S3 |
| **User stories** | 5, 6 |

#### What to build

Hard delete user account with email confirmation. Cascades all data. User can re-register with same email after.

#### Scope

- `DELETE /api/account` route:
  - Body: `{ confirm_email }`
  - Validate email matches current user
  - Call `delete_user_account(userId)` DB function (cascades novels → chapters → everything)
  - Call Supabase Auth admin API to delete `auth.users` row
  - Clean up Mem0 data for user's novels
- `PATCH /api/account/profile` route:
  - Body: `{ display_name }`
  - Update `profiles.display_name`
- Account `Dialog` (from avatar menu):
  - Display name (editable), email (read-only)
- "Hapus akun" `AlertDialog`:
  - Warning text
  - Input: type email to confirm
  - Delete button disabled until email matches
  - On success: redirect to `/login`
- Re-registering with same email creates fresh account

#### Acceptance criteria

- [ ] User can update display name from account settings
- [ ] User can delete account by typing email to confirm
- [ ] Delete button disabled until email matches exactly
- [ ] All novels, chapters, snapshots, embeddings, stale flags, jobs cascade deleted
- [ ] Mem0 data cleaned up
- [ ] Supabase Auth user deleted
- [ ] Redirect to `/login` after deletion
- [ ] Re-registering with same email creates fresh account
- [ ] `npm run build` passes

---

## User Story Coverage

| User Story | Slice |
|------------|-------|
| 1. Sign up | S3 |
| 2. Sign in | S3 |
| 3. No email verification | S3 |
| 4. UI Bahasa Indonesia | S3 |
| 5. Account deletion | S17 |
| 6. Re-register after deletion | S17 |
| 7. Create Novel | S4 |
| 8. Genre presets / Other | S4 |
| 9. Synopsis user-authored | S4 |
| 10. Edit Synopsis | S5 |
| 11. Stale after Synopsis change | S11 |
| 12. Character/Location profiles | S5 |
| 13. Profiles user-authored | S5 |
| 14. Word count target | S5 |
| 15. Writing style notes | S5 |
| 16. Mark complete | S5 |
| 17. Unmark complete | S5 |
| 18. Suggest blurb on complete | S16 |
| 19. Archive novel | S5 |
| 20. Archived blocks generation | S5 |
| 21. Hard delete novel | S5 |
| 22. Sequel = new Novel | S4 |
| 23. Plot checkpoints toggle | S5 |
| 24–30. Chapter planning | S6 |
| 31–37. Chapter generation | S9 |
| 38–42. Queue + idempotency | S10 |
| 43. Resume from last scene | S9 |
| 44. Auto-summary | S9 |
| 45. Derived canon update | S9 |
| 46–49. Plot checkpoints | S15 |
| 50. Manual edit + auto-save | S7 |
| 51–52. Story memory sync | S12 |
| 53–55. Partial rewrite | S13 |
| 56–59. Full chapter regen | S14 |
| 60–63. Stale chapters | S11 |
| 64–67. Chapter deletion | S6 |
| 68–70. Blurb | S16 |
| 71–72. Performance NFRs | S9 |
| 73. Early access unlimited | S10 |
