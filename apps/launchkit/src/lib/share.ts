/**
 * "Share on <platform>" — the standard share-intent pattern: open the
 * platform's own composer with the draft already in it, the way referral
 * links do. Where a platform has no composer intent, we copy the text and open
 * the right page. Every builder replaces the {APP_URL} placeholder first.
 */
export type ShareLink = { platform: string; label: string; href: string; copyFirst?: string; note?: string };

const enc = encodeURIComponent;
export const fillUrl = (s: unknown, url: string) =>
  url ? String(s ?? '').replaceAll('{APP_URL}', url) : String(s ?? '');

/** The launch's public URL, from whichever field the project record carries. */
export function pickUrl(o: Record<string, unknown>): string {
  for (const k of ['url', 'site_url', 'website', 'homepage', 'app_url', 'repo_url', 'repo']) {
    const v = o[k];
    if (typeof v === 'string' && /^https?:\/\//.test(v)) return v;
  }
  return '';
}

export function shareLinks(assetType: string, data: Record<string, unknown>, appUrl: string, subreddit?: string): ShareLink[] {
  const t = (k: string) => fillUrl(data[k], appUrl);
  switch (assetType) {
    case 'x_post':
      return [{ platform: 'x', label: 'Share on X', href: `https://x.com/intent/post?text=${enc(t('post'))}` }];
    case 'linkedin_post':
      return [{ platform: 'linkedin', label: 'Share on LinkedIn', href: `https://www.linkedin.com/feed/?shareActive=true&text=${enc(t('post'))}` }];
    case 'reddit_post': {
      const sub = (subreddit ?? '').replace(/^\/?r\//, '').replace(/\/$/, '');
      return [{ platform: 'reddit', label: sub ? `Post to r/${sub}` : 'Post on Reddit',
        href: `https://www.reddit.com/${sub ? `r/${sub}/` : ''}submit?title=${enc(t('title'))}&text=${enc(t('body'))}` }];
    }
    case 'show_hn':
      return [{ platform: 'hn', label: 'Submit to Hacker News', href: `https://news.ycombinator.com/submitlink?u=${enc(appUrl)}&t=${enc(t('title'))}`,
        copyFirst: t('body'), note: 'HN takes the title from the link; your text is on the clipboard for the first comment.' }];
    case 'producthunt':
      return [{ platform: 'producthunt', label: 'Open Product Hunt', href: 'https://www.producthunt.com/posts/new',
        copyFirst: [t('name'), t('tagline'), '', t('description'), '', t('first_comment')].join('\n'), note: 'Product Hunt has no prefill; the listing text is on your clipboard.' }];
    case 'newsletter_pitch':
      return [{ platform: 'email', label: 'Open in email', href: `mailto:?subject=${enc(t('subject'))}&body=${enc(t('pitch'))}` }];
    default:
      return [];
  }
}
