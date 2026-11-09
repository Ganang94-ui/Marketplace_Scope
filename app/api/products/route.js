import { NextResponse } from "next/server";
import { getProducts } from "@/lib/analytics.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const u = new URL(req.url).searchParams;
  const list = getProducts({ period: Number(u.get("period")) || 7, q: u.get("q") || "", market: u.get("market") || "All", category: u.get("category") || "All" });
  return NextResponse.json(list.map(({ history, ...p }) => p));
}
