import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DUR, EASE_STANDARD, EASE_EXIT } from '../../lib/motion';

/**
 * Inline expand/collapse (regenerate-with-notes wells, failed-run errors).
 * Animates the wrapper only — height to 'auto' at --duration-base; exits
 * use --ease-exit and are never longer than enters (motion.md).
 */
export function Disclosure({
  open,
  children,
  className,
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className={className}
          style={{ overflow: 'hidden' }}
          initial={reduced ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={
            reduced
              ? undefined
              : { height: 0, opacity: 0, transition: { duration: DUR.base, ease: EASE_EXIT } }
          }
          transition={{ duration: DUR.base, ease: EASE_STANDARD }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
