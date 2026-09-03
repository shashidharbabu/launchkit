import { Check, Clock, X, HelpCircle, Loader } from 'lucide-react';
import { TextShimmer } from '../motion-primitives/text-shimmer';
import { cn } from '../../lib/utils';

export type StampKind = 'go' | 'hold' | 'nogo' | 'unverified' | 'running';

/** Status is never color alone — the word is always present (color.md). */
const SPEC: Record<
  StampKind,
  { label: string; Icon: typeof Check; classes: string }
> = {
  go: { label: 'GO', Icon: Check, classes: 'border-go text-go bg-go/10' },
  hold: { label: 'HOLD', Icon: Clock, classes: 'border-hold text-hold bg-hold/10' },
  nogo: { label: 'NO-GO', Icon: X, classes: 'border-nogo text-nogo bg-nogo/10' },
  unverified: {
    label: 'UNVERIFIED',
    Icon: HelpCircle,
    classes: 'border-dashed border-unverified text-unverified',
  },
  running: { label: 'RUNNING', Icon: Loader, classes: 'border-link text-link bg-link/10' },
};

export function StatusStamp({
  kind,
  icon = false,
  className,
}: {
  kind: StampKind;
  icon?: boolean;
  className?: string;
}) {
  const { label, Icon, classes } = SPEC[kind];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-sm border px-1.5 py-0.5',
        'font-mono text-meta font-medium uppercase tracking-[0.08em]',
        classes,
        className,
      )}
    >
      {icon && (
        <Icon size={12} strokeWidth={1.5} className={kind === 'running' ? 'animate-spin' : undefined} />
      )}
      {kind === 'running' ? (
        <TextShimmer
          duration={2}
          className="text-meta text-link [--base-color:var(--color-link)] [--base-gradient-color:var(--color-link-hover)]"
        >
          {label}
        </TextShimmer>
      ) : (
        label
      )}
    </span>
  );
}
