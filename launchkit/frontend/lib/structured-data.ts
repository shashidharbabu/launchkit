import { SITE_URL, SITE_NAME, TAGLINE, DESCRIPTION, FAQ } from '@/lib/seo';

/**
 * JSON-LD for the landing page. Three graphs that answer engines read
 * differently: what the thing is (SoftwareApplication), how the job is done
 * (HowTo — the six stages), and the questions themselves (FAQPage).
 */

const softwareApplication = {
  '@type': 'SoftwareApplication',
  '@id': `${SITE_URL}/#app`,
  name: SITE_NAME,
  alternateName: 'RocketRide Launch Kit',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Go-to-market / app launch',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: DESCRIPTION,
  slogan: TAGLINE,
  featureList: [
    'App profile drafted from your repo and live site',
    'Pricing recommendation from real competitor pricing pages',
    'App store listing rewrite',
    'Ranked launch venues with each venue’s posting rules',
    'Platform-native launch posts (Reddit, Show HN, Product Hunt, X, LinkedIn, newsletters)',
    'Verified public intent signals with drafted replies',
    'Launch plan with per-venue tracked links and signup attribution',
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'Indie developers and app publishers taking an app to market',
  },
  publisher: { '@id': `${SITE_URL}/#org` },
};

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#org`,
  name: 'RocketRide',
  url: 'https://rocketride.ai',
};

const howTo = {
  '@type': 'HowTo',
  '@id': `${SITE_URL}/#howto`,
  name: 'How to take a shipped app to market',
  description:
    'The six-stage launch procedure Launch Kit runs, with a human approval gate after the profile, the posts, and the venue selection.',
  totalTime: 'PT1H',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Profile the app',
      text: 'Read the repo and live site and write down who the app is for, why it is different, and what you can prove. Approve it before anything else runs.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Set pricing and rewrite the listing',
      text: 'Read real competitor pricing pages, choose tiers against those numbers, and rewrite the store listing around the differentiators.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Write platform-native posts',
      text: 'One post per venue in that venue’s voice — a Reddit post that reads like Reddit, a Show HN that survives Hacker News. Approve each one.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Rank and choose launch venues',
      text: 'Rank subreddits, directories and communities for this specific app, read each venue’s rules, and select the few that make the plan.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Answer people already asking',
      text: 'Find public threads where people describe the problem the app solves, verify each thread is real and still open, and reply helpfully.',
    },
    {
      '@type': 'HowToStep',
      position: 6,
      name: 'Launch and attribute',
      text: 'Post the approved assets across the selected venues in sequence using per-venue tracked links, then read which venue produced which signup.',
    },
  ],
};

const faqPage = {
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: FAQ.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [softwareApplication, organization, howTo, faqPage],
};
