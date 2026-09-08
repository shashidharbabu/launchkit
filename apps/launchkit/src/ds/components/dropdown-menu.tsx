'use client';

import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { cn } from '../lib/cn';

/**
 * Dropdown menu on Base UI's Menu. Raised surface, 16px radius, items are
 * 36px rows with a hover wash. Destructive items read in the failure color.
 */
export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

export function DropdownMenuContent({
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof Menu.Popup> & {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner side={side} align={align} sideOffset={sideOffset} className="z-(--z-dialog) outline-none">
        <Menu.Popup
          className={cn(
            'min-w-48 origin-(--transform-origin) rounded-panel border border-border bg-surface-raised p-1.5 text-body shadow-raised',
            'transition-[opacity,transform] duration-(--duration-base) ease-standard',
            'data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
            className,
          )}
          {...props}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof Menu.Item> & { destructive?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-default select-none items-center gap-2.5 rounded-control px-2.5 py-2 text-small outline-none',
        'data-[highlighted]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
        destructive && 'text-nogo-text [&_svg]:text-nogo-text',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Menu.Separator className={cn('my-1.5 h-px bg-border', className)} />;
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof Menu.GroupLabel>) {
  return <Menu.GroupLabel className={cn('px-2.5 py-1.5 text-label text-muted-foreground', className)} {...props} />;
}
