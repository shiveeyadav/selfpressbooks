import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readCart } from '@/lib/cart';
import { cartLines } from '@/lib/orders';
import { getCurrentUser } from '@/lib/auth';
import { formatGbp } from '@/lib/money';
import { stripeConfigured } from '@/lib/stripe';
import { placeOrderAction } from './actions';
import { ErrorNotice, sp } from '@/components/Notice';

export const metadata = { title: 'Checkout' };

export default function CheckoutPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const lines = cartLines(readCart());
  if (lines.length === 0) redirect('/cart');
  const total = lines.reduce((a, l) => a + l.linePence, 0);
  const user = getCurrentUser();
  const payments = stripeConfigured();

  return (
    <div className="container">
      <h1>Checkout</h1>
      <ErrorNotice error={sp(searchParams.error)} />
      {!payments && (
        <div className="notice warn" role="note">
          <strong>Payments are not configured yet.</strong> You can place the order, but it will be saved as
          “awaiting payment” and no money will be taken. Nothing will be printed until payment is set up and received.
        </div>
      )}
      <div className="split">
        <form action={placeOrderAction} className="card">
          <h2 style={{ marginTop: 0 }}>UK delivery address</h2>
          <p className="small muted">We currently deliver to the United Kingdom only.</p>
          <label htmlFor="full_name">Full name</label>
          <input id="full_name" name="full_name" type="text" autoComplete="name" required maxLength={120} defaultValue={user?.name} />
          <div className="grid-2">
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required defaultValue={user?.email} />
            </div>
            <div>
              <label htmlFor="phone">Phone (optional, for the courier)</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={30} />
            </div>
          </div>
          <label htmlFor="address_line1">Address line 1</label>
          <input id="address_line1" name="address_line1" type="text" autoComplete="address-line1" required maxLength={120} />
          <label htmlFor="address_line2">Address line 2 (optional)</label>
          <input id="address_line2" name="address_line2" type="text" autoComplete="address-line2" maxLength={120} />
          <div className="grid-2">
            <div>
              <label htmlFor="city">Town / city</label>
              <input id="city" name="city" type="text" autoComplete="address-level2" required maxLength={80} />
            </div>
            <div>
              <label htmlFor="county">County (optional)</label>
              <input id="county" name="county" type="text" autoComplete="address-level1" maxLength={80} />
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label htmlFor="postcode">Postcode</label>
              <input id="postcode" name="postcode" type="text" autoComplete="postal-code" required maxLength={10} style={{ textTransform: 'uppercase' }} />
            </div>
            <div>
              <label htmlFor="country">Country</label>
              <input id="country" type="text" value="United Kingdom" disabled />
            </div>
          </div>
          <p className="small muted" style={{ marginTop: 16 }}>
            By placing the order you agree to the <Link href="/terms">Terms</Link>. Your name and address are shared with
            our printer in India and India Post to deliver the book (see <Link href="/privacy">Privacy</Link>).
          </p>
          <div className="actions">
            <button type="submit">{payments ? `Continue to payment – ${formatGbp(total)}` : 'Place order (payment not yet available)'}</button>
          </div>
        </form>
        <aside className="card pricebox">
          <h3 style={{ marginTop: 0 }}>Order summary</h3>
          <table>
            <tbody>
              {lines.map((l) => (
                <tr key={l.book.id}><td>{l.quantity} × {l.book.title}</td><td>{formatGbp(l.linePence)}</td></tr>
              ))}
              <tr><td>UK delivery (India Post)</td><td>Included</td></tr>
              <tr className="total"><td>Total</td><td>{formatGbp(total)}</td></tr>
            </tbody>
          </table>
          <p className="hint">Printed to order in India; delivery usually 7–14 days after printing.</p>
        </aside>
      </div>
    </div>
  );
}
