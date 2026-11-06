import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEmail, normaliseIsbn, normaliseUkPostcode, safeNext, slugify } from '../lib/validation';

test('UK postcodes', () => {
  assert.equal(normaliseUkPostcode('sw1a1aa'), 'SW1A 1AA');
  assert.equal(normaliseUkPostcode('M1 1AE'), 'M1 1AE');
  assert.equal(normaliseUkPostcode('EC1A 1BB'), 'EC1A 1BB');
  assert.equal(normaliseUkPostcode('12345'), null);
  assert.equal(normaliseUkPostcode('110001'), null);
});

test('ISBN checksums', () => {
  assert.equal(normaliseIsbn('978-0-306-40615-7'), '9780306406157');
  assert.equal(normaliseIsbn('0-306-40615-2'), '0306406152');
  assert.equal(normaliseIsbn('978-0-306-40615-8'), null);
  assert.equal(normaliseIsbn('abc'), null);
});

test('misc', () => {
  assert.ok(isEmail('a@b.co'));
  assert.ok(!isEmail('a@b'));
  assert.equal(slugify('Ça va? A Tale of Two Cities!'), 'ca-va-a-tale-of-two-cities');
  assert.equal(safeNext('//evil.com'), '/dashboard');
  assert.equal(safeNext('https://evil.com'), '/dashboard');
  assert.equal(safeNext('/admin/orders'), '/admin/orders');
});
