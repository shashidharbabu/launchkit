---
name: jitter
description: Select export formats from Jitter (jitter.video) — the browser-based motion design tool ("Figma for motion") — and integrate its MP4/GIF/Lottie exports into Next.js 14 + Tailwind 3.4 + motion v13 (`motion/react`). Use this whenever a task involves Jitter in any form, a motion-designed asset needs to be produced by a designer and played on a page, a Lottie file (.json or .lottie) needs to be rendered in React, someone asks "how do I play this animation export", an animated logo/loader/product-demo clip needs embedding, a Figma design needs to become an animation, or when deciding between a Lottie export and a hand-coded CSS/framer-motion animation. Also use it to pick the right Lottie player package — the verified comparison (lottie-react vs @lottiefiles/dotlottie-react) and the reduced-motion/lazy-loading patterns live in references/integration.md.
---

# Jitter

Jitter (jitter.video) is a **browser-based motion design tool** — "Figma for
motion". Paid SaaS with a free tier. There is no public API, no npm package, no
CLI. A human animates in the browser (often starting from a Figma import or one
of 300+ templates) and downloads a rendered export. Claude Code cannot operate
the tool.

So this skill owns the two steps around the human:

1. **Selection** — which export format for which need, what plan tier that
   format requires, and what to tell the designer before they hit Export.
2. **Integration** — playing the export in our stack. For Lottie this is real
   engineering: player choice, bundle cost, lazy loading, reduced motion, dark
   mode. All code is in `references/integration.md`.

## What Jitter exports, and what it costs (verified Aug 2026)

| Format | Plan | Notes |
|---|---|---|
| MP4 video, GIF, Lottie (.json) | **Free** | 720p / 30fps max, **watermarked** |
| No watermark, 1080p / 60fps, ProRes, WebM | Pro (per-editor/mo) | The realistic floor for commercial work |
| 4K / 120fps, transparent export, frame-by-frame, batch export | Max | Transparent WebM/ProRes = overlay video |
| Figma import, templates, animated components | Free | |

Pricing page: `https://jitter.video/pricing/`. Blunt version: **the free tier
watermarks every export and caps at 720p — never ship a free-tier export on a
commercial launch page.** Budget one Pro seat for the designer.

## Format selection

| Need | Export | Why |
|---|---|---|
| UI motion, animated icon/logo, loader, empty state | **Lottie** | Vector, crisp at any DPI, ~5–50KB, scriptable, pausable |
| Product demo, screen recording composite, anything raster | **MP4** (H.264) | Lottie can't represent raster/video content well |
| Motion over page background, confetti overlay | Transparent **WebM** (+ HEVC/ProRes fallback for Safari) | Needs Max plan |
| Email or README embed | GIF | Only habitat where GIF wins; on web pages use MP4/Lottie instead |
| Sprite-sheet / canvas pipeline | Frame-by-frame PNG | Max plan; niche |

Lottie caveat: Jitter's exporter (rewritten 2024) covers text and masks fully,
but **unsupported properties are silently dropped** — always preview the
exported .json in a player before wiring it in, and diff against the in-app
preview. Help doc: `https://help.jitter.video/en/articles/6603809`.

## Playing Lottie in React — verified packages

Both verified on npm (Aug 2026); full comparison and code in
`references/integration.md`.

| Package | Version | Runtime cost | Use when |
|---|---|---|---|
| `lottie-react` | 2.4.1 (MIT) | lottie-web renderer: ~77KB gz full, ~47KB gz light (SVG-only) | Default for Jitter `.json` exports |
| `@lottiefiles/dotlottie-react` | 0.19.14 (MIT) | ~30KB gz JS + WASM renderer fetched at runtime | `.lottie` files, many animations per page, canvas rendering |

Avoid `@lottiefiles/react-lottie-player` (3MB unpacked, superseded by
dotlottie-react). Never load a Lottie player in a Server Component — it is
client-only; use `next/dynamic` with `ssr: false`.

## When NOT to use Jitter / a Lottie export

- **The animation is simple enough for CSS or framer-motion.** Fades, slides,
  staggers, spring hovers, marquees: motion v13 (`motion/react`) is already in our bundle
  and costs 0 extra KB. A Lottie export earns its player only for designer-
  authored, multi-layer, hand-eased composition you would not want to rebuild
  in code. Pre-built React animation components → **motion-primitives** or
  **componentry** skills instead.
- **The motion must respond to app state or data.** Exports are fixed
  timelines. Interactive/reactive motion belongs in framer-motion.
- **You need it now and no designer is in the loop.** This skill cannot
  produce the asset. Say what file you expect (e.g.
  `public/lottie/hero-logo.json`) and wait — never scaffold imports for an
  asset that doesn't exist yet.
- **Generated backgrounds** → haikei skill. **3D scenes** → spline skill.

## Non-negotiables on integration

Details and code in `references/integration.md`.

- **`prefers-reduced-motion` must stop autoplaying Lottie/video** — render the
  poster frame instead. framer-motion's `useReducedMotion` or a CSS media
  query; not optional for a commercial page.
- **Decorative animations get `aria-hidden="true"` and
  `pointer-events-none`.** Meaningful ones get a text alternative.
- **Lazy-load below-the-fold players** (dynamic import + `IntersectionObserver`
  or `whileInView`); never let a Lottie player into the first-load JS of the
  landing route unless the animation is the hero.
- **Background video**: `autoPlay muted loop playsInline preload="none"` +
  `poster`, or iOS will refuse autoplay and Lighthouse will flag it.
- **Colors are baked into the export.** Dark mode = second export or scripted
  layer-color swap — decide before the designer leaves the file.
- **Check the .json size.** Over ~200KB usually means embedded raster images
  inside the Lottie — ask for a re-export or switch to MP4.
