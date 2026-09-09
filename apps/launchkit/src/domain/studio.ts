/**
 * The Assets stage (slug `studio`): pure rules shared by the api facade and the
 * stage page. The slot contract comes from the studio forge's concept spec;
 * the clamp here mirrors the forge's normalizeSlot so what the builder sees
 * in the editor is exactly what renders.
 */
import type { Dict } from "./types";

export const STUDIO_STEPS = ["probe", "images", "kit", "script", "reel"] as const;
export type StudioStep = (typeof STUDIO_STEPS)[number];

export function isStudioStep(s: string): s is StudioStep {
  return (STUDIO_STEPS as readonly string[]).includes(s);
}

export const studioJobKind = (step: StudioStep): string => `studio:${step}`;

export const NEEDS_PROBE_ERROR = "read the site first: the kit and the reel take their colours and logo from it";
export const NEEDS_SCRIPT_ERROR = "write the script first: the reel is rendered from it";
export const NO_STUDIO_ROW_ERROR = "not found";

export interface SlotSpec {
  id: string;
  max: number;
  default: string;
  example?: string;
  hint?: string;
  optional?: boolean;
  face?: string;
  size?: number;
  selector?: string;
  group?: string;
  prefix?: string;
  suffix?: string;
}

export interface ConceptBeat {
  t: string;
  what: string;
  slots: string[];
}

/** A photograph the concept wants: behind the film (for: reel) or on the cards (for: cards). */
export interface PlateSpec {
  id: string;
  for: "reel" | "cards" | string;
  when: string;
  size: string;
  grade: "cold" | "warm" | string;
  hint: string;
  example?: string;
}

export interface ConceptSpec {
  concept: string;
  title: string;
  tagline: string;
  duration: number;
  beats: ConceptBeat[];
  slots: SlotSpec[];
  plates?: PlateSpec[];
}

const DANGLING = /\s(A|AN|THE|BY|OF|TO|IN|ON|AT|FOR|WITH|AND|OR|FROM|AS|IS|ARE|PER)[.,:;]?$/;

/**
 * Cut a value to its limit the way an editor would: at a sentence end when one
 * leaves at least half the room, else at a word, dropping a dangling function
 * word; a cut line keeps the original's own end mark (a question stays a
 * question). Mirrors the forge's clampText.
 */
export function clampText(v: string, max: number, end: string): string {
  const cut = v.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentence >= max * 0.45) return cut.slice(0, sentence + 1);
  const sp = cut.lastIndexOf(" ");
  const out = (sp > max * 0.5 ? cut.slice(0, sp) : cut).trim().replace(DANGLING, "").replace(/[,:;-]$/, "");
  return end && !/[.!?…:]$/.test(out) ? out + end : out;
}

/** Uppercase, one line, no em or en dash, clamped to the slot's limit (forge parity). */
export function normalizeSlot(spec: SlotSpec, value: unknown): { value: string; clamped: boolean } {
  const original = String(value ?? "").trim();
  let v = (original || spec.default).replace(/[—–]/g, "-").replace(/\s+/g, " ").trim().toUpperCase();
  if (!v && !spec.optional) v = spec.default;
  let clamped = false;
  if (v.length > spec.max) {
    v = clampText(v, spec.max, original.match(/[.!?…:]$/)?.[0] ?? "");
    clamped = true;
  }
  return { value: v, clamped };
}

export function normalizeSlots(spec: ConceptSpec, raw: unknown): {
  slots: Record<string, string>;
  clamped: string[];
  missing: string[];
} {
  const src = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Dict;
  const slots: Record<string, string> = {};
  const clamped: string[] = [];
  const missing: string[] = [];
  for (const s of spec.slots) {
    const has = Object.prototype.hasOwnProperty.call(src, s.id) && String(src[s.id] ?? "").trim() !== "";
    if (!has && !s.optional) missing.push(s.id);
    const r = normalizeSlot(s, has ? src[s.id] : "");
    slots[s.id] = r.value;
    if (r.clamped) clamped.push(s.id);
  }
  return { slots, clamped, missing };
}

export interface StudioRowLike {
  kind: string;
  status?: string;
}

/** The stage dot: a reel approved is go; anything produced is hold; nothing is none. */
export function studioDot(rows: StudioRowLike[]): "go" | "hold" | "none" {
  if (rows.length === 0) return "none";
  if (rows.some((r) => r.kind === "reel" && r.status === "approved")) return "go";
  return "hold";
}

/** The analyst's hedges have no place on a card: "appears to be a tool" reads as "a tool". */
export function unhedge(text: string): string {
  return text
    .replace(/\b(appears|seems|looks) to be\b\s*/gi, "")
    .replace(/\b(likely|probably|apparently|presumably)\b\s*/gi, "")
    .replace(/,\s*(likely|probably)\s+with\b/gi, ", with")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * The kit's words, best source first: the brand's observed tagline, the reel
 * script's tagline (written in the brand voice), the listing, then the
 * profile with its hedges removed.
 */
export function kitCopy(profile: Dict, dna: Dict | null, listing: Dict | null, script: Dict | null = null): {
  tagline: string;
  one_liner: string;
  description: string;
} {
  const s = (v: unknown) => (v == null ? "" : String(v).trim());
  const listingTag = listing ? s(listing.tagline) : "";
  const tagline = s(dna?.tagline_observed) || s(script?.tagline) || listingTag || unhedge(s(profile.one_liner));
  const oneRaw = s(script?.one_liner) || unhedge(s(profile.one_liner));
  const one = oneRaw !== tagline ? oneRaw : unhedge(s(profile.description)).slice(0, 160);
  return { tagline, one_liner: one, description: unhedge(s(profile.description)) };
}
