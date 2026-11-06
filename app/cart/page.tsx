import Link from 'next/link';
import { readCart } from '@/lib/cart';
import { cartLines } from '@/lib/orders';
import { formatGbp } from '@/lib/money';
import { updateCartAction } from './actions';
import { ErrorNotice, sp } from '@/components/Notice';

export const metadata = { title: 'Basket' };

export default function CartPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const lines = cartLines(readCart());
  const total = lines.reduce((a, l) => a + l.linePence, 0);
  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <h1>Your basket</h1>
      <ErrorNotice error={sp(searchParams.error)} />
      {lines.length === 0 ? (
        <div className="empty">Your basket is empty. <Link href="/">Browse books</Link>.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Book</th><th>Qty</th><th className="num">Price</th><th className="num">Total</th><th /></tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.book.id}>
                    <td><Link href={`/books/${l.book.slug}`}>{l.book.title}</Link><div className="small muted">{l.book.author_name}</div></td>
                    <td>
                      <form action={updateCartAction} style={{ display: 'flex', gap: 6 }}>
                        <input type="hidden" name="book_id" value={l.book.id} />
                        <input type="number" name="quantity" min={1} max={20} defaultValue={l.quantity} style={{ width: 70 }} aria-label="Quantity" />
                        <button type="submit" className="small secondary">Update</button>
                      </form>
                    </td>
                    <td className="num">{formatGbp(l.book.retail_pence)}</td>
                    <td className="num">{formatGbp(l.linePence)}</td>
                    <td>
                      <form action={updateCartAction}>
                        <input type="hidden" name="book_id" value={l.book.id} />
                        <input type="hidden" name="remove" value="1" />
                        <button type="submit" className="link small">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}><strong>Total (includes UK delivery)</strong></td>
                  <td className="num"><strong>{formatGbp(total)}</strong></td><td />
                </tr>
              </tbody>
            </table>
          </div>
          <p className="small muted">Each book is printed to order in India and posted by India Post. See <Link href="/delivery">Delivery</Link>.</p>
          <div className="actions"><Link href="/checkout" className="btn">Go to checkout</Link></div>
        </>
      )}
    </div>
  );
}
