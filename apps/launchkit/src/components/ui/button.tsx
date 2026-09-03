import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'default' | 'compact';

const VARIANTS: Record<Variant, string> = {
  // The one ember verb per view, carries real weight and a press.
  primary:
    'bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0.209_0.01_268/0.25),inset_0_1px_0_oklch(1_0_0/0.15)] ' +
    'hover:bg-primary-hover hover:shadow-[0_2px_6px_oklch(0.209_0.01_268/0.3),inset_0_1px_0_oklch(1_0_0/0.15)] ' +
    'active:shadow-[inset_0_1px_2px_oklch(0.209_0.01_268/0.25)]',
  secondary:
    'border border-border bg-card text-secondary-foreground shadow-[0_1px_2px_oklch(0.209_0.01_268/0.06)] ' +
    'hover:bg-muted hover:border-[oklch(from_var(--foreground)_l_c_h/0.25)] ' +
    'active:shadow-[inset_0_1px_2px_oklch(0.209_0.01_268/0.08)]',
  ghost: 'text-foreground hover:bg-accent',
  destructive:
    'bg-nogo text-nogo-foreground shadow-[0_1px_2px_oklch(0.209_0.01_268/0.25)] hover:opacity-90',
};

const SIZES: Record<Size, string> = {
  default: 'h-9 px-4', // 36px tall
  compact: 'h-8 px-3', // 32px in tables
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Loading state: spinner replaces the icon, label switches to the
   *  progressive verb, width stays locked to prevent reflow. */
  loading?: boolean;
  loadingLabel?: string;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = 'secondary', size = 'default', loading, loadingLabel, disabled, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-grid select-none place-items-center rounded-lg text-body font-medium',
          'transition-all duration-120 active:translate-y-[1px]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0',
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      >
        {/* both labels occupy the same grid cell — the wider locks the width */}
        <span
          className={cn(
            'col-start-1 row-start-1 inline-flex items-center gap-1.5 whitespace-nowrap',
            loading && 'invisible',
          )}
        >
          {children}
        </span>
        <span
          aria-hidden={!loading}
          className={cn(
            'col-start-1 row-start-1 inline-flex items-center gap-1.5 whitespace-nowrap',
            !loading && 'invisible',
          )}
        >
          <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
          {loadingLabel ?? children}
        </span>
      </button>
    );
  },
);
