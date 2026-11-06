'use server';

import { redirect } from 'next/navigation';
import { getBook } from '@/lib/books';
import { MAX_QTY, readCart, writeCart } from '@/lib/cart';

function qty(v: FormDataEntryValue | null, fallback = 1): number {
  const n = Number(v);
  return Number.isInteger(n) ? Math.max(0, Math.min(MAX_QTY, n)) : fallback;
}

export async function addToCartAction(formData: FormData) {
  const id = Number(formData.get('book_id'));
  const book = Number.isInteger(id) ? getBook(id) : undefined;
  if (!book || book.status !== 'approved') redirect('/cart?error=' + encodeURIComponent('That book is not available.'));
  const cart = readCart();
  cart[String(id)] = Math.min(MAX_QTY, (cart[String(id)] || 0) + Math.max(1, qty(formData.get('quantity'))));
  writeCart(cart);
  redirect('/cart');
}

export async function updateCartAction(formData: FormData) {
  const id = String(Number(formData.get('book_id')));
  const cart = readCart();
  const q = formData.get('remove') ? 0 : qty(formData.get('quantity'), cart[id] || 0);
  if (q === 0) delete cart[id];
  else cart[id] = q;
  writeCart(cart);
  redirect('/cart');
}
