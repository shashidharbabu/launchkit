# Generators

All 15 generators, from haikei.app/generators. Each is directly addressable:
`https://app.haikei.app?generator=<slug>`

Parameters listed are the controls the app exposes; exact ranges vary and the
UI is the source of truth. The dice button re-rolls the composition within the
current parameters — that's the intended workflow, not a fallback.

## Dividers and edges

**`wave`** — One or more harmonious waves anchored to the top, bottom, left, or
right of the canvas. The default choice for a soft section transition.
*Params:* position, complexity, contrast, colors.
*Use for:* hero bottom edge, section divider, footer top edge.
*Canvas:* match your section width; 1920×400 or so for a divider strip.

**`layered-waves`** — Multiple stacked waves with gradient coloring from one or
two input colors. More depth than `wave`; the most-used generator for hero
sections.
*Params:* layer count, complexity, contrast, position, 1–2 colors.
*Use for:* hero backgrounds, App Store listing headers, slide title cards.

**`layered-peaks`** — Same logic as layered waves but angular rather than
curved. Reads more technical and less soft.
*Use for:* developer-facing pages where waves feel too consumer.

**`layered-steps`** — Stylized stepped banding. Visually distinct from both
waves and peaks; graphic rather than organic.
*Use for:* section backgrounds behind text, pattern fields.

## Full-canvas backgrounds

**`stacked-waves`** — Waves filling the whole canvas with soft color
transitions, aligned horizontally or vertically.
*Use for:* full-bleed page or slide backgrounds, social cards.

**`stacked-peaks`** — Angular variant of stacked waves.

**`stacked-steps`** — Textured banding in shades of a single color. Adds texture
to what would otherwise be a flat fill.
*Use for:* giving a solid brand color some depth without introducing a second hue.

**`blob-scene`** — Organic shapes anchored in two opposing corners with a color
transition between them. Leaves the center clear, which makes it the best
full-canvas option when text sits in the middle.
*Use for:* login/auth screens, empty states, centered hero copy.

**`blurry-gradient`** — Modern soft gradient from two colors. The one to reach
for when you want the "aurora" look.
*Use for:* hero washes, card backgrounds, dark-mode ambient glow.
*Note:* check whether a CSS gradient suffices first — often it does.

**`low-poly-grid`** — Faceted triangle mesh, crumpled-paper effect. Adjustable
triangle resolution and distortion.
*Use for:* textured full-bleed backgrounds.
*Warning:* highest file size of any generator. Keep resolution low and always
run SVGO; see integration reference.

## Single shapes

**`blob`** — One organic shape, adjustable contrast and complexity. Descends
from Blobmaker.
*Use for:* shape behind an avatar or icon, decorative accent, clip-path mask
source, empty-state illustration base.
*Canvas:* square, e.g. 800×800.

## Patterns and scatter fields

All four scatter generators share the same idea: distribute N shapes with
adjustable size, count, and contrast. Constraining shapes to the canvas makes
them tileable as patterns; letting them bleed makes them one-off compositions.

**`circle-scatter`** — Scattered circles. Cleanest and lightest of the four.
**`blob-scatter`** — Scattered organic shapes.
**`polygon-scatter`** — Polygons with 3–9 edges. Hexagons read technical.
**`symbol-scatter`** — Scattered symbols from a built-in set.

*Use for:* subtle pattern fields, confetti/success states, texture behind
testimonials.
*Warning:* file size scales directly with shape count. Above ~150 shapes,
consider a CSS pattern or a tiled small export instead.

## Canvas sizes to specify

Haikei offers preset canvas sizes and a custom option. Tell the human which to
pick — an asset exported at the wrong aspect ratio will be cropped badly no
matter how the CSS is written.

| Surface | Canvas |
|---|---|
| Full-bleed hero | 1920×1080 |
| Section divider strip | 1920×400 |
| Blog cover / OG image | 1200×630 |
| Slide background (16:9) | 1920×1080 |
| Square social | 1080×1080 |
| Single blob / accent shape | 800×800 |

## Handing off — the message to give the human

Be specific enough that the browser trip is parameter entry, not exploration:

> Open https://app.haikei.app?generator=layered-waves
> — Colors: #2563EB and #1E1B4B
> — Canvas: 1920×1080
> — Layers: 4–5, position bottom
> — Roll the dice until the wave crest sits below the middle third (headline
>   needs that space)
> — Export as SVG, save to `public/backgrounds/hero-waves.svg`

The "roll until" instruction matters — it's the only way to make a random
generator produce a composition that fits a known layout constraint.
