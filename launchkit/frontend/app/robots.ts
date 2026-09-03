import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/** The workspace is private; everything else is open — including to the
 *  answer engines, which we want quoting us rather than guessing. */
const PRIVATE = ['/p/', '/dashboard', '/launches', '/runs', '/settings', '/api/'];

/** Retrieval + training crawlers we explicitly welcome (AEO). */
const ANSWER_ENGINES = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'DuckAssistBot',
  'meta-externalagent',
  'Amazonbot',
  'cohere-ai',
  'YouBot',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      ...ANSWER_ENGINES.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
