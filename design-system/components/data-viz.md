# Data visualisation

Source: `design-system/src/components/stat-tile.tsx`, `design-system/src/components/chart.tsx`,
`design-system/src/components/progress.tsx`, `design-system/src/components/ref-chip.tsx`. Specimen: `/design#tables`.

Launch Kit has little data to draw and one rule for it: a number always says what it
counts and where it came from.

## Stat tile

One KPI is a number with a name and an attribution line, never a chart. `StatTile`:
label in `text-small` 500 muted, the value in `text-display` with tabular figures
(rolled in by NumberFlow, which respects reduced motion), the attribution in `text-small`
muted ("2 with an approved profile", "across 3 venues", "none through tracked links
yet"). Tiles live in a `StatRow` card with hairline dividers.

## Progress

A 4px track in `--border` with a flare fill, always beside a number ("72% confident").
Used for profile confidence. Not used as a comparison visual in tables; impact levels
there are badges with words.

## The chart

The only chart is attribution by venue on the Plan stage: a horizontal bar chart
(Recharts) with one series in `--chart-1` (flare), venue names in mono on the axis,
values labelled at the bar end, no grid lines, no legend, `barSize` 16, 4px radius on
the leading corners, no entry animation. It renders only when there is at least one
signup and at most 15 venues; the table under it is the source of truth.

`ChartContainer` injects each series color as `--color-<key>` so marks use
`fill="var(--color-signups)"` and the dark flip needs no chart code. The tooltip is a
raised surface with an 8px radius, mono values, and a 2px-radius swatch.

## Categorical palette

Six series in fixed order for any future multi-series chart: flare, cobalt, teal, violet,
amber, slate (`--chart-1` to `--chart-6`), each with a dark-mode value. Status colors
are never chart series. Any change re-runs a contrast and color-vision check against both
canvases before it ships.

## Ref chip

The tracked link as a copyable pill: mono code on a flare tint. It is the one flare
element allowed in a table row because the ref is what the person must carry away from a
plan. Click copies the full URL and confirms with a check and a toast.

## Rules

- Tabular figures everywhere numbers align.
- No pie charts, no gauges, no sparklines without axes, no filled progress tracks as
  decoration.
- Empty data is a sentence, not an empty chart: "No signups attributed yet. Post with
  your tracked links and signups will appear here with their venue."
