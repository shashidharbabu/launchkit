# Motion

Motion explains state or rewards an approval. Nothing loops for decoration. Every animated
component reads `useReducedMotion()` and renders its finished state when motion is
reduced; the base layer also zeroes all CSS animation and transition durations under
`prefers-reduced-motion`.

Library: Motion v13, imported from `motion/react`. Vendored motion-primitives
(`AnimatedBackground`, `AnimatedGroup`, `InView`, `MorphingDialog`, `TextEffect`,
`TextShimmer`, `TransitionPanel`) live in `design-system/src/components/motion/`. No GSAP, no
second animation runtime, no scroll listeners.

## Tokens

CSS in `tokens.css`, mirrored in `design-system/src/lib/motion.ts` as `DUR`, `EASE_*`, `SPRING*`.

| Token | Value | Use |
| --- | --- | --- |
| `--duration-fast` | 120ms | Hovers, toggles, focus rings, button presses |
| `--duration-base` | 200ms | Enters, panel swaps, list exits, menus, page transitions |
| `--duration-slow` | 320ms | Dialogs, sheets, the composer's focus shadow |
| `--duration-gate` | 480ms | The gate release. Reserved. |
| `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) | Enters and moves |
| `--ease-exit` | cubic-bezier(0.4, 0, 1, 1) | Exits, always shorter than enters |
| `--ease-emphasis` | cubic-bezier(0.34, 1.3, 0.64, 1) | One overshoot, for the seal |
| `SPRING` | stiffness 420, damping 34, mass 0.9 | The Approved seal, the send button |
| `SPRING_SOFT` | stiffness 260, damping 30 | Layout shifts in lists |

Utilities: `duration-(--duration-base)`, `ease-standard`, `ease-exit`. Keyframes:
`animate-rise-in`, `animate-fade-in`, `animate-shimmer`, `animate-dot-pulse`.

## What moves, and why

| Moment | Motion | Reason |
| --- | --- | --- |
| Page or stage enters | Rise 6px + fade, 200ms, from `template.tsx` | Orientation: something changed |
| The gate releases | Line sweeps the top edge (480ms), seal springs in (delay 140ms), panel collapses to a signed row (200ms exit) | Reward: the approval is a physical act |
| A job runs | Spinner + shimmering status line | State: work is happening, named |
| A signal is handled | Card exits with height and opacity, siblings settle with `layout` | State: the queue got shorter |
| Assets load | Stagger 40ms per card | Hierarchy: read them in order |
| A menu or dialog opens | Scale 0.96 to 1 + fade at 200 or 320ms | Layer: it came from somewhere |
| The sidebar's active row | Background glides between items (`AnimatedBackground`) | Feedback: where you are |
| The navigator replies | Three pulsing dots, then text reveals over at most 1.2s | Feedback: it is thinking, then it spoke |
| Landing hero | Stagger 90ms per element, one rise per section in view | Storytelling, once |
| The ambient field | Ridges drift, the glow follows the pointer by 1.5%, grain flickers; 30fps at reduced resolution, paused off-screen | Atmosphere: the pad before liftoff; a still frame under reduced motion (`atmosphere.md`) |
| Buttons press | `active:translate-y-px` | Tactile feedback |

Nothing else animates. In particular: no marquees, no parallax, no cursor effects, no
infinite pulses on cards, no scroll hijacking.

## Rules

- Animate `transform` and `opacity` only. Height animates in exactly two places
  (Disclosure and the gate collapse) with `overflow: hidden`.
- Exits are never longer than enters.
- Skeletons appear only after 300ms (`DelayedSkeleton`); a flash of skeleton is worse
  than a wait.
- Continuous values (scroll, pointer) never live in React state: the landing nav uses
  `useScroll` + `useMotionValueEvent`.
- Motion lives in leaf client components; pages and layouts stay static.
- Stagger parents and children share one client tree.
- Every `useEffect` that starts a timer or interval cleans it up.

## Reduced motion checklist

Gate: no release, straight to the signed row. Chat: text appears at once, no dots delay.
Sidebar: no glide. Landing: no stagger, no drift, no reveals. Dialogs: instant.
