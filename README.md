<div align="center">

# Novyl

**AI-Powered Novel Ghostwriter**

Platform SaaS bagi penulis untuk berkolaborasi dengan AI Agents dalam menulis novel panjang secara terstruktur dan konsisten — menjaga konsistensi lore, plot, dan karakter hingga ratusan bab.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-proprietary-red)

[Getting Started](#getting-started) · [Dokumentasi](#dokumentasi) · [License](#license)

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

## Tentang

Novyl menyelesaikan masalah utama penulis novel yang menggunakan AI general-purpose: **plot holes, karakter lupa detail, dan inkonsistensi lore** saat manuskrip melebihi beberapa puluh bab.

Berbeda dengan AI generator biasa yang memperlakukan setiap sesi secara terisolasi, Novyl menggunakan **Multi-Agent System** dan **Dynamic Context Management** untuk menjaga cerita konsisten dari Bab 1 hingga Bab 500+.

**Status:** Early access — open signup, tanpa billing, tanpa export.

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Sequential Chapter Generation** | AI menulis bab berurutan dengan context gathering dinamis |
| **4-Phase AI Pipeline** | Context Gathering → Scene Planning → Incremental Generation → Finalization |
| **Consistency Engine** | Declared canon, Derived canon (Mem0), chapter summaries, pgvector RAG |
| **Stale Chapter Tracking** | Peringatan otomatis jika perubahan upstream mempengaruhi bab berikutnya |
| **Plot Checkpoints** | Mode opt-in untuk approve/reject beat cerita irreversible |
| **Partial Rewrite** | Rewrite bagian tertentu tanpa regenerate seluruh bab |
| **Full Chapter Regeneration** | Regenerate bab dari outline + context snapshot point-in-time |
| **Story Memory Sync** | Sinkronisasi memori AI secara eksplisit setelah edit manual |

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

Buat file `.env.local` di root project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-key

# Mem0 Cloud
MEM0_API_KEY=your-mem0-key
```

### 4. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [`CONTEXT.md`](./CONTEXT.md) | Domain glossary, aturan bisnis, lifecycle Chapter |
| [`docs/brief.md`](./docs/brief.md) | Executive summary, stack, pipeline AI, NFR |
| [`docs/prd-v1.md`](./docs/prd-v1.md) | PRD lengkap: user stories, modul backend, API contracts |
| [`docs/adr/`](./docs/adr/) | Architecture Decision Records (4 ADR) |
| [`docs/ui/`](./docs/ui/) | UI plan: halaman, modal, komponen, user flows |

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
