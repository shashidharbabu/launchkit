import { Moon, Sun } from 'lucide-react';
import { Button } from '@launchkit/design-system/components/button';
import { useLkTheme } from '../../theme';

/**
 * The app's own theme toggle (ADOPT-SHELL-APP.md step 4): it drives
 * theme.tsx, which puts `.dark` on #lk-root rather than <html>, so the
 * package's next-themes toggle cannot be used. Styled with the package's
 * ghost icon button; the label names the theme it switches to.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useLkTheme();
  const dark = resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
