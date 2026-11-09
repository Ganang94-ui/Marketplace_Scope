import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts, crossMarket, rupiah } from "@/lib/analytics.js";
import { Topbar, LineChart } from "../../components.jsx";
import { productSentiment } from "@/lib/reviews.js";

export const dynamic = "force-dynamic";

export default function ProductPage({ params }) {
  const all = getProducts({ period: 7 });
  const p = all.find(x => x.id === Number(params.id));
  if (!p) notFound();
  const pair = crossMarket(all).find(x => x.shopee.id === p.id || x.tiktok.id === p.id);
  const other = pair && (pair.shopee.id === p.id ? pair.tiktok : pair.shopee);
  const daily = p.history.slice(1).map((s, i) => {
    const prev = p.history[i], days = Math.max(1, Math.round((new Date(s.date) - new Date(prev.date)) / 864e5));
    return { x: s.date, y: Math.max(0, s.sold_total - prev.sold_total) / days };
  });
  const sv = productSentiment(p.id);
  return (
    <main>
      <Topbar />
      <section className="content" style={{ paddingTop: 40 }}>
        <Link href="/">← Kembali</Link>
        <div className="sectionTitle" style={{ marginTop: 14 }}>
          <div><h2>{p.title}</h2><p>{p.marketplace} · {p.shop || "-"} · {p.category}{p.url && <> · <a href={p.url} target="_blank" rel="noreferrer">Buka listing</a></>}</p></div>
        </div>
        <div className="insights" style={{ padding: 0 }}>
          <div><div><small>Harga terakhir</small><b>{rupiah(p.last.price)}</b></div></div>
          <div><div><small>Terjual total · rating</small><b>{p.last.sold_total.toLocaleString("id-ID")} · {p.last.rating ?? "-"}</b></div></div>
          <div><div><small>Omzet total estimasi</small><b>{rupiah(p.revenueTotal)}</b></div></div>
        </div>
        <div className="charts">
          <LineChart label="Harga" points={p.history.map(s => ({ x: s.date, y: s.price }))} fmt={rupiah} />
          <LineChart label="Terjual total (kumulatif)" points={p.history.map(s => ({ x: s.date, y: s.sold_total }))} />
          <LineChart label="Kecepatan jual (unit/hari)" points={daily} fmt={v => v.toFixed(1)} />
        </div>
        <div className="sectionTitle" style={{ marginTop: 34 }}><div><h2>Sentimen review</h2><p>{sv.n} review dianalisa</p></div></div>
        {sv.n === 0 ? <div className="empty">Belum ada review untuk produk ini. <Link href="/import">Impor review</Link>.</div> : <>
          <div className="insights" style={{ padding: 0 }}>
            <div><div><small>Positif</small><b>{sv.posPct.toFixed(0)}% ({sv.pos})</b></div></div>
            <div><div><small>Netral</small><b>{(100 - sv.posPct - sv.negPct).toFixed(0)}% ({sv.neu})</b></div></div>
            <div><div><small>Negatif</small><b>{sv.negPct.toFixed(0)}% ({sv.neg})</b></div></div>
          </div>
          {sv.topics.length > 0 && <div className="tableWrap"><table>
            <thead><tr><th>Topik</th><th>Positif</th><th>Keluhan</th></tr></thead>
            <tbody>{sv.topics.map(t => <tr key={t.topic}><td>{t.topic}</td><td>{t.pos}</td><td>{t.neg}</td></tr>)}</tbody>
          </table></div>}
          {sv.negSamples.length > 0 && <div className="tableWrap" style={{ marginTop: 14 }}><table>
            <thead><tr><th>Contoh review negatif</th><th>Tanggal</th><th>Rating</th></tr></thead>
            <tbody>{sv.negSamples.map(r => <tr key={r.id}><td style={{ whiteSpace: "normal" }}>{r.text}</td><td>{r.date}</td><td>{r.rating ?? "-"}</td></tr>)}</tbody>
          </table></div>}
        </>}
        {other && (
          <div className="tableWrap" style={{ marginTop: 24 }}><table>
            <thead><tr><th>Perbandingan</th><th>Harga</th><th>Terjual/hari (7h)</th><th>Terjual total</th></tr></thead>
            <tbody>{[p, other].map(x => <tr key={x.id}><td>{x.marketplace}</td><td>{rupiah(x.last.price)}</td><td>{x.perDay.toFixed(1)}</td><td>{x.last.sold_total.toLocaleString("id-ID")}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </main>
  );
}
