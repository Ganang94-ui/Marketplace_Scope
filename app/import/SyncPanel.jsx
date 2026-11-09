"use client";
import { useEffect, useState } from "react";

export default function SyncPanel({ token }) {
  const [logs, setLogs] = useState([]), [busy, setBusy] = useState(false), [note, setNote] = useState("");
  const h = { "x-import-token": token };
  const load = () => fetch("/api/sync", { headers: h }).then(r => r.ok ? r.json() : { logs: [] }).then(d => setLogs(d.logs || [])).catch(() => {});
  useEffect(() => { load(); }, []);
  async function run() {
    setBusy(true); setNote("");
    const r = await fetch("/api/sync", { method: "POST", headers: h });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setNote(d.error || "Gagal"); else { setNote(d.results.map(x => `${x.source}: ${x.status}${x.message ? " (" + x.message + ")" : ""}`).join(" · ")); setLogs(d.logs); }
    setBusy(false);
  }
  return (
    <div style={{ marginTop: 34 }}>
      <h3>Sinkronisasi otomatis</h3>
      <p className="sub"><small>Mengambil CSV dari FEED_PRODUCTS_URL dan FEED_REVIEWS_URL (diatur di .env). Jadwal: <code>SYNC_EVERY_HOURS</code>, <code>npm run sync</code> via cron, atau panggil <code>POST /api/sync</code>.</small></p>
      <button className="chip active" onClick={run} disabled={busy}>{busy ? "Menyinkronkan..." : "Sinkronkan sekarang"}</button>
      {note && <p className="sub">{note}</p>}
      {logs.length > 0 && <div className="tableWrap" style={{ marginTop: 12 }}><table>
        <thead><tr><th>Waktu (UTC)</th><th>Sumber</th><th>Status</th><th>Baris</th><th>Catatan</th></tr></thead>
        <tbody>{logs.map(l => <tr key={l.id}><td>{l.at}</td><td>{l.source}</td><td>{l.status}</td><td>{l.rows}</td><td>{l.message}</td></tr>)}</tbody>
      </table></div>}
    </div>
  );
}
