// Sesi bertanda tangan HMAC (Web Crypto: jalan di Edge middleware maupun Node).
export const COOKIE = "ms_session";
const enc = new TextEncoder();
const secret = () => process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";

async function sign(msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };

export async function createSession() {
  const exp = Date.now() + 7 * 864e5;
  return exp + "." + (await sign("s:" + exp));
}
export async function verifySession(v) {
  if (!v || !secret()) return false;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return same(sig, await sign("s:" + exp));
}
export async function checkPassword(input) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  return same(await sign("pw:" + String(input)), await sign("pw:" + pw));
}
