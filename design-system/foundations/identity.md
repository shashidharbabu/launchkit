# Identity

## The mark

One geometric mark: an upward arrow held inside a rounded square. The square is the gantry;
the arrow is the thing it releases. It is simple enough to read at 16px in a browser tab
and quiet enough to sit beside a client's own logo.

```
viewBox 0 0 32 32
rect 32×32, rx 9, fill: foreground
path M16 7.5 23 17h-4.2v7.5h-5.6V17H9z, fill: background
```

Implementation: `design-system/src/components/brand-mark.tsx` exports `LaunchKitMark` (size, `inverted`)
and `LaunchKitLogo` (mark + wordmark). The mark is drawn in `currentColor` via the
`fill-foreground` / `fill-background` utilities, so it is graphite on light, off-white on
dark, and inverts on a dark surface with `inverted`.

The favicon is the same geometry at `app/icon.svg` in fixed graphite and off-white.

## The wordmark

"Launch Kit", two words, in Instrument Sans semibold at 17px with -0.02em tracking,
2.5 units (10px) to the right of a 24px mark. Never set in mono, never uppercase, never
with a tagline attached in the lockup.

## Lockups and sizes

| Context | Mark | Wordmark |
| --- | --- | --- |
| Rail header, landing nav | 22 to 24px | Yes |
| Mobile top bar | 20px | Yes |
| Chat assistant turn | 22px | No |
| Settings, footer | 24px | Yes |
| Favicon | 16 to 32px | No |
| Landing hero | none | The headline is the identity |

## Clearspace

Keep a margin equal to the mark's corner radius (roughly 28% of its size) clear on all
sides. In the rail this is provided by the 16px header padding.

## Usage rules

- The mark never appears in flare or any status color.
- The mark never rotates, never gains a gradient or shadow, never sits on a photograph
  without a solid tile behind it.
- The product name is "Launch Kit" in prose and "LaunchKit" only as the `alternateName`
  in structured data.
- No other organisation's mark appears in the product.

## Photography

Three photographs, all real, all cool-toned, all about the moment before liftoff:

- `hero-launch-pad.jpg`: a crew walking toward a rocket on the pad. The landing hero.
- `visor-launch.jpg`: a launch reflected in a visor. The landing principles bento.
- `pre-launch.jpg`: the pad at dusk. The new-launch form aside.

Photographs sit in 24px frames with a hairline border. No overlaid labels, no captions as
decoration, no filters other than the hero's slow drift.
