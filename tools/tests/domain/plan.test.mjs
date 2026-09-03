// Parity tests for plan.ts against main._ref_code / _ref_url / get_plan /
// _plan_markdown / get_attribution.
//
// GOLDEN values generated 2026-08-31 by running the real Python functions on
// the identical inputs below:
//   /Users/shashidharbabu/rocketride-apps-gtm/launchkit/.venv/bin/python -c "
//   import sys, json
//   sys.path.insert(0, '/Users/shashidharbabu/rocketride-apps-gtm/launchkit/backend')
//   from app import main
//   print(json.dumps([main._ref_code(c) for c in <REF_CASES below>]))
//   print(json.dumps(main._plan_markdown(<PLAN_INPUT below>)))"

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const plan = require('./.build/plan.js');

const REF_CASES = [{"name": "r/rust", "kind": "subreddit"}, {"name": "  Hacker News!! ", "kind": "forum"}, {"name": "Æther—tool.io (beta)", "kind": "directory"}, {"name": "________"}, {"kind": "newsletter"}, {"name": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "kind": "x"}, {"name": "MiXeD CaSe & Punct-uation/slash"}];
const REF_CODES_GOLDEN = ["lk_subreddit_r_rust", "lk_forum_hacker_news", "lk_directory_ther_tool_io_beta", "lk_x_", "lk_newsletter_venue", "lk_x_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "lk_x_mixed_case_punct_uation_slash"];

const PLAN_INPUT = {"project": {"id": "p1", "name": "termdiff", "app_url": "https://termdiff.dev/app"}, "sequencing": ["Post Show HN", "Reply in r/rust thread"], "targets": [{"name": "r/rust", "kind": "subreddit", "url": "https://reddit.com/r/rust", "submission_url": "", "why_fit": "Rust CLI crowd", "rules_summary": "No link-only posts", "ref": "lk_subreddit_r_rust", "ref_url": "https://termdiff.dev/app?ref=lk_subreddit_r_rust"}, {"name": "Hacker News", "kind": "forum", "url": "https://news.ycombinator.com", "ref": "lk_forum_hacker_news", "ref_url": "https://termdiff.dev/app?ref=lk_forum_hacker_news"}], "assets": {"show_hn": {"title": "Show HN: termdiff", "body": "fast — very", "warnings": [], "meta": {"n": 1}}, "x_post": {"post": "38ms diffs", "warnings": ["x"]}}, "ready": true};
const PLAN_MARKDOWN_GOLDEN = "# Launch Plan: termdiff\n\n## Sequence\n1. Post Show HN\n2. Reply in r/rust thread\n\n## Targets\n- **r/rust** (subreddit): https://reddit.com/r/rust\n  - why: Rust CLI crowd\n  - rules: No link-only posts\n  - link to use here (attribution): https://termdiff.dev/app?ref=lk_subreddit_r_rust\n- **Hacker News** (forum): https://news.ycombinator.com\n  - why: None\n  - rules: None\n  - link to use here (attribution): https://termdiff.dev/app?ref=lk_forum_hacker_news\n\n## Asset: show_hn\n**title:**\n\nShow HN: termdiff\n\n**body:**\n\nfast — very\n\n**meta:**\n\n{\"n\": 1}\n\n## Asset: x_post\n**post:**\n\n38ms diffs\n";

test('refCode: golden parity — slugging edge cases (spaces, r/names, punctuation, unicode, defaults, truncation)', () => {
  assert.deepEqual(REF_CASES.map(plan.refCode), REF_CODES_GOLDEN);
});

test('refUrl: separator choice and app_url fallback to site_url', () => {
  const p1 = { app_url: 'https://a.dev/app', site_url: 'https://a.dev' };
  assert.equal(plan.refUrl(p1, 'lk_x_y'), 'https://a.dev/app?ref=lk_x_y');
  const p2 = { app_url: 'https://a.dev/app?utm=1', site_url: 'https://a.dev' };
  assert.equal(plan.refUrl(p2, 'lk_x_y'), 'https://a.dev/app?utm=1&ref=lk_x_y');
  const p3 = { app_url: '', site_url: 'https://a.dev' };
  assert.equal(plan.refUrl(p3, 'lk_x_y'), 'https://a.dev?ref=lk_x_y');
});

test('planMarkdown: golden parity with main._plan_markdown (missing keys render as None, dumps for non-strings, warnings skipped)', () => {
  assert.equal(plan.planMarkdown(PLAN_INPUT), PLAN_MARKDOWN_GOLDEN);
});

test('buildPlan: newest approved version per type, asset_type-ordered; ref codes attached; ready flag', () => {
  const project = { id: 'p1', name: 'termdiff',
                    app_url: 'https://termdiff.dev/app', site_url: 'https://termdiff.dev' };
  const approved = [
    { asset_type: 'x_post', version: 1, data: { post: 'old' } },
    { asset_type: 'x_post', version: 3, data: { post: 'newest' } },
    { asset_type: 'x_post', version: 2, data: { post: 'mid' } },
    { asset_type: 'show_hn', version: 1, data: { title: 'Show HN: termdiff' } },
  ];
  const targets = [
    { rank: 2, data: { name: 'Hacker News', kind: 'forum', url: 'https://news.ycombinator.com' }, selected: true },
    { rank: 1, data: { name: 'r/rust', kind: 'subreddit', url: 'https://reddit.com/r/rust' }, selected: true },
  ];
  const meta = { sequencing_advice: ['first', 'second'], notes: 'x' };
  const out = plan.buildPlan(project, approved, targets, meta);

  assert.deepEqual(Object.keys(out.assets), ['show_hn', 'x_post']); // asset_type ASC
  assert.equal(out.assets.x_post.post, 'newest');                   // version DESC wins
  assert.deepEqual(out.sequencing, ['first', 'second']);
  assert.equal(out.ready, true);
  assert.deepEqual(out.targets.map((t) => t.name), ['r/rust', 'Hacker News']); // rank order
  assert.equal(out.targets[0].ref, 'lk_subreddit_r_rust');
  assert.equal(out.targets[0].ref_url, 'https://termdiff.dev/app?ref=lk_subreddit_r_rust');
  assert.equal(targets[1].data.ref, 'lk_subreddit_r_rust'); // mutates target data, like Python
  assert.deepEqual(out.project, { id: 'p1', name: 'termdiff', app_url: 'https://termdiff.dev/app' });
});

test('buildPlan: sequencing falls back to [] (null meta, or falsy sequencing_advice); ready needs both halves', () => {
  const project = { id: 'p', name: 'n', app_url: '', site_url: 's' };
  const noMeta = plan.buildPlan(project, [], [{ rank: 1, data: { name: 'v' } }], null);
  assert.deepEqual(noMeta.sequencing, []);
  assert.equal(noMeta.ready, false); // no assets
  const nullSeq = plan.buildPlan(project, [{ asset_type: 'a', version: 1, data: {} }], [],
                                 { sequencing_advice: null });
  assert.deepEqual(nullSeq.sequencing, []);
  assert.equal(nullSeq.ready, false); // no targets
});

test('buildAttribution: join by ref code, pop matched, (direct) and unknown refs trail, sorted desc', () => {
  const targets = [
    { rank: 1, data: { name: 'r/rust', kind: 'subreddit' } },       // lk_subreddit_r_rust
    { rank: 2, data: { name: 'Hacker News', kind: 'forum' } },      // lk_forum_hacker_news → 0 signups
  ];
  const counts = [
    { ref: 'lk_subreddit_r_rust', count: 3 },
    { ref: null, count: 5 },              // → "(direct)"
    { ref: 'lk_x_unknown', count: 1 },    // no matching target
  ];
  const out = plan.buildAttribution('p1', targets, counts);
  assert.equal(out.project_id, 'p1');
  assert.equal(out.total, 9);
  assert.deepEqual(out.by_target, [
    { target: null, kind: null, ref: '(direct)', signups: 5 },
    { target: 'r/rust', kind: 'subreddit', ref: 'lk_subreddit_r_rust', signups: 3 },
    { target: null, kind: null, ref: 'lk_x_unknown', signups: 1 },
    { target: 'Hacker News', kind: 'forum', ref: 'lk_forum_hacker_news', signups: 0 },
  ]);
});
