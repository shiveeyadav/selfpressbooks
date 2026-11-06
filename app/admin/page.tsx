import { requireAdmin } from '@/lib/auth';
import Link from 'next/link';
import { listOrders } from '@/lib/orders';
import { ORDER_STATUSES, ORDER_STATUS_LABEL, isOrderStatus } from '@/lib/order-status';
import { formatGbp } from '@/lib/money';
import { stripeConfigured } from '@/lib/stripe';
import { ErrorNotice, sp } from '@/components/Notice';

export default function AdminOrdersPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  requireAdmin();
  const f = sp(searchParams.status) || 'active';
  const filter = f === 'all' || f === 'active' || isOrderStatus(f) ? f : 'active';
  const orders = listOrders(filter);
  const tabs = ['active', ...ORDER_STATUSES, 'all'];
  return (
    <>
      <h1>Orders</h1>
      <ErrorNotice error={sp(searchParams.error)} />
      {!stripeConfigured() && (
        <div className="notice warn">Stripe is not configured (STRIPE_SECRET_KEY is empty). Orders stay “awaiting payment”.</div>
      )}
      <p className="small" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <Link key={t} href={`/admin?status=${t}`} style={{ fontWeight: t === filter ? 700 : 400 }}>
            {t === 'active' ? 'To do (paid → shipped)' : t === 'all' ? 'All' : ORDER_STATUS_LABEL[t as keyof typeof ORDER_STATUS_LABEL]}
          </Link>
        ))}
      </p>
      {orders.length === 0 ? (
        <div className="empty">No orders here.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Order</th><th>Placed</th><th>Customer</th><th className="num">Copies</th><th className="num">Total</th><th>Status</th><th>Tracking</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`}>{o.public_ref}</Link></td>
                  <td className="small">{o.created_at}</td>
                  <td>{o.full_name}<div className="small muted">{o.postcode}</div></td>
                  <td className="num">{o.item_count}</td>
                  <td className="num">{formatGbp(o.total_pence)}</td>
                  <td><span className={`badge ${o.status}`}>{ORDER_STATUS_LABEL[o.status]}</span></td>
                  <td className="small">{o.tracking_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
