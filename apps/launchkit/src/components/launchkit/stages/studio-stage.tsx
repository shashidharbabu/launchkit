import * as React from 'react';
import { toast } from 'sonner';
import { Download, ExternalLink } from 'lucide-react';
import { useProject } from '../project-provider';
import { Card, CardHeader, CardBody, HonestEmpty, LockedGate, Orient, RawData } from '../stage-common';
import { Button } from '@launchkit/design-system/components/button';
import { Banner } from '@launchkit/design-system/components/banner';
import { Progress } from '@launchkit/design-system/components/progress';
import { StatusStamp, Badge } from '@launchkit/design-system/components/status-stamp';
import { ProvenanceLine } from '@launchkit/design-system/components/provenance-line';
import { Field, Input } from '@launchkit/design-system/components/field';
import { api } from '../../../data/api';
import { forgeHealth, getStudioStep, studioUrl, subscribeStudioStep } from '../../../data/studio';
import { studioJobKind, type ConceptBeat, type SlotSpec, type StudioStep } from '../../../domain/studio';
import { actionError } from '../../../lib/errors';
import type { StudioRow } from '../../../lib/types';
import { useNav } from '../../../nav';

const asStr = (v: unknown) => (v == null ? '' : String(v));
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

type Role = { hex: string; source: string };
type Logo = { kind: string; url: string; w?: number; h?: number; picked?: boolean; source?: string };
type CardOut = { name: string; label: string; use: string; w: number; h: number; url: string };

function MetaLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-label text-muted-foreground">{children}</p>;
}

function hostOf(url: string): string {
  try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; }
}

function when(row: StudioRow | null): string {
  if (!row?.created_at) return '';
  const d = new Date(row.created_at);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** The forge's step text while a studio run is live: "rendering 43%: streaming frame". */
function RunningLine({ label }: { label: string }) {
  const step = React.useSyncExternalStore(subscribeStudioStep, getStudioStep, getStudioStep);
  const pct = /(\d{1,3})%/.exec(step);
  return (
    <div className="grid max-w-md gap-2">
      <span className="text-shimmer text-small">{step || label}</span>
      {pct && <Progress value={Number(pct[1])} label={`Rendering, ${pct[1]}%`} />}
    </div>
  );
}

/** Observed roles with their evidence; the scale is derived from the primary. */
function Palette({ palette }: { palette: Record<string, unknown> }) {
  const roles = asObj(palette.roles) as Record<string, Role>;
  const scale = asObj(asObj(palette.scale).steps) as Record<string, string>;
  const checks = asObj(palette.checks) as Record<string, number>;
  const notes = asArr(palette.notes).map(asStr);
  const order = ['surface', 'ink', 'primary', 'accent', 'on_primary'];
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {order.filter((k) => roles[k]).map((k) => (
          <div key={k} className="flex items-center gap-3">
            <span aria-hidden className="size-8 shrink-0 rounded-control border border-border" style={{ background: roles[k].hex }} />
            <div className="min-w-0">
              <p className="text-small font-medium">
                {k.replace('_', ' ')} <span className="ml-1 font-mono text-data text-muted-foreground">{roles[k].hex}</span>
              </p>
              <p className="truncate text-label text-muted-foreground">{roles[k].source}</p>
            </div>
          </div>
        ))}
      </div>
      {Object.keys(scale).length > 0 && (
        <div>
          <MetaLabel>Primary scale, 50 to 950</MetaLabel>
          <div className="mt-1 flex h-7 overflow-hidden rounded-control border border-border" role="img" aria-label="Eleven steps of the primary colour">
            {Object.entries(scale).map(([step, hex]) => (
              <span key={step} title={`${step} ${hex}`} className="flex-1" style={{ background: hex }} />
            ))}
          </div>
        </div>
      )}
      {Object.keys(checks).length > 0 && (
        <p className="text-small text-muted-foreground">
          Contrast: ink on surface {checks.ink_on_surface}:1, primary on surface {checks.primary_on_surface}:1, text on primary {checks.on_primary_on_primary}:1.
        </p>
      )}
      {notes.length > 0 && (
        <ul className="grid gap-0.5 text-small text-muted-foreground">
          {notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}
    </div>
  );
}

function Logos({ logos }: { logos: Logo[] }) {
  if (logos.length === 0) {
    return <p className="text-small text-muted-foreground">No logo found on the page. The cards use a monogram in your primary colour, labelled as generated.</p>;
  }
  return (
    <div className="flex flex-wrap gap-3">
      {logos.map((l, i) => (
        <div key={i} className="flex items-center gap-2 rounded-control border border-border p-2">
          <img src={l.url} alt="" className="h-10 max-w-32 object-contain" />
          <div>
            <p className="text-small">{l.kind.replace(/-/g, ' ')}{l.picked && <Badge tone="go" className="ml-2">Picked</Badge>}</p>
            {l.w ? <p className="font-mono text-data text-muted-foreground">{l.w}×{l.h}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProbeView({ row }: { row: StudioRow }) {
  const d = row.data;
  const fonts = asObj(d.fonts);
  return (
    <div className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-[240px_minmax(0,1fr)]">
        {asStr(d.screenshot_url) && (
          <a href={asStr(d.screenshot_url)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-control border border-border">
            <img src={asStr(d.screenshot_url)} alt={`Screenshot of ${hostOf(asStr(d.site_url))}`} className="block w-full" />
          </a>
        )}
        <Palette palette={asObj(d.palette)} />
      </div>
      <div>
        <MetaLabel>Logo</MetaLabel>
        <div className="mt-1"><Logos logos={asArr(d.logos) as Logo[]} /></div>
      </div>
      <div>
        <MetaLabel>Type observed</MetaLabel>
        <p className="mt-0.5 text-small">
          Headings <span className="font-mono text-data">{asStr(fonts.heading) || 'not observed'}</span>, body <span className="font-mono text-data">{asStr(fonts.body) || 'not observed'}</span>. The cards and the reel use the kit&rsquo;s own faces; these are recorded for your brand sheet.
        </p>
      </div>
      <ProvenanceLine parts={[`Read from ${hostOf(asStr(d.site_url))}`, when(row)].filter(Boolean)} />
      <RawData data={d} />
    </div>
  );
}

function CardsView({ row }: { row: StudioRow }) {
  const cards = asArr(row.data.cards) as CardOut[];
  return (
    <div className="grid gap-4">
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <figure key={c.name} className="grid gap-1.5">
            {/* one preview height for every size, so the captions line up */}
            <a href={c.url} target="_blank" rel="noreferrer" className="flex h-52 items-center justify-center overflow-hidden rounded-control border border-border bg-surface p-2">
              <img src={c.url} alt={`${c.label}, ${c.w} by ${c.h}`} className="max-h-full max-w-full object-contain" />
            </a>
            <figcaption className="flex items-center justify-between gap-2 text-small">
              <span>{c.label} <span className="font-mono text-data text-muted-foreground">{c.w}×{c.h}</span></span>
              <a href={c.url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:text-link-hover">
                <Download size={14} strokeWidth={1.75} aria-hidden /> PNG
              </a>
            </figcaption>
            <p className="text-label text-muted-foreground">For {c.use}.</p>
          </figure>
        ))}
      </div>
      <ProvenanceLine parts={[`Rendered from the site read and the approved profile`, when(row)].filter(Boolean)} />
    </div>
  );
}

/** The script: every slot editable, with the limit the renderer enforces shown as a counter. */
function ScriptEditor({ row, disabled, onSaved }: { row: StudioRow; disabled: boolean; onSaved: () => void }) {
  const d = row.data;
  const spec = asObj(d.spec);
  const beats = asArr(spec.beats) as ConceptBeat[];
  const specs = asArr(spec.slots) as SlotSpec[];
  const byId = new Map(specs.map((s) => [s.id, s]));
  const saved = asObj(d.slots) as Record<string, string>;
  const [slots, setSlots] = React.useState<Record<string, string>>(saved);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { setSlots(asObj(row.data.slots) as Record<string, string>); }, [row.id, row.data.slots]);
  const dirty = specs.some((s) => (slots[s.id] ?? '') !== (saved[s.id] ?? ''));
  const clamped = new Set(asArr(d.clamped).map(asStr));
  const claims = asArr(d.claims_used).map(asStr);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.editStudioScript(row.id, slots);
      toast.success(r.clamped.length ? `Script saved. ${r.clamped.length} line${r.clamped.length === 1 ? '' : 's'} trimmed to fit.` : 'Script saved.');
      onSaved();
    } catch (e) {
      toast.error(actionError('save the script', e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5">
      {asStr(d.notes) && <p className="text-body text-muted-foreground">{asStr(d.notes)}</p>}
      <div className="grid gap-5">
        {beats.map((b) => (
          <fieldset key={b.t} className="grid gap-3 border-t border-border pt-4">
            <legend className="sr-only">{b.what}</legend>
            <p className="text-small">
              <span className="font-mono text-data text-muted-foreground">{b.t} s</span> <span className="ml-2">{b.what}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {b.slots.map((id) => {
                const s = byId.get(id);
                if (!s) return null;
                const v = slots[id] ?? '';
                return (
                  <Field
                    key={id}
                    label={id.replace(/_/g, ' ')}
                    htmlFor={`slot-${row.id}-${id}`}
                    helper={`${v.length}/${s.max}${s.hint ? `. ${s.hint}` : ''}`}
                    error={v.length > s.max ? `Over by ${v.length - s.max}; it will be trimmed to fit.` : undefined}
                  >
                    <Input
                      id={`slot-${row.id}-${id}`}
                      value={v}
                      maxLength={Math.max(s.max + 12, 12)}
                      disabled={disabled}
                      spellCheck={false}
                      className="font-mono uppercase"
                      onChange={(e) => setSlots((cur) => ({ ...cur, [id]: e.target.value }))}
                    />
                    {clamped.has(id) && <Badge tone="hold" className="mt-1">Trimmed to fit</Badge>}
                  </Field>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      {claims.length > 0 && (
        <div>
          <MetaLabel>Claims used</MetaLabel>
          <ul className="mt-1 grid gap-0.5 text-small text-muted-foreground">
            {claims.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={dirty ? 'primary' : 'secondary'} size="sm" disabled={!dirty || disabled} loading={saving} loadingLabel="Saving" onClick={save}>
          Save edits
        </Button>
        <span className="text-small text-muted-foreground">
          Version {row.version}{row.status === 'edited' ? ', edited by you' : ''}. Everything renders in capitals.
        </span>
      </div>
      <RawData data={d} />
    </div>
  );
}

function ReelView({ row, script, disabled, onChanged }: { row: StudioRow; script: StudioRow | null; disabled: boolean; onChanged: () => void }) {
  const d = row.data;
  const approved = row.status === 'approved';
  const [approving, setApproving] = React.useState(false);
  const stale = script ? asStr(d.script_id) !== script.id || (script.status === 'edited' && asStr(d.script_id) === script.id && Boolean(asObj(script.data).edited)) : false;
  const mb = Number(d.bytes ?? 0) / 1048576;
  const approve = async () => {
    setApproving(true);
    try {
      await api.approveStudio(row.id);
      toast.success('Reel approved.');
      onChanged();
    } catch (e) {
      toast.error(actionError('approve the reel', e));
    } finally {
      setApproving(false);
    }
  };
  return (
    <div className="grid gap-4">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <video
          controls
          playsInline
          preload="metadata"
          poster={asStr(d.poster_url)}
          src={asStr(d.video_url)}
          className="aspect-[9/16] w-full rounded-control border border-border bg-black"
          aria-label={`Launch reel, ${asStr(d.duration)} seconds`}
        />
        <div className="grid content-start gap-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-small">
            <dt className="text-muted-foreground">Concept</dt><dd className="capitalize">{asStr(d.concept)}</dd>
            <dt className="text-muted-foreground">Length</dt><dd className="font-mono text-data">{asStr(d.duration)} s</dd>
            <dt className="text-muted-foreground">Frame</dt><dd className="font-mono text-data">{asStr(d.width)}×{asStr(d.height)}, {mb.toFixed(1)} MB, -14 LUFS</dd>
            <dt className="text-muted-foreground">Script</dt><dd>version {asStr(d.script_version)}{stale ? ', the script has changed since' : ''}</dd>
            <dt className="text-muted-foreground">Logo</dt><dd>{d.logo_used ? 'the site’s own mark on the lockup' : 'none found on the site, text lockup only'}</dd>
          </dl>
          {stale && (
            <Banner tone="hold" title="This reel was rendered from an earlier script.">
              Render again to see your edits on screen.
            </Banner>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <a href={asStr(d.video_url)} download target="_blank" rel="noreferrer">
              <Button variant="secondary" size="sm">
                <Download aria-hidden /> Download MP4
              </Button>
            </a>
            <a href={asStr(d.video_url)} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm">
                Open in a tab <ExternalLink aria-hidden />
              </Button>
            </a>
            {/* the card header carries the Approved stamp; here only the act itself */}
            {!approved && (
              <Button variant="primary" size="sm" disabled={disabled} loading={approving} loadingLabel="Approving" onClick={approve}>
                Approve reel
              </Button>
            )}
          </div>
        </div>
      </div>
      {asStr(d.strip_url) && (
        <figure className="grid gap-1">
          <img src={asStr(d.strip_url)} alt="Eight frames of the reel, left to right" className="block w-full rounded-control border border-border" />
          <figcaption className="text-label text-muted-foreground">Eight frames, evenly spaced, so you can read the film without playing it.</figcaption>
        </figure>
      )}
      <ProvenanceLine parts={['Rendered on this machine from the script and the site read', when(row)].filter(Boolean)} />
      <RawData data={d} />
    </div>
  );
}

/**
 * Assets (workspace-stage-anatomy.md): the site read, the brand kit, the reel.
 * Each is a run the builder starts; the two renders need the Studio service.
 */
export function StudioStage() {
  const { project, gate1, studio, brandDna, running, runJob, refresh } = useProject();
  const { go, href } = useNav();
  const [serviceDown, setServiceDown] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    forgeHealth().then(() => { if (!cancelled) setServiceDown(false); }).catch(() => { if (!cancelled) setServiceDown(true); });
    return () => { cancelled = true; };
  }, [running]);

  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const runningKind = running?.kind ?? '';
  const busy = Boolean(runningKind);
  const latest = (kind: string) => studio.find((r) => r.kind === kind) ?? null;
  const probe = latest('probe');
  const kit = latest('kit');
  const script = latest('script');
  const reel = latest('reel');
  const start = (step: StudioStep) => runJob(studioJobKind(step), () => api.runStudio(project.id, step)).then(refresh);
  const is = (step: StudioStep) => runningKind === studioJobKind(step);
  const nothing = studio.length === 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Orient
        lead={
          <>
            Launch Kit turns what it knows about your app into a brand kit, launch cards and a 24-second reel.{' '}
            <strong className="font-medium">Read the site first</strong>, then make the cards and write the reel.
          </>
        }
        detail={
          brandDna
            ? 'Colours and the logo come from your live site, the words from your approved profile and Business DNA. Nothing here is invented.'
            : 'Colours and the logo come from your live site, the words from your approved profile. Extract the Business DNA on the Brand stage first if you want the reel in that voice.'
        }
        runKind="studio:reel"
      />

      {serviceDown && (
        <Banner
          tone="hold"
          title="The Studio service is not running."
          action={
            <a href={href({ view: 'settings' })} onClick={(e) => { e.preventDefault(); go({ view: 'settings' }); }}>
              <Button variant="secondary" size="sm">Open Settings</Button>
            </a>
          }
        >
          Reading the site and rendering need a browser and ffmpeg, so they run on your machine. Start it with{' '}
          <code className="font-mono text-data">cd services/studio-forge &amp;&amp; npm start</code> (address {studioUrl()}), then come back.
        </Banner>
      )}

      {/* ---- Site read ---- */}
      <Card>
        <CardHeader
          title="Site read"
          description="Colours, logo and type, observed on your live site."
          actions={
            <>
              {probe && <StatusStamp kind="go" label="Read" />}
              {probe && (
                <Button variant="secondary" size="sm" disabled={busy} loading={is('probe')} loadingLabel="Reading" onClick={() => start('probe')}>
                  Read again
                </Button>
              )}
            </>
          }
        />
        <CardBody>
          {is('probe') ? (
            <RunningLine label="Opening the site" />
          ) : probe ? (
            <ProbeView row={probe} />
          ) : (
            <HonestEmpty
              fact="No site read yet."
              reason={`Launch Kit opens ${hostOf(project.site_url)} in a browser, takes the colours from its styles and a screenshot, and keeps the logo it finds. The kit and the reel are built from this.`}
              runKind="studio:probe"
              action={<Button variant="secondary" disabled={busy || serviceDown === true} onClick={() => start('probe')}>Read the site</Button>}
            />
          )}
        </CardBody>
      </Card>

      {/* ---- Cards ---- */}
      <Card>
        <CardHeader
          title="Launch cards"
          description="Five sizes in your colours, with your logo or a monogram."
          actions={
            <>
              {kit && <StatusStamp kind="go" label="Rendered" />}
              {kit && (
                <Button variant="secondary" size="sm" disabled={busy || !probe} loading={is('kit')} loadingLabel="Rendering" onClick={() => start('kit')}>
                  Remake
                </Button>
              )}
            </>
          }
        />
        <CardBody>
          {is('kit') ? (
            <RunningLine label="Rendering the cards" />
          ) : kit ? (
            <CardsView row={kit} />
          ) : (
            <HonestEmpty
              fact="No cards yet."
              reason={probe
                ? 'Five sizes rendered from the site read: link preview, feed, story, repo banner and icon. Each is a PNG you can download.'
                : 'Cards are rendered from the site read. Read the site first.'}
              runKind="studio:kit"
              action={<Button variant="secondary" disabled={busy || !probe || serviceDown === true} onClick={() => start('kit')}>Make the cards</Button>}
            />
          )}
        </CardBody>
      </Card>

      {/* ---- Reel ---- */}
      <Card>
        <CardHeader
          title="Launch reel"
          description="24 seconds of kinetic type in your colours and your voice. Concept: Signal."
          actions={
            <>
              {reel && <StatusStamp kind={reel.status === 'approved' ? 'go' : 'hold'} label={reel.status === 'approved' ? 'Approved' : 'Rendered'} />}
              {script && (
                <Button variant="secondary" size="sm" disabled={busy} loading={is('script')} loadingLabel="Writing" onClick={() => start('script')}>
                  Rewrite
                </Button>
              )}
              {script && (
                <Button variant={reel ? 'secondary' : 'primary'} size="sm" disabled={busy || !probe || serviceDown === true} loading={is('reel')} loadingLabel="Rendering" onClick={() => start('reel')}>
                  {reel ? 'Render again' : 'Render the reel'}
                </Button>
              )}
            </>
          }
        />
        <CardBody className="grid gap-6">
          {is('script') && <RunningLine label="Writing the script in your voice" />}
          {is('reel') && <RunningLine label="Rendering the reel" />}
          {!script && !is('script') && (
            <HonestEmpty
              fact="No script yet."
              reason="Launch Kit writes the film's thirty-odd lines from your profile, in your Business DNA voice when you have one, and never invents a number. You can edit every line before rendering."
              runKind="studio:script"
              action={<Button variant="secondary" disabled={busy || serviceDown === true} onClick={() => start('script')}>Write the script</Button>}
            />
          )}
          {reel && !is('reel') && <ReelView row={reel} script={script} disabled={busy} onChanged={refresh} />}
          {script && !is('script') && (
            <div className="grid gap-3">
              <p className="text-body text-muted-foreground">
                {reel ? 'The script the reel was rendered from. Edit a line, save, then render again.' : 'Check every line, then render. The limits are the film’s: longer lines shrink on screen or get trimmed.'}
              </p>
              <ScriptEditor row={script} disabled={busy} onSaved={refresh} />
              {!probe && (
                <Banner tone="hold" title="Read the site before rendering.">
                  The reel takes its colours and logo from the site read.
                </Banner>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {nothing && !busy && (
        <p className="text-small text-muted-foreground">
          This stage is optional. The plan assembles without it.
        </p>
      )}
    </div>
  );
}
