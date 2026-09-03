// Behavioral tests for status.ts — the main.py gate rules, versioning, and
// carryover semantics as pure predicates/reducers (main.run_stage,
// _approved_profile, edit_profile, approve_profile, edit_asset, and the
// targets/signals on_done handlers).

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const status = require('./.build/status.js');

test('Gate 1: which run kinds require an approved profile', () => {
  for (const kind of ['pricing', 'listing', 'targets', 'signals', 'brand_dna', 'brand_campaigns', 'asset']) {
    assert.equal(status.requiresApprovedProfile(kind), true, kind);
  }
  assert.equal(status.requiresApprovedProfile('understand'), false);
  assert.equal(status.isKnownStageKind('asset'), false); // /run/asset is its own route
  assert.equal(status.isKnownStageKind('bogus'), false);
  assert.equal(status.unknownStageError('bogus'), 'unknown stage bogus');
  assert.equal(status.GATE1_ERROR, 'Gate 1 not passed: no approved profile yet');
});

test('latestApprovedProfile: approved only, highest version; gate1Passed', () => {
  const profiles = [
    { version: 1, status: 'approved' },
    { version: 3, status: 'draft' },
    { version: 2, status: 'approved' },
  ];
  assert.equal(status.latestApprovedProfile(profiles).version, 2);
  assert.equal(status.latestApprovedProfile([{ version: 1, status: 'draft' }]), null);
  assert.equal(status.gate1Passed(profiles), true);
  assert.equal(status.gate1Passed([]), false);
});

test('profileToApprove: latest version regardless of status; 404 message when none', () => {
  const profiles = [
    { version: 2, status: 'approved' },
    { version: 3, status: 'draft' },
  ];
  assert.equal(status.profileToApprove(profiles).version, 3);
  assert.equal(status.profileToApprove([]), null);
  assert.equal(status.NO_PROFILE_TO_APPROVE_ERROR, 'no profile to approve, run understand first');
});

test('brand_campaigns prerequisite: 409 without DNA (empty dict blocks too)', () => {
  assert.equal(status.canRunBrandCampaigns(null), false);
  assert.equal(status.canRunBrandCampaigns(undefined), false);
  assert.equal(status.canRunBrandCampaigns({}), false);
  assert.equal(status.canRunBrandCampaigns({ palette: [] }), true);
  assert.equal(status.BRAND_CAMPAIGNS_PREREQ_ERROR,
               'extract Brand DNA first, campaigns are generated from it');
});

test('profile versioning: edit/understand create a NEW draft version (1 + count)', () => {
  assert.equal(status.nextProfileVersion(0), 1);
  assert.equal(status.nextProfileVersion(4), 5);
  const edited = status.newProfileRowOnEdit(2, { one_liner: 'x' });
  assert.deepEqual(edited, { version: 3, status: 'draft', data: { one_liner: 'x' }, job_id: 'manual-edit' });
  const fromRun = status.newProfileRowOnUnderstand(0, { one_liner: 'y' }, 'job-1');
  assert.deepEqual(fromRun, { version: 1, status: 'draft', data: { one_liner: 'y' }, job_id: 'job-1' });
});

test('asset semantics: job kind, versioning per type, edit re-gates and marks edited', () => {
  assert.equal(status.assetJobKind('x_post'), 'asset:x_post');
  assert.equal(status.nextAssetVersion(2), 3);
  const { data, status: st } = status.applyAssetEdit('x_post', { post: 'z'.repeat(281) });
  assert.equal(st, 'edited');
  assert.deepEqual(data.warnings, ['post exceeds 280 chars: trim before publishing']);
  const clean = status.applyAssetEdit('x_post', { post: 'short' });
  assert.deepEqual(clean.data.warnings, []);
});

test('signal statuses: whitelist', () => {
  for (const s of ['new', 'dismissed', 'replied']) assert.equal(status.isValidSignalStatus(s), true, s);
  assert.equal(status.isValidSignalStatus('done'), false);
  assert.equal(status.BAD_SIGNAL_STATUS_ERROR, 'bad status');
});

test('subredditsFromTargets: mined from ranked target urls, deduped, capped at 5', () => {
  const datas = [
    { url: 'https://reddit.com/r/rust' },
    { url: 'https://news.ycombinator.com' },          // not reddit — skipped
    { url: 'https://www.reddit.com/r/rust/comments/x/y/' }, // dup of rust
    { url: 'https://reddit.com/r/commandline' },
    { url: 'https://reddit.com/r/opensource' },
    { url: 'https://reddit.com/r/selfhosted' },
    { url: 'https://reddit.com/r/webdev' },
    { url: 'https://reddit.com/r/programming' },      // 6th unique — beyond cap
  ];
  assert.deepEqual(status.subredditsFromTargets(datas),
                   ['rust', 'commandline', 'opensource', 'selfhosted', 'webdev']);
  assert.deepEqual(status.subredditsFromTargets([{ url: 'https://x.dev' }]), []);
});

test('carrySignalStatusByUrl: replied/dismissed carry by URL; new does not; unseen default new', () => {
  const prev = [
    { data: { url: 'https://a/t/1' }, status: 'replied' },
    { data: { url: 'https://a/t/2' }, status: 'new' },
    { data: { url: 'https://a/t/3' }, status: 'dismissed' },
    { data: { url: '' }, status: 'replied' },          // empty url never carries
  ];
  const fresh = [
    { url: 'https://a/t/1', rank: 1 },
    { url: 'https://a/t/2', rank: 2 },
    { url: 'https://a/t/3' },                          // rank missing → 0
    { url: 'https://a/t/4', rank: 4 },
  ];
  const rows = status.carrySignalStatusByUrl(prev, fresh);
  assert.deepEqual(rows.map((r) => [r.rank, r.status]), [
    [1, 'replied'], [2, 'new'], [0, 'dismissed'], [4, 'new'],
  ]);
  assert.equal(rows[0].data, fresh[0]); // data is the same object, as in Python
});

test('applyTargetsRun: selection carryover by URL; venue learning with truncations; meta rollup', () => {
  const prev = [
    { data: { url: 'https://reddit.com/r/rust', name: 'r/rust' }, selected: true },
    { data: { url: 'https://old.example.com' }, selected: true },   // vanished from new run
    { data: { url: '' }, selected: true },                          // discarded ("" never matches)
    { data: { url: 'https://news.ycombinator.com' }, selected: false },
  ];
  const longName = 'n'.repeat(130);
  const result = {
    targets: [
      { url: 'https://reddit.com/r/rust', name: 'r/rust', kind: 'subreddit', rank: 1 },
      { url: 'https://news.ycombinator.com', name: 'Hacker News', kind: 'forum', rank: 2 },
      { url: 'https://new-venue.dev', name: longName, rank: 3,
        rules_summary: 'r'.repeat(600), audience_signal: 'a'.repeat(300) },
      { url: 'https://new-venue.dev', name: 'dup', rank: 4 },       // second sighting: not re-learned
      { url: 'mailto:not-http', name: 'weird' },                    // rank missing → 0; not learned
    ],
    coverage_notes: 'wide',
  };
  const known = ['https://news.ycombinator.com'];
  const { targets, newVenues, meta } = status.applyTargetsRun(prev, result, known);

  assert.deepEqual(targets.map((t) => [t.rank, t.selected]), [
    [1, true],   // carried by URL
    [2, false],  // was known but not selected
    [3, false],
    [4, false],
    [0, false],
  ]);
  // learned: r/rust (http, unknown) and new-venue.dev ONCE; HN already known; mailto skipped
  assert.deepEqual(newVenues.map((v) => v.url),
                   ['https://reddit.com/r/rust', 'https://new-venue.dev']);
  const learned = newVenues[1];
  assert.equal(learned.name, 'n'.repeat(120));            // [:120]
  assert.equal(learned.kind, 'community');                // default when key absent
  assert.equal(learned.rules_summary, 'r'.repeat(500));   // [:500]
  assert.equal(learned.audience_signal, 'a'.repeat(200)); // [:200]
  assert.equal(learned.submission_url, '');
  assert.equal(learned.source, 'discovered');
  assert.deepEqual(meta, { coverage_notes: 'wide', venues_learned: 2 });
});

test('applyTargetsRun: name defaults to the url when absent', () => {
  const { newVenues } = status.applyTargetsRun([], { targets: [{ url: 'https://v.dev' }] }, []);
  assert.equal(newVenues[0].name, 'https://v.dev');
});
