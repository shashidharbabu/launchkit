'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { DUR, EASE_STANDARD } from '@/lib/motion';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', match: /^\/dashboard/ },
  { href: '/launches', label: 'Launches', match: /^\/(launches|p)(\/|$)/ },
  { href: '/runs', label: 'Runs', match: /^\/runs/ },
  { href: '/settings', label: 'Settings', match: /^\/settings/ },
];

/** Ask the command palette to open (listened for in CommandPalette). */
export function openPalette() {
  window.dispatchEvent(new CustomEvent('lk:palette'));
}

/** RocketRide mark — color on paper, white on the night console. */
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <>
      <Image
        src="/brand/rocketride-icon-color.svg"
        alt=""
        width={size}
        height={size}
        className="dark:hidden"
        priority
      />
      <Image
        src="/brand/rocketride-icon-white.svg"
        alt=""
        width={size}
        height={size}
        className="hidden dark:block"
        priority
      />
    </>
  );
}

/**
 * The app's main navigation bar. Nav hierarchy stays out of ember's way:
 * active items read in ink with a gliding ink underline; the ember
 * underline belongs to the stage rail.
 */
export function AppNav() {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-1 px-4 py-2">
        <Link href="/dashboard" className="mr-4 flex items-center gap-2" aria-label="Launch Kit dashboard">
          <BrandMark />
          <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-foreground">
            Launch Kit
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center">
          <AnimatedBackground
            enableHover
            className="rounded-lg bg-muted"
            transition={reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE_STANDARD }}
          >
            {NAV.map((item) => {
              const active = item.match.test(pathname ?? '');
              return (
                <Link
                  key={item.href}
                  data-id={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative px-3 py-2.5 text-body',
                    active ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      aria-hidden
                      layoutId="appnav-underline"
                      transition={reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE_STANDARD }}
                      className="absolute inset-x-3 bottom-1 z-10 h-0.5 bg-foreground"
                    />
                  )}
                </Link>
              );
            })}
          </AnimatedBackground>
        </nav>
        <span className="ml-auto flex items-center gap-1">
          <Button variant="ghost" onClick={openPalette} aria-label="Open command palette">
            Search
            <span className="font-mono text-data text-muted-foreground">⌘K</span>
          </Button>
          <ThemeToggle />
        </span>
      </div>
    </div>
  );
}
