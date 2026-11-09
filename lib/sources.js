// Sinkronisasi terjadwal dari "feed" CSV yang Anda tentukan sendiri
// (mis. export Google Sheets yang dipublikasikan, file dari penyedia data berlisensi, atau endpoint internal).
// Format kolom sama dengan impor manual. Tidak ada scraping marketplace.
import { toRecords, toReviewRecords } from "./csv.js";
import { getDb, upsertRow, insertReview, logSync } from "./db.js";

let running = false;

async function fetchText(url) {
  const headers = {};
  const a = process.env.FEED_AUTH_HEADER; // contoh: "Authorization: Bearer xxx"
  if (a && a.includes(":")) headers[a.slice(0, a.indexOf(":")).trim()] = a.slice(a.indexOf(":") + 1).trim();
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const t = await res.text();
  if (t.length > 5_000_000) throw new Error("Feed terlalu besar (maks 5MB)");
  return t;
}

export async function runSync() {
  if (running) return [{ source: "-", status: "skip", rows: 0, message: "Sinkronisasi sedang berjalan" }];
  running = true;
  const results = [];
  try {
    // Produk lebih dulu, baru review (review butuh produk yang sudah ada).
    const jobs = [["produk", process.env.FEED_PRODUCTS_URL, toRecords, upsertRow], ["review", process.env.FEED_REVIEWS_URL, toReviewRecords, insertReview]];
    for (const [name, url, parse, save] of jobs) {
      if (!url) continue;
      try {
        const { records, errors } = parse(await fetchText(url));
        let ok = 0;
        getDb().transaction(rs => rs.forEach(r => { const x = save(r); if (x === undefined || x === "ok") ok++; }))(records);
        const message = errors.length ? `${errors.length} baris dilewati` : "";
        logSync(name, "ok", ok, message);
        results.push({ source: name, status: "ok", rows: ok, message });
      } catch (e) {
        logSync(name, "error", 0, String(e.message));
        results.push({ source: name, status: "error", rows: 0, message: String(e.message) });
      }
    }
    if (!results.length) results.push({ source: "-", status: "skip", rows: 0, message: "Isi FEED_PRODUCTS_URL / FEED_REVIEWS_URL di .env" });
  } finally { running = false; }
  return results;
}
