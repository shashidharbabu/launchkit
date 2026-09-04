import test from 'node:test';
import assert from 'node:assert/strict';
import { gateTargets } from './.build/gates.js';

const T = [
  { rank: 1, name: 'Show HN', kind: 'launch_platform', url: 'https://news.ycombinator.com/show', expected_impact: 'high' },
  { rank: 2, name: 'dribdat/awesome-hackathon', kind: 'awesome_list', url: 'https://github.com/dribdat/awesome-hackathon', expected_impact: 'high' },
  { rank: 3, name: 'hackathons Resources.md', kind: 'awesome_list', url: 'https://github.com/x/hackathons/blob/main/Resources.md', expected_impact: 'high' },
  { rank: 4, name: 'DevHunt', kind: 'launch_platform', url: 'https://devhunt.org', expected_impact: 'medium' },
  { rank: 5, name: "There's An AI For That", kind: 'directory', url: 'https://theresanaiforthat.com', expected_impact: 'high' },
  { rank: 6, name: 'r/hackathon', kind: 'subreddit', url: 'https://reddit.com/r/hackathon', expected_impact: 'high' },
];
test('repo files are dropped; listings sink below launch venues; impact is capped', () => {
  const { kept, dropped } = gateTargets(T);
  assert.deepEqual(dropped.map((d) => d.target.name), ['hackathons Resources.md']);
  assert.deepEqual(kept.map((t) => t.name), ['Show HN', 'DevHunt', 'r/hackathon', "There's An AI For That", 'dribdat/awesome-hackathon']);
  assert.deepEqual(kept.map((t) => t.rank), [1, 2, 3, 4, 5]);
  assert.equal(kept.find((t) => t.kind === 'awesome_list').expected_impact, 'low');
  assert.equal(kept.find((t) => t.kind === 'directory').expected_impact, 'medium');
});
test('a github url with a non-listing kind still sinks; missing url is dropped', () => {
  const { kept, dropped } = gateTargets([{ name: 'x', kind: 'community', url: '' }, { name: 'gh disc', kind: 'other', url: 'https://github.com/org/repo/discussions' }, { name: 'PH', kind: 'launch_platform', url: 'https://producthunt.com' }]);
  assert.equal(dropped.length, 1);
  assert.deepEqual(kept.map((t) => t.name), ['PH', 'gh disc']);
});
