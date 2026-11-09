import { getDb } from "./db.js";

export const rupiah = n => "Rp" + Math.round(n || 0).toLocaleString("id-ID");
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const daysBetween = (a, b) => Math.max(1, Math.round((new Date(b) - new Date(a)) / 864e5));

// Periode analisa: bandingkan snapshot terakhir dengan snapshot terdekat <= (terakhir - period) hari.
export function getProducts({ period = 7, q = "", market = "All", category = "All" } = {}) {
  const d = getDb();
  const prods = d.prepare("SELECT * FROM products").all();
  const snaps = d.prepare("SELECT * FROM snapshots ORDER BY date").all();
  const byProd = new Map();
  for (const s of snaps) (byProd.get(s.product_id) ?? byProd.set(s.product_id, []).get(s.product_id)).push(s);

  const out = prods.map(p => {
    const h = byProd.get(p.id) || [];
    if (!h.length) return null;
    const last = h[h.length - 1];
    const cutoff = new Date(new Date(last.date) - period * 864e5).toISOString().slice(0, 10);
    let base = [...h].reverse().find(s => s.date <= cutoff) || (h.length > 1 ? h[0] : null);
    const days = base ? daysBetween(base.date, last.date) : 0;
    const soldDelta = base ? Math.max(0, last.sold_total - base.sold_total) : 0;
    const prevDelta = base && base !== h[0] ? (() => {
      const b2 = [...h].reverse().find(s => s.date <= base.date && s.date < base.date);
      return b2 ? Math.max(0, base.sold_total - b2.sold_total) / daysBetween(b2.date, base.date) : null;
    })() : null;
    const perDay = days ? soldDelta / days : 0;
    const growth = prevDelta ? ((perDay - prevDelta) / prevDelta) * 100 : null;
    const priceChange = base && base.price ? ((last.price - base.price) / base.price) * 100 : null;
    return {
      ...p, history: h, last, days, soldDelta, perDay, growth, priceChange,
      revenuePeriod: soldDelta * last.price, revenueTotal: last.sold_total * last.price,
      hasTrend: !!base
    };
  }).filter(Boolean);

  // Skor tren 0-100: persentil kecepatan jual (perDay) di dalam seluruh data.
  const speeds = out.filter(p => p.hasTrend).map(p => p.perDay).sort((a, b) => a - b);
  for (const p of out)
    p.trend = p.hasTrend && speeds.length ? Math.round((speeds.filter(s => s <= p.perDay).length / speeds.length) * 100) : null;

  const ql = q.toLowerCase();
  return out.filter(p =>
    (market === "All" || p.marketplace === market) &&
    (category === "All" || p.category === category) &&
    (!ql || p.title.toLowerCase().includes(ql) || p.shop.toLowerCase().includes(ql))
  );
}

export function getCategories() {
  return getDb().prepare("SELECT DISTINCT category FROM products ORDER BY category").all().map(r => r.category);
}

// Ringkasan pasar dihitung dari data, bukan hardcode.
export function summarize(products) {
  const trending = products.filter(p => p.hasTrend);
  const cats = {};
  for (const p of products) {
    const c = (cats[p.category] ??= { category: p.category, products: 0, shops: new Set(), revenue: 0, units: 0 });
    c.products++; c.shops.add(p.shop || p.id); c.revenue += p.revenuePeriod; c.units += p.soldDelta;
  }
  const catList = Object.values(cats).map(c => ({
    ...c, sellers: c.shops.size, shops: undefined,
    // Peluang: permintaan (unit/periode) dibagi jumlah penjual -> semakin besar semakin longgar persaingan.
    opportunity: c.sellers ? c.units / c.sellers : 0
  })).sort((a, b) => b.revenue - a.revenue);
  const totalRev = catList.reduce((s, c) => s + c.revenue, 0);
  const shops = {};
  for (const p of products) { const k = p.marketplace + "|" + (p.shop || "-"); shops[k] ??= { shop: p.shop || "-", marketplace: p.marketplace, revenue: 0, products: 0 }; shops[k].revenue += p.revenuePeriod; shops[k].products++; }
  const marketSplit = ["Shopee", "TikTok Shop"].map(m => {
    const ps = products.filter(p => p.marketplace === m);
    return { market: m, products: ps.length, revenue: ps.reduce((s, p) => s + p.revenuePeriod, 0), medianPrice: median(ps.map(p => p.last.price)), units: ps.reduce((s, p) => s + p.soldDelta, 0) };
  });
  return {
    count: products.length, withTrend: trending.length,
    medianPrice: median(products.map(p => p.last.price)),
    totalRevenue: totalRev,
    categories: catList.map(c => ({ ...c, share: totalRev ? (c.revenue / totalRev) * 100 : 0 })),
    topShops: Object.values(shops).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    marketSplit,
    topMover: [...trending].sort((a, b) => b.perDay - a.perDay)[0] || null
  };
}

// Pasangkan produk yang sama di dua marketplace berdasarkan judul ternormalisasi.
const norm = t => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
export function crossMarket(products) {
  const m = new Map();
  for (const p of products) (m.get(norm(p.title)) ?? m.set(norm(p.title), []).get(norm(p.title))).push(p);
  return [...m.values()].map(g => ({
    shopee: g.find(p => p.marketplace === "Shopee"), tiktok: g.find(p => p.marketplace === "TikTok Shop")
  })).filter(x => x.shopee && x.tiktok);
}
