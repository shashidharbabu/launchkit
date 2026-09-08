'use client';

import * as React from 'react';
import { Check, Clock, HelpCircle, Loader2, X, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Badge + StatusStamp (components/status.md)
 *
 * A badge is a pill with a soft tint. A status stamp is a badge whose
 * label is fixed vocabulary: Approved, Needs review, Failed, Unverified,
 * Running, Queued, Not started. Status is never color alone; the word is
 * always present.
 */
export type BadgeTone = 'neutral' | 'flare' | 'go' | 'hold' | 'nogo' | 'outline';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-sunken text-muted-foreground',
  flare: 'bg-flare-soft text-flare-text',
  go: 'bg-go-soft text-go-text',
  hold: 'bg-hold-soft text-hold-text',
  nogo: 'bg-nogo-soft text-nogo-text',
  outline: 'border border-border-strong text-muted-foreground',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-label font-medium',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export type StampKind = 'go' | 'hold' | 'nogo' | 'unverified' | 'running' | 'queued' | 'none';

const STAMP: Record<StampKind, { label: string; tone: BadgeTone; Icon?: LucideIcon }> = {
  go: { label: 'Approved', tone: 'go', Icon: Check },
  hold: { label: 'Needs review', tone: 'hold', Icon: Clock },
  nogo: { label: 'Failed', tone: 'nogo', Icon: X },
  unverified: { label: 'Unverified', tone: 'outline', Icon: HelpCircle },
  running: { label: 'Running', tone: 'flare', Icon: Loader2 },
  queued: { label: 'Queued', tone: 'neutral', Icon: Clock },
  none: { label: 'Not started', tone: 'neutral' },
};

export function StatusStamp({
  kind,
  label,
  icon = true,
  className,
}: {
  kind: StampKind;
  /** Override the vocabulary when the status is a stage-specific word ("Done", "Selected"). */
  label?: string;
  icon?: boolean;
  className?: string;
}) {
  const s = STAMP[kind];
  return (
    <Badge tone={s.tone} className={className}>
      {icon && s.Icon && (
        <s.Icon
          size={12}
          strokeWidth={2.5}
          aria-hidden
          className={kind === 'running' ? 'animate-spin' : undefined}
        />
      )}
      {label ?? s.label}
    </Badge>
  );
}
