import 'server-only';
import { headers } from 'next/headers';

/** Public base URL: SITE_URL if set, otherwise derived from the (nginx-forwarded) request. */
export function siteUrl(): string {
  const env = process.env.SITE_URL?.trim().replace(/\/+$/, '');
  if (env) return env;
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  return `${proto}://${host}`;
}
