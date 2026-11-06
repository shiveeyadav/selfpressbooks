/** Small, dependency-free validators shared by server actions. */

export function str(v: FormDataEntryValue | null | undefined, max = 500): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function isEmail(s: string): boolean {
  return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** UK postcode (format check only, not existence). Returns normalised "SW1A 1AA" or null. */
export function normaliseUkPostcode(input: string): string | null {
  const s = input.toUpperCase().replace(/\s+/g, '');
  if (!/^([A-Z]{1,2}[0-9][A-Z0-9]?)([0-9][A-Z]{2})$/.test(s) && s !== 'GIR0AA') return null;
  return `${s.slice(0, -3)} ${s.slice(-3)}`;
}

/** Validates ISBN-10 or ISBN-13 checksum. Returns digits-only form or null. */
export function normaliseIsbn(input: string): string | null {
  const s = input.toUpperCase().replace(/[\s-]/g, '');
  if (/^\d{9}[\dX]$/.test(s)) {
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += (s[i] === 'X' ? 10 : Number(s[i])) * (10 - i);
    return sum % 11 === 0 ? s : null;
  }
  if (/^\d{13}$/.test(s)) {
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0 ? s : null;
  }
  return null;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'book'
  );
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}
