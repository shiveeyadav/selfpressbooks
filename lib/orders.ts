import 'server-only';
import crypto from 'node:crypto';
import { getDb } from './db';
import type { Book } from './books';
import type { Cart } from './cart';
import { checkTransition, type OrderStatus } from './order-status';

export interface Order {
  id: number;
  public_ref: string;
  access_token_hash: string;
  user_id: number | null;
  email: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
  country: string;
  total_pence: number;
  status: OrderStatus;
  stripe_session_id: string | null;
  tracking_number: string | null;
  admin_note: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  book_id: number;
  quantity: number;
  unit_price_pence: number;
  print_cost_pence: number;
  royalty_pence: number;
  title: string;
}

export interface OrderEvent {
  id: number;
  from_status: string | null;
  to_status: string;
  note: string | null;
  actor: string;
  created_at: string;
}

export interface CartLine {
  book: Book;
  quantity: number;
  linePence: number;
}

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

/** Resolves basket contents against the DB; drops books that are no longer approved. */
export function cartLines(cart: Cart): CartLine[] {
  const ids = Object.keys(cart).map(Number).filter(Number.isInteger);
  if (ids.length === 0) return [];
  const books = getDb()
    .prepare(`SELECT * FROM books WHERE status = 'approved' AND id IN (${ids.map(() => '?').join(',')})`)
    .all(...ids) as Book[];
  return books.map((book) => {
    const quantity = cart[String(book.id)];
    return { book, quantity, linePence: book.retail_pence * quantity };
  });
}

export interface AddressInput {
  email: string;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  county: string | null;
  postcode: string;
}

/** Creates an order in pending_payment. Returns the order and the plain access token for the buyer's link. */
export function createOrder(userId: number | null, address: AddressInput, lines: CartLine[]): { order: Order; accessToken: string } {
  if (lines.length === 0) throw new Error('Empty order');
  const db = getDb();
  const accessToken = crypto.randomBytes(24).toString('base64url');
  const total = lines.reduce((a, l) => a + l.linePence, 0);

  const tx = db.transaction(() => {
    let ref = '';
    for (let i = 0; i < 5; i++) {
      ref = 'SPB-' + crypto.randomBytes(5).toString('hex').toUpperCase();
      if (!db.prepare('SELECT 1 FROM orders WHERE public_ref = ?').get(ref)) break;
    }
    const res = db
      .prepare(
        `INSERT INTO orders (public_ref, access_token_hash, user_id, email, full_name, phone, address_line1, address_line2,
           city, county, postcode, country, total_pence, status)
         VALUES (@ref, @tok, @user_id, @email, @full_name, @phone, @address_line1, @address_line2,
           @city, @county, @postcode, 'GB', @total, 'pending_payment')`,
      )
      .run({ ref, tok: sha256(accessToken), user_id: userId, total, ...address });
    const orderId = Number(res.lastInsertRowid);
    const ins = db.prepare(
      `INSERT INTO order_items (order_id, book_id, quantity, unit_price_pence, print_cost_pence, royalty_pence, title)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const l of lines) {
      ins.run(orderId, l.book.id, l.quantity, l.book.retail_pence, l.book.print_cost_pence, l.book.royalty_pence, l.book.title);
    }
    db.prepare("INSERT INTO order_events (order_id, from_status, to_status, note, actor) VALUES (?, NULL, 'pending_payment', 'Order placed', 'customer')").run(orderId);
    return orderId;
  });
  const order = getOrder(tx())!;
  return { order, accessToken };
}

export function getOrder(id: number): Order | undefined {
  return getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order | undefined;
}

/** Looks up an order for the buyer's status link; requires the secret token. */
export function getOrderForBuyer(ref: string, token: string): Order | undefined {
  if (!ref || !token) return undefined;
  const order = getDb().prepare('SELECT * FROM orders WHERE public_ref = ?').get(ref) as Order | undefined;
  if (!order) return undefined;
  const a = Buffer.from(order.access_token_hash, 'hex');
  const b = Buffer.from(sha256(token), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? order : undefined;
}

export function orderItems(orderId: number): (OrderItem & { slug: string; trim_size: string; paper: string; binding: string; page_count: number; interior_original: string; cover_original: string; isbn: string | null; author_name: string })[] {
  return getDb()
    .prepare(
      `SELECT oi.*, b.slug, b.trim_size, b.paper, b.binding, b.page_count, b.interior_original, b.cover_original, b.isbn, b.author_name
       FROM order_items oi JOIN books b ON b.id = oi.book_id WHERE oi.order_id = ? ORDER BY oi.id`,
    )
    .all(orderId) as ReturnType<typeof orderItems>;
}

export function orderEvents(orderId: number): OrderEvent[] {
  return getDb().prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY id').all(orderId) as OrderEvent[];
}

export function listOrders(status: OrderStatus | 'all' | 'active'): (Order & { item_count: number })[] {
  const where =
    status === 'all' ? '' : status === 'active' ? "WHERE o.status NOT IN ('delivered', 'cancelled', 'pending_payment')" : 'WHERE o.status = ?';
  const args = status === 'all' || status === 'active' ? [] : [status];
  return getDb()
    .prepare(
      `SELECT o.*, COALESCE((SELECT SUM(quantity) FROM order_items WHERE order_id = o.id), 0) AS item_count
       FROM orders o ${where} ORDER BY o.created_at DESC LIMIT 500`,
    )
    .all(...args) as (Order & { item_count: number })[];
}

export function setStripeSession(orderId: number, sessionId: string) {
  getDb().prepare("UPDATE orders SET stripe_session_id = ?, updated_at = datetime('now') WHERE id = ?").run(sessionId, orderId);
}

export function countPaymentAttempts(orderId: number): number {
  const r = getDb().prepare("SELECT COUNT(*) AS n FROM order_events WHERE order_id = ? AND note LIKE 'Stripe checkout session created%'").get(orderId) as { n: number };
  return r.n;
}

export function logEvent(orderId: number, from: string | null, to: string, note: string | null, actor: string) {
  getDb().prepare('INSERT INTO order_events (order_id, from_status, to_status, note, actor) VALUES (?, ?, ?, ?, ?)').run(orderId, from, to, note, actor);
}

/**
 * Marks an order paid after Stripe confirms payment. Idempotent. Checks the
 * amount and currency match the order before accepting.
 */
export function markPaidFromStripe(orderId: number, sessionId: string, amountTotal: number | null, currency: string | null): string | null {
  const db = getDb();
  const tx = db.transaction(() => {
    const order = getOrder(orderId);
    if (!order) return 'order not found';
    if (order.status !== 'pending_payment') return null; // already processed
    if (amountTotal !== order.total_pence || (currency ?? '').toLowerCase() !== 'gbp') {
      logEvent(orderId, order.status, order.status, `Stripe amount mismatch: got ${amountTotal} ${currency}, expected ${order.total_pence} gbp (session ${sessionId}). NOT marked paid.`, 'stripe');
      return 'amount mismatch';
    }
    db.prepare("UPDATE orders SET status = 'paid', paid_at = datetime('now'), stripe_session_id = ?, updated_at = datetime('now') WHERE id = ?").run(sessionId, orderId);
    logEvent(orderId, 'pending_payment', 'paid', `Payment confirmed by Stripe (session ${sessionId})`, 'stripe');
    return null;
  });
  return tx();
}

/** Admin status change. Returns an error message or null. */
export function changeOrderStatus(orderId: number, to: OrderStatus, actor: string, note: string | null, trackingNumber: string | null): string | null {
  const db = getDb();
  const tx = db.transaction(() => {
    const order = getOrder(orderId);
    if (!order) return 'Order not found.';
    const tracking = trackingNumber?.trim() || order.tracking_number;
    const err = checkTransition(order.status, to, { trackingNumber: tracking, note });
    if (err) return err;
    db.prepare(
      `UPDATE orders SET status = ?, tracking_number = ?, updated_at = datetime('now'),
         paid_at = CASE WHEN ? = 'paid' THEN datetime('now') ELSE paid_at END WHERE id = ?`,
    ).run(to, tracking ?? null, to, orderId);
    logEvent(orderId, order.status, to, [note, to === 'shipped' ? `Tracking: ${tracking}` : null].filter(Boolean).join(' | ') || null, actor);
    return null;
  });
  return tx();
}

export function updateTracking(orderId: number, tracking: string | null, actor: string) {
  const order = getOrder(orderId);
  if (!order) return;
  getDb().prepare("UPDATE orders SET tracking_number = ?, updated_at = datetime('now') WHERE id = ?").run(tracking, orderId);
  logEvent(orderId, order.status, order.status, `Tracking number set to ${tracking ?? '(none)'}`, actor);
}

export function updateAdminNote(orderId: number, note: string | null) {
  getDb().prepare("UPDATE orders SET admin_note = ?, updated_at = datetime('now') WHERE id = ?").run(note, orderId);
}
