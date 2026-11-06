#!/usr/bin/env node
// Creates an admin (owner) account, or promotes an existing account to admin.
//
//   node scripts/create-admin.mjs owner@example.com "Owner Name"
//
// The password is read from ADMIN_PASSWORD if set, otherwise prompted for.
// In Docker:  docker compose exec app node scripts/create-admin.mjs owner@example.com "Owner Name"
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const [email, name] = process.argv.slice(2);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: node scripts/create-admin.mjs <email> "<name>"');
  process.exit(1);
}

const dataDir = path.resolve(process.env.DATA_DIR || './data');
fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });
const db = new Database(path.join(dataDir, 'selfpressbooks.db'));
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(process.cwd(), 'lib', 'schema.sql'), 'utf8'));

const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(email.toLowerCase());
let password = process.env.ADMIN_PASSWORD || '';
if (!existing || process.argv.includes('--reset-password')) {
  if (!password) {
    const rl = readline.createInterface({ input, output });
    password = await rl.question('Password (min 12 chars, will be visible as you type): ');
    rl.close();
  }
  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }
}

if (existing) {
  if (password) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 12), existing.id);
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existing.id);
  console.log(`Existing account ${email} is now an admin${password ? ' (password updated)' : ''}.`);
} else {
  db.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')")
    .run(email.toLowerCase(), bcrypt.hashSync(password, 12), name || 'Owner');
  console.log(`Admin account ${email} created.`);
}
db.close();
