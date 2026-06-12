<div align="center">

# Novyl

**AI-Powered Novel Ghostwriter**

Platform SaaS for writers to collaborate with AI Agents in writing long-form novels chapter by chapter, with consistency maintained across hundreds of chapters.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-proprietary-red)

[Getting Started](#getting-started) · [Documentation](#documentation) · [License](#license)

</div>

> [!CAUTION]
> **LICENSE WARNING — PROPRIETARY SOFTWARE**
>
> This project is **NOT open source**. It is protected by a **Custom Proprietary License** owned by **Muhammad Rafa Shaquille Pradana**.
>
> You are **ONLY** allowed to view the source code and run it locally for evaluation. **DO NOT** modify, distribute, resell, rebrand, fork, or use this project commercially without explicit written permission. Violations will result in **legal action and criminal referral** under applicable copyright and intellectual property laws.
>
> See [`LICENSE.md`](./LICENSE.md) for full terms.

---

## About

Novyl solves the core problem faced by novel writers using general-purpose AI: **plot holes, forgotten character details, and inconsistent lore** as manuscripts grow past a few dozen chapters.

Unlike typical AI generators that treat each session in isolation, Novyl uses a **Multi-Agent System** and **Dynamic Context Management** to keep stories consistent from Chapter 1 to Chapter 500+.

**Status:** Early access — open signup, no billing, no export.

## Features

| Feature | Description |
|---------|-------------|
| **Sequential Chapter Generation** | AI writes chapters in order with dynamic context gathering |
| **4-Phase AI Pipeline** | Context Gathering → Scene Planning → Incremental Generation → Finalization |
| **Consistency Engine** | Declared canon, Derived canon (Mem0), chapter summaries, pgvector RAG |
| **Stale Chapter Tracking** | Automatic warnings when upstream changes affect later chapters |
| **Plot Checkpoints** | Opt-in mode to approve/reject irreversible story beats |
| **Partial Rewrite** | Rewrite selected passages without regenerating the entire chapter |
| **Full Chapter Regeneration** | Regenerate a chapter from outline + point-in-time context snapshot |
| **Story Memory Sync** | Explicit AI memory synchronization after manual edits |

## Tech Stack

```
┌─────────────────────────────────────────────────────┐
│  Frontend + API                                      │
│  Next.js 16 (App Router, TypeScript, Node runtime)  │
├─────────────────────────────────────────────────────┤
│  AI Pipeline                                         │
│  LangGraph.js · OpenRouter (Gemini Flash / Lite)    │
├─────────────────────────────────────────────────────┤
│  Data                                                │
│  Supabase — PostgreSQL · Auth · pgvector · pgmq      │
├─────────────────────────────────────────────────────┤
│  Entity Memory                                       │
│  Mem0 Cloud (Derived canon)                          │
├─────────────────────────────────────────────────────┤
│  UI                                                  │
│  shadcn/ui · Tiptap · Tailwind CSS                   │
└─────────────────────────────────────────────────────┘
```

## Getting Started

### 1. Clone repository

```bash
git clone https://github.com/rafapradana/novyl.git
cd novyl
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key

# Mem0 Cloud
MEM0_API_KEY=your-mem0-key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

| Document | Description |
|----------|-------------|
| [`CONTEXT.md`](./CONTEXT.md) | Domain glossary, business rules, Chapter lifecycle |
| [`docs/brief.md`](./docs/brief.md) | Executive summary, stack, AI pipeline, NFR |
| [`docs/prd-v1.md`](./docs/prd-v1.md) | Full PRD: user stories, backend modules, API contracts |
| [`docs/adr/`](./docs/adr/) | Architecture Decision Records (4 ADRs) |
| [`docs/ui/`](./docs/ui/) | UI plan: pages, modals, components, user flows |

## License

> [!WARNING]
> This project is **proprietary**. It is **NOT** open source. All rights reserved by **Muhammad Rafa Shaquille Pradana**.
>
> - **ALLOWED:** View source code, run locally for evaluation
> - **FORBIDDEN:** Modify, distribute, resell, rebrand, fork, commercial use
>
> Full license: [`LICENSE.md`](./LICENSE.md)

---

<div align="center">

Made with care by [Muhammad Rafa Shaquille Pradana](https://github.com/rafapradana)

</div>
