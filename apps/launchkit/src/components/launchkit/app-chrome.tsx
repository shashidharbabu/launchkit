import { AppLayout } from 'shell';
import { AppSidebar } from './app-sidebar';
import { CommandPalette } from './command-palette';
import { LkErrorBoundary } from './error-boundary';
import { TooltipProvider } from '../ui/tooltip';
import { useNav } from '../../nav';
import { useLkTheme } from '../../theme';

/**
 * FULL-SCREEN frame: `<AppLayout>` with NO `sidebar` prop is, per the shell,
 * "a one-column app spanning the full client area". The shell renders no
 * sidebar column (and therefore no RocketRide/app-name header). The app owns
 * the whole surface and renders its own vertical rail INSIDE its own tree —
 * fully styled, fully in-context, exactly one brand/home affordance.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const { nav, go, href } = useNav();
  const { resolvedTheme, setTheme } = useLkTheme();
  const fullBleed = nav.view === 'workspace' || nav.view === 'home';
  return (
    <TooltipProvider>
      <AppLayout>
        <div className="flex min-h-full bg-background text-foreground">
          <aside className="w-[220px] shrink-0">
            <LkErrorBoundary>
              <AppSidebar
                nav={nav}
                go={go}
                href={href}
                resolvedTheme={resolvedTheme}
                onToggleTheme={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              />
            </LkErrorBoundary>
          </aside>
          <div className="min-w-0 flex-1">
            {fullBleed ? children : <main className="mx-auto w-full max-w-5xl px-6 py-6">{children}</main>}
          </div>
        </div>
      </AppLayout>
      <CommandPalette />
    </TooltipProvider>
  );
}
