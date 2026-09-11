/**
 * The subscription placeholder. Billing hooks come later (docs/LAUNCH-PLAN.md,
 * phase 4: the shell's useSubscriptions().getStatus() and the shell:subscribe
 * event); until then the tier is a setting in the store, flipped from the
 * Subscription card on Settings, so the paid surfaces (the plan document) can
 * be built and tested end to end. lib/plan.ts#PLAN_OVERRIDE gates the rest of
 * the app the same provisional way; the billing phase replaces both reads
 * with the shell's status.
 */
import { getSetting, setSetting } from '../data/settings';
import { PLAN_LABEL, type Plan } from './plan';

export const PLAN_TIER_KEY = 'plan_tier';

export type Tier = Plan;
export const TIER_LABEL: Record<Tier, string> = PLAN_LABEL;

/** The tier in the store: "free" until someone subscribes. */
export function getTier(): Tier {
  return getSetting(PLAN_TIER_KEY) === 'pro' ? 'pro' : 'free';
}

/** The demo stand-in for checkout: flips the setting, nothing is charged. */
export function subscribe(): void {
  setSetting(PLAN_TIER_KEY, 'pro');
}

export function unsubscribe(): void {
  setSetting(PLAN_TIER_KEY, 'free');
}

/** The plan document is a Pro surface. */
export function canDownloadPlan(): boolean {
  return getTier() === 'pro';
}
