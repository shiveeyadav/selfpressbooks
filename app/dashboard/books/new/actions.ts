'use server';

import crypto from 'node:crypto';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { insertBook } from '@/lib/books';
import { calculatePrice } from '@/lib/pricing';
import { parseGbpToPence } from '@/lib/money';
import { deleteUpload, saveUpload } from '@/lib/uploads';
import { normaliseIsbn, slugify, str } from '@/lib/validation';
import type { Binding, PaperType, TrimSize } from '@/config/pricing';

export interface WizardState {
  errors: string[];
}

export async function createBookAction(_prev: WizardState, formData: FormData): Promise<WizardState> {
  const user = requireUser('/dashboard/books/new');
  const errors: string[] = [];

  const title = str(formData.get('title'), 200);
  const authorName = str(formData.get('author_name'), 160);
  const description = str(formData.get('description'), 5000);
  const isbnRaw = str(formData.get('isbn'), 30);
  const language = str(formData.get('language'), 60);
  const trimSize = str(formData.get('trim_size'), 20) as TrimSize;
  const paper = str(formData.get('paper'), 20) as PaperType;
  const binding = str(formData.get('binding'), 20) as Binding;
  const pageCount = Number(str(formData.get('page_count'), 10));
  const retailPence = parseGbpToPence(str(formData.get('retail_price'), 20));

  if (!title) errors.push('Enter the book title.');
  if (!authorName) errors.push("Enter the author name as it should appear on the book.");
  if (description.length < 20) errors.push('Write a description of at least 20 characters.');
  if (!language) errors.push('Enter the language of the book.');
  let isbn: string | null = null;
  if (isbnRaw) {
    isbn = normaliseIsbn(isbnRaw);
    if (!isbn) errors.push('The ISBN is not valid (check the digits), or leave it blank.');
  }
  if (retailPence === null) errors.push('Enter a retail price in pounds, e.g. 9.99.');
  if (formData.get('rights') !== 'on') errors.push('Please confirm you have the rights to publish this book.');

  const price = calculatePrice({ trimSize, paper, binding, pageCount, retailPence: retailPence ?? 0 });
  if (retailPence !== null) errors.push(...price.errors);
  else errors.push(...price.errors.filter((e) => !e.startsWith('Enter a retail price')));

  if (errors.length) return { errors };

  const interior = await saveUpload(formData.get('interior'), ['pdf'], 'interior PDF');
  if (typeof interior === 'string') return { errors: [interior] };
  const cover = await saveUpload(formData.get('cover'), ['jpg', 'png', 'pdf'], 'cover (JPG, PNG or PDF)');
  if (typeof cover === 'string') {
    deleteUpload(interior.storedName);
    return { errors: [cover] };
  }

  try {
    insertBook({
      user_id: user.id,
      slug: `${slugify(title)}-${crypto.randomBytes(3).toString('hex')}`,
      title,
      author_name: authorName,
      description,
      isbn,
      language,
      trim_size: trimSize,
      paper,
      binding,
      page_count: pageCount,
      retail_pence: retailPence!,
      print_cost_pence: price.printCostPence,
      shipping_pence: price.shippingPence,
      platform_margin_pence: price.platformMarginPence,
      royalty_pence: price.royaltyPence,
      interior_file: interior.storedName,
      interior_original: interior.originalName,
      cover_file: cover.storedName,
      cover_original: cover.originalName,
      cover_mime: cover.mime,
    });
  } catch (e) {
    deleteUpload(interior.storedName);
    deleteUpload(cover.storedName);
    console.error('insertBook failed', e);
    return { errors: ['Something went wrong saving your book. Please try again.'] };
  }

  redirect('/dashboard?ok=' + encodeURIComponent(`"${title}" was submitted and is waiting for review.`));
}
