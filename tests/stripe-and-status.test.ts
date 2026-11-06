import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyStripeSignature } from '../lib/stripe-signature';
import { checkTransition } from '../lib/order-status';

const secret = 'whsec_test';
const body = '{"id":"evt_1","type":"checkout.session.completed"}';
const sign = (t: number, b = body, s = secret) => crypto.createHmac('sha256', s).update(`${t}.${b}`).digest('hex');

test('stripe signature verification', () => {
  const now = 1_700_000_000;
  assert.equal(verifyStripeSignature(body, `t=${now},v1=${sign(now)}`, secret, 300, now), null);
  assert.equal(verifyStripeSignature(body, `t=${now},v1=${'0'.repeat(64)},v1=${sign(now)}`, secret, 300, now), null);
  assert.equal(verifyStripeSignature(body + ' ', `t=${now},v1=${sign(now)}`, secret, 300, now), 'signature mismatch');
  assert.equal(verifyStripeSignature(body, `t=${now},v1=${sign(now, body, 'other')}`, secret, 300, now), 'signature mismatch');
  assert.equal(verifyStripeSignature(body, `t=${now - 1000},v1=${sign(now - 1000)}`, secret, 300, now), 'timestamp outside tolerance');
  assert.equal(verifyStripeSignature(body, null, secret), 'missing signature header');
  assert.equal(verifyStripeSignature(body, 'garbage', secret), 'malformed signature header');
});

test('order status flow', () => {
  assert.equal(checkTransition('paid', 'sent_to_printer', {}), null);
  assert.equal(checkTransition('sent_to_printer', 'printed', {}), null);
  assert.match(checkTransition('printed', 'shipped', {})!, /tracking/);
  assert.equal(checkTransition('printed', 'shipped', { trackingNumber: 'EX123456789IN' }), null);
  assert.equal(checkTransition('shipped', 'delivered', {}), null);
  assert.ok(checkTransition('paid', 'shipped', { trackingNumber: 'x' }));
  assert.ok(checkTransition('delivered', 'cancelled', {}));
  assert.ok(checkTransition('pending_payment', 'paid', {}));
  assert.equal(checkTransition('pending_payment', 'paid', { note: 'Bank transfer ref 123' }), null);
});
