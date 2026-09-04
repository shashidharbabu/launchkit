# Cards and surfaces

Source: `design-system/src/components/card.tsx`. Specimen: `/design#surfaces`.

## Card

A sheet on the canvas: `bg-surface`, hairline border, 12px radius, `shadow-card`.
Header and body share one padding and flow together; only the footer draws a rule, and
only when there are actions. This is the single biggest change from the previous "box"
look, which ruled every region.

```
┌──────────────────────────────────────────────┐
│ Title (text-heading)          [stamp] [btn]  │  CardHeader: px-5 pt-5
│ Description (text-small muted)               │
│                                              │
│ body                                         │  CardBody: px-5 py-5
│                                              │
├──────────────────────────────────────────────┤
│ [Approve] [Copy]              [Regenerate]   │  CardFooter: border-t, px-5 py-3.5
└──────────────────────────────────────────────┘
```

- `CardHeader` props: `title`, `description`, `actions` (a flex row on the right),
  `children`.
- `interactive` strengthens the border on hover; used on link-like cards.
- Cards do not nest more than one level. A campaign inside the campaigns card is a
  `Card` inside a `CardBody`, and that inner card has no footer.

## When to use a card

Use a card when the content is a distinct object with its own status or actions: a gate,
an asset, a signal, the pricing draft, a settings group. Do not put a card around a
paragraph, a single button, or a list that already has rows. Sequences of like items
(launches, runs, venues) are tables, not stacks of cards.

## Well

A sunken area inside a card: `bg-sunken`, 8px radius, `px-4 py-3`. For content the model
drafted (a post body, a sample copy block, a drafted reply), for notes the person is
writing (regenerate-with-feedback), and for quoted text. The sink says "this is material,
not chrome".

## CodeWell

A `Well` for raw output: `<pre>` in `font-mono text-data`, wrapped, capped at 24rem with
scroll. Used by `RawData` and for run errors.

## StatRow

One card containing two to four `StatTile`s divided by hairlines (vertical from `sm`,
horizontal below). Three numbers read as one instrument, not three boxes.

## Sunken bands

Outside the app, the landing page uses one `bg-sunken/50` band with top and bottom
hairlines for the component preview. It is the only band; sections otherwise sit on the
canvas.

## Dividers

Rows inside a card divide with `divide-y divide-border` on the parent. Never `border-t`
on every child. Never a rule between a header and a body.
