---
name: componentry
description: Install and integrate Componentry (componentry.dev — componentry.fun redirects there) — an MIT-licensed, Vercel-OSS-backed library of ~60 animated React components by Harsh Jadhav (@harshjdhv), distributed as copy-in source via the shadcn registry (npx shadcn@latest add @componentry/<name>) and built on framer-motion, Tailwind, and canvas/WebGL — into Next.js 14 + Tailwind 3.4 + motion v13 (`motion/react`). Use this whenever a task involves componentry.dev/componentry.fun or an @componentry/ install command, a landing page needs a spectacle background (matrix rain, dither gradient, aurora, liquid chrome, particle galaxy, circuit board, noise), an interactive set-piece (magnetic dock, eye tracking, image trail, spotlight card, split-flap display, mac keyboard), kinetic typography (letter cascade, text repel, particle typography, hyper text, text morph), or a scroll set-piece (sticky scroll cards, scroll split card, scroll velocity text, scroll choreography) — and whenever choosing between componentry and motion-primitives for an animation need. Component tiers, per-component deps, and wiring patterns live in references/integration.md.
---

# Componentry

Componentry is a **free, MIT-licensed, open-source collection of animated
React components**, distributed shadcn-style: the CLI copies TypeScript source
into your repo — no npm package to depend on. By Harsh Jadhav (@harshjdhv),
backed by the Vercel OSS Program. Source: `github.com/harshjdhv/componentry`.

- **Canonical domain: `componentry.dev`** — `componentry.fun` 301-redirects
  there (the registry metadata still says .fun; same site).
- **Trap: the npm package named `componentry` is an unrelated design-system
  library.** Never `npm install componentry` — components arrive only via the
  shadcn registry or copy-paste from the docs.
- Components use **`framer-motion`** (verified in registry payloads) — our
  exact stack, no `motion`-package migration needed. Heavier pieces are
  canvas/WebGL and need care (see integration reference).

## Install

Requires a shadcn-initialized project (`components.json`, `cn()` in
`lib/utils`) — mechanics, and the **Tailwind v3.4 vs v4 CLI caveat**, are the
**shadcn** skill's territory; read it before the first install in this repo.

```bash
npx shadcn@latest add @componentry/magnetic-dock
```

Source lands in `components/ui/<name>.tsx`; npm deps declared per component
(e.g. `framer-motion`) are installed automatically. No CLI? Fetch the registry
JSON directly — `https://componentry.dev/r/<name>.json` — and copy
`files[].content` by hand. Docs per component:
`https://componentry.dev/docs/components/<name>`.

## What exists (full registry, verified Aug 2026)

| Category | Components |
|---|---|
| Backgrounds / spectacle | `matrix-rain`, `dither-gradient`, `dither-prism-hero`, `animated-gradient`, `aurora-flow`, `silk-aurora`, `prism-gradient`, `liquid-chrome`, `liquid-blob`, `webgl-liquid`, `particle-galaxy`, `circuit-board`, `noise-texture`, `ascii-effect`, `closing-plasma`, `pixel-canvas` |
| Kinetic typography | `kinetic-text-reveal`, `letter-cascade`, `text-repel`, `text-morph`, `flipping-word-swap`, `cursor-driven-particle-typography`, `hyper-text`, `text-animate`, `split-flap-display` |
| Scroll set-pieces | `scroll-based-velocity`, `sticky-scroll-cards`, `scroll-split-card`, `scroll-choreography`, `scroll-tilted-grid` |
| Interactive set-pieces | `magnetic-dock`, `magnet-lines`, `eye-tracking`, `image-trail`, `pixel-image-trail`, `image-ripple-effect`, `infinite-image-field`, `spotlight-card`, `hover-transition`, `mac-keyboard`, `music-player`, `signature`, `scrub-input`, `wheel-carousel`, `spiral-3d-slider`, `orbit-card-stack`, `layered-stack`, `collection-surfer`, `ripple-transition` |
| Buttons / UI | `shimmer-button`, `pulsating-button`, `interactive-hover-button`, `border-beam`, `command-menu`, `auth-modal`, `showcase-card`, `testimonial-marquee`, `github-calendar`, `newsletter-bookshelf`, `flight-status-card`, `dithered-logo`, `hero-geometric` |
| Blocks | `gradient-hero-01`, `pricing-01`, `pricing-02` |

## Componentry vs motion-primitives (both live in this repo — pick, don't mix blindly)

Same distribution model, different register. **motion-primitives** (33
components, `motion/react` imports) is the *restrained* layer: text reveals,
number tickers, morphing dialogs, marquees — UI polish. **Componentry**
(framer-motion imports) is the *spectacle* layer: full-bleed canvas
backgrounds, cursor physics, scroll set-pieces — landing-page theater.

- Animating numbers, dialogs, subtle reveals → motion-primitives skill.
- A hero that needs a matrix rain / aurora / magnetic dock → componentry.
- Overlap (text reveal, marquee): prefer whichever library the page already
  uses; do not import both for the same job. Note their import styles differ
  (`framer-motion` vs `motion/react`) — coexistence works but is two copies
  of the same engine if the project ever migrates; our stack pins
  motion v13 (`motion/react`), which favors componentry for new spectacle work.

## When NOT to use

- **Dense product surfaces** — dashboards, tables, review queues. Spectacle
  components compete with data. (rocketride-frontend skill owns app
  archetypes.)
- **A static treatment does the job** — generated SVG backgrounds → haikei
  skill; CSS gradients cost 0KB.
- **Restrained brand direction** — a matrix rain on a trust-first B2B page is
  a taste failure (taste-skill), not an engineering one.
- **Low-power / mobile-first audiences** for canvas/WebGL pieces — check the
  performance tiers in the reference before committing.
- **You need a maintained API contract.** Copy-in source means you own it:
  no upstream fixes unless you re-add and re-diff.

## Non-negotiables

Details and code in `references/integration.md`.

- Background/spectacle components are decoration: `aria-hidden="true"`,
  `pointer-events-none` wrapper, behind content with `isolate` + `-z-10`.
- Every continuous canvas loop needs a **`prefers-reduced-motion` gate**
  (render static or nothing) and an **off-screen pause**. Most componentry
  components do NOT ship these — you add them at the call site.
- Canvas/WebGL pieces load via `next/dynamic` `ssr: false`, route-local,
  never in shared layout JS.
- One spectacle component per viewport, maximum.
- Text over animated backgrounds: contrast-check against the busiest frame;
  add a scrim before dialing the effect down.
- After install, read the copied source — you own it now; strip unused
  variants and align hardcoded colors to Tailwind tokens (most components
  support dark mode, verify per component).
