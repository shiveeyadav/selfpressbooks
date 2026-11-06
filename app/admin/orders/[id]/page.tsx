import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrder, orderEvents, orderItems } from '@/lib/orders';
import { NEXT_STATUSES, ORDER_STATUS_LABEL } from '@/lib/order-status';
import { formatGbp } from '@/lib/money';
import { bindingLabel, paperLabel, trimLabel } from '@/lib/labels';
import { changeOrderStatusAction, updateOrderDetailsAction } from '@/app/admin/actions';
import { ErrorNotice, OkNotice, sp } from '@/components/Notice';

export default function AdminOrderPage({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const order = /^\d+$/.test(params.id) ? getOrder(Number(params.id)) : undefined;
  if (!order) notFound();
  const items = orderItems(order.id);
  const events = orderEvents(order.id);
  const next = NEXT_STATUSES[order.status];
  const printCost = items.reduce((a, i) => a + i.print_cost_pence * i.quantity, 0);
  const royalties = items.reduce((a, i) => a + i.royalty_pence * i.quantity, 0);

  return (
    <>
      <p className="small"><Link href="/admin">← Orders</Link></p>
      <h1>Order {order.public_ref}</h1>
      <OkNotice message={sp(searchParams.ok)} />
      <ErrorNotice error={sp(searchParams.error)} />
      <p>
        <span className={`badge ${order.status}`}>{ORDER_STATUS_LABEL[order.status]}</span>{' '}
        <span className="small muted">Placed {order.created_at} UTC{order.paid_at ? ` · paid ${order.paid_at} UTC` : ''}</span>
      </p>

      <div className="split">
        <div>
          <h2>Print job</h2>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Book</th><th>Spec</th><th className="num">Qty</th><th>Files for printer</th></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.title}<div className="small muted">{i.author_name}{i.isbn ? ` · ISBN ${i.isbn}` : ''}</div></td>
                    <td className="small">{trimLabel(i.trim_size)}<br />{paperLabel(i.paper)}<br />{bindingLabel(i.binding)}, {i.page_count} pp</td>
                    <td className="num">{i.quantity}</td>
                    <td className="small">
                      <a href={`/api/files/interior/${i.book_id}?download=1`}>Interior PDF</a><br />
                      <a href={`/api/files/cover/${i.book_id}?download=1`}>Cover</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="actions">
            <a className="btn secondary" href={`/admin/orders/${order.id}/jobsheet`}>Download job sheet (.txt)</a>
          </div>

          <h2>History</h2>
          <ul className="small">
            {events.map((e) => (
              <li key={e.id}>
                {e.created_at} – {e.from_status && e.from_status !== e.to_status ? `${e.from_status} → ` : ''}{e.to_status}
                {e.note ? `: ${e.note}` : ''} <span className="muted">({e.actor})</span>
              </li>
            ))}
          </ul>
        </div>

        <aside>
          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Change status</h3>
            {next.length === 0 ? (
              <p className="small muted">No further status changes.</p>
            ) : (
              <form action={changeOrderStatusAction}>
                <input type="hidden" name="order_id" value={order.id} />
                <label htmlFor="status">New status</label>
                <select id="status" name="status" defaultValue={next[0]}>
                  {next.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
                </select>
                {next.includes('shipped') && (
                  <>
                    <label htmlFor="tracking_number_s">India Post tracking number</label>
                    <input id="tracking_number_s" name="tracking_number" type="text" defaultValue={order.tracking_number ?? ''} placeholder="Required when marking shipped" />
                  </>
                )}
                <label htmlFor="note">Note (optional{order.status === 'pending_payment' ? '; required to mark paid by hand' : ''})</label>
                <input id="note" name="note" type="text" maxLength={500} />
                <div className="actions"><button type="submit">Update status</button></div>
              </form>
            )}
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Ship to</h3>
            <p className="small" style={{ marginBottom: 0 }}>
              {order.full_name}<br />{order.address_line1}<br />
              {order.address_line2 && <>{order.address_line2}<br /></>}
              {order.city}<br />{order.county && <>{order.county}<br /></>}{order.postcode}<br />United Kingdom<br />
              {order.phone && <>Tel {order.phone}<br /></>}{order.email}
            </p>
          </div>

          <div className="card pricebox" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>Money (snapshot at order time)</h3>
            <table><tbody>
              <tr><td>Customer paid / owes</td><td>{formatGbp(order.total_pence)}</td></tr>
              <tr><td>Estimated print cost</td><td>{formatGbp(printCost)}</td></tr>
              <tr><td>Author royalties</td><td>{formatGbp(royalties)}</td></tr>
            </tbody></table>
            {order.stripe_session_id && <p className="hint">Stripe session: {order.stripe_session_id}</p>}
          </div>

          <form action={updateOrderDetailsAction} className="card">
            <h3 style={{ marginTop: 0 }}>Tracking & notes</h3>
            <input type="hidden" name="order_id" value={order.id} />
            <label htmlFor="tracking_number">India Post tracking number</label>
            <input id="tracking_number" name="tracking_number" type="text" maxLength={60} defaultValue={order.tracking_number ?? ''} />
            <label htmlFor="admin_note">Internal note</label>
            <textarea id="admin_note" name="admin_note" maxLength={2000} defaultValue={order.admin_note ?? ''} style={{ minHeight: 80 }} />
            <div className="actions"><button type="submit" className="secondary">Save</button></div>
          </form>
        </aside>
      </div>
    </>
  );
}
