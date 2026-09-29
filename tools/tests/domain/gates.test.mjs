// Parity tests for gates.ts against rr.gate_signals / rr.gate_asset.
//
// GOLDEN values generated 2026-08-31 by running the real Python gates on the
// identical inputs reconstructed below:
//   /Users/shashidharbabu/rocketride-apps-gtm/launchkit/.venv/bin/python -c "
//   import sys, json, copy
//   sys.path.insert(0, '/Users/shashidharbabu/rocketride-apps-gtm/launchkit/backend')
//   from app import rr
//   kept, dropped = rr.gate_signals(<signals below>, <own urls below>)
//   print(json.dumps({'kept': kept, 'dropped': dropped}))
//   print(json.dumps([rr.gate_asset(t, d)['warnings'] for t, d in <cases below>]))"

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const gates = require('./.build/domain/gates.js');

const GATE_SIGNALS_GOLDEN = {"kept": [{"url": "https://news.ycombinator.com/item?id=1", "title": "a", "rank": 1}, {"url": "https://reddit.com/r/rust/comments/abc/xyz/", "title": "b", "rank": 2}, {"url": "https://stackoverflow.com/questions/123/how", "title": "d", "rank": 3}, {"url": "https://forum.rust-lang.org/t/diffs/99", "title": "e", "rank": 4}], "dropped": [{"url": "https://termdiff.dev/blog/post", "reason": "app's own content"}, {"url": "https://github.com/acme/termdiff/issues/5", "reason": "app's own content"}, {"url": "not-a-url", "reason": "not a url"}, {"url": "https://example.com/article", "reason": "not a discussion thread"}]};

// G2 (2026-09-03): golden regenerated from the TS gate after adding the dash warning (no em/en dash on any platform). Verified: stripping only dash warnings reproduces the Python golden exactly, so parity holds; the divergence is intentional.
// Each case: the Python original's lines first, verbatim and in order, then the Social Launch rulebook's findings (f1d43e5).
const GATE_ASSET_WARNINGS_GOLDEN = [["post exceeds 280 chars: trim before publishing","post: Post over 280 characters, {APP_URL} included (281 characters, cap 280)","post: Post under 8 words (1 words, floor 8)","post: Missing the {APP_URL} placeholder"],["post: Post under 8 words (1 words, floor 8)","post: Missing the {APP_URL} placeholder"],["post exceeds 280 chars: trim before publishing","post: Post over 280 characters, {APP_URL} included (281 characters, cap 280)","post: Post under 8 words (1 words, floor 8)","post: Missing the {APP_URL} placeholder","post: The rocket, or more than one emoji in a tweet (\"🚀\")"],["post: Post under 8 words (1 words, floor 8)","post: Missing the {APP_URL} placeholder","post: The rocket, or more than one emoji in a tweet (\"🚀\")"],["pre-existing","tagline exceeds 60 chars: trim before publishing","tagline: Tagline over 60 characters (61 characters, cap 60)"],["title contains an em/en dash, forbidden on every platform","title must start with 'Show HN:'","title: Title does not start with \"Show HN: \" (starts \"termdiff — fast diffs\")","title: Em or en dash in the title (\"—\")","warnings: First warning is not the hand-rewrite line, verbatim (empty)","body: The body says how it works; the length trim must keep this sentence (empty)"],["warnings: First warning is not the hand-rewrite line, verbatim (empty)","body: The body says how it works; the length trim must keep this sentence (empty)"],["title uses HN convention, rewrite for Reddit","title: Title under 6 words (3 words, floor 6)","title: A Show HN title on Reddit (\"Show HN:\")"],[]];

function signalsInput() {
  return [
    { url: 'https://news.ycombinator.com/item?id=1', title: 'a' },
    { url: 'https://reddit.com/r/rust/comments/abc/xyz/', title: 'b' },
    { url: 'https://termdiff.dev/blog/post', title: 'own site' },
    { url: 'https://github.com/acme/termdiff/issues/5', title: 'own repo issue' },
    { url: 'not-a-url', title: 'c' },
    { url: 'https://example.com/article', title: 'not thread' },
    { url: 'https://stackoverflow.com/questions/123/how', title: 'd' },
    { url: 'https://forum.rust-lang.org/t/diffs/99', title: 'e' },
  ];
}
const OWN_URLS = ['https://github.com/acme/termdiff', 'https://termdiff.dev', ''];

test('gate_signals: golden parity — drops non-threads, own content, non-urls; re-ranks kept', () => {
  const { kept, dropped } = gates.gateSignals(signalsInput(), OWN_URLS);
  assert.deepEqual({ kept, dropped }, GATE_SIGNALS_GOLDEN);
});

test('gate_signals: mutates kept signals in place with 1-based rank', () => {
  const input = signalsInput();
  const { kept } = gates.gateSignals(input, OWN_URLS);
  assert.equal(kept[0], input[0]);           // same object reference
  assert.equal(input[0].rank, 1);
  assert.equal(input[1].rank, 2);
});

const ASSET_CASES = [
  ['x_post', () => ({ post: 'x'.repeat(281) })],
  ['x_post', () => ({ post: 'x'.repeat(280) })],
  ['x_post', () => ({ post: '\u{1F680}'.repeat(281) })],  // 281 code points, 562 UTF-16 units
  ['x_post', () => ({ post: '\u{1F680}'.repeat(280) })],  // must NOT trip if counting code points
  ['producthunt', () => ({ tagline: 'y'.repeat(61), warnings: ['pre-existing'] })],
  ['show_hn', () => ({ title: 'termdiff — fast diffs' })],
  ['show_hn', () => ({ title: 'Show HN: termdiff' })],
  ['reddit_post', () => ({ title: 'Show HN: termdiff' })],
  ['x_post', () => ({})],
];

test('gate_asset: golden parity — limits (code-point counted), prefixes, warning preservation', () => {
  const got = ASSET_CASES.map(([type, make]) => gates.gateAsset(type, make()).warnings);
  assert.deepEqual(got, GATE_ASSET_WARNINGS_GOLDEN);
});

test('gate_asset: mutates and returns the same data object', () => {
  const data = { post: 'termdiff renders huge git diffs side by side, right in your terminal: {APP_URL}' };
  const out = gates.gateAsset('x_post', data);
  assert.equal(out, data);
  assert.deepEqual(data.warnings, []);
});

test('ASSET_LIMITS and HN_LOCK_SECONDS constants', () => {
  assert.deepEqual(gates.ASSET_LIMITS, { x_post: ['post', 280], producthunt: ['tagline', 60] });
  assert.equal(gates.HN_LOCK_SECONDS, 14 * 86400);
});

test('hnLockCheck: HN thread older than 14 days is rejected, younger/other kept', () => {
  const now = 1_756_600_000;
  const rejected = gates.hnLockCheck('https://news.ycombinator.com/item?id=1',
                                     now - 15 * 86400, now);
  assert.deepEqual(rejected, {
    verdict: 'rejected',
    why: 'HN thread locked (older than 14 days), cannot reply',
  });
  assert.equal(gates.hnLockCheck('https://news.ycombinator.com/item?id=1',
                                 now - 13 * 86400, now), null);
  // exactly at the boundary: `> HN_LOCK_SECONDS` is strict
  assert.equal(gates.hnLockCheck('https://news.ycombinator.com/item?id=1',
                                 now - 14 * 86400, now), null);
  // non-HN URLs never lock; unknown created keeps the signal
  assert.equal(gates.hnLockCheck('https://reddit.com/r/x/comments/a/b/',
                                 now - 100 * 86400, now), null);
  assert.equal(gates.hnLockCheck('https://news.ycombinator.com/item?id=1', null, now), null);
});

test('THREAD_PAT matches the same URL classes as Python', () => {
  const yes = [
    'https://reddit.com/r/rust/comments/abc/x/',
    'https://news.ycombinator.com/item?id=5',
    'https://github.com/o/r/discussions/1/',
    'https://github.com/o/r/issues/2/',
    'https://stackoverflow.com/questions/1/x',
    'https://forum.example.com/anything',
    'https://community.example.com/t/topic/9',
    'https://example.com/thread-42',
  ];
  const no = ['https://example.com/blog/post', 'https://github.com/o/r'];
  for (const u of yes) assert.ok(gates.THREAD_PAT.test(u), u);
  for (const u of no) assert.ok(!gates.THREAD_PAT.test(u), u);
});

test('THREAD_PAT: hosted community forum topics are threads, their category and board pages are not', () => {
  const yes = [
    'https://community.calendly.com/asked-answered-79/disabling-the-powered-by-calendly-banner-4970',
    'https://community.calendly.com/how-do-i-40/remove-powered-by-calendly-branding-from-router-form-2859?sort=mostRecentFirst',
    'https://community.calendly.com/api-webhook-help-61/embed-parameter-branding-issues-1098?postid=3788',
    'https://community.hubspot.com/t5/apis-integrations/embed-meetings-without-branding/m-p/123456',
  ];
  const no = [
    'https://community.calendly.com/asked-answered-79',
    'https://community.calendly.com/how-do-i-40/',
    'https://community.hubspot.com/t5/apis-integrations/bd-p/APIs',
    'https://www.calendly.com/blog/remove-branding-from-your-page-2024',
  ];
  for (const u of yes) assert.ok(gates.THREAD_PAT.test(u), u);
  for (const u of no) assert.ok(!gates.THREAD_PAT.test(u), u);
});

test('gate_signals: F4 — a shared host (github.com) is never "own"; only the app\'s own repo path is', () => {
  const { kept, dropped } = gates.gateSignals([
    { url: 'https://github.com/krushit1307/CampusConnect/issues/2806', title: 'unrelated repo issue' },
    { url: 'https://github.com/someone/other-tool/discussions/12', title: 'unrelated discussion' },
    { url: 'https://github.com/acme/termdiff/issues/5', title: 'own repo issue' },
  ], OWN_URLS);
  assert.deepEqual(kept.map((s) => s.url), [
    'https://github.com/krushit1307/CampusConnect/issues/2806',
    'https://github.com/someone/other-tool/discussions/12',
  ]);
  assert.deepEqual(dropped, [{ url: 'https://github.com/acme/termdiff/issues/5', reason: "app's own content" }]);
});

// Brand rulebook 2.7 blocks revenue, funding and valuation figures, not prices: the first pattern
// matched any dollar amount and the bare word "raised", and held every Cal.com Product Hunt draft.
const { FINANCIAL_FIGURES } = require('./.build/lib/rulebook-checks.js');
const MONEY_CASES = [
  ["Calendly's $16/seat/month Teams price", false], ['Free $0/mo, Teams $12/mo', false], ['Pro is $29 a month', false],
  ['standard plan is now $18/seat', false], ['Calendly raised prices on August 19', false], ['We raised the limit to 50 seats', false],
  ['Enterprise from $2,500+/mo', false], ['costs $16 monthly per user', false],
  ['We raised $5M from Sequoia', true], ['raised a seed round', true], ['we raised our Series A', true], ['$2M ARR', true],
  ['$500k in revenue', true], ['hit $1,000,000 in revenue this year', true], ['a $40 million valuation', true],
  ['our MRR doubled', true], ['closed a funding round', true], ['$3.5bn market', true], ['run-rate of $80k', true],
];

test('no_financial_figures: prices pass, revenue, funding and valuation figures block', () => {
  const re = new RegExp(FINANCIAL_FIGURES, 'i');
  for (const [text, blocked] of MONEY_CASES) assert.equal(re.test(text), blocked, text);
});

test('no_financial_figures: a Product Hunt draft quoting a competitor price is not blocked by it', () => {
  const draft = { name: 'Cal.com', tagline: 'Open-source scheduling infrastructure for teams and devs',
    description: 'Booking links, routing and embeds you can self-host.',
    first_comment: "Calendly's $16/seat/month Teams price is what most of you pay today. Cal.com is free to self-host." };
  const out = gates.gateAsset('producthunt', draft);
  assert.equal(out.blockers.some((b) => /revenue, funding or valuation/.test(b)), false, JSON.stringify(out.blockers));
  const funded = gates.gateAsset('producthunt', { ...draft, first_comment: 'We raised $5M last year and now we are here.' });
  assert.equal(funded.blockers.some((b) => /revenue, funding or valuation/.test(b)), true, JSON.stringify(funded.blockers));
});
