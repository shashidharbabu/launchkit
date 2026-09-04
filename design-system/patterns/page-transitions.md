# Pattern: page transitions

Files: `app/(app)/template.tsx`, `app/p/[id]/template.tsx`,
`design-system/src/components/page-transition.tsx`, `design-system/src/lib/motion.ts` (`PAGE_TRANSITION`).

## The move

Every navigation enters the new page with one motion: opacity 0 to 1 and a 6px rise,
200ms, standard ease. Stage changes inside a launch use the same move, so switching from
Profile to Targets feels like turning to the next panel, not reloading the app.

## Why a template

Next's `template.tsx` remounts on every navigation while `layout.tsx` persists. Mounting
`PageTransition` from the template gives every page and every stage a fresh enter without
any route-change plumbing. The rail, the workspace header and the command palette live in
layouts, so they stay put while the content moves.

## Why enter only

Exit animations would require holding the old page while the new one loads and would
fight the router's own streaming. The new page must never wait for the old one, so exits
are instant. The 4px `exit` value in `PAGE_TRANSITION` exists for in-place swaps (the
gate collapse, list removals), not for routes.

## Reduced motion

`PageTransition` renders a plain `div` when `useReducedMotion()` is true. No fade, no
rise.

## What else moves on navigation

- The rail's active row glides to the new destination (`AnimatedBackground`, 200ms).
- The mobile sheet closes on the row's `onNavigate`.
- Nothing else. No progress bars, no skeleton flashes under 300ms, no crossfades of the
  whole viewport.
