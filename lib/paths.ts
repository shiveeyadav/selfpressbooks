import path from 'node:path';
import fs from 'node:fs';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
export const DB_PATH = path.join(DATA_DIR, 'selfpressbooks.db');

export function ensureDirs() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
