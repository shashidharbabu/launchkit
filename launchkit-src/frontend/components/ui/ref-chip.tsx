'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The attribution ref as a copyable chip (components.md): Data mono, ember
 * text on a 10% ember fill, sharp. Click copies the full tracked URL.
 */
export function RefChip({
  refCode,
  url,
  className,
}: {
  refCode: string;
  url: string;
  className?: string;
}) {
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
        'inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-1.5 py-0.5',
        'font-mono text-data text-primary transition-colors duration-120 hover:bg-primary/20',
        className,
      )}
    >
      {refCode}
      {copied ? (
        <Check size={12} strokeWidth={1.5} className="text-go" />
      ) : (
        <Copy size={12} strokeWidth={1.5} />
      )}
    </button>
  );
}
