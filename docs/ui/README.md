# Novyl UI Plan (v1)

Rencana antarmuka untuk early access: **sedikit halaman**, **CRUD berbasis modal**, semua komponen UI memakai **[shadcn/ui](https://ui.shadcn.com/)** (primitives + blocks).

Domain vocabulary: [`CONTEXT.md`](../../CONTEXT.md). Arsitektur: [`docs/brief.md`](../brief.md), [`docs/prd-v1.md`](../prd-v1.md).

## Dokumen

| File | Isi |
|------|-----|
| [pages.md](./pages.md) | Route, layout shell, konten per halaman |
| [modals.md](./modals.md) | Semua Dialog / AlertDialog — trigger, field, perilaku |
| [flows.md](./flows.md) | Alur pengguna utama (diagram + urutan langkah) |
| [components.md](./components.md) | Struktur folder komponen, shadcn blocks, pola CRUD |

## Prinsip desain

| Prinsip | Implementasi |
|---------|----------------|
| **Modal-based CRUD** | Create / edit / delete entitas & form panjang → `Dialog` atau `AlertDialog`; halaman hanya untuk workspace |
| **Satu workspace per Novel** | Route `/novels/[novelId]` = pusat kerja; tidak ada halaman terpisah per Chapter |
| **Status = badge + inline** | `QUEUED`, `WRITING`, stale → badge di daftar bab, bukan halaman status |
| **Destructive = AlertDialog** | Hard delete, hapus akun, dismiss stale → konfirmasi eksplisit (sering ketik teks) |
| **Bahasa UI** | Indonesia v1; string key-based untuk i18n nanti |
| **Writing language** | Hanya pengaturan Novel; terpisah dari bahasa UI |

## Stack UI

- **Framework:** Next.js App Router
- **Komponen:** shadcn/ui (`Button`, `Dialog`, `AlertDialog`, `Sheet`, `Form`, `Input`, `Textarea`, `Select`, `Badge`, `Tabs`, `DropdownMenu`, `Sonner`, `ScrollArea`, `Alert`, `Card`, `Sidebar`, dll.)
- **Blocks:** layout auth + app shell (lihat [components.md](./components.md))
- **Form:** `react-hook-form` + `zod`
- **Rich text:** Tiptap (atau setara), di-style dengan token shadcn — **bukan** komponen shadcn bawaan
- **Streaming:** SSE ke panel editor saat `WRITING`

## Route ringkas

```
/                    → redirect ke /novels (auth) atau /login
/login               → masuk & daftar
/novels              → library novel
/novels/[novelId]    → workspace novel (daftar bab + editor)
```

Detail per halaman: [pages.md](./pages.md).

## Core context (Novel)

Input wajib saat buat Novel — semuanya **user-authored**, AI tidak pernah generate atau edit:

| Field | Peran dalam generasi |
|-------|----------------------|
| **Novel title** | Identitas; konfirmasi hard delete |
| **Genre** | Preset atau Other + teks bebas |
| **Writing language** | Bahasa output Chapter text, summary, blurb |
| **Premise** | Hook / setup cerita — inti konflik & premis (core context) |
| **Synopsis** | Alur plot lengkap awal–akhir (core context) |

Keduanya (**Premise** + **Synopsis**) selalu masuk macro context gathering (Fase 1 pipeline). Detail form: [modals.md](./modals.md#novel-baru).

## Yang sengaja bukan modal

| Halaman penuh | Alasan |
|---------------|--------|
| Login | Fokus auth |
| Editor Chapter | Butuh ruang layar; streaming + select text untuk partial rewrite |
| Library | Overview banyak Novel |
