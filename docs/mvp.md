# NOVYL AI — MVP Documentation

**AI Novel Ghostwriter Platform (Phase 1: Editor-First Approach)**

---

## Tujuan MVP

MVP ini fokus pada **fondasi produk**:

* User bisa **register & login**
* User bisa **membuat project novel**
* User bisa **menulis & mengelola novel secara manual (editor-first)**
* Struktur sudah siap untuk integrasi AI di fase berikutnya

**AI generation belum diaktifkan** (hanya prepare data & structure)

## Style

- Warna: Hitam Putih
- Font: Geist untuk hampir semua UI, kecuali font teks isi bab yang ada di halaman editor menggunakan Geist Mono

---

# 1. Arsitektur Halaman

## 1. Landing Page

### Tujuan:

Menjelaskan produk dan mengarahkan user ke auth

### Komponen:

* Hero section

  * Headline: "Write Bestselling Novels Faster with AI"
  * Subheadline
  * CTA: `Get Started`
* Feature highlights:

  * AI-assisted writing
  * Structured workflow
  * Long-form support
* CTA footer

---

## 2. Auth Pages

### A. Register Page

**Input:**

* Nama
* Email
* Password
* Confirm Password

**Validasi:**

* Email unik
* Password match
* Password minimal (misal 8 karakter)

---

### B. Login Page

**Input:**

* Email
* Password

---

### C. Forgot Password Flow

**Flow:**

1. User input email
2. System cek:

   * Tidak ada → tampilkan error: *Email belum terdaftar*
   * Ada → kirim email reset
3. User buka link → masuk ke halaman reset password
4. Input:

   * Password baru
   * Confirm password

---

# 3. Main App (Dashboard)

## Layout:

Single page (NO sidebar)

### Komponen:

* Top:

  * Tulisan Novyl AI
  * Tulisan: Selamat Pagi/Siang/Sore/Malam, ${namaUser}!
  * Search bar
  * Button: `+ Buat Novel Baru`

* Content:

  * Grid list novel (bentuk buku), di cover bukunya ada:

    * Judul novel
    * Last updated

---

### Empty State (IMPORTANT)

Jika belum ada novel:

**Elemen:**

* Icon
* Text:

  * "Belum ada novel"
  * "Mulai tulis novel pertamamu sekarang"
* CTA: `Buat Novel Baru`

---

# 4. Create Novel Flow (Page - Multi Step)

**Bukan 1 form panjang, melainkan step-by-step**

---

## Step 1: Judul

* Header: "Apa Judulnya?"
* Di bawah header ada text field untuk mengisi judulnya

---

## Step 2: Pilih Genre

* Header: "Pilih Genrenya"
* Di bawah header ada pilihan genre berbentuk chip yang bisa dipilih (bisa pilih lebih dari satu)

---

## Step 3: Premis

* Header: "Tulis Premisnya"
* Di bawah header ada text field untuk mengisi premisnya

---

## Step 4: Sinopsis

* Header: "Tulis Sinopsisnya"
* Di bawah header ada text field untuk mengisi sinopsisnya

---

## Step 5: Karakter

* Header: "Tambah Karakter"
* Di bawah header ada tombol "+ Tambah" berbentuk chip yang jika ditekan akan memunculkan modal yang meminta dua input, yaitu nama karakter dan deskripsi karakter. Setelah diisi, terdapat tombol enter yang jika ditekan akan menyimpan input karakter tersebut dan menutup modal. Karakter yang telah ditambahkan akan muncul namanya dalam bentuk chip di samping tombol tambah. User bisa menambah karakter lainnya dengan melakukan hal yang sama.

---

## Step 6: Latar

* Header: "Tambah Latar"
* Di bawah header ada tombol "+ Tambah" berbentuk chip yang jika ditekan akan memunculkan modal yang meminta dua input, yaitu nama latar dan deskripsi latar. Setelah diisi, terdapat tombol enter yang jika ditekan akan menyimpan input latar tersebut dan menutup modal. Latar yang telah ditambahkan akan muncul namanya dalam bentuk chip di samping tombol tambah. User bisa menambah latar lainnya dengan melakukan hal yang sama.

## Step 7: Submit/Enter

---

## Submit Behavior:

* Data disimpan ke database
* Redirect ke: **Novel Editor Page**

---

# 5. Novel Editor Page (Core MVP)

## Layout:

Single page, NO sidebar

---

## Komponen:

### A. Top Bar

* Kiri: Button `Beranda` (kembali ke dashboard)
* Tengah: Judul Novel - Bab X: Judul Bab
* Kanan: Button `Info Novel`

---

### B. Main Editor Area

* Text editor dengan font Geist Mono
* Focused content area untuk menulis
* Konten bab ditampilkan dan bisa diedit langsung
* Auto-save functionality

---

### C. Chapter Navigation

* Di bawah editor area
* Format: `< Bab 1` (previous) dan `Bab 3 >` (next)
* Navigasi untuk berpindah antar bab

---

### D. Info Novel Popup (Modal)

Muncul ketika button `Info Novel` diklik

**Konten:**

* Premis
* Sinopsis
* Genre
* Karakter (list dengan deskripsi)
* Latar (list dengan deskripsi)
* Word count total novel
* Button close/tutup modal

---

## Fitur Editor:

* CRUD Bab:
  * Create: Tambah bab baru
  * Read: Lihat konten bab
  * Update: Edit konten bab
  * Delete: Hapus bab
* Auto-save saat mengetik
* Navigasi antar bab (previous/next)
* Word count per bab (optional display)

---

## Behavior:

* Setelah submit dari Create Novel Flow, redirect ke editor dengan bab kosong
* User bisa mulai menulis secara manual
* Perubahan tersimpan otomatis ke database
* Struktur data siap untuk AI generation di fase berikutnya