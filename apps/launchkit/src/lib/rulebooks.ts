/**
 * Platform rulebooks: config-as-data. These defaults seed the `platform_rules`
 * table on first run; the owner edits them in Settings and every draft is
 * written against the stored version. The GLOBAL rules apply to every
 * platform and are also enforced in code (sanitizer + gate), because the two
 * things a model cannot be trusted with are punctuation and restraint.
 */
export type Rulebook = { platform: string; name: string; summary: string; rules: string[]; hooks?: string[] };

/**
 * Bumped whenever the default rules change. A stored rulebook that was seeded
 * from an older default (never edited by the owner) is replaced by the newer
 * default; an owner-edited rulebook is always kept.
 */
export const RULEBOOK_VERSION = 2;

export const GLOBAL_RULES: string[] = [
  'Never use an em dash (—) or an en dash (–) anywhere. Use a comma, a period, or the word "and". This is checked by code and fails the draft.',
  'No AI-sounding filler: never "In today\'s fast-paced world", "game-changer", "unlock", "seamless", "delve", "elevate", "revolutionize", "excited to announce", "thrilled to share", "leverage", "cutting-edge".',
  'No rhetorical-question openers ("Ever wondered…?"). Open with the concrete thing.',
  'Sentence case only. No Title Case Headlines, no ALL CAPS for emphasis.',
  'One concrete detail beats three adjectives. Never invent metrics, users, testimonials, or benchmarks.',
  'Write like the builder talking to a peer, in first person, in their own voice.',
  'Emoji: at most one, and only where the platform expects it.',
  'Never the verb spelled s-h-i-p in any form (s-h-i-p-s, s-h-i-p-p-e-d, s-h-i-p-p-i-n-g): write launch, release, deploy, deliver or roll out.',
];

/**
 * Distilled on 2026-09-11 from the reviewed open-source skill packs (see
 * apps/launchkit/rulebooks/<platform>.md for every rule's source and what was
 * changed). The hooks are patterns the model may adapt, never copy.
 */

/**
 * Distilled on 2026-09-11 from the reviewed open-source skill packs (see
 * apps/launchkit/rulebooks/<platform>.md for every rule's source and what was
 * changed). The hooks are patterns the model may adapt, never copy.
 */

/**
 * Distilled on 2026-09-11 from the reviewed open-source skill packs (see
 * apps/launchkit/rulebooks/<platform>.md for every rule's source and what was
 * changed). The hooks are patterns the model may adapt, never copy.
 */

/**
 * Distilled on 2026-09-11 from the reviewed open-source skill packs (see
 * apps/launchkit/rulebooks/<platform>.md for every rule's source and what was
 * changed). The hooks are patterns the model may adapt, never copy.
 */
export const DEFAULT_RULEBOOKS: Rulebook[] = [
  { platform: 'x_post', name: 'X', summary: 'One idea, the specific thing in the first eight words, the link last, no hashtags.',
    rules: [
      'The post is under 280 characters including {APP_URL}; aim for 200. It carries exactly one idea: what the app does, in specific nouns, or one thing that changed while building it.',
      'The first line is the hook and it states the specific thing inside the first 8 words: the input and the output, the error you hit, the decision you made, or a number from APP_PROFILE.proof_points. Never open with a question, "Introducing", "Excited to announce", "Big news", or a thread emoji.',
      'Use exactly one proof point from APP_PROFILE.proof_points in the post. If the profile has none, state what the app does in plain terms and put "no proof point in profile" in warnings. Never write a number, user count, quote or benchmark that is not in the profile.',
      '{APP_URL} appears exactly once, as the last line of the post. No other link anywhere in the post or the thread; if a tweet needs a second link, describe where to find it and add a warning.',
      'Show, do not tell: replace every evaluative adjective (fast, powerful, simple, seamless, robust) with what the app does, in what time, on what input. Never write s-h-i-p, s-h-i-p-p-e-d or s-h-i-p-p-i-n-g (write launch, release, deploy, roll out) and never game-changer, revolutionary, groundbreaking, viral, seamless, unleash, supercharge, 10x, or "N times faster".',
      'Never frame against another product: no "better than", "unlike X", "X is dead", "stop using X", "kills X". State a fact about this app only. If the campaign angle is a comparison, keep it to a plain fact about this app and add a warning that the comparison was dropped.',
      'thread_extension has 2 to 4 tweets, each under 250 characters, each a complete thought that reads on its own when quoted. No number prefixes, no "Thread", no thread emoji: X renders the thread.',
      'Pick one thread shape and follow it one step per tweet: build story (what you tried, what broke, what you changed, what it does now); list (2 to 4 concrete things, one per tweet, each with how it works); problem to solution (the pain in specifics, what the app does about it, one thing it does not do yet); take (a common practice, what it costs you, what you do instead, where the take does not hold).',
      'The last thread tweet ends on one specific question to developers who have the same problem, or one next step (try it on X, read the docs, open an issue). Never "follow for more", "repost if", "like if", "tag someone", "RT", "link in bio", countdowns, "limited spots", or "last chance".',
      'alt_variants holds 2 complete posts, each under 280 characters with {APP_URL}, each built on a different hook pattern from the X hook library than the main post. A reworded copy of the main post does not count.',
      'Sentence case: a capital at the start of every sentence, normal punctuation. No Title Case, no ALL CAPS words except acronyms (JSON, CLI, SDK), no exclamation marks, no ellipsis to trail off.',
      'None of these AI tells: "What I keep thinking about", "I keep coming back to", "The pattern I keep seeing", "Let that sink in", "Here is the thing", "Hot take:", the late-night-outage cliche, and three-fragment punchlines like "Smart team. Solid product. Worth watching."',
      'No hashtags. The single exception is a tag APP_PROFILE names as one its community already uses, placed at the end of the post. At most one emoji in the whole draft, never in the first line, never the rocket.',
      'First person in the builder\'s own voice: "I" for a solo builder, "we" for a team, whichever BRAND_DNA or APP_PROFILE.voice uses. Never third person about yourself, never "we are thrilled" or "proud to".',
      'Name RocketRide or any other platform, vendor or model provider only when APP_PROFILE or BRAND_DNA lists it and the sentence does not work without it; at most once across the post and thread, never as the subject of the post, never in a comparison.',
      'Claim only capabilities that APP_PROFILE states. If the campaign angle asks for one the profile does not confirm, leave it out and add a warning naming the missing claim. No pricing, revenue, funding or user numbers unless they are in proof_points.',
      'warnings lists every dropped claim, every proof point you could not source, and any TARGET rule you had to bend. An empty warnings array means every number and claim traces to the profile.',
    ],
    hooks: [
      'Plain function line. Pattern: [app] turns [input] into [output]. No [manual step you used to do by hand]. Example: Docsift turns a folder of PDFs into a searchable index. No chunking script to babysit. Use when the app has one clear input and one clear output.',
      'The failure that started it. Pattern: I built [app] because [the specific failure: the error text, the file it broke, the step that silently failed]. It now [one clause]. Example: I built Retryd because a cron job dropped a batch of webhooks and nothing logged it. It now replays every failed delivery from a log you can read. Use when the profile\'s "why built" holds a real incident.',
      'The stack, plainly. Pattern: [app]: [language], [runtime shape], [licence], [dependency count from the profile]. It does one thing: [thing]. Example: Pinmap: Go, one binary, MIT, no runtime dependencies. It does one thing: maps every open port to the process that owns it. Use when the reader cares how it is built. Counts come from the profile or the slot stays empty.',
      'The unpopular choice. Pattern: We picked [choice] over [the expected choice]. Not sure everyone will love that. Here is why: Example: We picked SQLite over a hosted queue for the job store. Not sure everyone will love that. Here is why: Use when a design decision is the story. State the decision; never say the other option is worse. Must be followed by a thread.',
      'The limit up front. Pattern: [app] does [one thing] and nothing else. No [adjacent thing], on purpose. What it does do: Example: Lintline does one thing: it fails the build when a migration has no down step. No schema diffing, on purpose. What it does do: Use when the app is narrow and that is the point. Must be followed by a thread.',
      'Before and after, with a number you own. Pattern: [task] took [N] with [old way]. With [app] it takes [M]. Both numbers from our own runs. Example: Rebuilding the search index took [N] minutes with the shell script. With Docsift it takes [M]. Both numbers from our own runs. Use only when both N and M are in proof_points. Never fill the slots from memory.',
      'The one command. Pattern: One command: [cmd]. Then [what appears], in [where]. Example: One command: pinmap scan. Then every listening port and its process, in one table, no root needed. Use when the first run is the demo.',
      'What I got wrong. Pattern: I assumed [assumption]. It was not true: [what was true]. So I built [app]. Example: I assumed our retries were idempotent. They were not: the same webhook hit the billing handler twice. So I built Retryd. Use when the lesson is the hook. Self-aware, no moral tacked on the end.',
    ] },
  { platform: 'linkedin_post', name: 'LinkedIn', summary: 'A proper message: line one stands alone, 120 to 200 words, link in the first comment.',
    rules: [
      'Line 1 is the hook and stands alone at 140 characters or fewer: one specific, true thing about this app (a number from proof_points, a named failure, a concrete before and after). No question mark in line 1 unless only this builder could ask the question. No emoji in line 1.',
      'Line 2 pays off line 1. It is never setup for line 3. If a reader stops after two lines they must still have the point.',
      'Length 120 to 200 words (about 900 to 1,300 characters). Under 120 reads as a passing thought; over 200 has to earn every line and the see-more tap has to be paid for by line 2.',
      'One idea per post, in this order: what happened while building (the bug, the constraint, the first user), the app in one plain sentence (its name once, what it does once), what the reader can do with it today. If the draft holds two ideas, keep the stronger one and list the other in warnings as a second post.',
      'Every number, name, customer and outcome comes from APP_PROFILE.proof_points or BRAND_DNA. If the post needs a number you do not have, write {{your number}} in its place and add a warning. Never invent users, metrics, testimonials, benchmarks or partnerships, and never write a revenue or funding figure.',
      'No URL and no {APP_URL} in the post body; LinkedIn suppresses posts with outbound links. End the body with the line "Link in the first comment." and add the warning "First comment: {APP_URL}" so the builder pastes it there.',
      'Close with exactly one of: a question only this post could ask, or one instruction. Never both. Never "Thoughts?", "Agree?", "Who else?", "Am I wrong?", "Comment YES", "Tag someone", "Repost if", "Follow me for more", "Save this", "Let that sink in", "Read that again".',
      'Paragraphs of one to three lines with a blank line between every one. No wall of text, no run of six or more one-sentence lines, at most three bullet lines, no line in ALL CAPS, no Title Case headline.',
      'Write in first person with contractions (it\'s, we\'ve, didn\'t): aim for three contractions and eight personal pronouns per 100 words. Vary sentence length: at least one sentence under six words and one over twenty, never four sentences in a row of the same length.',
      'Never these shapes: "It\'s not X, it\'s Y"; "not only X but also Y"; "This isn\'t about X. It\'s about Y"; a one-word question line such as "The result?"; "Here\'s what I learned"; a closing paragraph that opens "In summary" or "In conclusion"; a comma triad of three adjectives.',
      'For releasing software say launch, release, deploy, deliver or roll out; never the verb spelled s-h-i-p in any form. Never the deprecated one-key-for-every-model framing (section 1.2). Never the slop lexicon: delve, leverage, utilize, robust, crucial, vital, comprehensive, journey, landscape, realm, paradigm, synergy, testament to, cornerstone, empower, streamline, foster, facilitate, showcase, moreover, furthermore, additionally, ultimately, "in order to", "when it comes to", "in today\'s fast-paced world", "here\'s the thing", "let\'s face it", "excited to announce", "thrilled to share". No hype adjectives and no speed multipliers ("N times faster").',
      'Never name a competitor, never write "better than", "unlike other tools", "outperforms" or "alternative to". Show the thing working instead: one concrete detail of what it did, on what input. Name a partner only if it is in proof_points.',
      'Hashtags: at most three, all on the last line after the link line, only real categories people follow (for example #opensource #devtools #python). None inline in the body.',
      'Emoji: at most one in the whole post, never in line 1, and never rocket, fire, light bulb, sparkles or dart. Normal capitalisation and full punctuation throughout: this is a post, not a DM.',
      'alt_hook is a second line 1 for the same post from a different hook family than the one used (see the hook patterns): 140 characters or fewer, one line, standing alone, no URL, no question mark unless the question is specific to this builder.',
      'warnings must list: the first-comment link line, every {{your number}} placeholder, any second idea cut from the draft, and any claim you could not trace to proof_points.',
      'Launch week, for warnings not the post: after the launch post, at most four posts in the week and never two of the same kind back to back: proof (one number from the launch), opinion (a position about the problem the app solves), teach (one thing the reader can do with the app today), story (a scene from building it with what it cost). Post Tuesday to Thursday between 7:30 and 9:30 am in the audience\'s timezone; the first line matters far more than the hour.',
      'Launch day replies, for warnings not the post: in the first hour sort every comment into lead, substance, peer, support, noise and answer in that order. Answer the question fully in public, use the commenter\'s name once with no exclamation mark, match their length. To a critic concede the true part first in their words, then hold the line; never delete, never reply twice. Ignore pitches. Never ask for likes, reposts, tags or comments as a favour.',
    ],
    hooks: [
      'Time anchor: "{Task} used to take me {long time}. It now takes {short time}. One {file, component or decision} did it." Both times must come from proof_points; a ratio the reader cannot believe kills the post.',
      'Cost of a wrong assumption: "{N hours or days} is what {one wrong assumption} cost me before I built {app}." Name the assumption, make the cost real, and give the fix by line 4.',
      'The log line: "\\"{The exact line from the stack trace, the PR review or the first user\'s message.}\\" That line is why {app} exists." Use the real text, including the ugly part.',
      'The receipt: "{One hard number from proof_points}. {Where it ran, on what input, with what model.}" The number opens the door; the second sentence is the room.',
      'The practice I stopped: "Everyone building with {LLMs, agents, RAG} says {common practice}. After {specific experience with app}, I stopped." The practice has to be genuinely common, and you say what replaced it.',
      'The thing I deleted: "I deleted {thing developers usually keep: the vector DB, the retry wrapper, the second model} from {app}. Here is what broke and what got faster." Name the cost, not only the win.',
      'Two ways, one verdict: "A {heavy option: five-service pipeline, hosted platform} vs {the small thing I built in a weekend}. Here is where each one wins." Concede what the heavy option does better; never name a competitor.',
      'Copy this: "Here is the exact {config, prompt, .pipe file, script} I use to {specific outcome}. Copy it." Give the artifact in the post, not behind a comment-for-link.',
    ] },
  { platform: 'reddit_post', name: 'Reddit', summary: 'Native to the subreddit, the builder disclosed, the existing tool named, one real limitation.',
    rules: [
      'Obey the TARGET subreddit\'s rules over every rule below. When the TARGET only allows project posts in a thread or on a day (r/selfhosted: the current New Project Megathread for anything under 3 months old; r/devops: the Weekly Self Promotion Thread; r/MachineLearning: the [D] Self-Promotion Thread; r/webdev: Showoff Saturday; r/startups: the Share Your Startup thread; r/ExperiencedDevs: AI topics on Wednesdays and Saturdays only), write the draft for that venue, name the venue in the first warnings line, and never draft a main-feed product post for it.',
      'Set the product mention level from the TARGET before writing and never exceed it. Level 0 (no product name, no link, a technical write-up or discussion): r/programming, r/ExperiencedDevs. Level 1 (the problem and your approach, product unnamed, no link): r/startups main feed, r/artificial. Level 2 (named once, builder disclosed, {APP_URL} once): r/LocalLLaMA, r/opensource, r/selfhosted, r/devops, r/MachineLearning. Level 3 (named, link, plus the honest alternative named): r/webdev Showoff Saturday, r/SideProject. Level 4 (direct pitch with the thread\'s template) only inside a sub\'s own showcase thread. State the level used in warnings.',
      'Use only numbers that appear in APP_PROFILE.proof_points. Never write user counts, revenue, growth rates, benchmark comparisons or speedups that are not there. Numbers about the build itself (weeks spent, model size, hardware, lines of code) are allowed when they come from the profile. If proof_points is empty the post carries no traction numbers at all.',
      'Title: 6 to 16 words, 100 characters or fewer, sentence case, first person, one concrete detail (what it does, what it runs on, or a real constraint). No emoji, no exclamation mark, no question, no clickbait, no hashtags, never "Show HN:". r/MachineLearning: start with "[P] ". r/SideProject: "<Name> - <short description>". r/opensource: name the license in the title or the first sentence. r/devops link posts: the article title, unedited.',
      'Body: 150 to 300 words as flowing paragraphs of 2 to 4 sentences. No bullet points, no numbered lists, no bold text, no headings, no horizontal rules, no TL;DR. The only structured lines allowed are up to 4 "Key: Value" lines for real figures from proof_points.',
      'Paragraph order: (1) the problem as a scene you hit, 1 to 2 sentences; (2) what you built and how it works, in plain words, named at the allowed level; (3) the "this already exists" sentence; (4) one thing that was hard or still is not good; (5) one specific question; (6) the link line if the level allows it.',
      'Within the first 120 words, name the obvious existing alternative and give the one specific reason it did not cover your case ("I ran X for six months; it broke on Y"). State the difference as a fact. Never say you are better, faster or cheaper than it, and never disparage it.',
      'Disclose that you are the builder in the same sentence that first names or describes the product: "I built", "I maintain", "I work on". Never "I found this" or "came across this". Where the TARGET requires affiliation disclosure (r/LocalLLaMA rule 4) repeat it in plain words.',
      'Include one real limitation or unsolved problem, stated plainly, with either what you plan to do about it or "I do not know yet". A draft without one fails.',
      'End with exactly one specific question the community can answer from their own experience (their setup, their failure mode, the choice they made). Never "thoughts?", "what do you think?", "let me know", "would love to hear". No asks for upvotes, stars, follows, shares, signups or feedback-for-feedback; no discounts, promo codes or community-exclusive offers.',
      '{APP_URL} exactly once, in the final paragraph, as the bare placeholder, and only at Level 2 or above. If the TARGET restricts links in the body (r/startups rules 3 and 5, r/artificial rules 2 and 4), leave it out of the body and add the warning "post the link as your first comment, if the sub allows it". For r/opensource the link must be a repo with an OSI-listed LICENSE file; say which license in the body.',
      'Always add this warning line, in these words: "This draft was model-assisted. Rewrite it in your own words before posting; r/programming rule 1, r/LocalLLaMA rule 3 and r/opensource rule 3 remove LLM-written posts, and r/selfhosted and r/ExperiencedDevs require you to answer the AI-disclosure bot honestly."',
      'Beyond GLOBAL_RULES, never write: leverage, utilize, innovative, honest take, here\'s the thing, the irony is, it\'s funny how, nobody tells you, full transparency, excited to announce, thrilled to. Contractions are welcome. Vary sentence length. Past tense for what you did, present tense for what it does.',
      'No AI-pattern structure: no sentence that starts with "Not X, just Y", no rhythmic triplets of adjectives ("fast, simple, and free"), no closing summary or "In conclusion", no rhetorical questions, no DM solicitation ("DM me", "PM me"); write "I\'ll answer questions here" instead.',
      'suggested_flair: the TARGET\'s real flair for this kind of post (r/opensource: Promotional; r/MachineLearning: Project; r/LocalLLaMA: Resources or Discussion; r/webdev: Showoff Saturday; r/selfhosted: New Project Megathread; r/devops: the weekly thread has none). If you are not sure, write "none" and say so in warnings.',
      'warnings always has at least one line and lists, in order: the venue if the main feed is not allowed; the mention level used; any TARGET rule the draft bends or that needs the builder\'s action (account history under the 10% rule, user flair, karma in the sub, day-of-week limits, the 250-character minimum, a submission statement); the model-assisted line from rule 12.',
      'Write in the builder\'s voice from APP_PROFILE.voice or BRAND_DNA: the person who wrote the code explaining it to a peer, not a company announcing. If a sentence reads as marketing, cut it and say in warnings what you cut.',
      'When no TARGET subreddit is given, write for r/SideProject at mention level 2 (name the product once, {APP_URL} once in the last paragraph), say so in warnings, and keep every rule above.',
    ],
    hooks: [
      'I got tired of <manual step> in <context>, so I built <thing> that does it in <N> lines of <language>.',
      '<Existing tool> carried us until <specific limit>. This is what I wrote when it didn\'t.',
      'I run <thing> on a <hardware> in my <place>. The part that took <N> weeks was <problem>.',
      'I open sourced the <component> I kept rewriting on every project. <License>, <stack>.',
      'Post-mortem: <pipeline or agent> failed on <event>. What I changed and what I still don\'t trust.',
      'How do you handle <failure mode> in <context>? I built <thing> for it and I\'m not sure my tradeoff is right.',
      '<N> months in, <thing> does <one concrete job>. It still can\'t <limitation>.',
    ] },
  { platform: 'producthunt', name: 'Product Hunt', summary: 'Tagline under 60, description under 260, a maker comment that names a rough edge, never a vote ask.',
    rules: [
      'Never ask for a vote in any form, anywhere in the draft. Forbidden words and phrases: upvote, vote, voting, "help us reach #1", "every vote counts", "support our launch", "we\'d love your support", leaderboard. Ask for feedback and questions instead: "tell me what breaks", "what would you need before you tried this".',
      'Use only figures that appear verbatim in APP_PROFILE.proof_points. No user counts, star ratings, testimonials, "trusted by", "used by teams at", benchmarks, percentages or "Nx faster" anywhere in name, tagline, description or first comment. If there is no proof point, write the mechanism instead of a number.',
      'Tagline: 60 characters maximum, aim for 40 to 55, sentence case, no trailing period, no emoji, no exclamation mark, no URL. State what the product does and for whom in words a developer outside the category understands on one read.',
      'Tagline forbidden list: "AI-powered", "all-in-one", "world\'s first", "best", "next-gen", "revolutionary", "supercharged", "seamless", "[X], but better", "Nx faster", and any other product\'s name unless it is a platform the product runs in or on (VS Code, GitHub, Slack). Allowed shapes: "[verb] [object] [outcome]", "[what it does] for [who]", "[verb] [object] without [the painful step]", "[verb] [object] in [a timeframe taken from proof_points]".',
      'Description: 260 characters maximum, two or three sentences, plain text, no markdown, no bullets, no emoji, no exclamation mark, no call to action. Sentence 1: the concrete painful step or problem. Sentence 2: what the product does about it, the mechanism, not an adjective. Sentence 3, optional: one verifiable specific (license, where it runs, what it plugs into).',
      'Do not open the description with "We", "Our" or a question. Open with the concrete thing.',
      'Maker first comment: 150 to 250 words, in this order: (1) one line with first name and role, (2) why you built it, the specific moment or pain, two to three sentences, (3) what it does and how it works, three to four sentences with one concrete mechanism, (4) what is different, stated as a fact about your approach, (5) at least one limitation or rough edge, (6) one or two specific feedback questions, (7) one closing line saying you will be in the comments all day.',
      'In the first comment name at least one thing the product does not do yet, or a known rough edge, in plain words. Say it before anyone else does.',
      'The ask in the first comment is one or two questions the maker actually wants answered, tied to the product ("what would you need to see before you ran this on production traffic?"). Never "let me know what you think" on its own, never "check it out and support us".',
      'Offers: include one only if APP_PROFILE contains it, worded as available to everyone who visits from Product Hunt, never tied to voting, commenting or ranking. No countdowns, no "first 100", no "limited time", no invented codes or discounts.',
      'Other products: mention one only as a plain factual statement of what you do differently ("it runs on your own hardware; the hosted tools do not"). Never "better than", never "unlike [named product]", never a negative adjective attached to a competitor\'s name.',
      'Topics: three from Product Hunt\'s existing topic list, most specific first (for example "Developer Tools", "Open Source", "Artificial Intelligence", "GitHub"); a fourth only if the profile clearly spans a fourth category. No invented topics, no hashtags.',
      'Name: the product\'s real name from APP_PROFILE only, 40 characters maximum, no tagline appended, no version number, no emoji.',
      'Emoji: at most one in the whole draft, only in the first comment\'s greeting line, never a rocket. Exclamation marks: none in the tagline or description, at most two in the first comment.',
      'Write the first comment in first person singular for a solo maker, "we" only if APP_PROFILE lists a team. Warm is fine, hype is not: cut every sentence that says the product is great instead of showing what it does.',
      'Keep launch timing, reply cadence and supporter outreach out of every draft field. If something about the listing needs the builder\'s attention before launch (a missing offer, an unverified claim, an ambiguous topic), put it in warnings.',
    ],
    hooks: [
      'The {Nth} time I {re-did the same glue step}, I wrote {product} instead. Here is what it does.',
      '{Product} takes {a thing developers already have: a repo, a pipe file, a folder of PDFs} and gives back {a concrete output}. No {the step they dread}.',
      'Here is the whole setup: {one command or three lines}. That is the pitch.',
      'What it does not do yet: {limitation}. What it does: {the one thing it does well}.',
      'I built this for {specific role} who {specific pain}. If that is not you, it will look boring, and that is fine.',
      'Before: {the real sequence, step by step}. After: {one step}. Same result, and you can read the code that does it.',
      '{License}, runs {where the profile says}, plugs into {what the profile lists}. Pull it apart and tell me where it breaks.',
      '{Product} runs {on your own machine or in your own container}. {What stays on the user\'s side, from the profile}.',
    ] },
  { platform: 'show_hn', name: 'Hacker News', summary: 'Plain title, what it is and how it works, limitations, one question. HN punishes marketing.',
    rules: [
      'Title: start with exactly "Show HN: " then state what the thing is in plain words, 80 characters max including the prefix. Pattern: "Show HN: <Name>, <what it does for whom>" or "Show HN: <what it does>". No superlatives, no "AI-powered", no exclamation marks, no version numbers unless it is a major overhaul, no domain name (HN shows it next to the title), a comma between name and description, never a dash.',
      'Body, first sentence: say what the project is and what it does, naming the input and the output, so no reader has to ask "what is this". Shape: "<Name> is a <kind of tool> that takes <input> and produces <output>." You may put "Hi HN," in front of it, with a comma, nothing else.',
      'Body order, 100 to 200 words, 3 to 5 paragraphs separated by blank lines: (1) what it is and how to try it, (2) why you built it, (3) how it works technically, (4) what is different and what it cannot do yet, (5) the one question you want answered. Plain text only: no markdown headers, no bold, no bullet symbols, no numbered lists. HN renders none of them.',
      'How to try it: one sentence saying what {APP_URL} opens and whether it needs an account. {APP_URL} must be the running thing itself, never a landing page, waitlist, video-only page or Product Hunt page. If APP_PROFILE shows a signup or email gate, say so plainly in the body and add a warning. Write {APP_URL} once in the body, on its own line; HN does not turn URLs in a submission\'s text into links.',
      'How it works: 2 to 4 sentences naming the actual mechanism: language, runtime, the key library or model provider, where data goes and what runs where. Use specific nouns ("a Postgres table", "a single Go binary", "streams tokens over SSE"), never "AI-powered", "smart", "intelligent" or "powerful".',
      'warnings must always contain this exact line first: "HN guidelines ask that posted text be written by hand, not generated or edited by an LLM. Treat this draft as an outline: rewrite every sentence in your own words before submitting." Add further warnings if {APP_URL} needs a signup, if the profile has too little technical detail to fill the how-it-works paragraph, if the app cannot be tried today, or if any sentence reads as a sales pitch.',
      'Never ask for votes, comments, shares, stars, follows or "support". Never mention upvotes, the front page, ranking, launch day, or that you are "launching" anything. HN bans vote solicitation and readers report it.',
      'No marketing language anywhere: never "excited", "thrilled", "proud", "launching today", "join us", "sign up now", "limited", "the future of", "next generation", "game on". No exclamation marks, no emoji, no hashtags, no call to action other than the one question.',
      'What is different: one sentence stating the design decision that sets it apart, as a fact about the approach ("it runs entirely in the browser", "it stores the index as a flat file"). Never "better than", "unlike bloated X", "X killer" or any comparison that ranks another tool. Naming prior art neutrally is fine.',
      'Limitations: 2 or 3 concrete things it does not do yet or where it breaks ("no Windows build", "single user only", a size limit only if the number is in proof_points). State them flat; do not soften them with "but" or a roadmap promise.',
      'Close with exactly one specific question about a technical or design choice you actually want answered ("Would you keep the cache on disk or in the browser?"), plus one sentence saying you built it and will be in the thread. Never "let me know what you think" or "any feedback welcome".',
      'Numbers: only figures that appear in APP_PROFILE.proof_points, each with its unit and how it was measured. No user counts, star counts, speed multipliers ("ten times faster") or benchmark claims from anywhere else. If proof_points is empty, the body has no performance or adoption numbers at all.',
      'Vocabulary: never the verb spelled s-h-i-p in any form (s-h-i-p-s, s-h-i-p-p-e-d, s-h-i-p-p-i-n-g); write launched, released, deployed, delivered or built. Adjectives at most one per sentence and only ones that name a checkable property (local, offline, single-binary, open source); no intensity adjectives without a number behind them.',
      'Why you built it: 1 or 2 sentences in first person on the specific situation that made you write it (the job, the failure, the missing tool). A personal, concrete story; never "I noticed that many developers struggle with".',
      'Voice: first person ("I" for a solo builder, "we" for a team, per APP_PROFILE), short declarative sentences averaging under 20 words, one idea per sentence, no rhetorical questions, no jokes, no self-deprecation about the code, no thanks in advance.',
      'Mention the stack the app runs on (language, framework, platform, model provider) once, as a fact inside the how-it-works paragraph, never as a recommendation or a pitch for that platform.',
      'If APP_PROFILE lists an earlier HN thread or a previous Show HN, link it and say in one sentence what changed since. If this is a new version of something already shown on HN, add a warning that HN accepts a repeat Show HN only for a major overhaul, about once or twice a year.',
    ],
    hooks: [
      'Title: Show HN: <Name>, a <kind of tool> that <verb>s <input> into <output>',
      'Title: Show HN: <Name>, <what it does>, written in <language> and runs <where>',
      'Opener: <Name> is a <kind of tool> that takes <input> and gives you <output>. I built it because <the specific thing that kept going wrong at work>.',
      'Opener: I got tired of <the manual chore, named exactly>, so I wrote <Name>. It <one-sentence what>, and you can try it at {APP_URL} without an account.',
      'Opener: This is a <thing> for <who>. You point it at <input>, it <does the step>, and you get <output> as <format>. The interesting part is <the one technical decision>.',
      'Opener: <Name> does one thing: <the thing>. It runs <locally, in the browser, as a single binary> and stores <what> in <where>. Here is how it works and where it falls short.',
      'Opener: Last <month or project, from the profile> I needed <capability> that <constraint: worked offline, ran on a laptop, had no login>, could not find one, and built <Name>.',
      'Opener: I have been using <Name> on my own <workload, from the profile> since <date from the profile>. It <what>. Posting it because <specific reason: I want opinions on the storage format>.',
    ] },
  { platform: 'newsletter_pitch', name: 'Newsletter', summary: 'One builder emailing one editor: why their readers care, the one liner, one proof point, the link.',
    rules: [
      'Write the pitch as 100 to 150 words in four short paragraphs, in this order: why this newsletter\'s readers care, the one-liner, one proof point, the link and a one-sentence close. Count the words before you return.',
      'Subject line under 70 characters, sentence case: name the newsletter (TARGET.name) or its readers (APP_PROFILE.target_user) and the one thing the app does. Pattern: "For {newsletter} readers: {what it does}". No pipe separators, no "live on Product Hunt today", no exclamation marks, no emoji.',
      'Use exactly one proof point, copied from APP_PROFILE.proof_points or BRAND_DNA.messaging.proof_points_observed, with its number or named source when the profile has one. If neither list has an entry, state something verifiable instead (what it runs on, the public repo, how it works) and add the warning "no proof point in profile". Never invent numbers, users, quotes or benchmarks.',
      'First paragraph, one or two sentences: why these readers specifically care. Tie it to APP_PROFILE.icp.who and icp.pain and to whatever TARGET says the newsletter covers. Do not open with the app name, the launch, or yourself.',
      'Address the author by name or the newsletter by name (from TARGET). If neither is known, address the readers ("For your readers who {icp.who}") and add a warning that the recipient name is missing. Never "Hi there", "Dear editor", "To whom it may concern".',
      'Second paragraph: the one-liner, one sentence, taken from APP_PROFILE.one_liner. Trim it, do not embellish it. Name the app once here.',
      'Put {APP_URL} exactly once, as a bare link on its own line in the last paragraph. No attachments, no "see the deck", no gallery bullets. Offer instead, in one sentence, to send screenshots or answer questions.',
      'The only ask is that they take a look. No vote asks, no "feature us", no "share with your list", no "it would mean the world", no discount for coverage, no deadline or "only this week". Nothing that reads as pressure or a favour owed.',
      'Write it as one builder emailing one person: first person singular, plain words. Never press-release phrasing: "proud to announce", "thrilled", "today announced", "the leading", "industry-leading", "world-class".',
      'Do not name a competitor and do not compare: no "better than", "unlike X", "X alternative", "X killer". Describe what the app does on its own terms; if a differentiator in the profile is phrased against a rival, restate it as what the app does.',
      'Plain prose only: no headers, no ALL CAPS labels like "WHAT IT IS:", no bullet lists, no bold, no PS. Each paragraph is one to three sentences.',
      'Close in one sentence with a concrete offer ("Happy to send screenshots or answer anything your readers ask"), then sign off with the builder\'s first name only. Never "I hope this finds you well", "thanks for your time", "I\'m reaching out", "Happy to provide any additional info".',
      'Zero emoji, zero exclamation marks, zero hashtags in both subject and pitch. Sentence case throughout, no Title Case.',
      'Name a specific edition or section (for example a developer tools edition) only when TARGET names it. Never invent an edition, a deadline, a reader count or a past issue. If APP_PROFILE.icp.buying_trigger is real, use it in the first paragraph; do not add a separate "why now" section.',
      'Fill warnings with anything the builder must check before sending: recipient name unknown, no proof point in the profile, TARGET.rules_summary says the newsletter takes paid placements or uses a submission form (say so, and keep the pitch usable as form text), or TARGET rules not verified.',
    ],
    hooks: [
      'Your readers who still {icp.pain} by hand: {App} {one thing it does}. {One verifiable fact from the profile.}',
      '{App} does one job for {icp.who}: {one_liner}. {How to try it, in one sentence from the profile.}',
      'I built {App} because {icp.pain} kept breaking my own workflow. It {one thing it does}; on a real project that means {proof_point}.',
      'If your readers run {tech_stack item}, {App} is a {category} built for that setup: {one_liner}.',
      'Small tool, one purpose: {one_liner}. Built for {icp.who}. {proof_point}.',
      'The part of a {icp.who}\'s day that is still manual is {icp.pain}. {App} takes that piece: {differentiator}.',
      '{App} is {license or maturity fact from the profile} and {one_liner}. I am the builder and will answer anything your readers send back.',
      'Three sentences on {App}: it {does X}. It is for {icp.who}. {proof_point}.',
    ] },
];
