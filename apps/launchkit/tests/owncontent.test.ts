/** The app's own content is still dropped; the rest of the internet is not. */
import { gateSignals } from '../src/domain/gates';
let bad = 0;
const ok = (n: string, c: boolean) => { if (!c) { bad++; console.log('  FAIL ' + n); } else console.log('  pass ' + n); };
const own = ['https://plausible.io', 'https://github.com/plausible/analytics'];
const sig = (url: string) => ({ rank: 1, platform: 'other', url, title_or_quote: 't', posted_when: '', intent_strength: 'high' });
const run = (url: string) => {
  const { kept, dropped } = gateSignals([sig(url)] as never, own);
  return { kept: kept.length === 1, why: dropped[0]?.reason ?? '' };
};

console.log('still dropped, correctly:');
ok("the app's own site", !run('https://plausible.io/docs/guide').kept);
ok("the app's own repo", !run('https://github.com/plausible/analytics/issues/42').kept);

console.log('now kept, previously lost to the word "analytics":');
for (const u of [
  'https://www.indiehackers.com/post/why-i-stopped-using-google-analytics-and-what-i-built-instead',
  'https://iansorin.fr/analytics-without-cookie-banner-cookieless-consent-free/',
  'https://blog.authon.dev/i-migrated-off-google-analytics-plausible-vs-fathom-vs-umami-after-6-months',
  'https://github.com/someone/website/issues/12',
]) {
  const r = run(u);
  ok(u.slice(8, 60), r.kept || r.why !== "app's own content");
}
console.log(bad === 0 ? '\nOWN CONTENT OK' : `\nOWN CONTENT FAILED (${bad})`);
if (bad) process.exit(1);
