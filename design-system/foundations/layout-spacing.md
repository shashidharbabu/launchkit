# Layout and spacing

## The app grid

```
┌──────────────┬──────────────────────────────────────────────┐
│  rail 264px  │  content column (fluid)                      │
│  sticky,     │  ┌───────── max-w-content 1088px ──────────┐ │
│  full height │  │ PageContainer: px 40 / py 40 at lg      │ │
│              │  │  PageHeader                              │ │
│              │  │  gap 32                                  │ │
│              │  │  blocks (gap 20 to 32)                   │ │
│              │  └──────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────┘
```

- **Rail:** `w-sidebar` = 16.5rem (264px), `bg-sidebar`, right hairline, sticky, `h-dvh`.
  Below `lg` (1024px) it becomes a left sheet behind a 56px top bar (`h-topbar`).
- **Content:** `PageContainer` centers a column at `max-w-content` (68rem), padded
  `px-5 py-8` on small screens, `px-8` from `sm`, `px-10 py-10` from `lg`.
- **Reading pages** (the chat, stage intros, FAQ) use `max-w-reading` (46rem).
- **Forms and settings** use `max-w-narrow` (34rem).
- **Landing** uses `max-w-landing` (76rem).

The widths are tokens (`--container-*`) so `max-w-content`, `max-w-reading`,
`max-w-narrow`, `max-w-landing` are utilities.

## Vertical rhythm

Tailwind's 4px scale. The rhythm inside a page is deliberate and repeated:

| Gap | Where |
| --- | --- |
| 4 to 8px | Inside a control: icon to label, label to helper |
| 12px | Between rows in a list, between badges |
| 20px | Between cards in a grid, between blocks inside a stage (`gap-5`) |
| 24px | Between a page header and its first block (`gap-6`) on workspace pages |
| 32px | Between major sections of a list page (`gap-8`) |
| 48px | Between sections on the settings and design pages (`gap-12`) |
| 80 to 112px | Between landing page sections (`py-20 lg:py-28`) |

Cards pad 20px (`px-5 py-5`); the footer row pads 20 by 14. Dialogs pad 24px. The composer
pads 20 left, 12 right, 16 top.

## Horizontal rhythm

- Two-column stages: `grid items-start gap-5 lg:grid-cols-2`.
- Telemetry: `lg:grid-cols-3` with the wide card spanning two.
- Form pages: `lg:grid-cols-[minmax(0,1fr)_20rem]` (form, then a photograph aside).
- Landing hero: `lg:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]`.
- Landing timeline: `lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]` with a sticky left column.

Grid over flex math: no `w-[calc(33%-1rem)]`.

## Breakpoints

Tailwind defaults: `sm` 640, `md` 768, `lg` 1024, `xl` 1280. The rail appears at `lg`.
Every multi-column layout collapses to one column below `lg` (stages) or `sm` (stat rows),
declared in the same component. Tables scroll inside `TableFrame`; the page never scrolls
sideways.

## Height

Full-height surfaces use `min-h-dvh` or `h-dvh`, never `h-screen`. The chat home is the
one surface that manages its own scroll: `h-[calc(100dvh-var(--spacing-topbar))] lg:h-dvh`
with the thread in a `min-h-0 flex-1 overflow-y-auto` region and the composer docked
below it.

## Z-index

Five values, all tokens, never ad hoc numbers:

| Token | Value | Layer |
| --- | --- | --- |
| `--z-sticky` | 20 | Sticky landing nav, mobile top bar |
| `--z-sidebar` | 30 | Reserved for a future fixed rail |
| `--z-overlay` | 40 | Dialog and sheet scrims |
| `--z-dialog` | 50 | Dialogs, sheets, menus, tooltips, the palette |
| `--z-toast` | 60 | Toasts |

Use them as `z-(--z-dialog)`.
