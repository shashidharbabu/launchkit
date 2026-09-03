---
name: haikei
description: Generate and integrate SVG background assets using Haikei (haikei.app) — waves, blobs, blurry gradients, low-poly grids, peaks, steps, and scatter patterns for hero sections, section dividers, slide decks, blog covers, social cards, and empty states. Use this whenever a design needs a generated background, an organic shape, a section divider, a wave/blob/gradient visual, a blog or social cover image, or when a page or slide looks flat and needs a background asset. Also use it whenever a Haikei SVG has already been downloaded and needs to be optimized, made responsive, wired into React/Next.js, or adapted for dark mode — the integration gotchas are non-obvious and documented in references/integration.md.
---

# Haikei

Haikei (haikei.app) is a **browser-based design tool**, not a library. There is
no npm package, no API, no CLI, and the generator algorithms are closed source.
A human opens the app, tweaks parameters, rolls the dice until a composition
looks right, and downloads an SVG or PNG. Free, no signup.

That shapes what this skill does. It cannot generate the asset. It owns the two
things around that step:

1. **Selection** — which generator, what parameters, what canvas size, and a
   pre-configured URL to hand the human.
2. **Integration** — everything after the download. This is where the real
   engineering is, and where most people get it wrong.

## Workflow

When a task needs a generated background:

1. **Check whether Haikei is the right tool at all** (see "When not to use"
   below). A CSS gradient or a Tailwind class is often the correct answer and
   costs nothing.
2. **Pick the generator** from the table in `references/generators.md`, along
   with recommended parameters and canvas size for the target surface.
3. **Hand the human a direct URL.** Every generator is addressable:
   `https://app.haikei.app?generator=<slug>` — e.g.
   `https://app.haikei.app?generator=layered-waves`. State the brand hex codes
   to paste in and the canvas size to set, so the trip to the browser is a
   30-second parameter entry rather than an exploration.
4. **Stop and wait.** Don't scaffold code that imports an asset that doesn't
   exist yet. Say plainly what file you expect back and where to put it
   (e.g. `public/backgrounds/hero-waves.svg`).
5. **On receipt, integrate properly** — read `references/integration.md` and
   apply it. Never drop a raw Haikei export straight into a repo; every export
   needs at minimum optimization and a responsive fix.

## Generator quick reference

Full parameters and use-case mapping in `references/generators.md`.

| Need | Generator slug |
|---|---|
| Section divider, hero bottom edge | `wave`, `layered-waves` |
| Full-canvas soft background | `stacked-waves`, `stacked-steps` |
| Organic single shape (behind a card, avatar mask) | `blob` |
| Corner-anchored scene background | `blob-scene` |
| Modern soft gradient wash | `blurry-gradient` |
| Crumpled-paper / faceted texture | `low-poly-grid` |
| Angular divider (sharper than waves) | `layered-peaks`, `stacked-peaks` |
| Stepped / stylized banding | `layered-steps` |
| Pattern or confetti field | `circle-scatter`, `blob-scatter`, `polygon-scatter`, `symbol-scatter` |

## When not to use Haikei

Reach for something cheaper when:

- **A CSS gradient does the job.** `bg-gradient-to-br from-blue-600 to-indigo-900`
  is 0 bytes of asset, themeable, and animatable. Haikei's `blurry-gradient`
  earns its place only when you need the organic multi-blob wash that CSS can't
  express.
- **The shape must respond to data or state.** Haikei output is static. Anything
  that animates, morphs, or reflects live values should be authored in code.
- **You need many variants programmatically.** Each export is a manual browser
  trip. Ten covers means ten trips.
- **It's a dense work surface.** Dashboards, tables, and review queues do not
  need decorative backgrounds; they compete with the data.
- **Brand consistency matters more than novelty.** The dice button produces a
  *different* composition each roll. If the same visual must appear across many
  surfaces, export once and reuse the file — don't re-roll per page.

Good habitats: marketing pages, App Store listings, blog covers, social cards,
slide decks, login/auth screens, empty states, 404s.

## Non-negotiables on integration

These are the failures that show up every time. Details and code in
`references/integration.md`.

- **Haikei exports a fixed `width`/`height` plus a `viewBox`.** Dropped into a
  responsive container it will letterbox or crop wrongly. Strip the fixed
  dimensions and set `preserveAspectRatio` deliberately — `none` to stretch
  full-bleed, `xMidYMid slice` to cover-crop.
- **Always run SVGO.** Raw exports carry editor metadata and over-precise path
  coordinates. `low-poly-grid` and the scatter generators in particular produce
  large files — hundreds of paths is normal, and unoptimized they can exceed
  100KB.
- **Colors are hardcoded fills and gradient stops**, not `currentColor`. Dark
  mode needs either a second export or a scripted color swap — decide which
  before shipping.
- **Decorative backgrounds need `aria-hidden="true"`** and
  `pointer-events-none`. They are decoration, not content.
- **Choose the delivery method deliberately** — CSS `background-image`, `<img>`,
  or inlined component. They differ in caching, themeability, and bundle cost;
  the tradeoff table is in the integration reference.
- **Never claim a Haikei asset exists until the human confirms the download.**
  This skill cannot create the file.
