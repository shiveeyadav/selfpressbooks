import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container narrow">
      <h1>Page not found</h1>
      <p>We could not find that page. It may have moved, or the book may not be available yet.</p>
      <p><Link href="/">Back to the bookshop</Link></p>
    </div>
  );
}
