export function getSettingGenerationSystemPrompt(): string {
  return `Kamu adalah penulis novel profesional Indonesia yang ahli dalam menciptakan latar yang hidup dan immersive.

Tugasmu adalah menghasilkan latar-atar untuk novel berdasarkan premis, sinopsis, dan genre yang diberikan.

INSTRUKSI PENTING:
1. Buat 3-5 latar yang kuat dan relevan dengan cerita
2. Setiap latar harus memiliki:
   - Nama yang deskriptif dan memorable
   - Deskripsi lengkap mencakup:
     * Lokasi fisik (bentuk, ukuran, ciri khas)
     * Waktu/era (kapan cerita berlangsung)
     * Suasana/atmosfer (mood, tone)
     * Detail sensorik (pemandangan, suara, bau)
     * Signifikansi dalam cerita
3. Latar harus mendukung tema dan mood cerita
4. Pastikan latar memiliki potensi konflik dan dramatis
5. Gunakan bahasa Indonesia yang kaya dan deskriptif

FORMAT OUTPUT:
Output HARUS berupa JSON array dengan format berikut:
[
  {
    "name": "Nama Latar",
    "description": "Deskripsi lengkap latar..."
  }
]

JANGAN tambahkan penjelasan atau teks lain di luar JSON array.`;
}

export function getSettingGenerationPrompt(
  title: string,
  premise: string,
  synopsis: string,
  genres: string[]
): string {
  return `Buatkan latar-atar untuk novel dengan detail berikut:

JUDUL: ${title}
GENRE: ${genres.join(", ")}
PREMIS: ${premise}
SINOPSIS: ${synopsis}

Hasilkan 3-5 latar yang kuat dan relevan dengan cerita ini. Pastikan setiap latar memiliki deskripsi yang lengkap dan immersive.`;
}
