import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBook } from '@/lib/books';
import { getDb } from '@/lib/db';
import { formatGbp } from '@/lib/money';
import { calculatePrice } from '@/lib/pricing';
import { BOOK_STATUS_LABEL, bindingLabel, paperLabel, trimLabel } from '@/lib/labels';
import { CoverImage } from '@/components/BookTile';
import { reviewBookAction } from '@/app/admin/actions';
import { ErrorNotice, OkNotice, sp } from '@/components/Notice';
import type { Binding, PaperType, TrimSize } from '@/config/pricing';

export default function AdminBookPage({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const book = /^\d+$/.test(params.id) ? getBook(Number(params.id)) : undefined;
  if (!book) notFound();
  const owner = getDb().prepare('SELECT name, email FROM users WHERE id = ?').get(book.user_id) as { name: string; email: string };
  // Re-run the calculator with today's rates to spot books that would now lose money.
  const now = calculatePrice({
    trimSize: book.trim_size as TrimSize, paper: book.paper as PaperType, binding: book.binding as Binding,
    pageCount: book.page_count, retailPence: book.retail_pence,
  });

  return (
    <>
      <p className="small"><Link href="/admin/books">← Books</Link></p>
      <h1>{book.title}</h1>
      <OkNotice message={sp(searchParams.ok)} />
      <ErrorNotice error={sp(searchParams.error)} />
      <p><span className={`badge ${book.status}`}>{BOOK_STATUS_LABEL[book.status]}</span>
        {book.status === 'approved' && <> · <Link href={`/books/${book.slug}`}>View in shop</Link></>}</p>
      {book.review_note && <p className="small">Review note: {book.review_note}</p>}

      <div className="book-detail">
        <div>
          <div className="cover"><CoverImage book={book} /></div>
          <p className="small" style={{ marginTop: 12 }}>
            <a href={`/api/files/interior/${book.id}?download=1`}>Download interior PDF</a> ({book.interior_original})<br />
            <a href={`/api/files/interior/${book.id}`} target="_blank" rel="noopener">Open interior in browser</a><br />
            <a href={`/api/files/cover/${book.id}?download=1`}>Download cover</a> ({book.cover_original})
          </p>
        </div>
        <div>
          <table className="specs">
            <tbody>
              <tr><th>Author name</th><td>{book.author_name}</td></tr>
              <tr><th>Account</th><td>{owner.name} &lt;{owner.email}&gt;</td></tr>
              <tr><th>Language</th><td>{book.language}</td></tr>
              <tr><th>ISBN</th><td>{book.isbn || '—'}</td></tr>
              <tr><th>Trim</th><td>{trimLabel(book.trim_size)}</td></tr>
              <tr><th>Interior</th><td>{paperLabel(book.paper)}, {book.page_count} pages (as declared – check the PDF)</td></tr>
              <tr><th>Binding</th><td>{bindingLabel(book.binding)}</td></tr>
              <tr><th>Retail</th><td>{formatGbp(book.retail_pence)}</td></tr>
              <tr><th>At submission</th><td>print {formatGbp(book.print_cost_pence)}, delivery {formatGbp(book.shipping_pence)}, platform {formatGbp(book.platform_margin_pence)}, royalty {formatGbp(book.royalty_pence)}</td></tr>
              <tr><th>With current rates</th><td className={now.royaltyPence < 0 ? 'neg' : ''}>print {formatGbp(now.printCostPence)}, royalty {formatGbp(now.royaltyPence)}</td></tr>
            </tbody>
          </table>
          <h3>Description</h3>
          <div className="description small">{book.description}</div>

          <form action={reviewBookAction} className="card" style={{ marginTop: 20 }}>
            <input type="hidden" name="book_id" value={book.id} />
            <h3 style={{ marginTop: 0 }}>Review</h3>
            <p className="small muted">Check the PDF page count and trim match, the cover is suitable, and the author has the rights.</p>
            <label htmlFor="note">Note to author (required to reject)</label>
            <input id="note" name="note" type="text" maxLength={1000} />
            <div className="actions">
              {book.status !== 'approved' && <button type="submit" name="decision" value="approve">Approve & publish</button>}
              {book.status !== 'rejected' && <button type="submit" name="decision" value="reject" className="secondary">Reject</button>}
              {book.status !== 'pending_review' && <button type="submit" name="decision" value="unpublish" className="secondary">Back to pending</button>}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
