'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Button (components/buttons.md)
 *
 * Six variants, one rule: the primary action on a screen is graphite.
 * `flare` is reserved for the gate verb (Approve) and nothing else, so the
 * accent keeps its meaning. Sizes: sm 32, md 36 (default), lg 44.
 * Loading locks the width so the layout never reflows.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'flare' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const BASE =
  'relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control font-medium ' +
  'transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-(--duration-fast) ease-standard ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/0.1)] hover:bg-primary-hover',
  secondary:
    'border border-border-strong bg-secondary text-secondary-foreground shadow-card hover:bg-secondary-hover',
  ghost: 'text-foreground hover:bg-accent',
  flare:
    'bg-flare text-flare-foreground shadow-[0_1px_2px_oklch(0_0_0/0.14),inset_0_1px_0_0_oklch(1_0_0/0.2)] hover:bg-flare-hover',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
  link: 'h-auto rounded-none px-0 text-foreground underline-offset-4 hover:text-link-hover hover:underline',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-small [&_svg]:size-3.5',
  md: 'h-9 px-3.5 text-small [&_svg]:size-4',
  lg: 'h-11 px-5 text-body [&_svg]:size-4',
  icon: 'size-9 p-0 [&_svg]:size-4',
  'icon-sm': 'size-8 p-0 [&_svg]:size-3.5',
};

export function buttonClasses(
  opts: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
): string {
  const { variant = 'secondary', size = 'md', className } = opts;
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Loading state: spinner + progressive label, width locked. */
  loading?: boolean;
  loadingLabel?: React.ReactNode;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'secondary',
    size = 'md',
    loading,
    loadingLabel,
    disabled,
    type = 'button',
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size }), loading && 'grid place-items-center', className)}
      {...props}
    >
      {loading ? (
        <>
          {/* both labels share one grid cell; the wider one sets the width */}
          <span aria-hidden className="invisible col-start-1 row-start-1 inline-flex items-center gap-2">
            {children}
          </span>
          <span className="col-start-1 row-start-1 inline-flex items-center gap-2">
            <Loader2 className="animate-spin" aria-hidden />
            {loadingLabel ?? children}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

export type LinkButtonProps = Omit<React.ComponentProps<typeof Link>, 'className'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/** A link that looks like a button. Never nest a <button> inside an <a>. */
export function LinkButton({ variant = 'secondary', size = 'md', className, ...props }: LinkButtonProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
