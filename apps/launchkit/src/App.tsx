/**
 * Launch Kit — root component rendered by the RocketRide shell.
 *
 * The app is a Module Federation remote living inside the shell's page, so it
 * owns exactly one DOM subtree: <div id="lk-root">. The entire Flight
 * Paperwork design system (compiled + scoped by tools/gen-styles.mjs) applies
 * only under that id — the shell's chrome cannot be touched by our styles,
 * and the shell's styles cannot restyle our surface beyond inheritance.
 */
import React from 'react';
import type { RocketRideClient } from 'rocketride';
import type { ShellAppProps } from 'shell';
import { useAuthUser, useShellConnection, useShellEvent, useWorkspace } from 'shell';
import { Toaster } from 'sonner';
import { LK_CSS } from './styles.generated';
import { LkThemeProvider, useLkTheme } from './theme';
import { NavProvider, useNav } from './nav';
import { initBlobStore } from './data/blobstore';
import { ingestShellEvent } from './data/trace';
import { seedVenuesIfEmpty } from './data/seed';
import { initRunner } from './data/runner';
import { AppChrome } from './components/launchkit/app-chrome';
import { LkErrorBoundary } from './components/launchkit/error-boundary';
import HomePage from './pages/home';
import { NavigatorHome } from './components/launchkit/navigator-home';
import DashboardPage from './pages/dashboard';
import LaunchesPage from './pages/launches';
import NewLaunchPage from './pages/new-launch';
import RunsPage from './pages/runs';
import SettingsPage from './pages/settings';
import WorkspacePage from './pages/workspace';

const STYLE_ID = 'lk-styles';

/** Inject the compiled design system exactly once for the app's lifetime. */
function useDesignSystem() {
  React.useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = LK_CSS;
    document.head.appendChild(el);
    return () => {
      // another mounted instance may still need it; only remove our own copy
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

/** One page per NavState view — the shell-app stand-in for Next routes. */
function ActiveView() {
  const { nav } = useNav();
  switch (nav.view) {
    case 'home':
      // the conversation IS the landing; the product page follows on scroll
      return (
        <>
          <NavigatorHome />
          <HomePage />
        </>
      );
    case 'dashboard':
      return <DashboardPage />;
    case 'launches':
      return <LaunchesPage />;
    case 'new-launch':
      return <NewLaunchPage />;
    case 'runs':
      return <RunsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'workspace':
      return <WorkspacePage />;
  }
}

/**
 * Wires the data layer to the shell:
 *  - the store is the workspace appState (per-user, server-persisted, no cloud
 *    identity needed — unlike rocketride_sql, which the app cannot drive
 *    on-demand);
 *  - the runner uses the shared client for the AI pipelines (understand,
 *    brand, commercial, targets, assets, signals, rescore).
 * Re-initialised when the client or the workspace load state changes.
 */
const ConnectedApp: React.FC = () => {
  const { client } = useShellConnection();
  const identity = useAuthUser();
  const workspace = useWorkspace();
  // tracing layer 2: the shell re-broadcasts engine events; keep FLOW steps per pipe
  useShellEvent('shell:event', (p) => ingestShellEvent((p as { event?: unknown }).event));
  const [ready, setReady] = React.useState(false);
  const [slow, setSlow] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!client || !workspace?.loaded) {
      setReady(false);
      return;
    }
    // one runtime object; the shell .d.ts snapshot trails the rocketride types
    const c = client as unknown as RocketRideClient;
    initBlobStore(
      workspace.appState ?? {},
      workspace.updateAppState,
      identity?.displayName ?? identity?.email ?? 'user',
    );
    seedVenuesIfEmpty();
    initRunner(c);
    setReady(true);
    // appState is re-read only on the initial load; live writes go through
    // updateAppState, so we intentionally do not re-init on every appState tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, identity, workspace?.loaded]);

  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
        <p className="p-10 text-body text-muted-foreground">Connecting to RocketRide…</p>
        {slow && (
          <p className="px-10 text-body text-muted-foreground">
            Still connecting. If this persists, the shell hasn’t handed the app a workspace yet —
            client: {client ? 'ready' : 'none'}, workspace loaded: {String(Boolean(workspace?.loaded))}.
          </p>
        )}
      </div>
    );
  }

  return (
    <NavProvider>
      <AppChrome>
        <ActiveView />
      </AppChrome>
    </NavProvider>
  );
};

const Root: React.FC<ShellAppProps> = () => {
  useDesignSystem();
  const { resolvedTheme } = useLkTheme();
  return (
    <div id="lk-root" className={resolvedTheme === 'dark' ? 'lk-root dark' : 'lk-root'}>
      <LkErrorBoundary>
        <ConnectedApp />
      </LkErrorBoundary>
      <Toaster position="bottom-right" />
    </div>
  );
};

const App: React.FC<ShellAppProps> = (props) => (
  <LkThemeProvider>
    <Root {...props} />
  </LkThemeProvider>
);

export default App;
