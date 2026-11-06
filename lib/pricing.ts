import {
  pricingConfig as defaultConfig,
  type Binding,
  type PaperType,
  type PricingConfig,
  type TrimSize,
} from '../config/pricing';

export interface PriceInput {
  trimSize: TrimSize;
  paper: PaperType;
  binding: Binding;
  pageCount: number;
  retailPence: number;
}

export interface PriceBreakdown {
  printCostPence: number;
  shippingPence: number;
  platformMarginPence: number;
  totalCostsPence: number;
  royaltyPence: number;
  /** Lowest retail price (pence) that gives a royalty of at least 0. */
  minimumRetailPence: number;
  errors: string[];
  ok: boolean;
}

/** Print cost per copy in GBP pence: base + per-page x pages (x trim multiplier) + binding surcharge. */
export function printCostPence(
  input: Pick<PriceInput, 'trimSize' | 'paper' | 'binding' | 'pageCount'>,
  cfg: PricingConfig = defaultConfig,
): number {
  const paise =
    cfg.basePaise[input.paper] +
    cfg.perPagePaise[input.paper] * cfg.trimMultiplier[input.trimSize] * input.pageCount +
    cfg.bindingSurchargePaise[input.binding];
  // paise -> pence: (paise / 100 INR) / inrPerGbp GBP * 100 = paise / inrPerGbp
  return Math.ceil(paise / cfg.inrPerGbp);
}

export function validateSpec(
  input: Pick<PriceInput, 'trimSize' | 'paper' | 'binding' | 'pageCount'>,
  cfg: PricingConfig = defaultConfig,
): string[] {
  const errors: string[] = [];
  if (!(input.trimSize in cfg.trimMultiplier)) errors.push('Choose a valid trim size.');
  if (!(input.paper in cfg.perPagePaise)) errors.push('Choose a valid paper type.');
  if (!(input.binding in cfg.bindingSurchargePaise)) errors.push('Choose a valid binding.');
  if (!Number.isInteger(input.pageCount)) {
    errors.push('Page count must be a whole number.');
  } else {
    if (input.pageCount < cfg.minPages) errors.push(`Page count must be at least ${cfg.minPages}.`);
    if (input.pageCount > cfg.maxPages) errors.push(`Page count must be at most ${cfg.maxPages}.`);
    if (input.binding === 'hardback' && input.pageCount < cfg.hardbackMinPages) {
      errors.push(`Hardbacks need at least ${cfg.hardbackMinPages} pages.`);
    }
  }
  return errors;
}

/**
 * Full breakdown for one copy.
 * royalty = retail - print cost - UK shipping - platform margin (% of retail).
 */
export function calculatePrice(input: PriceInput, cfg: PricingConfig = defaultConfig): PriceBreakdown {
  const errors = validateSpec(input, cfg);
  const retail = input.retailPence;
  if (!Number.isInteger(retail) || retail <= 0) {
    errors.push('Enter a retail price.');
  } else {
    if (retail < cfg.minRetailPence) errors.push(`Retail price must be at least £${(cfg.minRetailPence / 100).toFixed(2)}.`);
    if (retail > cfg.maxRetailPence) errors.push(`Retail price must be at most £${(cfg.maxRetailPence / 100).toFixed(2)}.`);
  }

  const specOk = validateSpec(input, cfg).length === 0;
  const print = specOk ? printCostPence(input, cfg) : 0;
  const shipping = cfg.shippingPencePerCopy;
  const margin = Number.isInteger(retail) && retail > 0 ? Math.round((retail * cfg.platformMarginPercent) / 100) : 0;
  const totalCosts = print + shipping + margin;
  const royalty = (Number.isInteger(retail) ? retail : 0) - totalCosts;

  // retail - pct*retail >= print + shipping  =>  retail >= (print + shipping) / (1 - pct)
  const fixed = print + shipping;
  let minimumRetail = Math.ceil(fixed / (1 - cfg.platformMarginPercent / 100));
  const royaltyAt = (p: number) => p - Math.round((p * cfg.platformMarginPercent) / 100) - fixed;
  // Correct for rounding of the margin in both directions.
  while (royaltyAt(minimumRetail) < 0) minimumRetail++;
  while (minimumRetail > 1 && royaltyAt(minimumRetail - 1) >= 0) minimumRetail--;

  if (specOk && Number.isInteger(retail) && retail > 0 && royalty < 0) {
    errors.push(
      `At this price the author royalty would be negative (${(royalty / 100).toFixed(2)}). ` +
        `Set the retail price to at least £${(minimumRetail / 100).toFixed(2)}.`,
    );
  }

  return {
    printCostPence: print,
    shippingPence: shipping,
    platformMarginPence: margin,
    totalCostsPence: totalCosts,
    royaltyPence: royalty,
    minimumRetailPence: minimumRetail,
    errors,
    ok: errors.length === 0,
  };
}
