import test from "node:test";
import assert from "node:assert";
import { createSession, verifySession, checkPassword } from "../lib/session.js";

process.env.ADMIN_PASSWORD = "rahasia123";
test("sesi valid & dimanipulasi", async () => {
  const s = await createSession();
  assert.equal(await verifySession(s), true);
  assert.equal(await verifySession(s.slice(0, -2) + "00"), false);
  assert.equal(await verifySession("1.abc"), false);
});
test("password", async () => {
  assert.equal(await checkPassword("rahasia123"), true);
  assert.equal(await checkPassword("salah"), false);
});
