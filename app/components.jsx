import Link from "next/link";

export function Topbar({ q = "", market = "All", category = "All", period = 7 }) {
  return (
    <header className="topbar">
      <Link href="/" className="brand"><span>◆</span> MarketScope</Link>
      <form className="searchWrap" action="/">
        <input name="q" defaultValue={q} placeholder="Cari produk atau toko..." />
        <input type="hidden" name="market" value={market} />
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="period" value={period} />
        <button type="submit">Cari</button>
      </form>
      <Link href="/import" className="login">Impor data</Link>
      <Link href="/login" className="login">Akun</Link>
    </header>
  );
}

export function LineChart({ points, label, fmt = v => v }) {
  if (points.length < 2) return <div className="empty">Butuh minimal 2 snapshot untuk grafik {label}.</div>;
  const W = 560, H = 160, P = 28;
  const ys = points.map(p => p.y), min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1;
  const x = i => P + (i * (W - 2 * P)) / (points.length - 1);
  const y = v => H - P - ((v - min) / span) * (H - 2 * P);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  return (
    <div className="chartBox">
      <b>{label}</b>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label}>
        <path d={d} fill="none" stroke="#111827" strokeWidth="2.5" />
        {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.y)} r="3.5" fill="#111827" />)}
        <text x={P} y={H - 6} fontSize="10" fill="#8a93a3">{points[0].x}</text>
        <text x={W - P} y={H - 6} fontSize="10" fill="#8a93a3" textAnchor="end">{points[points.length - 1].x}</text>
        <text x={P} y={14} fontSize="10" fill="#8a93a3">max {fmt(max)} · min {fmt(min)}</text>
      </svg>
    </div>
  );
}
