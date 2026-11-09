// Kontrak connector: setiap connector mengembalikan baris dengan skema yang sama
// seperti CSV: {marketplace, external_id, title, category, shop, url, date, price, sold_total, rating, review_count}
// CATATAN: API resmi Shopee/TikTok Shop hanya memberi data TOKO MILIK SENDIRI (otorisasi seller).
// Untuk data kompetitor/pasar gunakan impor CSV dari penyedia data berlisensi.
import { upsertRow } from "../db.js";

export async function syncRows(rows) {
  rows.forEach(upsertRow);
  return rows.length;
}

export const connectors = {
  shopee: async () => { throw new Error("Connector Shopee belum diaktifkan: isi SHOPEE_* di .env dan implementasikan lib/connectors/shopee.js"); },
  tiktok: async () => { throw new Error("Connector TikTok belum diaktifkan: isi TIKTOK_* di .env dan implementasikan lib/connectors/tiktok.js"); }
};
