/**
 * Red first. classifyIntent does not exist when this is written; the fixture is
 * the contract it has to meet. The bar is deliberately asymmetric:
 *   - every 'builder' and 'vendor' row must be caught (a missed one becomes a
 *     signal the founder replies to, which is the fault being fixed);
 *   - no 'buyer' row may be labelled builder or vendor (a dropped buyer is a lost
 *     lead, and the judge never sees it);
 *   - 'unclear' rows must come back 'unclear' or 'buyer', never dropped.
 */
import { FIXTURE, type Intent } from './intent-fixture';
import { classifyIntent } from '../src/domain/gates';

let bad = 0;
const fail = (msg: string) => { bad++; console.log('  FAIL ' + msg); };
const counts: Record<string, number> = {};

for (const row of FIXTURE) {
  const got: Intent = classifyIntent(row.text, row.url);
  counts[`${row.want}->${got}`] = (counts[`${row.want}->${got}`] ?? 0) + 1;
  if ((row.want === 'builder' || row.want === 'vendor') && got !== row.want) fail(`${row.want} missed as ${got}: "${row.text.slice(0, 70)}" (${row.from})`);
  if (row.want === 'buyer' && (got === 'builder' || got === 'vendor')) fail(`buyer dropped as ${got}: "${row.text.slice(0, 70)}" (${row.from})`);
  if (row.want === 'unclear' && (got === 'builder' || got === 'vendor')) fail(`unclear dropped as ${got}: "${row.text.slice(0, 70)}" (${row.from})`);
}

console.log('label -> got:', JSON.stringify(counts));
console.log(bad ? `\nINTENT FAILED (${bad} of ${FIXTURE.length})` : `\nINTENT OK (${FIXTURE.length} rows)`);
if (bad) process.exit(1);
