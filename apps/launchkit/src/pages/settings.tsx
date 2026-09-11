import * as React from 'react';
import { BRAND } from '../brand/assets';
import { Button } from '@launchkit/design-system/components/button';
import { Badge, StatusStamp } from '@launchkit/design-system/components/status-stamp';
import { Card, CardHeader, CardBody } from '@launchkit/design-system/components/card';
import { Banner } from '@launchkit/design-system/components/banner';
import { Segmented } from '@launchkit/design-system/components/segmented';
import { PageContainer } from '@launchkit/design-system/components/page-container';
import { PageHeader } from '@launchkit/design-system/components/page-header';
import { Field, Input } from '@launchkit/design-system/components/field';
import { RulebookEditor } from '../components/launchkit/rulebook-editor';
import { WorkspaceCard } from '../components/launchkit/workspace-card';
import { api } from '../data/api';
import { getSetting, setSetting } from '../data/settings';
import { DEFAULT_STUDIO_URL, STUDIO_URL_KEY, forgeHealth, type ForgeHealth } from '../data/studio';
import { SHOW_RAW_KEY } from '../components/launchkit/stage-common';
import { TIER_LABEL, getTier, subscribe, unsubscribe, type Tier } from '../lib/subscription';
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

/**
 * The Studio service: the local half of the Assets stage (it needs a browser
 * and ffmpeg, which the pipeline runtime does not have). Its address is a
 * setting; the check reports what it found on the machine it runs on.
 */
function StudioCard() {
  const [url, setUrl] = React.useState(() => getSetting(STUDIO_URL_KEY) || DEFAULT_STUDIO_URL);
  const [health, setHealth] = React.useState<ForgeHealth | null>(null);
  const [down, setDown] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);

  const save = () => {
    const v = url.trim().replace(/\/+$/, '') || DEFAULT_STUDIO_URL;
    setUrl(v);
    setSetting(STUDIO_URL_KEY, v);
  };
  const check = React.useCallback(async () => {
    setChecking(true);
    try {
      setHealth(await forgeHealth());
      setDown(null);
    } catch (e) {
      setHealth(null);
      setDown(String(e instanceof Error ? e.message : e));
    } finally {
      setChecking(false);
    }
  }, []);
  React.useEffect(() => {
    check();
  }, [check]);

  return (
    <Card>
      <CardHeader
        title="Studio service"
        description="Reads your site, makes the launch images, renders the cards and the reel, and speaks the voice-over. Runs where a browser and ffmpeg live: this machine for now."
        actions={
          health ? <StatusStamp kind={health.ok ? 'go' : 'hold'} label={health.ok ? 'Running' : 'Incomplete'} />
            : down ? <StatusStamp kind="nogo" label="Not running" /> : undefined
        }
      />
      <CardBody className="grid gap-4">
        <Field label="Address" htmlFor="studio-url" className="max-w-md" helper="Default http://localhost:3500. Change it if the service runs elsewhere.">
          <Input
            id="studio-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            spellCheck={false}
          />
        </Field>
        {health && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-small">
            <dt className="text-muted-foreground">Version</dt><dd className="font-mono text-data">{health.version}</dd>
            <dt className="text-muted-foreground">Browser</dt><dd className="font-mono text-data">{health.chromium ?? 'missing (npx playwright install chromium)'}</dd>
            <dt className="text-muted-foreground">ffmpeg</dt><dd className="font-mono text-data">{health.ffmpeg ? health.ffmpeg.replace(/ Copyright.*$/, '') : 'missing'}</dd>
            <dt className="text-muted-foreground">Renderer</dt><dd className="font-mono text-data">{health.hyperframes}</dd>
            <dt className="text-muted-foreground">Images</dt><dd className="font-mono text-data">{health.images?.enabled ? `${health.images.model} (OpenAI key on the service)` : 'off: put OPENAI_API_KEY in services/studio-forge/.env'}</dd>
            <dt className="text-muted-foreground">Voice</dt><dd className="font-mono text-data">{health.voice?.enabled ? `${health.voice.engine} (open source, on the service)` : 'off: install Chatterbox or Kokoro on the service'}</dd>
            <dt className="text-muted-foreground">Concepts</dt><dd>{health.concepts.map((c) => c.title).join(', ') || 'none'}</dd>
          </dl>
        )}
        {down && (
          <Banner tone="hold" title="The Studio service is not running.">
            Start it in a terminal: <code className="font-mono text-data">cd services/studio-forge &amp;&amp; npm start</code>. It listens on the address above. Nothing else in Launch Kit needs it.
          </Banner>
        )}
        <div>
          <Button variant="secondary" loading={checking} loadingLabel="Checking" onClick={check}>
            Check service
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

/**
 * The subscription placeholder (lib/subscription.ts): the tier lives in the
 * store until the shell's billing hooks land. Pro unlocks the plan document.
 */
function SubscriptionCard() {
  const [tier, setTier] = React.useState<Tier>(() => getTier());
  return (
    <Card>
      <CardHeader
        title="Subscription"
        description="Pro unlocks the launch plan as a downloadable PDF document."
        actions={<Badge tone={tier === 'pro' ? 'go' : 'neutral'}>{TIER_LABEL[tier]}</Badge>}
      />
      <CardBody className="grid gap-3">
        <Segmented
          ariaLabel="Subscription tier"
          value={tier}
          onChange={(v) => {
            if (v === 'pro') subscribe();
            else unsubscribe();
            setTier(v);
          }}
          options={[
            { value: 'free', label: 'Free' },
            { value: 'pro', label: 'Pro' },
          ]}
        />
        <p className="text-small text-muted-foreground">
          Billing is not wired yet: this switch stands in for the subscription until the shell&rsquo;s checkout lands.
        </p>
      </CardBody>
    </Card>
  );
}

export default function SettingsPage() {
  const [rawData, setRawData] = React.useState<'on' | 'off'>(() => (getSetting(SHOW_RAW_KEY) === 'on' ? 'on' : 'off'));
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
    <PageContainer className="grid grid-cols-[minmax(0,1fr)] gap-8">
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

      <StudioCard />
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
        <CardHeader title="Developer" description="Aids for building Launch Kit itself; builders never need these." />
        <CardBody className="grid gap-3">
          <Segmented
            ariaLabel="Raw pipeline output on stage cards"
            value={rawData}
            onChange={(v) => { setSetting(SHOW_RAW_KEY, v); setRawData(v); }}
            options={[
              { value: 'off', label: 'Raw data hidden' },
              { value: 'on', label: 'Raw data shown' },
            ]}
          />
          <p className="text-small text-muted-foreground">
            When shown, every stage card ends with a folded "Raw data" block holding the pipeline&rsquo;s exact output.
          </p>
        </CardBody>
      </Card>
      <SubscriptionCard />
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
            Launch Kit drafts everything; you approve everything. Three gates, eight stages, honest
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
