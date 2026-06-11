# TypeScript monolith on Next.js with Supabase and Mem0 Cloud

Novyl v1 is a single TypeScript codebase: Next.js frontend + API routes + LangGraph.js orchestration + OpenRouter SDK. No separate Go or Python services.

**Supabase (cloud)** provides PostgreSQL (transactional data, LangGraph checkpoints), Auth, pgvector (chapter-summary RAG), Storage (future export/covers), Queues (pgmq), and Edge Functions (short hooks only).

**Mem0 Cloud** provides derived canon / entity memory. Local Mem0 OS and Qdrant are dropped.

## Why this over the brief stack

The brief split Go Fiber, FastAPI, Qdrant, Mem0 local, Inngest, and Neon across a 4 GB VPS. That optimises for self-hosting cost but adds ops surface and queue latency. A TS monolith with managed Supabase trades vendor coupling for one language, faster iteration, and horizontal scale without running brokers on a VPS.

## Deployment (critical)

Chapter generation runs 1–3 minutes with SSE streaming and a 5-second time-to-first-token NFR.

- **Hosting:** Vercel (Pro) for Next.js
- **Runtime:** `nodejs` (not `edge`) on LangGraph route handlers; set `maxDuration` high enough for full chapter runs
- **LangGraph lives in Next.js API routes on Vercel Node** — this is the happy path for every "Tulis" click
- **Supabase Queues:** overload only — when concurrent generation slots are full, enqueue with `QUEUED` status; not the default path
- **Supabase Edge Functions:** short tasks only — queue drain cron, webhooks, lightweight post-processing (e.g. embed summary to pgvector after save). **Not** the LangGraph ghostwriter pipeline

Do not run LangGraph on Supabase Edge Functions (256 MB RAM, wall-clock limits) or on Vercel Edge runtime.

## Component mapping

| Concern | Implementation |
|---------|----------------|
| UI | Next.js App Router |
| CRUD + triggers | Next.js API routes |
| AI pipeline | LangGraph.js (planner → ghostwriter → summarizer) |
| LLM | OpenRouter TypeScript SDK |
| Users / auth | Supabase Auth (email + password; display name in `user_metadata`) |
| Novels, chapters, snapshots | Supabase Postgres + RLS |
| Chapter summary RAG | pgvector on Supabase (recent 20 + top 10 retrieved per ADR-0003) |
| Derived canon | Mem0 Cloud |
| LangGraph state | `@langchain/langgraph-checkpoint-postgres` on Supabase Postgres |
| Background / overflow | Supabase Queues (pgmq); consumer via API route cron or dedicated worker process |
| Object storage | Supabase Storage (deferred — no export in v1) |

## Supersedes

- Brief: Go Fiber, FastAPI, Nginx, Docker Compose on single VPS, Neon, Inngest, local Qdrant, local Mem0, Cloudflare R2
- ADR-0001 dual-token JWT: **partially superseded** — Supabase Auth issues session JWTs; API routes validate via Supabase server client unless a custom token layer is added later

## Risks

- LangGraph.js is production-viable but younger than Python; use Postgres checkpointer, not MemorySaver
- Mem0 Cloud + Supabase + OpenRouter = three external dependencies; acceptable for early access
- Supabase Edge Functions are **not** the primary worker for 3-minute generation jobs — too short and wrong runtime for LangGraph
