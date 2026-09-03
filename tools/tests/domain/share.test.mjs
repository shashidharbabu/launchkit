import test from 'node:test';
import assert from 'node:assert/strict';
import { shareLinks, fillUrl, pickUrl } from './.build-lib/share.js';

const URL = 'https://example.app';
test('X opens the compose intent with the post, URL filled', () => {
  const [l] = shareLinks('x_post', { post: 'try it: {APP_URL}' }, URL);
  assert.equal(l.label, 'Share on X');
  assert.ok(l.href.startsWith('https://x.com/intent/post?text='));
  assert.equal(decodeURIComponent(l.href.split('text=')[1]), 'try it: https://example.app');
});
test('LinkedIn prefills the share box', () => {
  const [l] = shareLinks('linkedin_post', { post: 'hello' }, URL);
  assert.ok(l.href.startsWith('https://www.linkedin.com/feed/?shareActive=true&text=hello'));
});
test('Reddit targets the subreddit with title and text', () => {
  const [l] = shareLinks('reddit_post', { title: 't', body: 'b' }, URL, 'r/SideProject');
  assert.equal(l.href, 'https://www.reddit.com/r/SideProject/submit?title=t&text=b');
  assert.equal(l.label, 'Post to r/SideProject');
});
test('HN submits the link with the title and copies the body first', () => {
  const [l] = shareLinks('show_hn', { title: 'Show HN: x', body: 'why' }, URL);
  assert.ok(l.href.includes('submitlink?u=https%3A%2F%2Fexample.app&t=Show%20HN%3A%20x'));
  assert.equal(l.copyFirst, 'why');
});
test('Product Hunt copies the listing; video has no share', () => {
  const [ph] = shareLinks('producthunt', { name: 'n', tagline: 'tg', description: 'd', first_comment: 'fc' }, URL);
  assert.ok(ph.copyFirst.includes('tg') && ph.copyFirst.includes('fc'));
  assert.equal(shareLinks('video_script', {}, URL).length, 0);
});
test('fillUrl keeps the placeholder without a URL; pickUrl finds the first http field', () => {
  assert.equal(fillUrl('see {APP_URL}', ''), 'see {APP_URL}');
  assert.equal(pickUrl({ name: 'x', repo_url: 'https://github.com/a/b' }), 'https://github.com/a/b');
  assert.equal(pickUrl({ url: 'not a url' }), '');
});
