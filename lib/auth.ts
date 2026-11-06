import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from './db';

export const SESSION_COOKIE = 'spb_session';
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'author' | 'admin';
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Used when the email is unknown so login timing does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export async function verifyLogin(email: string, password: string): Promise<User | null> {
  const row = getDb()
    .prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ?')
    .get(email) as (User & { password_hash: string }) | undefined;
  const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !ok) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

export function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    sha256(token),
    userId,
    expires.toISOString().replace('T', ' ').slice(0, 19),
  );
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.SITE_URL || '').startsWith('https://'),
    path: '/',
    expires,
  });
}

export function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  cookies().delete(SESSION_COOKIE);
}

export function getCurrentUser(): User | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
    )
    .get(sha256(token)) as User | undefined;
  return row ?? null;
}

export function requireUser(next = '/dashboard'): User {
  const user = getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export function requireAdmin(): User {
  const user = requireUser('/admin');
  if (user.role !== 'admin') redirect('/dashboard?error=' + encodeURIComponent('Admin access only.'));
  return user;
}
