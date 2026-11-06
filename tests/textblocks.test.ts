import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBlocks } from '../lib/textblocks';
import { fillSiteTokens } from '../config/site';

test('parses headings, paragraphs and lists', () => {
  const b = parseBlocks('Intro line\ncontinues\n\n## Head\n- one\n- two\nafter');
  assert.deepEqual(b, [
    { kind: 'p', text: 'Intro line continues' },
    { kind: 'h2', text: 'Head' },
    { kind: 'ul', items: ['one', 'two'] },
    { kind: 'p', text: 'after' },
  ]);
});

test('site tokens are filled and unknown tokens kept', () => {
  assert.equal(fillSiteTokens('By {{companyName}} {{nope}}'), 'By [NOT SET: company name] {{nope}}');
});
