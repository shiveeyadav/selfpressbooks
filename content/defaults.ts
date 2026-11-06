/**
 * Default DRAFT text for the content pages. These are starting points only,
 * written without legal review. The owner must review and edit them (Admin >
 * Pages) and tick "reviewed" before the draft banner disappears.
 *
 * Format: blank line = new paragraph, "## " = heading, "- " = bullet.
 * {{tokens}} are replaced from config/site.ts.
 */
export interface DefaultPage {
  slug: 'about' | 'delivery' | 'returns' | 'privacy' | 'terms';
  title: string;
  body: string;
}

export const DEFAULT_PAGES: DefaultPage[] = [
  {
    slug: 'about',
    title: 'About',
    body: `{{siteName}} is a print-on-demand publishing service. Authors upload their finished book, set a price, and we take care of printing and posting each copy when a reader orders it.

## How it works
- Authors upload an interior PDF and a cover, and choose trim size, paper and binding.
- Each book is checked by us before it appears in the shop.
- When a reader orders, the book is printed by our print partner in India and posted to the UK by India Post.
- Authors earn a royalty on every copy sold: the retail price minus printing, delivery and our platform fee.

## Who we are
{{siteName}} is operated by {{companyName}}, {{registeredAddress}}. Contact: {{contactEmail}}.`,
  },
  {
    slug: 'delivery',
    title: 'Delivery',
    body: `Every book is printed to order in India and sent to you by India Post's International Tracked Packet Service (ITPS).

## Where we deliver
We currently deliver to addresses in the United Kingdom only.

## How long it takes
Printing usually takes a few working days. Delivery from India to the UK is {{deliveryEstimate}}. Customs checks and busy periods can occasionally add time.

## Delivery cost
UK delivery is included in the price shown for each book.

## Tracking
When your order is posted we add the India Post tracking number to your order page (use the link you were given when you ordered).

## Customs and import charges
[OWNER TO CONFIRM: who pays any UK VAT or import charges on books posted from India, and how this is handled.]

## Problems with delivery
If your order has not arrived within 21 days of being posted, contact us at {{contactEmail}}.`,
  },
  {
    slug: 'returns',
    title: 'Returns & Refunds',
    body: `Because each book is printed specially for you, please check your order carefully before paying.

## Damaged or faulty books
If your book arrives damaged, misprinted or with missing pages, email {{contactEmail}} within 14 days of delivery with your order number and a photo. We will reprint and send a replacement or refund you.

## Changing your mind
[OWNER TO CONFIRM: cancellation policy for made-to-order goods under the Consumer Contracts Regulations 2013, and any goodwill returns policy.]

## Lost parcels
If tracking shows no progress for 21 days, contact us and we will investigate with India Post.

## How refunds are paid
Refunds go back to the card used to pay, usually within 5–10 working days after we approve them.`,
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    body: `This policy explains how {{companyName}} ("we") uses personal data on {{domain}}.

## What we collect
- Authors: name, email, password (stored only as a secure hash), and the books and files you upload.
- Buyers: name, email, phone (optional) and UK delivery address.
- Payments are processed by Stripe. We do not see or store your full card number.

## Why we use it
- To run author accounts and publish books.
- To print and deliver orders. Your name and delivery address are shared with our print partner in India and with India Post so the book can be printed and posted.
- To meet legal and accounting obligations.

## International transfers
Order details are transferred to India for printing and posting. [OWNER TO CONFIRM: the safeguards used for this transfer under UK GDPR.]

## Cookies
We use one essential cookie to keep you logged in and one to remember your basket. We do not use advertising or analytics cookies.

## How long we keep data
[OWNER TO CONFIRM: retention periods.]

## Your rights
You can ask to see, correct or delete your data by emailing {{contactEmail}}. You can also complain to the Information Commissioner's Office (ico.org.uk).

Data protection contact: {{dataProtectionContact}}.`,
  },
  {
    slug: 'terms',
    title: 'Terms',
    body: `These terms apply to use of {{domain}}, operated by {{companyName}} (company number {{companyNumber}}), {{registeredAddress}}.

## For buyers
- Prices are in pounds sterling and include UK delivery.
- An order is accepted once payment is confirmed.
- Books are printed to order and posted from India; see the Delivery and Returns pages.

## For authors
- You must own, or have permission to publish, everything in the files you upload, including the text, images and cover.
- We may decline or remove any book, for example if it infringes someone's rights, is unlawful, or cannot be printed properly.
- Your royalty per copy is shown when you set your price: retail price minus print cost, UK delivery and our platform fee. [OWNER TO CONFIRM: when and how royalties are paid out.]
- You keep the copyright in your book. You give us permission to print, sell and display it (including the cover and description) on this site.

## Liability
[OWNER TO CONFIRM: limitation of liability wording.]

## Law
These terms are governed by {{governingLaw}}.

Contact: {{contactEmail}}.`,
  },
];
