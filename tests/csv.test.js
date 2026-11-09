import test from "node:test";
import assert from "node:assert";
import { toRecords } from "../lib/csv.js";

test("parse CSV valid", () => {
  const { records, errors } = toRecords("marketplace,external_id,title,date,price,sold_total\nShopee,1,\"A, B\",2026-11-01,1000,50\n");
  assert.equal(errors.length, 0);
  assert.equal(records[0].title, "A, B");
  assert.equal(records[0].marketplace, "Shopee");
});
test("tolak baris tidak valid", () => {
  const { records, errors } = toRecords("marketplace,external_id,title,date,price,sold_total\nLazada,1,A,2026-11-01,1000,50\n");
  assert.equal(records.length, 0);
  assert.equal(errors.length, 1);
});
