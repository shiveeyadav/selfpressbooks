import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { cartCount } from '@/lib/cart';
import { logoutAction } from '@/app/auth/actions';

export default function Header() {
  const user = getCurrentUser();
  const count = cartCount();
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand">
          SelfPress<span>Books</span>
        </Link>
        <form action="/search" method="get" className="header-search" role="search">
          <input type="search" name="q" placeholder="Search books or authors" aria-label="Search books" />
          <button type="submit">Search</button>
        </form>
        <nav className="nav" aria-label="Main">
          <Link href="/">Books</Link>
          <Link href="/cart">Basket{count > 0 ? ` (${count})` : ''}</Link>
          {user ? (
            <>
              {user.role === 'admin' && <Link href="/admin">Admin</Link>}
              <Link href="/dashboard">Dashboard</Link>
              <form action={logoutAction}>
                <button type="submit" className="link">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/signup">Publish a book</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
