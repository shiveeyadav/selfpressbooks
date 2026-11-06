import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listByUser } from '@/lib/books';
import { formatGbp } from '@/lib/money';
import { BOOK_STATUS_LABEL, bindingLabel, paperLabel, trimLabel } from '@/lib/labels';
import { ErrorNotice, OkNotice, sp } from '@/components/Notice';

export const metadata = { title: 'Author dashboard' };

export default function DashboardPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = requireUser('/dashboard');
  const books = listByUser(user.id);
  const totalRoyalty = books.reduce((a, b) => a + b.royalty_earned_pence, 0);
  const totalCopies = books.reduce((a, b) => a + b.copies_sold, 0);

  return (
    <div className="container">
      <h1>Hello, {user.name}</h1>
      <OkNotice message={sp(searchParams.ok)} />
      <ErrorNotice error={sp(searchParams.error)} />

      <div className="actions" style={{ marginTop: 0, marginBottom: 24 }}>
        <Link href="/dashboard/books/new" className="btn">Publish a new book</Link>
        {user.role === 'admin' && <Link href="/admin" className="btn secondary">Go to admin</Link>}
      </div>

      <div className="grid-2" style={{ marginBottom: 24, gap: 18 }}>
        <div className="card"><div className="muted small">Copies sold (paid orders)</div><div style={{ fontSize: '1.6rem' }}>{totalCopies}</div></div>
        <div className="card"><div className="muted small">Royalties earned (before payout)</div><div style={{ fontSize: '1.6rem' }}>{formatGbp(totalRoyalty)}</div></div>
      </div>

      <h2>Your books</h2>
      {books.length === 0 ? (
        <div className="empty">
          You haven't published any books yet. <Link href="/dashboard/books/new">Start your first one</Link>.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Title</th><th>Format</th><th>Status</th>
                <th className="num">Price</th><th className="num">Royalty / copy</th><th className="num">Sold</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.status === 'approved' ? <Link href={`/books/${b.slug}`}>{b.title}</Link> : b.title}
                    <div className="muted small">Submitted {b.created_at.slice(0, 10)}</div>
                  </td>
                  <td className="small">
                    {trimLabel(b.trim_size)}<br />{paperLabel(b.paper)}, {bindingLabel(b.binding)}, {b.page_count} pp
                  </td>
                  <td>
                    <span className={`badge ${b.status}`}>{BOOK_STATUS_LABEL[b.status]}</span>
                    {b.review_note && <div className="small muted" style={{ marginTop: 6 }}>Note: {b.review_note}</div>}
                  </td>
                  <td className="num">{formatGbp(b.retail_pence)}</td>
                  <td className="num">{formatGbp(b.royalty_pence)}</td>
                  <td className="num">{b.copies_sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small" style={{ marginTop: 16 }}>
        Royalty per copy is fixed when you submit the book. To change a book's price or files, contact us.
      </p>
    </div>
  );
}
