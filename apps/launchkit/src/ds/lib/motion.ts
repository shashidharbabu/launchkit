/**
 * JS mirrors of the motion tokens in design-system/foundations/tokens.css.
 * The CSS is the source of truth; keep these in sync (motion.md).
 */
export const DUR = {
  fast: 0.12, // --duration-fast: hovers, toggles, focus
  base: 0.2, // --duration-base: enters, panel swaps, list exits
  slow: 0.32, // --duration-slow: dialogs, sheets, page transitions
  gate: 0.48, // --duration-gate: the gate release, reserved
} as const;

export const EASE_STANDARD = [0.2, 0, 0, 1] as const; // --ease-standard
export const EASE_EXIT = [0.4, 0, 1, 1] as const; // --ease-exit
export const EASE_EMPHASIS = [0.34, 1.3, 0.64, 1] as const; // --ease-emphasis (one overshoot)

/** Springs for physical moments: the gate release, the composer send. */
export const SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.9 } as const;
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 30, mass: 1 } as const;

/** Page and stage transitions (patterns/page-transitions.md). */
export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: DUR.base, ease: EASE_STANDARD },
} as const;
