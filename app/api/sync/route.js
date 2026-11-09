import { NextResponse } from "next/server";
import { authorized } from "@/lib/auth.js";
import { runSync } from "@/lib/sources.js";
import { recentSyncs } from "@/lib/db.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!(await authorized(req))) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  return NextResponse.json({ results: await runSync(), logs: recentSyncs() });
}
export async function GET(req) {
  if (!(await authorized(req))) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  return NextResponse.json({ logs: recentSyncs() });
}
