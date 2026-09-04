# Color

Source of truth: `tokens.css`. Values are OKLCH; the hex each was tuned from is in the
comments. Utilities are semantic (`bg-surface`, `text-muted-foreground`, `bg-flare`); no
component uses a raw palette class.

## Roles

### Canvas and surfaces (three depths)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#F6F6F8` fog | `#131417` | The canvas behind everything |
| `--surface` | `#FDFDFE` sheet | `#191B1F` | Cards, tables, the gate |
| `--surface-raised` | `#FFFFFF` | `#1F2126` | Composer, menus, popovers, dialogs |
| `--sunken` | `#EEEFF2` | `#1D1F24` | Wells: quoted drafts, code, notes |
| `--sidebar` | `#F1F2F5` | `#101114` | The rail |

The neutrals are cool graphite (hue 264 to 286, chroma 0.001 to 0.010). One temperature
across the whole product: never mix in a warm gray.

### Text

| Token | Light | Dark | Contrast on canvas |
| --- | --- | --- | --- |
| `--foreground` | `#1B1D22` | `#ECEDF0` | 15.6 : 1 |
| `--muted-foreground` | `#575C66` | `#A0A5B0` | 6.2 : 1 light, 7.5 : 1 dark |
| `--faint-foreground` | `#8B909B` | `#6E7380` | decorative only, never body text |

Secondary text is 6:1 or better on purpose. The previous system's 12px muted labels were
the single biggest legibility complaint; this system never sets body-level information
below 14px or below 4.5:1.

### Lines

`--border` (`#E2E3E8` / `#2A2D34`) for hairlines between rows and around cards.
`--border-strong` (`#CFD1D8` / `#3A3E47`) for inputs, hovered card edges, the gantry
track, and dividers on sunken surfaces.

### Actions

- `--primary` is **graphite**. Every primary button is ink, not a color. On dark it is
  near-white with graphite text.
- `--secondary` is a raised white with a strong border.
- `--accent` keeps its shadcn meaning: the quiet hover wash (`bg-accent` on list rows and
  menu items).

### Flare: the accent

`--flare` `#CF4420` (light, 4.7:1 with white) / `#F0663B` (dark, 6.0:1 with its dark
foreground). Three companions: `--flare-hover`, `--flare-soft` (a tint for backgrounds),
`--flare-text` (text that passes AA on the tint and on the canvas).

**The flare budget.** Flare appears only at these moments:

1. The gate verb: `<Button variant="flare">Approve`. One per screen, at most.
2. The running state: the spinner in the running indicator, the Running stamp.
3. Selection: the 3px bar on a selected table row, the checked checkbox, the switch.
4. Focus: `--ring` is flare.
5. The tracked-link ref chip, because the ref is the one thing a builder must take away
   from a plan row.
6. Gate markers on the gantry track and the "Gate n" label on the active stage.

Not allowed: flare headings, flare icons for decoration, flare links, flare borders on
cards, gradients of any kind.

### Links

Links are ink (`--link` = foreground) with an underline offset of 3px on hover, warming to
`--flare-text` on hover. There is no blue in the product.

### Status: the reserved trio

| Token | Solid | Soft (tint) | Text on soft |
| --- | --- | --- | --- |
| go | `#1E8A55` | `#E3F3EA` | `#146A40` 5.8:1 |
| hold | `#B4650A` | `#FBEFDC` | `#8C4E06` 5.8:1 |
| nogo | `#C9321F` | `#FBE6E2` | `#A52616` 6.1:1 |

Dark mode has its own validated set (lighter solids, deep tints, light text). Status colors
are used only by `StatusStamp`, `Badge`, `Banner`, the gantry nodes, and the gate glyph.
They are never chart series and never decoration. `--destructive` is `--nogo`.

Status is never color alone: every stamp carries its word.

### Charts

Six categorical series in fixed order (flare, cobalt, teal, violet, amber, slate) for the
rare multi-series chart. The product's one chart (attribution by venue) is single-series
and uses `--chart-1` (flare). See `components/data-viz.md`.

## Dark mode

Dark is not an inversion. Every token has a second value chosen for the same hierarchy: the
canvas is `#131417`, surfaces step up in lightness, the accent is lifted and slightly
desaturated, status tints go deep with light text. `color-scheme` is set on both roots so
native controls follow.

Strategy: CSS variables on `:root` and `.dark`, mapped to utilities with `@theme inline`,
so utilities compile to `var()` and the cascade does the flip. Components never write
`dark:` for a color. `next-themes` toggles the `.dark` class; the default is the system
preference and there is a toggle in the rail and a three-way control in Settings.

## Selection and scrim

`::selection` is `--flare-soft`. Dialog scrims are `--foreground` at 25% with a 2px blur.

## Contrast table (checked)

| Pair | Light | Dark |
| --- | --- | --- |
| foreground on background | 15.6 | 15.7 |
| muted-foreground on background | 6.2 | 7.5 |
| muted-foreground on sunken | 5.8 | 7.0 |
| primary-foreground on primary | 16.2 | 15.7 |
| flare-foreground on flare | 4.7 | 6.0 |
| flare-text on flare-soft | 4.9 | 6.2 |
| go-text on go-soft | 5.8 | 7.6 |
| hold-text on hold-soft | 5.8 | 7.8 |
| nogo-text on nogo-soft | 6.1 | 6.0 |

Any change to a color re-runs this table before it ships.
