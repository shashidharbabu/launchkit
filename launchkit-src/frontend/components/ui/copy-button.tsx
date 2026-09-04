'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

/** Copy with verb-echo toast + 1.5s go-check confirmation (components.md). */
export function CopyButton({
  text,
  label,
  toastMessage = 'Copied',
  ...props
}: ButtonProps & { text: string; label: string; toastMessage?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        toast(toastMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      {...props}
    >
      {copied ? (
        <Check size={14} strokeWidth={1.5} className="text-go" />
      ) : (
        <Copy size={14} strokeWidth={1.5} />
      )}
      {label}
    </Button>
  );
}
