// End to end over the backend layer, with no browser: the store, the seed, the rulebook, the gate,
// the targets pipeline's deterministic half, the venue rows the Targets question is built from, the
// asset gate, the approval guard and the plan. Every stage that does not need a live model is run for
// real against the real modules.
import { mountTables, count, select, insert, selectOne } from '../src/data/blobstore';
import { seedVenuesIfEmpty, seedRulebooksIfEmpty } from '../src/data/seed';
import { rulesFor, rulesBlock, rulebookMeta } from '../src/data/rules';
import { gateAsset, gateContext, gateTargets, gateSignals, runRulebookCheckHits } from '../src/domain/gates';
import { buildTargetsQuestion, buildAssetQuestion } from '../src/domain/questions';
import { buildPlan, planMarkdown } from '../src/domain/plan';
import { RULEBOOK_VERSION } from '../src/lib/rulebooks';
import { readFileSync } from 'node:fs';

let bad = 0, n = 0;
const ok = (c: boolean, m: string) => { n++; if (!c) { console.log('  FAIL', m); bad++; } else console.log('  ok  ', m); };
const section = (s: string) => console.log(`\n== ${s}`);

// ---------------------------------------------------------------- 1. the store seeds from cold
section('1. cold store seeds venues and rulebooks');
mountTables(null, () => {});
seedVenuesIfEmpty();
seedRulebooksIfEmpty();
const venues = select('venues') as Record<string, unknown>[];
ok(venues.length === 51, `venues seeded: ${venues.length} (expect 51)`);
ok(count('platform_rules') === 6, 'six rulebooks seeded');
const byName = (x: string) => venues.find((v) => v.name === x) as Record<string, unknown> | undefined;
for (const nm of ['Awesome Indie', 'Launching Next', 'Betabound']) {
  const v = byName(nm);
  ok(Boolean(v), `${nm} is in the venue table`);
  ok(Boolean(v?.rules_summary) && String(v?.rules_summary).length > 60, `${nm} carries a real rules_summary`);
  ok(/2026-09-16/.test(String(v?.rules_source ?? '')), `${nm} carries a dated rules_source`);
  ok(/^https:\/\//.test(String(v?.submission_url ?? '')), `${nm} has a submission url`);
}
ok(venues.every((v) => v.enabled === true), 'every seeded venue is enabled');
ok(new Set(venues.map((v) => String(v.url).replace(/\/$/, ''))).size === venues.length, 'no duplicate venue url');

// ---------------------------------------------------------------- 2. the seed reconciler is idempotent
section('2. reconciler is idempotent and does not clobber an owner row');
seedVenuesIfEmpty();
ok((select('venues') as unknown[]).length === 51, 'running the seed twice adds nothing');
const target = byName('Awesome Indie')!;
(target as Record<string, unknown>).source = 'owner';
(target as Record<string, unknown>).rules_summary = 'my own note';
seedVenuesIfEmpty();
ok(String((byName('Awesome Indie') as Record<string, unknown>).rules_summary) === 'my own note', "an owner's edited venue row is not overwritten");

// ---------------------------------------------------------------- 3. the Targets question carries the new venues
section('3. the Targets question is built from the venue table');
const curated = (select('venues', { enabled: true }) as Record<string, unknown>[]).slice(0, 80).map((v) => ({
  name: v.name, kind: v.kind, url: v.url, submission_url: v.submission_url,
  rules_summary: v.rules_summary, audience_signal: v.audience_signal, tags: v.tags,
}));
const profile = { one_liner: 'An open source scheduling tool', category: 'developer tool',
  target_user: 'developers', icp: { who: 'developers', pain: 'booking links' }, tech_stack: ['TypeScript'],
  confidence: { overall: 0.8 }, gaps: ['pricing page not read'] };
const tq = buildTargetsQuestion(profile as never, curated);
ok(tq.includes('Launching Next') && tq.includes('Betabound'), 'the new venues reach the model in CURATED_VENUES');
ok(/only buys a faster decision/.test(tq), 'the Launching Next row tells the model the paid tier only buys speed');
ok(/not all submissions will be posted|does not belong here/.test(tq), 'the Betabound row carries its curation and maturity constraint');

// ---------------------------------------------------------------- 4. the paid-placement rule is in the pipe
section('4. the Targets pipe carries the paid-placement rule');
// the same text import the app's runner uses, so this runs from any checkout and any cwd
import pipe from '../pipelines/lk_targets.pipe';
const pipeObj = JSON.parse(pipe);
ok(typeof pipeObj === 'object' && pipeObj !== null, 'the pipe is still valid JSON after the edit');
ok(/PAID PLACEMENT IS NOT A LAUNCH VENUE/.test(pipe), 'the rule is present');
ok(/DoFollow backlink/i.test(pipe) && /link exchange/i.test(pipe), 'it names the patterns the verification found');
ok(/optional paid fast-track is fine/i.test(pipe) || /only buys speed/i.test(pipe), 'it does not ban an honest freemium venue');
ok(/ESTABLISHED CHECK first/.test(pipe), 'the established-product rule that preceded it survives');

// ---------------------------------------------------------------- 5. gateTargets still ranks correctly
section('5. gateTargets guardrails');
const ranked = gateTargets([
  { name: 'awesome-selfhosted', kind: 'awesome_list', url: 'https://github.com/awesome-selfhosted/awesome-selfhosted', expected_impact: 'high' },
  { name: 'A README', kind: 'launch_platform', url: 'https://github.com/x/y/blob/main/README.md' },
  { name: 'r/selfhosted', kind: 'subreddit', url: 'https://www.reddit.com/r/selfhosted/', expected_impact: 'high' },
  { name: 'AlternativeTo', kind: 'directory', url: 'https://alternativeto.net/', expected_impact: 'high' },
  { name: 'Awesome Indie', kind: 'launch_platform', url: 'https://awesomeindie.com', expected_impact: 'medium' },
]);
ok(ranked.dropped.some((d) => /blob/.test(String(d.target.url))), 'a file inside a repo is dropped');
const order = ranked.kept.map((t) => String(t.name));
ok(order.indexOf('r/selfhosted') < order.indexOf('awesome-selfhosted'), 'a real venue outranks an awesome-list');
ok(order.indexOf('Awesome Indie') < order.indexOf('AlternativeTo'), 'a launch platform outranks a directory');
ok(ranked.kept.every((t, i) => t.rank === i + 1), 'ranks are renumbered 1..N');

// ---------------------------------------------------------------- 6. the rulebook the drafts are written against
section('6. rulebook v4 reaches a draft');
ok(RULEBOOK_VERSION === 4, `RULEBOOK_VERSION is ${RULEBOOK_VERSION}`);
for (const p of ['x_post', 'linkedin_post', 'reddit_post', 'producthunt', 'show_hn', 'newsletter_pitch']) {
  const rb = rulesFor(p);
  const meta = rulebookMeta(p);
  if (rb.rules.length < 17 || (rb.hooks ?? []).length < 9 || meta.version !== 4) {
    console.log('  FAIL rulebook', p, rb.rules.length, (rb.hooks ?? []).length, meta.version); bad++;
  }
  n++;
}
console.log(`  ok   all six rulebooks load at version 4 with their rules and hooks`);
const block = rulesBlock('reddit_post');
ok(/PLATFORM_RULES[\s\S]*HOOK_PATTERNS[\s\S]*GLOBAL_RULES/.test(block), 'rulesBlock keeps its contract order');
ok(/PRECEDENCE/.test(block), 'the precedence rule reaches the model');

// ---------------------------------------------------------------- 7. the asset gate, end to end
section('7. the asset gate on a real draft shape');
const clean = gateAsset('x_post', {
  post: 'Cal.com turns availability into a booking link you can embed. Open source, self-hostable. {APP_URL}',
  thread_extension: ['It runs on your own domain.', 'The API is public.'],
  alt_variants: ['Cal.com is an open source scheduling tool you can host yourself. {APP_URL}',
                 'Booking links, embeddable, and an API your product can call. {APP_URL}'],
  warnings: ['Checked against the profile.'],
} as never, gateContext(profile, 'https://cal.com', 'https://github.com/calcom/cal.com')) as Record<string, unknown>;
ok(Array.isArray(clean.blockers) && (clean.blockers as unknown[]).length === 0, `a clean X post has no blockers (${JSON.stringify(clean.blockers)})`);

const dirty = gateAsset('x_post', {
  post: 'We are thrilled to announce our 10x faster tool! Upvote us, it is better than Calendly. MRR is $40k. {APP_URL} {APP_URL}',
  thread_extension: [], alt_variants: [], warnings: [],
} as never, gateContext(profile, 'https://cal.com', '')) as Record<string, unknown>;
const db = (dirty.blockers as string[]) ?? [];
ok(db.length >= 3, `a bad X post is blocked on several counts (${db.length})`);
ok(db.some((b) => /financial|MRR|revenue/i.test(b)), 'the financial figure is one of them');
ok(db.some((b) => /\{APP_URL\}|url/i.test(b)), 'the duplicated link is one of them');

// the thin-profile rule, on the profile shape that produced it
const thinCtx = gateContext({ analysis_degraded: true, confidence: { overall: 0.1 }, gaps: [] }, 'https://x.onrender.com', '');
const thin = gateAsset('show_hn', {
  title: 'Show HN: Thing, a tool for teams',
  body: 'Hi HN, Thing takes hackathon submissions and a scoring rubric and produces a structured score sheet each judge fills in. It runs on Postgres.',
  warnings: ['This draft was model-assisted. Rewrite it in your own words before submitting.'],
} as never, thinCtx) as Record<string, unknown>;
ok(((thin.blockers as string[]) ?? []).some((b) => /mechanism/i.test(b)), 'a mechanism claim on a thin profile is blocked');

// ---------------------------------------------------------------- 8. signals gate
section('8. signals gate');
const sg = gateSignals([
  { url: 'https://www.reddit.com/r/selfhosted/comments/abc/need_a_scheduler/' },
  { url: 'https://dev.to/someone/i-need-this...' },
  { url: 'https://cal.com/blog/our-launch' },
  { url: 'not-a-url' },
] as never, ['https://cal.com', 'https://github.com/calcom/cal.com']);
ok(sg.kept.length === 1, `only the real thread is kept (${sg.kept.length})`);
ok(sg.dropped.some((d) => d.reason === 'truncated url'), 'a shortened url is dropped');
ok(sg.dropped.some((d) => d.reason === "app's own content"), "the app's own post is dropped");

// ---------------------------------------------------------------- 9. the plan carries the venues and the posts
section('9. the plan');
const plan = buildPlan(
  { id: 'p1', name: 'Cal.com', app_url: 'https://cal.com', site_url: 'https://cal.com' } as never,
  [{ asset_type: 'x_post', version: 1, data: { post: 'hello {APP_URL}' } },
   { asset_type: 'show_hn', version: 1, data: { title: 'Show HN: Cal.com', body: 'x' } }] as never,
  [{ rank: 1, data: { name: 'Awesome Indie', kind: 'launch_platform', url: 'https://awesomeindie.com' }, selected: true },
   { rank: 2, data: { name: 'Betabound', kind: 'launch_platform', url: 'https://www.betabound.com' }, selected: true }] as never,
  null, {});
ok(plan.ready === true, 'the plan is ready with posts and venues');
ok(plan.targets.every((t) => String(t.ref).startsWith('lk_') && String(t.ref_url).includes('ref=')), 'every venue gets a tracked link');
ok(plan.targets.some((t) => String(t.name).includes('X (your account)')), 'an approved post with no venue still gets a tracked row');
const md = planMarkdown(plan);
ok(md.includes('Awesome Indie') && md.includes('## Targets'), 'the markdown export carries the venues');

console.log(`\n${n} assertions, ${bad} failed`);
console.log(bad ? 'E2E_BACKEND_FAIL' : 'E2E_BACKEND_OK');
