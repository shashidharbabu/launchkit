import { Check, Lock } from 'lucide-react';
import { Tooltip } from '@launchkit/design-system/components/tooltip';
import { cn } from '@launchkit/design-system/lib/cn';
import { useProject, type StageDot } from './project-provider';
import { STAGES } from '../../lib/stages';
import { useNav } from '../../nav';

const DOT_TITLE: Record<StageDot, string> = {
  go: 'approved',
  hold: 'waiting for you',
  nogo: 'needs attention',
  none: 'not started',
};

/**
 * The gantry (navigation.md): the seven stages as 40px rows on one vertical
 * track, each with a 32px node filled by its real state, a "Gate n" label
 * where the stage ends in a decision, and a lock while the profile is not
 * approved. The active row is raised; the track is the only structural line.
 */
export function StageRail() {
  const { nav, go, href } = useNav();
  const id = nav.projectId;
  const current = nav.stage ?? 'profile';
  const { gate1, stageDots } = useProject();
  return (
    <nav aria-label="Stages" className="w-full px-3 py-4">
      <p className="mb-2 px-1 text-label text-muted-foreground">Stages</p>
      <ol className="gantry-track flex flex-col gap-1">
        {STAGES.map((s) => {
          const active = current === s.slug;
          const locked = !gate1 && s.slug !== 'profile';
          const dot = stageDots[s.slug];
          const n = Number(s.num);
          const node = (
            <span
              aria-hidden
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-data tabular',
                dot === 'go' && 'border-go bg-go text-background',
                dot === 'hold' && 'border-hold-soft bg-hold-soft text-hold-text',
                dot === 'nogo' && 'border-nogo-soft bg-nogo-soft text-nogo-text',
                dot === 'none' && (active ? 'border-foreground bg-sidebar text-foreground' : 'border-border-strong bg-sidebar text-muted-foreground'),
              )}
            >
              {dot === 'go' ? <Check size={14} strokeWidth={3} /> : n}
            </span>
          );
          const row = (
            <span
              className={cn(
                'flex h-10 items-center gap-3 rounded-control pr-2 text-small font-medium transition-colors duration-(--duration-fast)',
                active ? 'bg-surface-raised text-foreground shadow-card' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                locked && 'opacity-60',
              )}
            >
              {node}
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              {s.gate && (
                <span className={cn('text-label', active ? 'text-flare-text' : 'text-faint-foreground')}>Gate {s.gate}</span>
              )}
              {locked && <Lock size={14} strokeWidth={1.75} aria-hidden />}
            </span>
          );
          const label = `${s.name}: ${DOT_TITLE[dot]}${locked ? ', locked' : ''}`;
          return (
            <li key={s.slug}>
              {locked ? (
                <Tooltip content="Approve the profile to unlock">
                  <span className="block cursor-not-allowed" aria-label={label}>{row}</span>
                </Tooltip>
              ) : (
                <a
                  href={href({ view: 'workspace', projectId: id, stage: s.slug })}
                  onClick={(e) => {
                    e.preventDefault();
                    go({ view: 'workspace', projectId: id, stage: s.slug });
                  }}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                  className="block rounded-control"
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
