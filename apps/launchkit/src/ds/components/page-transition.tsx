'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { PAGE_TRANSITION } from '../lib/motion';

/**
 * Page transition (patterns/page-transitions.md)
 *
 * Mounted from a Next `template.tsx`, which remounts on every navigation,
 * so each page and each stage enters with a 200ms rise. Exit animations
 * are deliberately absent: the new page should never wait for the old one.
 * Static under prefers-reduced-motion.
 */
export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={PAGE_TRANSITION.initial}
      animate={PAGE_TRANSITION.animate}
      transition={PAGE_TRANSITION.transition}
    >
      {children}
    </motion.div>
  );
}
