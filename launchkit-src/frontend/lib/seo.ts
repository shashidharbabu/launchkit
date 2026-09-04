/**
 * One source of truth for search + answer-engine surfaces: metadata,
 * sitemap, robots, JSON-LD, and the on-page FAQ all read from here.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://launchkit.rocketride.ai'
).replace(/\/$/, '');

export const SITE_NAME = 'Launch Kit';

/** Answer-shaped: what the product is, in one sentence a model can quote. */
export const TAGLINE = 'Go-to-market in a box for app publishers.';

export const DESCRIPTION =
  'Launch Kit turns a shipped app into a signed launch plan: it reads your repo and live site, ' +
  'recommends pricing, rewrites your store listing, ranks the venues where your app should launch, ' +
  'writes platform-native posts, finds people publicly asking for what you built, and attributes ' +
  'every signup to the venue that produced it. Assisted, never autonomous — you approve every step.';

/** Phrases real buyers type. Used for keywords + llms.txt framing. */
export const KEYWORDS = [
  'app go to market',
  'apps GTM',
  'go to market for applications',
  'publishing apps',
  'how to launch an app',
  'app launch plan',
  'app store listing optimization',
  'app marketing for indie developers',
  'Product Hunt launch',
  'Show HN post',
  'launch venues for developer tools',
  'app launch attribution',
  'GTM automation',
  'RocketRide App Store',
];

/** Answer-engine bait: short questions, quotable answers. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is a go-to-market plan for an app?',
    a: 'A GTM plan for an app answers four questions: who it is for, what it costs, where it launches, and what gets posted in each place. Launch Kit produces all four from your repo and live site — an app profile, a pricing recommendation, a ranked list of launch venues, and a platform-native post for each one — then attributes signups back to the venue that produced them.',
  },
  {
    q: 'How do I launch an app I just published?',
    a: 'Launch in this order: write the profile (who it is for and why it is different), set pricing against real competitors, pick five venues whose rules you have read, write one native post per venue, and post over several days rather than all at once. Launch Kit runs that sequence in six stages with three approval gates.',
  },
  {
    q: 'Where should I launch my app?',
    a: 'The right venues are the niche ones: subreddits and communities where your specific users already ask for what you built, plus directories that accept your category. Five well-chosen venues beat fifty. Launch Kit ranks venues for your app, includes each venue’s posting rules and submission link, and orders them into a launch sequence.',
  },
  {
    q: 'Does Launch Kit post to Reddit, Hacker News or Product Hunt for me?',
    a: 'No. Launch Kit is assisted, never autonomous. It drafts posts and replies; you read, edit and approve each one, then post it yourself. Nothing publishes without a human signature.',
  },
  {
    q: 'How do I know which launch channel got me signups?',
    a: 'Each venue in your plan gets its own tracked link. When someone signs up through it, the signup is attributed to that venue — so you can say "r/reactjs produced 3 subscribers" instead of guessing.',
  },
  {
    q: 'What does Launch Kit do when nobody is asking for my app yet?',
    a: 'It says so. The signals stage searches public threads for people describing your problem, verifies every thread it finds, and returns an empty queue rather than inventing demand.',
  },
];

/** Public, crawlable routes. The workspace (/p/*, /dashboard) is private. */
export const PUBLIC_ROUTES = ['/'];
