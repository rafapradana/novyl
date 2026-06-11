# Components & shadcn Setup

## Inisialisasi

```bash
npx shadcn@latest init
npx shadcn@latest add button dialog alert-dialog sheet form input textarea select badge tabs dropdown-menu sonner scroll-area separator skeleton progress alert card avatar tooltip sidebar label
```

Tambahkan **blocks** setelah primitives ada:

```bash
npx shadcn@latest add login-03    # atau block login yang dipilih
npx shadcn@latest add sidebar-07  # app shell + sidebar
```

Sesuaikan token/theme (font, radius) sekali di `globals.css` — jangan fork komponen `ui/` kecuali perlu.

---

## Struktur folder

```
src/
  app/
    (auth)/
      login/page.tsx
    (app)/
      layout.tsx              # AppShell + SidebarProvider
      novels/
        page.tsx              # Library
        [novelId]/page.tsx    # Workspace
  components/
    ui/                       # shadcn CLI — jangan edit manual kecuali perlu
    layout/
      app-shell.tsx           # header + sidebar slot
      app-sidebar-nav.tsx     # nav library (Novel saya, Arsip)
      novel-chapter-sidebar.tsx
      user-nav.tsx            # avatar → account modals
    novels/
      novel-card.tsx
      novel-grid.tsx
      novel-create-dialog.tsx
      novel-settings-dialog.tsx
      novel-archive-dialog.tsx
      novel-delete-dialog.tsx
      novel-complete-dialog.tsx
      blurb-dialog.tsx
      profile-form-dialog.tsx   # karakter & lokasi shared
    chapters/
      chapter-list-item.tsx
      chapter-editor.tsx        # Tiptap wrapper
      chapter-editor-toolbar.tsx
      chapter-create-dialog.tsx
      chapter-outline-dialog.tsx
      chapter-delete-dialog.tsx
      partial-rewrite-dialog.tsx
      plot-checkpoint-dialog.tsx
      full-regen-dialog.tsx
      story-memory-sync-dialog.tsx
      stale-chapters-dialog.tsx
      dismiss-stale-dialog.tsx
    account/
      account-settings-dialog.tsx
      account-delete-dialog.tsx
    shared/
      confirm-type-dialog.tsx   # reusable: ketik judul / email
      genre-select.tsx          # preset + Other
      writing-language-select.tsx
```

---

## Pola modal-based CRUD

### Create / Update (`Dialog`)

```tsx
// Pola umum — pseudo
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* fields */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button type="submit">Simpan</Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

- Schema zod di `lib/validations/novel.ts`, `chapter.ts`, dll.
- Server Actions atau `fetch` ke Route Handlers
- `onSuccess`: `setOpen(false)` + `toast.success()` + `router.refresh()`

### Delete / confirm (`AlertDialog`)

- Gunakan `confirm-type-dialog.tsx` untuk hapus novel (ketik judul) & hapus akun (ketik email)
- Tombol destructive: `variant="destructive"`, disabled sampai input cocok

### Nested CRUD (profil karakter)

Opsi A (disarankan): **dialog sequential** — tutup pengaturan novel tidak perlu; buka dialog profil di atas (`Dialog` stack).  
Opsi B: inline `Collapsible` + form di tab — kurang “modal CRUD” murni.

---

## Komponen kunci

### `novel-create-dialog.tsx`

Field: title, genre (+ other), writing language, **premise**, synopsis.

Premise di atas synopsis (hook dulu, plot lengkap kemudian). Helper text ID.

### `novel-settings-dialog.tsx`

`Tabs`: Umum | Gaya | Karakter | Lokasi | Lanjutan.

Tab Umum: edit premise & synopsis dengan guard stale (AlertDialog sebelum save).

### `chapter-editor.tsx`

- Tiptap + extension minimal: bold, italic, heading opsional, paragraph
- Props: `chapterId`, `status`, `content`, `onSave`, `streamEndpoint?`
- Saat `WRITING`: disable edit, append stream tokens
- Bubble menu on selection → buka `partial-rewrite-dialog`

### `chapter-list-item.tsx`

Badge mapping:

| Status | Variant badge |
|--------|---------------|
| DRAFT | `secondary` |
| OUTLINED | `outline` |
| QUEUED | `secondary` + teks posisi |
| WRITING | `default` + pulse opsional |
| COMPLETED | `default` / hijau subtle |

Icon stale: `AlertTriangle` + tooltip.

### `confirm-type-dialog.tsx`

Props generik:

```ts
type ConfirmTypeDialogProps = {
  title: string
  description: string
  confirmLabel: string
  expectedValue: string   // judul novel atau email
  onConfirm: () => Promise<void>
}
```

---

## shadcn blocks yang dipakai

| Block | Pemakaian |
|-------|-----------|
| `login-03` (atau setara) | Halaman `/login` |
| `sidebar-07` / `sidebar-08` | App shell: nav + chapter sidebar |

Workspace novel: composable — `app-sidebar-nav` untuk `/novels`, ganti sidebar content ke `novel-chapter-sidebar` di `/novels/[id]` (shared layout `(app)`).

---

## Rich text (Tiptap)

Bukan shadcn — bungkus agar visual konsisten:

- Toolbar: `Toggle`, `Button`, `Separator` dari shadcn
- Content: `prose prose-neutral dark:prose-invert` + border `rounded-md`
- Placeholder saat DRAFT/OUTLINED preview: `Card` + `ScrollArea`

---

## Streaming SSE

`chapter-editor` atau hook `useChapterStream`:

1. `POST /api/chapters/:id/write` → `{ streamUrl }` atau langsung `EventSource`
2. Append delta ke doc Tiptap
3. On complete: refresh status → COMPLETED, enable toolbar penuh

Indikator: `Progress` indeterminate atau dot animasi di toolbar saat WRITING.

---

## i18n (v1)

- File `messages/id.json` dengan key flat atau nested
- Hook `t('novel.create.title')` — UI Indonesia hardcoded v1 OK, tapi struktur key dari hari pertama
- **Jangan** campur Writing language novel ke string UI

---

## Aksesibilitas

- Semua `Dialog` / `AlertDialog`: focus trap default shadcn/Radix
- Plot checkpoint: `aria-modal`, tidak dismiss dengan Esc (blocking)
- Status bab: jangan hanya warna — selalu ada label teks di badge
