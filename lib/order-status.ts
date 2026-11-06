export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'sent_to_printer',
  'printed',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  sent_to_printer: 'Sent to printer',
  printed: 'Printed',
  shipped: 'Shipped (India Post)',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** Allowed admin transitions. Forward one step at a time, or cancel before shipping. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['sent_to_printer', 'cancelled'],
  sent_to_printer: ['printed', 'cancelled'],
  printed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

/** Returns an error message, or null if the transition is allowed. */
export function checkTransition(from: OrderStatus, to: OrderStatus, opts: { trackingNumber?: string | null; note?: string | null }): string | null {
  if (!NEXT_STATUSES[from].includes(to)) return `Cannot change an order from "${ORDER_STATUS_LABEL[from]}" to "${ORDER_STATUS_LABEL[to]}".`;
  if (to === 'shipped' && !(opts.trackingNumber && opts.trackingNumber.trim())) {
    return 'Enter the India Post tracking number before marking the order as shipped.';
  }
  if (from === 'pending_payment' && to === 'paid' && !(opts.note && opts.note.trim())) {
    return 'Marking an order paid by hand needs a note saying how payment was received (card payments are confirmed automatically by Stripe).';
  }
  return null;
}
