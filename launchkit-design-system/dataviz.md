# Data visualization

Launch Kit's data is small-multiples scale — attribution rollups, venue
scores, run history — not BI. Pick the form first, color by job, validate,
then render. Implementation: **Recharts 3** through the shadcn
`ChartContainer` pattern so charts consume `var(--chart-*)` tokens.

## Forms (pick by the data's job)

| Data | Form | Notes |
| --- | --- | --- |
| Attribution: venue → signups | **Horizontal bar**, sorted descending, value label per bar | The headline chart. ≤15 venues; beyond that it's a table. Always paired with the attribution table (the table is the source of truth; the chart is the glance) |
| Signups over time | Line, 2px, single series | No legend for one series — the title names it |
| Venue ranking scores | Thin inline bar (4px) + value, inside the Targets table | Not a standalone chart |
| Single KPI (total signups, verified signals) | **Stat tile**, not a chart | NumberFlow value in Display type, meta label above, delta in Data mono |
| Run history | Table with stamps | Not a chart. Status is stamps, never a pie |
| Pricing tiers vs competitors | Grouped bar, ≤3 groups | Same hue family per competitor |

Never: dual-axis charts (two measures → two charts or index to a common
base), pies for status, gauges, radar. If a chart needs a paragraph to
explain, use a table.

## Color by job

- **Categorical — the "flight line" theme.** Fixed order, assigned by
  entity, **never cycled, never repainted on filter**:
  1 ember → 2 cobalt → 3 moss → 4 plum → 5 cyan (`--chart-1..5`).
  A 6th series folds into "Other" (faint) or the chart becomes small
  multiples.
- **Sequential** (magnitude): cobalt ramp, light→dark, one hue.
- **Diverging** (vs-target, deltas): cobalt ↔ ember with a neutral gray
  midpoint — never a hue at the midpoint.
- **Status**: `go`/`hold`/`nogo` are reserved for state, always with icon +
  label, and are **never** recruited as series 6.
- **Text wears text tokens** — values, labels, legends in
  `foreground`/`muted-foreground`, never the series color. A colored mark
  beside the label carries identity.
- **Texture fallback**: 45° hatch fill available for CVD/print/forced-colors.

## Validated palettes (do not eyeball — re-run on any change)

Light, on sheet `#FBFCFD` — **all six checks pass** (worst adjacent CVD
ΔE 10.7 deutan; all ≥3:1 vs surface):

```
#C7431D  #1C4FD8  #557A1F  #8B3FB8  #0891B2
```

Dark, on night-card `#14161C` — **own steps, not a flip; all checks pass**
(lightness band 0.48–0.67; worst adjacent CVD ΔE 9.0 deutan):

```
#DB5124  #6885F2  #6FA02F  #B565D8  #0C82A3
```

Validator (dataviz skill, run from its base directory):

```bash
node scripts/validate_palette.js "#C7431D,#1C4FD8,#557A1F,#8B3FB8,#0891B2" --mode light
node scripts/validate_palette.js "#DB5124,#6885F2,#6FA02F,#B565D8,#0C82A3" --mode dark --surface "#14161C"
```

## Mark specs

- Bars: thin (≤24px), 4px rounded **data-end only** (baseline end square),
  2px surface gap between adjacent/stacked segments.
- Lines: 2px, no dots except hovered point (≥8px hit target); markers get a
  2px surface ring when overlapping.
- Grid: horizontal hairlines only, `border` token; axes recessive
  (`muted-foreground`); no axis lines heavier than 1px.
- Labels: selective direct labels (the top venue, the latest point) — never
  a number on every mark; the rest live in the tooltip and table.
- Legend: present for ≥2 series (≤4 also direct-labeled); none for a single
  series.
- Hover is default: per-bar tooltip on bars, crosshair+tooltip on lines;
  tooltip = floating layer (4px radius, `shadow-float`, Data mono values).

## Wiring (Recharts + tokens)

```tsx
const chartConfig = {
  signups: { label: "Signups", color: "var(--chart-1)" },
  visits:  { label: "Ref visits", color: "var(--chart-2)" },
} satisfies ChartConfig;
// <ChartContainer config={chartConfig}> — bars use fill="var(--color-signups)"
```

Dark mode needs no chart code: `--chart-*` flips at `.dark` with the
validated dark steps. Every chart ships a table view (the attribution table
already is one) and a CSV-ish copy action where it's the primary read.
Animate the stat-tile number (NumberFlow), not the chart marks — chart
`isAnimationActive={false}` in the workspace.
