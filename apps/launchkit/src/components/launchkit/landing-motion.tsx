import * as React from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimatedGroup } from '@launchkit/design-system/motion/animated-group';
import { InView } from '@launchkit/design-system/motion/in-view';
import { DUR, EASE_STANDARD } from '../../lib/motion';

/**
 * The landing page's motion, kept at the leaf (motion.md: motion at the
 * leaf, never the page). Both render the finished state outright under
 * prefers-reduced-motion.
 */
export function LandingHero({ headline, subhead }: { headline: string; subhead: string }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <>
        <h1 className="mt-3 max-w-2xl text-hero text-balance">{headline}</h1>
        <p className="mt-5 max-w-2xl text-lead text-muted-foreground">
          {subhead}
        </p>
      </>
    );
  }
  return (
    <>
      <AnimatedGroup preset="blur-slide">
        <h1 className="mt-3 max-w-2xl text-hero text-balance">{headline}</h1>
        <p className="mt-5 max-w-2xl text-lead text-muted-foreground">{subhead}</p>
      </AnimatedGroup>
    </>
  );
}

/** Scroll reveal at token timing; renders plain under reduced motion. */
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <InView
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: DUR.slow, ease: EASE_STANDARD, delay }}
      viewOptions={{ once: true, margin: '0px 0px -80px 0px' }}
    >
      {children}
    </InView>
  );
}
