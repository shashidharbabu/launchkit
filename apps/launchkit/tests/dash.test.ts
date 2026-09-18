import { sanitizeAuthored } from '../src/domain/sanitize';
const EM = String.fromCharCode(0x2014), EN = String.fromCharCode(0x2013);
let bad = 0;
const ok = (n: string, c: boolean) => { if (!c) { bad++; console.log('  FAIL ' + n); } else console.log('  pass ' + n); };

const input = {
  options: [{ name: `Pro ${EM} for teams`, why: `Best value ${EM} by far` }],
  market_rate: `$8${EN}$12 per seat`,
  listing: { description_long: `Launch faster ${EM} with less work.` },
  // somebody else's words, must survive byte for byte
  rules_summary: `No self-promotion ${EM} read the sidebar first.`,
  research: { competitors: [`Calendly ${EM} $12 a seat`] },
  warnings: [`Body over 200 words ${EM} cut it`],
};
const { data, changed } = sanitizeAuthored(input) as { data: typeof input; changed: number };

ok('plan name cleaned', !data.options[0].name.includes(EM));
ok('our reasoning cleaned', !data.options[0].why.includes(EM));
ok('listing copy cleaned', !data.listing.description_long.includes(EM));
ok('a price range becomes a hyphen, not a comma', data.market_rate === '$8-$12 per seat');
ok('quoted venue rules untouched', data.rules_summary === input.rules_summary);
ok('research quotes untouched', data.research.competitors[0].includes(EM));
ok('warnings quote the draft as written', data.warnings[0].includes(EM));
ok('replacements counted', changed === 4);
console.log(bad === 0 ? '\nDASH RULE OK' : `\nDASH RULE FAILED (${bad})`);
if (bad) process.exit(1);
