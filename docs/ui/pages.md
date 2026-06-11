# Pages & Layout

## Route map

| Route | Auth | Deskripsi |
|-------|------|-----------|
| `/` | — | Redirect: `/novels` jika session ada, else `/login` |
| `/login` | Public | Sign-in & sign-up (tab satu halaman) |
| `/novels` | Required | Library novel (aktif + arsip) |
| `/novels/[novelId]` | Required | Workspace novel: sidebar bab + panel editor |

**Tidak ada route terpisah** untuk: create novel, edit metadata, profil karakter/lokasi, outline bab, settings akun — semua via modal ([modals.md](./modals.md)).

Deep link opsional di workspace: `/novels/[novelId]?chapter=12`.

---

## App shell (setelah login)

Layout bersama untuk `/novels` dan `/novels/[novelId]` — shadcn **Sidebar** block.

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo Novyl]              [Badge stale?]     [Avatar ▼]     │
├──────────────┬──────────────────────────────────────────────┤
│ Sidebar      │ Main content                                 │
│              │                                              │
│ • Novel saya │                                              │
│ • Arsip      │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

| Area | `/novels` | `/novels/[novelId]` |
|------|-----------|---------------------|
| Sidebar | Nav + CTA **Novel baru** | **Daftar Chapter** (urut, badge status) |
| Main | Grid card novel | Editor / stream / empty state |
| Header kanan | Avatar → menu akun | Judul novel + menu novel + stale badge |

**Mobile:** daftar bab → `Sheet` dari kiri; editor full width.

---

## `/login`

**Block:** shadcn login (mis. `login-03`) dengan tab **Masuk** | **Daftar**.

### Sign up

| Field | Validasi |
|-------|----------|
| Display name | Wajib |
| Email | Wajib |
| Password | Wajib |

### Sign in

| Field | Validasi |
|-------|----------|
| Email | Wajib |
| Password | Wajib |

**Perilaku:**
- Submit → Supabase Auth → redirect `/novels`
- Tanpa forgot password & verifikasi email (v1)
- Copy UI: Bahasa Indonesia

---

## `/novels` — Library

### Header main

- Judul: **Novel saya**
- Tombol primary: **Novel baru** → [modal Novel baru](./modals.md#novel-baru)
- `Tabs`: **Aktif** | **Arsip**

### Grid novel

Setiap `Card`:

| Elemen | Keterangan |
|--------|------------|
| Judul | Link ke workspace |
| Genre | Subtitle |
| Badge | `Completed novel`, `Archived novel` |
| Meta | Jumlah Chapter; badge jumlah **Stale chapters** (jika > 0) |
| Menu `DropdownMenu` | Buka · Pengaturan novel · Arsipkan · Pulihkan · Hapus permanen |

**Klik card** → `/novels/[novelId]`.

### Empty state

Ilustrasi + teks + CTA **Buat novel pertama** → modal Novel baru.

---

## `/novels/[novelId]` — Workspace

Satu halaman untuk seluruh siklus menulis satu Novel.

### Header novel (main top bar)

| Elemen | Aksi |
|--------|------|
| Judul novel | Klik → modal **Pengaturan novel** |
| Badge `Completed novel` | Informatif |
| Badge stale (N bab usang) | Klik → modal **Bab usang** |
| `DropdownMenu` | Pengaturan · Tandai selesai · Blurb · Arsipkan · Pulihkan · Hapus novel |

**Archived novel:** `Alert` banner di atas main — generasi & Tulis dinonaktifkan sampai dipulihkan.

### Sidebar: daftar Chapter

Setiap baris (`chapter-list-item`):

| Elemen | Keterangan |
|--------|------------|
| Nomor + judul | Urutan manuskrip |
| `Badge` status | `DRAFT` · `OUTLINED` · `QUEUED` · `WRITING` · `COMPLETED` |
| Antrian | Jika `QUEUED`: teks "Posisi #n" |
| Icon stale | Jika flagged & belum dismiss |
| Menu baris | Edit outline · Hapus (sesuai rules) |

Footer sidebar: **+ Bab baru** → modal.

**Klik baris** → load Chapter di main panel; update `?chapter=` di URL.

### Main panel — by Chapter status

| Status | Konten main panel |
|--------|-------------------|
| **DRAFT** | Empty state: "Isi outline untuk mulai" + CTA → modal outline |
| **OUTLINED** | Read-only preview outline + tombol primary **Tulis** |
| **QUEUED** | `Skeleton` + "Menunggu antrian — posisi #n" |
| **WRITING** | Editor streaming (read-only saat stream) + indikator progress; [Plot checkpoint](./modals.md#plot-checkpoint) overlay jika aktif |
| **COMPLETED** | Rich text editor penuh + toolbar aksi |

### Toolbar editor (`COMPLETED` & setelah stream selesai)

```
[Tersimpan ✓]   [Sinkron memori cerita]   [Tulis ulang bab]   [Hapus bab]
```

| Tombol | Destinasi |
|--------|-----------|
| Sinkron memori cerita | [AlertDialog konfirmasi](./modals.md#sinkron-memori-cerita) |
| Tulis ulang bab | [AlertDialog full regen](./modals.md#tulis-ulang-bab) |
| Hapus bab | [AlertDialog hapus bab](./modals.md#hapus-bab) |

### Partial rewrite (in-page, bukan halaman)

1. User select teks di editor
2. Floating bubble: **Tulis ulang bagian**
3. → [Dialog feedback](./modals.md#tulis-ulang-bagian)
4. Stream ganti selection in-place
5. Auto **Story memory sync** setelah selesai (tanpa modal tambahan)

### Inline feedback (bukan modal)

| State | UI |
|-------|-----|
| Auto-save Chapter text | `Sonner` subtle atau label "Tersimpan" di toolbar |
| **Outline drift** | `Alert` kuning di atas editor |
| Error generasi | `Sonner` / `Alert` destructive |
| Sukses COMPLETED | `Sonner` singkat |

---

## Global: menu akun (bukan route)

Trigger: avatar di header → `DropdownMenu`

| Item | Aksi |
|------|------|
| Pengaturan akun | [Dialog](./modals.md#pengaturan-akun) |
| Hapus akun | [AlertDialog](./modals.md#hapus-akun) |
| Keluar | Sign out → `/login` |
