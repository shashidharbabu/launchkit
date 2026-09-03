import { AppLayout } from 'shell';
import { AppNav } from './app-nav';
import { CommandPalette } from './command-palette';
import { LkErrorBoundary } from './error-boundary';
import { TooltipProvider } from '../ui/tooltip';
import { useNav } from '../../nav';

/**
 * App chrome: the main menu is a single top bar on every view. (It lived in the
 * shell's sidebar slot briefly; that slot renders outside the app's React tree,
 * and the workspace drew its own copy underneath — two menus. One bar, rendered
 * once, here.) The workspace supplies its own left rail for the seven stages.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const { nav } = useNav();
  const fullBleed = nav.view === 'workspace' || nav.view === 'home';
  return (
    <TooltipProvider>
      <AppLayout>
        <div className="flex min-h-full flex-col bg-background text-foreground">
          <LkErrorBoundary>
            <AppNav />
          </LkErrorBoundary>
          {fullBleed ? (
            <div className="flex-1">{children}</div>
          ) : (
            <main className="w-full flex-1 px-6 py-6">{children}</main>
          )}
        </div>
      </AppLayout>
      <CommandPalette />
    </TooltipProvider>
  );
}
