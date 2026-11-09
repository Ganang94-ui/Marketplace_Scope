# MarketScope

Dashboard analisa pasar Shopee & TikTok Shop berbasis **data historis** (snapshot harga, jumlah terjual, rating) yang disimpan di SQLite.

## Fitur
- Impor CSV snapshot (validasi per baris, upsert, token opsional)
- Metrik terhitung dari data: terjual/hari, growth, omzet estimasi, trend score (persentil), median harga
- Analisa kategori (pangsa omzet, jumlah penjual, unit per penjual), top penjual, Shopee vs TikTok Shop
- Pencocokan produk sama lintas marketplace
- Analisa sentimen review (kamus ID/EN, negasi, penguat, topik: kualitas/pengiriman/kemasan/harga/pelayanan/kesesuaian) di dashboard dan halaman produk
- Login admin (cookie bertanda tangan HMAC, pembatasan percobaan) untuk /import dan API tulis; `REQUIRE_LOGIN=true` untuk mengunci seluruh dashboard
- Sinkronisasi terjadwal dari feed CSV (`FEED_*_URL`): tombol di /import, `POST /api/sync`, `npm run sync` (cron), atau `SYNC_EVERY_HOURS`
- Halaman detail produk dengan grafik harga/penjualan
- Filter, sorting, periode 7/14/30 hari, ekspor CSV
- REST: `GET /api/products`, `GET /api/export`, `POST /api/import`

## Menjalankan
```bash
cp .env.example .env   # isi ADMIN_PASSWORD (wajib di production)
npm install
npm run dev      # http://localhost:3000
npm test
```
Buka `/import`, unggah CSV (lihat `public/template.csv`). Review diimpor dengan CSV terpisah (`public/reviews-template.csv`). Impor minimal 2 tanggal berbeda agar tren muncul.

## Sumber data (penting)
API resmi Shopee Open Platform & TikTok Shop Partner hanya memberi data **toko milik sendiri**. Untuk data pasar/kompetitor gunakan penyedia data berlisensi atau export yang sah, lalu impor via CSV. Jangan scraping/endpoint tidak resmi. Connector API resmi: lihat `lib/connectors/`.

## Batasan & langkah berikut
- "Omzet" adalah estimasi (selisih terjual × harga terakhir); jumlah terjual di marketplace sering dibulatkan.
- SQLite berbasis file: cocok lokal/VPS. Untuk Vercel (filesystem sementara) ganti `lib/db.js` ke Postgres (Neon/Supabase).
- Sentimen berbasis kamus: akurat untuk kasus umum, lemah pada sarkasme/slang baru. Kamus ada di `lib/sentiment.js` dan mudah diperluas; untuk akurasi lebih tinggi bisa diganti model NLP/LLM.
- Login berupa satu akun admin (bukan multi-pengguna/peran). Penjadwal `SYNC_EVERY_HOURS` hanya untuk server Node yang selalu hidup; di serverless gunakan cron eksternal yang memanggil `POST /api/sync` dengan `Authorization: Bearer <IMPORT_TOKEN>`.
