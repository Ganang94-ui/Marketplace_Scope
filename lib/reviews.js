import { getDb } from "./db.js";
import { TOPICS } from "./sentiment.js";

const pct = (a, n) => (n ? (a / n) * 100 : 0);
const tally = rows => {
  const t = { n: rows.length, pos: 0, neu: 0, neg: 0, sum: 0 };
  for (const r of rows) { t[r.label === "positif" ? "pos" : r.label === "negatif" ? "neg" : "neu"]++; t.sum += r.score; }
  return { ...t, avg: t.n ? t.sum / t.n : 0, posPct: pct(t.pos, t.n), negPct: pct(t.neg, t.n) };
};
const topicTable = rows => {
  const m = Object.fromEntries(Object.keys(TOPICS).map(k => [k, { topic: k, pos: 0, neg: 0 }]));
  for (const r of rows) for (const t of JSON.parse(r.topics)) m[t.topic][t.label === "positif" ? "pos" : "neg"]++;
  return Object.values(m).filter(x => x.pos + x.neg > 0).sort((a, b) => b.neg - a.neg || b.pos - a.pos);
};

export function productSentiment(productId) {
  const rows = getDb().prepare("SELECT * FROM reviews WHERE product_id=? ORDER BY date DESC").all(productId);
  return {
    ...tally(rows), topics: topicTable(rows),
    negSamples: rows.filter(r => r.label === "negatif").slice(0, 5),
    posSamples: rows.filter(r => r.label === "positif").slice(0, 3)
  };
}

// Ringkasan sentimen untuk daftar produk (mengikuti filter dashboard).
export function overview(products) {
  if (!products.length) return { total: 0 };
  const ids = products.map(p => p.id), by = new Map(products.map(p => [p.id, p]));
  const rows = getDb().prepare(`SELECT * FROM reviews WHERE product_id IN (${ids.map(() => "?").join(",")})`).all(...ids)
    .map(r => ({ ...r, p: by.get(r.product_id) }));
  const group = key => {
    const g = {};
    for (const r of rows) (g[r.p[key]] ??= []).push(r);
    return Object.entries(g).map(([name, rs]) => ({ name, ...tally(rs) })).sort((a, b) => b.n - a.n);
  };
  return { total: rows.length, all: tally(rows), byMarket: group("marketplace"), byCategory: group("category"), topics: topicTable(rows) };
}
