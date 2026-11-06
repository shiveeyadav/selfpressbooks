// Applies lib/schema.sql to an in-memory database with Node's built-in
// SQLite (better-sqlite3 cannot be installed in the build container) and
// checks the main constraints.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = require('node:sqlite');

function fresh() {
  const db = new DatabaseSync(':memory:');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'lib', 'schema.sql'), 'utf8');
  db.exec(sql);
  db.exec(sql); // idempotent
  return db;
}

function insertBook(db: any, overrides: Record<string, unknown> = {}) {
  const row = {
    user_id: 1, slug: 'b-' + Math.random(), title: 'T', author_name: 'A', description: 'D', language: 'English',
    trim_size: 'A5', paper: 'bw', binding: 'paperback', page_count: 100, retail_pence: 1000,
    print_cost_pence: 100, shipping_pence: 400, platform_margin_pence: 150, royalty_pence: 350,
    interior_file: 'i.pdf', interior_original: 'i.pdf', cover_file: 'c.jpg', cover_original: 'c.jpg', cover_mime: 'image/jpeg',
    ...overrides,
  };
  const cols = Object.keys(row);
  db.prepare(`INSERT INTO books (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...Object.values(row));
}

test('schema applies twice and enforces constraints', () => {
  const db = fresh();
  db.prepare("INSERT INTO users (email, password_hash, name) VALUES ('a@b.c', 'x', 'A')").run();
  assert.throws(() => db.prepare("INSERT INTO users (email, password_hash, name) VALUES ('A@B.C', 'x', 'A')").run());
  insertBook(db);
  const b = db.prepare('SELECT status FROM books').get();
  assert.equal(b.status, 'pending_review');
  assert.throws(() => insertBook(db, { royalty_pence: -1 }));
  assert.throws(() => insertBook(db, { trim_size: 'A3' }));
  db.prepare("INSERT INTO orders (public_ref, email, full_name, address_line1, city, postcode, total_pence) VALUES ('R1','e@x','N','1 St','London','SW1A 1AA',1000)").run();
  assert.equal(db.prepare('SELECT status FROM orders').get().status, 'pending_payment');
  assert.throws(() => db.prepare("UPDATE orders SET status='refunded_magic'").run());
  assert.throws(() => db.prepare("UPDATE orders SET country='US'").run());
});
