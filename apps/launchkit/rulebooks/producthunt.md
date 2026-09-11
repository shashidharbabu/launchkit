# Product Hunt rulebook

Channel: Product Hunt. Platform id in `lib/rulebooks.ts`: `producthunt`.
Written 2026-09-11 from the skill-pack triage in `docs/social-launch-skills-review.md`.
Governing rules: `.claude/rules/skills/brand-check/references/rulebook.md`, sections 1 to 3.

This document does not post anything. The approval chain is unchanged: Steve drafts, Dana reviews adversarially, Joe approves, Joe posts.

A note on this file's own text: it has to pass the same mechanical sweep as the drafts. Where a regex pattern needs a banned literal, the pattern is written with a character class (for example `s[h]ip`, `universal api ke[y]`) so it still matches the word in a draft and this file does not contain it. Dashes and the rocket emoji appear only as `\u` escapes.

## 1. What the drafting model produces

The output shape is fixed by `pipelines/lk_assets.pipe` line 35 (`ASSET_TYPE=producthunt`):

| Field | Limit | What it is |
| --- | --- | --- |
| `name` | 40 characters (our limit, see section 7) | The product's real name, nothing appended |
| `tagline` | 60 characters | The one line under the name on the homepage |
| `description` | 260 characters | The short description on the listing |
| `first_comment` | 150 to 250 words | The maker's first comment, posted within ten minutes of going live |
| `topics` | 3, at most 4 | Product Hunt topics from the existing list |
| `warnings` | free text | Anything the builder must resolve before launch |

Two kinds of guidance come out of the sources and they are kept apart on purpose:

- **Draft rules** (section 3): what the drafting model obeys, line by line. These are merged into `DEFAULT_RULEBOOKS` for `producthunt`.
- **Launch day operations** (section 4): timing, replying to comments, what Product Hunt penalises. These never enter a draft field. They are surfaced to the builder as notes.

## 2. Sources

Repository: https://github.com/yoanbernabeu/producthunt-skills
Commit: `5acfd604b66c9491365e24ccbf31f24e3b2ddfa3` (2026-01-30)
License: MIT, copyright 2025 Yoan Bernabeu (`LICENSE` at the repo root)
Local clone at review time: `<scratchpad>/social-skills/producthunt-skills/skills/`

All ten files below are pure markdown with no scripts, API calls or environment variables. The right-hand columns are the hits from the review's mechanical sweep, re-run on 2026-09-11 (banned verb, U+2014 dash, U+2013 dash, hype terms, rocket emoji).

| File (under `skills/`) | Review verdict | What was taken | Sweep hits |
| --- | --- | --- | --- |
| `compliance/ph-safe-messaging/SKILL.md` | USE | Core principle, red-flag phrase list, incentive-language conversion, in-comment allowed/not-allowed lists | dash 5, rocket 1 |
| `compliance/ph-ban-prevention/SKILL.md` | USE | Six prohibited-behaviour categories, detection signals, what to do if flagged | dash 2 |
| `content/ph-maker-comment/SKILL.md` | USE | Eight-part comment structure, the do/don't list (no unverifiable claims, no vote asks, respond to every comment) | dash 7 |
| `content/ph-tagline-writer/SKILL.md` | PARTIAL, formulas only | 60-char limit with the 40 to 55 target, clarity and specificity tests, red-flag word list, formulas 2 to 5 | verb 1, hype 4 |
| `content/ph-description-writer/SKILL.md` | PARTIAL, structure only | 260-char limit, PAS and BAB ordering (problem, then mechanism), "do not start with We", "no multiple CTAs" | verb 2, dash 3, hype 1 |
| `content/ph-gallery-assets/SKILL.md` | USE | Developer Tool image sequence, "real product not mockups", design do/don't | dash 1 |
| `launch-day/ph-launch-day-checklist/SKILL.md` | USE | Night-before checks, first ten minutes, emergency protocols | dash 3, rocket 1 |
| `launch-day/ph-comment-responder/SKILL.md` | USE | Ten comment types and response strategies, the reply-fast rule, response quality checklist | verb 1, dash 7 |
| `strategy/ph-timing-optimizer/SKILL.md` | USE | 12:01 AM Pacific rule, weekday vs weekend trade-off, why the first four hours matter, timezone table | hype 1 |
| `marketing/ph-community-outreach/SKILL.md` | USE, Show HN section excluded here | Be-a-member-first rules, one post per community, space posts out | U+2013 dash 1 |

Hype hits in the tagline and description files are the "But Better", "Nx faster" and "10x" formulas, all dropped (section 8).

## 3. Draft rules

Ordered by importance. Each rule is followed by where it came from and what changed. The rule text is what the model receives.

**R1.** Never ask for a vote in any form, anywhere in the draft. Forbidden words and phrases: upvote, vote, voting, "help us reach #1", "every vote counts", "support our launch", "we'd love your support", leaderboard. Ask for feedback and questions instead: "tell me what breaks", "what would you need before you tried this".
From: ph-safe-messaging (core principle and red-flag list), ph-ban-prevention category 3. Changed: the source's "these are fine" list allows "Support our launch" and "We'd love your support"; on a Product Hunt page those read as a vote ask with the word removed, so they are forbidden here. The replacement asks are ours.

**R2.** Use only figures that appear verbatim in APP_PROFILE.proof_points. No user counts, star ratings, testimonials, "trusted by", "used by teams at", benchmarks, percentages or "Nx faster" anywhere in name, tagline, description or first comment. If there is no proof point, write the mechanism instead of a number.
From: ph-maker-comment don't list ("make unverifiable claims"), brand rulebook 2.7 and 5.3. Changed: the source also says "quantify if possible" and "include specifics (numbers, timeframes)"; that is inverted into "only from proof_points" because the drafting model cannot verify anything.

**R3.** Tagline: 60 characters maximum, aim for 40 to 55, sentence case, no trailing period, no emoji, no exclamation mark, no URL. State what the product does and for whom in words a developer outside the category understands on one read.
From: ph-tagline-writer golden rules 1 and 2 and the clarity test. Changed: "explain to mom" and "would a 10-year-old get it" became "a developer outside the category"; our reader is a developer, not a consumer. Sentence case and no trailing period are house style (GLOBAL_RULES).

**R4.** Tagline forbidden list: "AI-powered", "all-in-one", "world's first", "best", "next-gen", "revolutionary", "supercharged", "seamless", "[X], but better", "Nx faster", and any other product's name unless it is a platform the product runs in or on (VS Code, GitHub, Slack). Allowed shapes: "[verb] [object] [outcome]", "[what it does] for [who]", "[verb] [object] without [the painful step]", "[verb] [object] in [a timeframe taken from proof_points]".
From: ph-tagline-writer red flags and formulas 2, 3, 4, 5. Changed: formula 1 ("Notion for X") is limited to platforms, formula 6 ("But Better") and formula 7 ("Nx faster") are dropped, "supercharged" and "seamless" added from the brand list. Formula 3 "Problem Killer" ("End meeting chaos forever") became "without [the painful step]" to remove the hype register.

**R5.** Description: 260 characters maximum, two or three sentences, plain text, no markdown, no bullets, no emoji, no exclamation mark, no call to action. Sentence 1: the concrete painful step or problem. Sentence 2: what the product does about it, the mechanism, not an adjective. Sentence 3, optional: one verifiable specific (license, where it runs, what it plugs into).
From: ph-description-writer technical limits, PAS and BAB ordering. Changed: AIDA's attention hook and the 4 Ps "push" are dropped, the "end with a clear CTA" best practice is dropped (the listing has its own button and 260 characters are too few), social proof slots are dropped, every worked example is discarded.

**R6.** Do not open the description with "We", "Our" or a question. Open with the concrete thing.
From: ph-description-writer "What to avoid: starting with We". Changed: the question ban is from GLOBAL_RULES (no rhetorical-question openers) and overrides the AIDA example that opens with "Tired of...?".

**R7.** Maker first comment: 150 to 250 words, in this order: (1) one line with first name and role, (2) why you built it, the specific moment or pain, two to three sentences, (3) what it does and how it works, three to four sentences with one concrete mechanism, (4) what is different, stated as a fact about your approach, (5) at least one limitation or rough edge, (6) one or two specific feedback questions, (7) one closing line saying you will be in the comments all day.
From: ph-maker-comment eight-part structure. Changed: the source's part 6 (offer/incentive) is removed from the structure and handled by R10; a "limitations" part is added in its place; the source's 200 to 350 word target is replaced by the pipe's 150 to 250; part 3 "the problem" is folded into part 2 because at this length they are one thought.

**R8.** In the first comment name at least one thing the product does not do yet, or a known rough edge, in plain words. Say it before anyone else does.
From: ours, seeded by ph-comment-responder type 6 ("nothing new here") and the brand rule "show, don't tell". A stated limitation is the cheapest credibility a maker can buy on Product Hunt, and it pre-empts the harshest comment type.

**R9.** The ask in the first comment is one or two questions the maker actually wants answered, tied to the product ("what would you need to see before you ran this on production traffic?"). Never "let me know what you think" on its own, never "check it out and support us".
From: ph-maker-comment part 7 ("Curious to hear how you currently solve this problem" is the good example). Changed: the generic "Try it out and let me know what you think!" moved from the good column to the bad column; it is filler that invites "Great product!" replies.

**R10.** Offers: include one only if APP_PROFILE contains it, worded as available to everyone who visits from Product Hunt, never tied to voting, commenting or ranking. No countdowns, no "first 100", no "limited time", no invented codes or discounts.
From: ph-ban-prevention category 2 (incentivised voting) and ph-safe-messaging incentive-language table. Changed: the source's examples ("first 100 users from PH get lifetime access", "3 months free on Pro") are dropped; RocketRide pricing is published (rulebook 5.1) and the model may not invent a deal.

**R11.** Other products: mention one only as a plain factual statement of what you do differently ("it runs on your own hardware; the hosted tools do not"). Never "better than", never "unlike [named product]", never a negative adjective attached to a competitor's name.
From: ph-maker-comment part 5 tips ("don't bash competitors by name, be factual"), ph-comment-responder type 8, brand rulebook 4.1. Changed: the source's template "Unlike [category of competitors], [Product]..." is dropped; the brand rule is stricter than the source.

**R12.** Topics: three from Product Hunt's existing topic list, most specific first (for example "Developer Tools", "Open Source", "Artificial Intelligence", "GitHub"); a fourth only if the profile clearly spans a fourth category. No invented topics, no hashtags.
From: ours; no source skill covers topics. The pipe allows 3 to 4. See section 7 on the Product Hunt form limit.

**R13.** Name: the product's real name from APP_PROFILE only, 40 characters maximum, no tagline appended, no version number, no emoji.
From: ours. The listing form has a separate tagline field; makers who append a slogan to the name get truncated on the homepage card.

**R14.** Emoji: at most one in the whole draft, only in the first comment's greeting line, never a rocket. Exclamation marks: none in the tagline or description, at most two in the first comment.
From: ph-maker-comment greeting examples (the wave emoji is the platform convention) and ph-comment-responder red flag "excessive emojis". Changed: the source uses the rocket freely; it is banned here. The exclamation cap is ours.

**R15.** Write the first comment in first person singular for a solo maker, "we" only if APP_PROFILE lists a team. Warm is fine, hype is not: cut every sentence that says the product is great instead of showing what it does.
From: ph-maker-comment "the trust factor" (corporate-speak vs genuine voice) and brand rulebook 3.1. Changed: made mechanical ("cut every sentence that...") so the model can apply it.

**R16.** Keep launch timing, reply cadence and supporter outreach out of every draft field. If something about the listing needs the builder's attention before launch (a missing offer, an unverified claim, an ambiguous topic), put it in warnings.
From: ours. It separates section 3 from section 4 at draft time so the operational advice never leaks into the listing text.

## 4. Launch day operations

For the builder. None of this goes into a draft field.

### 4.1 Timing

- Product Hunt's day resets at midnight Pacific. Go live at 12:01 AM Pacific to get the full 24 hours. Check whether PST or PDT applies on the date; the conversions below are for PST and shift one hour earlier in local time during PDT.

| Location | 12:01 AM PST is |
| --- | --- |
| New York | 3:01 AM |
| London | 8:01 AM |
| Paris, Berlin | 9:01 AM |
| Mumbai | 1:31 PM |
| Beijing | 4:01 PM |
| Tokyo | 5:01 PM |
| Sydney | 7:01 PM |

- Tuesday to Thursday: most traffic, most competition, best for reach. Saturday and Sunday: less of both, easier to place well, weaker business audience. Friday sits between and its launches are grouped into the Monday newsletter. Pick by goal: reach or a badge. The per-day vote counts in the source are unsourced and are not reproduced here.
- The first four hours matter because the homepage order is partly randomised early and the algorithm reads early engagement. Have the maker online for those four hours. Nothing else about "momentum" from the source survives the brand rules.

### 4.2 The night before and the first ten minutes

Night before: listing complete and scheduled, gallery uploaded and ordered, video public and tested, maker comment written and saved, every link tested, site ready for a traffic spike, analytics verified, the people you told about the launch told once and not again.

First ten minutes after 12:01 AM Pacific: confirm the listing is live and renders correctly, post the maker comment, share the link with the team, take a screenshot for the record, send the first social post (drafted under that channel's rulebook).

### 4.3 Replying to comments

- Reply to every comment. Within ten minutes during the first four hours, the same day for the rest.
- Address the person by name, answer the actual point, add one piece of information, end with a question or an invitation. No copy-paste replies; if two people ask the same thing, answer the second by pointing to the first and adding what is specific to them.
- Never defensive, never an argument, no promises you cannot keep, no emoji tails, no vote language of any kind.

Reply patterns, rewritten in our voice. Placeholders in braces.

| Comment type | Reply pattern |
| --- | --- |
| Simple praise ("Love it!") | "Thanks, {name}. What were you doing when you found it? I want to know which problem brought you here." |
| Detailed praise naming a feature | "{Name}, that {specific issue} is exactly why {feature} exists; we hit it ourselves. If you have an idea for making it better, I want it." |
| "Does it work with {tool}?" and it does | "Yes. {Tool} connects under {where in the product}. Doc here: {link}. Tell me if it snags." |
| "Does it work with {tool}?", planned | "Not yet. {Tool} is on the list, and your use case would help us order it. What would you do with it?" |
| "Does it work with {tool}?", not planned | "Not right now; we are focused on {priority}. There is an API and some people have wired {tool} through it. Happy to share how." |
| Technical question | "Stack: {languages, frameworks}. {Feature} works by {two sentences}. We chose {approach} because {reason}. Ask me anything about it." |
| Constructive criticism | "Appreciated, {name}. You are right that {aspect} is thin. We have been going back and forth on {decision}. How would you want {aspect} to work? Any example that does it well?" |
| "Nothing new here" | "Fair on first look; there are plenty of {category} tools. Where this one differs: {factual difference}. For example, {specific}. It might not be for everyone." |
| Bug report | "Sorry, {name}, that is not the experience I want. Which browser and device, and what did the error say? DM me at {contact} if easier. Looking at it now." |
| "How is this different from {competitor}?" | "{Competitor} is solid. Differences, stated plainly: we {our approach}; they {their approach}. {One more factual difference}. Try both against your own workload; happy to help you evaluate." |
| Pricing | "Free tier: {what is included}. Paid: {the published tiers, by name}. Anything specific you are sizing for?" Quote only what is on the pricing page. |
| Off-topic or spam | "Thanks for stopping by. DM me if you have a question about {product}." Do not engage further. |

### 4.4 What Product Hunt penalises

Penalties run from silent vote removal, to the product being unfeatured mid-launch, to a shadow ban, to account suspension. The six behaviours that trigger them:

1. Vote manipulation: bought votes, vote services, fake accounts, vote exchanges, paying for votes in any indirect form.
2. Incentivised voting: any reward tied to a vote. A launch offer is fine only when everyone who visits gets it regardless of what they do.
3. Explicit vote requests, in any channel: "please upvote", "every vote counts", "help us reach #1", "vote for us".
4. Coordinated activity: votes from one location or one ten-minute window, brand-new accounts, identical comment text, voting rings. Our line is stricter than the source's "stagger the waves": tell people once, do not schedule them, let them do what they want.
5. Self-promotion abuse: dropping your product into other launches' comments, spamming discussions.
6. Spam: mass DMs, automated outreach, repeated submissions, misleading product information.

Detection combines account age and history, vote timing and geography, comment depth, and human moderator review of reports.

### 4.5 If something goes wrong

- Votes disappear: do nothing dramatic. Review what was sent, keep answering comments, accept the result.
- Product unfeatured: stop all outreach, review for a violation, contact Product Hunt support calmly and factually, keep the explanation ready.
- Account flagged: do not create a new account, write to support and be honest about what was done, accept the decision.
- Site goes down: post a short factual note in the comments, keep replying while it is fixed.
- Comments turn negative: answer each one, acknowledge the point, give the fact or the fix, never argue.

### 4.6 Gallery and video brief (developer tool)

Four to six images, the product itself in every one, no stock photos, no mockups, readable on a phone, dark-mode screenshots if the product has dark mode, one visual style throughout.

1. The product doing the thing: a real terminal or a real screen, with the name and tagline as an overlay.
2. Before and after, in real code or real config, not slogans.
3. How it plugs in: the one command or the one file.
4. The docs or README as they actually look.
5. Optional: a real run, stage by stage, if the product exposes one.
6. Not a testimonial or a metrics slide unless the quote is real and permitted, or the number is in proof_points. Otherwise end on image 4 or 5.

Video: 30 to 60 seconds, YouTube, set to public, tested in the gallery before launch day. The "algorithm favours video" claim in the source is unsourced and is not repeated.

### 4.7 Telling other communities

The Reddit, Indie Hackers and Show HN post templates in ph-community-outreach belong to those channels' rulebooks and are not reproduced here. What carries over to Product Hunt:

- Be a member before you post: weeks of ordinary participation, not a cold link.
- One different post per community, spaced out through the day, never the same text twice, never ten places at once.
- Every cross-post that carries the Product Hunt link obeys R1: it asks for feedback, never a vote.

## 5. Mechanical checks

These are the checks a program can enforce on the draft before the gate. `field` values are the output JSON keys; `all` means `name`, `tagline`, `description`, `first_comment` and each entry of `topics` (never `warnings`). Regex patterns are JavaScript syntax; flags are named per row. Where a pattern needs a banned literal it uses a character class or a `\u` escape, as explained at the top of this file.

| id | kind | value | field | description |
| --- | --- | --- | --- | --- |
| `ph_tagline_max_chars` | max_chars | 60 | tagline | Product Hunt truncates beyond 60; count spaces and punctuation |
| `ph_description_max_chars` | max_chars | 260 | description | Short description limit on the listing |
| `ph_first_comment_min_words` | min_words | 150 | first_comment | Below this the comment has no story or limitation |
| `ph_first_comment_max_words` | max_words | 250 | first_comment | Above this nobody reads to the ask |
| `ph_topics_max_count` | max_count | 4 | topics | Three expected, four allowed by the pipe (see section 7) |
| `ph_name_max_chars` | max_chars | 40 | name | Homepage card truncation; also catches a tagline appended to the name |
| `ph_no_vote_ask` | forbidden_regex | `\b(up-?vot(e\|es\|ed\|ing)\|vot(e\|es\|ed\|ing)\|leaderboard\|help us (win\|reach)\|reach (#\|number )?1\b\|every vote\|support (our\|the) launch\|love your support\|your support (means\|would))` | all | flags: i. Any vote ask, including the softened forms |
| `ph_no_scarcity_or_reciprocity` | forbidden_regex | `\b(first \d+ (users\|people\|makers\|signups\|hunters\|customers)\|limited (time\|spots\|offer)\|only \d+ (left\|spots\|seats)\|ends (tonight\|today\|at midnight)\|hurry\|last chance\|don'?t miss\|in return\|return the favou?r\|i'?ll (upvote\|support) yours)` | all | flags: i. Fake scarcity, countdowns, vote swaps |
| `ph_no_hype` | forbidden_regex | `\b(game.?chan[g]\w*\|revolutiona[r]\w*\|groundbreakin[g]\|vira[l]\|seamless\w*\|unleash\w*\|supercharg\w*\|world'?s first\|next-?gen\w*\|all-in-one\|ai-powered\|cutting-edge\|best-in-class\|the best\|10x)\b` | all | flags: i. Brand hype list plus the tagline red flags |
| `ph_no_nx_multiplier` | forbidden_regex | `\b\d+(\.\d+)?x\b` | all | "3x", "10x", "2.5x": a multiplier the model cannot source |
| `ph_no_banned_verb_or_key_framing` | forbidden_regex | `\b(s[h]ip(s\|ped\|ping\|pable)?\|universal api ke[y])\b` | all | flags: i. Brand rulebook 1.1 rows 1 and 2; duplicates the global sanitizer on purpose |
| `ph_no_dashes` | forbidden_regex | `[\u2014\u2013]` | all | Em dash and en dash; duplicates the global sanitizer on purpose |
| `ph_no_rocket` | forbidden_regex | `\u{1F680}` | all | flags: u. The rocket emoji |
| `ph_tagline_clean` | forbidden_regex | `!\|\.$\|\p{Extended_Pictographic}\|https?://\|\{APP_URL\}` | tagline | flags: u. No exclamation, no trailing period, no emoji, no link |
| `ph_description_clean` | forbidden_regex | `\p{Extended_Pictographic}\|!\|https?://\|\{APP_URL\}\|^\s*[-*•]\|\*\*\|^\s*#` | description | flags: u, m. No emoji, exclamation, link, bullets or markdown |
| `ph_description_opener` | forbidden_regex | `^\s*(We\|We're\|We've\|Our)\b\|^[^.!?\n]{0,120}\?` | description | Must not open with "We" or with a question |
| `ph_first_comment_exclamations` | forbidden_regex | `![^!]*![^!]*!` | first_comment | Three or more exclamation marks |
| `ph_no_social_proof_phrases` | forbidden_regex | `\b(trusted by\|loved by\|used by (teams\|companies\|developers) at\|join \d[\d,]*\+? (users\|developers\|makers\|teams)\|\d(\.\d)?/5\|testimonials?)\b\|[★⭐]` | all | flags: i. Social-proof phrasing and star glyphs the model cannot source |
| `ph_no_hashtags` | forbidden_regex | `(^\|\s)#[A-Za-z]` | all | Hashtags are not a Product Hunt convention; also catches "#ProductHunt" |

The pipe symbol inside patterns is escaped in this table only so the markdown renders; the structured return carries the raw patterns.

Not machine-checkable and therefore left as rules only: the presence of a limitation (R8), the specificity of the ask (R9), whether a figure is in proof_points (R2), whether a topic exists on Product Hunt (R12).

## 6. Hook patterns

Openers for the first comment, or the shape of a tagline. Written fresh in the developer-first voice; none are taken from the source packs. Placeholders in braces come from APP_PROFILE.

1. "The {Nth} time I {re-did the same glue step}, I wrote {product} instead. Here is what it does."
2. "{Product} takes {a thing developers already have: a repo, a pipe file, a folder of PDFs} and gives back {a concrete output}. No {the step they dread}."
3. "Here is the whole setup: {one command or three lines}. That is the pitch."
4. "What it does not do yet: {limitation}. What it does: {the one thing it does well}."
5. "I built this for {specific role} who {specific pain}. If that is not you, it will look boring, and that is fine."
6. "Before: {the real sequence, step by step}. After: {one step}. Same result, and you can read the code that does it."
7. "{License}, runs {where the profile says}, plugs into {what the profile lists}. Pull it apart and tell me where it breaks."
8. "{Product} runs {on your own machine or in your own container}. {What stays on the user's side, from the profile}."

## 7. Open questions for the owner

- **Topic count.** The pipe and the current rulebook say 3 to 4. My recollection is that the Product Hunt launch form accepts at most three topics. Verify on the form before the next launch; if it is three, tighten `ph_topics_max_count` to 3 and R12 to "exactly three".
- **Name length.** 40 characters is our limit, chosen to keep the homepage card intact. It is not asserted here as a Product Hunt rule.
- **Daylight saving.** The timezone table is for PST. During PDT every local time is one hour earlier.
- **Thumbnail and video skills.** `ph-thumbnail-creator` and `ph-video-demo` were USE in the review but were not in this channel's brief; they belong with the Assets stage, not with the listing draft.

## 8. Deliberately left out, and why

1. **Tagline formula 1 with a named product ("Notion for X")**, formula 6 ("X, but better"), formula 7 ("Nx faster"), and the examples table (Raycast "Supercharged productivity"). Naming another product as the reference point is comparison framing the brand rulebook (4.1) forbids, "but better" is literally "better than X", and the multiplier formulas require a benchmark the model cannot source.
2. **ph-description-writer's power-words list** (Transform, Unlock, Boost, Instant, Exclusive, Limited, Proven), every worked example ("competitors release faster", "10x", "sleep better at night"), the social-proof and testimonial slots in templates A to C, and the 4 Ps "push with urgency". All of it is the hype register or invented proof.
3. **ph-maker-comment's offer section** ("first 100 users", "lifetime access", "PH exclusive code") and the "we're the first to" and "the secret sauce" differentiator lines. Unverifiable claims and offers the model would have to invent. The "AMA!" closer is dropped as a borrowed convention.
4. **ph-safe-messaging's email, X and LinkedIn templates.** They are other channels' drafts, and they open with "Excited to share" (banned filler), carry the rocket, and lean on "Would love your support". The supporter briefing is dropped as well: our line is that nobody is briefed, people are told once.
5. **ph-ban-prevention's "safe supporter activation"** (activate in waves, use different time zones). Staggering coordination is still coordination. Kept: the six categories, the detection signals, the recovery steps.
6. **ph-launch-day-checklist's six supporter waves, hourly vote targets, "competitor activity" check, team roles, and the social progress-update template.** The targets are unsourced, the waves are coordination, the progress template invents numbers and carries the rocket. Kept: night-before checks, first ten minutes, emergency protocols.
7. **ph-comment-responder's "Great question!" openers, "Fun fact:", "Mind if I add you to our notify list for when it..." (banned verb), emoji tails, and "Impresses observers" as a reason to reply fast.** Replies are rewritten in section 4.3. The nine-minute rule became ten.
8. **ph-timing-optimizer's per-day vote counts, the line steering fast-spreading products to Wednesday, and the four-hour vote ladder.** Unsourced numbers. Kept: the reset time, the day trade-off, why the first four hours matter, the timezone table.
9. **ph-community-outreach's Reddit, Indie Hackers and Show HN templates, "Current MRR" line, karma-building plan, and "often reciprocal support".** Show HN goes to the Hacker News rulebook, Reddit to the Reddit rulebook. The MRR line invites confidential figures (rulebook 2.7). Reciprocity is a manipulation signal on Product Hunt and off-brand everywhere.
10. **ph-gallery-assets' image 2 "shocking stat", image 6 testimonials and metrics, the "PH algorithm favors video" claim, and the interactive-demo tool list.** Invented proof, an unsourced claim, and tooling choices that belong to the Assets stage.
11. **"Support our launch" and "We'd love your support" from the source's allowed list.** See R1.
12. **Any dollar figure, plan price or revenue number** from the source examples. Pricing is quoted only from the published page (rulebook 5.1); projections are confidential (2.7).
