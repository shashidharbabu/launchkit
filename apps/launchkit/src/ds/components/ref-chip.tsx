'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * RefChip: a tracked-link ref as a copyable pill. Mono text on a flare
 * tint; the tint is allowed because the ref is the one thing on a plan
 * row the builder must take away. Click copies the full URL.
 */
export function RefChip({ refCode, url, className }: { refCode: string; url: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy tracked link ${refCode}`}
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        toast('Link copied');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full bg-flare-soft px-2.5 font-mono text-data text-flare-text',
        'transition-colors duration-(--duration-fast) hover:bg-flare-soft/70',
        className,
      )}
    >
      {refCode}
      {copied ? (
        <Check size={12} strokeWidth={2.5} className="text-go-text" aria-hidden />
      ) : (
        <Copy size={12} strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
