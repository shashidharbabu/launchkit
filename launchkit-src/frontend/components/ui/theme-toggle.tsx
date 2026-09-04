'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Day console ↔ night console (01-direction.md — full dark mode ships). */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" aria-hidden className="w-9" />;
  const night = resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      aria-label={night ? 'Switch to day console' : 'Switch to night console'}
      title={night ? 'Day console' : 'Night console'}
      onClick={() => setTheme(night ? 'light' : 'dark')}
    >
      {night ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
    </Button>
  );
}
