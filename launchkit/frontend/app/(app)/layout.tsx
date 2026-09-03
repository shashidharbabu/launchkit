import { AppNav } from '@/components/launchkit/app-nav';
import { CommandPalette } from '@/components/launchkit/command-palette';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
        <AppNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <CommandPalette />
      </div>
    </TooltipProvider>
  );
}
