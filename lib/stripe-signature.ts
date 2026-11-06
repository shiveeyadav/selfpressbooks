import crypto from 'node:crypto';

/**
 * Verifies a Stripe webhook signature header ("t=...,v1=...,v1=...").
 * Implemented directly (HMAC-SHA256 over "<t>.<raw body>") so the app does
 * not need the Stripe SDK. Returns null if valid, otherwise a reason.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): string | null {
  if (!header) return 'missing signature header';
  let t: number | null = null;
  const v1: string[] = [];
  for (const part of header.split(',')) {
    const [k, v] = part.split('=', 2);
    if (k === 't') t = Number(v);
    else if (k === 'v1' && v) v1.push(v);
  }
  if (!t || !Number.isFinite(t) || v1.length === 0) return 'malformed signature header';
  if (Math.abs(nowSeconds - t) > toleranceSeconds) return 'timestamp outside tolerance';
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`, 'utf8').digest('hex');
  const exp = Buffer.from(expected, 'hex');
  const ok = v1.some((sig) => {
    if (!/^[a-f0-9]{64}$/.test(sig)) return false;
    return crypto.timingSafeEqual(exp, Buffer.from(sig, 'hex'));
  });
  return ok ? null : 'signature mismatch';
}
