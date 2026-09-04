# Buttons

Source: `design-system/src/components/button.tsx`. Specimen: `/design#buttons`.

## Variants

| Variant | Look | When |
| --- | --- | --- |
| `primary` | Graphite fill, off-white text, 1px inner highlight | The one main action of a screen that is not a gate: New launch, Analyze my app, Re-rank venues, Copy launch plan |
| `secondary` | Raised white, strong border, card shadow | Everything that runs or copies without deciding: Regenerate, Re-extract, Copy, Run history, Retry, Cancel in a dialog |
| `ghost` | No fill, hover wash | Tertiary: Edit, View, Collapse, Dismiss, Mark replied, icon buttons |
| `flare` | Flare fill, white text | **The gate verb only.** Approve on a gate or on the first pending asset |
| `destructive` | Failure fill | Confirming a removal inside a dialog: Dismiss signal |
| `link` | Ink text, underline on hover | Inline, inside a sentence |

One `primary` per view at most, and never a `primary` and a `flare` in the same action
row. If a screen has a gate, the gate's flare button is the screen's main action.

## Sizes

| Size | Height | Text | Where |
| --- | --- | --- | --- |
| `sm` | 32px | 14px | Inside cards, table rows, sheets |
| `md` | 36px | 14px | Default |
| `lg` | 44px | 16px | Landing CTAs, the form submit, the composer send |
| `icon` | 36px square | | Icon-only with `aria-label` |
| `icon-sm` | 32px square | | Icon-only inside rows |

Icons inside a button are sized by the button (`size-4` at md, `size-3.5` at sm); pass
no `size` prop.

## States

- **Hover:** fill or wash darkens by one step, 120ms.
- **Active:** `translate-y-px`, a physical push.
- **Focus:** 2px flare outline, 2px offset (from the base layer).
- **Disabled:** 50% opacity, no pointer events. Disabled approve buttons carry a `title`
  saying why ("Save your edits first").
- **Loading:** `loading` swaps the label for a spinner plus `loadingLabel` while both
  labels share one grid cell, so the width never changes. Loading labels are the
  progressive verb in sentence case with no ellipsis: "Starting analysis", "Approving",
  "Ranking venues", "Searching".

## Labels

Sentence case, verb first, at most three words for a primary ("Start your launch",
"Analyze my app", "Copy launch plan"). The verb on the button is the verb in the toast
("Approve" produces "Approved"). Never "Submit", never "OK", never an exclamation mark,
never a dash.

## Links that look like buttons

`LinkButton` renders a `next/link` with the same classes. Never nest a `<button>` inside
an `<a>`. Landing CTAs, "Start your first launch" in empty states, "Review the profile" on
a locked gate, and every sidebar action are `LinkButton`s.

## Composition

Action rows are `flex flex-wrap items-center gap-2`, most important first, with tertiary
actions pushed right by `className="ml-auto"`. Inside a card they live in `CardFooter`.
