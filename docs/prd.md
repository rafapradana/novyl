# Novyl AI — AI Novel Ghostwriter & Writing Platform

---

## Auth
- User mendaftar dengan mengisi: nama, email, password, dan konfirmasi password
- User login menggunakan email & password
- Jika user lupa password, sistem akan mengirimkan link ganti password ke email. Alurnya:
  - User memasukkan email terlebih dahulu
  - Sistem mengecek apakah email tersebut terdaftar atau tidak
  - Jika tidak terdaftar, tidak ada email yang dikirim dan akan muncul pesan bahwa email belum terdaftar
  - Jika terdaftar, email konfirmasi ganti password akan dikirim ke email user, dan user diminta memasukkan password baru beserta konfirmasinya

---

## Input

### Novel Creation Wizard (7 Steps)
User membuat novel melalui wizard 7 langkah:
1. **Judul novel**
2. **Genre** (multi-select dari 11 genre)
3. **Premis** — deskripsi singkat ide novel
4. **Sinopsis** — ringkasan alur cerita
5. **Karakter** — daftar karakter dengan nama dan deskripsi *(bisa diisi manual atau dibiarkan kosong untuk di-generate AI nanti)*
6. **Latar/Setting** — daftar lokasi dengan nama dan deskripsi *(bisa diisi manual atau dibiarkan kosong untuk di-generate AI nanti)*
7. **Bab** — daftar bab dengan judul dan outline per bab *(minimal 1 bab, target word count per bab bisa diatur)*

Setelah wizard selesai, novel tersimpan ke database dan user diarahkan ke editor.

---

## AI Nulis (Client-Driven Orchestration)

> **Arsitektur:** Browser tab adalah orchestrator. Tab terbuka = generasi berjalan, tab ditutup = berhenti, tab dibuka kembali = melanjutkan dari langkah terakhir.

### Trigger Generate
- Setelah novel dibuat, user berada di halaman editor
- Banner muncul di atas editor dengan status saat ini:
  - **Idle** — "Novel belum selesai di-generate" + tombol "Generate"
  - **Generating** — Progress banner dengan step aktif, progress bar bab, dan tombol "Batal"
  - **Completed** — "Novel selesai di-generate!" + tombol "Tutup"
  - **Failed** — Pesan error + tombol "Coba Lagi"
- User menekan tombol **Generate** untuk memulai

### Pipeline Generasi (Sequential, Idempotent)
Sistem menjalankan langkah-langkah secara berurutan. Setiap langkah adalah API call terpisah yang **idempotent** — aman dipanggil ulang, akan skip jika data sudah ada:

1. **Generate Karakter**
   - AI membaca judul, premis, sinopsis, dan genre
   - Menghasilkan daftar karakter lengkap dengan deskripsi (penampilan fisik, kepribadian, dll)
   - Disimpan ke database
   - UI diperbarui secara real-time di panel info novel

2. **Generate Latar/Setting**
   - AI membaca konteks novel
   - Menghasilkan daftar lokasi dengan deskripsi lengkap
   - Disimpan ke database
   - UI diperbarui secara real-time

3. **Generate Bab (per bab, sequential)**
   - Untuk setiap bab yang belum memiliki konten:
     - AI menerima konteks lengkap: judul, premis, sinopsis, genre, karakter, latar, outline bab, dan **isi semua bab sebelumnya**
     - Menulis bab lengkap sesuai target word count
     - Setiap akhir bab harus memiliki cliffhanger yang efektif
     - Disimpan ke database
     - Progress bar diperbarui: "Menulis Bab 2/10..."
     - Jika bab sudah ada kontennya, langkah ini di-skip

4. **Generate Blurb**
   - AI membaca seluruh novel yang sudah selesai
   - Menghasilkan blurb/sinopsis marketing untuk novel
   - Disimpan ke database

### Resume & Recovery
- Jika user **menutup tab** saat generasi berjalan, proses berhenti (request dibatalkan via AbortController)
- Status di database tetap "generating" (mungkin stale)
- Ketika user **membuka kembali** editor:
  - Sistem mendeteksi status "generating" di database
  - Mengecek konten yang sudah ada vs yang belum
  - Melanjutkan dari langkah pertama yang belum selesai
  - Jika semua konten sudah lengkap tapi status masih "generating", sistem auto-memperbaiki status menjadi "completed" (self-healing)

### Cancel & Retry
- User bisa menekan **"Batal"** kapan saja saat generating
- Semua request yang sedang berjalan dibatalkan
- Status diubah menjadi "idle"
- User bisa menekan **"Generate"** lagi kapan saja untuk melanjutkan dari awal (langkah yang sudah selesai akan di-skip)
- Jika terjadi error, banner menampilkan error message dengan tombol **"Coba Lagi"**

### Regenerasi Per Bab
- User bisa meregenerasi konten bab tertentu tanpa mempengaruhi bab lain
- Tombol "Regenerate" tersedia di header editor untuk bab aktif
- Bab baru ditulis ulang dengan konteks yang sama (karakter, latar, bab sebelumnya)

---

## Writing Requirement

- **Opener harus menarik** — tidak generik, relevan dengan novel dan target pembaca
- **Setiap akhir bab harus memiliki cliffhanger** yang baik dan efektif
- **Tata bahasa dan gaya penulisan berkualitas tinggi** — layaknya novel bestseller, tidak terdengar seperti tulisan AI
- **Batch generation** — bab ditulis secara utuh per request (non-streaming) untuk kualitas yang lebih konsisten

---

## Fitur Lain

### Dashboard
- Grid view semua novel user dengan book cover 3D
- Search/filter novel
- Badge status generasi yang informatif:
  - "Menyiapkan..." (karakter/latar sedang di-generate)
  - "Menulis Bab..." (bab sedang di-generate)
  - "3/10 Bab" (progress bab)
  - "10 Bab" (selesai)
  - "Gagal" (jika terjadi error)

### Editor Novel
- Editor berbasis bab dengan textarea distraction-free
- Auto-save debounce 1 detik
- Navigasi bab via floating pills (desktop) atau bottom bar (mobile)
- Swipe gesture untuk pindah bab (mobile)
- Progressive blur pada scroll area
- Chapter management: tambah, hapus, ubah nama bab
- Novel info dialog: metadata, karakter, latar, bab, blurb, status generasi
- Header editor dengan chapter navigation dropdown
- Word count per bab dan total word count

### CRUD Project Novel
- Buat novel via wizard 7 langkah
- Hapus novel (dengan konfirmasi)
- Edit metadata novel (judul, premis, sinopsis, genre)
- CRUD bab (buat, edit konten, hapus, ubah nama)
- CRUD karakter & latar (buat, edit, hapus)

---

## Self-Healing Status

Sistem memiliki mekanisme self-healing untuk menangani stale status:
- Saat dashboard dimuat, `getNovelsByUser` mengecek setiap novel dengan status "generating"
- Jika novel tersebut sebenarnya sudah lengkap (punya karakter, latar, semua bab berisi, dan blurb), status di database diperbaiki menjadi "completed"
- Ini mencegah badge "generating" muncul di novel yang sudah selesai
