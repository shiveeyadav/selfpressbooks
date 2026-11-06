import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderForBuyer, markPaidFromStripe, orderItems, getOrder, logEvent } from '@/lib/orders';
import { ORDER_STATUS_LABEL } from '@/lib/order-status';
import { retrieveCheckoutSession, stripeConfigured } from '@/lib/stripe';
import { formatGbp } from '@/lib/money';
import { siteConfig } from '@/config/site';
import { retryPaymentAction } from '@/app/checkout/actions';
import { sp } from '@/components/Notice';

export const metadata = { title: 'Your order', robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: { ref: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const token = sp(searchParams.k) || '';
  let order = getOrderForBuyer(params.ref, token);
  if (!order) notFound();

  // Returning from Stripe: confirm with Stripe's API (not just the redirect) before showing "paid".
  const sessionId = sp(searchParams.session_id);
  let verifyError = false;
  if (sessionId && order.status === 'pending_payment' && stripeConfigured()) {
    try {
      const s = await retrieveCheckoutSession(sessionId);
      if (s.payment_status === 'paid' && s.metadata?.order_id === String(order.id)) {
        markPaidFromStripe(order.id, s.id, s.amount_total, s.currency);
        order = getOrder(order.id)!;
      }
    } catch (e) {
      console.error('Stripe session check failed', e);
      logEvent(order.id, order.status, order.status, 'Could not verify Stripe session on return page', 'system');
      verifyError = true;
    }
  }

  const items = orderItems(order.id);
  const payments = stripeConfigured();
  const tracking = order.tracking_number;
  const trackingUrl = tracking && siteConfig.trackingUrlTemplate ? siteConfig.trackingUrlTemplate.replace('{tracking}', encodeURIComponent(tracking)) : null;

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h1>Order {order.public_ref}</h1>
      <p>
        Status: <span className={`badge ${order.status}`}>{ORDER_STATUS_LABEL[order.status]}</span>
      </p>

      {order.status === 'pending_payment' && (
        <>
          {!payments ? (
            <div className="notice warn">
              <strong>Payments are not configured yet.</strong> Your order has been saved as awaiting payment. No money
              has been taken, and nothing will be printed until payment is received.
            </div>
          ) : sp(searchParams.cancelled) ? (
            <div className="notice warn">Payment was cancelled. Your order has not been paid.</div>
          ) : sp(searchParams.payerror) || verifyError ? (
            <div className="notice error">We could not reach the payment provider. Your order has not been paid. Please try again.</div>
          ) : sessionId ? (
            <div className="notice warn">We are waiting for the payment provider to confirm your payment. Refresh this page in a minute.</div>
          ) : (
            <div className="notice warn">This order has not been paid yet.</div>
          )}
          {payments && (
            <form action={retryPaymentAction}>
              <input type="hidden" name="ref" value={order.public_ref} />
              <input type="hidden" name="k" value={token} />
              <button type="submit">Pay {formatGbp(order.total_pence)} now</button>
            </form>
          )}
        </>
      )}
      {order.status === 'paid' && (
        <div className="notice ok">Thank you – your payment has been received. We will send your order to the printer shortly.</div>
      )}

      <p className="small muted">
        Keep this page’s address (bookmark it): it is the link to check your order status.
      </p>

      {tracking && (
        <div className="card" style={{ marginBottom: 18 }}>
          <strong>India Post tracking number:</strong> {tracking}
          {trackingUrl ? <> – <a href={trackingUrl} rel="noopener noreferrer" target="_blank">track parcel</a></> : <div className="small muted">Track it on the India Post website.</div>}
        </div>
      )}

      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Book</th><th className="num">Qty</th><th className="num">Total</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}><td>{i.title}</td><td className="num">{i.quantity}</td><td className="num">{formatGbp(i.unit_price_pence * i.quantity)}</td></tr>
            ))}
            <tr><td colSpan={2}><strong>Total (incl. UK delivery)</strong></td><td className="num"><strong>{formatGbp(order.total_pence)}</strong></td></tr>
          </tbody>
        </table>
      </div>

      <h2>Delivering to</h2>
      <p>
        {order.full_name}<br />{order.address_line1}<br />
        {order.address_line2 && <>{order.address_line2}<br /></>}
        {order.city}<br />{order.county && <>{order.county}<br /></>}{order.postcode}<br />United Kingdom
      </p>
      <p className="small muted">Questions? See <Link href="/delivery">Delivery</Link> and <Link href="/returns">Returns</Link>, or contact {siteConfig.contactEmail}.</p>
    </div>
  );
}
