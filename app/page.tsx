import Link from 'next/link';
import { listApproved } from '@/lib/books';
import BookTile from '@/components/BookTile';
import { siteConfig } from '@/config/site';

export default function HomePage() {
  const books = listApproved(60);
  return (
    <div className="container">
      <section className="hero">
        <h1>Books by independent authors, printed for you</h1>
        <p>
          Every copy is printed to order and posted to you in the UK by India Post. Delivery is included in the price and
          is {siteConfig.deliveryEstimate}. <Link href="/delivery">Delivery details</Link>.
        </p>
        <div className="actions">
          <a href="#books" className="btn">Browse books</a>
          <Link href="/signup" className="btn secondary">Publish your own book</Link>
        </div>
      </section>

      <h2 id="books" style={{ marginTop: 0 }}>Books</h2>
      {books.length === 0 ? (
        <div className="empty">No books are on sale yet. Check back soon.</div>
      ) : (
        <div className="book-grid">
          {books.map((b) => <BookTile key={b.id} book={b} />)}
        </div>
      )}
    </div>
  );
}
