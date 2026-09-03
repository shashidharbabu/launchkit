/** Asset-type meta labels (components.md AssetCard: `SHOW HN`, `X POST`…). */
export const ASSET_LABELS: Record<string, string> = {
  x_post: 'X',
  linkedin_post: 'LinkedIn',
  reddit_post: 'Reddit',
  producthunt: 'Product Hunt',
  show_hn: 'Hacker News',
  newsletter_pitch: 'Newsletter',
  video_script: 'Short video',
};

export const ASSET_TYPES = Object.keys(ASSET_LABELS);
