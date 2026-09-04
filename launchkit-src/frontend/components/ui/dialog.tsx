'use client';

import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Floating layer: the only rounded (4px), shadowed things in the system.
 * Enter/exit via tw-animate-css keyed on Base UI's data attributes,
 * at --duration-slow for dialogs (components.md, motion.md).
 */
export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & { showClose?: boolean }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-foreground/20 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-280" />
      <BaseDialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-lg border border-border bg-popover p-6 text-popover-foreground shadow-float',
          'transition-[opacity,transform] duration-280',
          'data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0',
          'data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0',
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <BaseDialog.Close
            aria-label="Close"
            className="absolute right-2 top-2 grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
          >
            <X size={16} strokeWidth={1.5} />
          </BaseDialog.Close>
        )}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      className={cn('text-title font-semibold tracking-[-0.005em]', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      className={cn('mt-2 text-body text-muted-foreground', className)}
      {...props}
    />
  );
}

/** Side sheet (run history): floating layer sliding from the right. */
export function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-foreground/20 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-280" />
      <BaseDialog.Popup
        className={cn(
          'fixed inset-y-2 right-2 z-50 w-full max-w-md overflow-y-auto',
          'rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-float',
          'transition-[opacity,transform] duration-280',
          'data-[starting-style]:translate-x-4 data-[starting-style]:opacity-0',
          'data-[ending-style]:translate-x-4 data-[ending-style]:opacity-0',
          className,
        )}
        {...props}
      >
        {children}
        <BaseDialog.Close
          aria-label="Close"
          className="absolute right-2 top-2 grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground"
        >
          <X size={16} strokeWidth={1.5} />
        </BaseDialog.Close>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}
