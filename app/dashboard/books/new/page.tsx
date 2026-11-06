import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import BookWizard from './BookWizard';

export const metadata = { title: 'New book' };

export default function NewBookPage() {
  const user = requireUser('/dashboard/books/new');
  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <p className="small"><Link href="/dashboard">← Dashboard</Link></p>
      <h1>Publish a new book</h1>
      <BookWizard defaultAuthorName={user.name} maxUploadMb={Number(process.env.MAX_UPLOAD_MB || 100)} />
    </div>
  );
}
