import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrice, printCostPence } from '../lib/pricing';
import { pricingConfig } from '../config/pricing';
import { formatGbp, parseGbpToPence } from '../lib/money';

const cfg = { ...pricingConfig, inrPerGbp: 100, platformMarginPercent: 10, shippingPencePerCopy: 400 };

test('print cost = base + per-page x pages x trim + binding, converted from INR', () => {
  // bw A5 paperback 200 pages: 5000 + 50*1*200 + 0 = 15000 paise = INR 150 = £1.50
  assert.equal(printCostPence({ trimSize: 'A5', paper: 'bw', binding: 'paperback', pageCount: 200 }, cfg), 150);
  // colour A4 hardback 100 pages: 8000 + 300*1.8*100 + 25000 = 87000 paise -> £8.70
  assert.equal(printCostPence({ trimSize: 'A4', paper: 'colour', binding: 'hardback', pageCount: 100 }, cfg), 870);
});

test('royalty = retail - print - shipping - margin', () => {
  const r = calculatePrice({ trimSize: 'A5', paper: 'bw', binding: 'paperback', pageCount: 200, retailPence: 1000 }, cfg);
  assert.equal(r.printCostPence, 150);
  assert.equal(r.shippingPence, 400);
  assert.equal(r.platformMarginPence, 100);
  assert.equal(r.royaltyPence, 350);
  assert.ok(r.ok);
});

test('negative royalty is rejected and minimum retail price is suggested', () => {
  const r = calculatePrice({ trimSize: 'A5', paper: 'bw', binding: 'paperback', pageCount: 200, retailPence: 500 }, cfg);
  assert.equal(r.ok, false);
  assert.ok(r.royaltyPence < 0);
  const atMin = calculatePrice({ trimSize: 'A5', paper: 'bw', binding: 'paperback', pageCount: 200, retailPence: r.minimumRetailPence }, cfg);
  assert.ok(atMin.ok, atMin.errors.join(';'));
  assert.ok(atMin.royaltyPence >= 0);
  const below = calculatePrice({ trimSize: 'A5', paper: 'bw', binding: 'paperback', pageCount: 200, retailPence: r.minimumRetailPence - 1 }, cfg);
  assert.ok(below.royaltyPence < 0);
});

test('page count and hardback limits enforced', () => {
  assert.equal(calculatePrice({ trimSize: 'A5', paper: 'bw', binding: 'paperback', pageCount: 10, retailPence: 2000 }, cfg).ok, false);
  assert.equal(calculatePrice({ trimSize: 'A5', paper: 'bw', binding: 'hardback', pageCount: 40, retailPence: 3000 }, cfg).ok, false);
  assert.equal(calculatePrice({ trimSize: 'A5', paper: 'bw', binding: 'paperback', pageCount: 12.5, retailPence: 2000 }, cfg).ok, false);
});

test('money helpers', () => {
  assert.equal(formatGbp(1234), '£12.34');
  assert.equal(formatGbp(5), '£0.05');
  assert.equal(formatGbp(-250), '-£2.50');
  assert.equal(parseGbpToPence('12.5'), 1250);
  assert.equal(parseGbpToPence('£9.99'), 999);
  assert.equal(parseGbpToPence('abc'), null);
  assert.equal(parseGbpToPence('1.234'), null);
});
