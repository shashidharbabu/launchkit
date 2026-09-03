# RocketRide Pricing Analysis

## Subscription Plans

### Monthly Plans (no welcome bonus)

| Plan | Price | Tokens/mo | Rate/token | Seats | Features |
|------|-------|-----------|------------|-------|----------|
| Free | $0 | 0 | -- | -- | Self-hosted OSS, community support |
| Starter | $50/mo | 2,500 | $0.020 | 1 | Pipelines |
| Pro | $250/mo | 15,000 | $0.017 | 1 | Pipelines, priority support |
| Team | $750/mo | 30,000 | $0.025 | 5 | Pipelines, priority support |
| Enterprise | Custom | Custom | Negotiated | Custom | SLA, dedicated infra, custom integrations |

### Annual Plans (11x monthly = 1 month free, plus welcome bonus)

| Plan | Price | Effective/mo | Month 1 (initial) | Months 2-12 (recurring) | Year Total | Rate/token |
|------|-------|-------------|-------------------|------------------------|-----------|------------|
| Starter | $550/yr | $45.83 | 5,000 | 2,500 x 11 = 27,500 | 32,500 | $0.017 |
| Pro | $2,750/yr | $229.17 | 30,000 | 15,000 x 11 = 165,000 | 195,000 | $0.014 |
| Team | $8,250/yr | $687.50 | 60,000 | 30,000 x 11 = 330,000 | 390,000 | $0.021 |

### Annual vs Monthly Savings

| Plan | 12x Monthly | Annual | Cash Savings | Bonus Tokens | Total Savings |
|------|------------|--------|-------------|-------------|---------------|
| Starter | $600 | $550 | $50 (8%) | +2,500 | $50 + 2,500 tokens |
| Pro | $3,000 | $2,750 | $250 (8%) | +15,000 | $250 + 15,000 tokens |
| Team | $9,000 | $8,250 | $750 (8%) | +30,000 | $750 + 30,000 tokens |

Annual subscribers effectively get **12 months of tokens for the price of 11 months** (1 month free from pricing + 1 extra month of tokens from welcome bonus).

---

## Token Top-Up Packs (one-time purchases)

| Pack | Price | Tokens | Rate/token |
|------|-------|--------|------------|
| Small | $100 | 3,700 | $0.027 |
| Medium | $250 | 10,000 | $0.025 |
| Large | $500 | 21,750 | $0.023 |

### Overage Rate

$0.03/token for usage beyond included tokens (applies to all subscription tiers).

---

## Rate Comparison (sorted cheapest to most expensive)

| Source | Rate/token | Notes |
|--------|-----------|-------|
| Pro Yearly | $0.014 | Best value — annual commitment + volume |
| Starter Yearly | $0.017 | Annual commitment discount |
| Pro Monthly | $0.017 | Volume discount (15k tokens) |
| Starter Monthly | $0.020 | Base rate |
| Team Yearly | $0.021 | Per-seat: $0.004/token (5 seats) |
| Top-Up Large | $0.023 | No commitment, bulk discount |
| Top-Up Medium | $0.025 | No commitment, mid-tier |
| Team Monthly | $0.025 | Per-seat: $0.005/token (5 seats) |
| Top-Up Small | $0.027 | No commitment, convenience |
| Overage | $0.030 | Penalty rate — incentivizes upgrading or buying top-ups |

---

## Pricing Incentive Structure

The rate ladder creates clear upgrade incentives:

1. **Running out on Starter?** Buy a top-up ($0.023-0.027) instead of paying overage ($0.03)
2. **Buying lots of top-ups?** Upgrade to Pro ($0.017) -- it's way cheaper
3. **Need multiple users?** Team at $750 for 5 seats ($150/seat) beats 5x Starter at $250/seat
4. **Committed for a year?** Annual plans save 8% on cost plus get bonus tokens

### Team Tier Note

Team's per-token rate ($0.025) is higher than Pro ($0.017) in isolation. However, Team's value proposition is multi-user access: 5 seats at $150/seat/month vs Pro at $250/seat. A team of 3+ users saves money on Team vs individual Pro subscriptions, even before accounting for the shared token pool.

### Welcome Bonus Strategy

- **Monthly plans**: No welcome bonus. Rate is consistent month-over-month. Prevents subscribe-burn-cancel gaming.
- **Annual plans**: 2x first-month grant (initial = 2x recurring). Rewards upfront commitment. Low risk since annual payment is non-refundable.

### Top-Up Pack Positioning

Top-ups are priced between subscription rates and overage:

```
Subscription ($0.014-0.025) < Top-ups ($0.023-0.027) < Overage ($0.030)
```

This ensures top-ups are always cheaper than overage (users prefer buying packs over getting auto-charged), but more expensive than being on the right subscription tier (incentivizes upgrading rather than relying on top-ups).
