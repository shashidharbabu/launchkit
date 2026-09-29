import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeDraft, sanitizeVerbs } from './.build/domain/sanitize.js';

test('em dash becomes a comma and is counted', () => {
  const { data, changed } = sanitizeDraft({ post: 'ship fast — then fix it' });
  assert.equal(data.post, 'ship fast, then fix it');
  assert.equal(changed, 1);
});
test('en dash between numbers stays a range', () => {
  const { data, changed } = sanitizeDraft({ body: 'takes 30–60 seconds' });
  assert.equal(data.body, 'takes 30-60 seconds');
  assert.equal(changed, 1);
});
test('walks nested objects and arrays; leaves clean text alone', () => {
  const { data, changed } = sanitizeDraft({ a: ['x – y', 'clean'], b: { c: 'one — two — three' }, n: 3 });
  assert.equal(data.a[0], 'x, y');
  assert.equal(data.a[1], 'clean');
  assert.equal(data.b.c, 'one, two, three');
  assert.equal(data.n, 3);
  assert.equal(changed, 3);
});
test('no dashes: zero changes, same text', () => {
  const { data, changed } = sanitizeDraft({ post: 'lowercase, crisp, on point.' });
  assert.equal(changed, 0);
  assert.equal(data.post, 'lowercase, crisp, on point.');
});

test('sanitizeVerbs: a line in capitals keeps its capitals (a reel card), sentence case keeps its first capital', () => {
  const w = 's' + 'hip';
  const out = sanitizeVerbs({ cost_line: `THE BUG ${w.toUpperCase()}S TO PROD.`, breathe_line: `REQUESTS DONE. ${w.toUpperCase()} IT.`, vo: `${w[0].toUpperCase()}${w.slice(1)} it today.` });
  assert.equal(out.data.cost_line, 'THE BUG RELEASES TO PROD.');
  assert.equal(out.data.breathe_line, 'REQUESTS DONE. RELEASE IT.');
  assert.equal(out.data.vo, 'Release it today.');
  assert.equal(out.verbs, 3);
});
