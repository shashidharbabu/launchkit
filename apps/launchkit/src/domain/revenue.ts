/**
 * Monthly revenue for a pricing option, computed from its paid tiers and never taken from the model.
 *
 * The options ask returns its own revenue_at, and on 09-29 documenso's two subscription options stored
 * figures ten times too low (tiers averaging $105 reported $105 at ten customers). The Commercial card
 * already recomputes for display; the stored copy, which exports and later stages read, now matches it.
 * Customers spread evenly across the paid tiers: revenue = customers x the average paid price.
 */
export const REVENUE_POINTS = [10, 50, 200] as const;

export function revenueAtPoints(tiers: Array<{ price_usd_month: number | null | undefined }>): Record<string, number> {
  const paid = tiers.map((t) => t.price_usd_month).filter((p): p is number => typeof p === "number" && Number.isFinite(p) && p > 0);
  const out: Record<string, number> = {};
  if (paid.length === 0) {
    for (const n of REVENUE_POINTS) out[String(n)] = 0;
    return out;
  }
  const average = paid.reduce((a, b) => a + b, 0) / paid.length;
  for (const n of REVENUE_POINTS) out[String(n)] = Math.round(average * n);
  return out;
}
