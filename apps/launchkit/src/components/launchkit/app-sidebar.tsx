import { Moon, Sun } from 'lucide-react';
import { BrandMark, NAV_STATE, openPalette } from './app-nav';
import { type NavState } from '../../nav';
import { cn } from '../../lib/utils';

/**
 * The vertical feature rail, rendered into the shell's AppLayout `sidebar`
 * slot. CRITICAL: the real shell renders this slot in ITS OWN sidebar column,
 * OUTSIDE the app's React tree: so nothing here may call an app context hook
 * (useNav / useLkTheme throw "must be used within ...Provider"). Everything
 * this rail needs arrives as props from AppChrome, which lives inside the
 * providers. Keep this component context-free.
 *
 * It also carries its OWN `.lk-root` scope class + `dark` class: the shell
 * renders it outside the app's #lk-root DOM, so ID-scoped CSS and the
 * root `.dark` class would never reach it otherwise. Utilities live on an
 * INNER wrapper: descendant scoping (`.lk-root .x`) never matches the scope
 * root itself, so classes on the root element would be dead.
 */
export type AppSidebarProps = {
  nav: NavState;
  go: (s: NavState) => void;
  href: (s: NavState) => string;
  resolvedTheme: 'light' | 'dark';
  onToggleTheme: () => void;
};

const ITEMS: { key: keyof typeof NAV_STATE; label: string; match: (v: NavState) => boolean }[] = [
  { key: '/home', label: 'Home', match: (v) => v.view === 'home' },
  { key: '/dashboard', label: 'Dashboard', match: (v) => v.view === 'dashboard' },
  { key: '/launches', label: 'Launches', match: (v) => v.view === 'launches' || v.view === 'new-launch' || v.view === 'workspace' },
  { key: '/runs', label: 'Runs', match: (v) => v.view === 'runs' },
  { key: '/settings', label: 'Settings', match: (v) => v.view === 'settings' },
];

export function AppSidebar({ nav, go, href, resolvedTheme, onToggleTheme }: AppSidebarProps) {
  return (
    <div className={cn('lk-root', resolvedTheme === 'dark' && 'dark')} style={{ height: '100%' }}>
      <div className="flex h-full min-h-full flex-col border-r border-border bg-sidebar">
      <a
        href={href({ view: 'home' })}
        onClick={(e) => { e.preventDefault(); go({ view: 'home' }); }}
        className="flex items-center gap-2 border-b border-border px-4 py-4 hover:opacity-80"
        aria-label="Launch Kit dashboard"
      >
        <BrandMark />
        <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-foreground">
          Launch Kit
        </span>
      </a>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5 p-2">
        {ITEMS.map((item) => {
          const active = item.match(nav);
          return (
            <a
              key={item.key}
              href={href(NAV_STATE[item.key])}
              onClick={(e) => { e.preventDefault(); go(NAV_STATE[item.key]); }}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-sm px-3 py-2 text-body',
                active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-border p-2">
        <button
          type="button"
          onClick={openPalette}
          className="flex items-center gap-2 rounded-sm px-3 py-2 text-body text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open command palette"
        >
          Search
          <span className="font-mono text-data">⌘K</span>
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-sm p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      </div>
    </div>
  );
}
