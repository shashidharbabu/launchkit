// Turn 2 of the 09-29 evaluation loop: each test pins a fix to the evidence that asked for it.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const gates = require('./.build/domain/gates.js');
const { revenueAtPoints } = require('./.build/domain/revenue.js');
const plan = require('./.build/domain/plan.js');
const { staleThreadWhy, untrustedRepoWhy } = require('./.build/domain/thread.js');
const { clampText } = require('./.build/domain/studio.js');

const PROFILE = {
  one_liner: 'Open-source scheduling infrastructure',
  icp: { current_alternatives: ['Calendly', 'Acuity Scheduling', 'Google Analytics 4'] },
  proof_points: ['48,213 GitHub stars', '1,000,000+ users'],
};
const PRICING = { competitors: [{ name: 'SavvyCal' }], recommendation: { tiers: [{ name: 'Teams', price_usd_month: 12 }] } };
const ctx = () => gates.gateContext(PROFILE, '', '', { texts: [PRICING], competitors: gates.competitorNames(PROFILE, PRICING, 'Cal.com') });
const swipes = (data) => gates.gateAsset('reddit_post', { ...data }, ctx()).blockers.filter((b) => /competitor named/.test(b));
const numbers = (data) => gates.gateAsset('reddit_post', { ...data }, ctx()).blockers.filter((b) => /in no source/.test(b));

test('competitor swipes: the ten-app evidence is caught', () => {
  for (const body of [
    'Calendly handles the booking step well; it doesn\'t give you an open API to query your own data.',
    'Calendly has become slow and paywalled for teams.',
    'SavvyCal gives you nice links, but every workflow is locked to its cloud.',
    'GA4 requires cookie banners and legal overhead that slows sites.',
  ]) assert.equal(swipes({ title: 'x', body }).length, 1, body);
});

test('competitor swipes: neutral mentions and look-alike words pass', () => {
  for (const body of [
    'Teams moving off Calendly can import their event types in one step.',
    'Per-seat pricing makes scheduling expensive to own as your team grows.',
    'Cal.com is open source and self-hostable.',
  ]) assert.deepEqual(swipes({ title: 'x', body }), [], body);
});

test('competitor names: aliases for multi-word names, never this app, never a common word', () => {
  const names = gates.competitorNames(PROFILE, PRICING, 'Cal.com');
  assert.ok(names.includes('Calendly') && names.includes('=GA4'));
  assert.ok(!names.includes('=AS'), 'a two-letter alias that is a common word is not a competitor');
  assert.deepEqual(gates.competitorNames({ icp: { current_alternatives: ['Cal.com', 'Doodle'] } }, null, 'Cal.com'), ['Doodle']);
});

test('invented numbers: a figure in no source is a blocker; sourced, rounded and small ones pass', () => {
  assert.equal(numbers({ title: 'x', body: 'Half of our 12 reviewers quit after 47 collections.' }).length, 1);
  assert.deepEqual(numbers({ title: 'x', body: 'Loved by 48k developers and 1M users, $12 a seat, 3 steps.' }), []);
  assert.deepEqual(numbers({ title: 'x', body: 'Trusted by 48,200 stargazers.' }), []);
  assert.deepEqual(numbers({ title: 'x', body: 'Book it: {APP_URL}' }), []);
});

test('revenue is computed from the paid tiers, never the model (documenso 09-29: ten times low)', () => {
  assert.deepEqual(revenueAtPoints([{ price_usd_month: 0 }, { price_usd_month: 30 }, { price_usd_month: 180 }]), { 10: 1050, 50: 5250, 200: 21000 });
  assert.deepEqual(revenueAtPoints([{ price_usd_month: 0 }, { price_usd_month: null }]), { 10: 0, 50: 0, 200: 0 });
});

test('plan: ready only when nothing started is left open, and the export says what is open', () => {
  const project = { id: 'p1', name: 'documenso', app_url: 'https://documenso.com' };
  const approved = [{ asset_type: 'x_post', version: 1, data: { post: 'a' } }];
  const targets = [{ rank: 1, data: { name: 'r/selfhosted', kind: 'subreddit', url: 'https://reddit.com/r/selfhosted' } }];
  assert.equal(plan.buildPlan(project, approved, targets, null).ready, true);
  const pending = [{ asset_type: 'show_hn', state: 'failed', note: 'the draft failed: no JSON' }];
  const p = plan.buildPlan(project, approved, targets, null, { pending });
  assert.equal(p.ready, false);
  assert.deepEqual(p.pending, pending);
  assert.match(plan.planMarkdown(p), /## Still open\n- \*\*show_hn\*\* \(failed\): the draft failed: no JSON/);
  assert.doesNotMatch(plan.planMarkdown(plan.buildPlan(project, approved, targets, null)), /Still open/);
});

test('signals: stale threads and planted repositories are rejected before the judge', () => {
  const now = Date.parse('2026-09-29T00:00:00Z') / 1000;
  assert.match(staleThreadWhy(Date.parse('2026-05-01T00:00:00Z') / 1000, now), /older than 90 days/);
  assert.equal(staleThreadWhy(Date.parse('2026-09-01T00:00:00Z') / 1000, now), null);
  assert.equal(staleThreadWhy(null, now), null);
  assert.match(untrustedRepoWhy({ stargazers_count: 0, created_at: '2026-09-28T23:50:00Z' }, now), /0 stars/);
  assert.match(untrustedRepoWhy({ stargazers_count: 400, created_at: '2026-09-20T00:00:00Z' }, now), /days old/);
  assert.equal(untrustedRepoWhy({ stargazers_count: 48213, created_at: '2021-03-01T00:00:00Z' }, now), null);
});

test('reel copy is never cut inside a word (cal-com "SCHEDULING INFRASTRUCTUR.")', () => {
  assert.equal(clampText('SCHEDULING INFRASTRUCTURE.', 24, '.'), 'SCHEDULING.');
  assert.equal(clampText('EVERY ONE. BY HAND.', 26, '.'), 'EVERY ONE. BY HAND.');
  for (const [v, max] of [['WHERE DID REVENUE COME FROM?', 24], ['KNOW WHAT DRIVES REVENUE.', 20]]) {
    const out = clampText(v, max, '.');
    assert.ok(v.replace(/[.?!]$/, '').split(' ').some((w, i, ws) => ws.slice(0, i + 1).join(' ') === out.replace(/[.?!]$/, '')), `${out} ends on a whole word`);
  }
});

test('signal replies lose their swipes; a reply left too short is dropped (continue 09-29)', () => {
  const comps = ['GitHub Copilot', 'Copilot', 'Tabnine'];
  const r = 'Local models work well here. Copilot locks you to Microsoft\'s models. You can point Continue at Ollama.';
  assert.equal(gates.replyWithoutSwipes(r, comps), 'Local models work well here. You can point Continue at Ollama.');
  assert.equal(gates.replyWithoutSwipes('Copilot doesn\'t support Ollama. Try this.', comps), '');
  assert.equal(gates.replyWithoutSwipes('Happy to help. Here is how.', comps), 'Happy to help. Here is how.');
});

test('turn 3: the finder\'s posted_when dates an unread thread', () => {
  const { postedWhenEpoch } = require('./.build/domain/thread.js');
  const now = Date.parse('2026-09-29T00:00:00Z') / 1000;
  assert.equal(postedWhenEpoch('2025-03-12', now), Date.parse('2025-03-12') / 1000);
  assert.equal(postedWhenEpoch('March 12th, 2025', now), Date.parse('March 12, 2025') / 1000);
  assert.equal(postedWhenEpoch('3 months ago', now), now - 90 * 86400);
  assert.equal(postedWhenEpoch('a year ago', now), now - 365 * 86400);
  assert.equal(postedWhenEpoch('unknown', now), null);
  assert.equal(postedWhenEpoch('', now), null);
});

test('turn 3: a reel line that says BY HAND without the profile saying so, or an unsourced tile, is flagged', () => {
  const { scriptRuleBreaks } = require('./.build/domain/studio.js');
  const nums = new Set(['10000']);
  const flagged = scriptRuleBreaks({ pile_line: 'EVERY SKETCH. BY HAND.', load_n1: '12', load_n2: '10000', load_n3: 'ALL' }, '{"one_liner":"whiteboard"}', nums).map((b) => b.id);
  assert.deepEqual(flagged, ['pile_line', 'load_n1']);
  assert.deepEqual(scriptRuleBreaks({ pile_line: 'EVERY FORM. BY HAND.' }, '{"pain":"teams copy responses by hand into spreadsheets"}', nums), []);
});

test('turn 3: origin stories are caught (cal-com, khoj, documenso), plain first-person facts are not', () => {
  const stories = (body) => gates.gateAsset('reddit_post', { title: 'x', body }, ctx()).blockers.filter((b) => /origin story/.test(b));
  for (const body of ['We kept running into teams who juggled calendars, so we built Cal.com.', 'I built Documenso because signing was broken.', "That's why we built it."]) {
    assert.equal(stories(body).length, 1, body);
  }
  for (const body of ['I work on Cal.com.', 'We built an embed API that teams use today.', 'Cal.com is open source.']) {
    assert.deepEqual(stories(body), [], body);
  }
});

test('turn 3: public copy never sees what Launch Kit could not read (hack-judge 503 in a Reddit post)', () => {
  const q = require('./.build/domain/questions.js');
  const p = { one_liner: 'x', gaps: ['no mobile app'], unverified: ['landing page returned 503'], site_gaps: ['no demo link'] };
  assert.deepEqual(q.publicProfile(p), { one_liner: 'x', gaps: ['no mobile app'] });
  const ask = q.buildAssetQuestion('reddit_post', p, null, '', '', null, '', {});
  assert.doesNotMatch(ask, /503|no demo link/);
  assert.match(ask, /no mobile app/);
});

test('turn 3: sentences split without losing text at a decimal (continue "Apache 2.0")', () => {
  const { splitSentences } = require('./.build/domain/studio.js');
  const t = 'Continue is Apache 2.0 licensed. It runs in VS Code. "Use it," they said.';
  const parts = splitSentences(t);
  assert.equal(parts.join(''), t);
  assert.deepEqual(parts.map((p) => p.trim()), ['Continue is Apache 2.0 licensed.', 'It runs in VS Code.', '"Use it," they said.']);
});

test('complianceBlankets: a standard promised on every plan is caught; a standard with its edition is not', async () => {
  const { complianceBlankets } = gates;
  assert.equal(complianceBlankets('ESIGN, UETA, 21 CFR Part 11 and HIPAA are covered on all plans, with no add-on fees.').length, 1);
  assert.equal(complianceBlankets('HIPAA compliance included by default, no add-on tier required.').length, 1);
  assert.equal(complianceBlankets('Compliance coverage includes ESIGN, UETA, and 21 CFR Part 11 out of the box.').length, 1);
  assert.equal(complianceBlankets('21 CFR Part 11 and HIPAA come with the Enterprise plan.').length, 0);
  assert.equal(complianceBlankets('Every plan includes unlimited documents. SOC 2 report available on request.').length, 0);
});

test('origin story: "we kept running sites where" is a story the profile does not hold', () => {
  const ctx = gates.gateContext({ name: 'Plausible' }, '', '', { texts: [], competitors: [] });
  const out = gates.gateAsset('producthunt', { first_comment: 'We kept running sites where the analytics setup had become its own project.', warnings: [], blockers: [] }, ctx);
  assert.ok(out.blockers.some((b) => /origin story/i.test(b)), JSON.stringify(out.blockers));
});

test('THREAD_PAT: a Lemmy thread and a Mastodon post are discussion threads; a Lemmy community page is not', () => {
  assert.ok(gates.THREAD_PAT.test('https://old.lemmy.net.au/post/723837'));
  assert.ok(gates.THREAD_PAT.test('https://lemmy.world/post/12345678'));
  assert.ok(gates.THREAD_PAT.test('https://fosstodon.org/@someone/113245678901234567'));
  assert.ok(!gates.THREAD_PAT.test('https://lemmy.world/c/selfhosted'));
});

test('complianceBlankets: a security feature promised on both or every plan is caught (excalidraw E2EE)', () => {
  const { complianceBlankets } = gates;
  assert.equal(complianceBlankets('Every canvas is end-to-end encrypted, on both the free and Plus plans.').length, 1);
  assert.equal(complianceBlankets('SSO and audit logs on every plan.').length, 1);
  assert.equal(complianceBlankets('End-to-end encryption comes with the free plan.').length, 0);
});
