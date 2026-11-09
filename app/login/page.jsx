"use client";
import { useState } from "react";
import { Topbar } from "../components.jsx";

export default function Login() {
  const [pw, setPw] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg("");
    const r = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) {
      const next = new URLSearchParams(window.location.search).get("next") || "/import";
      window.location.href = next.startsWith("/") && !next.startsWith("//") ? next : "/import";
    } else { setMsg((await r.json().catch(() => ({}))).error || "Gagal masuk"); setBusy(false); }
  }
  async function logout() { await fetch("/api/logout", { method: "POST" }); setMsg("Anda sudah keluar."); }
  return (
    <main>
      <Topbar />
      <section className="content" style={{ paddingTop: 50, maxWidth: 420 }}>
        <h2>Masuk</h2>
        <form onSubmit={submit}>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password admin" autoFocus
            style={{ padding: 12, border: "1px solid #dfe3eb", borderRadius: 9, width: "100%", marginBottom: 12 }} />
          <button className="chip active" disabled={busy || !pw} type="submit">Masuk</button>{" "}
          <button className="chip" type="button" onClick={logout}>Keluar</button>
        </form>
        {msg && <p className="sub">{msg}</p>}
      </section>
    </main>
  );
}
