import Link from 'next/link';
import { listContentPages } from '@/lib/content';
import { ErrorNotice, sp } from '@/components/Notice';

export default function AdminPagesList({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const pages = listContentPages();
  return (
    <>
      <h1>Site pages</h1>
      <ErrorNotice error={sp(searchParams.error)} />
      <p className="muted">
        These pages start as drafts. Edit them, replace every [NOT SET …] / [OWNER TO CONFIRM …] marker, and tick
        “reviewed” to remove the draft banner. Company details come from <code>config/site.ts</code>.
      </p>
      <table className="data">
        <thead><tr><th>Page</th><th>Status</th><th>Last saved</th></tr></thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.slug}>
              <td><Link href={`/admin/pages/${p.slug}`}>{p.title}</Link> <span className="small muted">/{p.slug}</span></td>
              <td>{p.reviewed ? <span className="badge approved">Reviewed</span> : <span className="badge pending_review">Draft</span>}</td>
              <td className="small">{p.updated_at || 'never (default text)'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
