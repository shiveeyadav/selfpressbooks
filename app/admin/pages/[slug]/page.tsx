import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContentPage } from '@/lib/content';
import { savePageAction } from '@/app/admin/actions';
import { DEFAULT_PAGES } from '@/content/defaults';
import { ErrorNotice, OkNotice, sp } from '@/components/Notice';

export default function EditPage({ params, searchParams }: { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const def = DEFAULT_PAGES.find((p) => p.slug === params.slug);
  if (!def) notFound();
  const page = getContentPage(def.slug)!;
  const unresolved = (page.body.match(/\[(NOT SET|OWNER TO CONFIRM)[^\]]*\]/g) || []).length;
  return (
    <>
      <p className="small"><Link href="/admin/pages">← Site pages</Link> · <Link href={`/${page.slug}`}>View page</Link></p>
      <h1>Edit: {page.title}</h1>
      <OkNotice message={sp(searchParams.ok)} />
      <ErrorNotice error={sp(searchParams.error)} />
      {unresolved > 0 && <div className="notice warn">{unresolved} placeholder marker(s) still in the text.</div>}
      <form action={savePageAction} className="card">
        <input type="hidden" name="slug" value={page.slug} />
        <label htmlFor="title">Title</label>
        <input id="title" name="title" type="text" defaultValue={page.title} maxLength={120} />
        <label htmlFor="body">Text</label>
        <textarea id="body" name="body" defaultValue={page.body} style={{ minHeight: 420, fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem' }} />
        <div className="hint">
          Blank line = new paragraph. “## ” starts a heading. “- ” starts a bullet. Tokens like {'{{companyName}}'} are
          filled from config/site.ts.
        </div>
        <label className="checkbox">
          <input type="checkbox" name="reviewed" defaultChecked={page.reviewed} />
          <span>I have reviewed this page and it is accurate (removes the DRAFT banner).</span>
        </label>
        <div className="actions"><button type="submit">Save page</button></div>
      </form>
    </>
  );
}
