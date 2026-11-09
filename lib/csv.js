// Parser CSV kecil (mendukung tanda kutip) + validasi baris produk.
export function parseCsv(text) {
  const rows = []; let row = [], cur = "", q = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === "," || c === ";") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some(x => x.trim() !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some(x => x.trim() !== "")) rows.push(row);
  return rows;
}

const MARKETS = { shopee: "Shopee", "tiktok shop": "TikTok Shop", tiktok: "TikTok Shop", tiktokshop: "TikTok Shop" };
const num = v => { const n = Number(String(v ?? "").replace(/[^\d.-]/g, "")); return Number.isFinite(n) ? n : NaN; };

export function toRecords(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { records: [], errors: ["File kosong atau tanpa baris data."] };
  const head = rows[0].map(h => h.trim().toLowerCase());
  const need = ["marketplace", "external_id", "title", "date", "price", "sold_total"];
  const miss = need.filter(k => !head.includes(k));
  if (miss.length) return { records: [], errors: ["Kolom wajib hilang: " + miss.join(", ")] };
  const records = [], errors = [];
  rows.slice(1).forEach((cells, i) => {
    const o = Object.fromEntries(head.map((h, j) => [h, (cells[j] ?? "").trim()]));
    const line = i + 2;
    const marketplace = MARKETS[o.marketplace.toLowerCase()];
    const price = num(o.price), sold = num(o.sold_total);
    if (!marketplace) return errors.push(`Baris ${line}: marketplace harus Shopee atau TikTok Shop`);
    if (!o.external_id || !o.title) return errors.push(`Baris ${line}: external_id/title kosong`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return errors.push(`Baris ${line}: date harus YYYY-MM-DD`);
    if (!(price >= 0) || !(sold >= 0)) return errors.push(`Baris ${line}: price/sold_total tidak valid`);
    const rating = num(o.rating), rc = num(o.review_count);
    records.push({
      marketplace, external_id: o.external_id, title: o.title, category: o.category || "Lainnya",
      shop: o.shop || "", url: o.url || "", date: o.date, price, sold_total: Math.round(sold),
      rating: Number.isFinite(rating) && o.rating !== "" ? rating : null,
      review_count: Number.isFinite(rc) && o.review_count !== "" ? Math.round(rc) : null
    });
  });
  return { records, errors };
}

// CSV review: marketplace, external_id, date, text (wajib); rating (opsional)
export function toReviewRecords(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { records: [], errors: ["File kosong atau tanpa baris data."] };
  const head = rows[0].map(h => h.trim().toLowerCase());
  const miss = ["marketplace", "external_id", "date", "text"].filter(k => !head.includes(k));
  if (miss.length) return { records: [], errors: ["Kolom wajib hilang: " + miss.join(", ")] };
  const records = [], errors = [];
  rows.slice(1).forEach((cells, i) => {
    const o = Object.fromEntries(head.map((h, j) => [h, (cells[j] ?? "").trim()]));
    const line = i + 2, marketplace = MARKETS[o.marketplace.toLowerCase()], rating = num(o.rating);
    if (!marketplace) return errors.push(`Baris ${line}: marketplace harus Shopee atau TikTok Shop`);
    if (!o.external_id || !o.text) return errors.push(`Baris ${line}: external_id/text kosong`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return errors.push(`Baris ${line}: date harus YYYY-MM-DD`);
    records.push({ marketplace, external_id: o.external_id, date: o.date, text: o.text.slice(0, 2000), rating: o.rating !== "" && Number.isFinite(rating) ? rating : null });
  });
  return { records, errors };
}
