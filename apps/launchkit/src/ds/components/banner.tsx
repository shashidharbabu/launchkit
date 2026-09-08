import * as React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Banner (components/feedback-states.md)
 *
 * Inline, contextual, never a toast. Tone is a tint plus an icon plus the
 * words; the words carry the meaning. Errors say what happened and what
 * to do next, without apologising.
 */
export type BannerTone = 'info' | 'hold' | 'nogo' | 'go';

const TONE: Record<BannerTone, { cls: string; Icon: LucideIcon }> = {
  info: { cls: 'border-border bg-surface text-foreground', Icon: Info },
  hold: { cls: 'border-hold/30 bg-hold-soft text-hold-text', Icon: AlertTriangle },
  nogo: { cls: 'border-nogo/30 bg-nogo-soft text-nogo-text', Icon: AlertCircle },
  go: { cls: 'border-go/30 bg-go-soft text-go-text', Icon: CheckCircle2 },
};

export function Banner({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: BannerTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { cls, Icon } = TONE[tone];
  return (
    <div
      role={tone === 'nogo' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-card border px-4 py-3 text-body', cls, className)}
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn('text-small', title && 'mt-0.5')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Read lazily and defensively: consumers without a Node-style `process` (a Module
// Federation remote, a plain Vite app) must be able to import this module.
const API_URL =
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL : undefined) ?? 'http://localhost:8090';

/** The one message every list page shows when the backend is unreachable. */
export function BackendDownBanner({ action }: { action?: React.ReactNode }) {
  return (
    <Banner tone="nogo" title="The backend is not reachable." action={action}>
      Launch Kit expected it at <span className="font-mono text-data">{API_URL}</span>. Start it,
      then reload:{' '}
      <code className="font-mono text-data">
        .venv/bin/uvicorn app.main:app --app-dir backend --port 8090
      </code>
    </Banner>
  );
}
