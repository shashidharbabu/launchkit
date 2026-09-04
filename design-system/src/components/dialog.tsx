'use client';

import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { cn } from '../lib/cn';

/**
 * Dialog + Sheet (components/dialogs-sheets.md)
 *
 * The floating layer: 16px radius, raised surface, overlay shadow, a soft
 * scrim. Enter/exit via Base UI's data attributes at --duration-slow.
 */
export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

const BACKDROP =
  'fixed inset-0 z-(--z-overlay) bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-(--duration-slow) ' +
  'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0';

function CloseButton() {
  return (
    <BaseDialog.Close
      aria-label="Close"
      className="absolute right-3 top-3 grid size-9 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <X size={16} strokeWidth={1.75} />
    </BaseDialog.Close>
  );
}

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & { showClose?: boolean }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={BACKDROP} />
      <BaseDialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-(--z-dialog) w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-panel border border-border bg-surface-raised p-6 text-foreground shadow-overlay',
          'transition-[opacity,transform] duration-(--duration-slow) ease-standard',
          'data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0',
          'data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0',
          className,
        )}
        {...props}
      >
        {children}
        {showClose && <CloseButton />}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof BaseDialog.Title>) {
  return <BaseDialog.Title className={cn('pr-8 text-title', className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialog.Description>) {
  return <BaseDialog.Description className={cn('mt-2 text-body text-muted-foreground', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex flex-wrap justify-end gap-2', className)} {...props} />;
}

/** Side sheet: slides in from the right, floats inside the viewport edge. */
export function SheetContent({
  className,
  children,
  side = 'right',
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & { side?: 'left' | 'right' }) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={BACKDROP} />
      <BaseDialog.Popup
        className={cn(
          'fixed inset-y-3 z-(--z-dialog) flex w-[calc(100%-1.5rem)] max-w-md flex-col overflow-y-auto',
          'rounded-panel border border-border bg-surface-raised p-6 text-foreground shadow-overlay',
          'transition-[opacity,transform] duration-(--duration-slow) ease-standard',
          'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
          side === 'right'
            ? 'right-3 data-[starting-style]:translate-x-6 data-[ending-style]:translate-x-6'
            : 'left-3 data-[starting-style]:-translate-x-6 data-[ending-style]:-translate-x-6',
          className,
        )}
        {...props}
      >
        {children}
        <CloseButton />
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}
