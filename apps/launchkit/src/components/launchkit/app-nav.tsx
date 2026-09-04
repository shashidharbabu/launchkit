import { useReducedMotion } from 'motion/react';
import { BRAND } from '../../brand/assets';
import { AnimatedBackground } from '@launchkit/design-system/motion/animated-background';
import { ThemeToggle } from './theme-toggle';
import { WorkspaceSwitcher } from './workspace-switcher';
import { Button } from '@launchkit/design-system/components/button';
import { Kbd } from '@launchkit/design-system/components/kbd';
import { DUR, EASE_STANDARD } from '../../lib/motion';
import { cn } from '@launchkit/design-system/lib/cn';
import { useNav, type NavState } from '../../nav';

const NAV = [
  { href: '/home', label: 'Home', match: /^\/home/ },
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
      <img
        src={BRAND.iconColor}
        alt=""
        width={size}
        height={size}
        className="dark:hidden"
      />
      <img
        src={BRAND.iconWhite}
        alt=""
        width={size}
        height={size}
        className="hidden dark:block"
      />
    </>
  );
}

/**
 * The app's main navigation bar. Nav hierarchy stays out of ember's way:
 * active items read in ink with a gliding ink underline; the ember
 * underline belongs to the stage rail.
 */
/** NavState behind each nav href — links keep their markup, the state moves. */
export const NAV_STATE: Record<string, NavState> = {
  '/home': { view: 'home' },
  '/dashboard': { view: 'dashboard' },
  '/launches': { view: 'launches' },
  '/runs': { view: 'runs' },
  '/settings': { view: 'settings' },
};

export function AppNav() {
  const { nav, go, href } = useNav();
  const reduced = useReducedMotion();
  // Derive the old route pathname from NavState so the match regexes work unchanged.
  const pathname =
    nav.view === 'workspace'
      ? `/p/${nav.projectId ?? ''}/${nav.stage ?? 'profile'}`
      : nav.view === 'new-launch'
        ? '/launches/new'
        : `/${nav.view}`;

  return (
    <div className="border-b border-border bg-background">
      <div className="flex h-topbar w-full flex-wrap items-center gap-1 px-5 sm:px-8 lg:px-10">
        <a
          href={href({ view: 'dashboard' })}
          onClick={(e) => {
            e.preventDefault();
            go({ view: 'dashboard' });
          }}
          className="mr-4 flex items-center gap-2.5"
          aria-label="Launch Kit dashboard"
        >
          <BrandMark />
          <span className="text-heading">Launch Kit</span>
        </a>
        <nav aria-label="Main" className="flex flex-wrap items-center">
          <AnimatedBackground
            enableHover
            className="rounded-control bg-surface-raised shadow-card"
            transition={reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE_STANDARD }}
          >
            {NAV.map((item) => {
              const active = item.match.test(pathname ?? '');
              return (
                <a
                  key={item.href}
                  data-id={item.href}
                  href={href(NAV_STATE[item.href])}
                  onClick={(e) => {
                    e.preventDefault();
                    go(NAV_STATE[item.href]);
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative inline-flex h-9 items-center rounded-control px-3 text-small font-medium transition-colors duration-(--duration-fast)',
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </AnimatedBackground>
        </nav>
        <span className="ml-auto flex items-center gap-3">
          <WorkspaceSwitcher />
          <Button variant="ghost" size="sm" onClick={openPalette} aria-label="Open command palette">
            Search
            <Kbd>⌘K</Kbd>
          </Button>
          <ThemeToggle />
        </span>
      </div>
    </div>
  );
}
