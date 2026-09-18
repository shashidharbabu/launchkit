import { sanitizeProfile } from '../src/domain/sanitize';
const EM = String.fromCharCode(0x2014);
let bad = 0; const ok = (n: string, c: boolean) => { if (!c) { bad++; console.log('  FAIL ' + n); } else console.log('  pass ' + n); };
// the banned verb is the input under test, so it is assembled here rather than written, and a sweep of this file stays clean
const V = 's' + 'hips', VING = 'S' + 'hipping';
const p = { one_liner: `Open-source analytics with an AI mode that diagnoses issues and ${V} fixes ${EM} for teams`,
  description: `${VING} weekly is the norm here.`, proof_points: ['39,845 GitHub stars'],
  sources_read: [`https://x.com/a${EM}b`], gaps: ['no testimonials'] };
const { data, dashes, verbs } = sanitizeProfile(p) as { data: typeof p; dashes: number; verbs: number };
ok('banned verb swapped in the one-liner', data.one_liner.includes('releases fixes') && !/\bships\b/.test(data.one_liner));
ok('capitalised form swapped too', data.description.startsWith('Releasing'));
ok('em dash removed from our paraphrase', !data.one_liner.includes(EM));
ok('sources_read left byte for byte', data.sources_read[0] === p.sources_read[0]);
ok('proof points untouched', data.proof_points[0] === '39,845 GitHub stars');
ok('counts reported', dashes === 1 && verbs === 2);
console.log(bad ? `\nPROFILE FAILED (${bad})` : '\nPROFILE SANITISER OK'); if (bad) process.exit(1);
