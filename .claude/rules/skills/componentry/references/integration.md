# Componentry integration

Everything after `npx shadcn@latest add @componentry/<name>`. Stack: Next.js
14 App Router, Tailwind 3.4, motion v13 (`motion/react`), TypeScript.

## Registry mechanics (verified Aug 2026)

- Registry index: `https://componentry.dev/r/registry.json` (name
  `componentry`, aliases `componentry`/`componentryui`/`ui`/`cmp`; homepage
  field still lists componentry.fun — same project).
- Per-component payload: `https://componentry.dev/r/<name>.json` with
  `dependencies` (npm), `registryDependencies`, and `files[]` containing the
  full TSX source targeting `components/ui/<name>.tsx`.
- Verified example — `magnetic-dock`: `dependencies: ["framer-motion"]`,
  imports `motion, useMotionValue, useSpring, useTransform, AnimatePresence`
  from `"framer-motion"` and `cn` from `"@/lib/utils"`. Props:
  `items: DockItemData[]` (`{ id, label, icon, onClick?, isActive?, badge? }`),
  `iconSize?`, `maxScale?`, `magneticDistance?`, `showLabels?`,
  `position?: 'bottom'|'top'|'left'|'right'`,
  `variant?: 'glass'|'solid'|'transparent'`, `className?`.
- License: MIT (repo `harshjdhv/componentry`, © 2026 Harsh Jadhav).
  Unrestricted commercial use; no attribution required. The copied source is
  yours to modify.
- The general CLI/`components.json`/namespaced-registry mechanics — and the
  Tailwind v3-vs-v4 `shadcn@latest` caveat that applies to this repo — are
  documented in the **shadcn** skill. If `@componentry/...` namespace
  resolution fails on an older CLI, fall back to the direct URL form:
  `npx shadcn@latest add https://componentry.dev/r/<name>.json`.
- Do NOT `npm install componentry` — that npm name is an unrelated package.

## Performance tiers — triage before installing

Read the fetched source and place the component in a tier; the tier decides
the wiring.

**Tier 1 — CSS/framer-motion, DOM-based** (buttons, text effects, marquees,
spotlight/hover cards, text-morph, flipping-word-swap, border-beam):
cheap, SSR-safe markup with client interactivity. Import normally; the
`"use client"` directive is already in the source. Cost ≈ framer-motion you
already ship.

**Tier 2 — scroll-driven** (`scroll-based-velocity`, `sticky-scroll-cards`,
`scroll-split-card`, `scroll-choreography`, `scroll-tilted-grid`): built on
`useScroll`/`useTransform` — main-thread work per frame while in view.
Fine as the page's single scroll set-piece; don't stack two in one route.

**Tier 3 — canvas/WebGL loops** (`matrix-rain`, `dither-*`, `particle-galaxy`,
`webgl-liquid`, `liquid-chrome`, `aurora-flow`, `silk-aurora`, `pixel-canvas`,
`ascii-effect`, `circuit-board`, `cursor-driven-particle-typography`,
`eye-tracking`, `image-trail` variants): continuous rAF loops, sometimes
WebGL contexts. These need every guard below, loaded via `next/dynamic`, and
you commit to at most one per viewport.

## Wiring a Tier-3 background properly

The registry source generally ships bare (no reduced-motion gate, no
off-screen pause, no aria). Wrap at the call site:

```tsx
// components/spectacle-background.tsx
'use client';
import dynamic from 'next/dynamic';
import { useInView, useReducedMotion } from "motion/react";
import { useRef } from 'react';

const MatrixRain = dynamic(
  () => import('@/components/ui/matrix-rain').then((m) => m.MatrixRain),
  { ssr: false },
);

export function SpectacleBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '100px' });
  const reduced = useReducedMotion();

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ''}`}
    >
      {/* static fallback for reduced motion; else mount only while near viewport */}
      {reduced ? (
        <div className="h-full w-full bg-gradient-to-b from-emerald-950 to-black" />
      ) : (
        inView && <MatrixRain />
      )}
    </div>
  );
}
```

```tsx
// in the page (Server Component stays a Server Component)
<section className="relative isolate overflow-hidden">
  <SpectacleBackground />
  <div className="relative z-10 px-6 py-24">…copy, CTA…</div>
</section>
```

Why each piece: `ssr:false` because canvas components touch `window`;
`inView &&` unmounts the rAF loop off-screen (verify the component cleans up
in its effect return — patch it if not, you own the source); `reduced` swaps
in a static equivalent, not a paused canvas download; `isolate` + `-z-10`
keeps stacking sane; `pointer-events-none` + `aria-hidden` because it is
decoration. Better still: many Tier-3 components accept density/speed props —
also halve density on `(max-width: 768px)` since mobile GPUs pay double.

## Dark mode

Components advertise light/dark support (e.g. magnetic-dock's `glass`
variant) but several backgrounds hardcode palettes as props or internal
constants (matrix green, aurora hues). After install:

1. Grep the copied file for hex literals / rgba constants.
2. Lift them to props if not already, and feed Tailwind theme values
   (`theme.colors` import or CSS variables) so both themes are deliberate.
3. Contrast-check overlaid text in both themes against the *busiest* animation
   frame; prefer adding a scrim (`bg-black/40` overlay div) over dimming the
   effect until it's pointless.

## Accessibility checklist

- Decorative pieces: `aria-hidden="true"` + `pointer-events-none` (wrapper
  pattern above). Interactive pieces (dock, command-menu, auth-modal,
  wheel-carousel): keyboard-test after install — copy-in source is not
  guaranteed WAI-ARIA-complete; the dock's items render as `<button>`s (good)
  but verify focus-visible styles against your theme.
- Kinetic typography holds real copy: ensure the text is present as actual
  DOM text (screen readers, SEO) — components that particle-ize or split
  characters should keep an `sr-only` intact copy alongside; add one if the
  source doesn't.
- Continuous loops longer than 5s need pause/stop affordance or the
  reduced-motion + off-screen guards above (WCAG 2.2.2).
- `scroll-choreography`-style hijacking: verify keyboard/assistive scrolling
  still reaches all content.

## Update strategy

Copy-in source never auto-updates. Record what you installed
(`componentry.dev/r/<name>.json` + date in the component's header comment).
To pull upstream fixes: re-fetch the registry JSON, diff against your local
(you likely patched cleanup/reduced-motion/tokens), and merge by hand. Treat
heavily-modified components as forks — stop tracking upstream.

## Anti-patterns

- `npm install componentry` (unrelated package).
- Two Tier-3 backgrounds on one page, or a Tier-3 background plus a Spline
  scene (see spline skill) — pick one engine of spectacle.
- Shipping the raw registry source without reading it: no reduced-motion, no
  cleanup verification, hardcoded palette, no `sr-only` text.
- Static import of a canvas component in a shared layout — every route pays.
- Using componentry for a number ticker or dialog morph that
  motion-primitives already covers in a quieter register.
- Letting a spectacle background push the page over budget and "fixing" it by
  hiding it on mobile only with CSS (`hidden`) — the JS still downloads and
  runs; gate the *mount*, not the paint.
