import Link from "next/link";
import { getProducts, getCategories, summarize, crossMarket, rupiah } from "@/lib/analytics.js";
import { Topbar } from "./components.jsx";
import { overview } from "@/lib/reviews.js";
import { TOPICS } from "@/lib/sentiment.js";

export const dynamic = "force-dynamic";
const MARKETS = ["All", "Shopee", "TikTok Shop"];
const SORTS = { trend: "Trend score", perDay: "Terjual/hari", revenue: "Omzet periode", growth: "Growth", price: "Harga termurah" };

export default function Home({ searchParams }) {
  const q = searchParams.q || "", market = searchParams.market || "All", category = searchParams.category || "All";
  const period = [7, 14, 30].includes(Number(searchParams.period)) ? Number(searchParams.period) : 7;
  const sort = SORTS[searchParams.sort] ? searchParams.sort : "trend";
  const qs = (o) => "/?" + new URLSearchParams({ q, market, category, period, sort, ...o }).toString();

  const all = getProducts({ period });
  const list = getProducts({ period, q, market, category });
  const sorters = {
    trend: (a, b) => (b.trend ?? -1) - (a.trend ?? -1), perDay: (a, b) => b.perDay - a.perDay,
    revenue: (a, b) => b.revenuePeriod - a.revenuePeriod, growth: (a, b) => (b.growth ?? -1e9) - (a.growth ?? -1e9),
    price: (a, b) => a.last.price - b.last.price
  };
  list.sort(sorters[sort]);
  const s = summarize(list);
  const pairs = crossMarket(all).slice(0, 5);
  const best = s.categories.filter(c => c.units > 0).sort((a, b) => b.opportunity - a.opportunity)[0];
  const rv = overview(list);
  const exportQs = new URLSearchParams({ q, market, category, period }).toString();

  if (all.length === 0) return (
    <main>
      <Topbar />
      <section className="hero"><div>
        <p className="eyebrow">MARKETPLACE MARKET RESEARCH</p>
        <h1>Belum ada data.</h1>
        <p className="sub">MarketScope menghitung tren dari snapshot harian (harga, jumlah terjual, rating). Impor CSV pertama Anda untuk mulai.</p>
        <p><Link className="chip active" href="/import">Impor data →</Link></p>
      </div></section>
    </main>
  );

  return (
    <main>
      <Topbar q={q} market={market} category={category} period={period} />
      <section className="hero">
        <div>
          <p className="eyebrow">MARKETPLACE MARKET RESEARCH</p>
          <h1>Analisa pasar<br />Shopee & TikTok Shop.</h1>
          <p className="sub">Semua angka dihitung dari snapshot historis di database Anda, periode {period} hari terakhir.</p>
        </div>
        <div className="heroStat"><b>{list.length}</b><span>produk · {s.withTrend} punya data tren</span></div>
      </section>

      <section className="toolbar">
        <div className="chips">
          {MARKETS.map(x => <Link key={x} className={market === x ? "chip active" : "chip"} href={qs({ market: x })}>{x}</Link>)}
        </div>
        <div className="chips">
          {[7, 14, 30].map(x => <Link key={x} className={period === x ? "chip active" : "chip"} href={qs({ period: x })}>{x} hari</Link>)}
          <form action="/" style={{ display: "flex", gap: 8 }}>
            <input type="hidden" name="q" value={q} /><input type="hidden" name="market" value={market} /><input type="hidden" name="period" value={period} />
            <select name="category" defaultValue={category}><option>All</option>{getCategories().map(c => <option key={c}>{c}</option>)}</select>
            <select name="sort" defaultValue={sort}>{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <button className="chip" type="submit">Terapkan</button>
          </form>
        </div>
      </section>

      <section className="insights">
        <div><span>🔥</span><div><small>Produk tercepat laku</small><b>{s.topMover ? `${s.topMover.title} (${s.topMover.perDay.toFixed(1)}/hari)` : "Butuh ≥2 snapshot"}</b></div></div>
        <div><span>💰</span><div><small>Median harga · Omzet periode</small><b>{rupiah(s.medianPrice)} · {rupiah(s.totalRevenue)}</b></div></div>
        <div><span>🎯</span><div><small>Peluang terbaik (permintaan/penjual)</small><b>{best ? `${best.category} (${best.opportunity.toFixed(0)} unit/penjual)` : "-"}</b></div></div>
      </section>

      <section className="content">
        <div className="sectionTitle"><div><h2>Shopee vs TikTok Shop</h2><p>Ringkasan pasar untuk filter saat ini</p></div></div>
        <div className="tableWrap"><table>
          <thead><tr><th>Marketplace</th><th>Produk</th><th>Unit terjual</th><th>Omzet estimasi</th><th>Median harga</th></tr></thead>
          <tbody>{s.marketSplit.map(m => <tr key={m.market}><td>{m.market}</td><td>{m.products}</td><td>{m.units.toLocaleString("id-ID")}</td><td>{rupiah(m.revenue)}</td><td>{rupiah(m.medianPrice)}</td></tr>)}</tbody>
        </table></div>

        <div className="sectionTitle" style={{ marginTop: 34 }}><div><h2>Kategori & persaingan</h2><p>Pangsa omzet dan kepadatan penjual</p></div></div>
        <div className="tableWrap"><table>
          <thead><tr><th>Kategori</th><th>Produk</th><th>Penjual</th><th>Unit</th><th>Omzet</th><th>Pangsa</th><th>Unit/penjual</th></tr></thead>
          <tbody>{s.categories.map(c => <tr key={c.category}><td>{c.category}</td><td>{c.products}</td><td>{c.sellers}</td><td>{c.units.toLocaleString("id-ID")}</td><td>{rupiah(c.revenue)}</td><td>{c.share.toFixed(1)}%</td><td>{c.opportunity.toFixed(0)}</td></tr>)}</tbody>
        </table></div>

        <div className="sectionTitle" style={{ marginTop: 34 }}><div><h2>Top penjual</h2><p>Berdasarkan omzet estimasi periode</p></div></div>
        <div className="tableWrap"><table>
          <thead><tr><th>Toko</th><th>Marketplace</th><th>Produk</th><th>Omzet</th></tr></thead>
          <tbody>{s.topShops.map(t => <tr key={t.marketplace + t.shop}><td>{t.shop}</td><td>{t.marketplace}</td><td>{t.products}</td><td>{rupiah(t.revenue)}</td></tr>)}</tbody>
        </table></div>

        <div className="sectionTitle" style={{ marginTop: 34 }}><div><h2>Sentimen review</h2><p>Analisa otomatis dari teks ulasan (kamus Indonesia/Inggris)</p></div></div>
        {rv.total === 0 ? <div className="empty">Belum ada review. <Link href="/import">Impor CSV review</Link> untuk melihat sentimen dan keluhan utama.</div> : <>
          <div className="tableWrap"><table>
            <thead><tr><th>Kelompok</th><th>Review</th><th>Positif</th><th>Netral</th><th>Negatif</th><th>Skor rata-rata</th></tr></thead>
            <tbody>{[{ name: "Semua", ...rv.all }, ...rv.byMarket, ...rv.byCategory.map(c => ({ ...c, name: "Kategori: " + c.name }))].map(r => <tr key={r.name}><td>{r.name}</td><td>{r.n}</td><td>{r.posPct.toFixed(0)}%</td><td>{(100 - r.posPct - r.negPct).toFixed(0)}%</td><td>{r.negPct.toFixed(0)}%</td><td>{r.avg.toFixed(2)}</td></tr>)}</tbody>
          </table></div>
          <div className="tableWrap" style={{ marginTop: 14 }}><table>
            <thead><tr><th>Topik</th><th>Sebutan positif</th><th>Keluhan</th></tr></thead>
            <tbody>{rv.topics.map(t => <tr key={t.topic}><td>{t.topic}</td><td>{t.pos}</td><td>{t.neg}</td></tr>)}</tbody>
          </table></div>
        </>}

        {pairs.length > 0 && <>
          <div className="sectionTitle" style={{ marginTop: 34 }}><div><h2>Produk sama di dua marketplace</h2><p>Dicocokkan lewat kesamaan judul</p></div></div>
          <div className="tableWrap"><table>
            <thead><tr><th>Produk</th><th>Harga Shopee</th><th>Harga TikTok</th><th>Terjual/hari S</th><th>Terjual/hari T</th></tr></thead>
            <tbody>{pairs.map(p => <tr key={p.shopee.id}><td>{p.shopee.title}</td><td>{rupiah(p.shopee.last.price)}</td><td>{rupiah(p.tiktok.last.price)}</td><td>{p.shopee.perDay.toFixed(1)}</td><td>{p.tiktok.perDay.toFixed(1)}</td></tr>)}</tbody>
          </table></div>
        </>}

        <div className="sectionTitle" style={{ marginTop: 34 }}>
          <div><h2>Daftar produk</h2><p>Diurutkan: {SORTS[sort]}</p></div>
          <a className="chip" href={"/api/export?" + exportQs}>Ekspor CSV</a>
        </div>
        <div className="tableWrap"><table>
          <thead><tr><th>Produk</th><th>Market</th><th>Harga</th><th>Terjual (total)</th><th>Terjual/hari</th><th>Growth</th><th>Omzet periode</th><th>Trend</th><th></th></tr></thead>
          <tbody>{list.map(p => (
            <tr key={p.id}>
              <td>{p.title}<br /><small>{p.shop}</small></td><td>{p.marketplace}</td><td>{rupiah(p.last.price)}</td>
              <td>{p.last.sold_total.toLocaleString("id-ID")}</td>
              <td>{p.hasTrend ? p.perDay.toFixed(1) : "-"}</td>
              <td>{p.growth == null ? "-" : (p.growth > 0 ? "+" : "") + p.growth.toFixed(0) + "%"}</td>
              <td>{p.hasTrend ? rupiah(p.revenuePeriod) : "-"}</td>
              <td>{p.trend ?? "-"}</td>
              <td><Link href={"/product/" + p.id}>Analisa →</Link></td>
            </tr>))}
          </tbody>
        </table></div>
        {list.length === 0 && <div className="empty">Tidak ada produk yang cocok dengan filter.</div>}
      </section>
      <footer>MarketScope · Omzet = selisih terjual × harga terakhir (estimasi). Akurasi bergantung pada kualitas data impor.</footer>
    </main>
  );
}
