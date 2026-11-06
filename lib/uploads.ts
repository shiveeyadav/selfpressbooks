import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { UPLOADS_DIR, ensureDirs } from './paths';
import { detectFileType, type DetectedType } from './filetype';

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 100) * 1024 * 1024;

export interface SavedFile {
  storedName: string;
  originalName: string;
  mime: DetectedType['mime'];
}

/**
 * Validates by file signature (not the browser-supplied type) and saves the
 * upload under a random name. Returns an error string on failure.
 */
export async function saveUpload(
  file: FormDataEntryValue | null,
  allowed: DetectedType['ext'][],
  label: string,
): Promise<SavedFile | string> {
  if (!file || typeof file === 'string' || file.size === 0) return `Please upload the ${label}.`;
  if (file.size > MAX_UPLOAD_BYTES) return `The ${label} is larger than ${Math.round(MAX_UPLOAD_BYTES / 1048576)} MB.`;
  const buf = Buffer.from(await file.arrayBuffer());
  const type = detectFileType(buf);
  if (!type || !allowed.includes(type.ext)) {
    return `The ${label} must be ${allowed.map((a) => a.toUpperCase()).join(' or ')}.`;
  }
  ensureDirs();
  const storedName = `${crypto.randomBytes(16).toString('hex')}.${type.ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, storedName), buf, { flag: 'wx' });
  const originalName = (file.name || `${label}.${type.ext}`).replace(/[^\w.\- ()]/g, '_').slice(0, 120);
  return { storedName, originalName, mime: type.mime };
}

export function deleteUpload(storedName: string) {
  try {
    fs.unlinkSync(uploadPath(storedName));
  } catch {
    /* already gone */
  }
}

/** Absolute path for a stored file name; refuses anything that is not a plain generated name. */
export function uploadPath(storedName: string): string {
  if (!/^[a-f0-9]{32}\.(pdf|jpg|png)$/.test(storedName)) throw new Error('Invalid stored file name');
  return path.join(UPLOADS_DIR, storedName);
}
