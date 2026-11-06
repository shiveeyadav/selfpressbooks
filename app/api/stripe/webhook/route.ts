import { getDb } from '@/lib/db';
import { markPaidFromStripe } from '@/lib/orders';
import { verifyStripeSignature } from '@/lib/stripe-signature';

export const dynamic = 'force-dynamic';

interface StripeEvent {
  id: string;
  type: string;
  data: { object: { id: string; payment_status?: string; amount_total?: number | null; currency?: string | null; metadata?: Record<string, string> } };
}

/** Stripe webhook: marks orders paid on checkout.session.completed / async_payment_succeeded. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return new Response('Payments not configured', { status: 503 });
  }
  const raw = await req.text();
  const err = verifyStripeSignature(raw, req.headers.get('stripe-signature'), secret);
  if (err) return new Response(`Invalid signature: ${err}`, { status: 400 });

  const event = JSON.parse(raw) as StripeEvent;
  const db = getDb();
  if (db.prepare('SELECT 1 FROM stripe_events WHERE id = ?').get(event.id)) return Response.json({ received: true, duplicate: true });

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object;
    const orderId = Number(s.metadata?.order_id);
    if (s.payment_status === 'paid' && Number.isInteger(orderId)) {
      const res = markPaidFromStripe(orderId, s.id, s.amount_total ?? null, s.currency ?? null);
      if (res) console.error(`Stripe webhook: order ${orderId} not marked paid: ${res}`);
    }
  }
  db.prepare('INSERT OR IGNORE INTO stripe_events (id, type) VALUES (?, ?)').run(event.id, event.type);
  return Response.json({ received: true });
}
