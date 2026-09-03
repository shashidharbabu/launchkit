# From reference to framer-motion

The translation workflow: MotionSites preview (or any animated site
reference) → named pattern → timing spec → motion v13 (`motion/react`) implementation.
Stack: Next.js 14 App Router, Tailwind 3.4, TypeScript.

## Step 1 — Read the preview

Previews are GIF/WebP loops (~15fps) or Mux video. Watch each 3–4 times with
one question per pass:

1. **Choreography** — what moves, in what order? Count the beats ("badge,
   then headline lines, then CTA, then background settles" = 4 beats).
2. **Timing** — beat duration and gaps. At 15fps, 4–5 frames ≈ 300ms.
   Typical hero entrances: 400–700ms per element, 60–120ms stagger.
3. **Easing character** — how does motion end?
   - Slows into place, no overshoot → `ease: [0.22, 1, 0.36, 1]` (easeOutQuint-ish)
   - Overshoots and settles → spring: `{ type: 'spring', stiffness: 120, damping: 14 }`
   - Mechanical/linear (marquees, tickers) → `ease: 'linear'`, `repeat: Infinity`
   - Blur-to-sharp reveal → animate `filter: 'blur(8px)' → 'blur(0px)'` with opacity
4. **Scroll relationship** — triggered once on enter (`whileInView`) vs
   scrubbed by scroll position (`useScroll` + `useTransform`)?

Write the spec down before coding, e.g.:

> Hero: bg gradient fades in 0→1 over 1200ms; headline in 2 lines, each
> y:24→0 + blur(6)→0, 500ms, easeOut, stagger 90ms; CTA scale 0.95→1 spring,
> delay 400ms; orbiting glow loops 20s linear.

## Step 2 — Map pattern → implementation

| Observed pattern | Implementation |
|---|---|
| Staggered hero entrance | `variants` + `staggerChildren` (recipe below) |
| Word/character text reveal | **componentry** `kinetic-text-reveal` / `letter-cascade`, or **motion-primitives** text effects — check both before hand-rolling |
| Scroll-scrubbed section (pin, scale, split) | `useScroll({ target, offset })` + `useTransform`; or componentry `sticky-scroll-cards` / `scroll-split-card` |
| Infinite marquee / logo rail | componentry `testimonial-marquee` or motion-primitives infinite slider |
| Animated gradient / aurora background | componentry `animated-gradient`, `aurora-flow`, `silk-aurora`; static organic shapes → **haikei** skill |
| Matrix/particle/dither spectacle | componentry canvas components (`matrix-rain`, `dither-gradient`, `particle-galaxy`) — mind the perf tier notes in that skill |
| Floating 3D object | **spline** skill — read its cost warnings first |
| Number/stat count-up | motion-primitives number effects |

Reaching for an existing audited component beats re-deriving one from a GIF.
Hand-roll only what no library covers (usually the page-specific
choreography glue).

## Step 3 — The stagger-entrance recipe (the pattern 80% of previews use)

```tsx
'use client';
import { motion, useReducedMotion, type Variants } from "motion/react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

export function HeroReveal({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <div>{children}</div>; // content, instantly, unmoved
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {children /* each child wraps in <motion.div variants={item}> */}
    </motion.div>
  );
}
```

Notes that make it read "premium" like the previews:

- Blur + y + opacity together, not opacity alone.
- Stagger 60–120ms; more feels sluggish, less reads as one blob.
- One spring element max (usually the CTA) against easing curves elsewhere.
- Background settles *slower* than foreground (800–1500ms) — layers separate.
- This is a client component; keep it a leaf so the page stays a Server
  Component.

Scroll-scrubbed version: swap `animate="show"` for
`whileInView="show" viewport={{ once: true, margin: '-80px' }}` (triggered),
or use `useScroll` + `useTransform` for true scrubbing.

## Step 4 — If a purchased prompt's output is in hand

MotionSites prompts target Lovable/v0/Bolt/Cursor. Their output is a starting
sketch. Adaptation checklist:

- [ ] **Dependencies**: strip anything outside our stack (GSAP, random
      particle libs, styled-components, shadcn additions we don't use).
      Re-express in motion v13 (`motion/react`) / Tailwind 3.4 / componentry.
- [ ] **Server/client split**: builders emit one giant client component.
      Extract static markup into Server Components; keep motion leaves client.
- [ ] **Tokens**: replace hardcoded hex/px with the project's Tailwind
      tokens; check both themes — builder output is usually dark-only.
- [ ] **Reduced motion**: builder output never includes it. Add
      `useReducedMotion` / `motion-reduce:` coverage to every animation.
- [ ] **A11y**: decorative canvases get `aria-hidden` +
      `pointer-events-none`; heading order is usually broken; contrast-check
      text over animated backgrounds against the busiest frame.
- [ ] **Performance**: builders love full-viewport canvases + shadows +
      backdrop-blur stacked. Cap at one continuous animation per viewport;
      pause off-screen loops (`useInView`); check the route's first-load JS.
- [ ] **Copy**: replace the prompt's lorem-brand ("NOVA Space Systems")
      with real copy *before* review — placeholder copy anchors taste
      decisions wrongly.

## Licensing notes (blunt)

- Browsing previews is free; implementing a *pattern* you observed is normal
  design practice and fine.
- Reproducing one specific MotionSites design pixel-for-pixel for a
  commercial client without a license: don't. With a license: allowed ("for
  personal & client work"), but there is no published license document —
  advise the user to keep proof of purchase and check current terms for
  resale/template redistribution, which prompt libraries typically forbid.
- The $129 tier is rate-limited (3 prompt copies/day) — batch prompt pulls
  accordingly if the user is on it.
- Prompt *output* comes from the user's own AI builder session; treat the
  generated code as the user's, subject to the builder's terms, not
  MotionSites'.

## Anti-patterns

- Shipping AI-builder output verbatim (no reduced-motion, dead deps,
  dark-only, one 800-line client component).
- Cloning a paid preview 1:1 without a license and calling it "inspired by".
- Stacking three spectacle backgrounds because the gallery makes each look
  good alone — previews are single-section demos, not a page system.
- Quoting or reconstructing paywalled prompt text the user hasn't bought.
- Using MotionSites energy on a product whose brief calls for restraint —
  motion direction must follow the design direction, not replace it.
