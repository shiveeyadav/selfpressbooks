# SelfPressBooks (selfpressbooks.com) – MVP

A print-on-demand self-publishing shop. Authors upload a finished book and set a price. When a UK reader buys it, the
owner sends the files to an Indian print-on-demand printer, and the printed copy is posted to the reader by India Post
(ITPS).

> **Status: first version, not yet built or run.** The npm registry could not be reached from the container this was
> written in, so `npm install`, `next build`, `next dev` and `docker build` were **never run**. There is no
> `package-lock.json` yet. See "What was tested / not tested" below before deploying.

## Features

- **Author accounts:** sign up, log in and log out (bcrypt via `bcryptjs`, httpOnly session cookie, tokens stored hashed).
  The dashboard shows each book's review status, the admin's note, royalty per copy, copies sold and royalties earned.
- **New book wizard** (`/dashboard/books/new`), in four steps:
  - Details: title, author name, description, optional ISBN (checksum validated), language.
  - Format: trim size (A5, B5/6x9, A4), B&W or colour, paperback or hardback, page count.
  - Files: interior PDF and a cover as JPG, PNG or PDF. Files are checked by their signature bytes and stored under
    random names.
  - Price: retail price with a live breakdown (printing, UK delivery, platform fee, royalty). A negative royalty is
    refused and the minimum retail price is suggested.
- **Pricing:** every rate is in `config/pricing.ts` (see placeholders below).
  - Print cost = base + per-page × pages × trim multiplier + binding surcharge, with separate B&W and colour rates.
  - Royalty = retail − print − ITPS shipping − platform margin %.
  - The cost breakdown is saved with each book and each order item.
- **Storefront:** home page with approved books, a book page, and search (title, author, description, ISBN). Only
  books that an admin has approved are public. Each new book starts as `pending_review`.
- **Basket and checkout:**
  - Cookie basket and a UK-only address form (postcode format checked).
  - Each order is created as `pending_payment`.
  - If `STRIPE_SECRET_KEY` is set, the buyer is sent to Stripe Checkout. An order only becomes `paid` after the Stripe
    API, or a signed webhook, confirms payment for the exact amount in GBP.
  - If no key is set, the buyer is told clearly that payments are not configured and no money was taken.
  - Buyers get a private order-status link (reference + secret token).
- **Admin panel** (`/admin`):
  - Orders list with status filters.
  - Order status flow: `paid → sent_to_printer → printed → shipped → delivered`. "Shipped" needs an India Post
    tracking number. You can cancel at any point before shipping. Marking an order paid by hand needs a note.
  - Every status change is recorded in the order history.
  - Each order has download links for the interior and cover files, plus a plain-text printer job sheet with the
    print specs and the UK address.
  - Book review: preview the book, download its files, compare the submitted costs with today's rates, then approve,
    reject (with a note) or move it back to pending.
  - Page editor for About, Delivery, Returns, Privacy and Terms. A "reviewed" tick removes the DRAFT banner.
- **Legal and content pages:** About, Delivery, Returns, Privacy and Terms.
  - Each one is a **DRAFT** with a visible banner until the owner reviews it.
  - Company details are `[NOT SET: …]` placeholders.
  - Legal decisions are marked `[OWNER TO CONFIRM: …]`.
- **Design:** serif, paper-toned and responsive. It uses no external fonts or scripts, and has no reviews or
  testimonials.

## Stack

- Next.js 14 (App Router) with TypeScript and Server Actions.
- SQLite via `better-sqlite3`. The schema is in `lib/schema.sql` and is applied automatically on startup.
- `bcryptjs`, which uses the bcrypt algorithm in pure JS, so no native build is needed for it.
- Stripe is called directly through its REST API with `fetch`, so there is no Stripe SDK dependency.

## Project layout

```
app/                 pages, server actions and route handlers
  admin/             owner panel (orders, books, pages)
  api/files/         cover / interior downloads (access-controlled)
  api/stripe/webhook Stripe webhook
  dashboard/         author dashboard + new book wizard
  order/[ref]        buyer's order status page
config/pricing.ts    ALL printer rates, shipping, margin  (PLACEHOLDERS)
config/site.ts       company details                      (PLACEHOLDERS)
content/defaults.ts  draft text of the legal/content pages
lib/                 db, auth, pricing, orders, books, stripe, uploads, validation
scripts/create-admin.mjs
tests/               unit tests + data-layer integration test (with test-only shims)
```

## Environment variables

Copy `.env.example` to `.env`.

| Variable | Meaning |
| --- | --- |
| `SITE_URL` | Public URL, e.g. `https://selfpressbooks.com`. Used for the Stripe return URLs. When it starts with `https://`, cookies are marked `Secure`. |
| `DATA_DIR` | Folder for the SQLite DB and uploads (`/app/data` in Docker; it is a volume). |
| `MAX_UPLOAD_MB` | Max size of each uploaded file (default 100). |
| `STRIPE_SECRET_KEY` | Stripe secret key. Leave empty to disable payments. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook `https://<domain>/api/stripe/webhook`. |
| `HOST_PORT` | Localhost port published by docker compose (default 3030). |

## Local development

```bash
cp .env.example .env        # set SITE_URL=http://localhost:3000, DATA_DIR=./data
npm install                 # creates package-lock.json – commit it
npm run dev                 # http://localhost:3000
npm run create-admin -- owner@example.com "Owner Name"   # prompts for a password
npm test                    # unit tests
npm run test:integration    # data-layer test (uses shims, no native modules needed)
npm run typecheck
```

## Deploy with docker compose behind nginx

```bash
git clone <repo> selfpressbooks && cd selfpressbooks
cp .env.example .env && nano .env      # SITE_URL, Stripe keys, HOST_PORT
docker compose up -d --build
docker compose exec app node scripts/create-admin.mjs owner@example.com "Owner Name"
curl -s http://127.0.0.1:3030/api/health    # {"ok":true}
```

The container publishes `127.0.0.1:${HOST_PORT:-3030}` only, so nginx on the host must proxy to it. Example
`/etc/nginx/sites-available/selfpressbooks.com`:

```nginx
server {
    listen 80;
    server_name selfpressbooks.com www.selfpressbooks.com;
    return 301 https://selfpressbooks.com$request_uri;
}

server {
    listen 443 ssl http2;
    server_name selfpressbooks.com;
    # ssl_certificate / ssl_certificate_key: e.g. from certbot --nginx

    client_max_body_size 110m;   # must exceed MAX_UPLOAD_MB (book PDFs)
    proxy_read_timeout 300s;

    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Backups:** everything is stored in the `selfpressbooks_data` volume: the SQLite DB and the uploaded book files.
Back it up regularly, for example with `docker run --rm -v selfpressbooks_selfpressbooks_data:/d -v $PWD:/b alpine tar czf /b/spb-data.tgz -C /d .`.

**Stripe setup:**

1. Create a webhook endpoint for `https://selfpressbooks.com/api/stripe/webhook` with the events
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
2. Put the endpoint's signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Test with `sk_test_…` keys first.

## Placeholders the owner must fill in

1. **Printer rates** in `config/pricing.ts`. Every value marked `// PLACEHOLDER` is invented for development and is
   not a quote:
   - `inrPerGbp` (exchange rate)
   - `basePaise` and `perPagePaise` for B&W and colour
   - `trimMultiplier` for A5, B5/6x9 and A4
   - `bindingSurchargePaise` for hardback
   - `minPages`, `maxPages` and `hardbackMinPages`
   - `shippingPencePerCopy` (default £4 for ITPS; confirm the real rates)
   - `platformMarginPercent`
2. **Company details** in `config/site.ts`: company name, company number, registered address, VAT number, contact
   email, data-protection contact or ICO number, governing law, and the India Post tracking URL template.
3. **Legal pages:** edit the text in Admin → Site pages, resolve every `[OWNER TO CONFIRM: …]`, then tick "reviewed".
   Key open points:
   - Who pays UK import VAT or charges on parcels from India.
   - Cancellation rules for made-to-order goods.
   - The UK GDPR transfer safeguards for sending order data to India.
   - Data retention periods.
   - How and when royalties are paid out.
   - Liability wording.
4. **Stripe keys:** `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env`.
5. **Admin account:** create it with `scripts/create-admin.mjs`. Signup only ever creates author accounts.

## What was tested / not tested

**Tested in the development container (Node 22):**

- `tests/pricing.test.ts`: print cost formula, royalty, the negative-royalty refusal, the minimum retail price, page
  limits, and the money helpers.
- `tests/validation.test.ts`: UK postcode, ISBN-10/13 checksum, email, slug and the safe redirect.
- `tests/schema.test.ts`: `lib/schema.sql` applies twice without errors and its constraints hold. This ran against
  Node's built-in `node:sqlite`.
- `tests/filetype.test.ts`: PDF, JPEG and PNG signature detection.
- `tests/textblocks.test.ts`: the content-page text format and filling in `{{tokens}}` from the site config.
- `tests/stripe-and-status.test.ts`: webhook signature verification and the allowed order status transitions.
- `tests/integration/flow.test.ts`: the real `lib/` code against a temporary SQLite DB, covering:
  - login and sessions
  - books hidden until approved, and search
  - the basket dropping unapproved books
  - order creation
  - a Stripe amount mismatch being refused
  - idempotent payment
  - the full status flow with tracking
  - the author's sales totals
  - the content-page drafts

  `better-sqlite3`, `bcryptjs` and `next/headers` / `next/navigation` were replaced by **test-only shims** in
  `tests/shims`.
- All 18 tests pass.
- A TypeScript check of all files against loose stand-in type declarations (not the real Next/React types). It found
  one bug, which was fixed.

**Not tested (must be done before going live):**

- `npm install`, `next build`, `next dev`, `tsc` against the real `next` / `react` types, and `docker build` /
  `docker compose up`. None of these were run, so there may be build or type errors to fix.
- None of the UI has been rendered in a browser: pages, the wizard, forms, the responsive layout, file
  uploads/downloads, or the Server Action body-size limit for large PDFs.
- Real `better-sqlite3` and `bcryptjs`. Only the shims were used.
- Stripe: there was no real API call, Checkout redirect or webhook delivery. Use test mode and the Stripe CLI
  (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).
- The nginx config.

**Known limitations of this MVP:**

- No emails are sent (order confirmations, tracking, password reset). Buyers keep their order-status link.
- No password reset and no login rate limiting.
- Authors cannot edit a book after submitting it; the owner can reject it so they can submit it again.
- Royalty payouts are not tracked beyond the "earned" totals.
- Shipping is charged per copy (one parcel per copy), which is conservative for multi-copy orders.
- The page count is entered by the author, not read from the PDF. The admin should check it during review.
- PDF-only covers cannot be previewed in the shop; a text placeholder is shown instead.
