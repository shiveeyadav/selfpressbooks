import 'server-only';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { DB_PATH, ensureDirs } from './paths';

declare global {
  // eslint-disable-next-line no-var
  var __spbDb: Database.Database | undefined;
}

function schemaSql(): string {
  // lib/schema.sql is copied into the Docker image next to the standalone server.
  const candidates = [path.join(process.cwd(), 'lib', 'schema.sql')];
  for (const c of candidates) if (fs.existsSync(c)) return fs.readFileSync(c, 'utf8');
  throw new Error('lib/schema.sql not found (cwd=' + process.cwd() + ')');
}

function open(): Database.Database {
  ensureDirs();
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(schemaSql());
  return db;
}

/** Shared connection (cached across hot reloads in dev). */
export function getDb(): Database.Database {
  if (!globalThis.__spbDb) globalThis.__spbDb = open();
  return globalThis.__spbDb;
}
