'use server';

import { redirect } from 'next/navigation';
import { getDb } from '@/lib/db';
import { createSession, destroySession, hashPassword, verifyLogin } from '@/lib/auth';
import { isEmail, safeNext, str } from '@/lib/validation';

function back(path: string, error: string, next?: string): never {
  const q = new URLSearchParams({ error });
  if (next) q.set('next', next);
  redirect(`${path}?${q.toString()}`);
}

export async function signupAction(formData: FormData) {
  const name = str(formData.get('name'), 120);
  const email = str(formData.get('email'), 254).toLowerCase();
  const password = typeof formData.get('password') === 'string' ? (formData.get('password') as string) : '';
  const confirm = typeof formData.get('confirm') === 'string' ? (formData.get('confirm') as string) : '';

  if (!name) back('/signup', 'Please enter your name.');
  if (!isEmail(email)) back('/signup', 'Please enter a valid email address.');
  if (password.length < 10) back('/signup', 'Password must be at least 10 characters.');
  if (password.length > 200) back('/signup', 'Password is too long.');
  if (password !== confirm) back('/signup', 'Passwords do not match.');
  if (formData.get('terms') !== 'on') back('/signup', 'Please accept the author terms.');

  const db = getDb();
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    back('/signup', 'An account with that email already exists. Try logging in.');
  }
  const hash = await hashPassword(password);
  // New accounts are always authors. Admins are created with `npm run create-admin`.
  const res = db.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'author')").run(email, hash, name);
  createSession(Number(res.lastInsertRowid));
  redirect('/dashboard');
}

export async function loginAction(formData: FormData) {
  const email = str(formData.get('email'), 254).toLowerCase();
  const password = typeof formData.get('password') === 'string' ? (formData.get('password') as string) : '';
  const next = safeNext(str(formData.get('next'), 300));
  const user = await verifyLogin(email, password);
  if (!user) back('/login', 'Email or password is incorrect.', next);
  createSession(user.id);
  redirect(user.role === 'admin' && next === '/dashboard' ? '/admin' : next);
}

export async function logoutAction() {
  destroySession();
  redirect('/');
}
