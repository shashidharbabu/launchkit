/**
 * Pipe question-payload builders, byte-faithful port of the string
 * construction in launchkit/backend/app/rr.py (run_understand, run_commercial,
 * run_targets, run_brand, run_asset, build_signals_question, and the judge
 * prompt inside rescore_signals).
 *
 * These strings ARE the wire contract with the deployed pipes: a one-character
 * drift changes pipeline behavior. All embedded JSON goes through pyJsonDumps
 * (CPython json.dumps default separators + ensure_ascii). Do not "clean up"
 * spacing, dashes, or wording.
 */

import { pyJsonDumps, pyStr, pyTruthy } from "./py";
import type { BrandDna, Dict, Profile, TargetData } from "./types";
import type { ConceptSpec, PlateSpec } from "./studio";

export { pyJsonDumps } from "./py";

/**
 * The Assets stage's reel script (lk_studio.pipe, a toolless LLM pipe): the
 * whole prompt travels in the question. The slot contract comes from the
 * studio forge's concept spec so the prompt, the editor and the renderer
 * agree on ids and limits. New in the short-video branch, not a rr.py port.
 */
export function buildStudioQuestion(spec: ConceptSpec, profile: Profile, appName: string,
                                    siteUrl: string, dna?: BrandDna | null, campaign = "",
                                    siteCopy = ""): string {
  const host = siteUrl.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./, "").toUpperCase();
  const beats = spec.beats.map((b) => `- ${b.t} s: ${b.what} Slots: ${b.slots.join(", ")}`).join("\n");
  const slots = spec.slots.map((s) =>
    `- ${s.id} (max ${s.max} chars${s.optional ? ", optional" : ""}): ${s.hint ?? ""}` +
    (s.example ? ` Example: "${s.example}"` : "")).join("\n");
  const hostSlots = spec.slots.filter((s) => /host|chip$/.test(s.id) && /host/i.test(s.hint ?? "")).map((s) => s.id);
  const parts = [
    `You write the on-screen copy for a ${spec.duration} second vertical launch film ("${spec.title}": ` +
    `${spec.tagline}). Kinetic typography and drawn scenes, no voice-over, a few words per beat. The film ` +
    "is fixed; you fill its text slots and nothing else. Read the whole film first so the beats tell ONE " +
    "story: the problem a real person has, then this app arriving and proving itself.",
    "RULES: 1) Every slot value is at most its max characters, count them, shorter is better; text renders in " +
    "capitals. 2) Never invent a claim about the product: a product number may appear only if it is in " +
    "APP_PROFILE, BRAND_DNA or SITE_COPY (use ONE or a plain word otherwise). Beats marked as scenario " +
    "numbers may use a plausible scene (a count of items, minutes, people) that illustrates the problem; " +
    "keep them modest and realistic. 3) Ground the how-it-works beats in what the product actually does: " +
    "SITE_COPY holds the site's own labels, buttons and categories; reuse those words for fields, buttons " +
    "and verdict chips instead of inventing features. 4) Write in the brand's voice: if BRAND_DNA is " +
    "present follow its tone_words, vocabulary and dos_and_donts and reuse its key messages; otherwise " +
    "plain, concrete, confident. 5) Use the app name exactly as APP_NAME. " +
    (hostSlots.length ? `6) ${hostSlots.join(" and ")} are SITE_HOST exactly. ` : "6) Host slots are SITE_HOST exactly. ") +
    "7) No hype words (game-changer, revolutionary, seamless, unleash, elevate, next-gen, cutting-edge, " +
    "supercharge), no em dashes, no emoji; rhetorical questions only where a beat asks for questions. " +
    "8) Punctuate as the hints say: labels end with a colon, statements end with a period. 9) If " +
    "CAMPAIGN_ANGLE is present, the problem beats and the call to action carry that angle, but never the name " +
    "of another product: 10) the film names no other product or company, ever; say what this app does instead. " +
    "11) The how-it-works beats show what the product actually does to an item (its own field, its own states, " +
    "its own rule) from SITE_COPY; when the product has no catch, no penalty and no timer, use its plain states " +
    "and leave optional slots such as payoff_timer empty rather than inventing a mechanism.",
    `THE FILM (beats in order):\n${beats}`,
    `SLOTS:\n${slots}`,
    `APP_NAME: ${appName}`,
    `SITE_HOST: ${host}`,
    `APP_PROFILE: ${pyJsonDumps(profile)}`,
  ];
  if (pyTruthy(dna)) {
    parts.push(`BRAND_DNA: ${pyJsonDumps(dna)}`);
  }
  if (siteCopy) {
    parts.push(`SITE_COPY (the live site's own words, element by element):\n${siteCopy}`);
  }
  if (campaign) {
    parts.push(`CAMPAIGN_ANGLE: ${campaign}`);
  }
  parts.push("OUTPUT: ONLY one RFC 8259 JSON object, no fences, no commentary: {\"slots\": {<every slot id " +
             "listed above>: string}, \"tagline\": string (at most 60 characters, sentence case, the brand's own " +
             "tagline when BRAND_DNA has one, otherwise one in its voice; used on the launch cards), " +
             "\"one_liner\": string (at most 120 characters, sentence case, what the app does and for whom, as " +
             "the brand would say it, never hedged with words like appears or likely), \"claims_used\": " +
             "[string] (each on-screen fact and where in APP_PROFILE or BRAND_DNA it comes from), \"notes\": " +
             "string (one sentence on the angle you took)}");
  return parts.join("\n\n");
}

/**
 * A second, small ask when the script came back with slot values over their
 * limits: rewrite only those, keeping the meaning and the voice, so the film
 * never shows a mechanically cut fragment. New in the short-video branch.
 */
export function buildStudioRepairQuestion(spec: ConceptSpec, offenders: { id: string; value: string }[],
                                          appName: string): string {
  const byId = new Map(spec.slots.map((s) => [s.id, s]));
  const list = offenders.map((o) => {
    const s = byId.get(o.id);
    return `- ${o.id} (max ${s?.max ?? 0} chars, currently ${o.value.length}): "${o.value}"` +
      (s?.hint ? ` Slot: ${s.hint}` : "");
  }).join("\n");
  return [
    `You wrote the on-screen copy for a ${spec.duration} second launch film for ${appName} ("${spec.title}"). ` +
    "These slot values are over their character limits and would be cut mid-sentence on screen. Rewrite " +
    "each one to fit inside its limit with room to spare (aim two characters under). Keep the meaning, the " +
    "voice and the punctuation style; shorten by choosing tighter words, never by trailing off. Count the " +
    "characters of every value before you answer.",
    `OVER LIMIT:\n${list}`,
    "OUTPUT: ONLY one RFC 8259 JSON object, no fences, no commentary: {\"slots\": {<each id above>: string}}",
  ].join("\n\n");
}

/**
 * Photo briefs for the film and the launch image: one paragraph per plate,
 * written from the profile so the pictures show this app's people and place.
 * Two parts: the model first lists the signature things of the app's world
 * (users by role, the place, the props, the moments) and then writes every
 * brief around the product's real users doing the real job with at least
 * three of those things named, so a stranger knows the domain in a second.
 * The forge appends the house grade (film stock, palette, "wordless"), so a
 * brief describes only the scene. New in the short-video branch.
 */
export function buildStudioImagesQuestion(plates: PlateSpec[], profile: Profile, appName: string,
                                          dna?: BrandDna | null, campaign = ""): string {
  const list = plates.map((p) =>
    `- ${p.id} (${p.for === "cards" ? "the launch image on the cards" : `the film at ${p.when} s`}, ` +
    `${p.size.startsWith("1536") ? "landscape" : "portrait"}, ${p.grade} grade): ${p.hint}.` +
    (p.example ? ` Example for an unrelated product: "${p.example}"` : "")).join("\n");
  const parts = [
    `You brief a photographer for ${appName}'s launch film and launch cards. The photographs must belong ` +
    "to this app's world so plainly that a stranger names the domain in one second, before reading a word. " +
    "Work in two parts.",
    "PART ONE, THE WORLD: from APP_PROFILE (and BRAND_DNA when present) list 8 to 12 signature things of " +
    "this app's world: its users by role, the place where they do the work, the objects and props on the " +
    "tables and the walls, and the moments of the job. Each is a short noun phrase naming something visible " +
    "and photographable. For example, for a hackathon judging tool the list would hold: long tables of teams " +
    "behind laptops covered in stickers, lanyards and badges, a pitch stage with a projector, a scoreboard " +
    "screen, project posters on easels, trophies, pizza boxes and energy drinks, a countdown clock, judges " +
    "with clipboards walking the tables. Build the list for THIS app from its own profile, never from that " +
    "example.",
    "PART TWO, THE BRIEFS: write one photograph per plate below. Every brief shows the product's actual " +
    "users, by role, doing the actual job at a named moment of the product's workflow (say the moment: the " +
    "hour before the deadline, the first pass through the queue, the review after the run), and names at " +
    "least three things from your world list, so the domain is unmistakable in one second. Be concrete: who " +
    "is in frame (their role, not a name), what they are doing with their hands, what is around them, where " +
    "the camera stands, the hour and the light. Generic offices, generic desks, generic meeting rooms and " +
    "generic conference tables are forbidden: if a room is in frame it is the room these users work in, " +
    "dressed with the props of their world. The warm plates keep the world in frame: tidied props are still " +
    "this world's props, and the place stays visible behind the person (the stage, the screens, the banners, " +
    "the crowd thinning out), so the after picture names the domain as fast as the before.",
    "RULES: 1) Describe a scene, never a poster: no legible text, no logos, no product interface, no brand " +
    "names; screens may glow with charts, code or lists, and banners, badges and lanyards may be in frame, " +
    "all wordless, because the film sets its own type; so never ask for a reading: a clock, a scoreboard, a " +
    "badge or a sheet is described by its shape, its glow and its state (nearly out, half full, dense with " +
    "marks), never by the words or digits on it. 2) One paragraph per plate, 50 to 100 words, plain " +
    "sentences. 3) The cold plates show the problem (the load, the fatigue, the hour); the warm plates show " +
    "the same person after the app, calm, with room to breathe; keep one setting so the four read as one " +
    "story, and make the person in the pile plate and the person in the arrival plate the SAME person (same " +
    "gender, age, hair, clothes), described the same way in both briefs, so the film shows one person's day " +
    "turn; the hero shows that person with one or two colleagues in the same world. 4) People are ordinary " +
    "and varied; no stereotypes, no real or famous people, no children. 5) Nothing unsafe, violent or " +
    "sexual. 6) If CAMPAIGN_ANGLE is present, let it choose the moment. 7) The examples describe an " +
    "unrelated product; never borrow their subject, their place or their props.",
    `PLATES:\n${list}`,
    `APP_NAME: ${appName}`,
    `APP_PROFILE: ${pyJsonDumps(profile)}`,
  ];
  if (pyTruthy(dna)) {
    parts.push(`BRAND_DNA: ${pyJsonDumps(dna)}`);
  }
  if (campaign) {
    parts.push(`CAMPAIGN_ANGLE: ${campaign}`);
  }
  parts.push("OUTPUT: ONLY one RFC 8259 JSON object, no fences, no commentary: {\"domain\": [string] (the 8 to " +
             "12 signature things from part one, each a short noun phrase), \"briefs\": {<each plate id above>: " +
             "string}, \"subject\": string (one sentence: who the person in the pictures is, by role, and where " +
             "they are)}");
  return parts.join("\n\n");
}

/**
 * The voice-over: a founder pitching, in lines that land on the film's beats.
 * The film's on-screen words travel along so the lines stay in sync without
 * reading them aloud. New in the short-video-audio branch.
 */
export function buildStudioVoiceQuestion(spec: ConceptSpec, slots: Record<string, string>, profile: Profile,
                                         appName: string, dna?: BrandDna | null, campaign = ""): string {
  const voice = spec.voice;
  const segs = (voice?.segments ?? []).map((s) =>
    `- ${s.id} (${s.at} to ${s.until} s, at most ${s.words} words): ${s.hint}`).join("\n");
  const beats = spec.beats.map((b) =>
    `- ${b.t} s: ${b.what} On screen: ${b.slots.map((id) => `${id}="${slots[id] ?? ""}"`).join(", ")}`).join("\n");
  const parts = [
    `You are the founder of ${appName}, speaking the voice-over of its ${spec.duration} second launch film. ` +
    (voice?.style ?? ""),
    "RULES: 1) Talk to the listener as one person pitching: what is broken, what this app does, how it works, " +
    "what you get, what to do next. Present tense, plain words, no hype (game-changer, revolutionary, seamless, " +
    "unleash, elevate, next-gen, cutting-edge, supercharge), no em dashes. 2) Never describe or narrate what is " +
    "on screen (no \"as you can see\", no \"the screen shows\"); the pictures and the words on screen are your " +
    "backdrop. Do not read the on-screen lines aloud word for word; say what a speaker would say at that " +
    "moment. 3) Each segment must land inside its window: respect its word budget, count the words, shorter is " +
    "better; a segment is one to three short spoken sentences. 4) Numbers: only those in APP_PROFILE or " +
    "BRAND_DNA, said as a speaker says them (\"forty-eight\", not \"48\"); the on-screen scenario numbers (a " +
    "count of items, minutes, people) are illustration, never spoken as fact: say \"a pile of reports\", not " +
    "\"forty-seven reports\". Never name another product or company. 5) Say the app name " +
    "exactly as APP_NAME in the drop and in the close; never read the web address. 6) In the brand's voice when " +
    "BRAND_DNA is present; otherwise confident and direct. 7) If CAMPAIGN_ANGLE is present, the problem and the " +
    "close carry it. 8) Write for speech: contractions are fine; no lists, colons, brackets, quotation marks or " +
    "abbreviations (say \"links\" or \"repos\" rather than U-R-Ls).",
    `THE FILM (what is on screen in each beat, so your lines land on the right moment):\n${beats}`,
    `SEGMENTS TO WRITE:\n${segs}`,
    `APP_NAME: ${appName}`,
    `APP_PROFILE: ${pyJsonDumps(profile)}`,
  ];
  if (pyTruthy(dna)) {
    parts.push(`BRAND_DNA: ${pyJsonDumps(dna)}`);
  }
  if (campaign) {
    parts.push(`CAMPAIGN_ANGLE: ${campaign}`);
  }
  parts.push("OUTPUT: ONLY one RFC 8259 JSON object, no fences, no commentary: {\"segments\": {<each segment id " +
             "above>: string}, \"tone\": string (three words on how it should be spoken)}");
  return parts.join("\n\n");
}

/** A shorter take on the spoken lines that ran past their windows. */
export function buildStudioVoiceRepairQuestion(offenders: { id: string; text: string; words: number; budget: number }[],
                                               appName: string): string {
  const list = offenders.map((o) => `- ${o.id} (${o.words} words now, at most ${o.budget}): "${o.text}"`).join("\n");
  return [
    `You wrote the voice-over of ${appName}'s launch film. These lines run past their windows when spoken. ` +
    "Rewrite each inside its word budget with room to spare: keep the meaning and the pitch, drop words, never " +
    "trail off, still one to three short spoken sentences. Count the words before you answer.",
    `TOO LONG:\n${list}`,
    "OUTPUT: ONLY one RFC 8259 JSON object, no fences, no commentary: {\"segments\": {<each id above>: string}}",
  ].join("\n\n");
}

function isDict(v: unknown): v is Dict {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** rr.run_understand, repo_url may be empty: site-only analysis is supported. */
export function buildUnderstandQuestion(repoUrl: string, siteUrl: string, feedback = ""): string {
  const repoLine = repoUrl
    ? `Repository URL: ${repoUrl}`
    : "Repository URL: NONE SUPPLIED, analyse from the live site " +
      "alone and set analysis_degraded true.";
  let q = `Produce the app profile for this app.\n${repoLine}\nLive product URL: ${siteUrl}`;
  if (feedback) {
    q += "\nBUILDER_FEEDBACK (the app's builder reviewed a previous draft " +
         `and asks you to incorporate this): ${feedback}`;
  }
  return q;
}

/** rr.run_commercial, task: 'pricing' | 'listing'. */
export function buildCommercialQuestion(task: string, profile: Profile, currentListing = "",
                                        chosenPricing = ""): string {
  const parts = [`TASK: ${task}`, `APP_PROFILE: ${pyJsonDumps(profile)}`];
  if (currentListing) {
    parts.push(`CURRENT_LISTING: ${currentListing}`);
  }
  if (chosenPricing) {
    parts.push(`CHOSEN_PRICING (the builder chose these tiers in the Commercial stage; the listing quotes these prices and no others): ${chosenPricing}`);
  }
  return parts.join("\n");
}

/** rr.run_targets, curated venue pool rides along when non-empty. */
export function buildTargetsQuestion(profile: Profile, curatedVenues?: unknown[] | null): string {
  const parts = [`APP_PROFILE: ${pyJsonDumps(profile)}`];
  if (pyTruthy(curatedVenues)) {
    parts.push(`CURATED_VENUES: ${pyJsonDumps(curatedVenues)}`);
  }
  return parts.join("\n");
}

/** rr.run_brand, task: 'dna' (scrape SITE_URL) or 'campaigns' (DNA + profile). */
export function buildBrandQuestion(task: string, profile: Profile, siteUrl = "",
                                   dna?: BrandDna | null, feedback = ""): string {
  const parts = [`TASK: ${task}`, `APP_PROFILE: ${pyJsonDumps(profile)}`];
  if (siteUrl) {
    parts.push(`SITE_URL: ${siteUrl}`);
  }
  if (pyTruthy(dna)) {
    parts.push(`BRAND_DNA: ${pyJsonDumps(dna)}`);
  }
  if (feedback) {
    parts.push("BUILDER_FEEDBACK (the builder reviewed a previous draft " +
               `and asks for these changes): ${feedback}`);
  }
  return parts.join("\n");
}

/** A profile the understand pass could not evidence: degraded, or under half confidence. */
export function thinProfile(profile: Profile): boolean {
  const p = profile as unknown as Record<string, unknown>;
  if (pyTruthy(p.analysis_degraded)) return true;
  const conf = p.confidence as Record<string, unknown> | undefined;
  const overall = Number(conf?.overall ?? NaN);
  return Number.isFinite(overall) && overall < 0.5;
}

/** rr.run_asset, section order (BRAND_DNA → TARGET → TONE → feedback) is contractual. */
export function buildAssetQuestion(assetType: string, profile: Profile,
                                   target?: TargetData | null, tone = "",
                                   feedback = "", brandDna?: BrandDna | null, rules = "",
                                   extras?: { commercial?: string; campaign?: string; previousDraft?: string }): string {
  const parts = [`ASSET_TYPE: ${assetType}`, `APP_PROFILE: ${pyJsonDumps(profile)}`];
  if (pyTruthy(brandDna)) {
    parts.push(`BRAND_DNA: ${pyJsonDumps(brandDna)}`);
  }
  if (pyTruthy(target)) {
    parts.push(`TARGET: ${pyJsonDumps(target)}`);
  }
  if (tone) {
    parts.push(`TONE: ${tone}`);
  }
  if (rules) {
    parts.push(rules);
  }
  // a profile inferred without the site (asleep, 503) has nothing to draft from; the platform's hook patterns must not fill the gap
  if (thinProfile(profile)) {
    parts.push("THIN_PROFILE: this profile was inferred without reading the site (analysis degraded or confidence under " +
               "0.5), so it holds no verified mechanism, story or number. This overrides every hook pattern and every " +
               "platform rule that asks for an origin story, a moment, a limitation or a how-it-works: describe the app " +
               "only in the words of its one-liner and category, name no feature, workflow, export, integration or " +
               "step it does not state, and where a platform wants the builder's story write the placeholder " +
               "\"[Builder: two sentences on why you built it]\" as its own paragraph. Keep the draft short; a short " +
               "true draft beats a long plausible one. Say in warnings that the profile was thin and the builder " +
               "should re-analyze once the site answers.");
  }
  if (extras?.campaign) {
    parts.push(`CAMPAIGN_ANGLE (the builder chose this angle in the Brand stage; the post carries it): ${extras.campaign}`);
  }
  if (extras?.commercial) {
    parts.push(`COMMERCIAL (approved pricing and listing copy; reuse the tagline and tier names, never invent prices): ${extras.commercial}`);
  }
  if (extras?.previousDraft) {
    parts.push(`PREVIOUS_DRAFT (the last version of this same post; the builder's feedback below refers to it. Keep what worked, change what they ask): ${extras.previousDraft}`);
  }
  if (feedback) {
    parts.push("BUILDER_FEEDBACK (the builder reviewed a previous draft " +
               `of this asset and asks for these changes): ${feedback}`);
  }
  return parts.join("\n");
}

/**
 * rr.SIGNAL_FALLBACK_COMMUNITIES, generic dev communities used when a project
 * has no ranked targets yet.
 */
export const SIGNAL_FALLBACK_COMMUNITIES = ["opensource", "SideProject", "selfhosted",
                                            "webdev", "devtools", "programming"];

/**
 * rr.build_signals_question, APP_PROFILE + ICP_PAIN (surfaced so the finder
 * mines problem phrasings from it) + COMMUNITIES (for site-scoped passes).
 */
export function buildSignalsQuestion(profile: Profile, communities?: unknown[] | null): string {
  const parts = [`APP_PROFILE: ${pyJsonDumps(profile)}`];
  const icp = profile["icp"];
  const pain = isDict(icp) ? (Object.prototype.hasOwnProperty.call(icp, "pain") ? icp["pain"] : null) : null;
  if (pyTruthy(pain)) {
    parts.push(`ICP_PAIN: ${pyStr(pain)}`);
  }
  const hints: string[] = [];
  for (const k of ["one_liner", "description", "use_cases", "differentiators", "category", "target_user"]) {
    const v = profile[k];
    if (pyTruthy(v)) hints.push(`${k}: ${typeof v === "string" ? v : pyJsonDumps(v)}`);
  }
  if (hints.length > 0) {
    parts.push(`PAIN_HINTS (derive the ICP's own words for the problem from these; search the problem, not the product name):\n${hints.join("\n")}`);
  }
  parts.push(`COMMUNITIES: ${pyJsonDumps(pyTruthy(communities) ? communities : SIGNAL_FALLBACK_COMMUNITIES)}`);
  return parts.join("\n");
}

/** Keys rescore_signals projects out of the profile for the judge, in order. */
export const RESCORE_SUMMARY_KEYS = ["one_liner", "description", "icp",
                                     "differentiators", "proof_points", "voice"] as const;

/**
 * rr.rescore_signals summary construction: `{k: profile.get(k) for k in (...)
 * if k in profile}`, key ORDER is the tuple order, not the profile's, and
 * only present keys are included (a key present with null stays null).
 */
export function buildRescoreSummary(profile: Profile): Dict {
  const out: Dict = {};
  for (const k of RESCORE_SUMMARY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(profile, k) && profile[k] !== undefined) {
      out[k] = profile[k];
    }
  }
  return out;
}

/**
 * The judge prompt inside rr.rescore_signals, VERBATIM, including the
 * help-first REPLY RULES and the RFC 8259 JSON output contract.
 *
 * `platform` mirrors `s.get('platform', 'forum')`: pass undefined when the
 * signal has no platform key (→ 'forum'); null renders as 'None' exactly as
 * Python's f-string would.
 */
export function buildRescoreQuestion(summary: Dict, platform: unknown, threadText: string): string {
  const plat = platform === undefined ? "forum" : pyStr(platform);
  return (
    "You are a strict relevance judge AND reply writer for launch outreach. " +
    "Below is an APP and the ACTUAL CONTENT of a discussion thread. First " +
    "decide if replying to this thread with this app is genuinely helpful " +
    "to the thread's author, i.e. they are asking for, or struggling " +
    "with, what this app does. Passing mentions of the topic do NOT count. " +
    "A thread whose author is announcing, launching, releasing or showing off " +
    "their OWN tool in this space is NEVER relevant, however close the topic: " +
    "that person is a builder, not a buyer, and a reply naming this app there " +
    "reads as an advert. Relevant means the author states a need in the first " +
    "person or is visibly living the problem this app solves. " +
    "IF AND ONLY IF relevant, also write the reply the builder should " +
    "post. REPLY RULES: open by engaging the author's SPECIFIC situation, " +
    "reference a concrete detail from the thread (their tool, error, " +
    "constraint, or exact question); NEVER open with a canned phrase like " +
    "'I built a tool for exactly this'. Genuinely help FIRST in 2-4 " +
    "sentences, the reply must be worth upvoting even if they never " +
    "click. Then, only if the app truly fits, one plain-words sentence " +
    "disclosing you built it, mentioning it ONCE with {APP_URL}. Match " +
    `the norms of platform '${plat}', Reddit and ` +
    "HN are hostile to marketing. Max 120 words. No emoji, no hype " +
    "words, no bullet lists. Reply with ONLY RFC 8259 JSON: " +
    "{\"relevant\": true|false, \"confidence\": number 0-1, " +
    "\"why\": string (one sentence), \"reply\": string (\"\" when not relevant)}\n\n" +
    `APP: ${pyJsonDumps(summary)}\n\nTHREAD CONTENT: ${threadText}`
  );
}

/**
 * The pricing choice (lk_studio.pipe, a toolless LLM pipe): after the
 * commercial pipe has done the research, this ask turns it into a billing
 * decision and three plan options the builder can pick between, with the
 * market rate and the monthly revenue at a few sizes. Numbers may only come
 * from the research; none may be invented. New in the short-video-audio
 * branch, not a rr.py port.
 */
export function buildPricingOptionsQuestion(profile: Profile, pricingResult: Dict): string {
  // the research without its query log: the competitors and their tiers, the rejected names, the recommendation
  const compact: Dict = {
    competitors: pricingResult.competitors ?? [],
    rejected: pricingResult.rejected ?? [],
    recommendation: pricingResult.recommendation ?? {},
    confidence: pricingResult.confidence ?? {},
  };
  const parts = [
    "You are Launch Kit's pricing adviser. PRICING_RESEARCH below is what a research pass found for the " +
    "app in APP_PROFILE: the competitors that actually recur in comparisons, the tiers read from their " +
    "pricing pages (empty when a page could not be read), the names rejected, and a recommendation with " +
    "tiers in monthly USD. Turn that into a decision the builder can make: which billing model fits, what " +
    "the market charges, and three plan options to choose between.",
    "PART ONE, BILLING MODELS: weigh exactly these five models for this app: 'monthly subscription', " +
    "'annual subscription', 'one-time purchase', 'usage-based', 'free plus paid tiers'. For each say " +
    "whether the fit is good, possible or poor, and why in one plain sentence grounded in the profile " +
    "(who buys, how often they use it, what the competitors do). List all five; use the model names " +
    "exactly as written here.",
    "PART TWO, MARKET RATE: two to four plain sentences on what the established competitors charge, " +
    "naming them and quoting only prices that appear in PRICING_RESEARCH, and the going rate for this " +
    "category that follows from them. When no established competitor's prices were read, say so plainly " +
    "and that the numbers below are estimates from the category, not anchored on read pages.",
    "PART THREE, THREE OPTIONS: exactly three plan options. Option 1 restates the recommendation: the " +
    "same tier names, prices, who_its_for and includes as recommendation.tiers, its billing being the " +
    "model that recommendation.model maps to (freemium or free maps to 'free plus paid tiers', " +
    "subscription to 'monthly subscription', one-time to 'one-time purchase', usage to 'usage-based'). " +
    "Options 2 and 3 are real alternatives that differ from option 1 in billing model or in positioning, " +
    "for example an annual subscription with a discount, a single one-time price, a usage-based price, " +
    "or a higher-positioned tier set for a narrower buyer. Each alternative uses one of the five billing " +
    "models, and each is one a buyer in this category would recognise. price_usd_month is always the " +
    "monthly figure: for an annual subscription it is the yearly price divided by 12, and the option's " +
    "positioning states the yearly amount actually charged; for a one-time purchase it is the purchase " +
    "price, and revenue_at counts that many purchases in a month; for usage-based it is the expected " +
    "monthly spend of a typical customer on that tier. A free tier has price_usd_month 0.",
    "INCLUDED: a tier's includes never change a quota, a seat count or a feature relative to " +
    "APP_PROFILE.pricing_current unless the option's positioning says in plain words that it is a product " +
    "change; a price move keeps what the tier includes.",
    "REVENUE: revenue_at is the monthly revenue in USD at 10, 50 and 200 paying customers, computed from " +
    "the option's PAID tiers only (price above 0): spread the paying customers evenly across the paid " +
    "tiers, so revenue equals the number of customers times the average paid price. Do the arithmetic; " +
    "whole dollars. market_rate_note says in one sentence how the option's prices sit against the " +
    "competitor prices in the research (below, level with, above, or unanchored when none were read).",
    "RULES: 1) Never invent a competitor price, a user count or a benchmark: the only competitor numbers " +
    "you may write are numbers present in PRICING_RESEARCH; if none are present, say the option is " +
    "unanchored instead of quoting one. 2) Plain concrete sentences, no hype words, no markdown. 3) " +
    "Keep it compact: at most 4 tiers per option, at most 5 short items in includes, one sentence for " +
    "why, positioning, market_rate_note and when_to_pick.",
    `APP_PROFILE: ${pyJsonDumps(profile)}`,
    `PRICING_RESEARCH: ${pyJsonDumps(compact)}`,
    "OUTPUT: ONLY one RFC 8259 JSON object, no fences, no commentary: {\"models_considered\": [{\"model\": " +
    "string (one of the five names), \"fit\": \"good\"|\"possible\"|\"poor\", \"why\": string}], " +
    "\"market_rate\": string, \"options\": [{\"name\": string, \"billing\": string (one of the five " +
    "names), \"positioning\": string, \"tiers\": [{\"name\": string, \"price_usd_month\": number|null, " +
    "\"who_its_for\": string, \"includes\": [string]}], \"market_rate_note\": string, \"revenue_at\": " +
    "{\"10\": number, \"50\": number, \"200\": number}, \"when_to_pick\": string}]} with exactly three " +
    "options, the first restating the recommendation.",
  ];
  return parts.join("\n\n");
}
