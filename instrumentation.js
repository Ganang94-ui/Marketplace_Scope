// Penjadwal bawaan: aktif bila SYNC_EVERY_HOURS diisi (server Node yang berjalan terus, bukan serverless).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const h = Number(process.env.SYNC_EVERY_HOURS);
  if (!h || h <= 0 || globalThis.__msSyncTimer) return;
  const { runSync } = await import("./lib/sources.js");
  globalThis.__msSyncTimer = setInterval(() => runSync().catch(e => console.error("[MarketScope] sync gagal:", e.message)), h * 3600e3);
  console.log(`[MarketScope] sinkronisasi otomatis tiap ${h} jam`);
}
