import { COOKIE, verifySession } from "./session.js";

// Diizinkan jika: token impor/Bearer cocok, ATAU sesi login valid, ATAU mode dev tanpa konfigurasi apa pun.
// Di production tanpa ADMIN_PASSWORD/IMPORT_TOKEN, akses tulis ditolak (fail closed).
export async function authorized(req) {
  const t = process.env.IMPORT_TOKEN;
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (t && (req.headers.get("x-import-token") === t || bearer === t)) return true;
  if (await verifySession(req.cookies?.get?.(COOKIE)?.value)) return true;
  return !process.env.ADMIN_PASSWORD && !t && process.env.NODE_ENV !== "production";
}
