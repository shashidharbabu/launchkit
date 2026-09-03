---
name: fffuel
description: Route design needs to the right generator on fffuel (fffuel.co) — a large collection of free browser-based SVG generator and color tools (nnnoise, gggrain, ffflux, uuunion, sssurf, ooorganize, mmmotif, nnneon, hhholographic, bbblurry, ssshape, and ~30 more) — each mapped to its use case with a direct URL and what to tell the human to configure, plus the fffuel-specific integration gotchas (SVG filter outputs, ID collisions, tiling textures). Use this whenever a design needs noise or grain texture, a grainy/fluid/mesh gradient, holographic or iridescent backgrounds, neon glow shapes, isometric or grid patterns, repeating line/ripple/spiral/confetti patterns, arrows, blobs, or any generated SVG asset beyond what haikei covers; whenever someone says a surface needs "texture", "grain", "glow", or "a pattern"; whenever a fffuel.co URL or a downloaded fffuel SVG appears and needs optimizing, tiling, theming, or wiring into React/Next.js; and whenever choosing between fffuel and haikei for a generated background.
---

# fffuel

fffuel (fffuel.co) is a **collection of ~40 free, browser-based SVG generator
and color tools** by a single designer — one page per tool, each a parametric
generator you tweak and export. There is no npm package, no API, no CLI, and
no accounts. Like haikei, it is human-in-the-loop: Claude Code picks the tool,
hands the human a URL and settings, waits for the exported SVG, then owns the
integration. Tools export via **save** (downloads `.svg`) and **copy SVG**
(markup to clipboard); companion utilities convert to PNG (`rrrasterize`) and
to base64 CSS (`eeencode`).

**License (verified from fffuel.co/license):** free for personal **and
commercial** projects, no attribution required. You cannot sublicense, resell,
share, or redistribute the images themselves. Provided as-is, no warranty.

## fffuel vs haikei — the boundary

The **haikei** skill owns layered waves, blob scenes, blurry gradients,
low-poly grids, peaks/steps, and scatter fields — and it owns the deep
integration reference. fffuel owns what haikei lacks:

| Need | Use |
|---|---|
| Layered waves, hero dividers, blob scenes, low-poly, scatter | **haikei** (see its `references/generators.md`) |
| Noise/grain texture, film grain over a surface | fffuel `nnnoise`, `gggrain` |
| Fluid / mesh / holographic / watercolor gradient washes | fffuel `ffflux`, `uuunion`, `hhholographic`, `wwwatercolor`, `aaabstract` |
| Glow, neon, iridescent shapes | fffuel `nnneon` |
| Isometric, grid, and repeating patterns | fffuel `mmmotif`, `ooorganize`, `rrrepeat`, `rrreplicate`, `iiisometric` |
| Ripples, spirals, chaos lines, confetti, sparkle bursts | fffuel `uuundulate`, `ssspiral`, `cccoil`, `ccchaos`, `oooscillate`, `bbburst`, `tttwinkle`, `ffflurry` |
| Single shapes: blobs, arrows, clouds, stars, hearts, lines | fffuel `ssshape`, `pppointed`, `cccloud`, `ssstar`, `lllove`, `llline` |
| Simple waves when the rest of the page is already fffuel-flavored | fffuel `sssurf` (otherwise prefer haikei's wave generators) |

Full catalog with direct URLs and per-tool configuration notes:
`references/catalog.md`.

## Workflow

1. **Check that a generated asset is warranted at all.** A CSS gradient or a
   Tailwind class is free; haikei's "When not to use" applies verbatim here:
   no decorative backgrounds on dense work surfaces, nothing that must respond
   to data, no manual browser trip per variant.
2. **Pick the tool** from `references/catalog.md`; every tool lives at
   `https://fffuel.co/<slug>/`.
3. **Hand the human the URL plus settings**: brand hex codes to paste, the
   two or three sliders that matter, and whether to hit *save* or *copy SVG*.
4. **Stop and wait.** Name the expected file and destination
   (e.g. `public/textures/noise.svg`). Never write imports for an asset that
   doesn't exist.
5. **Integrate via haikei's playbook.** SVGO, responsive
   `viewBox`/`preserveAspectRatio`, delivery-method tradeoffs, dark mode,
   `aria-hidden` + `pointer-events-none` are identical for fffuel exports —
   follow `.claude/skills/haikei/references/integration.md` and do not
   re-derive it. The fffuel-specific deltas are below.

## fffuel-specific integration gotchas

- **Filter-based outputs (`nnnoise`, `gggrain`) are `<filter>` + `<rect>`,
  not paths.** They stay tiny (~1 KB) at any visual size — do not rasterize
  them to PNG "for performance"; the SVG is the performant version. GPU cost,
  not bytes, is the budget: one full-viewport `feTurbulence` layer is fine,
  five stacked are not.
- **ID collisions.** fffuel exports reference internal ids
  (`filter`, gradient defs). Inline two exports on one page and the second's
  `url(#...)` references resolve to the first's defs — recolored or broken
  output with no console error. Namespace ids per asset when inlining, or
  deliver via `<img>`/CSS `background-image` where documents are isolated.
  Note SVGO's `cleanupIds` can shorten ids into *new* collisions across
  separately-optimized files — set `cleanupIds: false` for anything inlined.
- **Textures are designed to tile.** `nnnoise`/pattern outputs assume CSS
  `background-repeat: repeat` (the default) — size the SVG small and tile it;
  don't stretch one texture tile over a hero.
- **Dark-mode grain:** noise/grain over a near-black surface (this repo's
  `ink`/`panel`) should run at low opacity (3–8%) via a separate absolutely-
  positioned layer with `mix-blend-mode: overlay` or `soft-light`, so the
  texture rides the surface color instead of fighting it.
- **CSS/JSX export honesty:** tools export SVG markup, and several tool pages
  document CSS `background-image` usage (use `eeencode` for a data-URI);
  none were verified to emit JSX. Pasting *copy SVG* output into TSX requires
  the usual attribute fixes (`fill-opacity` → `fillOpacity`, `class` →
  `className`, strip `xmlns:xlink`).

## When not to use

Everything in haikei's "When not to use" list, plus: don't reach for fffuel's
one-shot image collections (`dddepth`, `tttexture`) when the design system
already has a texture language — consistency beats a new asset; and don't use
`ccclaymoji`/`dddraw` output as UI iconography (see **ui-ux-pro-max** on icon
discipline — real icon sets, not decorative one-offs). For choosing the
overall direction a texture serves, defer to **frontend-design** /
**taste-skill**; fffuel is an asset source, not a design direction.
