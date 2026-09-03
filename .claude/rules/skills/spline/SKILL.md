---
name: spline
description: Embed and integrate Spline (spline.design) 3D scenes — the collaborative browser-based 3D design tool — into Next.js 14 + Tailwind 3.4 + motion v13 (`motion/react`) via the verified @splinetool/react-spline + @splinetool/runtime packages, or decide against a live embed and use an image/video export instead. Use this whenever a task involves Spline in any form, a 3D scene/hero/product visual needs embedding in a web page, a *.splinecode or prod.spline.design URL appears, someone asks for an "interactive 3D hero", "3D landing page", "rotating product model", or "that floaty 3D blob thing", or when weighing the real cost of 3D on a landing page (the runtime is ~582KB gzipped — measured). Also use it for Spline pointer-events layering under hero copy, Suspense/poster fallbacks, reduced-motion and mobile fallbacks, and free-tier watermark questions — code and tradeoffs live in references/integration.md.
---

# Spline

Spline (spline.design) is a **collaborative 3D design tool that runs in the
browser** — freemium SaaS. A human models/animates the scene in the Spline
editor; the scene then reaches your page one of two ways:

1. **Live embed** — the scene streams from `prod.spline.design/.../scene.splinecode`
   and renders in a WebGL canvas via Spline's runtime. Interactive, and
   expensive (numbers below).
2. **Flat export** — image or video of the scene. Zero runtime cost, zero
   interactivity.

Claude Code cannot author the scene. This skill owns **choosing between those
two paths** and **integrating whichever wins** — the live-embed engineering
(SSR, fallbacks, pointer events, LCP damage control) is in
`references/integration.md`.

## Verified packages (npm, Aug 2026)

| Package | Version | License | Notes |
|---|---|---|---|
| `@splinetool/react-spline` | 4.1.0 | MIT | 27KB. Peers: `@splinetool/runtime`, `react`, `react-dom`, **`next >= 14.2.0`** (for the `/next` entry) |
| `@splinetool/runtime` | 1.12.98 | **none declared on npm** — treat as proprietary Spline code | `build/runtime.js`: **2.05MB raw, 582KB gzipped** (measured from unpkg) |

Install both: `npm i @splinetool/react-spline @splinetool/runtime`.

That 582KB gz is the headline. It is ~15x a typical landing-page JS budget
line item, plus WebGL init, plus the `.splinecode` scene payload itself. A live
Spline hero **will** hurt LCP/INP on mid-range mobile. Default posture:
poster-first, runtime deferred (patterns in the reference).

## Pricing and licensing — blunt version (pricing page, Aug 2026)

- **Free**: limited personal files; web exports/embeds carry a **Spline
  watermark**. Fine for prototypes, not for a commercial launch page.
- **Hobby** ($12/seat/mo annual): removes the watermark on web exports,
  higher-res image exports.
- **Pro** ($20/seat/mo annual): video export, no watermark on embeds,
  unlimited scenes/variables/APIs/webhooks.
- **Enterprise**: **"Code & Self-hosted exports" are listed here** — plan for
  the scene to stream from `prod.spline.design` (a third-party request on
  your launch page) unless the org has an Enterprise agreement. Confirm
  current terms before promising self-hosting; the react-spline README's
  "download the .splinecode" CORS advice predates this gating.
- AI features are metered by monthly credits on every tier.

## Live embed vs flat export

| Situation | Use |
|---|---|
| The 3D object is THE product (configurator, device explorer) and interaction is the point | Live embed, eagerly, budget accepted |
| Decorative 3D hero ornament behind copy | **Video export** (Pro) with the `jitter` skill's `<video>` pattern, or image — 582KB of runtime for a decoration is malpractice |
| Interactive scene wanted, but below the fold | Live embed, lazy-mounted on scroll |
| Mobile / reduced-motion / data-saver users | Always a static image export — never the runtime |
| Need scene to react to app state | Live embed; runtime API (`findObjectByName`, `emitEvent`, variables) |

## When NOT to use Spline

- **A gradient, SVG, or CSS effect gives the same vibe.** Generated
  backgrounds → **haikei** skill; animated components → **motion-primitives**
  / **componentry** skills. 3D is a spice, not a base.
- **LCP-critical hero on a page that must score.** Ship the image/video
  export; revisit live 3D only with real user metrics in hand.
- **The scene would sit behind dense text.** WebGL noise under copy kills
  readability and the canvas fights the text for pointer events.
- **No one on the team owns the Spline file.** An orphaned scene URL is an
  unmaintainable dependency on a third-party host.

## Non-negotiables on integration

Code for all of these in `references/integration.md`.

- **Client-only, always**: `next/dynamic` with `ssr: false`, or the
  `@splinetool/react-spline/next` entry (server-renders a blurred placeholder).
- **Poster-first loading**: a `next/image` poster paints as LCP; the canvas
  fades in over it on `onLoad`. Never let "black rectangle until WebGL wakes
  up" be the hero.
- **Decorative scenes**: wrapper gets `aria-hidden="true"` and
  `pointer-events-none` — a decorative canvas must never eat clicks or scroll.
  Interactive scenes keep pointer events but hero copy/CTAs above them need
  explicit stacking + `pointer-events-auto`.
- **`prefers-reduced-motion`**: don't mount the runtime at all — render the
  poster. Camera drift and float loops are exactly what the setting opts out of.
- **Mobile**: gate the live embed on viewport ≥1024px or
  `matchMedia('(hover: hover)')`; serve the poster elsewhere. Also respect
  `navigator.connection.saveData`.
- **Watermark check before ship**: free-tier embeds show the Spline badge.
  If the badge is visible on a commercial page, the plan is wrong.
