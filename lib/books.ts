import 'server-only';
import { getDb } from './db';

export interface Book {
  id: number;
  user_id: number;
  slug: string;
  title: string;
  author_name: string;
  description: string;
  isbn: string | null;
  language: string;
  trim_size: string;
  paper: string;
  binding: string;
  page_count: number;
  retail_pence: number;
  print_cost_pence: number;
  shipping_pence: number;
  platform_margin_pence: number;
  royalty_pence: number;
  interior_file: string;
  interior_original: string;
  cover_file: string;
  cover_original: string;
  cover_mime: string;
  status: 'pending_review' | 'approved' | 'rejected';
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export type NewBook = Omit<Book, 'id' | 'status' | 'review_note' | 'created_at' | 'updated_at'>;

export function insertBook(b: NewBook): number {
  const cols = Object.keys(b) as (keyof NewBook)[];
  const res = getDb()
    .prepare(`INSERT INTO books (${cols.join(', ')}) VALUES (${cols.map((c) => '@' + c).join(', ')})`)
    .run(b);
  return Number(res.lastInsertRowid);
}

export function getBook(id: number): Book | undefined {
  return getDb().prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
}

export function getApprovedBySlug(slug: string): Book | undefined {
  return getDb().prepare("SELECT * FROM books WHERE slug = ? AND status = 'approved'").get(slug) as Book | undefined;
}

export function listApproved(limit = 60): Book[] {
  return getDb()
    .prepare("SELECT * FROM books WHERE status = 'approved' ORDER BY updated_at DESC LIMIT ?")
    .all(limit) as Book[];
}

export function searchApproved(q: string, limit = 60): Book[] {
  const like = `%${q.replace(/[\\%_]/g, (m) => '\\' + m)}%`;
  return getDb()
    .prepare(
      `SELECT * FROM books WHERE status = 'approved'
       AND (title LIKE @like ESCAPE '\\' OR author_name LIKE @like ESCAPE '\\'
            OR description LIKE @like ESCAPE '\\' OR isbn LIKE @like ESCAPE '\\')
       ORDER BY (title LIKE @like ESCAPE '\\') DESC, updated_at DESC LIMIT @limit`,
    )
    .all({ like, limit }) as Book[];
}

export function listByUser(userId: number): (Book & { copies_sold: number; royalty_earned_pence: number })[] {
  return getDb()
    .prepare(
      `SELECT b.*,
         COALESCE(SUM(CASE WHEN o.status NOT IN ('pending_payment', 'cancelled') THEN oi.quantity END), 0) AS copies_sold,
         COALESCE(SUM(CASE WHEN o.status NOT IN ('pending_payment', 'cancelled') THEN oi.quantity * oi.royalty_pence END), 0) AS royalty_earned_pence
       FROM books b
       LEFT JOIN order_items oi ON oi.book_id = b.id
       LEFT JOIN orders o ON o.id = oi.order_id
       WHERE b.user_id = ?
       GROUP BY b.id ORDER BY b.created_at DESC`,
    )
    .all(userId) as (Book & { copies_sold: number; royalty_earned_pence: number })[];
}

export function listForReview(status: Book['status'] | 'all'): (Book & { owner_email: string })[] {
  const where = status === 'all' ? '' : 'WHERE b.status = ?';
  const args = status === 'all' ? [] : [status];
  return getDb()
    .prepare(
      `SELECT b.*, u.email AS owner_email FROM books b JOIN users u ON u.id = b.user_id ${where}
       ORDER BY CASE b.status WHEN 'pending_review' THEN 0 ELSE 1 END, b.created_at DESC`,
    )
    .all(...args) as (Book & { owner_email: string })[];
}

export function setBookStatus(id: number, status: Book['status'], note: string | null) {
  getDb()
    .prepare("UPDATE books SET status = ?, review_note = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, note, id);
}
