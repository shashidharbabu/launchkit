/**
 * Ground truth for the buyer-or-builder rule. Every line is a real candidate the
 * finder surfaced on 2026-09-17/18 (from the stores, Lemmy, Bluesky and Mastodon
 * probes), or a minimal edge case beside one. The finder kept most of the
 * "builder" rows as signals, which is the fault being fixed.
 *
 *   buyer    a person stating a need or living the problem: worth a reply
 *   builder  someone announcing, launching or showing their own tool: never a signal
 *   vendor   marketing copy, a trial, a listicle: never a signal
 *   unclear  the gate must not drop these on pattern alone; the judge decides
 */
export type Intent = 'buyer' | 'builder' | 'vendor' | 'unclear';

export const FIXTURE: Array<{ text: string; want: Intent; from: string }> = [
  // ---- builders the finder wrongly kept (khoj, 2026-09-18)
  { text: 'Vault Cortex: open-source MCP server giving AI tools read/write access to your vault', want: 'builder', from: 'khoj #1' },
  { text: '[ANN] Sonar: Offline semantic search and agentic AI chat for Obsidian', want: 'builder', from: 'khoj #2' },
  { text: 'I Built an Encrypted Second Brain, private AI over personal notes', want: 'builder', from: 'khoj #3' },
  { text: 'Just wrapped up Phase 1 of AetherOS, a local-first, private AI operating layer', want: 'builder', from: 'khoj #4' },
  { text: 'How I Turned My Obsidian Vault into a Self-Hosted AI-Powered Knowledge Base', want: 'builder', from: 'khoj #6' },
  // ---- builders from the Lemmy probe
  { text: 'Show HN: Someday, Open-Source Calendly Alternative for Gmail / Google Calendar', want: 'builder', from: 'lemmy hackernews' },
  { text: 'Plausible 3.0.0: Freie und schlanke Google-Analytics-Alternative', want: 'builder', from: 'lemmy heiseOnline' },
  { text: 'NutriTrace v1.0.0-rc.42 released: self-hosted nutrition tracker', want: 'builder', from: 'lemmy selfhosted' },
  { text: 'QST: A GPLv2, self-hosted assessment platform (Alternative to proprietary tools)', want: 'builder', from: 'lemmy selfhosted' },
  { text: 'Introducing Cal.rs, a fast self-hostable scheduling app written in Rust', want: 'builder', from: 'edge' },
  // ---- vendors (Bluesky and Lemmy probes)
  { text: 'Try Meetabl Basic free for 14 days. No credit card upfront. Unlimited event types, Zoom, custom branding', want: 'vendor', from: 'bluesky' },
  { text: 'Typeform is Too Expensive: Try Fabform, the Typeform Alternative', want: 'vendor', from: 'lemmy lobsters' },
  { text: 'Escape the Subscription Trap: Self-Hosted Calendly Alternatives for 2026', want: 'vendor', from: 'dev.to listicle' },
  { text: 'Scheduling meetings does not mean you have to hand over your contact data to big tech. Tymeslot is a powerful open alternative', want: 'vendor', from: 'bluesky' },
  // ---- buyers the finder should keep (cal-com 2026-09-18, Lemmy)
  { text: 'What is your way of reducing back and forth when scheduling a meeting?', want: 'buyer', from: 'cal-com #1' },
  { text: 'It takes an average of 8 emails just to schedule one meeting. There has to be a better way.', want: 'buyer', from: 'cal-com #2' },
  { text: 'Calendly alternative for privacy friendly calendar. As a freelancer I need to sell slots of my time in schedule', want: 'buyer', from: 'lemmy freelancer' },
  { text: 'Self hosted alternative to Calendly? Looking for something I can run on my own box', want: 'buyer', from: 'lemmy selfhosted' },
  { text: 'Creating a booking calendar, plugin? How to add booking calendar to my site', want: 'buyer', from: 'cal-com #4' },
  { text: 'Anyone found a good self-hosted survey tool? We are tired of Qualtrics renewal pricing', want: 'buyer', from: 'edge' },
  { text: 'Is there a way to chat with my notes locally without sending them to OpenAI?', want: 'buyer', from: 'edge' },
  // ---- a buyer who mentions building something adjacent, but is asking: stays a buyer
  { text: 'I built a small booking form for my clinic but it keeps double booking. How do people handle this properly?', want: 'buyer', from: 'edge' },
  // ---- cal-com 2026-09-18 verification run: two buyers, one builder, two pieces of content marketing
  { text: 'Calendly charges you per person, every salesperson on your team costs you another seat', want: 'buyer', from: 'cal-com v #2' },
  { text: 'Headless Booking Systems, evaluating options for embedding booking within our own product', want: 'buyer', from: 'cal-com v #5' },
  { text: 'I built my own Calendly alternative in under an hour using Claude Code', want: 'builder', from: 'cal-com v #4' },
  { text: 'How any SMB can save $2,880+ per year by building their own calendar booking', want: 'vendor', from: 'cal-com v #3' },
  { text: 'I think I found a Calendly alternative that might actually be better for small teams', want: 'unclear', from: 'cal-com v #1' },
  // ---- formbricks 2026-09-18 verification run: two real buyers, one comparison piece for the judge
  { text: 'I cancelled my Typeform subscription last week.', want: 'buyer', from: 'formbricks v #1' },
  { text: 'Typeform just raised their prices again.', want: 'buyer', from: 'formbricks v #2' },
  { text: 'Google Forms vs Typeform vs Survey Flip, honest comparison', want: 'unclear', from: 'formbricks v #3' },
  // ---- plausible 2026-09-18 verification run: two clear buyers, three pieces for the judge
  { text: 'GDPR audit flagged our cookie consent, how strict should we actually be?', want: 'buyer', from: 'plausible v #1' },
  { text: 'Google Ads conversions dropped after the cookie banner update', want: 'buyer', from: 'plausible v #3' },
  { text: "Here's a cautionary tale for what can happen when you slap consent management on without thinking", want: 'unclear', from: 'plausible v #2' },
  { text: "90% of consent banners I audit aren't actually working", want: 'unclear', from: 'plausible v #4' },
  { text: 'Google Analytics, SaaS, or self-hosted? How I chose my analytics stack', want: 'unclear', from: 'plausible v #5' },
  // ---- neither pattern: the judge decides
  { text: 'GDPR cookie consent: how are you doing analytics these days?', want: 'buyer', from: 'plausible forum' },
  { text: 'Thoughts on privacy analytics for small blogs', want: 'unclear', from: 'edge' },
  { text: 'Can private AI actually be trusted? No verification, no privacy guarantees', want: 'unclear', from: 'khoj #5' },
];
