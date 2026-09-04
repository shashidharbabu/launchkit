import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * The one page width inside the app shell (patterns/page-anatomy.md).
 * Every page uses it, so every page has the same shape and size: a
 * 68rem column, centred, padded 40px at desktop. Narrow content (a form,
 * a settings group) lays itself out inside the column with a grid; it
 * never shrinks the page.
 */
export function PageContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-content px-5 py-8 sm:px-8 lg:px-10 lg:py-10', className)} {...props} />
  );
}
