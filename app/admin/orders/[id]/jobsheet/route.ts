import { getCurrentUser } from '@/lib/auth';
import { getOrder, orderItems } from '@/lib/orders';
import { bindingLabel, paperLabel, trimLabel } from '@/lib/labels';

export const dynamic = 'force-dynamic';

/** Plain-text job sheet to send to the printer alongside the files. Admin only. */
export function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') return new Response('Not found', { status: 404 });
  const order = /^\d+$/.test(params.id) ? getOrder(Number(params.id)) : undefined;
  if (!order) return new Response('Not found', { status: 404 });
  const items = orderItems(order.id);

  const lines = [
    `PRINT JOB – ORDER ${order.public_ref}`,
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    '',
    'ITEMS',
    ...items.flatMap((i, n) => [
      `${n + 1}. ${i.title} – ${i.author_name}${i.isbn ? ` (ISBN ${i.isbn})` : ''}`,
      `   Quantity: ${i.quantity}`,
      `   Trim: ${trimLabel(i.trim_size)}`,
      `   Interior: ${paperLabel(i.paper)}, ${i.page_count} pages`,
      `   Binding: ${bindingLabel(i.binding)}`,
      `   Files: ${i.book_id}-interior-${i.interior_original} / ${i.book_id}-cover-${i.cover_original}`,
      '',
    ]),
    'SHIP TO (India Post ITPS, tracked)',
    order.full_name,
    order.address_line1,
    ...(order.address_line2 ? [order.address_line2] : []),
    order.city,
    ...(order.county ? [order.county] : []),
    order.postcode,
    'UNITED KINGDOM',
    ...(order.phone ? [`Tel: ${order.phone}`] : []),
    '',
    'Please reply with the India Post tracking number once posted.',
  ];
  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="jobsheet-${order.public_ref}.txt"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
