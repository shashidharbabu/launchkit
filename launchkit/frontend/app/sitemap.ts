import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/** Only the public surface. The workspace lives behind the console. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/#procedure`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/#questions`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
  ];
}
