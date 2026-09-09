import * as React from 'react';
import { useReducedMotion } from 'motion/react';
import { Menu } from 'lucide-react';
import { BRAND } from '../../brand/assets';
import { AnimatedBackground } from '@launchkit/design-system/motion/animated-background';
import { ThemeToggle } from './theme-toggle';
import { WorkspaceSwitcher } from './workspace-switcher';
import { Button } from '@launchkit/design-system/components/button';
import { Kbd } from '@launchkit/design-system/components/kbd';
import { Dialog, DialogTrigger, DialogTitle, SheetContent } from '@launchkit/design-system/components/dialog';
import { DUR, EASE_STANDARD } from '../../lib/motion';
import { cn } from '@launchkit/design-system/lib/cn';
import { useNav, type NavState } from '../../nav';

const NAV = [
  { href: '/home', label: 'Home', match: /^\/home/ },
  { href: '/launches', label: 'Launches', match: /^\/(launches|p|dashboard)(\/|$)/ },
  { href: '/runs', label: 'Runs', match: /^\/runs/ },
  { href: '/settings', label: 'Settings', match: /^\/settings/ },
];

/** Ask the command palette to open (listened for in CommandPalette). */
export function openPalette() {
  window.dispatchEvent(new CustomEvent('lk:palette'));
}

/** RocketRide mark: color on the light canvas, white on the dark one. */
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

/** NavState behind each nav href: links keep their markup, the state moves. */
export const NAV_STATE: Record<string, NavState> = {
  '/home': { view: 'home' },
  '/launches': { view: 'launches' },
  '/runs': { view: 'runs' },
  '/settings': { view: 'settings' },
};

/**
 * The app's main navigation (components/navigation.md, adapted: this app keeps
 * a top bar instead of the 264px rail, an owner decision). From `lg` the bar
 * holds the destinations as raised rows beside the wordmark, with the
 * workspace switcher, search and the theme toggle on the right. Below `lg`
 * the spec's rule applies: a 56px bar with the logo and a menu button, and the
 * destinations in a left sheet that closes on navigation. Active rows read in
 * ink on a raised surface; flare stays with the gate.
 */
export function AppNav() {
  const { nav, go, href } = useNav();
  const reduced = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  // Derive the old route pathname from NavState so the match regexes work unchanged.
  const pathname =
    nav.view === 'workspace'
      ? `/p/${nav.projectId ?? ''}/${nav.stage ?? 'profile'}`
      : nav.view === 'new-launch'
        ? '/launches/new'
        : `/${nav.view}`;

  const follow = (e: React.MouseEvent, to: NavState) => {
    e.preventDefault();
    setOpen(false);
    go(to);
  };

  const brand = (
    <a
      href={href({ view: 'home' })}
      onClick={(e) => follow(e, { view: 'home' })}
      className="flex items-center gap-2.5"
      aria-label="Launch Kit home"
    >
      <BrandMark />
      <span className="text-heading">Launch Kit</span>
    </a>
  );

  return (
    <div className="border-b border-border bg-background">
      {/* from lg: one line, destinations beside the wordmark */}
      <div className="hidden h-topbar w-full items-center gap-1 px-5 sm:px-8 lg:flex lg:px-10">
        <span className="mr-4">{brand}</span>
        <nav aria-label="Main" className="flex items-center">
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
                  onClick={(e) => follow(e, NAV_STATE[item.href])}
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

      {/* below lg: the 56px bar with the logo and a menu; destinations in a left sheet */}
      <div className="flex h-topbar w-full items-center justify-between gap-2 px-5 sm:px-8 lg:hidden">
        {brand}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="Open the menu">
                <Menu aria-hidden />
              </Button>
            }
          />
          <SheetContent side="left" aria-describedby={undefined}>
            <DialogTitle>Menu</DialogTitle>
            <nav aria-label="Main" className="mt-4 grid gap-1">
              {NAV.map((item) => {
                const active = item.match.test(pathname ?? '');
                return (
                  <a
                    key={item.href}
                    href={href(NAV_STATE[item.href])}
                    onClick={(e) => follow(e, NAV_STATE[item.href])}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-9 items-center rounded-control px-3 text-small font-medium transition-colors duration-(--duration-fast)',
                      active ? 'bg-surface-raised text-foreground shadow-card' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
            <div className="mt-6 grid gap-4 border-t border-border pt-4">
              <WorkspaceSwitcher />
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    openPalette();
                  }}
                  aria-label="Open command palette"
                >
                  Search
                  <Kbd>⌘K</Kbd>
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Dialog>
      </div>
    </div>
  );
}
