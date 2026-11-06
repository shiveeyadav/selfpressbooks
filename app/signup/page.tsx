import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signupAction } from '@/app/auth/actions';
import { getCurrentUser } from '@/lib/auth';
import { ErrorNotice, sp } from '@/components/Notice';

export const metadata = { title: 'Create an author account' };

export default function SignupPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  if (getCurrentUser()) redirect('/dashboard');
  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h1>Publish your book</h1>
      <p className="muted">
        Create a free author account, upload your finished book and set your price. We print each copy on demand and
        post it to readers in the UK.
      </p>
      <ErrorNotice error={sp(searchParams.error)} />
      <form action={signupAction} className="card">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" type="text" autoComplete="name" required maxLength={120} />
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
        <div className="hint">At least 10 characters.</div>
        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
        <label className="checkbox">
          <input type="checkbox" name="terms" required />
          <span>
            I have read the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
          </span>
        </label>
        <div className="actions">
          <button type="submit">Create account</button>
        </div>
      </form>
      <p className="small muted" style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
