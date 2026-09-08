'use client';

import * as React from 'react';
import { AlertCircle, Check, ChevronDown } from 'lucide-react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn } from '../lib/cn';

/**
 * Forms (components/inputs-forms.md)
 *
 * Label above, control, helper below; an error replaces the helper at the
 * field. Controls are 40px tall, 16px text, raised white, with a flare
 * focus ring. Never placeholder-as-label.
 */

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-small font-medium text-foreground', className)} {...props} />;
}

export const CONTROL =
  'w-full rounded-control border border-input bg-surface-raised text-body text-foreground ' +
  'transition-[border-color,box-shadow] duration-(--duration-fast) ' +
  'placeholder:text-muted-foreground hover:border-border-strong ' +
  'focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/25 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-invalid:border-nogo aria-invalid:focus:ring-nogo/25';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn('h-10 px-3', CONTROL, className)}
      {...props}
    />
  );
});

/** Autogrows to `maxRows`, then scrolls. */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; maxRows?: number }
>(function Textarea({ className, invalid, rows = 3, maxRows = 10, onInput, ...props }, ref) {
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const line = 24;
    el.style.height = `${Math.min(el.scrollHeight, maxRows * line + 20)}px`;
  };
  return (
    <textarea
      ref={ref}
      rows={Math.max(rows, 2)}
      onInput={(e) => {
        grow(e.currentTarget);
        onInput?.(e);
      }}
      aria-invalid={invalid || undefined}
      className={cn('min-h-[5.5rem] resize-y px-3 py-2.5 leading-6', CONTROL, className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...props }, ref) {
  return (
    <span className="relative block">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn('h-10 appearance-none pl-3 pr-9', CONTROL, className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.75}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
});

/** A native checkbox with a drawn box, so it works without JS and reads with a keyboard. */
export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <span className={cn('relative inline-flex size-[18px] shrink-0 align-middle', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          'flex size-full items-center justify-center rounded-[5px] border border-border-strong bg-surface-raised',
          'transition-colors duration-(--duration-fast)',
          'peer-hover:border-foreground/40 peer-checked:border-flare peer-checked:bg-flare',
          'peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/30 peer-disabled:opacity-50',
          'peer-checked:[&>svg]:opacity-100',
        )}
      >
        <Check size={12} strokeWidth={3} className="text-flare-foreground opacity-0" />
      </span>
    </span>
  );
});

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof BaseSwitch.Root>) {
  return (
    <BaseSwitch.Root
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full bg-border-strong p-0.5',
        'transition-colors duration-(--duration-base) data-[checked]:bg-flare',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
        className,
      )}
      {...props}
    >
      <BaseSwitch.Thumb className="block size-5 rounded-full bg-surface-raised shadow-raised transition-transform duration-(--duration-base) ease-standard data-[checked]:translate-x-4" />
    </BaseSwitch.Root>
  );
}

export function Field({
  label,
  htmlFor,
  helper,
  error,
  children,
  className,
  trailing,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  helper?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Right-aligned text beside the label ("Optional"). */
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {trailing && <span className="text-label text-muted-foreground">{trailing}</span>}
      </div>
      {children}
      {error ? (
        <p role="alert" className="flex items-start gap-1.5 text-small text-nogo-text">
          <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : helper ? (
        <p className="text-small text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
