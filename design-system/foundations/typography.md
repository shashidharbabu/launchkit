# Typography

Two families, wired in `app/fonts.ts` with `next/font/google` and chained into the tokens
as `--font-sans` and `--font-mono`.

## Faces

**Instrument Sans** (variable, 400 to 700, true italic). Everything people read. Chosen for
legibility first: open apertures, a generous x-height, even color at small sizes, and
enough character in the wider letters to be recognisable without being loud. The italic is
the only permitted emphasis inside a headline; a second family is never mixed in.

**Geist Mono** (400, 500). Data only: refs, counts, timestamps, code, URLs, tracked links,
the gate glyph numeral. Never for labels, never for headings, never uppercase-tracked.

Fallbacks: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` and
`ui-monospace, "SFMono-Regular", Menlo, monospace`. `font-display: swap`.

## Roles

Each role is one utility that sets size, line height, tracking and (where fixed) weight,
defined in `tokens.css` under `@theme`. Use the role, not ad hoc sizes.

| Utility | Size / line | Tracking | Weight | Use |
| --- | --- | --- | --- | --- |
| `text-hero` | 56 / 1.04 | -0.032em | 600 | Landing headline only, at lg and up |
| `text-display-lg` | 40 / 1.1 | -0.028em | 600 | Home question, landing section titles |
| `text-display` | 30 / 36 | -0.022em | 600 | Page titles, stat values |
| `text-title` | 22 / 28 | -0.016em | 600 | Gate titles, dialog titles, tier prices |
| `text-heading` | 17 / 24 | -0.008em | 600 | Card titles, empty-state titles |
| `text-lead` | 18 / 28 | -0.006em | 400 | Stage intros, landing subtext |
| `text-read` | 17 / 28 | 0 | 400 | Drafts, quotes, profile claims, long-form |
| `text-body` | 16 / 24 | 0 | 400 | The UI default |
| `text-small` | 14 / 20 | 0 | 400 | Secondary UI, helpers, captions, table captions |
| `text-label` | 13 / 18 | 0 | 500 | Badges, section labels, sidebar section titles |
| `text-data` | 13 / 20 | 0 | 400 | Mono data (always with `font-mono`) |
| `text-meta` | 12 / 16 | 0.06em | 500 | Reserved. Not used in the current UI. |

## Legibility rules

- **The floor is 14px** for anything a person must read to use the product. 13px is for
  badges and section labels that sit beside larger text. 12px does not appear.
- **Secondary text is `--muted-foreground`** (6:1 or better). `--faint-foreground` is for
  decorative marks (the "Gate n" label on inactive rail rows) and never for sentences.
- **Reading surfaces get `text-read`** (17/28). Drafted posts, profile claims, quotes from
  threads, listing copy. A builder reads these carefully; give them room.
- **Headings are tight, body is not.** Negative tracking stops at `text-heading`.
- **Sentence case everywhere.** Titles, buttons, labels, table headers, stamps. No uppercase
  tracked labels; the previous system's `12px mono uppercase` labels were the main reason
  the UI read as small and hard.
- **Numbers are tabular** wherever they align: `.tabular` or `text-data` in table cells,
  stat values, elapsed times.
- **Emphasis in a headline** is the same family in italic or a heavier weight. When a
  headline uses italic and the word has a descender, keep line height at 1.1 or more.
- **Line length** for prose is capped by `max-w-reading` (46rem, about 72 characters at
  17px).

## Specimen

Open `/design#type` in the running app. Every role is rendered there with the sentence
"Launch the app you already built." so size and rhythm can be judged in context.

## What is banned

`Inter` as the text face, any serif, `font-mono` for labels or headings, `uppercase` with
`tracking-*`, sizes below 12px, `leading-none` on multi-line text, gradient text.
