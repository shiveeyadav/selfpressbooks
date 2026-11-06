import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loginAction } from '@/app/auth/actions';
import { getCurrentUser } from '@/lib/auth';
import { ErrorNotice, sp } from '@/components/Notice';
import { safeNext } from '@/lib/validation';

export const metadata = { title: 'Log in' };

export default function LoginPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const next = safeNext(sp(searchParams.next));
  if (getCurrentUser()) redirect(next);
  return (
    <div className="container" style={{ maxWidth: 440 }}>
      <h1>Log in</h1>
      <ErrorNotice error={sp(searchParams.error)} />
      <form action={loginAction} className="card">
        <input type="hidden" name="next" value={next} />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <div className="actions">
          <button type="submit">Log in</button>
        </div>
      </form>
      <p className="small muted" style={{ marginTop: 16 }}>
        New author? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
