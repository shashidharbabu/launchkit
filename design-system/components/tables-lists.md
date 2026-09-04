# Tables and lists

Source: `design-system/src/components/table.tsx`. Specimen: `/design#tables`.

## Table

A framed sheet (`TableFrame`: 12px radius, hairline, card shadow, horizontal scroll) with
horizontal rules only. No vertical lines, no zebra striping.

| Part | Spec |
| --- | --- |
| `Th` | 44px, sentence case, `text-label` 500 muted, left-aligned, `numeric` right-aligns |
| `Tr` | 48px, bottom hairline (none on the last), hover wash at 50%, `selected` adds a 3px flare bar on the left and a faint flare tint |
| `Td` | `px-4 py-3`, first and last cells pad 20px to meet the frame; `numeric` is right-aligned mono 13px muted with tabular figures |
| `TableCaption` | 14px muted, below the frame: what the count counts ("2 of 12 venues. Venues are shown as selected of ranked.") |

Rules:

- The first column is the object's name in `font-medium`, linked when it opens something.
- Status columns hold a `StatusStamp`; never bare words in status colors.
- Empty cells are empty. No dashes as placeholders.
- Sorting: the header is a button with a 12px chevron (opacity 30% when unsorted),
  `aria-sort` set.
- Expandable rows: a ghost `icon-sm` button with a chevron in the last column; the
  detail row is a `bg-sunken/40` cell with a grid of `SectionLabel` + text.
- Pagination lives inside the frame: a top hairline, `px-5 py-2.5`, the range in 14px
  muted, ghost `sm` Previous and Next.
- Row selection uses `Checkbox` with an `aria-label` naming the row.
- Inside a card, a table can bleed to the card edges with `-mx-5` so it aligns with the
  frame.

## Lists

Lists of like things with more than five items are tables. Lists of prose items (key
messages, do and don't, includes) are `ul` with `list-disc pl-5` in `text-body` or
`text-read`. Lists of objects with actions (signals, assets, campaigns) are stacks of
cards with `gap-5`. Never a `<ul>` with `divide-y` for more than five rows.

## The rail's lists

Sidebar rows are 36px (`h-9`) for destinations and 32px (`h-8`) for launches, 8px radius,
`text-small` 500; the active row is raised white with a card shadow. Stage rows are 40px
with a 32px node on the gantry track. See `navigation.md`.

## Recent launches (Home)

A card whose rows are links: name in 16px medium over the host in mono, a stamp, an
arrow. Three at most; "All launches" beside the heading.
