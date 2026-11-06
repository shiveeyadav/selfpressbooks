'use server';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { readCart, writeCart } from '@/lib/cart';
import { cartLines, countPaymentAttempts, createOrder, getOrderForBuyer, logEvent, orderItems, setStripeSession, type Order } from '@/lib/orders';
import { createCheckoutSession, stripeConfigured } from '@/lib/stripe';
import { siteUrl } from '@/lib/site-url';
import { isEmail, normaliseUkPostcode, str } from '@/lib/validation';

function back(error: string): never {
  redirect('/checkout?error=' + encodeURIComponent(error));
}

async function startStripe(order: Order, token: string): Promise<string> {
  const base = siteUrl();
  const link = `${base}/order/${order.public_ref}?k=${encodeURIComponent(token)}`;
  const items = orderItems(order.id).map((i) => ({ title: i.title, unitPence: i.unit_price_pence, quantity: i.quantity }));
  const attempt = countPaymentAttempts(order.id) + 1;
  const session = await createCheckoutSession({
    orderId: order.id,
    publicRef: order.public_ref,
    email: order.email,
    items,
    successUrl: `${link}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${link}&cancelled=1`,
    attempt,
  });
  setStripeSession(order.id, session.id);
  logEvent(order.id, order.status, order.status, `Stripe checkout session created (${session.id})`, 'system');
  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

export async function placeOrderAction(formData: FormData) {
  const lines = cartLines(readCart());
  if (lines.length === 0) redirect('/cart');

  const email = str(formData.get('email'), 254).toLowerCase();
  const full_name = str(formData.get('full_name'), 120);
  const phone = str(formData.get('phone'), 30) || null;
  const address_line1 = str(formData.get('address_line1'), 120);
  const address_line2 = str(formData.get('address_line2'), 120) || null;
  const city = str(formData.get('city'), 80);
  const county = str(formData.get('county'), 80) || null;
  const postcode = normaliseUkPostcode(str(formData.get('postcode'), 12));

  if (!full_name) back('Enter the name of the person receiving the book.');
  if (!isEmail(email)) back('Enter a valid email address.');
  if (!address_line1) back('Enter the first line of the address.');
  if (!city) back('Enter the town or city.');
  if (!postcode) back('Enter a valid UK postcode. We only deliver to the United Kingdom.');
  if (phone && !/^[+()0-9 \-]{7,30}$/.test(phone)) back('Enter a valid phone number, or leave it blank.');

  const user = getCurrentUser();
  const { order, accessToken } = createOrder(user?.id ?? null, {
    email, full_name, phone, address_line1, address_line2, city, county, postcode,
  }, lines);
  writeCart({});

  const orderLink = `/order/${order.public_ref}?k=${encodeURIComponent(accessToken)}`;
  if (!stripeConfigured()) redirect(orderLink);

  let url: string;
  try {
    url = await startStripe(order, accessToken);
  } catch (e) {
    console.error('Stripe session creation failed', e);
    logEvent(order.id, order.status, order.status, 'Stripe checkout session could not be created', 'system');
    redirect(`${orderLink}&payerror=1`);
  }
  redirect(url);
}

/** Lets the buyer retry payment for an order that is still pending_payment. */
export async function retryPaymentAction(formData: FormData) {
  const ref = str(formData.get('ref'), 40);
  const token = str(formData.get('k'), 100);
  const order = getOrderForBuyer(ref, token);
  if (!order) redirect('/');
  const orderLink = `/order/${order.public_ref}?k=${encodeURIComponent(token)}`;
  if (order.status !== 'pending_payment' || !stripeConfigured()) redirect(orderLink);
  let url: string;
  try {
    url = await startStripe(order, token);
  } catch (e) {
    console.error('Stripe session creation failed', e);
    redirect(`${orderLink}&payerror=1`);
  }
  redirect(url);
}
