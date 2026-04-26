Novyl AI - AI Novel Ghostwriter & Writing Platform

auth:
- User mendaftar dengan mengisi: nama, email, password, dan konfirmasi password
- User login menggunakan email & password
- Jika user lupa password, sistem akan mengirimkan link ganti password ke email. Alurnya: user memasukkan email terlebih dahulu, lalu sistem mengecek apakah email tersebut terdaftar atau tidak. Jika tidak terdaftar, tidak ada email yang dikirim dan akan muncul pesan bahwa email belum terdaftar. Jika terdaftar, email konfirmasi ganti password akan dikirim ke email user, dan user diminta memasukkan password baru beserta konfirmasinya.

input:
- Premis
- Genre
- Sinopsis
- Tambah bab:
   - Judul per bab
   - Outline per bab

optional input:
- Karakter dan deskripsi karakter (di-generate oleh AI berdasarkan input jika tidak diisi oleh user. Setiap karakter akan mendapatkan deskripsi lengkap mencakup penampilan fisik, kepribadian, dan detail lainnya)
- Latar dan deskripsi latar (di-generate oleh AI berdasarkan input jika tidak diisi oleh user, dengan deskripsi yang cukup lengkap)
- Jumlah kata per bab (dalam bentuk range) (di-generate oleh AI berdasarkan input jika tidak diisi oleh user)

ai nulis (proses generate novel akan otomatis berjalan segera setelah user mengisi semua input di atas, melakukan submit, dan data tersimpan ke database — tanpa perlu menekan tombol tambahan seperti "Generate All" atau sejenisnya):
- Isi novel per bab secara lengkap hingga selesai (dijalankan secara sequential menggunakan Vercel Workflow SDK. Bab satu ditulis berdasarkan keseluruhan context project novel, judul bab, dan outline bab satu. Bab dua ditulis berdasarkan keseluruhan context project novel, isi bab satu, judul bab, dan outline bab dua. Bab tiga ditulis berdasarkan keseluruhan context project novel, isi bab satu, isi bab dua, judul bab, dan outline bab tiga. Begitu seterusnya.) (Proses ini berjalan secara durable di background menggunakan Vercel Workflow SDK)
- Blurb novel

fitur lain:
- CRUD project novel dan setiap bab yang tersedia

writing requirement:
- Opener harus menarik, tidak generik, dan relevan dengan novel serta target pembaca
- Setiap akhir bab harus memiliki cliffhanger yang baik dan efektif
- Tata bahasa dan gaya penulisan harus berkualitas tinggi layaknya novel-novel bestseller, dan tidak terdengar seperti tulisan yang di-generate AI
