import test from "node:test";
import assert from "node:assert";
import { analyze } from "../lib/sentiment.js";

test("positif", () => assert.equal(analyze("Barang bagus banget, pengiriman cepat").label, "positif"));
test("negatif", () => assert.equal(analyze("Kecewa, barang rusak").label, "negatif"));
test("negasi membalik makna", () => assert.equal(analyze("tidak bagus").label, "negatif"));
test("topik per klausa", () => {
  const t = analyze("Kualitas bagus tapi pengiriman lama").topics;
  assert.equal(t.find(x => x.topic === "kualitas").label, "positif");
  assert.equal(t.find(x => x.topic === "pengiriman").label, "negatif");
});
test("fallback ke rating bila tanpa kata sentimen", () => assert.equal(analyze("xyz", 1).label, "negatif"));

test("slang & huruf berulang", () => {
  assert.equal(analyze("seller gercep, barangnya mantaaap").label, "positif");
  assert.equal(analyze("pengiriman ngaret, kapok").label, "negatif");
});
test("negasi slang", () => assert.equal(analyze("gk bagus").label, "negatif"));
test("emoji", () => { assert.equal(analyze("👍").label, "positif"); assert.equal(analyze("😡").label, "negatif"); });
test("topik slang", () => assert.ok(analyze("kurirnya ngaret").topics.some(t => t.topic === "pengiriman" && t.label === "negatif")));
