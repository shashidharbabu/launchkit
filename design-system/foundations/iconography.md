# Iconography

## The family

One icon family: **lucide-react**. It was already in the codebase, its stroke matches
Instrument Sans at UI sizes, and it covers every glyph the product needs. No second family,
no hand-drawn SVG paths, no emoji.

## Sizes and stroke

| Size | Stroke | Where |
| --- | --- | --- |
| 12px | 2 to 2.5 | Inside badges and stamps, chevrons in table headers, the gate glyph check |
| 14px | 1.75 | Inside small buttons, list rows, the running indicator |
| 16px | 1.75 | Default: buttons, sidebar rows, inputs (search), banners at 18 |
| 18 to 20px | 1.75 | Banner icons, empty-state tiles, the approved seal |

Buttons size their own icons (`[&_svg]:size-4` on `md`, `size-3.5` on `sm`), so pass no
`size` prop to an icon inside a `Button`.

## Color

Icons inherit `currentColor`. Inside muted text they are muted; inside a flare button they
are white. Decorative icons are never flare. Status icons live only inside stamps and
banners, where the word sits next to them.

## Meaning

| Glyph | Meaning, fixed |
| --- | --- |
| `MessageSquareText` | Home (the navigator) |
| `Rocket` | Launches |
| `Activity` | Runs |
| `Settings` | Settings |
| `Plus` | New launch |
| `Search` | Search and the command palette |
| `Check` | Approved, verified, done |
| `Clock` | Needs review, queued |
| `X` | Failed |
| `HelpCircle` | Unverified |
| `Loader2` (spinning) | Running |
| `Lock` | Locked stage |
| `ExternalLink` | Opens another site |
| `Copy` | Copy to clipboard |
| `Pencil` | Edit |
| `History` | Run history |
| `ChevronDown` / `ChevronRight` | Expand and collapse |
| `ArrowUp` | Send (the composer) |
| `ArrowRight` | Open (action cards, list rows) |
| `Sun` / `Moon` / `Monitor` | Theme |

Stage icons (`IdCard`, `Fingerprint`, `BadgeDollarSign`, `PenLine`, `Target`, `Radar`,
`Rocket`) are defined once in `lib/stages.ts` and used only in the command palette and
the landing timeline. The rail uses numbered nodes, not icons: the number carries the
information there.

## Platform marks

The marks for GitHub, Reddit, Hacker News, Product Hunt, X, and newsletters
(`design-system/src/components/platform-icons.tsx`) are the official Simple Icons paths, inlined,
rendered monochrome in `currentColor`. They appear beside asset titles. They are never
colored in brand colors.

## Accessibility

Decorative icons get `aria-hidden`. Icon-only buttons get `aria-label`. An icon never
carries meaning alone: the word is beside it or in the label.
