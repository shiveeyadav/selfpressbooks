import fs from 'node:fs';
import { getCurrentUser } from '@/lib/auth';
import { getBook } from '@/lib/books';
import { uploadPath } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

/**
 * GET /api/files/cover/:id      – cover image (public once the book is approved)
 * GET /api/files/interior/:id   – interior PDF (book owner or admin only)
 * Add ?download=1 to force a download with the original file name.
 */
export async function GET(req: Request, { params }: { params: { kind: string; id: string } }) {
  if (!/^\d+$/.test(params.id) || !['cover', 'interior'].includes(params.kind)) {
    return new Response('Not found', { status: 404 });
  }
  const book = getBook(Number(params.id));
  if (!book) return new Response('Not found', { status: 404 });

  const user = getCurrentUser();
  const privileged = !!user && (user.role === 'admin' || user.id === book.user_id);
  const isCover = params.kind === 'cover';
  if (!privileged && !(isCover && book.status === 'approved')) return new Response('Not found', { status: 404 });

  const stored = isCover ? book.cover_file : book.interior_file;
  const original = isCover ? book.cover_original : book.interior_original;
  const mime = isCover ? book.cover_mime : 'application/pdf';

  let data: Buffer;
  try {
    data = fs.readFileSync(uploadPath(stored));
  } catch {
    return new Response('File missing', { status: 404 });
  }

  const download = new URL(req.url).searchParams.get('download') === '1';
  const safeName = `${book.id}-${params.kind}-${original}`.replace(/[^\w.\-]/g, '_');
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(data.length),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
      'Cache-Control': privileged ? 'private, no-store' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
