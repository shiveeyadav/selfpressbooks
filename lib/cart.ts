import 'server-only';
import { cookies } from 'next/headers';

export const CART_COOKIE = 'spb_cart';
export const MAX_QTY = 20;
const MAX_LINES = 30;

export type Cart = Record<string, number>; // bookId -> quantity

export function readCart(): Cart {
  const raw = cookies().get(CART_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const cart: Cart = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (/^\d+$/.test(k) && Number.isInteger(v) && (v as number) > 0) cart[k] = Math.min(v as number, MAX_QTY);
    }
    return cart;
  } catch {
    return {};
  }
}

export function writeCart(cart: Cart) {
  const entries = Object.entries(cart).filter(([, q]) => q > 0).slice(0, MAX_LINES);
  if (entries.length === 0) {
    cookies().delete(CART_COOKIE);
    return;
  }
  cookies().set(CART_COOKIE, JSON.stringify(Object.fromEntries(entries)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: (process.env.SITE_URL || '').startsWith('https://'),
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function cartCount(cart: Cart = readCart()): number {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}
