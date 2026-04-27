# Novyl AI

<p align="center">
  <strong>AI Novel Ghostwriter Platform</strong>
</p>

<p align="center">
  Write bestselling novels faster with AI. A structured, editor-first platform for novel writers.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS v4">
  <img src="https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=flat-square" alt="Drizzle ORM">
  <img src="https://img.shields.io/badge/Better_Auth-v1-000000?style=flat-square" alt="Better Auth">
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone & Install](#1-clone--install)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Database Setup](#3-database-setup)
  - [4. Running the App](#4-running-the-app)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Environment Variables Reference](#environment-variables-reference)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

Novyl AI is a full-stack web application designed to help writers create novels faster using AI-assisted tools. The platform provides a structured workflow for managing novels, chapters, characters, and settings — all within a clean, distraction-free editor interface.

**Key Philosophy:**
- **Editor-first approach** — Focus on writing, not configuration
- **Structured workflow** — Built-in support for premise, synopsis, characters, and settings
- **Responsive design** — Fully functional on desktop, tablet, and mobile
- **Black & white aesthetic** — Minimal, distraction-free UI using Geist Sans and Geist Mono fonts

---

## Features

### Authentication
- Email/password registration and login
- Password reset flow via email (Resend)
- Session-based authentication with Better Auth
- Protected dashboard routes

### Novel Management
- **7-Step Novel Creation Wizard:**
  1. Title input
  2. Genre selection (11 genres)
  3. Premise writing
  4. Synopsis writing
  5. Character management (add/remove)
  6. Setting management (add/remove)
  7. Summary review & submit
- Responsive wizard with Framer Motion transitions
- Novel grid dashboard with search functionality
- 3D book cover with hover animations

### Novel Editor
- Chapter-based editor with title, outline, and content
- Auto-save with 2-second debounce
- Progressive blur overlays for scroll fade effects
- Floating navigation pills for quick chapter switching
- Keyboard shortcuts (Ctrl+S for manual save)
- Chapter reordering support

### UI/UX
- shadcn/ui component system
- Skeleton loading states
- Toast notifications (Sonner)
- Accessible design (ARIA labels, keyboard navigation)
- Mobile-first responsive design

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, React Server Components) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4, shadcn/ui |
| **Fonts** | Geist Sans (UI), Geist Mono (editor) |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Drizzle ORM with Drizzle Kit |
| **Auth** | Better Auth (email/password, session-based) |
| **Email** | Resend (lazy-loaded) |
| **Animation** | Framer Motion |
| **Icons** | Lucide React, Hugeicons React |
| **Validation** | Zod (via Better Auth) |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** `>= 20.0.0` (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** `>= 10.0.0` (comes with Node.js)
- **PostgreSQL** database (local or cloud — [Supabase](https://supabase.com) recommended)
- **Git** for version control

### Recommended Tools
- [VS Code](https://code.visualstudio.com/) with extensions:
  - Tailwind CSS IntelliSense
  - TypeScript Importer
  - ESLint

---

## Getting Started

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd novyl

# Install dependencies
npm install
```

### 2. Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables Reference](#environment-variables-reference) below).

### 3. Database Setup

#### Option A: Supabase (Recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings → Database → Connection String
3. Copy the PostgreSQL connection string
4. Paste it into your `.env` as `DATABASE_URL`

#### Option B: Local PostgreSQL

```bash
# macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16

# Create database
createdb novyl

# Set DATABASE_URL in .env
# DATABASE_URL="postgresql://localhost:5432/novyl"
```

#### Run Migrations

```bash
# Push schema to database
npx drizzle-kit push

# Or generate and run migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 4. Running the App

```bash
# Development server
npm run dev

# Open http://localhost:3000
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
novyl/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Login page
│   │   ├── register/page.tsx     # Register page
│   │   ├── forgot-password/      # Forgot password
│   │   └── reset-password/       # Reset password
│   ├── (dashboard)/              # Dashboard route group (protected)
│   │   ├── layout.tsx            # Dashboard layout with auth guard
│   │   ├── dashboard/page.tsx    # Novel grid dashboard
│   │   └── novel/
│   │       ├── create/page.tsx   # 7-step novel wizard
│   │       └── [id]/edit/page.tsx # Novel editor
│   ├── api/auth/[...all]/route.ts # Better Auth API handler
│   ├── globals.css               # Global styles & Tailwind
│   ├── layout.tsx                # Root layout (fonts, providers)
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── book-cover.tsx            # 3D book cover component
│   ├── header-editor.tsx         # Editor header
│   └── progressive-blur.tsx      # Blur overlay component
├── db/
│   ├── schema.ts                 # Drizzle schema definition
│   └── migrations/               # Database migrations
├── hooks/
│   └── use-auth.ts               # Authentication hook
├── lib/
│   ├── actions/                  # Server Actions
│   │   ├── novel-actions.ts      # Novel CRUD
│   │   ├── chapter-actions.ts    # Chapter CRUD
│   │   ├── character-actions.ts  # Character CRUD
│   │   └── setting-actions.ts    # Setting CRUD
│   ├── auth.ts                   # Better Auth configuration
│   ├── auth-client.ts            # Auth client for React
│   ├── db.ts                     # Database connection
│   ├── schema.ts                 # Schema re-export
│   └── utils.ts                  # Utility functions (cn)
├── types/
│   ├── novel.ts                  # Novel type definitions
│   ├── chapter.ts                # Chapter type definitions
│   ├── character.ts              # Character type definitions
│   └── setting.ts                # Setting type definitions
├── .env.example                  # Environment variables template
├── components.json               # shadcn/ui configuration
├── drizzle.config.ts             # Drizzle Kit configuration
├── next.config.ts                # Next.js configuration
├── postcss.config.mjs            # PostCSS configuration
├── proxy.ts                      # Next.js 16 proxy (auth middleware)
└── tsconfig.json                 # TypeScript configuration
```

---

## Authentication

Novyl uses [Better Auth](https://www.better-auth.com/) for authentication with the following features:

- **Email/Password** authentication with bcrypt hashing
- **Session management** with HTTP-only cookies
- **Password reset** via email (Resend)
- **Email verification** (optional, configurable)

### Auth Flow

1. User registers at `/register` → account created
2. User logs in at `/login` → session cookie set
3. Dashboard layout checks auth status → redirects if unauthenticated
4. User logs out → session destroyed, page reloads

### Auth API

All auth endpoints are handled by Better Auth at `/api/auth/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-up` | POST | Register new user |
| `/api/auth/sign-in` | POST | Login user |
| `/api/auth/sign-out` | POST | Logout user |
| `/api/auth/reset-password` | POST | Request password reset |
| `/api/auth/session` | GET | Get current session |

---

## Database Schema

### Better Auth Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `sessions` | Active sessions |
| `accounts` | OAuth accounts (future) |
| `verifications` | Email verification tokens |

### App Tables

| Table | Purpose | Relations |
|-------|---------|-----------|
| `novels` | Novel metadata | `user` (1), `characters` (N), `settings` (N), `chapters` (N) |
| `characters` | Novel characters | `novel` (1) |
| `settings` | Novel settings/locations | `novel` (1) |
| `chapters` | Novel chapters | `novel` (1) |

### Indexes

- `session_user_id_idx` on `sessions(user_id)`
- `account_user_id_idx` on `accounts(user_id)`
- `verification_identifier_idx` on `verifications(identifier)`
- `novel_user_id_idx` on `novels(user_id)`
- `character_novel_id_idx` on `characters(novel_id)`
- `setting_novel_id_idx` on `settings(novel_id)`
- `chapter_novel_id_idx` on `chapters(novel_id)`
- `chapter_order_idx` on `chapters(order)`

---

## API Routes

### Auth API
Handled by Better Auth at `/api/auth/[...all]`.

### Server Actions

All data mutations use Next.js Server Actions for type-safe, server-side operations:

| Action | File | Description |
|--------|------|-------------|
| `createNovel` | `novel-actions.ts` | Create novel with characters, settings, and first chapter |
| `getNovelsByUser` | `novel-actions.ts` | List user's novels with chapter counts |
| `getNovelById` | `novel-actions.ts` | Get novel detail with all relations |
| `updateNovel` | `novel-actions.ts` | Update novel metadata |
| `deleteNovel` | `novel-actions.ts` | Delete novel and cascade relations |
| `createChapter` | `chapter-actions.ts` | Create new chapter |
| `updateChapter` | `chapter-actions.ts` | Update chapter content |
| `deleteChapter` | `chapter-actions.ts` | Delete chapter |
| `reorderChapters` | `chapter-actions.ts` | Reorder chapters |
| `createCharacter` | `character-actions.ts` | Add character to novel |
| `updateCharacter` | `character-actions.ts` | Update character |
| `deleteCharacter` | `character-actions.ts` | Remove character |
| `createSetting` | `setting-actions.ts` | Add setting to novel |
| `updateSetting` | `setting-actions.ts` | Update setting |
| `deleteSetting` | `setting-actions.ts` | Remove setting |

---

## Environment Variables Reference

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | — | Secret key for auth (min 32 chars) |
| `BETTER_AUTH_URL` | ✅ | `http://localhost:3000` | Auth base URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` | Public app URL |
| `RESEND_API_KEY` | ❌ | — | Resend API key for emails |
| `FROM_EMAIL` | ❌ | `onboarding@resend.dev` | Sender email address |

### Generating Auth Secret

```bash
# Generate a secure random string
openssl rand -base64 32
```

---

## Development Workflow

### Available Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Database Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Push schema directly (development)
npx drizzle-kit push

# Run pending migrations
npx drizzle-kit migrate

# Open Drizzle Studio (GUI)
npx drizzle-kit studio
```

### Code Style

- **TypeScript:** Strict mode enabled
- **Imports:** Use `@/` alias for project files
- **Components:** PascalCase with default exports
- **Hooks:** camelCase prefixed with `use`
- **Server Actions:** camelCase with `"use server"` directive

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in project settings
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="your-production-secret"
BETTER_AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@your-domain.com"
```

### Build Configuration

The project uses Next.js 16 with Turbopack for fast development builds. No custom build configuration required.

---

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Check if migrations are applied
npx drizzle-kit migrate
```

### Auth Issues

- Ensure `BETTER_AUTH_SECRET` is at least 32 characters
- Verify `BETTER_AUTH_URL` matches your actual URL
- Check that `DATABASE_URL` is accessible from the app

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Type check
npx tsc --noEmit
```

### Email Not Sending

- Without `RESEND_API_KEY`, emails are logged to console (dev mode)
- Add `RESEND_API_KEY` for production email delivery
- Verify `FROM_EMAIL` domain is verified in Resend

---

## License

[MIT License](LICENSE) © 2024 Novyl AI

---

<p align="center">
  Built with ❤️ for writers everywhere
</p>
