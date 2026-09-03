/**
 * Platform rulebooks — config-as-data. These defaults seed the `platform_rules`
 * table on first run; the owner edits them in Settings and every draft is
 * written against the stored version. The GLOBAL rules apply to every
 * platform and are also enforced in code (sanitizer + gate), because the two
 * things a model cannot be trusted with are punctuation and restraint.
 */
export type Rulebook = { platform: string; name: string; summary: string; rules: string[] };

export const GLOBAL_RULES: string[] = [
  'Never use an em dash (—) or an en dash (–) anywhere. Use a comma, a period, or the word "and". This is checked by code and fails the draft.',
  'No AI-sounding filler: never "In today\'s fast-paced world", "game-changer", "unlock", "seamless", "delve", "elevate", "revolutionize", "excited to announce", "thrilled to share", "leverage", "cutting-edge".',
  'No rhetorical-question openers ("Ever wondered…?"). Open with the concrete thing.',
  'Sentence case only. No Title Case Headlines, no ALL CAPS for emphasis.',
  'One concrete detail beats three adjectives. Never invent metrics, users, testimonials, or benchmarks.',
  'Write like the builder talking to a peer, in first person, in their own voice.',
  'Emoji: at most one, and only where the platform expects it.',
];

export const DEFAULT_RULEBOOKS: Rulebook[] = [
  { platform: 'x_post', name: 'X', summary: 'Short, crisp, on point. Lowercase is fine.',
    rules: [
      'Under 280 characters. One idea per post.',
      'Short and crisp: fragments are fine, filler is not. Lowercase throughout is welcome; never Title Case.',
      'Hook in the first six words. The link goes last as {APP_URL}.',
      'No hashtags, or at most one. No "thread 🧵" unless a thread was requested.',
      'Sound like a person typing, not a brand posting.',
    ] },
  { platform: 'linkedin_post', name: 'LinkedIn', summary: 'A proper message: full sentences, first line earns the click.',
    rules: [
      'Write it properly as a message: full sentences, correct capitalisation and punctuation, 120 to 200 words.',
      'The first line is the hook; it is all anyone sees before "see more".',
      'Short paragraphs of one to two sentences. No bullet-list dumps.',
      'First person, one specific outcome or lesson, then what you built. No corporate filler.',
      'At most three hashtags, at the very end.',
    ] },
  { platform: 'reddit_post', name: 'Reddit', summary: 'Native to the subreddit, honest, builder-first.',
    rules: [
      'Title in the subreddit\'s own style, plain first person ("I built …"). No clickbait, no emoji, never another platform\'s convention.',
      'Body 150 to 300 words: what it is, why you built it, what was hard, and a real ask for feedback.',
      'Disclose that you are the builder. Mention {APP_URL} once, not more.',
      'Obey the subreddit\'s rules on self-promotion; if the post could read as marketing, say so in warnings.',
      'No hashtags. No marketing tone.',
    ] },
  { platform: 'show_hn', name: 'Hacker News', summary: 'Plain, technical, no hype. HN punishes superlatives.',
    rules: [
      'Title starts with "Show HN:" and is plain and specific. No superlatives.',
      'Body 100 to 200 words: what it does, how it works technically, what is novel, known limitations, a direct ask for feedback.',
      'No hype, no emoji, no hashtags, no exclamation marks.',
    ] },
  { platform: 'producthunt', name: 'Product Hunt', summary: 'Friendly and honest; tagline under 60 characters.',
    rules: [
      'Tagline under 60 characters. Description under 260 characters.',
      'Maker first comment 150 to 250 words: the story, how it works, honest limitations, what feedback you want.',
      'Three or four topics. Warm and friendly is right here; one emoji is fine.',
    ] },
  { platform: 'newsletter_pitch', name: 'Newsletter', summary: 'A short, specific note to one author about their readers.',
    rules: [
      'A specific subject line naming the newsletter or its audience.',
      'A 100 to 150 word pitch to the author: why their readers specifically care, the one-liner, one proof point, the link.',
      'No attachments, no press-release tone, no "I hope this email finds you well".',
    ] },
  { platform: 'video_script', name: 'Short video', summary: '30 to 60 seconds, spoken, real screens only.',
    rules: [
      '30 to 60 seconds. The hook is in the first three seconds.',
      'Spoken, conversational lines; scenes show real app screens only.',
      'End with one call to action and production notes listing exactly which screens to capture.',
    ] },
];
