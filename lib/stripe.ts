import 'server-only';

/**
 * Minimal Stripe Checkout client using fetch (no SDK dependency).
 * Payments only work when STRIPE_SECRET_KEY is set.
 */
export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY?.trim();
}

function encode(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
}

async function stripeRequest<T>(method: 'GET' | 'POST', path: string, params?: Record<string, string | number>, idempotencyKey?: string): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error('Stripe is not configured');
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (method === 'POST') headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers,
    body: method === 'POST' && params ? encode(params) : undefined,
    cache: 'no-store',
  });
  const json = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${json.error?.message ?? 'unknown error'}`);
  return json;
}

export interface CheckoutSession {
  id: string;
  url: string | null;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string>;
  client_reference_id: string | null;
}

export async function createCheckoutSession(args: {
  orderId: number;
  publicRef: string;
  email: string;
  items: { title: string; unitPence: number; quantity: number }[];
  successUrl: string;
  cancelUrl: string;
  attempt: number;
}): Promise<CheckoutSession> {
  const p: Record<string, string | number> = {
    mode: 'payment',
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    customer_email: args.email,
    client_reference_id: String(args.orderId),
    'metadata[order_id]': args.orderId,
    'metadata[public_ref]': args.publicRef,
    'payment_intent_data[metadata][order_id]': args.orderId,
    'payment_intent_data[metadata][public_ref]': args.publicRef,
  };
  args.items.forEach((it, i) => {
    p[`line_items[${i}][quantity]`] = it.quantity;
    p[`line_items[${i}][price_data][currency]`] = 'gbp';
    p[`line_items[${i}][price_data][unit_amount]`] = it.unitPence;
    p[`line_items[${i}][price_data][product_data][name]`] = it.title.slice(0, 250);
  });
  return stripeRequest<CheckoutSession>('POST', '/checkout/sessions', p, `spb-order-${args.orderId}-attempt-${args.attempt}`);
}

export async function retrieveCheckoutSession(id: string): Promise<CheckoutSession> {
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw new Error('Invalid session id');
  return stripeRequest<CheckoutSession>('GET', `/checkout/sessions/${id}`);
}
