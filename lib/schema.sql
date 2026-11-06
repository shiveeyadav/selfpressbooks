-- SelfPressBooks SQLite schema. Applied idempotently at startup.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'author' CHECK (role IN ('author', 'admin')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS books (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug                  TEXT NOT NULL UNIQUE,
  title                 TEXT NOT NULL,
  author_name           TEXT NOT NULL,
  description           TEXT NOT NULL,
  isbn                  TEXT,
  language              TEXT NOT NULL,
  trim_size             TEXT NOT NULL CHECK (trim_size IN ('A5', 'B5_6x9', 'A4')),
  paper                 TEXT NOT NULL CHECK (paper IN ('bw', 'colour')),
  binding               TEXT NOT NULL CHECK (binding IN ('paperback', 'hardback')),
  page_count            INTEGER NOT NULL CHECK (page_count > 0),
  retail_pence          INTEGER NOT NULL CHECK (retail_pence > 0),
  -- Snapshot of the cost breakdown at submission time (rates may change later).
  print_cost_pence      INTEGER NOT NULL,
  shipping_pence        INTEGER NOT NULL,
  platform_margin_pence INTEGER NOT NULL,
  royalty_pence         INTEGER NOT NULL CHECK (royalty_pence >= 0),
  interior_file         TEXT NOT NULL,
  interior_original     TEXT NOT NULL,
  cover_file            TEXT NOT NULL,
  cover_original        TEXT NOT NULL,
  cover_mime            TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending_review'
                        CHECK (status IN ('pending_review', 'approved', 'rejected')),
  review_note           TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id);

CREATE TABLE IF NOT EXISTS orders (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  public_ref         TEXT NOT NULL UNIQUE,
  user_id            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email              TEXT NOT NULL,
  full_name          TEXT NOT NULL,
  phone              TEXT,
  address_line1      TEXT NOT NULL,
  address_line2      TEXT,
  city               TEXT NOT NULL,
  county             TEXT,
  postcode           TEXT NOT NULL,
  country            TEXT NOT NULL DEFAULT 'GB' CHECK (country = 'GB'),
  total_pence        INTEGER NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending_payment'
                     CHECK (status IN ('pending_payment', 'paid', 'sent_to_printer', 'printed',
                                       'shipped', 'delivered', 'cancelled')),
  stripe_session_id  TEXT,
  tracking_number    TEXT,
  admin_note         TEXT,
  paid_at            TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id           INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  book_id            INTEGER NOT NULL REFERENCES books(id),
  quantity           INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_pence   INTEGER NOT NULL,
  print_cost_pence   INTEGER NOT NULL,
  royalty_pence      INTEGER NOT NULL,
  title              TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book ON order_items(book_id);

-- Audit trail of every order status change.
CREATE TABLE IF NOT EXISTS order_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  note        TEXT,
  actor       TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Editable legal/content pages (About, Delivery, Returns, Privacy, Terms).
CREATE TABLE IF NOT EXISTS content_pages (
  slug        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  reviewed    INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Processed Stripe webhook events (idempotency).
CREATE TABLE IF NOT EXISTS stripe_events (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);
