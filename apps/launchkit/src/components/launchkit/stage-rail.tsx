import { useReducedMotion } from 'motion/react';
import { Lock } from 'lucide-react';
import { AnimatedBackground } from '../motion-primitives/animated-background';
import { Tooltip } from '../ui/tooltip';
import { useProject, type StageDot } from './project-provider';
import { STAGES } from '../../lib/stages';
import { DUR, EASE_STANDARD } from '../../lib/motion';
import { cn } from '../../lib/utils';
import { useNav } from '../../nav';

const DOT: Record<StageDot, string> = {
  go: 'bg-go',
  hold: 'bg-hold',
  nogo: 'bg-nogo',
  none: 'bg-border',
};

/**
 * The seven-stage procedure line — the app's only navigation (components.md).
 * Each tab is a route; locked stages stay visible with a lock + tooltip.
 */
export function StageRail() {
  const { nav, go, href } = useNav();
  const id = nav.projectId;
  const stage = nav.stage;
  const { gate1, stageDots } = useProject();
  const reduced = useReducedMotion();

  return (
    <nav aria-label="Stages" className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap px-4">
        <AnimatedBackground
          enableHover
          className="bg-muted"
          transition={reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE_STANDARD }}
        >
          {STAGES.map((s) => {
            const locked = !gate1 && s.slug !== 'profile';
            const active = stage === s.slug;
            const label = (
              <span
                className={cn(
                  'flex items-center gap-1.5 font-mono text-meta font-medium uppercase tracking-[0.08em]',
                  active ? 'text-foreground' : 'text-muted-foreground',
                  locked && 'opacity-50',
                )}
              >
                <span
                  aria-hidden
                  className={cn('h-1.5 w-1.5 rounded-full', DOT[stageDots[s.slug]])}
                />
                {s.num} {s.name}
                {locked && <Lock size={12} strokeWidth={1.5} aria-label="Locked" />}
              </span>
            );
            return (
              <a
                key={s.slug}
                data-id={s.slug}
                href={href({ view: 'workspace', projectId: id, stage: s.slug })}
                onClick={(e) => {
                  e.preventDefault();
                  go({ view: 'workspace', projectId: id, stage: s.slug });
                }}
                aria-current={active ? 'page' : undefined}
                className="relative px-3 py-3"
              >
                {locked ? (
                  <Tooltip content="Approve the profile to unlock">{label}</Tooltip>
                ) : (
                  label
                )}
                {active && (
                  <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />
                )}
              </a>
            );
          })}
        </AnimatedBackground>
      </div>
    </nav>
  );
}
