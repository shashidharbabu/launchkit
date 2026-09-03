# Color

A cool paper-and-ink world with one hot color. Three color families, each
with a distinct job — if you can't say which family a color belongs to, it
doesn't go in.

## 1. Paper & ink (surfaces and text)

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `background` | paper `#F4F5F7` | `#101216` | Page ground |
| `card` | sheet `#FBFCFD` | `#14161C` | Slips, cards, panels — "a sheet laid on the desk" |
| `muted` | wash `#E9ECF0` | `#1B1F27` | Hover washes, inset wells (drafted replies) |
| `foreground` | ink `#16181D` | `#E8EAEE` | Text |
| `muted-foreground` | faint `#5B6472` | `#9AA3B2` | Secondary text, provenance (5.5:1 on paper) |
| `border` | rule `#D9DEE5` | `#2A2F3A` | Hairlines — the system's only divider |

Dark mode is the **night console**: blue-charcoal, never pure black, same
hue family as the ink. It is a re-inking of the same paperwork, not an
inversion — surfaces stay matte, shadows get deeper, chart colors get their
own validated steps (`dataviz.md`).

## 2. Ember (action) and cobalt (blueprint)

- **Ember** `--primary` (`#C7431D` light / `#E4592B` dark) — the launch
  exhaust. **Budget: one ember-filled action per view** — the stage's
  primary verb (Approve, Analyze my app, Export plan). Also: the active
  stage marker and tracked-ref highlights. If ember appears more than ~3
  times in a viewport, the view is over-budget.
- **Cobalt** `--link` / `--ring` (`#1C4FD8` light / `#6885F2` dark) —
  RocketRide's blueprint ink, inherited. Links, focus rings, and data
  references (`.pipe` names, venue URLs). Focus is cobalt *on purpose*: the
  engineer's attention is blueprint, the action is ember — keyboard focus
  never masquerades as a call-to-action.

## 3. Status (reserved — stamps only)

| Token | Light | Dark | Stamp |
| --- | --- | --- | --- |
| `go` | `#1A7F4E` | `#3FBF7F` | `GO` — approved gates, replied signals, live venues |
| `hold` | `#B45309` | `#E0A33E` | `HOLD` — pending review, queued jobs |
| `nogo` / `destructive` | `#B42318` | `#E0563F` | `NO-GO` — rejected, failed runs, destructive actions |
| `unverified` | faint | faint | `UNVERIFIED` — fetch failed; dashed border |
| (cobalt) | — | — | `RUNNING` — active pipeline jobs |

Rules: status colors are **never** chart series, never decoration, and
never appear without their word (`voice.md` owns the words). Ember is
orange (H≈36), no-go is crimson (H≈30) — close neighbors, which is exactly
why the label rule is absolute.

## Contrast (verified)

| Pair | Ratio | |
| --- | --- | --- |
| ink on paper | 14.9:1 | AAA |
| faint on paper | 5.5:1 | AA |
| ember fill + white text (light) | 5.0:1 | AA |
| ember fill + near-black text (dark) | 5.5:1 | AA |
| cobalt link on paper | 6.6:1 | AA |
| cobalt-d link on `#101216` | 5.2:1 | AA |
| go/hold/nogo fills + their foregrounds | ≥4.6:1 | AA |

Chart colors are validated separately (CVD + contrast) — commands and
results in `dataviz.md`. Any palette change re-runs both.

## Usage rules

- Components use semantic utilities only (`bg-card`, `text-muted-foreground`,
  `border-border`). Raw Tailwind palette classes (`bg-slate-*`,
  `text-orange-*`) are lint-level violations.
- Never `dark:` for colors — tokens flip at `.dark`. Reserve `dark:` for
  rare structural tweaks (e.g., hiding a paper texture).
- Tints derive from tokens with OKLCH relative syntax:
  `oklch(from var(--primary) l c h / 0.1)` for an ember wash — don't invent
  new hex values.
- Gray-on-gray below `muted-foreground` is forbidden — if text matters less
  than faint, cut the text.
