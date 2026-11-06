import Link from 'next/link';
import type { Book } from '@/lib/books';
import { formatGbp } from '@/lib/money';

export function CoverImage({ book }: { book: Pick<Book, 'id' | 'title' | 'cover_mime'> }) {
  if (book.cover_mime === 'image/jpeg' || book.cover_mime === 'image/png') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/api/files/cover/${book.id}`} alt={`Cover of ${book.title}`} loading="lazy" />;
  }
  return <div className="cover-placeholder">{book.title}<br />(cover preview not available)</div>;
}

export default function BookTile({ book }: { book: Book }) {
  return (
    <Link href={`/books/${book.slug}`} className="book-tile">
      <div className="cover"><CoverImage book={book} /></div>
      <h3>{book.title}</h3>
      <div className="by">{book.author_name}</div>
      <div className="price">{formatGbp(book.retail_pence)}</div>
    </Link>
  );
}
