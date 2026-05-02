# Techstack Novyl AI

## Core Framework
- **Framework:** Next.js 16 (App Router, React Server Components, Turbopack)
- **Language:** TypeScript 5 (Strict mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Fonts:** Geist Sans (UI), Geist Mono (editor)

## Database & ORM
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM + Drizzle Kit
- **Connection:** Connection string via environment variables (bukan Supabase JS/TS SDK)
- **Migrations:** Drizzle Kit (generate, push, migrate)

## Authentication
- **Library:** Better Auth v1
- **Features:** Email/password, session-based (HTTP-only cookies), password reset via email
- **Email Service:** Resend (lazy-loaded, fallback ke console log jika tidak dikonfigurasi)

## AI Integration
- **Provider:** OpenRouter SDK
- **Primary Model:** `x-ai/grok-4.1-fast`
- **Fallback Model:** `deepseek/deepseek-v4-flash`
- **Temperature:** 0.7–0.8
- **Output Mode:** Batch (non-streaming) per bab untuk kualitas konsisten

## UI & UX
- **Components:** shadcn/ui (Radix UI primitives + Tailwind)
- **Animations:** Framer Motion (page transitions, gestures, progress bar)
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)
- **Loading:** Skeleton components

## Architecture

### Client-Driven Orchestration (No Background Jobs)
- **Orchestrator:** Browser tab via `useGeneration` React hook
- **Lifecycle:** Tab terbuka = generate, tab ditutup = stop (AbortController), tab dibuka kembali = resume dari langkah terakhir
- **API Design:** Atomic, idempotent step endpoints (characters, settings, chapters, blurb, cancel)
- **State Management:** React `useState` + refs (AbortController, cancellation flags)

### Server
- **API Routes:** Next.js Route Handlers (`/api/novels/[id]/generate/*`)
- **Server Actions:** Next.js Server Actions untuk CRUD novel, bab, karakter, latar
- **Auth Middleware:** Better Auth API handler di `/api/auth/[...all]`

## Project Configuration
- **Build Tool:** Next.js built-in (Turbopack for dev)
- **Linting:** ESLint
- **Path Alias:** `@/` untuk project imports
- **Package Manager:** npm

## Deployment
- **Platform:** Vercel (recommended)
- **Environment:** Node.js ≥ 20

## Removed Dependencies
- ~~Vercel Workflow SDK~~ (direplace dengan client-driven orchestration)
- ~~`@workflow/next`~~
- ~~`workflow`~~
