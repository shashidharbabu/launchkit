/**
 * B2: plan gating reads the shell's real Stripe status.
 *
 * Every AppStatus the shell can report, mapped to the tier the app should give.
 * The Stripe checkout itself belongs to the shell and cannot run in a preview
 * with no shell, so what is proven here is the gate, not the card.
 */
import {
  billingIsLive, canDownloadPlan, getShellStatus, getTier, setShellStatus,
} from '../src/lib/subscription';
import { PLAN_OVERRIDE } from '../src/lib/plan';

let failures = 0;
const ok = (name: string, cond: boolean) => {
  if (!cond) { failures += 1; console.log('  FAIL ' + name); } else { console.log('  pass ' + name); }
};

ok('the Pro bypass is off, so gating is real', PLAN_OVERRIDE === null);

// every status in the shell's AppStatus union
const cases: Array<[string, 'free' | 'pro']> = [
  ['subscribed', 'pro'],
  ['trialing', 'pro'],
  ['free', 'free'],
  ['unsubscribed', 'free'],
  ['past_due', 'free'],
  ['canceled', 'free'],
  ['auth', 'free'],
];

for (const [status, want] of cases) {
  setShellStatus(status);
  ok(`${status.padEnd(12)} -> ${want}`, getTier() === want);
}

setShellStatus('subscribed');
ok('Pro can download the plan document', canDownloadPlan() === true);
setShellStatus('past_due');
ok('a lapsed card loses the paid surface', canDownloadPlan() === false);
ok('status is reported for the UI', getShellStatus() === 'past_due');
ok('billing reads as live once the shell has spoken', billingIsLive() === true);

// no shell at all: the preview stand-in, never a silent Pro
setShellStatus(null);
ok('no shell means billing is not live', billingIsLive() === false);
ok('no shell defaults to free, not pro', getTier() === 'free');

console.log(failures === 0 ? '\nBILLING GATE OK' : `\nBILLING GATE FAILED (${failures})`);
if (failures) process.exit(1);
