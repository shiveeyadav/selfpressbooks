import 'server-only';
import { getDb } from './db';
import { DEFAULT_PAGES, type DefaultPage } from '@/content/defaults';

export interface ContentPage {
  slug: DefaultPage['slug'];
  title: string;
  body: string;
  reviewed: boolean;
  updated_at: string | null;
}

export function getContentPage(slug: DefaultPage['slug']): ContentPage | null {
  const def = DEFAULT_PAGES.find((p) => p.slug === slug);
  if (!def) return null;
  const row = getDb()
    .prepare('SELECT slug, title, body, reviewed, updated_at FROM content_pages WHERE slug = ?')
    .get(slug) as { slug: DefaultPage['slug']; title: string; body: string; reviewed: number; updated_at: string } | undefined;
  if (!row) return { ...def, reviewed: false, updated_at: null };
  return { ...row, reviewed: row.reviewed === 1 };
}

export function listContentPages(): ContentPage[] {
  return DEFAULT_PAGES.map((p) => getContentPage(p.slug)!);
}

export function saveContentPage(slug: DefaultPage['slug'], title: string, body: string, reviewed: boolean) {
  getDb()
    .prepare(
      `INSERT INTO content_pages (slug, title, body, reviewed, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET title = excluded.title, body = excluded.body,
         reviewed = excluded.reviewed, updated_at = excluded.updated_at`,
    )
    .run(slug, title, body, reviewed ? 1 : 0);
}
