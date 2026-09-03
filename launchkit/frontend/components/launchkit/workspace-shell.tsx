'use client';

import Link from 'next/link';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { useProject } from '@/components/launchkit/project-provider';
import { AppNav } from '@/components/launchkit/app-nav';
import { StageRail } from '@/components/launchkit/stage-rail';
import { RunningIndicator } from '@/components/launchkit/running-indicator';
import { RunHistory } from '@/components/launchkit/run-history';
import { CommandPalette } from '@/components/launchkit/command-palette';
import { Button } from '@/components/ui/button';
import { DelayedSkeleton } from '@/components/ui/skeleton';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { project, loaded, error, running, failed, retryFailed } = useProject();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <AppNav />
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-end justify-between gap-3 px-4 pb-3 pt-4">
          <div className="min-w-0">
            <Link
              href="/launches"
              className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-link hover:text-link-hover"
            >
              Launches
            </Link>
            {project ? (
              <>
                <h1 className="mt-0.5 truncate text-display font-semibold tracking-[-0.01em]">
                  {project.name}
                </h1>
                {project.site_url && (
                  <a
                    href={project.site_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-data text-link hover:text-link-hover"
                  >
                    {project.site_url}
                    <ExternalLink size={12} strokeWidth={1.5} />
                  </a>
                )}
              </>
            ) : loaded ? null : (
              <div className="mt-1 grid gap-1.5">
                <DelayedSkeleton className="h-8 w-64" />
                <DelayedSkeleton className="h-4 w-40" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {running && <RunningIndicator kind={running.kind} since={running.since} />}
            {project && <RunHistory projectId={project.id} running={Boolean(running)} />}
          </div>
        </div>
        <StageRail />
      </header>

      {error && (
        <div className="mx-auto w-full max-w-5xl px-4 pt-4">
          <div className="flex items-start gap-2 border border-nogo bg-nogo/10 p-3 text-body text-foreground">
            <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-nogo" />
            <span className="min-w-0 flex-1">{error}</span>
            {failed && (
              <Button variant="secondary" disabled={Boolean(running)} onClick={retryFailed}>
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {!loaded && !error ? (
          <div className="grid gap-4">
            <DelayedSkeleton className="h-40 w-full" />
            <DelayedSkeleton className="h-24 w-full" />
          </div>
        ) : (
          children
        )}
      </main>
      <CommandPalette />
    </div>
  );
}
