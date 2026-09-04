'use client';

import * as React from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimatedBackground } from './motion/animated-background';
import { DUR, EASE_STANDARD } from '../lib/motion';
import { cn } from '../lib/cn';

/**
 * Segmented control: a small set of exclusive options (theme, view, filter).
 * The selected pill glides between options; static under reduced motion.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: React.ReactNode; icon?: React.ReactNode }>;
  size?: 'sm' | 'md';
  ariaLabel: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex rounded-control border border-border bg-sunken p-0.5', className)}
    >
      <AnimatedBackground
        defaultValue={value}
        onValueChange={(v) => v && onChange(v as T)}
        className="rounded-[6px] bg-surface-raised shadow-card"
        transition={reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE_STANDARD }}
      >
        {options.map((o) => (
          <button
            key={o.value}
            data-id={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[6px] px-3 text-small font-medium transition-colors duration-(--duration-fast)',
              size === 'sm' ? 'h-7' : 'h-8',
              value === o.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  );
}
