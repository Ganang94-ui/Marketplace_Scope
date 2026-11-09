import { getProducts } from "@/lib/analytics.js";

export const dynamic = "force-dynamic";
const esc = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

export async function GET(req) {
  const u = new URL(req.url).searchParams;
  const list = getProducts({ period: Number(u.get("period")) || 7, q: u.get("q") || "", market: u.get("market") || "All", category: u.get("category") || "All" });
  const head = ["marketplace", "title", "category", "shop", "price", "sold_total", "sold_periode", "per_hari", "growth_pct", "omzet_periode", "trend_score"];
  const lines = list.map(p => [p.marketplace, p.title, p.category, p.shop, p.last.price, p.last.sold_total, p.soldDelta, p.perDay.toFixed(2), p.growth?.toFixed(1) ?? "", Math.round(p.revenuePeriod), p.trend ?? ""].map(esc).join(","));
  return new Response([head.join(","), ...lines].join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=marketscope-export.csv" } });
}
