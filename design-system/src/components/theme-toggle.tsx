'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { Tooltip } from './tooltip';
import { useMounted } from '../lib/use-mounted';

/** Day pad / night pad. Both modes ship; this is the quick switch. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  if (!mounted) return <span aria-hidden className="inline-block size-9" />;
  const dark = resolvedTheme === 'dark';
  const label = dark ? 'Switch to light' : 'Switch to dark';
  return (
    <Tooltip content={label}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        className={className}
        onClick={() => setTheme(dark ? 'light' : 'dark')}
      >
        {dark ? <Sun strokeWidth={1.75} /> : <Moon strokeWidth={1.75} />}
      </Button>
    </Tooltip>
  );
}
