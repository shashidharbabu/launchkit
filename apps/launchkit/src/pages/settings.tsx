import * as React from 'react';
import { BRAND } from '../brand/assets';
import { Button } from '@launchkit/design-system/components/button';
import { StatusStamp } from '@launchkit/design-system/components/status-stamp';
import { Card, CardHeader, CardBody } from '@launchkit/design-system/components/card';
import { Banner } from '@launchkit/design-system/components/banner';
import { Segmented } from '@launchkit/design-system/components/segmented';
import { PageContainer } from '@launchkit/design-system/components/page-container';
import { PageHeader } from '@launchkit/design-system/components/page-header';
import { RulebookEditor } from '../components/launchkit/rulebook-editor';
import { WorkspaceCard } from '../components/launchkit/workspace-card';
import { api } from '../data/api';
import { useLkTheme, type LkTheme } from '../theme';

const THEMES: Array<{ value: LkTheme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/** A section label inside a card: a noun in sentence case (voice.md). */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-label text-muted-foreground">{children}</p>;
}

export default function SettingsPage() {
  const { theme, setTheme } = useLkTheme();
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
    <PageContainer className="grid gap-8">
      <PageHeader title="Settings" />
      <div className="grid max-w-2xl gap-6">
      <Card>
        <CardHeader
          title="Connection"
          actions={
            backendUp !== null
              ? backendUp
                ? <StatusStamp kind="go" label="Connected" />
                : <StatusStamp kind="nogo" label="Unreachable" />
              : undefined
          }
        />
        <CardBody className="grid gap-4">
          <div>
            <SectionLabel>Store</SectionLabel>
            <p className="mt-0.5 font-mono text-data">RocketRide staging</p>
          </div>
          {backendUp === false && (
            <Banner tone="nogo" title="The RocketRide store is not reachable.">
              This is the app&rsquo;s data layer, not a local server: nothing to start. Retry in a
              moment; if it persists, the store needs attention.
            </Banner>
          )}
          <div>
            <Button variant="secondary" loading={checking} loadingLabel="Checking" onClick={check}>
              Check connection
            </Button>
          </div>
        </CardBody>
      </Card>

      <WorkspaceCard />
      <RulebookEditor />
      <Card>
        <CardHeader title="Theme" description="Light and dark are both designed; System follows your device." />
        <CardBody>
          {mounted && (
            <Segmented
              ariaLabel="Theme"
              value={theme ?? 'system'}
              onChange={(v) => setTheme(v)}
              options={THEMES}
            />
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="About" />
        <CardBody className="grid gap-1">
          <img
            src={BRAND.logoColor}
            alt="RocketRide"
            width={140}
            height={20}
            className="mb-2 dark:hidden"
          />
          <img
            src={BRAND.logoWhite}
            alt="RocketRide"
            width={140}
            height={20}
            className="mb-2 hidden dark:block"
          />
          <p className="text-body">
            Launch Kit: GTM-in-a-box for RocketRide App Store publishers.
          </p>
          <p className="text-body text-muted-foreground">
            Launch Kit drafts everything; you approve everything. Three gates, seven stages, honest
            telemetry after liftoff.
          </p>
          <p className="mt-2 text-small text-muted-foreground">
            Gantry design system. Assisted, never autonomous.
          </p>
        </CardBody>
      </Card>
      </div>
    </PageContainer>
  );
}
