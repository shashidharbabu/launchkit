import * as React from 'react';

/**
 * Launch Kit theme provider — the shell-app replacement for next-themes.
 *
 * Holds 'light' | 'dark' | 'system'; resolves 'system' via
 * `prefers-color-scheme` with a live change listener. Applies/removes the
 * `dark` class on the element with id `lk-root` (NOT documentElement) —
 * every Launch Kit style is scoped under .lk-root (a class on BOTH the app root and the hoisted sidebar root), and the shell owns the
 * document root.
 *
 * TODO: persistence moves to useWorkspace prefs when the data layer lands;
 * localStorage['lk-theme'] is the interim store.
 */

export type LkTheme = 'light' | 'dark' | 'system';

type LkThemeContextValue = {
  theme: LkTheme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: LkTheme) => void;
};

const STORAGE_KEY = 'lk-theme';

const LkThemeContext = React.createContext<LkThemeContextValue | null>(null);

function readStoredTheme(): LkTheme {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // storage unavailable — fall through to 'system'
  }
  return 'system';
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function LkThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<LkTheme>(() => readStoredTheme());
  const [systemDark, setSystemDark] = React.useState<boolean>(() => systemPrefersDark());

  // Track OS scheme changes while theme === 'system'.
  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Apply the `dark` class on #lk-root — all styles are scoped under it.
  React.useEffect(() => {
    const root = document.getElementById('lk-root');
    if (!root) return;
    root.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setTheme = React.useCallback((t: LkTheme) => {
    setThemeState(t);
    try {
      window.localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // storage unavailable — theme still applies for this session
    }
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <LkThemeContext.Provider value={value}>{children}</LkThemeContext.Provider>;
}

/** Same shape components expect from next-themes' useTheme. */
export function useLkTheme(): LkThemeContextValue {
  const ctx = React.useContext(LkThemeContext);
  if (!ctx) throw new Error('useLkTheme must be used within LkThemeProvider');
  return ctx;
}
