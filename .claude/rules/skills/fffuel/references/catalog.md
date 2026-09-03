# fffuel catalog — every tool, mapped to use cases

Compiled from fffuel.co, Aug 2026. Every tool lives at
`https://fffuel.co/<slug>/`. All are free, browser-based, export SVG via
*save* / *copy SVG* unless noted. When handing a tool to the human, always
give: the URL, the brand hexes to paste, and which controls to touch.

## Textures & grain

| Tool | What it makes | Tell the human |
|---|---|---|
| [nnnoise](https://fffuel.co/nnnoise/) | SVG noise textures (feTurbulence + feSpecularLighting) | Set background + light-source colors to brand hexes; choose fractal noise (soft) vs turbulence (harsher); tune frequency (higher = finer grain) and opacity. Export small — it tiles. |
| [gggrain](https://fffuel.co/gggrain/) | Grainy gradient backgrounds (gradient + noise in one) | Pick 2–3 brand hues; adjust grain intensity last. The one-stop tool when the goal is "gradient with film grain". |
| [tttexture](https://fffuel.co/tttexture/) | Curated collection of grunge/vintage textures | A pick-and-download collection, not parametric — browse and choose. |

## Gradients & washes

| Tool | What it makes | Tell the human |
|---|---|---|
| [ffflux](https://fffuel.co/ffflux/) | Fluid, organic-feeling gradient backgrounds | 2–4 brand hues; regenerate until the flow reads right; canvas ratio to match target surface. |
| [uuunion](https://fffuel.co/uuunion/) | Mesh-like gradients (the "mesh gradient" look) | Brand hues; fewer control points = calmer wash. |
| [bbblurry](https://fffuel.co/bbblurry/) | Blurry background blob shapes | Alternative to haikei's blurry-gradient when you want individual placeable blurs rather than a full-canvas wash. |
| [hhholographic](https://fffuel.co/hhholographic/) | Holographic/iridescent backgrounds | Collection-style; pick one whose hue range brushes the brand palette. |
| [aaabstract](https://fffuel.co/aaabstract/) | Abstract backgrounds | Collection-style; browse. |
| [wwwatercolor](https://fffuel.co/wwwatercolor/) | Watercolor backgrounds | Collection-style; browse. |

## Patterns (tiling / repeating)

| Tool | What it makes | Tell the human |
|---|---|---|
| [ooorganize](https://fffuel.co/ooorganize/) | Grid patterns (dots, crosses, plus-signs, lattices) | Foreground on transparent; density and cell size; keep contrast low for backgrounds. |
| [mmmotif](https://fffuel.co/mmmotif/) | Isometric, 3D-feeling SVG patterns | Two or three tones of one brand hue reads best. |
| [rrrepeat](https://fffuel.co/rrrepeat/) | Repeating shape patterns | Choose the base shape + spacing. |
| [rrreplicate](https://fffuel.co/rrreplicate/) | Line pattern generator | Stroke color, spacing, angle. |
| [uuundulate](https://fffuel.co/uuundulate/) | Ripple fields — organic repeated shapes | Ring count, distortion. |
| [oooscillate](https://fffuel.co/oooscillate/) | Curvy line patterns (waveform feel) | Amplitude + line count; good for audio/signal-flavored surfaces. |
| [ccchaos](https://fffuel.co/ccchaos/) | Wild wavy chaotic shape patterns | High energy — use small or masked. |
| [ffflurry](https://fffuel.co/ffflurry/) | A deluge of linear shapes ("make it rain") | Directional energy; density down for backgrounds. |
| [ssspiral](https://fffuel.co/ssspiral/) | Spiral patterns | — |
| [cccoil](https://fffuel.co/cccoil/) | Spiral waves | — |
| [cccircular](https://fffuel.co/cccircular/) | Gradient circle patterns | — |
| [qqquad](https://fffuel.co/qqquad/) | Bauhaus-inspired generative art panels | Constrain to brand palette or it goes carnival fast. |
| [tttwinkle](https://fffuel.co/tttwinkle/) | Bursting line patterns (sparkle/starburst) | — |
| [bbburst](https://fffuel.co/bbburst/) | Confetti — explosions of shapes | Celebration/empty-state accents. |

## Shapes & one-off elements

| Tool | What it makes | Tell the human |
|---|---|---|
| [ssshape](https://fffuel.co/ssshape/) | Blob shapes (with gradient/pattern fills) | For a *single* styled blob. For blob scene backgrounds use **haikei** `blob-scene`. |
| [sssurf](https://fffuel.co/sssurf/) | Wave shapes | haikei's `wave`/`layered-waves` are usually the better divider tools; use sssurf for repeated-wave pattern looks. |
| [nnneon](https://fffuel.co/nnneon/) | Glowing neon shapes (SVG glow filters) | Glow color = accent hex; dark surfaces only — glow dies on white. |
| [pppointed](https://fffuel.co/pppointed/) | Arrows | Hand-drawn-flavored arrow accents for marketing pages. |
| [llline](https://fffuel.co/llline/) | Lines / strokes | Squiggle and stroke accents. |
| [cccloud](https://fffuel.co/cccloud/) | Cloud shapes | — |
| [ssstar](https://fffuel.co/ssstar/) | Star shapes | — |
| [lllove](https://fffuel.co/lllove/) | Heart shapes | — |
| [dddraw](https://fffuel.co/dddraw/) | Freehand SVG drawing | Human sketches, you get SVG. |
| [ccclaymoji](https://fffuel.co/ccclaymoji/) | Claymorphism-style emoji characters | Illustration spots only — not icons. |
| [dddepth](https://fffuel.co/dddepth/) | AI-generated 3D shape images | Collection-style; image-like assets, heavier than parametric SVG. |
| [iiisometric](https://fffuel.co/iiisometric/) | Isometric design builder | Compose isometric scenes. |

## Color tools (no asset output — decisions)

| Tool | Use |
|---|---|
| [cccolor](https://fffuel.co/cccolor/) | HEX/RGB/HSL color picker |
| [pppalette](https://fffuel.co/pppalette/) | Palette generator |
| [hhhue](https://fffuel.co/hhhue/) | Curated palettes |

Palette *decisions* for real projects belong to **ui-ux-pro-max** (192
validated palettes) or the project's design system; these are quick utilities,
not a palette authority.

## Utilities & references

| Tool | Use |
|---|---|
| [rrrasterize](https://fffuel.co/rrrasterize/) | SVG → optimized PNG/JPEG. Only for contexts that can't take SVG (some email clients, OG images). Never rasterize filter-based textures for the web — the SVG is smaller. |
| [eeencode](https://fffuel.co/eeencode/) | SVG → base64 data-URI for inline CSS `background-image`. Handy for tiny tiling textures; anything over ~2 KB belongs in a file, not the stylesheet. |
| [sssvg](https://fffuel.co/sssvg/) | SVG reference documentation |
| [SVG Spinners guide](https://fffuel.co/svg-spinner/) | Tutorial on hand-building SVG spinners — a reading reference, not a generator. For product loading states prefer the design system's spinner; see **motion-primitives** for animated components. |
| [CSS Selectors guide](https://fffuel.co/css-selectors/) | Visual CSS selectors reference |

## Export notes

- *save* downloads the `.svg`; *copy SVG* puts markup on the clipboard.
- Verified on nnnoise: the page itself documents CSS usage —
  `background-image` + default `background-repeat: repeat` tiles the texture,
  with no `background-size` needed.
- No tool was verified to emit JSX or framework code. For TSX inlining,
  convert attributes (camelCase, `className`) and namespace all `id`s
  (see SKILL.md gotchas).
- After export, run the shared pipeline in
  `.claude/skills/haikei/references/integration.md` (SVGO with
  `removeDimensions`, `preserveAspectRatio`, delivery method, dark mode,
  `aria-hidden`) — with `cleanupIds: false` for filter/gradient outputs that
  get inlined.
