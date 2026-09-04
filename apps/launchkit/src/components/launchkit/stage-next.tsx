import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useProject } from './project-provider';
import { useNav } from '../../nav';
import { STAGES } from '../../lib/stages';

/**
 * The way forward, on every stage: what this stage has produced so far, what
 * the plan still needs from it, and one button to the next stage. Only the
 * profile gate locks the sequence; everything else can be revisited.
 */
export function StageNext() {
  const { nav, go, href } = useNav();
  const { project, gate1, assets, targets } = useProject();
  if (nav.view !== 'workspace' || !project) return null;
  const current = String(nav.stage ?? 'profile');
  const idx = STAGES.findIndex((s) => s.slug === current);
  if (idx < 0 || idx === STAGES.length - 1) return null;
  const next = STAGES[idx + 1];
  const approvedAssets = assets.filter((a) => a.status === 'approved').length;
  const selectedTargets = targets.filter((t) => Boolean((t as { selected?: unknown }).selected)).length;
  let ready = true;
  let hint = '';
  switch (current) {
    case 'profile':
      ready = gate1;
      hint = gate1 ? 'Profile approved. Every later stage is written from it.' : 'Approve the profile to unlock every later stage.';
      break;
    case 'brand':
      hint = 'Brand DNA and a chosen campaign angle make every post sound like you. Both are optional.';
      break;
    case 'commercial':
      hint = 'Pricing and listing copy feed the posts and the plan.';
      break;
    case 'assets':
      ready = approvedAssets > 0;
      hint = approvedAssets > 0
        ? `${approvedAssets} post${approvedAssets === 1 ? '' : 's'} approved. Only approved posts enter the plan.`
        : 'Approve at least one post: only approved posts enter the plan.';
      break;
    case 'targets':
      ready = selectedTargets > 0;
      hint = selectedTargets > 0
        ? `${selectedTargets} venue${selectedTargets === 1 ? '' : 's'} selected. Each gets a tracked link in the plan.`
        : 'Tick at least one venue: only selected venues get tracked links in the plan.';
      break;
    case 'signals':
      hint = 'Signals are optional. The plan assembles without them.';
      break;
    default:
      break;
  }
  const locked = current === 'profile' && !gate1;
  const target = { view: 'workspace' as const, projectId: project.id, stage: next.slug };
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-body text-muted-foreground">{hint}</p>
      <a
        href={href(target)}
        aria-disabled={locked}
        onClick={(e) => {
          e.preventDefault();
          if (!locked) go(target);
        }}
      >
        <Button variant={ready ? 'primary' : 'secondary'} disabled={locked}>
          Next: {next.name}
          <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
        </Button>
      </a>
    </div>
  );
}
