'use client';

import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { cn } from '../lib/cn';

export const TooltipProvider = BaseTooltip.Provider;

/** Dark, small, quick. Tooltips explain; they never carry required information. */
export function Tooltip({
  content,
  children,
  side = 'bottom',
}: {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6} className="z-(--z-dialog)">
          <BaseTooltip.Popup
            className={cn(
              'max-w-xs rounded-control bg-foreground px-2.5 py-1.5 text-small text-background shadow-raised',
              'transition-[opacity,transform] duration-(--duration-fast) ease-standard',
              'data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0',
            )}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
