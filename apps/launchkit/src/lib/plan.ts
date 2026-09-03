/**
 * Plan gating, one switch. Development and the demo run with Pro on for
 * everyone; the billing phase replaces the override with the shell's
 * subscription status (useSubscriptions().getStatus(appId)). Nothing in the
 * app may read a plan any other way, so flipping this to null is the whole
 * cut-over.
 */
export type Plan = 'free' | 'pro';

/** null = derive from the shell's subscription status; 'pro' = bypass billing. */
export const PLAN_OVERRIDE: Plan | null = 'pro';

export function effectivePlan(subscriptionStatus?: string | null): Plan {
  if (PLAN_OVERRIDE) return PLAN_OVERRIDE;
  return subscriptionStatus === 'subscribed' || subscriptionStatus === 'trialing' ? 'pro' : 'free';
}

export const PLAN_LABEL: Record<Plan, string> = { free: 'Free', pro: 'Pro' };
