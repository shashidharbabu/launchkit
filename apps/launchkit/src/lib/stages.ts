/**
 * The eight-stage procedure line (00-direction.md). A true sequence, so the
 * numbering is earned; names are fixed vocabulary (voice.md). Brand sits right
 * after Profile: its DNA feeds every stage that writes copy. Assets (slug
 * `studio`, since `assets` is Social Launch's internal slug) follows Social
 * Launch: it renders the brand kit, the launch cards and the reel from the
 * profile, the DNA and the live site. Each stage carries its summary for the
 * workspace header, one sentence per step and in the order the step cards
 * appear on the stage, and, where it ends in a human decision, its gate number.
 */
export const STAGES = [
  { num: '01', slug: 'profile', name: 'Profile', gate: 1,
    summary: 'One step: check what Launch Kit thinks your app is, fix anything wrong, then approve it.' },
  { num: '02', slug: 'brand', name: 'Brand', gate: null,
    summary: 'Step one: your site\'s voice, observed rather than invented. Step two: the campaign angle every post will carry.' },
  { num: '03', slug: 'commercial', name: 'Commercial', gate: null,
    summary: 'Step one: choose the pricing you launch with, anchored on real competitors. Step two: approve your store listing.' },
  { num: '04', slug: 'assets', name: 'Social Launch', gate: 2,
    summary: 'One step: one post per platform, written to that platform\'s rulebook. Draft each, then approve the ones you would post.' },
  { num: '05', slug: 'studio', name: 'Assets', gate: null,
    summary: 'Step one: read your site for its colours and logo. Step two: make the launch images. Step three: render the launch cards. Step four: write the script, speak the voice-over and render the 24-second reel.' },
  { num: '06', slug: 'targets', name: 'Targets', gate: 3,
    summary: 'Step one: rank where this app should launch, with each venue\'s rules. Step two: tick the few venues you will actually do.' },
  { num: '07', slug: 'signals', name: 'Signals', gate: null,
    summary: 'Step one: search for people publicly asking for what you built. Step two: work the queue, each signal with a drafted reply.' },
  { num: '08', slug: 'plan', name: 'Plan', gate: null,
    summary: 'Your launch in order: the decisions it carries, the plan as a document, a tracked link per venue, and the signups attributed back to each.' },
] as const;
export type StageSlug = (typeof STAGES)[number]['slug'];
export const STAGE_SLUGS = STAGES.map((s) => s.slug);
export function stageIndex(slug: string): number {
  return STAGES.findIndex((s) => s.slug === slug);
}
export function stageBySlug(slug: string) {
  return STAGES.find((s) => s.slug === slug) ?? null;
}
