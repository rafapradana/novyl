# PRD: Novyl v1 (Early Access)

## Problem Statement

Authors who write long novels with general-purpose AI tools routinely hit plot holes, forgotten character details, and inconsistent lore as manuscripts grow past a few dozen chapters. Existing generators treat each session as isolated and cannot maintain a coherent story bible, sequential manuscript structure, or point-in-time context when the User revises earlier Chapters.

Novyl addresses this for **Early access Users**: people who want to collaborate with AI Agents to write complete **Novels** chapter by chapter, with consistency maintained across hundreds of **Chapters**, while retaining full control over plot (**Synopsis**, **Chapter outlines**) and the ability to edit, regenerate, and fix forward when the story changes.

## Solution

A SaaS platform where a **User** creates **Novels**, defines story inputs (required and optional), plans **Chapters** incrementally, and triggers AI generation one **Chapter** at a time in strict sequence. A multi-agent pipeline (Planner → Ghostwriter → Summarizer) gathers dynamic context — **Declared canon**, **Derived canon**, **Prior chapter text**, **Recent chapter summaries**, and **Retrieved chapter summaries** — to produce **Chapter text** in the Novel's **Writing language**. The User edits prose manually, runs **Partial rewrite** or **Full chapter regeneration**, and explicitly syncs **Story memory** when ready. **Stale chapters** warn about downstream inconsistency without blocking progress. **Early access** is open signup with no billing, no export, and unlimited AI usage.

## User Stories

### Account & access

1. As an **Early access User**, I want to sign up with **Display name**, email, and password, so that I can start writing immediately without invite codes or payment.
2. As a **User**, I want to sign in with **Account credentials** (email and password), so that I can access my **Novels** securely.
3. As a **User**, I want to use the app immediately after signup without email verification, so that onboarding friction is minimal in early access.
4. As a **User**, I want the UI in Indonesian, so that I can navigate the product in my language while still writing **Novels** in any **Writing language**.
5. As a **User**, I want to request **Account deletion** by typing my email to confirm, so that all my **Novels** and data are permanently removed when I choose to leave.
6. As a **User**, I want to re-register with the same email after **Account deletion**, so that I can return later with a fresh account.

### Novel management

7. As a **User**, I want to create a **Novel** with **Novel title**, **Genre**, **Writing language**, and **Synopsis**, so that the AI has the minimum story spine before I write **Chapter** 1.
8. As a **User**, I want to pick **Genre** from **Genre presets** or enter custom text when I select Other, so that my **Novel** is categorized accurately.
9. As a **User**, I want **Synopsis** to always be my own writing with no AI generation or editing, so that plot direction stays under my control.
10. As a **User**, I want to edit **Synopsis** at any time with a warning before save, so that I can pivot the story while understanding downstream impact.
11. As a **User**, I want all **COMPLETED** **Chapters** flagged as **Stale chapters** after **Synopsis** changes, so that I know which parts of the manuscript may no longer match the plot spine.
12. As a **User**, I want to optionally add **Character profiles** and **Location profiles** incrementally, so that I can deepen **Declared canon** without blocking my first **Chapter**.
13. As a **User**, I want **Character profiles** and **Location profiles** to be User-authored only, so that the story bible reflects my intent.
14. As a **User**, I want optional **Chapter word count target** at the **Novel** or **Chapter** level, so that generation length follows my preference as a soft guide.
15. As a **User**, I want optional **Writing style notes** per **Novel**, so that the AI follows my tone, POV, and constraints in prompts without learned-preference RAG.
16. As a **User**, I want to mark a **Novel** as a **Completed novel** at any time, so that I can signal I am done while keeping the manuscript editable.
17. As a **User**, I want to unmark a **Completed novel**, so that I can add epilogues or continue writing later.
18. As a **User**, I want a prompt to generate **Blurb** when I mark complete without one, so that I can finish marketing copy easily.
19. As a **User**, I want to **archive** a **Novel**, so that it is hidden from my main list but fully restorable.
20. As a **User**, I want **Archived novels** to block AI generation until restored, so that I do not accidentally write to a shelved manuscript.
21. As a **User**, I want to **hard delete** a **Novel** by typing the **Novel title**, so that I can permanently remove a manuscript I no longer want.
22. As a **User**, I want a sequel or spin-off to be a new **Novel**, so that each book has isolated story memory.
23. As a **User**, I want to enable **Plot checkpoints** per **Novel** (default off), so that irreversible beats require my approval when I want that control.

### Chapter planning

24. As a **User**, I want to add **Chapters** incrementally with title and **Chapter outline**, so that I plan at my own pace.
25. As a **User**, I want **Chapter** slots in **DRAFT** before I have an outline, so that I can reserve structure ahead of time.
26. As a **User**, I want a **Chapter** to move to **OUTLINED** when it has an outline, so that I know it is ready to generate.
27. As a **User**, I want to edit **Chapter outline** on any **Chapter** except while **WRITING**, so that I can refine plans without blocking the whole **Novel**.
28. As a **User**, I want **Outline drift** shown when I edit a **COMPLETED** **Chapter**'s outline without changing **Chapter text**, so that I know text and plan may disagree.
29. As a **User**, I want to resolve **Outline drift** via **Full chapter regeneration** or by reverting the outline, so that I can align text and plan deliberately.
30. As a **User**, I want outline-only edits not to flag later **Chapters** as **Stale**, so that planning changes do not create false alarms until text changes.

### Chapter generation

31. As a **User**, I want **Chapter** N to generate only after **Chapter** N−1 is **COMPLETED**, so that the manuscript stays sequential.
32. As a **User**, I want to click write on an **OUTLINED** **Chapter** and see **Chapter text** stream in, so that I get feedback within seconds and a full **Chapter** in minutes.
33. As a **User**, I want **Scene** planning to happen internally without seeing **Scene plans**, so that I read one continuous **Chapter text** stream.
34. As a **User**, I want the first **Scene** of **Chapter** N to use full **Prior chapter text** (entire **Chapter** N−1), so that transitions between **Chapters** feel natural.
35. As a **User**, I want deep history via **Recent chapter summaries** (last 20) plus **Retrieved chapter summaries** (top 10), so that long **Novels** stay consistent without loading every past summary.
36. As a **User**, I want **Declared canon** to override **Derived canon** when they conflict during new **Chapter** generation, so that my metadata edits take precedence.
37. As a **User**, I want generation to respect my **Writing language** for **Chapter text**, so that output matches the **Novel**'s intended language regardless of input language.
38. As a **User**, I want my **Chapter** to enter **QUEUED** with queue position when workers are busy, so that I understand wait time during traffic spikes.
39. As a **User**, I want my **Chapter** to move from **QUEUED** to **WRITING** when a worker picks it up, so that I see live progress.
40. As a **User**, I want at most one **QUEUED** and one **WRITING** **Chapter** at a time, so that the system does not run duplicate jobs for me.
41. As a **User**, I want a failed queued job to return my **Chapter** to **OUTLINED** with an error message, so that I can retry after a failure.
42. As a **User**, I want duplicate write requests blocked while a **Chapter** is **QUEUED** or **WRITING**, so that I do not corrupt generation state.
43. As a **User**, I want mid-**Chapter** generation to resume from the last completed **Scene** on failure, so that I do not lose partial progress.
44. As a **User**, I want a **Chapter summary** auto-generated when generation completes, so that future **Chapters** have accurate episodic memory.
45. As a **User**, I want **Derived canon** updated in Mem0 after each **Chapter** completes, so that entity facts accumulate automatically.

### Plot checkpoints

46. As a **User** with **Plot checkpoints** enabled, I want the AI to pause before an irreversible beat (death, revelation, relationship shift, major defeat/victory), so that I can approve direction.
47. As a **User** at a **Plot checkpoint**, I want to **Approve**, **Reject**, or **Edit** with free-text direction, so that I control critical story turns.
48. As a **User** who **Rejects** or **Edits** at a checkpoint, I want the **Chapter outline** updated before prose continues, so that the plan matches my decision.
49. As a **User** at a checkpoint, I want generation to stay in **WRITING** until I respond with no timeout, so that I am not rushed.

### Editing & memory sync

50. As a **User**, I want **Manual edit** in a rich text editor with auto-save, so that I can fix prose without triggering AI memory updates on every keystroke.
51. As a **User**, I want to run **Story memory sync** explicitly after **Manual edit**, so that **Chapter summary**, **Derived canon**, and **Chapter context snapshot** match my text when I am ready.
52. As a **User**, I want **Story memory sync** to flag later **Chapters** as **Stale chapters** when upstream text changes, so that I know what to fix forward.
53. As a **User**, I want **Partial rewrite** on a selected passage with feedback, so that I can improve a section without regenerating the whole **Chapter**.
54. As a **User**, I want **Partial rewrite** on a **COMPLETED** **Chapter** to auto-run the same refresh as **Story memory sync**, so that memory stays consistent after AI-assisted edits.
55. As a **User**, I want **Partial rewrite** never blocked by later **Chapters** in v1, so that I can revise mid-manuscript freely.
56. As a **User**, I want **Full chapter regeneration** on any **COMPLETED** **Chapter** from its **Chapter outline** and **Chapter context snapshot**, so that I can start over on a **Chapter** while preserving point-in-time context.
57. As a **User**, I want **Full chapter regeneration** blocked while that **Chapter** is **WRITING**, so that concurrent jobs do not conflict.
58. As a **User**, I want **Full chapter regeneration** to replace all **Chapter text** and auto-sync story memory, so that downstream **Stale chapters** are flagged correctly.
59. As a **User** regenerating an old **Chapter**, I want only that **Chapter**'s **Chapter context snapshot** used (not current metadata or **Derived canon**), so that the rewrite matches the story as it was at that point.

### Stale chapters & consistency

60. As a **User**, I want **Stale chapters** shown as warnings not blockers, so that I can still write the next **Chapter** while inconsistencies exist.
61. As a **User**, I want to see a count of undismissed **Stale chapters** on my **Novel**, so that I know how much fix-forward work remains.
62. As a **User**, I want to **dismiss** a **Stale chapter** with confirmation, so that acknowledged warnings stay out of my way until upstream changes again.
63. As a **User**, I want a **Dismissed stale chapter** to reappear as stale when the causing upstream **Chapter** changes again, so that I am not silently inconsistent.

### Chapter deletion

64. As a **User**, I want to delete **DRAFT** and **OUTLINED** **Chapters** freely, so that I can clean up unused slots.
65. As a **User**, I want to delete the latest **COMPLETED** **Chapter** (manuscript tail only), so that I can undo the last written section.
66. As a **User**, I want deletion of a tail **COMPLETED** **Chapter** to remove its **Chapter text**, **Chapter summary**, **Derived canon** entries, and **Chapter context snapshot**, so that story memory stays clean.
67. As a **User**, I want to be prevented from deleting a **COMPLETED** **Chapter** that has later **COMPLETED** **Chapters**, so that I must edit or regenerate instead of leaving gaps.

### Blurb

68. As a **User**, I want to generate **Blurb** on demand after at least one **COMPLETED** **Chapter**, so that I get short marketing copy when I need it.
69. As a **User**, I want to edit **Blurb** manually after generation, so that the final copy is mine.
70. As a **User**, I want **Blurb** in my **Writing language** with minimal spoilers (~100–150 words), so that it suits back-cover style promotion.

### Operations & reliability (User-visible)

71. As a **User**, I want the first tokens of **Chapter text** to appear within ~5 seconds of clicking write, so that the experience feels responsive.
72. As a **User**, I want a full **Chapter** generation to complete in roughly 1–3 minutes, so that I can plan my writing session.
73. As a **User**, I want **Early access** with no token quotas or billing, so that I can explore the product fully during v1.

## Implementation Decisions

### Architecture

- **TypeScript monolith** on Next.js (App Router): UI, CRUD API routes, LangGraph orchestration, and SSE streaming in one codebase (ADR-0004).
- **Vercel Pro** hosts Next.js with **Node.js runtime** (`runtime = 'nodejs'`, adequate `maxDuration`) for generation routes — not Edge runtime.
- **Supabase Cloud**: Auth (email/password), PostgreSQL + RLS, pgvector, LangGraph Postgres checkpointer, pgmq queues, Edge Functions for short tasks only.
- **Mem0 Cloud**: **Derived canon** / entity memory — complements pgvector summary RAG; does not replace it.
- **OpenRouter** TypeScript SDK with fixed server-side model routing per ADR-0002.

### Major modules (deep modules)

These modules encapsulate complex behavior behind narrow, testable interfaces:

| Module | Responsibility | Key interface (conceptual) |
|--------|----------------|---------------------------|
| **AccountService** | Signup, sign-in, session, **Account deletion** cascade | `deleteAccount(userId, emailConfirmation)` |
| **NovelRepository** | CRUD, archive, complete, hard delete, metadata | `getNovelContext(novelId)` → declared inputs |
| **ChapterRepository** | CRUD, ordering, status persistence | `getChapter(novelId, chapterNumber)` |
| **ChapterLifecycle** | Valid transitions, guards, sequential write rules | `transition(chapterId, event)` → next status or error |
| **GenerationSlotGuard** | Max 1 QUEUED + 1 WRITING per User; idempotency | `acquireSlot(userId)` / `releaseSlot(userId)` |
| **ContextAssembler** | Build macro prompt for Tier 1/3/4 per ADR-0002 & ADR-0003 | `assembleForChapter(novelId, chapterNumber)` → context bundle |
| **SummaryRetriever** | Embed + pgvector similarity; recent-20 + top-10 policy | `retrieve(novelId, chapterOutline, excludeRecent)` |
| **CanonResolver** | **Declared canon** > **Derived canon** for forward generation | `resolveForForwardGen(novelId)` |
| **SnapshotStore** | **Chapter context snapshot** read/write for regen | `getSnapshot(chapterId)` |
| **Mem0Client** | Read derived state; extract/update after chapter/sync | `extractFromChapter(text)` / `getState(novelId)` |
| **LlmRouter** | Map use case → model tier (Flash vs Flash-lite) | `route(useCase)` → model config |
| **ChapterGraph** | LangGraph: plan scenes → write scenes (stream) → summarize → finalize | `run(chapterId, streamSink)` |
| **ScenePlanner** | Internal 3–4 beat breakdown + word targets (Tier 3) | `plan(outline, context)` → scene beats |
| **Ghostwriter** | Per-scene prose generation with rolling in-chapter context (Tier 1) | `writeScene(beat, rollingContext, stream)` |
| **Summarizer** | **Chapter summary** 3–5 points (Tier 4, Flash-lite) | `summarize(chapterText, outline)` |
| **StoryMemorySync** | Re-summarize, Mem0 refresh, snapshot update, stale propagation | `sync(chapterId)` |
| **StaleChapterTracker** | Flag, dismiss, count, re-flag on upstream change | `flagDownstream(chapterId)` / `dismiss(staleId)` |
| **PartialRewriteService** | Selection + feedback rewrite (Tier 2) | `rewrite(chapterId, selection, feedback)` |
| **FullRegenService** | Point-in-time regen from outline + snapshot | `regenerate(chapterId)` |
| **PlotCheckpointHandler** | Pause graph, collect User decision, update outline | `awaitDecision(checkpoint)` |
| **BlurbGenerator** | On-demand marketing copy (Tier 2, Flash-lite) | `generate(novelId)` |
| **GenerationQueue** | pgmq enqueue/dequeue on overload; QUEUED status + position | `enqueue(chapterId)` / `dequeue()` |
| **StreamPublisher** | SSE events to browser during generation | `publish(chapterId, token)` |

### Chapter lifecycle state machine

```
DRAFT ──(outline saved)──► OUTLINED ──(write clicked, slot free)──► WRITING
OUTLINED ──(write clicked, slots full)──► QUEUED ──(worker pickup)──► WRITING
WRITING ──(success)──► COMPLETED
WRITING ──(failure)──► OUTLINED
QUEUED ──(job failure)──► OUTLINED
```

Guards:
- **WRITING** only if Chapter N−1 is **COMPLETED** (or N = 1).
- No second write trigger while **QUEUED** or **WRITING**.
- **Archived novel**: block all generation transitions.

### Data model (Supabase Postgres)

Core tables (names illustrative; exact schema in migrations):

- `users` — via Supabase Auth; `display_name` in `user_metadata`
- `novels` — title, genre, writing_language, synopsis, blurb, writing_style_notes, word_count_default, plot_checkpoints_enabled, completed_at, archived_at, user_id
- `character_profiles`, `location_profiles` — novel_id, name, description JSON/text
- `chapters` — novel_id, sequence_number, title, outline, chapter_text, status, chapter_summary, word_count_target
- `chapter_context_snapshots` — chapter_id, snapshot JSON (character/world state at finalize)
- `chapter_summary_embeddings` — chapter_id, embedding vector (pgvector), novel_id
- `stale_chapter_flags` — chapter_id, caused_by_chapter_id, dismissed_at
- `generation_jobs` — chapter_id, status, queue_position, error_message (may align with pgmq)

RLS: every row scoped to owning **User** via novel ownership.

### Context gathering policy (ADR-0003)

For **Chapter** N generation, **ContextAssembler** always includes:

- **Synopsis**, **Chapter outline**, profiles, **Writing style notes**, word count target
- **Derived canon** (Mem0)
- **Prior chapter text** — full text of Chapter N−1
- **Recent chapter summaries** — last 20 **COMPLETED** chapters before N
- **Retrieved chapter summaries** — top 10 older summaries by pgvector similarity to current outline

Never include raw text of chapters older than N−1.

### AI pipeline (4 phases)

1. **Context gathering** — ContextAssembler + SummaryRetriever + Mem0Client + CanonResolver
2. **Scene planning** — ScenePlanner (3–4 beats, internal only); optional **Plot checkpoint** pause
3. **Incremental generation** — Ghostwriter per scene; Scene 1 uses prior chapter full text; scenes 2–4 use rolling in-chapter text; SSE stream
4. **Finalization** — save text, Summarizer, embed summary → pgvector, Mem0 extract, write **Chapter context snapshot**, transition to **COMPLETED**

LangGraph state persisted via `@langchain/langgraph-checkpoint-postgres` on Supabase.

### Model routing (ADR-0002)

| Use case | Model |
|----------|-------|
| Ghostwriter, full regen, partial rewrite, scene planning, plot checkpoint, Mem0 extraction | `gemini-2.5-flash` |
| Chapter summary, blurb, story memory re-summarize | `gemini-2.5-flash-lite` |

No User-facing model picker.

### Queue & deployment split

- **Happy path**: User click → Next.js Node API route → LangGraph → SSE (no queue).
- **Overload**: all generation slots full → **QUEUED** + pgmq job + position in UI.
- **Edge Functions**: drain queue cron, webhooks, post-process embed — not LangGraph host.

### Auth

- Supabase Auth email/password; open signup (ADR-0004 supersedes ADR-0001 dual-token JWT pattern).
- API routes validate session via Supabase server client.

### UI

- Indonesian strings v1 with i18n key structure.
- Rich text editor for **Chapter text**.
- Novel dashboard: stale count, chapter list with status badges, queue position for **QUEUED**.

### API contracts (high level)

- `POST /api/novels` — create novel with required fields
- `PATCH /api/novels/:id` — metadata, archive, complete, plot checkpoint toggle
- `DELETE /api/novels/:id` — hard delete with title confirmation body
- `POST /api/novels/:id/chapters` — add chapter slot
- `PATCH /api/chapters/:id` — outline, title, manual text save
- `POST /api/chapters/:id/write` — trigger generation (→ WRITING or QUEUED); returns SSE stream URL or job id
- `GET /api/chapters/:id/stream` — SSE token stream
- `POST /api/chapters/:id/sync-memory` — **Story memory sync**
- `POST /api/chapters/:id/partial-rewrite` — selection + feedback
- `POST /api/chapters/:id/regenerate` — **Full chapter regeneration**
- `POST /api/novels/:id/blurb` — generate blurb
- `POST /api/chapters/:id/checkpoint` — approve / reject / edit at plot checkpoint
- `POST /api/stale/:id/dismiss` — dismiss stale flag
- `DELETE /api/account` — **Account deletion** with email confirmation

## Testing Decisions

### What makes a good test

- Assert **observable behavior** at module boundaries: valid/invalid state transitions, context bundle contents, stale propagation sets, canon precedence, retrieval counts — not internal LangGraph node wiring or prompt string snapshots that change frequently.
- Integration tests against real Postgres/pgvector test instance for **SummaryRetriever** and RLS policies; unit tests with mocked LLM/Mem0 for pipeline orchestration.
- No tests that merely assert mocks were called unless verifying a critical side-effect contract (e.g. Mem0 extract invoked after **COMPLETED**).

### Modules to test (recommended)

| Module | Rationale |
|--------|-----------|
| **ChapterLifecycle** | Rich rules; bugs cause illegal states or duplicate jobs |
| **GenerationSlotGuard** | Concurrency invariant (1 QUEUED + 1 WRITING per User) |
| **ContextAssembler** | Correct inclusion/exclusion of prior text, recent 20, top 10, declared vs derived |
| **SummaryRetriever** | Recent window exclusion + top-k similarity behavior |
| **StaleChapterTracker** | Flag downstream on sync/regen; dismiss; re-flag on upstream change |
| **CanonResolver** | Declared > derived for forward gen; snapshot isolation for regen |
| **StoryMemorySync** | Side effects: summary, snapshot, Mem0, stale flags |
| **ChapterLifecycle** + sequential guard integration | Chapter N blocked until N−1 **COMPLETED** |

### Prior art

Greenfield — no existing test suite. Establish patterns with Vitest (unit) and Playwright (critical User flows: signup → create novel → write chapter 1) as scaffolding lands.

## Out of Scope

- Billing, credits, token quotas, usage metering
- PDF/EPUB export and object storage workflows
- OAuth / social login
- Email verification and password reset flows
- AI-generated **Synopsis**, **Character profiles**, **Location profiles**, or auto word-count targets
- User-facing **Scene plans** or per-scene UI
- Version history for **Chapter text**
- Blocking **Partial rewrite** or next-chapter generation because **Stale chapters** exist
- Novel series linking (sequel **Novels** are independent in v1)
- Learned **Writing style notes** from behavior (RAG or implicit preferences)
- Separate Go/Python microservices, local Qdrant, local Mem0, Inngest, Neon, Cloudflare R2
- LangGraph on Supabase Edge Functions or Vercel Edge runtime
- Timeout on **Plot checkpoint** wait
- Premium model tier / User model picker

## Further Notes

- Repo is **docs-only** at PRD time — no `src/` yet. Implementation starts with Next.js + Supabase scaffold, schema migrations, RLS, then ChapterLifecycle + ContextAssembler before full LangGraph pipeline.
- ADR-0001 (dual-token JWT) is partially superseded by Supabase Auth per ADR-0004; no custom refresh-token layer in v1 unless required later.
- Validate Flash + full production system prompt with multi-chapter canon adherence test before early access launch (per ADR-0002).
- Prompt caching on stable macro prefix across 4 ghostwriter scene calls when OpenRouter/provider supports it — significant cost win.
- **Early access Users** have unlimited AI; operational guards (slot limits, idempotency) protect system stability only.
