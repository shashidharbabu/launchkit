/**
 * The eight-stage procedure line (00-direction.md). A true sequence, so the
 * numbering is earned; names are fixed vocabulary (voice.md). Brand sits right
 * after Profile: its DNA feeds every stage that writes copy. Assets (slug
 * `studio`, since `assets` is Social Launch's internal slug) follows Social
 * Launch: it renders the brand kit, the launch cards and the reel from the
 * profile, the DNA and the live site. Each stage carries its one-sentence
 * summary for the workspace header and, where it ends in a human decision,
 * its gate number.
 */
export const STAGES = [
  { num: '01', slug: 'profile', name: 'Profile', gate: 1,
    summary: 'What Launch Kit thinks your app is. Check it, fix anything wrong, then approve.' },
  { num: '02', slug: 'brand', name: 'Brand', gate: null,
    summary: 'Your site\'s voice, vocabulary and messages, observed rather than invented, and the campaign angles you would run.' },
  { num: '03', slug: 'commercial', name: 'Commercial', gate: null,
    summary: 'Pricing tiers and listing copy drafted from the approved profile.' },
  { num: '04', slug: 'assets', name: 'Social Launch', gate: 2,
    summary: 'One post per platform, written to that platform\'s rulebook. Approve the ones you would post.' },
  { num: '05', slug: 'studio', name: 'Assets', gate: null,
    summary: 'Your brand kit, launch cards and a 24-second reel, rendered from your site\'s own colours and your profile\'s real claims.' },
  { num: '06', slug: 'targets', name: 'Targets', gate: 3,
    summary: 'Where this app should launch, ranked, with each venue\'s rules. You choose the few that count.' },
  { num: '07', slug: 'signals', name: 'Signals', gate: null,
    summary: 'People publicly asking for what you built, with a drafted reply for each.' },
  { num: '08', slug: 'plan', name: 'Plan', gate: null,
    summary: 'Your launch in order, each venue with its own tracked link.' },
] as const;
export type StageSlug = (typeof STAGES)[number]['slug'];
export const STAGE_SLUGS = STAGES.map((s) => s.slug);
export function stageIndex(slug: string): number {
  return STAGES.findIndex((s) => s.slug === slug);
}
export function stageBySlug(slug: string) {
  return STAGES.find((s) => s.slug === slug) ?? null;
}
