// threadFromExaSearch: a signal is verified from its own thread's text or not at all.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { threadFromExaSearch, normalizeThreadUrl, THREAD_TEXT_CHARS } = require('./.build/domain/thread.js');

const URL_A = 'https://www.linkedin.com/posts/jessicatinner_i-canceled-calendly-activity-7479897012864376832-CoP6';
const body = (results) => ({ requestId: 'r1', results });

test('normalizeThreadUrl: scheme, www, query, fragment, trailing slash and case do not matter', () => {
  assert.equal(normalizeThreadUrl('HTTPS://www.Reddit.com/r/selfhosted/comments/abc/x/?utm=1#c'), 'reddit.com/r/selfhosted/comments/abc/x');
  assert.equal(normalizeThreadUrl(''), '');
});

test('exact match: joined highlights, whitespace collapsed, publish date as epoch seconds', () => {
  const got = threadFromExaSearch(body([
    { url: 'https://www.linkedin.com/in/jessicatinner', highlights: ['a profile, not the post'] },
    { url: URL_A + '/', highlights: ['I canceled Calendly\nlast month.', 'Not because of the price.'], publishedDate: '2026-07-06T00:00:00.000Z' },
  ]), URL_A);
  assert.deepEqual(got, ['I canceled Calendly last month. Not because of the price.', Date.parse('2026-07-06T00:00:00.000Z') / 1000]);
});

test('falls back to text when there are no highlights, caps the length, tolerates a bad date', () => {
  const [text, created] = threadFromExaSearch(body([{ url: URL_A, text: 'x'.repeat(THREAD_TEXT_CHARS + 50), publishedDate: 'soon' }]), URL_A);
  assert.equal(text.length, THREAD_TEXT_CHARS);
  assert.equal(created, null);
});

test('no exact match, an empty match or a malformed body is null, never a near miss', () => {
  assert.equal(threadFromExaSearch(body([{ url: 'https://www.linkedin.com/posts/someone-else-activity-1', highlights: ['other'] }]), URL_A), null);
  assert.equal(threadFromExaSearch(body([{ url: URL_A, highlights: ['  '] }]), URL_A), null);
  assert.equal(threadFromExaSearch({ results: 'nope' }, URL_A), null);
  assert.equal(threadFromExaSearch(null, URL_A), null);
  assert.equal(threadFromExaSearch(body([{ url: URL_A, highlights: ['t'] }]), ''), null);
});
