/**
 * ALL print, shipping and margin rates live in this one file.
 *
 * Every number marked PLACEHOLDER is NOT a real quote. Replace them with the
 * figures from the chosen Indian print-on-demand printer before taking orders.
 *
 * Printer rates are entered in Indian rupees (paise = INR x 100) because the
 * printer will quote in INR. They are converted to GBP pence with
 * `inrPerGbp`. Everything shown to customers and authors is in GBP.
 */

export type TrimSize = 'A5' | 'B5_6x9' | 'A4';
export type PaperType = 'bw' | 'colour';
export type Binding = 'paperback' | 'hardback';

export const TRIM_SIZES: { value: TrimSize; label: string }[] = [
  { value: 'A5', label: 'A5 (148 x 210 mm)' },
  { value: 'B5_6x9', label: 'B5 / 6 x 9 in (approx. 152-176 x 229-250 mm)' },
  { value: 'A4', label: 'A4 (210 x 297 mm)' },
];

export const PAPER_TYPES: { value: PaperType; label: string }[] = [
  { value: 'bw', label: 'Black & white interior' },
  { value: 'colour', label: 'Colour interior' },
];

export const BINDINGS: { value: Binding; label: string }[] = [
  { value: 'paperback', label: 'Paperback' },
  { value: 'hardback', label: 'Hardback' },
];

export const pricingConfig = {
  /** INR per 1 GBP. PLACEHOLDER – replace with the rate you actually pay (incl. bank/FX fees). */
  inrPerGbp: 100, // PLACEHOLDER – replace with real exchange rate

  /** Fixed cost per printed copy, in paise (INR x 100), by paper type. */
  basePaise: {
    bw: 5000, // PLACEHOLDER – replace with real printer quote (INR 50.00)
    colour: 8000, // PLACEHOLDER – replace with real printer quote (INR 80.00)
  } as Record<PaperType, number>,

  /** Cost per interior page, in paise, by paper type (before trim multiplier). */
  perPagePaise: {
    bw: 50, // PLACEHOLDER – replace with real printer quote (INR 0.50 / page)
    colour: 300, // PLACEHOLDER – replace with real printer quote (INR 3.00 / page)
  } as Record<PaperType, number>,

  /** Multiplier on the per-page cost for larger trim sizes. */
  trimMultiplier: {
    A5: 1.0, // PLACEHOLDER – replace with real printer quote
    B5_6x9: 1.2, // PLACEHOLDER – replace with real printer quote
    A4: 1.8, // PLACEHOLDER – replace with real printer quote
  } as Record<TrimSize, number>,

  /** Extra cost per copy for the binding, in paise. */
  bindingSurchargePaise: {
    paperback: 0, // PLACEHOLDER – replace with real printer quote
    hardback: 25000, // PLACEHOLDER – replace with real printer quote (INR 250.00)
  } as Record<Binding, number>,

  /** Page-count limits accepted by the printer. */
  minPages: 24, // PLACEHOLDER – confirm with printer
  maxPages: 800, // PLACEHOLDER – confirm with printer
  hardbackMinPages: 64, // PLACEHOLDER – confirm with printer

  /**
   * UK delivery from India by India Post ITPS, per copy, in GBP pence.
   * Duarte's working estimate is £3–5 per parcel; default £4.
   * Charged per copy (conservative: one parcel per copy).
   */
  shippingPencePerCopy: 400, // PLACEHOLDER – confirm with real India Post ITPS rates

  /** Platform (SelfPressBooks) margin as a percentage of the retail price. */
  platformMarginPercent: 15, // PLACEHOLDER – owner to decide

  /** Retail price limits authors may set, in GBP pence. */
  minRetailPence: 199,
  maxRetailPence: 20000,
};

export type PricingConfig = typeof pricingConfig;
