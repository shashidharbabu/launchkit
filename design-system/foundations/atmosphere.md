# Atmosphere: the ambient field

Source: `design-system/src/components/ambient-field.tsx`. Tokens: `--field-*` in `tokens.css`.
Specimen: `/design#atmosphere`.

## What it is

The pad before liftoff, drawn live. A WebGL fragment shader paints a sky, a horizon glow
in flare, and three luminous wave lines that swell slowly across the frame, each with a
translucent fill beneath it. The waves are the only thing that moves: a long swell, a
shorter counter-swell, and a slow organic ripple, the near wave a little faster than the
far one. The glow follows the pointer by about one percent of the frame. There is no grain
flicker and no dot grid; a static dither of one percent keeps the gradients from banding.
The field never repeats.

It is the one atmospheric device in the product, and it is the one detail only this
subject would have: a launch pad's horizon, at dawn in the light theme and at night in the
dark one, with the flare glow coming from below the horizon in both.

## Where it appears

| Surface | Variant | Intensity | Mask |
| --- | --- | --- | --- |
| Landing hero | hero | 1 | Fades into the canvas over the bottom 28% |
| Landing closing band | hero | 0.85 | Fades in from the top 30% |
| Home, empty state | soft | 0.55 | Radial, so the field dissolves before the rail and the recent launches |
| Design page specimen | hero | 1 | None; framed |

Never behind a work surface: not behind tables, forms, stages, dialogs, the thread, or the
rail. The field sets the mood at the front door; the work happens on the calm canvas. One
field per viewport.

## Tokens

Six colors per theme, in hex on purpose so the shader can read them at runtime:

| Token | Light (dawn) | Dark (night) | Role |
| --- | --- | --- | --- |
| `--field-sky-top` | `#F6F6F8` | `#15161B` | The top of the sky; equals the canvas so copy sits on a known ground |
| `--field-sky-horizon` | `#ECEAF1` | `#1F2029` | The sky near the horizon, a shade cooler |
| `--field-glow` | `#F2B59B` | `#F0663B` | The horizon glow and the rim light on each crest; flare, softened for dawn |
| `--field-ridge-far` | `#D7D9E0` | `#22242B` | The far ridge |
| `--field-ridge-mid` | `#B9BDC7` | `#191B20` | The middle ridge |
| `--field-ridge-near` | `#7C818C` | `#0F1013` | The near ridge, deepest |

The glow is the only flare on the landing hero, and it stays inside the field: no flare
text, no flare buttons on top of it.

## Composition rules

- **Text sits on the sky.** The horizon is at 46% of the frame's height; ridges live
  below it. Copy, buttons, and the composer stay in the upper half or on an opaque
  surface. On a phone the far ridge may reach the CTA row; that ridge is light enough
  (light) or dark enough (dark) for the buttons to keep AA contrast.
- **Masked, never cut.** The field dissolves into the canvas with a mask-image gradient.
  A hard edge between the field and the canvas is a bug.
- **A scrim under every word.** Copy over the field sits on a gradient in the canvas
  color, opaque where the text starts and clear by about 62% across. The field is
  atmosphere; the scrim is what makes the text legible, in both themes, at every window
  size, whatever the waves are doing underneath. Text over the field without a scrim is
  a bug, not a style.
- **The palette follows the theme, not a library.** The shader re-reads the `--field-*`
  tokens whenever `<html>` changes its `class`, `data-theme` or `style`, and whenever
  the OS preference changes. Binding the repaint to one theme library's hook let the
  page render light chrome over a night field once; watching the document cannot.
- **Left-aligned copy over an off-centre glow.** The glow sits at 66% of the width so the
  copy on the left reads on the quietest part of the sky.
- **Intensity is a token, not a style.** `intensity` scales the horizon glow and the
  brightness of the three wave lines together; it never changes the colors or the motion.

## Performance and accessibility

- WebGL 1, a single full-screen triangle, five-octave value noise. Renders at 0.6 of
  device resolution (device pixel ratio capped at 1.5), at most 30 frames per second,
  with a low-power context request.
- Pauses when the canvas leaves the viewport (IntersectionObserver) and when the tab is
  hidden. Resizes through a ResizeObserver, never a resize listener.
- Pointer position lives in a ref, never in React state (motion.md).
- `prefers-reduced-motion`: one still frame at time zero and no pointer drift; the
  composition reads the same.
- Without WebGL, or on context loss, the wrapper's CSS gradient (the same six tokens)
  shows instead. The wrapper always carries that gradient, so there is never a flash
  before the first frame.
- Theme changes re-read the tokens and repaint.
- `aria-hidden`, `pointer-events: none`. The field is never a control and never carries
  information.

## The decision, recorded

Three ways to get the atmosphere were weighed:

1. **A background video.** The fastest match to a reference. Rejected: megabytes per
   visit, one fixed look that cannot follow the theme, autoplay and battery constraints
   on phones, and someone else's footage.
2. **CSS gradient blobs with an SVG noise filter.** Light and easy. Rejected: it reads as
   the mesh-gradient cliché, and animating filters repaints the whole layer.
3. **A small shader painted from the tokens.** Chosen: it follows the theme exactly, costs
   about four kilobytes, can be told where to put the horizon, and degrades gracefully.
