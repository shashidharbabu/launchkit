import { ExternalLink } from 'lucide-react';
import { useProject } from './project-provider';
import { StageRail } from './stage-rail';
import { StageNext } from './stage-next';
import { RunningIndicator } from './running-indicator';
import { RunHistory } from './run-history';
import { Button } from '@launchkit/design-system/components/button';
import { Banner } from '@launchkit/design-system/components/banner';
import { DelayedSkeleton } from '@launchkit/design-system/components/skeleton';
import { PageContainer } from '@launchkit/design-system/components/page-container';
import { stageBySlug } from '../../lib/stages';
import { useNav } from '../../nav';

/**
 * The workspace (patterns/workspace-stage-anatomy.md): a breadcrumb naming the
 * launch, then the stage's name and one-sentence summary with the running
 * indicator and run history on the right; the gantry on the left; the stage
 * body in the one page width every view uses.
 */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const { nav, go, href } = useNav();
  const { project, loaded, error, running, failed, retryFailed } = useProject();
  const stage = stageBySlug(nav.stage ?? 'profile');
  const host = project?.site_url ? project.site_url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="flex w-full flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 py-5 sm:px-8 lg:px-10">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 text-small text-muted-foreground" aria-label="Breadcrumb">
              <a
                href={href({ view: 'launches' })}
                onClick={(e) => {
                  e.preventDefault();
                  go({ view: 'launches' });
                }}
                className="hover:text-link-hover"
              >
                Launches
              </a>
              <span aria-hidden>/</span>
              {project ? (
                <>
                  <span className="text-foreground">{project.name}</span>
                  {project.site_url && (
                    <a
                      href={project.site_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-data hover:text-link-hover"
                    >
                      {host}
                      <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
                    </a>
                  )}
                </>
              ) : loaded ? null : (
                <DelayedSkeleton className="h-4 w-40" />
              )}
            </p>
            <h1 className="mt-2 text-display text-balance">{stage?.name ?? 'Stage'}</h1>
            {stage?.summary && <p className="mt-2 max-w-2xl text-body text-muted-foreground">{stage.summary}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {running && <RunningIndicator kind={running.kind} since={running.since} />}
            {project && <RunHistory projectId={project.id} running={Boolean(running)} />}
          </div>
        </div>
      </header>
      <div className="flex w-full flex-1">
        <aside className="hidden w-sidebar shrink-0 border-r border-border bg-sidebar lg:block">
          <div className="sticky top-0">
            <StageRail />
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <PageContainer className="grid gap-5">
            {error && (
              <Banner
                tone="nogo"
                title={error}
                action={
                  failed ? (
                    <Button variant="secondary" size="sm" disabled={Boolean(running)} onClick={retryFailed}>
                      Retry
                    </Button>
                  ) : undefined
                }
              />
            )}
            <div className="lg:hidden">
              <StageRail />
            </div>
            {!loaded && !error ? (
              <div className="grid gap-4">
                <DelayedSkeleton className="h-40 w-full" />
                <DelayedSkeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                {children}
                <StageNext />
              </>
            )}
          </PageContainer>
        </main>
      </div>
    </div>
  );
}
