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
import { Field, Input, Textarea } from '@launchkit/design-system/components/field';
import { api } from '../../../data/api';
import { forgeConcept, forgeHealth, getStudioStep, studioUrl, subscribeStudioStep, type ForgeHealth } from '../../../data/studio';
import { studioJobKind, wordCount, type ConceptBeat, type SlotSpec, type StudioStep } from '../../../domain/studio';
import { actionError } from '../../../lib/errors';
import type { StudioRow } from '../../../lib/types';
import { useNav } from '../../../nav';

const asStr = (v: unknown) => (v == null ? '' : String(v));
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const asNum = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

type Role = { hex: string; source: string };
type Logo = { kind: string; url: string; w?: number; h?: number; picked?: boolean; source?: string };
type CardOut = { name: string; label: string; use: string; w: number; h: number; url: string };
type PhotoOut = CardOut & { platform: string; headline?: string };
/** One shooting of a plate: the judge's scores and whether it won. */
type TakeOut = { take?: number; file?: string; url?: string; chosen?: boolean; score?: number | null; why?: string };
type PlateOut = {
  id: string; url: string; w?: number; h?: number; brief?: string; grade?: string; seconds?: number;
  takes?: TakeOut[]; failed_takes?: number; judge?: { model?: string; why?: string; ok?: boolean; fell_back?: boolean };
};
type VoiceOut = {
  id: string; text: string; at: number; until: number; seconds: number; words: number; tempo: number; fits: boolean;
  /** The word budget for the window: on rows spoken after an edit; older rows read it from the concept. */
  budget?: number; words_allowed?: number;
};

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
          Headings <span className="font-mono text-data">{asStr(fonts.heading) || 'not observed'}</span>, body <span className="font-mono text-data">{asStr(fonts.body) || 'not observed'}</span>. The cards and the reel use their own faces; these are recorded for your brand sheet.
        </p>
      </div>
      <ProvenanceLine parts={[`Read from ${hostOf(asStr(d.site_url))}`, when(row)].filter(Boolean)} />
      <RawData data={d} />
    </div>
  );
}

function CardFigure({ c, sub }: { c: CardOut; sub: string }) {
  return (
    <figure className="grid gap-1.5">
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
      <p className="text-label text-muted-foreground">{sub}</p>
    </figure>
  );
}

function CardsView({ row, imagesRow }: { row: StudioRow; imagesRow: StudioRow | null }) {
  const cards = asArr(row.data.cards) as CardOut[];
  const photos = asArr(row.data.images) as PhotoOut[];
  const zip = asStr(row.data.zip_url);
  // launch images made after these cards: the platform images are missing or out of date
  const stale = Boolean(imagesRow) && asStr(row.data.images_id) !== imagesRow?.id;
  return (
    <div className="grid gap-5">
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <CardFigure key={c.name} c={c} sub={`For ${c.use}.`} />)}
      </div>
      {photos.length > 0 && (
        <div className="grid gap-3">
          <div>
            <MetaLabel>Launch images, one per platform</MetaLabel>
            <p className="mt-0.5 text-small text-muted-foreground">The launch photograph under each platform&rsquo;s own headline: the first line of the post Social Launch wrote, or the tagline until one exists.</p>
          </div>
          <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((c) => <CardFigure key={c.name} c={c} sub={`For ${c.use}.${c.headline ? ` “${c.headline}”` : ''}`} />)}
          </div>
        </div>
      )}
      {stale && (
        <Banner tone="hold" title={photos.length ? 'New launch images since these cards.' : 'Launch images are ready.'}>
          Render the cards again to put them on the platform images.
        </Banner>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {zip && (
          <a href={zip} download target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm"><Download aria-hidden /> Download all (zip)</Button>
          </a>
        )}
        <ProvenanceLine parts={[photos.length ? 'Rendered from the site read, the approved profile and the launch images' : 'Rendered from the site read and the approved profile', when(row)].filter(Boolean)} />
      </div>
    </div>
  );
}

/** The four photographs: what each is for, the brief the pipe wrote, the file, and a retake of any one of them. */
function ImagesView({ row, disabled, onRetake }: { row: StudioRow; disabled: boolean; onRetake: (plateId: string) => void }) {
  const d = row.data;
  const list = asArr(d.images) as PlateOut[];
  const plates = asArr(d.plates) as Array<{ id: string; for: string; when: string }>;
  const where = (id: string) => {
    const p = plates.find((x) => x.id === id);
    return !p ? '' : p.for === 'cards' ? 'the launch cards' : `the film, ${p.when} s`;
  };
  // the signature things of the app's world the pipe listed before writing the briefs
  const domain = asArr(d.domain).map(asStr).map((s) => s.trim()).filter(Boolean);
  return (
    <div className="grid gap-4">
      {asStr(d.subject) && <p className="text-body text-muted-foreground">{asStr(d.subject)}</p>}
      {domain.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <MetaLabel>The world these pictures live in:</MetaLabel>
          {/* a phrase can run long: the pill wraps rather than widening the page on a phone */}
          {domain.map((w, i) => <Badge key={i} tone="neutral" className="h-auto max-w-full whitespace-normal py-0.5 text-left">{w}</Badge>)}
        </div>
      )}
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((im) => {
          const takes = asArr(im.takes) as TakeOut[];
          const others = takes.map((t, i) => ({ ...t, n: asNum(t.take) ?? i + 1 })).filter((t) => !t.chosen && t.url);
          const judgeWhy = asStr(asObj(im.judge).why).trim();
          const failed = asNum(im.failed_takes) ?? 0;
          return (
            <figure key={im.id} className="grid gap-1.5">
              <a href={im.url} target="_blank" rel="noreferrer" className="flex h-52 items-center justify-center overflow-hidden rounded-control border border-border bg-surface p-2">
                <img src={im.url} alt={`The ${im.id} photograph`} className="max-h-full max-w-full object-contain" />
              </a>
              <figcaption className="flex items-center justify-between gap-2 text-small">
                <span className="capitalize">{im.id} <span className="font-mono text-data text-muted-foreground">{im.w}×{im.h}</span></span>
                <span className="inline-flex items-center gap-3">
                  <button type="button" disabled={disabled} onClick={() => onRetake(im.id)} className="text-link hover:text-link-hover disabled:opacity-50">Another take</button>
                  <a href={im.url} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:text-link-hover">
                    <Download size={14} strokeWidth={1.75} aria-hidden /> JPG
                  </a>
                </span>
              </figcaption>
              <p className="text-label text-muted-foreground">For {where(im.id)}.</p>
              {im.brief && <p className="text-label text-muted-foreground" title={im.brief}>{im.brief.length > 150 ? `${im.brief.slice(0, 150).replace(/\s+\S*$/, '')}…` : im.brief}</p>}
              {takes.length > 1 && (
                <p className="text-label text-muted-foreground">
                  Best of {takes.length} takes{judgeWhy ? `: ${judgeWhy}` : '.'}{failed > 0 ? ` ${failed} more take${failed === 1 ? '' : 's'} failed.` : ''}
                  {others.length > 0 && (
                    <>
                      {' '}
                      {others.map((t, i) => (
                        <React.Fragment key={t.n}>
                          {i > 0 ? ', ' : ''}
                          <a href={t.url} target="_blank" rel="noreferrer" className="text-link hover:text-link-hover">See take {t.n}</a>
                        </React.Fragment>
                      ))}
                      .
                    </>
                  )}
                </p>
              )}
            </figure>
          );
        })}
      </div>
      <ProvenanceLine parts={[`Made on this machine with ${asStr(d.model) || 'the Studio service’s image model'} from briefs written from your profile`, when(row)].filter(Boolean)} />
      <RawData data={d} />
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

/**
 * The concept's word budget per spoken line, read once from the forge and
 * shown beside each window as a hint. The forge measures the truth when the
 * line is spoken; a row spoken after an edit carries its budgets itself.
 */
const budgetCache = new Map<string, Promise<Record<string, number>>>();
function useVoiceBudgets(concept: string): Record<string, number> {
  const [budgets, setBudgets] = React.useState<Record<string, number>>({});
  React.useEffect(() => {
    if (!concept) return;
    let cancelled = false;
    let p = budgetCache.get(concept);
    if (!p) {
      p = forgeConcept(concept)
        .then((spec) => Object.fromEntries((spec.voice?.segments ?? []).map((s) => [s.id, s.words])))
        .catch(() => { budgetCache.delete(concept); return {}; });
      budgetCache.set(concept, p);
    }
    p.then((b) => { if (!cancelled) setBudgets(b); });
    return () => { cancelled = true; };
  }, [concept]);
  return budgets;
}

/**
 * The voice-over, editable: the five spoken lines each in its window with the
 * word budget and a live count, the measured take under each, the preview over
 * the music. Save speaks every line again on the Studio service and keeps the
 * result as a new version, so the reel knows it is behind.
 */
function VoiceEditor({ row, script, disabled, onSpeak }: {
  row: StudioRow; script: StudioRow; disabled: boolean; onSpeak: (lines: Record<string, string>) => Promise<void>;
}) {
  const d = row.data;
  const segs = asArr(d.segments) as VoiceOut[];
  const budgets = useVoiceBudgets(asStr(d.concept));
  const spokenKey = segs.map((s) => s.text).join('');
  const [texts, setTexts] = React.useState<Record<string, string>>(() => Object.fromEntries(segs.map((s) => [s.id, s.text])));
  // a new take (a new row, or new words on it) resets the editor; a failed save keeps what was typed
  React.useEffect(() => {
    setTexts(Object.fromEntries((asArr(row.data.segments) as VoiceOut[]).map((s) => [s.id, s.text])));
  }, [row.id, spokenKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [speaking, setSpeaking] = React.useState(false);
  const dirty = segs.some((s) => (texts[s.id] ?? '').replace(/\s+/g, ' ').trim() !== s.text);
  const empty = segs.some((s) => !(texts[s.id] ?? '').trim());
  const stale = asStr(d.script_id) !== script.id;
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

  const speak = async () => {
    setSpeaking(true);
    try {
      await onSpeak(Object.fromEntries(segs.map((s) => [s.id, (texts[s.id] ?? '').replace(/\s+/g, ' ').trim()])));
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <div className="grid gap-4">
      {stale && (
        <Banner tone="hold" title="The script changed since this voice-over.">
          Rewrite it so the lines land on the new beats, or edit the lines here and speak them again.
        </Banner>
      )}
      <audio controls preload="metadata" src={asStr(d.preview_url)} className="w-full max-w-xl" aria-label="The voice-over, previewed over the music" />
      <div className="grid gap-4 sm:grid-cols-2">
        {segs.map((s) => {
          const v = texts[s.id] ?? '';
          const n = wordCount(v);
          const budget = asNum(s.budget) ?? asNum(s.words_allowed) ?? asNum(budgets[s.id]);
          const changed = v.replace(/\s+/g, ' ').trim() !== s.text;
          const over = budget != null && n > budget;
          const measured = `${plural(n, 'word')}, ${s.seconds} s spoken${s.tempo > 1.001 ? `, ${Math.round((s.tempo - 1) * 100)}% faster to fit` : ''}${s.fits ? ', fits its window.' : '.'}`;
          const helper = changed ? `${plural(n, 'word')}, not spoken yet. Save and speak again to measure it.` : measured;
          const error = over
            ? `Over the budget by ${plural(n - (budget ?? 0), 'word')}: it may not fit its window.`
            : !changed && s.fits === false
              ? `${measured} Still over its window even 15% faster: shorten it and speak again.`
              : undefined;
          return (
            <Field
              key={s.id}
              label={<span className="capitalize">{s.id.replace(/_/g, ' ')}</span>}
              htmlFor={`voice-${row.id}-${s.id}`}
              trailing={`${s.at} to ${s.until} s${budget != null ? `, up to ${budget} words` : ''}`}
              helper={helper}
              error={error}
            >
              <Textarea
                id={`voice-${row.id}-${s.id}`}
                value={v}
                rows={2}
                maxLength={400}
                disabled={disabled}
                className="min-h-16"
                onChange={(e) => setTexts((cur) => ({ ...cur, [s.id]: e.target.value }))}
              />
            </Field>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={dirty ? 'primary' : 'secondary'} size="sm" disabled={!dirty || empty || disabled} loading={speaking} loadingLabel="Speaking" onClick={speak}>
          Save and speak again
        </Button>
        <span className="text-small text-muted-foreground">
          Version {row.version}{row.status === 'edited' ? ', edited by you' : ''}. Saving speaks every line again on this machine.
        </span>
      </div>
      <ProvenanceLine parts={[`Spoken with ${asStr(d.engine) || 'the Studio service'}${asStr(d.tone) ? `, ${asStr(d.tone)}` : ''}`, when(row)].filter(Boolean)} />
    </div>
  );
}

/** One of the three steps inside the Launch reel card: a numbered chip, the name, one line on what to do. */
function StepHeading({ n, name, description, actions }: { n: number; name: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      {/* a basis keeps the words in a readable column on a phone: the button wraps under them instead of squeezing them */}
      <div className="flex min-w-0 flex-1 basis-64 items-start gap-3">
        <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-data font-medium text-primary-foreground">{n}</span>
        <div className="min-w-0">
          <h4 className="text-body font-medium"><span className="sr-only">Step {n} of 3: </span>{name}</h4>
          <p className="mt-0.5 text-small text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

function ReelView({ row, script, imagesRow, voiceRow, disabled, onChanged }: { row: StudioRow; script: StudioRow | null; imagesRow: StudioRow | null; voiceRow: StudioRow | null; disabled: boolean; onChanged: () => void }) {
  const d = row.data;
  const approved = row.status === 'approved';
  const [approving, setApproving] = React.useState(false);
  const stale = script ? asStr(d.script_id) !== script.id || (script.status === 'edited' && asStr(d.script_id) === script.id && Boolean(asObj(script.data).edited)) : false;
  const platesUsed = asArr(d.plates_used).map(asStr);
  const voiceUsed = asArr(d.voice_used).map(asStr);
  const staleImages = Boolean(imagesRow) && asStr(d.images_id) !== imagesRow?.id;
  const staleVoice = Boolean(voiceRow) && asStr(d.voice_id) !== voiceRow?.id;
  // a spoken line past its window is audible in the film; the reel is not approved over it
  const voiceFits = !voiceRow || voiceUsed.length === 0 || asObj(voiceRow.data).all_fit !== false;
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
      {/* the film first and large: it is what the three steps are for */}
      <div className="grid gap-5 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
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
            <dt className="text-muted-foreground">Concept</dt><dd>{asStr(d.concept_title) || asStr(d.concept)}</dd>
            <dt className="text-muted-foreground">Length</dt><dd className="font-mono text-data">{asStr(d.duration)} s</dd>
            <dt className="text-muted-foreground">Frame</dt><dd className="font-mono text-data">{asStr(d.width)}×{asStr(d.height)}, {mb.toFixed(1)} MB, -14 LUFS</dd>
            <dt className="text-muted-foreground">Script</dt><dd>version {asStr(d.script_version)}{stale ? ', the script has changed since' : ''}</dd>
            <dt className="text-muted-foreground">Logo</dt><dd>{d.logo_used ? 'the site’s own mark on the lockup' : 'none found on the site, text lockup only'}</dd>
            <dt className="text-muted-foreground">Photos</dt><dd>{platesUsed.length > 0 ? `${platesUsed.length} launch images behind the problem and the arrival` : 'none, drawn scenes only'}</dd>
            <dt className="text-muted-foreground">Voice</dt><dd>{voiceUsed.length > 0 ? `your pitch in ${voiceUsed.length} lines, mixed under the music` : 'none, music only'}</dd>
          </dl>
          {stale && (
            <Banner tone="hold" title="This reel was rendered from an earlier script.">
              Render again to see your edits on screen.
            </Banner>
          )}
          {staleImages && !stale && (
            <Banner tone="hold" title={platesUsed.length > 0 ? 'New launch images since this reel.' : 'Launch images are ready.'}>
              Render again to put them behind the problem and the arrival.
            </Banner>
          )}
          {staleVoice && !stale && !staleImages && (
            <Banner tone="hold" title={voiceUsed.length > 0 ? 'New voice-over since this reel.' : 'The voice-over is ready.'}>
              Render again to hear it under the music.
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
              <Button variant="primary" size="sm" disabled={disabled || !voiceFits} loading={approving} loadingLabel="Approving" onClick={approve}>
                Approve reel
              </Button>
            )}
            {!approved && !voiceFits && (
              <span className="text-small text-nogo-text">A spoken line runs past its window: shorten it in the voice-over step, speak it again, then render again.</span>
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
      <ProvenanceLine parts={[`Rendered on this machine from the script and the site read${platesUsed.length > 0 ? ', the launch images' : ''}${voiceUsed.length > 0 ? ' and the voice-over' : ''}`, when(row)].filter(Boolean)} />
      <RawData data={d} />
    </div>
  );
}

/**
 * The voice-over's lines edited by hand and spoken again run under their own
 * job kind: the error banner's Retry then has nothing to rewrite from the
 * pipeline, and the editor keeps what was typed.
 */
const VOICE_EDIT_KIND = 'studio:voice-edit';

/** The line shown when the Studio service answers but has no speech engine. */
const VOICE_OFF_LINE = 'Speech is off on the Studio service. Install Chatterbox or Kokoro next to it (see services/studio-forge/README.md) and restart it. The reel renders with music only until then.';

/**
 * Assets (workspace-stage-anatomy.md): the site read, the brand kit, the reel.
 * Each is a run the builder starts; the two renders need the Studio service.
 */
export function StudioStage() {
  const { project, gate1, studio, brandDna, running, runJob, refresh } = useProject();
  const { go, href } = useNav();
  const [serviceDown, setServiceDown] = React.useState<boolean | null>(null);
  const [health, setHealth] = React.useState<ForgeHealth | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    forgeHealth()
      .then((h) => { if (!cancelled) { setHealth(h); setServiceDown(false); } })
      .catch(() => { if (!cancelled) { setHealth(null); setServiceDown(true); } });
    return () => { cancelled = true; };
  }, [running]);

  if (!project) return null;
  if (!gate1) return <LockedGate />;

  const runningKind = running?.kind ?? '';
  const busy = Boolean(runningKind);
  const latest = (kind: string) => studio.find((r) => r.kind === kind) ?? null;
  const probe = latest('probe');
  const images = latest('images');
  const kit = latest('kit');
  const script = latest('script');
  const voice = latest('voice');
  const reel = latest('reel');
  const start = (step: StudioStep) => runJob(studioJobKind(step), () => api.runStudio(project.id, step)).then(refresh);
  const retake = (plateId: string) => runJob(studioJobKind('images'), () => api.runStudio(project.id, 'images', { plateId })).then(refresh);
  // the voice-over's lines edited by hand and spoken again: its own run kind, so Retry never rewrites all five lines
  const speakEdits = async (rowId: string, lines: Record<string, string>) => {
    await runJob(VOICE_EDIT_KIND, () => api.editStudioVoice(rowId, lines));
    await refresh();
  };
  const is = (step: StudioStep) => runningKind === studioJobKind(step);
  const voiceEditing = runningKind === VOICE_EDIT_KIND;
  // the voice step is busy while the pitch is written and spoken, or while edited lines are spoken again
  const voiceBusy = is('voice') || voiceEditing;
  const nothing = studio.length === 0;
  // the service answers but has no image key or no speech engine: those parts are off, everything else works
  const imagesOff = health ? !health.images?.enabled : false;
  const voiceOff = health ? !health.voice?.enabled : false;
  const voiceEngine = health?.voice?.engine ?? '';

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <Orient
        lead={
          <>
            Four steps, in order. <strong className="font-medium">Read the site first</strong>, then make the launch images, the launch cards and the launch reel;
            each step is built from the ones before it.
          </>
        }
        detail={
          brandDna
            ? 'Colours and the logo come from your live site, the words from your approved profile and Business DNA, the photographs from briefs written from both. No claim here is invented.'
            : 'Colours and the logo come from your live site, the words and the photo briefs from your approved profile. Extract the Business DNA on the Brand stage first if you want the reel in that voice.'
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

      {/* ---- Step 1: Site read ---- */}
      <Card>
        <CardHeader
          title="Step 1 of 4: Site read"
          description="Colours, logo and type observed on your live site, which the cards and the reel are built from. Read it once, and again after the site changes."
          actions={
            <>
              {probe && <StatusStamp kind="go" label="Read" />}
              {probe && (
                <Button variant="secondary" size="sm" disabled={busy || serviceDown === true} loading={is('probe')} loadingLabel="Reading" onClick={() => start('probe')}>
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
              reason={`Launch Kit opens ${hostOf(project.site_url)} in a browser, takes the colours from its styles and a screenshot, and keeps the logo it finds. The cards and the reel are built from this.`}
              runKind="studio:probe"
              action={<Button variant="secondary" disabled={busy || serviceDown === true} onClick={() => start('probe')}>Read the site</Button>}
            />
          )}
        </CardBody>
      </Card>

      {/* ---- Step 2: Launch images ---- */}
      <Card>
        <CardHeader
          title="Step 2 of 4: Launch images"
          description="Four photographs made for your launch from briefs written from your profile: the room, the person under the load, the turn, the launch image. Make them, then retake any one you do not like."
          actions={
            <>
              {images && <StatusStamp kind="go" label="Made" />}
              {images && (
                <Button variant="secondary" size="sm" disabled={busy || serviceDown === true || imagesOff} loading={is('images')} loadingLabel="Making" onClick={() => start('images')}>
                  Make again
                </Button>
              )}
            </>
          }
        />
        <CardBody>
          {is('images') ? (
            <RunningLine label="Writing the photo briefs, then making the images" />
          ) : images ? (
            <ImagesView row={images} disabled={busy || serviceDown === true || imagesOff} onRetake={retake} />
          ) : (
            <HonestEmpty
              fact="No launch images yet."
              reason={imagesOff
                ? 'Image generation is off on the Studio service: it has no OpenAI key. Put OPENAI_API_KEY in services/studio-forge/.env and restart it. The cards and the reel work without photographs.'
                : 'Launch Kit writes four photo briefs from your profile (the room where the problem happens, the person doing the job by hand, the same person after your app, and a landscape launch image) and the Studio service makes them with its OpenAI key. About a minute. They go behind the film and onto the platform images.'}
              runKind="studio:images"
              action={<Button variant="secondary" disabled={busy || serviceDown === true || imagesOff} onClick={() => start('images')}>Make the images</Button>}
            />
          )}
        </CardBody>
      </Card>

      {/* ---- Step 3: Launch cards ---- */}
      <Card>
        <CardHeader
          title="Step 3 of 4: Launch cards"
          description="Five sizes in your colours, plus a photo image for every platform once the launch images exist. Make them after the site read, then download any size or all of them as a zip."
          actions={
            <>
              {kit && <StatusStamp kind="go" label="Rendered" />}
              {kit && (
                <Button variant="secondary" size="sm" disabled={busy || !probe || serviceDown === true} loading={is('kit')} loadingLabel="Rendering" onClick={() => start('kit')}>
                  Render again
                </Button>
              )}
            </>
          }
        />
        <CardBody>
          {is('kit') ? (
            <RunningLine label="Rendering the cards" />
          ) : kit ? (
            <CardsView row={kit} imagesRow={images} />
          ) : (
            <HonestEmpty
              fact="No cards yet."
              reason={probe
                ? 'Five sizes rendered from the site read: link preview, feed, story, repo banner and icon. With launch images made, one photo image per platform too (X, LinkedIn, Product Hunt, Reddit, newsletter, link preview, story). Every one is a PNG you can download, or all of them as a zip.'
                : 'Cards are rendered from the site read. Read the site first.'}
              runKind="studio:kit"
              action={<Button variant="secondary" disabled={busy || !probe || serviceDown === true} onClick={() => start('kit')}>Make the cards</Button>}
            />
          )}
        </CardBody>
      </Card>

      {/* ---- Step 4: Launch reel, three sub-steps to the film ---- */}
      <Card>
        <CardHeader
          title="Step 4 of 4: Launch reel"
          description="24 seconds in your colours with your pitch spoken over it: the problem, then your app arriving on the drop. Three steps inside: write the script, speak the voice-over, then render and approve the reel."
          actions={reel ? <StatusStamp kind={reel.status === 'approved' ? 'go' : 'hold'} label={reel.status === 'approved' ? 'Approved' : 'Rendered'} /> : undefined}
        />
        <CardBody className="grid gap-4">
          {/* step 1: the script */}
          <section aria-label="Step 1 of 3: Script" className="grid gap-4 rounded-card border border-border p-4 sm:p-5">
            <StepHeading
              n={1}
              name="Script"
              description="The film's on-screen lines, written from your approved profile in your Business DNA voice. Edit any line and save; the limits are the film's, so a long line is trimmed."
              actions={script ? (
                <Button variant="secondary" size="sm" disabled={busy || serviceDown === true} loading={is('script')} loadingLabel="Writing" onClick={() => start('script')}>
                  Rewrite
                </Button>
              ) : undefined}
            />
            {is('script') ? (
              <RunningLine label="Writing the script in your voice" />
            ) : script ? (
              <ScriptEditor row={script} disabled={busy} onSaved={refresh} />
            ) : (
              <HonestEmpty
                fact="No script yet."
                reason="Launch Kit writes the film's thirty-odd lines from your profile, in your Business DNA voice when you have one, and never invents a number. You can edit every line before rendering."
                runKind="studio:script"
                action={<Button variant="secondary" disabled={busy || serviceDown === true} onClick={() => start('script')}>Write the script</Button>}
              />
            )}
          </section>

          {/* step 2: the voice-over */}
          <section aria-label="Step 2 of 3: Voice-over" className="grid gap-4 rounded-card border border-border p-4 sm:p-5">
            <StepHeading
              n={2}
              name="Voice-over"
              description={`Your pitch in five spoken lines that land on the film's beats: the problem, the app, how it works, what you get, what to do next. Spoken on this machine${voiceEngine ? ` with ${voiceEngine}` : ''} and mixed under the music. Edit a line and speak it again, or rewrite all five.`}
              actions={voice && script ? (
                <Button variant="secondary" size="sm" disabled={busy || serviceDown === true || voiceOff} loading={is('voice')} loadingLabel="Speaking" onClick={() => start('voice')}>
                  Rewrite the voice-over
                </Button>
              ) : undefined}
            />
            {voiceBusy && <RunningLine label={voiceEditing ? 'Speaking your edited lines' : 'Writing the pitch, then speaking it'} />}
            {voice && script ? (
              <>
                {voiceOff && <p className="text-small text-muted-foreground">{VOICE_OFF_LINE}</p>}
                <VoiceEditor row={voice} script={script} disabled={busy || serviceDown === true || voiceOff} onSpeak={(lines) => speakEdits(voice.id, lines)} />
              </>
            ) : !script ? (
              <p className="text-small text-muted-foreground">Write the script first: the voice-over is spoken to its beats.</p>
            ) : voiceOff ? (
              <p className="text-small text-muted-foreground">{VOICE_OFF_LINE}</p>
            ) : !voiceBusy ? (
              <HonestEmpty
                fact="No voice-over yet."
                reason="Launch Kit writes the five lines as you speaking to a room, never reading the screen aloud, and speaks them here with an open-source voice. Every line is measured against its window; you can edit any of them and speak it again."
                runKind="studio:voice"
                action={<Button variant="secondary" disabled={busy || serviceDown === true} onClick={() => start('voice')}>Write the voice-over</Button>}
              />
            ) : null}
          </section>

          {/* step 3: the reel */}
          <section aria-label="Step 3 of 3: The reel" className="grid gap-4 rounded-card border border-border p-4 sm:p-5">
            <StepHeading
              n={3}
              name="The reel"
              description="The finished film: 24 seconds, 1080 by 1920, your pitch under the music. Render it once the script and the voice-over read right, then approve the one you will post."
              actions={reel && script ? (
                <Button variant="secondary" size="sm" disabled={busy || !probe || serviceDown === true} loading={is('reel')} loadingLabel="Rendering" onClick={() => start('reel')}>
                  Render again
                </Button>
              ) : undefined}
            />
            {is('reel') ? (
              <RunningLine label="Rendering the reel" />
            ) : reel ? (
              <ReelView row={reel} script={script} imagesRow={images} voiceRow={voice} disabled={busy} onChanged={refresh} />
            ) : !script ? (
              <p className="text-small text-muted-foreground">Write the script first: the reel is rendered from it.</p>
            ) : (
              <HonestEmpty
                fact="No reel yet."
                reason={`Rendered on this machine from the script, the site read${images ? ', the launch images' : ''}${voice ? ' and the voice-over' : ''}: an MP4 you can download and post, with a poster and an eight-frame strip.${voice ? '' : ' Without a voice-over it renders with music only.'}`}
                runKind="studio:reel"
                action={<Button variant="primary" disabled={busy || !probe || serviceDown === true} onClick={() => start('reel')}>Render the reel</Button>}
              />
            )}
            {!probe && script && (
              <Banner tone="hold" title="Read the site before rendering.">
                The reel takes its colours and logo from the site read.
              </Banner>
            )}
          </section>
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
