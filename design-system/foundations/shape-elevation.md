# Shape and elevation

## Radius: one soft system

The previous system drew every box with square corners. It read as a printed form and, at
product density, as a hackathon build. This system has one soft scale, documented so it is
never mixed:

| Token | Utility | Value | Where |
| --- | --- | --- | --- |
| `--radius-control` | `rounded-control` | 8px | Buttons, inputs, selects, menu items, sidebar rows, wells, skeletons, tooltips |
| `--radius-card` | `rounded-card` | 12px | Cards, tables, banners, empty states, the gate, stat rows |
| `--radius-panel` | `rounded-panel` | 16px | Dialogs, sheets, menus, toasts, the chat bubble, the landing preview panel |
| `--radius-frame` | `rounded-frame` | 24px | Photograph frames on the landing page, the composer |
| full | `rounded-full` | pill | Badges, stamps, ref chips, starters, the send button, gantry nodes |

Small details use 5 to 7px (`rounded-[5px]` on the checkbox box and color swatches,
`rounded-[7px]` on the gate glyph) so they read as members of the same family at their
size.

Tailwind's default scale (`rounded-sm` to `rounded-3xl`) is remapped to the same values in
`tokens.css` so an accidental default still lands inside the system, but components use
the named utilities.

Rules:

- Nested radii step down: a well inside a card (12) is a control (8); a card inside a
  dialog (16) is a card (12).
- A bubble that touches an edge can drop one corner (`rounded-br-md` on the person's chat
  turn).
- No element is square. No element has a radius larger than 24px except pills.

## Elevation: three shadows

Shadows are tinted with the graphite foreground on light and pure black on dark, and they
are tight. Nothing floats far.

| Token | Utility | Where |
| --- | --- | --- |
| `--shadow-card` | `shadow-card` | Cards, tables, secondary buttons, active sidebar rows. A whisper: 1 to 3px. |
| `--shadow-raised` | `shadow-raised` | The composer, menus, tooltips, toasts, running indicator, photograph frames. 12px blur, negative spread. |
| `--shadow-overlay` | `shadow-overlay` | Dialogs, sheets, the focused composer. 32px blur. |

Rules:

- Elevation encodes layer, not importance. A card is not "more important" with a bigger
  shadow; it is a different layer.
- Never a shadow on text, never a glow, never a colored shadow other than the tint.
- The primary and flare buttons carry an inset 1px highlight
  (`inset 0 1px 0 0 oklch(1 0 0 / 0.1)`) so they feel pressed-from-above, and an
  `active:translate-y-px` push.
- Hover on a card strengthens the border (`border-border-strong`), it does not lift the
  shadow.

## Borders

Hairlines are `--border` at 1px. Inputs and hovered edges use `--border-strong`. Dashed
borders appear once: the empty state. Vertical rules appear once: between stat tiles in a
stat row. Tables never draw vertical lines.

## Scrim

Dialogs and sheets sit on a scrim of `--foreground` at 25% with a 2px backdrop blur. The
scrim is the only blur in the product.
