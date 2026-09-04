'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Visible label above the control — never placeholder-as-label (components.md). */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-body font-medium text-foreground', className)}
      {...props}
    />
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-9 w-full rounded-sm border bg-card px-3 text-body text-foreground',
        'placeholder:text-muted-foreground',
        invalid ? 'border-nogo' : 'border-input',
        className,
      )}
      {...props}
    />
  );
});

/** Autogrows from 3 rows to 8, then scrolls (components.md · Forms). */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, rows = 3, onInput, ...props }, ref) {
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const line = 20; // --text-body line-height
    el.style.height = `${Math.min(el.scrollHeight, 8 * line + 16)}px`;
  };
  return (
    <textarea
      ref={ref}
      rows={Math.max(rows, 3)}
      onInput={(e) => {
        grow(e.currentTarget);
        onInput?.(e);
      }}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full resize-y rounded-sm border bg-card p-3 text-body leading-5 text-foreground',
        'placeholder:text-muted-foreground',
        invalid ? 'border-nogo' : 'border-input',
        className,
      )}
      {...props}
    />
  );
});

/**
 * Field = label above, control, helper faint below; an error replaces the
 * helper in nogo with an alert-circle icon, at the field — not just a top
 * summary.
 */
export function Field({
  label,
  htmlFor,
  helper,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="flex items-start gap-1.5 text-body text-nogo">
          <AlertCircle size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helper ? (
        <p className="text-body text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
