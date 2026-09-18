/** Brand rulebook 4.3, through the real gate: the six examples the brand check flagged for Joe. */
import { gateAsset } from '../src/domain/gates';

let bad = 0;
const ok = (n: string, c: boolean) => { if (!c) { bad++; console.log('  FAIL ' + n); } else console.log('  pass ' + n); };
const run = (body: string) => {
  const g = gateAsset('reddit_post', { title: 'x', body, subreddit: 'r/test' } as Record<string, unknown>, {}) as Record<string, unknown>;
  const all = [...(g.blockers as string[] ?? []), ...(g.warnings as string[] ?? [])].join(' | ');
  return {
    blocked: (g.blockers as string[] ?? []).some((b) => /provider_comparison|comparative or adversarial/i.test(b)),
    routed: all.includes('no settled policy'),
  };
};

const hard = [
  ['flag 3, 54 times smaller than Google Analytics', 'the tracking script is 54 times smaller than Google Analytics today'],
  ['flag 4, data sent to Google servers', 'GA4 means cookie banners, complex reports, and data sent to Google servers'],
  ['flag 6, 135KB less than the Google Analytics script', 'about 135KB less per visitor than the Google Analytics script'],
];
for (const [n, body] of hard) ok(`BLOCKED: ${n}`, run(body).blocked);

const versus = [
  ['plausible reddit, 45KB versus Google Analytics', 'The tracking script is 45KB versus Google Analytics at 45KB plus the consent layer'],
];
for (const [n, body] of versus) ok(`BLOCKED: ${n}`, run(body).blocked);

const soft = [
  ['flag 5, neutral stack fact', 'configurable providers include OpenAI, Anthropic, Google Gemini and DeepSeek'],
  ['flag 7, customer list naming Meta', 'used by teams at Meta and by independent developers'],
];
for (const [n, body] of soft) { const r = run(body); ok(`ROUTED not blocked: ${n}`, r.routed && !r.blocked); }

const clean = [
  ['a meta description', 'set the meta description and the page title before launch'],
  ['metadata', 'the metadata is stored per run and shown in the trace'],
  ['an ordinary sentence', 'a simple analytics tool for small teams that self-host'],
];
for (const [n, body] of clean) { const r = run(body); ok(`SILENT: ${n}`, !r.routed && !r.blocked); }

console.log(bad === 0 ? '\nPROVIDER POLICY OK' : `\nPROVIDER POLICY FAILED (${bad})`);
if (bad) process.exit(1);
