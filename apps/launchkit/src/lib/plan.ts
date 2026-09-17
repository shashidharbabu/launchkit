/**
 * Plan gating, one switch. Development and the demo run with Pro on for
 * everyone; the billing phase replaces the override with the shell's
 * subscription status (useSubscriptions().getStatus(appId)). Nothing in the
 * app may read a plan any other way, so flipping this to null is the whole
 * cut-over.
 */
export type Plan = 'free' | 'pro';

/**
 * null = derive from the shell's subscription status; 'pro' = bypass billing.
 *
 * Switched to null on 2026-09-17: the shell reports a real Stripe status now, so
 * bypassing it would mean the paid surfaces were never actually gated. A preview
 * with no shell keeps working through the local stand-in in lib/subscription.ts,
 * not through this override.
 */
export const PLAN_OVERRIDE: Plan | null = null;

export function effectivePlan(subscriptionStatus?: string | null): Plan {
  if (PLAN_OVERRIDE) return PLAN_OVERRIDE;
  return subscriptionStatus === 'subscribed' || subscriptionStatus === 'trialing' ? 'pro' : 'free';
}

export const PLAN_LABEL: Record<Plan, string> = { free: 'Free', pro: 'Pro' };
