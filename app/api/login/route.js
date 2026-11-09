import { NextResponse } from "next/server";
import { COOKIE, createSession, checkPassword } from "@/lib/session.js";

export const runtime = "nodejs";
const tries = new Map(); // pembatasan percobaan sederhana (per IP, 5 per 10 menit)

export async function POST(req) {
  if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "ADMIN_PASSWORD belum diatur di .env" }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const now = Date.now(), rec = (tries.get(ip) || []).filter(t => now - t < 600_000);
  if (rec.length >= 5) return NextResponse.json({ error: "Terlalu banyak percobaan, coba lagi nanti" }, { status: 429 });
  const { password } = await req.json().catch(() => ({}));
  if (!(await checkPassword(password))) { tries.set(ip, [...rec, now]); return NextResponse.json({ error: "Password salah" }, { status: 401 }); }
  tries.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: COOKIE, value: await createSession(), httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return res;
}
