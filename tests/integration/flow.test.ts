// End-to-end test of the data layer (books, review, basket -> order, Stripe
// payment confirmation, status flow, content pages, auth sessions) against a
// temporary SQLite database. Run with:
//   tsx --tsconfig tests/integration/tsconfig.json --test tests/integration/flow.test.ts
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spb-'));
process.env.DATA_DIR = dir;

let books: typeof import('@/lib/books');
let orders: typeof import('@/lib/orders');
let content: typeof import('@/lib/content');
let auth: typeof import('@/lib/auth');
let db: typeof import('@/lib/db');

before(async () => {
  db = await import('@/lib/db');
  books = await import('@/lib/books');
  orders = await import('@/lib/orders');
  content = await import('@/lib/content');
  auth = await import('@/lib/auth');
});

function newBook(userId: number, title: string) {
  return books.insertBook({
    user_id: userId, slug: title.toLowerCase().replace(/\W+/g, '-'), title, author_name: 'Jane Writer',
    description: 'A long enough description of the book.', isbn: null, language: 'English',
    trim_size: 'A5', paper: 'bw', binding: 'paperback', page_count: 200, retail_pence: 999,
    print_cost_pence: 150, shipping_pence: 400, platform_margin_pence: 150, royalty_pence: 299,
    interior_file: 'a'.repeat(32) + '.pdf', interior_original: 'in.pdf', cover_file: 'b'.repeat(32) + '.jpg',
    cover_original: 'c.jpg', cover_mime: 'image/jpeg',
  });
}

test('auth: password check and session cookie', async () => {
  const hash = await auth.hashPassword('correct horse battery');
  const r = db.getDb().prepare("INSERT INTO users (email, password_hash, name) VALUES ('jane@example.com', ?, 'Jane')").run(hash);
  assert.equal(await auth.verifyLogin('jane@example.com', 'wrong password!!'), null);
  const u = await auth.verifyLogin('jane@example.com', 'correct horse battery');
  assert.equal(u?.id, Number(r.lastInsertRowid));
  assert.equal(auth.getCurrentUser(), null);
  auth.createSession(u!.id);
  assert.equal(auth.getCurrentUser()?.email, 'jane@example.com');
  auth.destroySession();
  assert.equal(auth.getCurrentUser(), null);
});

test('books are hidden until approved; search works', () => {
  const id = newBook(1, 'The Monsoon Garden');
  newBook(1, 'Hidden Draft');
  assert.equal(books.listApproved().length, 0);
  assert.equal(books.getApprovedBySlug('the-monsoon-garden'), undefined);
  books.setBookStatus(id, 'approved', null);
  assert.equal(books.listApproved().length, 1);
  assert.equal(books.searchApproved('monsoon').length, 1);
  assert.equal(books.searchApproved('Hidden').length, 0);
  assert.equal(books.searchApproved('100%_').length, 0);
});

test('order flow: basket -> pending_payment -> stripe paid -> shipped -> delivered', () => {
  const approved = books.listApproved()[0];
  const hidden = books.listForReview('pending_review')[0];
  const lines = orders.cartLines({ [String(approved.id)]: 2, [String(hidden.id)]: 1 });
  assert.equal(lines.length, 1, 'unapproved book dropped from basket');
  const { order, accessToken } = orders.createOrder(null, {
    email: 'buyer@example.co.uk', full_name: 'A Buyer', phone: null, address_line1: '1 High St', address_line2: null,
    city: 'Leeds', county: null, postcode: 'LS1 1AA',
  }, lines);
  assert.equal(order.status, 'pending_payment');
  assert.equal(order.total_pence, 1998);
  assert.ok(orders.getOrderForBuyer(order.public_ref, accessToken));
  assert.equal(orders.getOrderForBuyer(order.public_ref, 'wrong'), undefined);

  // Wrong amount must not mark paid.
  assert.equal(orders.markPaidFromStripe(order.id, 'cs_test_1', 100, 'gbp'), 'amount mismatch');
  assert.equal(orders.getOrder(order.id)!.status, 'pending_payment');
  // Admin cannot skip ahead.
  assert.ok(orders.changeOrderStatus(order.id, 'sent_to_printer', 'admin:t', null, null));
  // Correct payment.
  assert.equal(orders.markPaidFromStripe(order.id, 'cs_test_1', 1998, 'gbp'), null);
  assert.equal(orders.getOrder(order.id)!.status, 'paid');
  assert.equal(orders.markPaidFromStripe(order.id, 'cs_test_1', 1998, 'gbp'), null, 'idempotent');

  assert.equal(orders.changeOrderStatus(order.id, 'sent_to_printer', 'admin:t', null, null), null);
  assert.equal(orders.changeOrderStatus(order.id, 'printed', 'admin:t', null, null), null);
  assert.match(orders.changeOrderStatus(order.id, 'shipped', 'admin:t', null, null)!, /tracking/);
  assert.equal(orders.changeOrderStatus(order.id, 'shipped', 'admin:t', null, 'EX123456789IN'), null);
  assert.equal(orders.getOrder(order.id)!.tracking_number, 'EX123456789IN');
  assert.equal(orders.changeOrderStatus(order.id, 'delivered', 'admin:t', null, null), null);
  assert.ok(orders.changeOrderStatus(order.id, 'cancelled', 'admin:t', null, null));

  const ev = orders.orderEvents(order.id).map((e) => e.to_status);
  for (const s of ['pending_payment', 'paid', 'sent_to_printer', 'printed', 'shipped', 'delivered']) assert.ok(ev.includes(s), s);
  assert.equal(orders.listOrders('delivered').length, 1);
  assert.equal(orders.orderItems(order.id)[0].quantity, 2);

  // Sales show on the author dashboard query.
  const mine = books.listByUser(1).find((b) => b.id === approved.id)!;
  assert.equal(mine.copies_sold, 2);
  assert.equal(mine.royalty_earned_pence, 598);
});

test('content pages default to draft and can be saved as reviewed', () => {
  const p = content.getContentPage('delivery')!;
  assert.equal(p.reviewed, false);
  assert.match(p.body, /India Post/);
  content.saveContentPage('delivery', 'Delivery', 'New text', true);
  const q = content.getContentPage('delivery')!;
  assert.equal(q.reviewed, true);
  assert.equal(q.body, 'New text');
  assert.equal(content.listContentPages().length, 5);
});
