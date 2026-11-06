'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getBook, setBookStatus } from '@/lib/books';
import { changeOrderStatus, updateAdminNote, updateTracking } from '@/lib/orders';
import { isOrderStatus } from '@/lib/order-status';
import { saveContentPage } from '@/lib/content';
import { DEFAULT_PAGES } from '@/content/defaults';
import { str } from '@/lib/validation';

function to(path: string, kind: 'ok' | 'error', msg: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(msg)}`);
}

export async function changeOrderStatusAction(formData: FormData) {
  const admin = requireAdmin();
  const id = Number(formData.get('order_id'));
  const status = str(formData.get('status'), 30);
  const path = `/admin/orders/${id}`;
  if (!Number.isInteger(id) || !isOrderStatus(status)) to('/admin', 'error', 'Invalid request.');
  const err = changeOrderStatus(id, status, `admin:${admin.email}`, str(formData.get('note'), 500) || null, str(formData.get('tracking_number'), 60) || null);
  if (err) to(path, 'error', err);
  to(path, 'ok', 'Status updated.');
}

export async function updateOrderDetailsAction(formData: FormData) {
  const admin = requireAdmin();
  const id = Number(formData.get('order_id'));
  if (!Number.isInteger(id)) to('/admin', 'error', 'Invalid request.');
  if (formData.has('tracking_number')) updateTracking(id, str(formData.get('tracking_number'), 60) || null, `admin:${admin.email}`);
  if (formData.has('admin_note')) updateAdminNote(id, str(formData.get('admin_note'), 2000) || null);
  to(`/admin/orders/${id}`, 'ok', 'Saved.');
}

export async function reviewBookAction(formData: FormData) {
  requireAdmin();
  const id = Number(formData.get('book_id'));
  const decision = str(formData.get('decision'), 20);
  const note = str(formData.get('note'), 1000) || null;
  const book = Number.isInteger(id) ? getBook(id) : undefined;
  if (!book) to('/admin/books', 'error', 'Book not found.');
  const path = `/admin/books/${id}`;
  if (decision === 'approve') {
    setBookStatus(id, 'approved', note);
    to(path, 'ok', 'Approved – the book is now visible in the shop.');
  } else if (decision === 'reject') {
    if (!note) to(path, 'error', 'Add a note telling the author why the book was not approved.');
    setBookStatus(id, 'rejected', note);
    to(path, 'ok', 'Marked as not approved. The author can see your note.');
  } else if (decision === 'unpublish') {
    setBookStatus(id, 'pending_review', note);
    to(path, 'ok', 'Moved back to pending review – the book is hidden from the shop.');
  }
  to(path, 'error', 'Unknown action.');
}

export async function savePageAction(formData: FormData) {
  requireAdmin();
  const slug = str(formData.get('slug'), 30);
  const def = DEFAULT_PAGES.find((p) => p.slug === slug);
  if (!def) to('/admin/pages', 'error', 'Unknown page.');
  const title = str(formData.get('title'), 120) || def.title;
  const body = str(formData.get('body'), 50000);
  if (!body) to(`/admin/pages/${slug}`, 'error', 'The page text cannot be empty.');
  saveContentPage(def.slug, title, body, formData.get('reviewed') === 'on');
  to(`/admin/pages/${slug}`, 'ok', 'Page saved.');
}
