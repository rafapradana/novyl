# Modals & Dialogs

Semua CRUD non-destruktif → **`Dialog`** + `Form` (react-hook-form + zod).  
Konfirmasi destruktif / irreversible → **`AlertDialog`** (sering dengan field ketik-teks).

Pola sukses: submit → API → `router.refresh()` / invalidate query → tutup modal → `Sonner` toast.

---

## Novel

### Novel baru

| | |
|---|---|
| **Trigger** | CTA **Novel baru** di library; empty state |
| **Komponen** | `Dialog` + `Form` |
| **Ukuran** | `max-w-lg` atau `max-w-xl` (sinopsis panjang) |

**Field (semua wajib kecuali disebut):**

| Field | UI | Catatan |
|-------|-----|---------|
| Novel title | `Input` | |
| Genre | `Select` preset + opsi **Lainnya** | Jika Lainnya: `Input` teks bebas muncul |
| Writing language | `Select` | Bahasa output AI |
| **Premise** | `Textarea` | Hook / setup; core context — lihat [`CONTEXT.md`](../../CONTEXT.md) |
| Synopsis | `Textarea` | Plot lengkap awal–akhir; core context |

**Genre presets (v1):** Fantasy, Science Fiction, Romance, Thriller, Horror, Mystery, Literary Fiction, Historical Fiction, Lainnya.

**Validasi:**
- Premise & Synopsis: minimal panjang (mis. ≥ 50 karakter) — tentukan di zod schema
- AI tidak pernah mengisi field ini

**Submit:** `POST /api/novels` → redirect `/novels/[id]` atau tutup + refresh grid.

**Helper text (ID):**
- Premise: "Ide inti cerita — konflik, dunia, atau hook utama."
- Synopsis: "Alur plot lengkap dari awal hingga akhir."

---

### Pengaturan novel

| | |
|---|---|
| **Trigger** | Klik judul di workspace; menu card/library |
| **Komponen** | `Dialog` + `Tabs` |
| **Ukuran** | `max-w-2xl`, `ScrollArea` untuk tab panjang |

| Tab | Konten |
|-----|--------|
| **Umum** | Premise, Synopsis, default Chapter word count target |
| **Gaya** | Writing style notes (`Textarea`) |
| **Karakter** | List + CRUD sub-modal |
| **Lokasi** | List + CRUD sub-modal |
| **Lanjutan** | Plot checkpoints toggle; Writing language |

**Edit Premise / Synopsis pada Novel dengan Chapter COMPLETED:**
- `AlertDialog` peringatan sebelum save
- Setelah save: semua Chapter COMPLETED → **Stale chapters**

**Writing language:** editable dengan peringatan jika sudah ada Chapter COMPLETED (opsional v1 — atau read-only setelah bab 1).

---

### Sub-modal: Karakter / Lokasi

| | |
|---|---|
| **Trigger** | Tab Karakter/Lokasi → Tambah / Edit baris |
| **Komponen** | `Dialog` nested (atau `Dialog` sequential — tutup list, buka form) |

**Karakter:** nama + deskripsi (penampilan, kepribadian, rahasia, relasi) — `Textarea` atau field terstruktur.

**Lokasi:** nama + deskripsi worldbuilding.

**Hapus:** `AlertDialog` konfirmasi singkat.

---

### Tandai selesai / Batalkan selesai

| | |
|---|---|
| **Trigger** | Menu novel: **Tandai selesai** atau **Batalkan selesai** |
| **Komponen** | `AlertDialog` |

**Tandai selesai:** jika belum ada Blurb → tawarkan buka modal Blurb setelah konfirmasi.

---

### Blurb

| | |
|---|---|
| **Trigger** | Menu novel; prompt setelah tandai selesai |
| **Komponen** | `Dialog` |
| **Prasyarat** | ≥ 1 Chapter COMPLETED |

| Aksi | Perilaku |
|------|----------|
| Generate | Panggil API; isi `Textarea` |
| Edit manual | User edit bebas |
| Simpan | `PATCH` novel metadata |

~100–150 kata; Writing language; minimal spoiler.

---

### Arsipkan novel

| | |
|---|---|
| **Trigger** | Menu novel / card |
| **Komponen** | `AlertDialog` |

Konfirmasi singkat. Setelah arsip: Novel hilang dari tab Aktif; generasi diblokir.

---

### Pulihkan novel

| | |
|---|---|
| **Trigger** | Tab Arsip → menu card |
| **Komponen** | `AlertDialog` atau langsung + toast |

Kembalikan ke tab Aktif.

---

### Hapus novel (hard delete)

| | |
|---|---|
| **Trigger** | Menu novel / card |
| **Komponen** | `AlertDialog` + `Input` |

User harus ketik **Novel title** persis. Tombol hapus disabled sampai cocok.

---

## Chapter

### Bab baru

| | |
|---|---|
| **Trigger** | **+ Bab baru** di sidebar |
| **Komponen** | `Dialog` + `Form` |

| Field | Wajib | Catatan |
|-------|-------|---------|
| Judul bab | Opsional | Boleh kosong di DRAFT |
| Chapter outline | Wajib untuk OUTLINED | Jika kosong → status DRAFT |

**Submit:** tambah baris sidebar; pilih bab baru di main panel.

---

### Edit outline

| | |
|---|---|
| **Trigger** | Menu baris bab; empty state DRAFT |
| **Komponen** | `Dialog` + `Textarea` |

| Status Chapter | Catatan UI |
|----------------|------------|
| DRAFT → isi outline | Transisi ke OUTLINED |
| OUTLINED | Edit bebas |
| COMPLETED | Simpan → tampilkan **Outline drift** `Alert` di editor (bukan stale otomatis) |
| WRITING | Modal diblokir / disabled |

---

### Hapus bab

| | |
|---|---|
| **Trigger** | Toolbar editor; menu baris |
| **Komponen** | `AlertDialog` |

| Status | Rule |
|--------|------|
| DRAFT, OUTLINED | Hapus bebas |
| COMPLETED | Hanya jika ekor manuskrip (tidak ada COMPLETED setelahnya) |
| QUEUED, WRITING | Diblokir |

---

### Plot checkpoint

| | |
|---|---|
| **Trigger** | Otomatis saat pipeline pause (Novel dengan plot checkpoints on) |
| **Komponen** | `Dialog` modal **blocking** (overlay gelap; tidak bisa dismiss sembarangan) |
| **Status** | Chapter tetap WRITING sampai user merespons |

| Aksi | Perilaku |
|------|----------|
| **Setuju** | Lanjut generasi |
| **Tolak** | AI replan outline |
| **Edit** | `Textarea` arahan bebas → update outline → lanjut |

Tanpa timeout v1.

---

### Bab usang (stale list)

| | |
|---|---|
| **Trigger** | Badge stale di header novel |
| **Komponen** | `Dialog` + list |

Setiap baris: nomor bab, penyebab (bab X berubah), tombol **Abaikan** → [Dismiss stale](#abaikan-bab-usang).

---

### Abaikan bab usang

| | |
|---|---|
| **Trigger** | Dari modal Bab usang atau icon per bab |
| **Komponen** | `AlertDialog` |

Konfirmasi singkat. Bab menjadi **Dismissed stale chapter** sampai upstream berubah lagi.

---

### Tulis ulang bagian (partial rewrite)

| | |
|---|---|
| **Trigger** | Select teks → bubble **Tulis ulang bagian** |
| **Komponen** | `Dialog` + `Textarea` feedback |

| Field | Keterangan |
|-------|------------|
| Cuplikan terpilih | Read-only preview |
| Feedback | Instruksi user |

Submit → stream replace selection → auto story memory sync.

---

### Tulis ulang bab (full regeneration)

| | |
|---|---|
| **Trigger** | Toolbar editor |
| **Komponen** | `AlertDialog` |

Konfirmasi: mengganti seluruh Chapter text; bab berikutnya akan di-flag stale.

Blocked jika Chapter WRITING.

---

### Sinkron memori cerita

| | |
|---|---|
| **Trigger** | Toolbar setelah manual edit |
| **Komponen** | `AlertDialog` |

Jelaskan: re-summary, refresh derived canon, update snapshot, flag stale downstream.

---

## Akun

### Pengaturan akun

| | |
|---|---|
| **Trigger** | Avatar menu |
| **Komponen** | `Dialog` |

| Field | Edit? |
|-------|-------|
| Display name | Ya |
| Email | Read-only v1 |

---

### Hapus akun

| | |
|---|---|
| **Trigger** | Pengaturan akun |
| **Komponen** | `AlertDialog` + `Input` |

User ketik **email** persis. Hard delete semua Novel & data; tanpa grace period.

---

## Ringkasan cepat

| Modal | Tipe | Trigger utama |
|-------|------|----------------|
| Novel baru | Dialog | Library CTA |
| Pengaturan novel | Dialog + Tabs | Header / menu |
| Karakter / Lokasi | Dialog | Tab pengaturan |
| Tandai selesai | AlertDialog | Menu novel |
| Blurb | Dialog | Menu / post-complete |
| Arsipkan / Pulihkan | AlertDialog | Menu |
| Hapus novel | AlertDialog + Input | Menu |
| Bab baru | Dialog | Sidebar + |
| Edit outline | Dialog | Sidebar / DRAFT |
| Hapus bab | AlertDialog | Toolbar / menu |
| Plot checkpoint | Dialog blocking | Auto saat WRITING |
| Bab usang | Dialog | Badge stale |
| Abaikan stale | AlertDialog | Stale list |
| Tulis ulang bagian | Dialog | Text selection |
| Tulis ulang bab | AlertDialog | Toolbar |
| Sinkron memori | AlertDialog | Toolbar |
| Pengaturan akun | Dialog | Avatar |
| Hapus akun | AlertDialog + Input | Settings |
