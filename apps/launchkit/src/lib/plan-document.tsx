/**
 * The launch plan as a document: an A4 PDF in the Launch Kit template, built
 * in the browser with @react-pdf/renderer. The Plan stage loads this module
 * on the first click (dynamic import), so the renderer never joins the main
 * bundle.
 *
 * Two halves. collectPlanDocument() turns what the stage already holds (the
 * project, the plan with its angles, pricing and listing, the Business DNA,
 * the studio rows) into one plain input. renderPlanPdf() turns that input
 * into a Blob: a cover, then six numbered sections on running pages with a
 * header and page numbers.
 *
 * Type: Instrument Sans, the product face, as static TTF instances in
 * public/fonts/pdf (the Google Fonts static builds of v4, OFL licence
 * alongside). They are fetched once and registered as data; when one is
 * missing the document falls back to Helvetica. Colours: the light values of
 * the design tokens (ink, muted, border, one accent). No colour carries a
 * meaning on its own.
 *
 * Layout notes, learnt from the renderer's paginator: a node's
 * minPresenceAhead asks for at least N points of what follows to land on the
 * same page, else the node moves to the next one; it is only honoured when
 * the node has earlier siblings on the page, so every heading, label and
 * table row is a direct child of the page rather than nested in a section
 * box, and N is sized to the block a heading must keep (a table row, an
 * angle well, the whole figure group). Fixed header and footer come before
 * the content so they repeat on every page, and the footer is positioned
 * from the top because a bottom offset never lands. A URL is set as stacked
 * lines inside one link, because the line breaker adds a hyphen glyph
 * wherever it breaks inside a word.
 */
import * as React from 'react';
import {
  Document,
  Font,
  Image,
  Link,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf,
} from '@react-pdf/renderer';
import type { Plan } from '../domain/plan';
import type { Dict } from '../domain/types';
import type { ProjectDetail, StudioRow } from './types';
import { ASSET_LABELS, ASSET_TYPES } from './asset-types';
import { fillDeep, pickUrl } from './share';

// ---------------------------------------------------------------- the input

export type DocumentPart = { label: string; text: string };
export type DocumentPost = { type: string; platform: string; parts: DocumentPart[] };
export type DocumentVenue = { name: string; kind: string; why: string; rules: string; refUrl: string };
export type DocumentTier = { name: string; price: string; who: string; includes: string[] };
export type DocumentAngle = { name: string; bigIdea: string; hook: string; measure: string };

export type PlanDocumentInput = {
  app: {
    name: string;
    url: string;
    host: string;
    oneLiner: string;
    description: string;
    audience: string;
    icpWho: string;
    icpPain: string;
  };
  /** The date printed on the cover, already formatted. */
  date: string;
  /** Whether the plan had an approved post and a chosen venue when the document was built. */
  ready: boolean;
  voice: { toneWords: string[]; keyMessages: string[] } | null;
  angles: DocumentAngle[];
  /** option and billing name the chosen plan; empty strings on an older choice that carried none. */
  pricing: { model: string; option: string; billing: string; tiers: DocumentTier[] } | null;
  listing: { title: string; tagline: string; short: string; long: string; keywords: string[] } | null;
  posts: DocumentPost[];
  /** Platform names with no approved post. */
  missingPlatforms: string[];
  venues: DocumentVenue[];
  sequence: string[];
  /** Empty strings where a piece is absent; null when the Assets stage has not run. */
  assets: { posterUrl: string; storyUrl: string; reelUrl: string; zipUrl: string } | null;
};

const asStr = (v: unknown): string =>
  (v == null ? '' : typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v)).trim();
const asList = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => asStr(x)).filter(Boolean) : []);
const asDict = (v: unknown): Dict => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Dict) : {});

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** A venue kind as the pipe names it (launch_platform) read as words. */
function kindLabel(kind: string): string {
  const words = kind.replaceAll('_', ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Venue';
}

/** The markdown the listing draft carries, flattened for print: bold marks off, bullets and quotes as plain lines. */
function plainMarkdown(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^#+\s+/gm, '')
    .trim();
}

/** Keys of a post that are bookkeeping, not copy (the Social Launch card skips the same ones). */
const POST_SKIP = new Set(['warnings', 'confidence', 'punctuation_fixed']);

/** A post's fields as labelled paragraphs, in the pipe's own order, like the Social Launch card shows them. */
function postParts(data: Dict): DocumentPart[] {
  const out: DocumentPart[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (POST_SKIP.has(k)) continue;
    const label = k.replaceAll('_', ' ');
    if (typeof v === 'string' && v.trim()) {
      out.push({ label, text: v.trim() });
    } else if (Array.isArray(v) && v.length > 0) {
      out.push({
        label,
        text: v
          .map((item, i) =>
            item && typeof item === 'object'
              ? `${i + 1}. ${Object.values(item as Dict).map(asStr).join(', ')}`
              : `• ${asStr(item)}`,
          )
          .join('\n'),
      });
    } else if (typeof v === 'number') {
      out.push({ label, text: String(v) });
    }
  }
  return out;
}

function priceLabel(t: Dict): string {
  const n = t.price_usd_month;
  if (n == null || n === '') return 'Price to decide';
  return `$${n} per month`;
}

/**
 * Everything the document prints, gathered from what the stage already holds.
 * plan = api.plan(id): approved posts (newest per platform), selected venues
 * with their tracked links, the sequencing advice, the chosen angles, the
 * chosen pricing and the approved listing. brandDna and studio come from the
 * project provider.
 */
export function collectPlanDocument(args: {
  project: ProjectDetail;
  plan: Plan;
  brandDna: Dict | null;
  studio: StudioRow[];
  date?: Date;
}): PlanDocumentInput {
  const { project, plan, brandDna, studio } = args;
  const profile = asDict(project.profile?.data);
  const icp = asDict(profile.icp);
  const url = pickUrl(project as unknown as Dict);

  const voiceD = asDict(brandDna?.voice);
  const messaging = asDict(brandDna?.messaging);
  const voice = brandDna ? { toneWords: asList(voiceD.tone_words), keyMessages: asList(messaging.key_messages) } : null;

  const angles: DocumentAngle[] = plan.angles.map((c) => ({
    name: asStr(c.name) || 'Angle',
    bigIdea: asStr(c.big_idea),
    hook: asStr(c.hook),
    measure: asStr(c.success_metric),
  }));

  const pricingTiers = Array.isArray(plan.pricing?.tiers) ? (plan.pricing!.tiers as Dict[]) : [];
  const pricing = plan.pricing
    ? {
        model: asStr(plan.pricing.model),
        option: asStr(plan.pricing.option),
        billing: asStr(plan.pricing.billing),
        tiers: pricingTiers
          .filter((t) => t.included !== false)
          .map((t) => ({ name: asStr(t.name) || 'Tier', price: priceLabel(t), who: asStr(t.who_its_for), includes: asList(t.includes) })),
      }
    : null;

  const listing = plan.listing
    ? {
        title: asStr(plan.listing.title),
        tagline: asStr(plan.listing.tagline),
        short: asStr(plan.listing.description_short),
        long: plainMarkdown(asStr(plan.listing.description_long)),
        keywords: asList(plan.listing.keywords),
      }
    : null;

  // the known platforms in their fixed order, then anything else the plan carries
  const types = [...ASSET_TYPES, ...Object.keys(plan.assets).filter((t) => !ASSET_TYPES.includes(t))];
  const posts: DocumentPost[] = [];
  for (const t of types) {
    const d = plan.assets[t];
    if (!d) continue;
    posts.push({ type: t, platform: ASSET_LABELS[t] ?? t.replaceAll('_', ' '), parts: postParts(fillDeep(d as Dict, url)) });
  }
  const missingPlatforms = ASSET_TYPES.filter((t) => !plan.assets[t]).map((t) => ASSET_LABELS[t]);

  const venues: DocumentVenue[] = plan.targets.map((t) => ({
    name: asStr(t.name) || 'Venue',
    kind: kindLabel(asStr(t.kind)),
    why: asStr(t.why_fit),
    rules: asStr(t.rules_summary),
    refUrl: asStr(t.ref_url),
  }));
  const sequence = plan.sequencing.map((s) => asStr(s)).filter(Boolean);

  // studio rows are newest first: the approved reel and the newest card kit
  const reel = studio.find((r) => r.kind === 'reel' && r.status === 'approved');
  const kit = studio.find((r) => r.kind === 'kit');
  const cards = kit && Array.isArray(kit.data.cards) ? (kit.data.cards as Dict[]) : [];
  const story = cards.find((c) => c.name === 'story');
  const assets =
    reel || kit
      ? {
          posterUrl: asStr(reel?.data.poster_url),
          storyUrl: asStr(story?.url),
          reelUrl: asStr(reel?.data.video_url),
          zipUrl: asStr(kit?.data.zip_url),
        }
      : null;

  const date = (args.date ?? new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return {
    app: {
      name: project.name,
      url,
      host: hostOf(url),
      oneLiner: asStr(profile.one_liner),
      description: asStr(profile.description),
      audience: asStr(profile.target_user),
      icpWho: asStr(icp.who),
      icpPain: asStr(icp.pain),
    },
    date,
    ready: plan.ready,
    voice,
    angles,
    pricing,
    listing,
    posts,
    missingPlatforms,
    venues,
    sequence,
    assets,
  };
}

/** launch-plan-<app slug>.pdf */
export function planFileName(appName: string): string {
  const slug = appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `launch-plan-${slug || 'app'}.pdf`;
}

// ---------------------------------------------------------------- fonts and images

const FAMILY = 'Instrument Sans';
const FALLBACK_FAMILY = 'Helvetica';

/** The static instances, resolved by the bundler so the URL is right inside the shell as well as the preview. */
const FONT_FILES: { weight: 400 | 500 | 600 | 700; url: string }[] = [
  { weight: 400, url: new URL('../../public/fonts/pdf/InstrumentSans-Regular.ttf', import.meta.url).href },
  { weight: 500, url: new URL('../../public/fonts/pdf/InstrumentSans-Medium.ttf', import.meta.url).href },
  { weight: 600, url: new URL('../../public/fonts/pdf/InstrumentSans-SemiBold.ttf', import.meta.url).href },
  { weight: 700, url: new URL('../../public/fonts/pdf/InstrumentSans-Bold.ttf', import.meta.url).href },
];

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('could not read the file'));
    reader.readAsDataURL(blob);
  });
}

let familyReady: Promise<string> | null = null;

async function loadFonts(): Promise<string> {
  const sources = await Promise.all(
    FONT_FILES.map(async (f) => {
      const r = await fetch(f.url);
      if (!r.ok) throw new Error(`font weight ${f.weight} missing (${r.status})`);
      return { src: await readAsDataUrl(await r.blob()), fontWeight: f.weight };
    }),
  );
  Font.register({ family: FAMILY, fonts: sources });
  return FAMILY;
}

/** Register Instrument Sans once per session; Helvetica when a file is missing. */
function ensureFonts(): Promise<string> {
  if (!familyReady) {
    familyReady = loadFonts().catch((e) => {
      console.warn('plan document: Instrument Sans unavailable, using Helvetica:', e);
      return FALLBACK_FAMILY;
    });
  }
  return familyReady;
}

/** Characters a long word may be cut after when it has to be split at all. */
const WORD_CUT_AFTER = new Set(['/', '?', '&', '=', '#', '.', '_', '-', ':', ',', ';']);

/** A word cut into pieces no longer than max characters, preferably after a slash or a punctuation mark. */
function cutWord(word: string, max: number): string[] {
  const tokens: string[] = [];
  let cur = '';
  for (const ch of word) {
    cur += ch;
    if (WORD_CUT_AFTER.has(ch)) {
      tokens.push(cur);
      cur = '';
    }
  }
  if (cur) tokens.push(cur);
  const parts: string[] = [];
  let part = '';
  for (let tok of tokens) {
    while (tok.length > max) {
      if (part) {
        parts.push(part);
        part = '';
      }
      parts.push(tok.slice(0, max));
      tok = tok.slice(max);
    }
    if (part && part.length + tok.length > max) {
      parts.push(part);
      part = tok;
    } else {
      part += tok;
    }
  }
  if (part) parts.push(part);
  return parts;
}

/**
 * Words wrap at spaces only, so no hyphen the renderer adds ends up inside
 * copied post text. A word longer than a full body line could not wrap at
 * all and would run off the page, so only such a word may be cut, at its own
 * punctuation.
 */
const LONGEST_WHOLE_WORD = 48;
Font.registerHyphenationCallback((word) => (word.length > LONGEST_WHOLE_WORD ? cutWord(word, 24) : [word]));

type LoadedImages = { poster: string | null; story: string | null };

/** Fetch a PNG or JPEG by URL into a data URL the renderer can embed; null when it cannot be loaded. */
async function loadImage(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const blob = await r.blob();
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const mime = /^image\/(png|jpeg)$/.test(blob.type)
      ? blob.type
      : ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : '';
    if (!mime) return null;
    const dataUrl = await readAsDataUrl(blob);
    return `data:${mime};base64,${dataUrl.slice(dataUrl.indexOf(',') + 1)}`;
  } catch {
    return null;
  }
}

async function loadImages(assets: PlanDocumentInput['assets']): Promise<LoadedImages> {
  const [poster, story] = await Promise.all([loadImage(assets?.posterUrl ?? ''), loadImage(assets?.storyUrl ?? '')]);
  return { poster, story };
}

/** Build the document and return it as a PDF blob. */
export async function renderPlanPdf(input: PlanDocumentInput): Promise<Blob> {
  const [family, images] = await Promise.all([ensureFonts(), loadImages(input.assets)]);
  return pdf(<PlanDocument input={input} family={family} images={images} />).toBlob();
}

// ---------------------------------------------------------------- the template

const INK = '#1B1D22';
const MUTED = '#575C66';
const BORDER = '#E2E3E8';
const BORDER_STRONG = '#CFD1D8';
const SUNKEN = '#EEEFF2';
const FLARE = '#CF4420';
const PAPER = '#FFFFFF';

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 72;
/** The width of a body line. */
const CONTENT_W = PAGE_W - 2 * MARGIN_X;

const BODY_SIZE = 10;
const TABLE_SIZE = 8.5;
const CAPTION_SIZE = 8.5;

/** How many characters of a URL fit on one line of the given width: a wide average advance, so a line is never too long. */
const charsPerLine = (widthPt: number, fontSize: number) => Math.max(8, Math.floor(widthPt / (fontSize * 0.6)));

/** A URL cut into lines that fit the width, each cut after a slash or a punctuation mark where possible. */
export function urlLines(url: string, widthPt: number, fontSize: number): string[] {
  return cutWord(url, charsPerLine(widthPt, fontSize));
}

const s = StyleSheet.create({
  page: {
    paddingTop: MARGIN_TOP,
    paddingBottom: MARGIN_BOTTOM,
    paddingHorizontal: MARGIN_X,
    fontSize: BODY_SIZE,
    lineHeight: 1.5,
    color: INK,
    backgroundColor: PAPER,
  },
  header: {
    position: 'absolute',
    top: 34,
    left: MARGIN_X,
    right: MARGIN_X,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8.5,
    color: MUTED,
  },
  // placed from the top: the paginator re-lays each page without a page height, so a bottom offset never lands
  footer: {
    position: 'absolute',
    top: PAGE_H - 34 - 13,
    left: MARGIN_X,
    right: MARGIN_X,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8.5,
    color: MUTED,
  },
  // a little short of the page: a cover that fills it exactly leaves the paginator an empty page before section 1
  cover: { height: PAGE_H - MARGIN_TOP - MARGIN_BOTTOM - 24, justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 15, fontWeight: 600, letterSpacing: -0.3 },
  accentRule: { width: 48, height: 3, backgroundColor: FLARE, marginBottom: 18 },
  coverKicker: { fontSize: 11, fontWeight: 500, color: MUTED, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  coverTitle: { fontSize: 34, fontWeight: 600, lineHeight: 1.15, letterSpacing: -0.8, marginBottom: 14 },
  coverMeta: { fontSize: 12, color: MUTED, lineHeight: 1.5 },
  coverFoot: { fontSize: 10, fontWeight: 500 },
  coverFootMuted: { fontSize: 9, color: MUTED, marginTop: 4, maxWidth: 380 },
  h1: { borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 6, marginBottom: 14 },
  sectionGap: { height: 18 },
  h1Num: { fontSize: 11, fontWeight: 600, color: FLARE },
  h1Text: { fontSize: 16, fontWeight: 600, letterSpacing: -0.3 },
  h2: { fontSize: 12, fontWeight: 600, marginTop: 8, marginBottom: 6 },
  label: { fontSize: 7.5, fontWeight: 500, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  body: { fontSize: BODY_SIZE, lineHeight: 1.5 },
  strong: { fontWeight: 600 },
  muted: { color: MUTED },
  well: { backgroundColor: SUNKEN, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 10, marginTop: 4, marginBottom: 10 },
  listRow: { flexDirection: 'row', marginBottom: 3 },
  listMark: { width: 14, color: MUTED, textAlign: 'right', marginRight: 6 },
  listText: { flex: 1 },
  tr: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  trHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER_STRONG, marginTop: 4 },
  td: { paddingVertical: 5, paddingRight: 8, fontSize: TABLE_SIZE, lineHeight: 1.4 },
  th: { paddingVertical: 4, paddingRight: 8, fontSize: 7.5, fontWeight: 500, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  link: { color: INK, textDecoration: 'underline' },
  figureRow: { flexDirection: 'row', gap: 16, marginTop: 4, marginBottom: 10 },
  figure: { width: 150 },
  figureFrame: { borderWidth: 0.5, borderColor: BORDER, padding: 2, backgroundColor: SUNKEN },
  figureImg: { width: 144, height: 256, objectFit: 'contain' },
  caption: { fontSize: CAPTION_SIZE, lineHeight: 1.4, color: MUTED, marginTop: 4 },
  spacer: { height: 8 },
});

/** The Launch Kit mark: the gantry square and the arrow it releases (brand-mark.tsx, drawn for the renderer). */
function Mark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width="32" height="32" rx="9" ry="9" fill={INK} />
      <Path d="M16 7.5 L23 17 L18.8 17 L18.8 24.5 L13.2 24.5 L13.2 17 L9 17 Z" fill={PAPER} />
    </Svg>
  );
}

/**
 * A numbered section heading; the first one opens a new page after the cover.
 * Moves to the next page unless `keep` points of what follows fit under it
 * (100 covers a sub-heading and a few lines, or one angle well). The gap
 * above it is a spacer rather than a top margin: a margin inside a heading
 * that follows a forced page break left the paginator an empty page.
 */
function SectionHeading({ n, title, first = false, keep = 100 }: { n: number; title: string; first?: boolean; keep?: number }) {
  return (
    <>
      {first ? null : <View style={s.sectionGap} />}
      <View style={s.h1} minPresenceAhead={keep} break={first} wrap={false}>
        <Text style={s.h1Text}>
          <Text style={s.h1Num}>{`${n}   `}</Text>
          {title}
        </Text>
      </View>
    </>
  );
}

/** A heading inside a section. Moves to the next page unless 120pt of what follows fit under it: one angle well, or a label and several lines. */
function SubHeading({ children }: { children: string }) {
  return (
    <Text style={s.h2} minPresenceAhead={120}>
      {children}
    </Text>
  );
}

type Row = { kind: 'text'; text: string } | { kind: 'mark'; mark: string; text: string };

const BULLET_RE = /^[•\-*]\s+/;
const NUMBER_RE = /^(\d+)[.)]\s+/;

/** A paragraph's lines as rows: a leading bullet or number makes a hanging list row, other lines stay text. */
function rowsOf(paragraph: string): Row[] {
  const rows: Row[] = [];
  for (const raw of paragraph.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const num = NUMBER_RE.exec(line);
    if (BULLET_RE.test(line)) {
      rows.push({ kind: 'mark', mark: '•', text: line.replace(BULLET_RE, '') });
    } else if (num) {
      rows.push({ kind: 'mark', mark: `${num[1]}.`, text: line.slice(num[0].length) });
    } else {
      const prev = rows[rows.length - 1];
      if (prev && prev.kind === 'text') prev.text += `\n${line}`;
      else rows.push({ kind: 'text', text: line });
    }
  }
  return rows;
}

/**
 * Plain text as the document sets it: a blank line separates paragraphs, a
 * leading bullet or number makes a list row, other line breaks are kept.
 * Each paragraph is its own page-level block, so a long one may run over a
 * page and a short one stays whole with its label.
 */
function Paragraphs({ text, after = 10, muted = false }: { text: string; after?: number; muted?: boolean }) {
  const paras = text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length === 0) return <View style={{ marginBottom: after }} />;
  const textStyle = muted ? [s.body, s.muted] : [s.body];
  return (
    <>
      {paras.map((p, pi) => (
        <View key={pi} style={{ marginBottom: pi === paras.length - 1 ? after : 5 }}>
          {rowsOf(p).map((row, ri) =>
            row.kind === 'text' ? (
              <Text key={ri} style={textStyle}>
                {row.text}
              </Text>
            ) : (
              <View key={ri} style={s.listRow}>
                <Text style={[...textStyle, s.listMark]}>{row.mark}</Text>
                <Text style={[...textStyle, s.listText]}>{row.text}</Text>
              </View>
            ),
          )}
        </View>
      ))}
    </>
  );
}

/** A labelled block. The label keeps 30pt of its content with it; a string is set as paragraphs. */
function Field({ label, children, after = 10 }: { label: string; children: React.ReactNode; after?: number }) {
  return (
    <>
      <Text style={s.label} minPresenceAhead={30}>
        {label}
      </Text>
      {typeof children === 'string' ? (
        <Paragraphs text={children} after={after} />
      ) : (
        <View style={{ marginBottom: after }}>{children}</View>
      )}
    </>
  );
}

function Empty({ children }: { children: string }) {
  return <Text style={[s.body, s.muted, { marginBottom: 8 }]}>{children}</Text>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={s.listRow}>
          <Text style={[s.body, s.listMark]}>{'•'}</Text>
          <Text style={[s.body, s.listText]}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

function Numbered({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((t, i) => (
        <View key={i} style={s.listRow}>
          <Text style={[s.body, s.listMark]}>{`${i + 1}.`}</Text>
          <Text style={[s.body, s.listText]}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * A URL as one link, set as stacked lines that fit the width. The line
 * breaker would add a hyphen wherever it cut a word, and a URL with a hyphen
 * in it is a different URL, so the cuts are made here, after slashes and
 * punctuation, and never marked.
 */
function UrlText({ url, width, size = BODY_SIZE, muted = false }: { url: string; width: number; size?: number; muted?: boolean }) {
  const lines = urlLines(url, width, size);
  return (
    <Link src={url}>
      {lines.map((line, i) => (
        <Text key={i} style={[s.link, { fontSize: size, lineHeight: 1.4 }, muted ? s.muted : {}]}>
          {line}
        </Text>
      ))}
    </Link>
  );
}

type Column = { label: string; width: number };

/** A table's column headings. Moves to the next page unless 80pt of rows fit under it: the tallest venue row is about 60. */
function TableHead({ columns }: { columns: Column[] }) {
  return (
    <View style={s.trHead} minPresenceAhead={80} wrap={false}>
      {columns.map((c) => (
        <Text key={c.label} style={[s.th, { width: c.width }]}>
          {c.label}
        </Text>
      ))}
    </View>
  );
}

function Figure({ title, src, url }: { title: string; src: string | null; url: string }) {
  return (
    <View style={s.figure}>
      {src ? (
        <View style={s.figureFrame}>
          <Image src={src} style={s.figureImg} />
        </View>
      ) : (
        <View style={[s.figureFrame, { height: 260, justifyContent: 'center' }]}>
          <Text style={[s.caption, { textAlign: 'center', paddingHorizontal: 8 }]}>
            {url ? 'Could not be loaded from the Studio service.' : 'Not rendered yet.'}
          </Text>
        </View>
      )}
      <Text style={s.caption}>{title}</Text>
      {url ? <UrlText url={url} width={150} size={CAPTION_SIZE} muted /> : null}
    </View>
  );
}

function Cover({ input }: { input: PlanDocumentInput }) {
  const { app } = input;
  return (
    <View style={s.cover} wrap={false}>
      <View style={s.brandRow}>
        <Mark size={34} />
        <Text style={s.wordmark}>Launch Kit</Text>
      </View>
      <View>
        <View style={s.accentRule} />
        <Text style={s.coverKicker}>Launch plan</Text>
        <Text style={s.coverTitle}>{app.name}</Text>
        {app.host ? <Text style={s.coverMeta}>{app.host}</Text> : null}
        <Text style={s.coverMeta}>{input.date}</Text>
      </View>
      <View>
        <Text style={s.coverFoot}>Prepared with Launch Kit by RocketRide</Text>
        <Text style={s.coverFootMuted}>
          {input.ready
            ? 'Every post, price and venue in this document was approved on the Launch Kit stages. Nothing publishes itself: the plan is yours to carry out, one venue at a time, each with its own tracked link.'
            : 'Built before the plan was ready: a section says so wherever a post is not approved or a venue is not chosen yet. Nothing publishes itself: the plan is yours to carry out.'}
        </Text>
      </View>
    </View>
  );
}

// Every section returns its blocks as direct children of the page (see the
// note at the top): that is what lets headings and labels stay with their
// content across page breaks.

function AppSection({ input }: { input: PlanDocumentInput }) {
  const { app } = input;
  return (
    <>
      <SectionHeading n={1} title="The app" first />
      <Field label="One liner">{app.oneLiner || 'Not in the profile.'}</Field>
      <Field label="What it is">{app.description || 'Not in the profile.'}</Field>
      <Field label="Who it is for">
        <Text style={s.body}>{app.audience || 'Not in the profile.'}</Text>
        {app.icpWho ? (
          <Text style={[s.body, { marginTop: 4 }]}>
            <Text style={s.strong}>Buyer: </Text>
            {app.icpWho}
          </Text>
        ) : null}
        {app.icpPain ? (
          <Text style={s.body}>
            <Text style={s.strong}>Their pain: </Text>
            {app.icpPain}
          </Text>
        ) : null}
      </Field>
    </>
  );
}

function VoiceSection({ input }: { input: PlanDocumentInput }) {
  const { voice, angles, app } = input;
  return (
    <>
      <SectionHeading n={2} title="Voice and angle" />
      <SubHeading>{`Voice, as observed on ${app.host || 'the site'}`}</SubHeading>
      {!voice ? (
        <Empty>Business DNA has not been extracted yet. The Brand stage reads the site's own voice.</Empty>
      ) : (
        <>
          <Field label="Tone words">{voice.toneWords.length ? voice.toneWords.join(', ') : 'No tone words were observed on the site.'}</Field>
          <Field label="Key messages">
            {voice.keyMessages.length ? <Bullets items={voice.keyMessages} /> : <Text style={[s.body, s.muted]}>No key messages were observed on the site.</Text>}
          </Field>
        </>
      )}
      <SubHeading>{angles.length === 1 ? 'The angle' : 'The angles'}</SubHeading>
      {angles.length === 0 ? (
        <Empty>No angle chosen; the posts were written from the profile alone.</Empty>
      ) : (
        angles.map((a) => (
          <View key={a.name} style={s.well} wrap={false}>
            <Text style={[s.body, s.strong]}>{a.name}</Text>
            {a.bigIdea ? <Text style={[s.body, { marginTop: 2 }]}>{a.bigIdea}</Text> : null}
            {a.hook ? (
              <Text style={[s.body, { marginTop: 4 }]}>
                <Text style={s.strong}>Hook: </Text>
                {a.hook}
              </Text>
            ) : null}
            {a.measure ? (
              <Text style={s.body}>
                <Text style={s.strong}>Measure: </Text>
                {a.measure}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </>
  );
}

const PRICING_COLUMNS: Column[] = [
  { label: 'Tier', width: 90 },
  { label: 'Price', width: 80 },
  { label: 'Who it is for', width: 143 },
  { label: 'Includes', width: 170 },
];

function PricingSection({ input }: { input: PlanDocumentInput }) {
  const { pricing, listing } = input;
  return (
    <>
      <SectionHeading n={3} title="Pricing and listing" />
      <SubHeading>Pricing</SubHeading>
      {!pricing ? (
        <Empty>No pricing chosen yet. The Commercial stage drafts tiers anchored on real competitors; choose one to carry it here.</Empty>
      ) : (
        <>
          {pricing.option || pricing.billing ? (
            <Text style={[s.body, { marginBottom: 6 }]}>
              {`Plan: ${pricing.option || 'not named'}, billing: ${pricing.billing || 'not stated'}`}
            </Text>
          ) : null}
          {pricing.model ? <Field label="Model">{pricing.model}</Field> : null}
          <TableHead columns={PRICING_COLUMNS} />
          {pricing.tiers.map((t) => (
            <View key={t.name} style={s.tr} wrap={false}>
              <Text style={[s.td, s.strong, { width: 90 }]}>{t.name}</Text>
              <Text style={[s.td, { width: 80 }]}>{t.price}</Text>
              <Text style={[s.td, { width: 143 }]}>{t.who || 'Not given.'}</Text>
              <Text style={[s.td, { width: 170 }]}>{t.includes.length ? t.includes.join(', ') : 'Not given.'}</Text>
            </View>
          ))}
          <View style={s.spacer} />
        </>
      )}
      <SubHeading>Store listing</SubHeading>
      {!listing ? (
        <Empty>The listing is not approved yet. Approve it on the Commercial stage; the approved copy is printed here.</Empty>
      ) : (
        <>
          <Field label="Title">{listing.title || 'Not given.'}</Field>
          <Field label="Tagline">{listing.tagline || 'Not given.'}</Field>
          <Field label="Short description">{listing.short || 'Not given.'}</Field>
          <Field label="Long description">{listing.long || 'Not given.'}</Field>
          <Field label="Keywords">{listing.keywords.length ? listing.keywords.join(', ') : 'None.'}</Field>
        </>
      )}
    </>
  );
}

function PostsSection({ input }: { input: PlanDocumentInput }) {
  const { posts, missingPlatforms } = input;
  return (
    <>
      <SectionHeading n={4} title="Posts by platform" />
      {posts.length === 0 ? (
        <Empty>No post is approved yet. Approve posts on the Social Launch stage; each approved one is printed here in full.</Empty>
      ) : null}
      {posts.map((p) => (
        <React.Fragment key={p.type}>
          <SubHeading>{p.platform}</SubHeading>
          {p.parts.map((part) => (
            <Field key={part.label} label={part.label}>
              {part.text}
            </Field>
          ))}
        </React.Fragment>
      ))}
      {missingPlatforms.length > 0 ? (
        <View style={s.well} wrap={false}>
          <Text style={s.label}>Not in this plan</Text>
          {missingPlatforms.map((name) => (
            <Text key={name} style={[s.body, s.muted]}>{`${name}: no approved post yet.`}</Text>
          ))}
        </View>
      ) : null}
    </>
  );
}

const VENUE_COLUMNS: Column[] = [
  { label: 'Venue', width: 110 },
  { label: 'Why it fits', width: 133 },
  { label: 'Rules', width: 110 },
  { label: 'Tracked link', width: 130 },
];

function VenuesSection({ input }: { input: PlanDocumentInput }) {
  const { venues, sequence } = input;
  return (
    <>
      <SectionHeading n={5} title="Where to launch" />
      {venues.length === 0 ? (
        <Empty>No venue chosen yet. Tick venues on the Targets stage; each one gets its own tracked link here.</Empty>
      ) : (
        <>
          <TableHead columns={VENUE_COLUMNS} />
          {venues.map((v) => (
            <View key={v.refUrl || v.name} style={s.tr} wrap={false}>
              <View style={[s.td, { width: 110 }]}>
                <Text style={s.strong}>{v.name}</Text>
                <Text style={s.muted}>{v.kind}</Text>
              </View>
              <Text style={[s.td, { width: 133 }]}>{v.why || 'Not given.'}</Text>
              <Text style={[s.td, { width: 110 }]}>{v.rules || 'Not verified.'}</Text>
              <View style={[s.td, { width: 130 }]}>
                {v.refUrl ? <UrlText url={v.refUrl} width={122} size={TABLE_SIZE} /> : <Text style={s.muted}>No link yet.</Text>}
              </View>
            </View>
          ))}
          <View style={s.spacer} />
        </>
      )}
      <SubHeading>Sequence</SubHeading>
      {sequence.length === 0 ? (
        <Empty>No sequencing advice yet. It is written when the Targets stage runs.</Empty>
      ) : (
        <Numbered items={sequence} />
      )}
    </>
  );
}

function AssetsSection({ input, images }: { input: PlanDocumentInput; images: LoadedImages }) {
  const { assets } = input;
  return (
    <>
      {/* the figures and their links are one piece of about 410pt; the heading asks for all of it, so both move together */}
      <SectionHeading n={6} title="Launch assets" keep={assets ? 420 : 100} />
      {!assets ? (
        <Empty>No launch assets yet. The Assets stage renders the launch cards and the reel from your site's own colours.</Empty>
      ) : (
        <View wrap={false}>
          <View style={s.figureRow}>
            <Figure title="Reel poster" src={images.poster} url={assets.posterUrl} />
            <Figure title="Story card" src={images.story} url={assets.storyUrl} />
          </View>
          <Field label="Reel">
            {assets.reelUrl ? <UrlText url={assets.reelUrl} width={CONTENT_W} /> : <Text style={[s.body, s.muted]}>No approved reel yet.</Text>}
          </Field>
          <Field label="Launch cards (zip)">
            {assets.zipUrl ? <UrlText url={assets.zipUrl} width={CONTENT_W} /> : <Text style={[s.body, s.muted]}>No card pack yet.</Text>}
          </Field>
        </View>
      )}
    </>
  );
}

/** The template itself: the cover, then the six sections on running pages. renderPlanPdf() wraps it with the fonts and images loaded. */
export function PlanDocument({ input, family, images }: { input: PlanDocumentInput; family: string; images: LoadedImages }) {
  const { app } = input;
  return (
    <Document
      title={`Launch plan: ${app.name}`}
      author="Launch Kit by RocketRide"
      subject="Launch plan"
      creator="Launch Kit"
      producer="Launch Kit by RocketRide"
      language="en"
    >
      <Page size="A4" style={[s.page, { fontFamily: family }]}>
        {/* the running header and footer: on every page but the cover; placed first so they repeat on every page */}
        <View fixed style={s.header}>
          <Text render={({ pageNumber }) => (pageNumber > 1 ? app.name : '')} />
          <Text render={({ pageNumber }) => (pageNumber > 1 ? 'Launch plan' : '')} />
        </View>
        <View fixed style={s.footer}>
          <Text render={({ pageNumber }) => (pageNumber > 1 ? 'Prepared with Launch Kit by RocketRide' : '')} />
          <Text render={({ pageNumber, totalPages }) => (pageNumber > 1 ? `Page ${pageNumber} of ${totalPages}` : '')} />
        </View>
        <Cover input={input} />
        <AppSection input={input} />
        <VoiceSection input={input} />
        <PricingSection input={input} />
        <PostsSection input={input} />
        <VenuesSection input={input} />
        <AssetsSection input={input} images={images} />
      </Page>
    </Document>
  );
}
