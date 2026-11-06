import { searchApproved } from '@/lib/books';
import BookTile from '@/components/BookTile';
import { sp } from '@/components/Notice';

export const metadata = { title: 'Search' };

export default function SearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = (sp(searchParams.q) || '').trim().slice(0, 100);
  const results = q ? searchApproved(q) : [];
  return (
    <div className="container">
      <h1>Search</h1>
      <form action="/search" method="get" role="search" style={{ display: 'flex', gap: 8, maxWidth: 560, marginBottom: 24 }}>
        <input type="search" name="q" defaultValue={q} placeholder="Title, author, ISBN or keyword" aria-label="Search" />
        <button type="submit">Search</button>
      </form>
      {q && (
        <p className="muted">
          {results.length === 0 ? 'No books matched' : `${results.length} book${results.length === 1 ? '' : 's'} matched`} “{q}”.
        </p>
      )}
      {results.length > 0 && (
        <div className="book-grid">{results.map((b) => <BookTile key={b.id} book={b} />)}</div>
      )}
    </div>
  );
}
