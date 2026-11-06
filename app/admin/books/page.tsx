import Link from 'next/link';
import { listForReview } from '@/lib/books';
import { formatGbp } from '@/lib/money';
import { BOOK_STATUS_LABEL } from '@/lib/labels';
import { ErrorNotice, sp } from '@/components/Notice';

export default function AdminBooksPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const f = sp(searchParams.status);
  const filter = f === 'approved' || f === 'rejected' || f === 'all' ? f : 'pending_review';
  const books = listForReview(filter);
  return (
    <>
      <h1>Books</h1>
      <ErrorNotice error={sp(searchParams.error)} />
      <p className="small" style={{ display: 'flex', gap: 12 }}>
        {(['pending_review', 'approved', 'rejected', 'all'] as const).map((s) => (
          <Link key={s} href={`/admin/books?status=${s}`} style={{ fontWeight: s === filter ? 700 : 400 }}>
            {s === 'all' ? 'All' : BOOK_STATUS_LABEL[s]}
          </Link>
        ))}
      </p>
      {books.length === 0 ? (
        <div className="empty">Nothing here.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Title</th><th>Author account</th><th>Submitted</th><th className="num">Price</th><th className="num">Royalty</th><th>Status</th></tr></thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/admin/books/${b.id}`}>{b.title}</Link><div className="small muted">{b.author_name}</div></td>
                  <td className="small">{b.owner_email}</td>
                  <td className="small">{b.created_at}</td>
                  <td className="num">{formatGbp(b.retail_pence)}</td>
                  <td className="num">{formatGbp(b.royalty_pence)}</td>
                  <td><span className={`badge ${b.status}`}>{BOOK_STATUS_LABEL[b.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
