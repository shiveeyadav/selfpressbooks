import { notFound } from 'next/navigation';
import { getContentPage } from '@/lib/content';
import { parseBlocks } from '@/lib/textblocks';
import { fillSiteTokens } from '@/config/site';
import type { DefaultPage } from '@/content/defaults';

export default function ContentPageView({ slug }: { slug: DefaultPage['slug'] }) {
  const page = getContentPage(slug);
  if (!page) notFound();
  const blocks = parseBlocks(fillSiteTokens(page.body));
  return (
    <div className="container narrow prose">
      {!page.reviewed && (
        <div className="notice warn" role="note">
          <strong>DRAFT – not yet reviewed by the owner.</strong> This page is a starting draft and has not been checked
          for legal accuracy. Placeholders like [NOT SET: …] still need real details.
        </div>
      )}
      <h1>{page.title}</h1>
      {blocks.map((b, i) =>
        b.kind === 'h2' ? (
          <h2 key={i}>{b.text}</h2>
        ) : b.kind === 'ul' ? (
          <ul key={i}>{b.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
      {page.updated_at && <p className="muted small">Last updated {page.updated_at} UTC</p>}
    </div>
  );
}
