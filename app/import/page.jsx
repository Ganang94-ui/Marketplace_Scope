"use client";
import { useState } from "react";
import { Topbar } from "../components.jsx";
import SyncPanel from "./SyncPanel.jsx";

export default function ImportPage() {
  const [token, setToken] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setRes(null);
    try {
      const r = await fetch("/api/import", { method: "POST", headers: { "x-import-token": token }, body: await f.text() });
      setRes(await r.json());
    } catch { setRes({ error: "Gagal mengunggah" }); }
    setBusy(false); e.target.value = "";
  }

  return (
    <main>
      <Topbar />
      <section className="content" style={{ paddingTop: 40, maxWidth: 760 }}>
        <h2>Impor data (CSV)</h2>
        <p className="sub">Unggah CSV secara berkala (mis. harian). Setiap baris = satu produk pada satu tanggal. Baris dengan produk+tanggal yang sama akan diperbarui. <a href="/template.csv" download>Template snapshot</a> · <a href="/reviews-template.csv" download>Template review</a></p>
        <p className="sub"><small>Jenis file dikenali otomatis: ada kolom <b>text</b> = review (marketplace, external_id, date, text, rating opsional). Impor snapshot produk lebih dulu agar review bisa dikaitkan ke produk.</small></p>
        <p className="sub"><small>Kolom wajib: marketplace, external_id, title, date (YYYY-MM-DD), price, sold_total. Opsional: category, shop, url, rating, review_count. Gunakan data dari sumber yang sah (export Seller Center, API resmi, atau penyedia data berlisensi).</small></p>
        <input placeholder="Token impor (jika diatur)" value={token} onChange={e => setToken(e.target.value)} type="password" style={{ padding: 10, border: "1px solid #dfe3eb", borderRadius: 9, marginBottom: 12, width: "100%" }} />
        <input type="file" accept=".csv,text/csv" onChange={onFile} disabled={busy} />
        {busy && <p>Memproses...</p>}
        {res && <div className="empty" style={{ textAlign: "left", marginTop: 16 }}>
          {res.error ? <b>{res.error}</b> : <><b>{res.imported} {res.type === "review" ? "review" : "baris"} diimpor</b>{res.duplicates > 0 && <> · {res.duplicates} duplikat</>}{res.skipped > 0 && <> · {res.skipped} dilewati</>}</>}
          {res.errors?.length > 0 && <ul>{res.errors.map((x, i) => <li key={i}>{x}</li>)}</ul>}
        </div>}
        <SyncPanel token={token} />
      </section>
    </main>
  );
}
