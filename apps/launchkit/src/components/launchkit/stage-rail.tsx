import { Lock } from 'lucide-react';
import { Tooltip } from '../ui/tooltip';
import { useProject, type StageDot } from './project-provider';
import { STAGES } from '../../lib/stages';
import { cn } from '../../lib/utils';
import { useNav } from '../../nav';

const DOT: Record<StageDot, string> = {
  go: 'bg-go',
  hold: 'bg-hold',
  nogo: 'bg-nogo',
  none: 'bg-border',
};
const DOT_TITLE: Record<StageDot, string> = {
  go: 'Approved',
  hold: 'Waiting for you',
  nogo: 'Needs attention',
  none: 'Not started',
};

/**
 * The seven-stage procedure line, vertical: one step at a time down the left of
 * the workspace. A true sequence, so it reads as a numbered list rather than
 * tabs — the current step is the only highlighted row, finished steps carry
 * their verdict dot, and locked steps stay visible with the reason.
 */
export function StageRail() {
  const { nav, go, href } = useNav();
  const id = nav.projectId;
  const current = nav.stage ?? 'profile';
  const { gate1, stageDots } = useProject();

  return (
    <nav aria-label="Stages" className="w-full">
      <p className="px-4 pb-2 pt-4 font-mono text-meta uppercase tracking-[0.08em] text-muted-foreground">
        Seven stages
      </p>
      <ol className="flex flex-col">
        {STAGES.map((s) => {
          const active = current === s.slug;
          const locked = !gate1 && s.slug !== 'profile';
          const dot = stageDots[s.slug];
          const row = (
            <span
              className={cn(
                'flex items-center gap-3 border-l-2 px-4 py-2.5',
                active
                  ? 'border-primary bg-muted text-foreground'
                  : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                locked && 'opacity-55',
              )}
            >
              <span className="font-mono text-data tabular">{s.num}</span>
              <span className={cn('flex-1 text-body', active && 'font-medium')}>{s.name}</span>
              {locked ? (
                <Lock size={13} strokeWidth={1.5} aria-label="Locked" />
              ) : (
                <span
                  aria-hidden
                  title={DOT_TITLE[dot]}
                  className={cn('h-1.5 w-1.5 rounded-full', DOT[dot])}
                />
              )}
            </span>
          );
          return (
            <li key={s.slug}>
              {locked ? (
                <Tooltip content="Approve the profile first — every later stage is written from it.">
                  <span className="block cursor-not-allowed">{row}</span>
                </Tooltip>
              ) : (
                <a
                  href={href({ view: 'workspace', projectId: id, stage: s.slug })}
                  onClick={(e) => {
                    e.preventDefault();
                    go({ view: 'workspace', projectId: id, stage: s.slug });
                  }}
                  aria-current={active ? 'page' : undefined}
                  className="block"
                >
                  {row}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
