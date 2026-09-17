/**
 * The subscription, read from the shell.
 *
 * The platform already runs billing on Stripe: `useSubscriptions().getStatus()`
 * carries the live status for this app, and emitting `shell:subscribe` opens the
 * shell's own checkout. So this app never sees a card number, never holds a
 * Stripe key and never needs a server of its own.
 *
 * Until phase 4 this was a switch in the store that flipped a boolean and
 * charged nobody. That stand-in survives in exactly one place: a preview with no
 * shell connection, where `getStatus` can return nothing at all and the paid
 * surfaces would otherwise be untestable. The moment the shell reports a status,
 * the shell wins.
 */
import { ConnectionManager } from 'shell';
import { getSetting, setSetting } from '../data/settings';
import { PLAN_LABEL, effectivePlan, type Plan } from './plan';

/** The manifest id the shell knows this app by (package.json appManifest.id). */
export const APP_ID = 'rocketride_sb.launchkit';
export const APP_NAME = 'Launch Kit';

export const PLAN_TIER_KEY = 'plan_tier';

export type Tier = Plan;
export const TIER_LABEL: Record<Tier, string> = PLAN_LABEL;

/** Live status from the shell: one of auth, free, unsubscribed, subscribed, trialing, past_due, canceled. */
let shellStatus: string | null = null;

/** Called once from App.tsx with useSubscriptions().getStatus(APP_ID). */
export function setShellStatus(status: string | null | undefined): void {
  shellStatus = status ?? null;
}

export function getShellStatus(): string | null {
  return shellStatus;
}

/** True when the shell has told us anything at all about this app. */
export function billingIsLive(): boolean {
  return shellStatus !== null;
}

/**
 * The tier. The shell's status decides it whenever the shell has one; otherwise
 * the local stand-in keeps a disconnected preview usable.
 */
export function getTier(): Tier {
  if (shellStatus !== null) return effectivePlan(shellStatus);
  return getSetting(PLAN_TIER_KEY) === 'pro' ? 'pro' : 'free';
}

/**
 * Ask the shell to open checkout for this app. The shell owns the card form,
 * the Stripe Elements confirmation and the receipt; we only raise the request.
 * Returns false when there is no shell to ask.
 */
export function requestUpgrade(): boolean {
  try {
    const mgr = ConnectionManager.getInstance() as unknown as {
      emit?: (event: string, payload: unknown) => void;
    };
    if (typeof mgr?.emit !== 'function') return false;
    mgr.emit('shell:subscribe', { app: { id: APP_ID, name: APP_NAME } });
    return true;
  } catch {
    return false;
  }
}

/** Preview-only stand-in, used when no shell is connected. Charges nobody. */
export function subscribeLocally(): void {
  setSetting(PLAN_TIER_KEY, 'pro');
}

export function unsubscribeLocally(): void {
  setSetting(PLAN_TIER_KEY, 'free');
}

/** The plan document is a Pro surface. */
export function canDownloadPlan(): boolean {
  return getTier() === 'pro';
}
