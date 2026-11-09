import { NextResponse } from "next/server";
import { toRecords, toReviewRecords } from "@/lib/csv.js";
import { getDb, upsertRow, insertReview } from "@/lib/db.js";
import { authorized } from "@/lib/auth.js";

export const runtime = "nodejs";

export async function POST(req) {
  if (!(await authorized(req))) return NextResponse.json({ error: "Token salah" }, { status: 401 });
  const text = await req.text();
  if (text.length > 5_000_000) return NextResponse.json({ error: "File terlalu besar (maks 5MB)" }, { status: 413 });

  // Deteksi jenis file dari header: ada kolom "text" = review, selain itu = snapshot produk.
  const header = text.split(/\r?\n/)[0].toLowerCase().split(/[,;]/).map(h => h.trim());
  if (header.includes("text")) {
    const { records, errors } = toReviewRecords(text);
    const stat = { ok: 0, duplikat: 0, "produk-tidak-ada": 0 };
    getDb().transaction(rs => rs.forEach(r => { stat[insertReview(r)]++; }))(records);
    if (stat["produk-tidak-ada"]) errors.push(`${stat["produk-tidak-ada"]} review dilewati: produk belum ada (impor snapshot produk dulu)`);
    return NextResponse.json({ type: "review", imported: stat.ok, duplicates: stat.duplikat, errors: errors.slice(0, 20), skipped: errors.length });
  }
  const { records, errors } = toRecords(text);
  if (records.length) getDb().transaction(rs => rs.forEach(upsertRow))(records);
  return NextResponse.json({ type: "snapshot", imported: records.length, errors: errors.slice(0, 20), skipped: errors.length });
}
