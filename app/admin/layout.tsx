import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: 'Admin', robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  requireAdmin();
  return (
    <div className="container">
      <nav className="admin-nav" aria-label="Admin">
        <Link href="/admin">Orders</Link>
        <Link href="/admin/books">Books to review</Link>
        <Link href="/admin/pages">Site pages</Link>
      </nav>
      {children}
    </div>
  );
}
