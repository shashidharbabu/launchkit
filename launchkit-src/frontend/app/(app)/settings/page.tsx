'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useReducedMotion } from 'motion/react';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background';
import { Button } from '@/components/ui/button';
import { StatusStamp } from '@/components/ui/status-stamp';
import { Card } from '@/components/launchkit/stage-common';
import { DUR, EASE_STANDARD } from '@/lib/motion';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090';
const THEMES = [
  { id: 'light', label: 'Day console' },
  { id: 'dark', label: 'Night console' },
  { id: 'system', label: 'System' },
];

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [backendUp, setBackendUp] = React.useState<boolean | null>(null);

  const check = React.useCallback(async () => {
    setChecking(true);
    try {
      await api.listProjects();
      setBackendUp(true);
    } catch {
      setBackendUp(false);
    } finally {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);
    check();
  }, [check]);

  return (
    <div className="grid max-w-2xl gap-6">
      <h1 className="text-display font-semibold tracking-[-0.01em]">Settings</h1>

      <Card>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <MetaLabel>Connection</MetaLabel>
          {backendUp !== null &&
            (backendUp ? <StatusStamp kind="go" icon /> : <StatusStamp kind="nogo" icon />)}
        </div>
        <div className="grid gap-3 border-t border-border px-4 py-4">
          <div>
            <MetaLabel>Backend</MetaLabel>
            <p className="mt-0.5 font-mono text-data">{API_URL}</p>
          </div>
          {backendUp === false && (
            <p className="border border-nogo bg-nogo/10 p-3 text-body">
              Couldn&rsquo;t reach the backend. Start it, then check again:{' '}
              <code className="font-mono text-data">
                .venv/bin/uvicorn app.main:app --app-dir backend --port 8090
              </code>
            </p>
          )}
          <div>
            <Button variant="secondary" loading={checking} loadingLabel="Checking…" onClick={check}>
              Check connection
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="px-4 py-3">
          <MetaLabel>Console theme</MetaLabel>
        </div>
        <div className="grid gap-3 border-t border-border px-4 py-4">
          <p className="text-body text-muted-foreground">
            Day console is paper; night console is the same paperwork re-inked for midnight before
            a launch.
          </p>
          {mounted && (
            <div className="inline-flex self-start rounded-sm border border-border bg-background p-1">
              <AnimatedBackground
                defaultValue={theme ?? 'system'}
                onValueChange={(v) => v && setTheme(v)}
                className="bg-muted"
                transition={reduced ? { duration: 0 } : { duration: DUR.base, ease: EASE_STANDARD }}
              >
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    data-id={t.id}
                    type="button"
                    className={cn(
                      'px-3 py-2.5 text-body',
                      theme === t.id ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </AnimatedBackground>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="px-4 py-3">
          <MetaLabel>About</MetaLabel>
        </div>
        <div className="grid gap-1 border-t border-border px-4 py-4">
          <Image
            src="/brand/rocketride-logo-color.svg"
            alt="RocketRide"
            width={140}
            height={20}
            className="mb-2 dark:hidden"
          />
          <Image
            src="/brand/rocketride-logo-white.svg"
            alt="RocketRide"
            width={140}
            height={20}
            className="mb-2 hidden dark:block"
          />
          <p className="text-body">
            Launch Kit — GTM-in-a-box for RocketRide App Store publishers.
          </p>
          <p className="text-body text-muted-foreground">
            AI drafts everything; you approve everything. Three gates, seven stages, honest
            telemetry after liftoff.
          </p>
          <p className="mt-2 text-body text-muted-foreground">
            Flight Paperwork design system · assisted, never autonomous.
          </p>
        </div>
      </Card>
    </div>
  );
}
