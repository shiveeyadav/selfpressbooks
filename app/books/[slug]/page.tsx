import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getApprovedBySlug } from '@/lib/books';
import { formatGbp } from '@/lib/money';
import { bindingLabel, paperLabel, trimLabel } from '@/lib/labels';
import { CoverImage } from '@/components/BookTile';
import { addToCartAction } from '@/app/cart/actions';
import { siteConfig } from '@/config/site';

export function generateMetadata({ params }: { params: { slug: string } }) {
  const book = getApprovedBySlug(params.slug);
  return book ? { title: `${book.title} by ${book.author_name}`, description: book.description.slice(0, 160) } : {};
}

export default function BookPage({ params }: { params: { slug: string } }) {
  const book = getApprovedBySlug(params.slug);
  if (!book) notFound();
  return (
    <div className="container">
      <p className="small"><Link href="/">← All books</Link></p>
      <div className="book-detail">
        <div className="cover"><CoverImage book={book} /></div>
        <div>
          <h1 style={{ marginBottom: 4 }}>{book.title}</h1>
          <p className="muted" style={{ fontSize: '1.1rem' }}>by {book.author_name}</p>
          <p style={{ fontFamily: 'var(--sans)', fontSize: '1.5rem', fontWeight: 700, margin: '10px 0 4px' }}>
            {formatGbp(book.retail_pence)}
          </p>
          <p className="small muted">Includes UK delivery. Printed to order and posted by India Post, {siteConfig.deliveryEstimate}.</p>
          <form action={addToCartAction} className="actions">
            <input type="hidden" name="book_id" value={book.id} />
            <label htmlFor="quantity" style={{ margin: 0 }}>Qty</label>
            <input id="quantity" name="quantity" type="number" min={1} max={20} defaultValue={1} style={{ width: 80 }} />
            <button type="submit">Add to basket</button>
          </form>
          <h2>About this book</h2>
          <div className="description">{book.description}</div>
          <table className="specs">
            <tbody>
              <tr><th>Format</th><td>{bindingLabel(book.binding)}, {trimLabel(book.trim_size)}</td></tr>
              <tr><th>Interior</th><td>{paperLabel(book.paper)}</td></tr>
              <tr><th>Pages</th><td>{book.page_count}</td></tr>
              <tr><th>Language</th><td>{book.language}</td></tr>
              {book.isbn && <tr><th>ISBN</th><td>{book.isbn}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
