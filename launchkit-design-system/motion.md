# Motion

Motion intensity 3/10. In a work queue, animation taxes throughput — so
motion here does exactly two jobs: **explain a state change** (appeared,
moved, completed, left) or **reward a moment that matters** (a gate
approval). Anything else is noise and gets cut.

## Runtimes and division of labor

One JS animation runtime: **Motion v13** (`motion/react` — never
`framer-motion` imports). Layered on it, vendored **motion-primitives**
components. CSS-only state transitions use **tw-animate-css**
(`data-[state=open]:animate-in` etc. on Base UI components). KPI numbers
use **@number-flow/react**. No GSAP in the app (marketing pages may use it
in isolation; it never enters the component library). No route transitions
— React's `<ViewTransition>` is still experimental; revisit when stable.

All animated components are client components — keep `'use client'` at the
leaf (the stamp, the shimmer), never the page.

## Tokens

From `tokens.css`: `--duration-fast` 120ms (hover/toggle) ·
`--duration-base` 180ms (enter, exit, panel swap) · `--duration-slow` 280ms
(dialogs/drawers) · `--duration-stamp` 240ms (reserved) ·
`--ease-standard` for enters · `--ease-exit` for exits. Exits are never
longer than enters. Animate transform/opacity only — never width/height on
data-heavy containers (height-collapse on a SignalCard animates
`max-height` on the leaving clone, not live layout).

## The motion map

| Surface | Treatment | Implementation |
| --- | --- | --- |
| **Gate stamp** (signature) | Stamp lands: `initial={{ scale: 1.15, opacity: 0 }}` → `animate={{ scale: 1, opacity: 1 }}`, 240ms `--ease-standard`; slip collapses 180ms after | `motion/react` — hand-rolled, it's the one bespoke moment |
| Stage rail hover/active | Shared highlight follows pointer between tabs | motion-primitives `AnimatedBackground` — children **must** carry unique `data-id`; set `enableHover` |
| Stage panel swap | Fade+4px slide between stage panels | motion-primitives `TransitionPanel` — controlled `activeIndex` (required), 180ms |
| Queue exits (Mark replied / Dismiss) | Card fades + collapses, 180ms `--ease-exit`; list below settles via layout animation | `AnimatePresence` + `motion.div layout` |
| Running jobs | Status line shimmers | motion-primitives `TextShimmer` — `children` is a **string only**; `duration={2}` |
| Attribution / signup counts | Digits roll to new values | `@number-flow/react` `<NumberFlow value={n} />` — preferred over motion-primitives' AnimatedNumber for `Intl` formatting + built-in reduced-motion + a11y. Pin `~0.6.x` |
| Card/list first paint | Stagger-in, 40ms/item, once | motion-primitives `AnimatedGroup` `preset="fade"` — gate stages only, never on refetch |
| Dialogs, menus, toasts | CSS enter/exit on `data-[state]` | tw-animate-css classes, 180–280ms |
| Asset preview (card → full view) | Thumbnail morphs to dialog | motion-primitives `MorphingDialog` — `MorphingDialogContent` must sit inside `MorphingDialogContainer`; trigger and content need matching structure to read as one morph |
| Landing page hero (only) | Headline blur-reveal per word; sections reveal on scroll | motion-primitives `TextEffect` (`per="word" preset="blur"`, string children) + `InView` (`viewOptions={{ once: true }}`) |

## Hard rules

- **Never animate:** table sorts/filters (instant), form validation,
  refetch re-renders, anything updating >1/sec (springs never settle —
  snap the value; NumberFlow handles this, AnimatedNumber does not).
- **One motion idea per region.** The stamp is the view's moment; while a
  stamp plays, nothing else moves.
- **No ambient motion** in the workspace: no marquees, glows, spotlights,
  border-trails, tilts. Those live on the marketing site if anywhere.
- **`prefers-reduced-motion`:** decorative motion (stamp scale, shimmer,
  staggers, morphs) is gated off — the global CSS kill-switch in
  `tokens.css` covers CSS/tw-animate; for Motion components use
  `useReducedMotion()` and render the finished state outright. Content
  changes (a number updating, a panel swapping) still happen — instantly.
- **Loading:** >300ms ops show skeleton or shimmer; sub-300ms ops show
  nothing (a flash of skeleton is worse than a wait).

## Motion v13 note

v13's only breaking change: automatic `@emotion/is-prop-valid` detection
was removed. None of our vendored components spread unknown props onto
motion elements; if one ever does, wrap it in
`<MotionConfig isValidProp={isPropValid}>` rather than downgrading.
