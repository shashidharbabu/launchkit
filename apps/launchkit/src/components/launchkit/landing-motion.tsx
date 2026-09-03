import * as React from 'react';
import { useReducedMotion } from 'motion/react';
import { TextEffect } from '../motion-primitives/text-effect';
import { InView } from '../motion-primitives/in-view';
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
        <h1 className="mt-3 max-w-2xl text-display font-semibold tracking-[-0.01em]">{headline}</h1>
        <p className="mt-4 max-w-2xl text-read leading-[1.625rem] text-muted-foreground">
          {subhead}
        </p>
      </>
    );
  }
  return (
    <>
      <TextEffect
        per="word"
        preset="blur"
        as="h1"
        className="mt-3 max-w-2xl text-display font-semibold tracking-[-0.01em]"
      >
        {headline}
      </TextEffect>
      <TextEffect
        per="line"
        preset="fade"
        delay={0.5}
        as="p"
        className="mt-4 max-w-2xl text-read leading-[1.625rem] text-muted-foreground"
      >
        {subhead}
      </TextEffect>
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
