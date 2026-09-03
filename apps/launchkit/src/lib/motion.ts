/**
 * JS mirrors of the motion tokens in app/globals.css (@theme block).
 * Single source of truth is the CSS; keep these in sync with tokens.css.
 */
export const DUR = {
  fast: 0.12, // --duration-fast, hovers, toggles
  base: 0.18, // --duration-base, enters, panel swaps, queue exits
  slow: 0.28, // --duration-slow, dialogs, drawers
  stamp: 0.24, // --duration-stamp, the gate stamp, reserved
} as const;

export const EASE_STANDARD = [0.2, 0, 0, 1] as const; // --ease-standard (enters, moves)
export const EASE_EXIT = [0.4, 0, 1, 1] as const; // --ease-exit (exits)
