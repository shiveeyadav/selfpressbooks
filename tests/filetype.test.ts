import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectFileType } from '../lib/filetype';

test('detects by magic bytes, not extension', () => {
  assert.equal(detectFileType(Buffer.from('%PDF-1.7\n...'))?.ext, 'pdf');
  assert.equal(detectFileType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0]))?.ext, 'jpg');
  assert.equal(detectFileType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext, 'png');
  assert.equal(detectFileType(Buffer.from('<html>%PDF-')), null);
  assert.equal(detectFileType(Buffer.from('')), null);
});
