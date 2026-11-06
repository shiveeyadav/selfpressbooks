/** Format integer pence as GBP, e.g. 1234 -> "£12.34". */
export function formatGbp(pence: number): string {
  const sign = pence < 0 ? '-' : '';
  const abs = Math.abs(Math.round(pence));
  return `${sign}£${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** Parse a user-entered pounds amount ("12.99", "£12", "12.5") into pence. Returns null if invalid. */
export function parseGbpToPence(input: string): number | null {
  const s = String(input ?? '').trim().replace(/^£/, '').replace(/,/g, '');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s)) return null;
  const [whole, frac = ''] = s.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}
