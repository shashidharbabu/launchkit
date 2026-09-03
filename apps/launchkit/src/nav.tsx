import * as React from 'react';
import type { StageSlug } from './lib/stages';

/**
 * In-app navigation: the shell-app replacement for the Next.js router.
 *
 * The shell owns the browser URL (doc 03 B2), so Launch Kit navigates by
 * state: one NavState names the visible view. Links keep their exact
 * markup/classNames and become buttons semantically, `href(next)` returns
 * '#' and the click handler calls `go(next)` with preventDefault.
 *
 * TODO(useWorkspace appState): persistence moves to the shell's
 * useWorkspace().appState when wired; localStorage['lk-nav'] is the interim
 * store.
 */

export type NavState = {
  view: 'home' | 'dashboard' | 'launches' | 'new-launch' | 'runs' | 'settings' | 'workspace';
  projectId?: string;
  stage?: StageSlug;
};

type NavContextValue = {
  nav: NavState;
  go: (next: NavState) => void;
  href: (next: NavState) => string;
};

const STORAGE_KEY = 'lk-nav';

const VIEWS: NavState['view'][] = ['home', 
  'dashboard',
  'launches',
  'new-launch',
  'runs',
  'settings',
  'workspace',
];

const NavContext = React.createContext<NavContextValue | null>(null);

function readStoredNav(): NavState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<NavState>;
      if (v && typeof v === 'object' && VIEWS.includes(v.view as NavState['view'])) {
        return {
          view: v.view as NavState['view'],
          projectId: typeof v.projectId === 'string' ? v.projectId : undefined,
          stage: typeof v.stage === 'string' ? (v.stage as StageSlug) : undefined,
        };
      }
    }
  } catch {
    // storage unavailable or corrupt, fall through to the default view
  }
  return { view: 'home' };
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [nav, setNav] = React.useState<NavState>(() => ({ view: 'home' })) // Home (landing + navigator) is the post-login landing;

  const go = React.useCallback((next: NavState) => {
    setNav(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable: navigation still works for this session
    }
  }, []);

  const href = React.useCallback((_next: NavState) => '#', []);

  const value = React.useMemo(() => ({ nav, go, href }), [nav, go, href]);

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue {
  const ctx = React.useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
