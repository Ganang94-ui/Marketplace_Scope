import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { analyze } from "./sentiment.js";

let db;
export function getDb() {
  if (db) return db;
  const file = path.resolve(process.env.DB_PATH || "./data/marketscope.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS products(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marketplace TEXT NOT NULL,
      external_id TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'Lainnya',
      shop TEXT DEFAULT '',
      url TEXT DEFAULT '',
      UNIQUE(marketplace, external_id)
    );
    CREATE TABLE IF NOT EXISTS snapshots(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      price REAL NOT NULL,
      sold_total INTEGER NOT NULL,
      rating REAL,
      review_count INTEGER,
      UNIQUE(product_id, date)
    );
    CREATE INDEX IF NOT EXISTS idx_snap_date ON snapshots(date);
    CREATE TABLE IF NOT EXISTS reviews(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      rating REAL,
      text TEXT NOT NULL,
      score REAL NOT NULL,
      label TEXT NOT NULL,
      topics TEXT NOT NULL DEFAULT '[]',
      hash TEXT NOT NULL,
      UNIQUE(product_id, hash)
    );
    CREATE INDEX IF NOT EXISTS idx_rev_product ON reviews(product_id);
    CREATE TABLE IF NOT EXISTS sync_log(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT NOT NULL DEFAULT (datetime('now')),
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      rows INTEGER NOT NULL DEFAULT 0,
      message TEXT DEFAULT ''
    );
  `);
  return db;
}

// Simpan satu baris ternormalisasi (dipakai CSV import dan connector API).
export function upsertRow(r) {
  const d = getDb();
  d.prepare(`INSERT INTO products(marketplace,external_id,title,category,shop,url)
    VALUES(@marketplace,@external_id,@title,@category,@shop,@url)
    ON CONFLICT(marketplace,external_id) DO UPDATE SET
      title=excluded.title, category=excluded.category, shop=excluded.shop,
      url=CASE WHEN excluded.url<>'' THEN excluded.url ELSE products.url END`).run(r);
  const { id } = d.prepare("SELECT id FROM products WHERE marketplace=? AND external_id=?").get(r.marketplace, r.external_id);
  d.prepare(`INSERT INTO snapshots(product_id,date,price,sold_total,rating,review_count)
    VALUES(?,?,?,?,?,?)
    ON CONFLICT(product_id,date) DO UPDATE SET price=excluded.price, sold_total=excluded.sold_total,
      rating=excluded.rating, review_count=excluded.review_count`)
    .run(id, r.date, r.price, r.sold_total, r.rating, r.review_count);
}

// Simpan satu review (analisa sentimen dihitung saat impor). Mengembalikan "ok" | "duplikat" | "produk-tidak-ada".
export function insertReview(r) {
  const d = getDb();
  const p = d.prepare("SELECT id FROM products WHERE marketplace=? AND external_id=?").get(r.marketplace, r.external_id);
  if (!p) return "produk-tidak-ada";
  const a = analyze(r.text, r.rating);
  const hash = crypto.createHash("sha1").update(r.date + "|" + r.text).digest("hex");
  const info = d.prepare(`INSERT OR IGNORE INTO reviews(product_id,date,rating,text,score,label,topics,hash)
    VALUES(?,?,?,?,?,?,?,?)`).run(p.id, r.date, r.rating, r.text, a.score, a.label, JSON.stringify(a.topics), hash);
  return info.changes ? "ok" : "duplikat";
}

export function logSync(source, status, rows, message = "") {
  getDb().prepare("INSERT INTO sync_log(source,status,rows,message) VALUES(?,?,?,?)").run(source, status, rows, message);
}
export function recentSyncs(n = 10) {
  return getDb().prepare("SELECT * FROM sync_log ORDER BY id DESC LIMIT ?").all(n);
}
