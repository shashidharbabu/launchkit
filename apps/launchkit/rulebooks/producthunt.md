# Product Hunt rulebook

Channel: Product Hunt. Platform id in `lib/rulebooks.ts`: `producthunt`.
Written 2026-09-11 from the skill-pack triage in `docs/social-launch-skills-review.md`, and reconciled against the sources, Product Hunt's own launch pages and the ten-app evaluation in `docs/EVAL-10-APPS.md` for rulebook version 4 on 2026-09-12.
This document matches `RULEBOOK_VERSION = 4` in `apps/launchkit/src/lib/rulebooks.ts`: 20 rules, 12 hooks, 37 machine checks. Section 9 says how a stored rulebook goes stale, what every draft records about the rulebook it saw, and which sanitiser passes run before the gate.
Governing rules: `.claude/rules/skills/brand-check/references/rulebook.md`, sections 1 to 3.

This document does not post anything. The approval chain is unchanged: Steve drafts, Dana reviews adversarially, Joe approves, Joe posts.

A note on this file's own text: it has to pass the same mechanical sweep as the drafts. Where a regex pattern needs a banned literal, the pattern is written with a character class (for example `s[h]ip`, `ke[y]`) so it still matches the word in a draft and this file does not contain it; that is exactly how the code writes those two patterns. Elsewhere the word is called "the banned launch verb". Dashes and the rocket emoji appear only as `\u` escapes, in section 5.4 included, where the TypeScript source carries the literal characters instead.

## 1. What the drafting model produces

The output shape is fixed by `pipelines/lk_assets.pipe` line 35 (`ASSET_TYPE=producthunt`):

| Field | Limit | What it is |
| --- | --- | --- |
| `name` | 40 characters (our limit, see section 7) | The product's real name, nothing appended |
| `tagline` | 60 characters | The one line under the name on the homepage |
| `description` | 260 characters (our limit; the form allows 500) | The short description on the listing |
| `first_comment` | 150 to 250 words | The maker's first comment, posted within ten minutes of going live |
| `topics` | 3 (the pipe still says 3 to 4; the gate caps at 3) | Product Hunt launch tags from the existing list |
| `warnings` | free text | Anything the builder must resolve before launch |

Those six keys are the model's whole output. Everything else on a stored draft is stamped by the runner and the gate (`blockers`, `repaired`, `venue`, `app_name`, `rulebook_version`, `rulebook_source`, `punctuation_fixed`, `wording_fixed`, `slop_fixed`): section 9 lists them, and section 5.1 says why a check scoped to every field never reads them.

Two kinds of guidance come out of the sources and they are kept apart on purpose:

- **Draft rules** (section 3): what the drafting model obeys, line by line. These are the `DEFAULT_RULEBOOKS` entry for `producthunt`.
- **Launch day operations** (section 4): timing, replying to comments, what Product Hunt penalises. These never enter a draft field. They are surfaced to the builder as notes.

## 2. Sources

### 2.1 The skill pack

Repository: https://github.com/yoanbernabeu/producthunt-skills
Commit: `5acfd604b66c9491365e24ccbf31f24e3b2ddfa3` (2026-01-30)
License: MIT, copyright 2025 Yoan Bernabeu (`LICENSE` at the repo root)
Local clone at review time: `<scratchpad>/social-skills/producthunt-skills/skills/`. Re-cloned for version 4 on 2026-09-11 at `<scratchpad>/social-skills-v4/producthunt-skills/skills/`, same commit (`git log` confirms it). The line references below come from the v4 audit against that clone; the three that carry a new rule or a new source row (the greeting section, type 8, the first-four-hour lines) were re-read by hand for this pass.

All eleven files below are pure markdown with no scripts, API calls or environment variables. The right-hand columns are the hits from the review's mechanical sweep, re-run on 2026-09-11 (banned verb, U+2014 dash, U+2013 dash, hype terms, rocket emoji).

| File (under `skills/`) | Review verdict | What was taken | Sweep hits |
| --- | --- | --- | --- |
| `compliance/ph-safe-messaging/SKILL.md` | USE | Core principle, red-flag phrase list (lines 299 to 328), incentive-language conversion (39 to 46), the full forbidden-to-allowed table (26 to 46), in-comment allowed and not-allowed lists | dash 5, rocket 1 |
| `compliance/ph-ban-prevention/SKILL.md` | USE | Six prohibited-behaviour categories (lines 40 to 128), detection signals, what to do if flagged | dash 2 |
| `content/ph-maker-comment/SKILL.md` | USE | Eight-part comment structure, the greeting and identity section (57 to 69), part 7's ask (153 to 160) and part 8's closing (176), the do and don't list (no unverifiable claims at 263, no vote asks, respond to every comment) | dash 7 |
| `content/ph-tagline-writer/SKILL.md` | PARTIAL, formulas only | 60-char limit with the 40 to 55 target (20 to 28), clarity and specificity tests, red-flag word list (157 to 163), formulas 2 to 5 | verb 1, hype 4 |
| `content/ph-description-writer/SKILL.md` | PARTIAL, structure only | 260-char limit (21), plain-text limits (20 to 24), PAS and BAB ordering (problem, then mechanism), "do not start with We" (231), "no multiple CTAs" | verb 2, dash 3, hype 1 |
| `content/ph-gallery-assets/SKILL.md` | USE | Developer Tool image sequence, "real product not mockups", design do and don't | dash 1 |
| `launch-day/ph-launch-day-checklist/SKILL.md` | USE | Night-before checks, first ten minutes, emergency protocols | dash 3, rocket 1 |
| `launch-day/ph-comment-responder/SKILL.md` | USE | Ten comment types and response strategies, type 8's competitor comparison (233 to 255) as the wording model for R17, the reply-fast rule, response quality checklist, the "excessive emojis" red flag (312) | verb 1, dash 7 |
| `strategy/ph-timing-optimizer/SKILL.md` | USE | 12:01 AM Pacific rule, weekday against weekend trade-off, why the first four hours matter, timezone table | hype 1 |
| `marketing/ph-community-outreach/SKILL.md` | USE, Show HN section excluded here | Be-a-member-first rules, one post per community, space posts out | U+2013 dash 1 |
| `compliance/ph-algorithm-guide/SKILL.md` | USE | The first-four-hour ranking randomisation (lines 96 to 99 and 132), used in section 4.1 bullet 3. Added to this table in v4; the section already carried the fact | none |

Hype hits in the tagline and description files are the "But Better", "Nx faster" and "10x" formulas, all dropped (section 8).

### 2.2 Sources outside the skill pack

Everything else the live rules and checks draw on. Added in v4: until then this document sourced only the skill pack.

| Source | What was taken |
| --- | --- |
| https://www.producthunt.com/launch/guide (fetched 2026-09-11) | "The only real rule here is that you cannot ask people directly to upvote your product. Instead, ask them to visit and comment." It leads R1 and it is why `ph_no_vote_ask` is hard |
| https://www.producthunt.com/launch/preparing-for-launch (fetched 2026-09-11) | The Content checklist: tagline max 60; "Description (max 500 characters)", which is why our 260 is recorded as a house limit; "Launch tags: Choose up to 3 launch tags", which set `ph_topics_max_count`; the name field rule "Only the product's name, no description or emojis (unless it is a legit part of the name)"; the first-comment guidance "Ask for feedback (NOT upvotes)" and "Emojis are great too. We suggest using them sparingly"; the form's own promo fields; the rule that shortened links (bit.ly) and UTM-tracked links are not accepted as the product link; the weekend click figure in 4.1. The help.producthunt.com article on the same subject returned 404 |
| `.claude/rules/skills/brand-check/references/rulebook.md` | 1.1 (the banned launch verb, the deprecated one-key framing, the dash ban), 1.2 (MaaS framing), 1.3 and 3.4 (AI tells, hype, the press-release register), 2.7 and 5.3 (unverifiable claims, confidential figures), 3.1 (genuine enthusiasm, not hype), 4.1 (never "better than X"), 4.3 (a foundation-model provider named in a comparative context routes to Joe), 5.1 (published pricing only) |
| `apps/launchkit/src/lib/rulebooks.ts`, `GLOBAL_RULES` (12 entries) | The floor under every platform, appended after the Product Hunt block by `rules.ts rulesBlock`. The four that this rulebook leans on hardest are the 9th (never invent a person, write `[Builder first name]` and `[role]`), the 10th (never invent an origin story or a limitation), the 11th (a competitor only as a neutral fact) and the 12th (a thin profile gets nothing but its one-liner). They are what R7, R17, R18 and R19 hand to the model |
| `apps/launchkit/pipelines/lk_assets.pipe` line 35 | The output shape and the field limits, the 150 to 250 word first comment among them. Its `(3-4)` topic count is now out of step with the gate: section 7 |
| `apps/launchkit/src/lib/slop-lexicon.ts`, from `skills/li-human/slop.json` in https://github.com/Jakeschincariol/linkedin-agent-skill (MIT, cloned 2026-09-07) | The 67 term swaps `cleanSlop` applies to every Product Hunt field except `warnings` before the gate runs (section 9). The LinkedIn pack's own `slop_lexicon` warning check keeps the terms that have no safe drop-in replacement; on Product Hunt that job belongs to `ph_no_ai_tells` |
| `docs/social-launch-skills-review.md` | The per-skill verdicts in 2.1, and the instruction to strip the rocket emoji, the dashes, the banned launch verb and the "Nx faster" formulas from every template before use |
| `docs/EVAL-10-APPS.md` and its run data under `docs/eval-10/` | Clusters 1, 2, 3, 6, 9, 13, 16 and 20, and the per-app issues named through sections 3, 5 and 7. Ten apps ran the real pipelines on 2026-09-11; the Product Hunt drafts scored 3.0 of 5. Every v4 rule and check carries the draft that earned it |
| RocketRide, this task | R8, R12, R13, R18, R19 and R20, the warnings clause in R16, the exclamation cap in R14; all twelve hook patterns; and the six checks no source skill covers: `ph_first_comment_exclamations`, `ph_no_hashtags`, `ph_tagline_no_title_case`, `ph_topics_clean`, `ph_no_template_tells`, `ph_warnings_no_self_report` |

## 3. Draft rules

The twenty rules below are the live `DEFAULT_RULEBOOKS` entry for `producthunt`, quoted in the order the model receives them, `rules[0]` to `rules[19]`. `rules.ts rulesBlock` puts them in a PLATFORM_RULES block, then the hook patterns of section 6, then the twelve GLOBAL_RULES. Each rule is followed by where it came from and what changed. The rule text is exactly what the model receives.

Four rules were rewritten for version 4 (R1, R2, R7, R16) and four are new (R17 to R20). Where a rule changed, the text below is the new wording; the old wording is not kept. Twelve rules are unchanged, and several of those gained a check in version 4 that now enforces what they always said.

**R1.** Never ask for a vote in any form, anywhere in the draft. Product Hunt's own rule: you may not ask people directly to upvote; ask them to visit and comment. Forbidden words and phrases: upvote, vote, voting, voters, leaderboard, "help us reach #1", "#1 on Product Hunt", "every vote counts", "support our launch", "support us", "we'd love your support", "thanks for the support", "show some love", "Product of the Day". Ask for feedback and questions instead: "tell me what breaks", "what would you need before you tried this".
From: ph-safe-messaging (core principle, the forbidden-to-allowed table at lines 26 to 46, the red-flag list at lines 299 to 328), ph-ban-prevention category 3 (lines 74 to 81), and Product Hunt's own launch guide, https://www.producthunt.com/launch/guide: "The only real rule here is that you cannot ask people directly to upvote your product. Instead, ask them to visit and comment." Changed for v4: the platform's own sentence now leads the rule, and five more softened forms are forbidden by name ("support us", "thanks for the support", "show some love", "#1 on Product Hunt", "Product of the Day"), plus "voters". The source's "these are fine" column still lists most of them; on a launch page they read as a vote ask with the word taken out. The replacement asks are ours.

**R2.** Use only figures that appear verbatim in APP_PROFILE.proof_points. No user counts, star ratings, testimonials, "trusted by", "used by teams at", benchmarks, percentages, "Nx faster", "N times smaller", "twice as fast" or "half the size" anywhere in name, tagline, description or first comment, even when the product's own site says it. If there is no proof point, write the mechanism instead of a number.
From: ph-maker-comment don't list, line 263 ("make unverifiable claims"), brand rulebook 2.7 and 5.3. The source also says "quantify if possible" and "include specifics (numbers, timeframes)"; that is inverted into "only from proof_points" because the drafting model cannot verify anything. Changed for v4: the rule named the "Nx" spelling only, so the model read "N times" as allowed and the evaluation approved "a script 54 times smaller than Google Analytics" in a description (EVAL-10-APPS, plausible). The rule now names "N times smaller", "twice as fast" and "half the size", and adds "even when the product's own site says it".

**R3.** Tagline: 60 characters maximum, aim for 40 to 55, sentence case, no trailing period, no emoji, no exclamation mark, no URL. State what the product does and for whom in words a developer outside the category understands on one read.
From: ph-tagline-writer golden rules 1 and 2 (lines 20 to 28) and the clarity test. "Explain it to mom" and "would a 10-year-old get it" became "a developer outside the category"; our reader is a developer, not a consumer. Sentence case and no trailing period are house style (GLOBAL_RULES). Confirmed by https://www.producthunt.com/launch/preparing-for-launch, Content checklist: "Tagline (max 60 characters)", "no gimmicks or over-the-top language". Unchanged in v4.

**R4.** Tagline forbidden list: "AI-powered", "all-in-one", "world's first", "best", "next-gen", "revolutionary", "supercharged", "seamless", "[X], but better", "Nx faster", and any other product's name unless it is a platform the product runs in or on (VS Code, GitHub, Slack). Allowed shapes: "[verb] [object] [outcome]", "[what it does] for [who]", "[verb] [object] without [the painful step]", "[verb] [object] in [a timeframe taken from proof_points]".
From: ph-tagline-writer red flags (lines 157 to 163) and formulas 2, 3, 4 and 5. Formula 1 ("Notion for X") is limited to platforms, formula 6 ("But Better") and formula 7 ("Nx faster") are dropped (section 8.1), "supercharged" and "seamless" come from the brand list. Formula 3 "Problem Killer" ("End meeting chaos forever") became "without [the painful step]" to remove the hype register. Unchanged in v4; `ph_tagline_red_flags` now enforces it on the field.

**R5.** Description: 260 characters maximum, two or three sentences, plain text, no markdown, no bullets, no emoji, no exclamation mark, no call to action. Sentence 1: the concrete painful step or problem. Sentence 2: what the product does about it, the mechanism, not an adjective. Sentence 3, optional: one verifiable specific (license, where it runs, what it plugs into).
From: ph-description-writer technical limits (line 21) and the PAS and BAB ordering. AIDA's attention hook and the 4 Ps "push" are dropped, the "end with a clear CTA" best practice is dropped (the listing has its own button and 260 characters are too few), social proof slots are dropped, every worked example is discarded. Unchanged in v4. Note that 260 is our house limit: the form now states "Description (max 500 characters)" (preparing-for-launch), and `lk_assets.pipe` line 35 asks for 260.

**R6.** Do not open the description with "We", "Our" or a question. Open with the concrete thing.
From: ph-description-writer "What to avoid: starting with We" (line 231). The question ban is from GLOBAL_RULES (no rhetorical-question openers) and overrides the AIDA example at line 45 that opens with "Tired of...?". Unchanged in v4.

**R7.** Maker first comment: 150 to 250 words, in this order: (1) one line in the exact shape "Hi, I'm [Builder first name], [role] at {Product}." unless APP_PROFILE or BRAND_DNA names the builder, in which case use that name and role; never "the team behind", "part of the team", "one of the team", "one of the contributors", "the builder", and never a name from memory, (2) why you built it, the specific moment or pain, two to three sentences, (3) what it does and how it works, three to four sentences with one concrete mechanism, (4) what is different, stated as a fact about your approach, (5) at least one limitation or rough edge, (6) one or two specific feedback questions, (7) one closing line saying you will be in the comments all day.
From: ph-maker-comment eight-part structure, with the greeting and identity section at lines 57 to 69, and GLOBAL_RULES (never invent a person). The source's part 6 (offer and incentive) is removed from the structure and handled by R10; a limitation part is added in its place; the source's 200 to 350 word target is replaced by the pipe's 150 to 250; part 3 "the problem" is folded into part 2 because at this length they are one thought. Changed for v4: part (1) now fixes the exact line and forbids the shapes the evaluation produced instead. Nine of ten first lines broke the old wording: three invented a name (documenso "Philipp", plausible "Marko", khoj "Saba") and six hid behind a group ("we're the team behind Formbricks", "I'm part of the Cal.com team", "I'm one of the Continue team", "I'm one of the contributors behind Hoppscotch", "we are the Excalidraw team", "I'm the builder"). The source's own examples carry an invented [Name] and an exclamation mark, so they are kept only as the shape (section 8.14).

**R8.** In the first comment name at least one thing the product does not do yet, or a known rough edge, in plain words. Say it before anyone else does.
From: ours, seeded by ph-comment-responder type 6 ("nothing new here") and the brand rule "show, don't tell". A stated limitation is the cheapest credibility a maker can buy on Product Hunt, and it pre-empts the harshest comment type. Unchanged in v4, and now paired with R18, which says where the limitation has to come from, and with `ph_first_comment_limitation_present`, which checks that one is there.

**R9.** The ask in the first comment is one or two questions the maker actually wants answered, tied to the product ("what would you need to see before you ran this on production traffic?"). Never "let me know what you think" on its own, never "check it out and support us".
From: ph-maker-comment part 7 (lines 153 to 160), whose good example is "Curious to hear how you currently solve this problem". The generic "Try it out and let me know what you think!" (line 175) moved from the good column to the bad column; it is filler that invites "Great product!" replies. Unchanged in v4; `ph_first_comment_ask_present` and `ph_first_comment_no_lazy_ask` now enforce both halves.

**R10.** Offers: include one only if APP_PROFILE contains it, worded as available to everyone who visits from Product Hunt, never tied to voting, commenting or ranking. No countdowns, no "first 100", no "limited time", no invented codes or discounts.
From: ph-ban-prevention category 2, incentivised voting (lines 59 to 65), and the ph-safe-messaging incentive-language table (lines 39 to 46). The source's examples ("first 100 users from PH get lifetime access", "3 months free on Pro") are dropped; RocketRide pricing is published (rulebook 5.1) and the model may not invent a deal. Unchanged in v4. Worth knowing: the launch form has its own promo fields ("What is the offer?", "promo code", "expiration date"), so a real offer belongs there and not in the comment text.

**R11.** Other products: mention one only as a plain factual statement of what you do differently ("it runs on your own hardware; the hosted tools do not"). Never "better than", never "unlike [named product]", never a negative adjective attached to a competitor's name.
From: ph-maker-comment part 5 tips ("don't bash competitors by name, be factual"), ph-comment-responder type 8, brand rulebook 4.1. The source's template "Unlike [category of competitors], [Product]..." is dropped; the brand rule is stricter than the source. Unchanged in v4, and now paired with R17, which gives the wording the rule was missing, and with `ph_no_competitor_framing` (hard) and `ph_competitor_negative_predicate`.

**R12.** Topics: three from Product Hunt's existing topic list, most specific first (for example "Developer Tools", "Open Source", "Artificial Intelligence", "GitHub"); a fourth only if the profile clearly spans a fourth category. No invented topics, no hashtags.
From: ours; no source skill covers topics. Unchanged in v4, and now out of step with the code: Product Hunt's own page says "Launch tags: Choose up to 3 launch tags" (preparing-for-launch), `ph_topics_max_count` is 3 and hard, and this rule still invites a fourth. Four of the ten evaluation drafts carried four topics. See section 7.

**R13.** Name: the product's real name from APP_PROFILE only, 40 characters maximum, no tagline appended, no version number, no emoji.
From: ours. The listing form has a separate tagline field; makers who append a slogan to the name get truncated on the homepage card. Unchanged in v4. The form's own rule for the field is "Only the product's name, no description or emojis (unless it is a legit part of the name)" (preparing-for-launch), which is what `ph_name_clean` enforces; the rule text does not yet say it. See section 7.

**R14.** Emoji: at most one in the whole draft, only in the first comment's greeting line, never a rocket. Exclamation marks: none in the tagline or description, at most two in the first comment.
From: ph-maker-comment greeting examples (line 62; the wave emoji is the platform convention) and ph-comment-responder red flag "excessive emojis" (line 312). The source uses the rocket freely; it is banned here. The exclamation cap is ours. Unchanged in v4. The platform's first-comment guidance agrees ("Emojis are great too. We suggest using them sparingly"), and `ph_first_comment_emoji_cap` now enforces one emoji in line 1 only. See section 7.

**R15.** Write the first comment in first person singular for a solo maker, "we" only if APP_PROFILE lists a team. Warm is fine, hype is not: cut every sentence that says the product is great instead of showing what it does.
From: ph-maker-comment "the trust factor" (corporate-speak against genuine voice) and brand rulebook 3.1. Made mechanical ("cut every sentence that...") so the model can apply it. Unchanged in v4; `ph_no_ai_tells` now catches the specific adjectives it was losing to, which is how "the Platform API is powerful but the documentation has gaps" reached an approved cal-com draft.

**R16.** Keep launch timing, reply cadence and supporter outreach out of every draft field. warnings holds only what the builder must resolve before launch (a missing offer, an unverified claim, an ambiguous topic, a placeholder to fill): never a character or word count, never "compliant", "verified" or a note that a rule was followed, never a list of things the draft did not do.
From: ours. It separates section 3 from section 4 at draft time so the operational advice never leaks into the listing text. Changed for v4: the rule now says what `warnings` may not hold. In the evaluation the model's warnings were self-praise and false counts on six apps (continue: "Exclamation mark count in first comment: zero. Compliant"; cal-com: "The tagline is 55 characters, within the 40-55 target range" on a 64-character tagline). The gate's evidence lines are the count of record. Source: RocketRide, this task (EVAL-10-APPS cluster 2).

**R17.** When APP_PROFILE, BRAND_DNA or COMMERCIAL names a competitor and the first comment mentions it, write one sentence per product in the same shape: what it does, where it runs, and its public price only if the profile or COMMERCIAL records one. Then one sentence inviting the reader to run both on their own workload. No adjective on either product, no "better", "unlike", "instead of", "replace", and never a verb that makes the other product the wrongdoer (locks, charges, forces, buries, means cookie banners).
New in v4. From: ph-comment-responder type 8 (lines 233 to 255), rewritten: the source's template opens "Great question! [Competitor] is solid" and closes "Best way to know is to try both!", with a bullet list between. R11 said what not to do and gave no wording, so the excalidraw, plausible and documenso first comments each attached a negative predicate to a named product and passed the gate. Also from brand rulebook 4.1 and GLOBAL_RULES (a competitor named only as a neutral fact). Hook 10 is its shape.

**R18.** The limitation in the first comment is copied from the gap APP_PROFILE records (an early stage, a missing platform, a feature not there yet, a cloud-only feature). Never a documentation gap, a pricing page Launch Kit could not read, a blank screen, "fewer guardrails", or anything the profile does not state. A page that failed to load is a read failure, not a product limitation. If the profile records no gap, write "Limitation: [builder to add one]".
New in v4. From: RocketRide, this task (EVAL-10-APPS cluster 3, and the per-app issues: documenso "the self-hosted path also has fewer guardrails", cal-com "the documentation has gaps", hoppscotch "first-time visitors sometimes land on a blank screen" and "the Enterprise Edition pricing is not publicly listed", formbricks "the analytics dashboard is functional but basic"). R8 demands a limitation and seven of ten drafts invented one to satisfy it; GLOBAL_RULES names the fix, and the platform rule that creates the demand now carries it. The read-failure clause is there because a page Launch Kit could not load became a product gap on hoppscotch.

**R19.** Never reuse a phrase from these rules or from another draft as prose: not "stated plainly", "stated as a fact", "what makes our approach different", "in plain words", "kept running into the same wall". Write the specific thing the phrase stands for.
New in v4. From: RocketRide, this task (EVAL-10-APPS cluster 20; dub issue 9, hoppscotch issue 9, the documenso and dub first comments, the cal-com first comment). Four apps opened the story with "we kept running into the same wall" and two echoed R11's own wording ("What makes our approach different, stated plainly:"). A rulebook phrase in the draft is a tell the community reads as generated. `ph_no_template_tells` carries the list.

**R20.** No link and no {APP_URL} in the name, tagline, description or topics. The listing form carries the product link in its own field and renders none of these as links.
New in v4. From: https://www.producthunt.com/launch/preparing-for-launch (the Content checklist keeps name, tagline, description and links in separate fields) and RocketRide, this task. Section 5 banned a link in the tagline and the description from the start, and no rule said so; the two checks did not exist in code until v4 either. The first comment is not covered: see section 7.

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

- Tuesday to Thursday: most traffic, most competition, best for reach. Saturday and Sunday: less of both, easier to place well, weaker business audience. Friday sits between and its launches are grouped into the Monday newsletter. Pick by goal: reach or a badge. The per-day vote counts in the source are unsourced and are not reproduced here. One figure for the weekend does have a source: Product Hunt's own page says products launched at the weekend get 15% more Visit button clicks (https://www.producthunt.com/launch/preparing-for-launch, added in v4).
- The first four hours matter because the homepage order is partly randomised early and the algorithm reads early engagement. Have the maker online for those four hours. Nothing else about "momentum" from the source survives the brand rules. Source: ph-algorithm-guide lines 96 to 99 ("Factor 4: First 4 Hours", "Rankings randomized initially") and line 132 ("Hours 0-4: Randomized ranking"); the skill is in the 2.1 table as of v4. Its vote-weighting and myth-busting sections are left out (section 8.16).

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

These are the checks a program enforces on the draft. They live in `RULEBOOK_CHECKS['producthunt']` in `src/lib/rulebook-checks.ts` and `runRulebookCheckHits` in `src/domain/gates.ts` runs them after the model answers and after the sanitiser passes of section 9. Thirty-seven checks: 12 hard, 25 soft. Twenty of them are new in v4, two of which (`ph_tagline_clean`, `ph_description_clean`) had been in this table since v3 while the code had neither.

### 5.1 How the gate reads a check

A `RuleCheck` is `{ id, description, kind, value, field, flags?, hard?, when? }`.

- **kind** is one of `max_chars`, `min_words`, `max_words`, `max_count`, `forbidden_regex`, `required_regex` (the field must match) and `required_prefix`. Product Hunt uses five of the seven: no check here is a `required_regex` or a `required_prefix`. Where a part of the draft has to be present (a limitation, a question, the closing line), it is written as a negative lookahead inside a `forbidden_regex` instead.
- **field** is a draft key, or `all` (`*` is equivalent) for every string field and every string inside an array field. `all` never reaches the keys the runner and the gate stamp: `META_FIELDS` in `gates.ts` holds `warnings`, `blockers`, `repaired`, `venue`, `app_name`, `rulebook_version`, `rulebook_source`, `punctuation_fixed`, `wording_fixed` and `slop_fixed`. So on a Product Hunt draft `all` means `name`, `tagline`, `description`, `first_comment` and each entry of `topics`, and a check that has to read `warnings` names that field: `ph_warnings_no_self_report` is the only one.
- **hard or soft.** A hard hit becomes a `blockers` entry as well as a `warnings` line: the asset card shows it in a "fix before posting" banner and it is what triggers the one repair pass in `api.ts runAsset`. A check may set `hard` itself (new in v4); without it the gate's defaults decide, and they are `HARD_KINDS` (`max_chars`, `max_words`, `max_count`, `required_prefix`, `required_regex`) plus `HARD_IDS`, an id containing `banned_verb`, `raw_links`, `vote_ask`, `no_dashes` or one of the link-count tokens. That is why `ph_tagline_max_chars`, `ph_description_max_chars`, `ph_name_max_chars`, `ph_first_comment_max_words` and `ph_no_dashes` are hard without saying so, while `ph_first_comment_min_words` is soft: `min_words` is not in `HARD_KINDS`. Whether a blocker should also refuse approval is an open question (section 7).
- **when** is a guard `{ field, regex }` that runs a check only when another field matches. It exists for the venue-scoped Reddit title checks, which read the `venue` key the runner stamps from the selected target. No Product Hunt check uses it: all 37 run on every draft.
- **max_count** counts array entries on an array field. On a string field `countIn` decides what to count from the id: placeholders, raw links, paragraph breaks, the product's name (from the stamped `app_name`), else hashtags. `ph_topics_max_count` reads the `topics` array, so it counts entries.
- **flags** are the check's own when it sets them, else `i`, or `iu` when the pattern text contains a `\u{` escape. `ph_no_rocket` therefore compiles with `iu`. `ph_no_dashes` carries the two dash characters themselves, not escapes, so it compiles with `i`.
- A pattern JavaScript cannot compile is skipped, never fatal. A `forbidden_regex` stops at the first field that hits, so one draft yields at most one line per check, and that line is `field: description (evidence)`.

### 5.2 The counting checks

| id | kind | value | field | hard or soft | What it catches | v4 |
| --- | --- | --- | --- | --- | --- | --- |
| `ph_tagline_max_chars` | max_chars | 60 | tagline | hard (default) | Product Hunt truncates past 60; counts code points, as the tagline entry in gates.ts ASSET_LIMITS does for the same field | kept |
| `ph_description_max_chars` | max_chars | 260 | description | hard (default) | Our card limit. The form itself allows 500 characters; the check description now says so | changed |
| `ph_first_comment_min_words` | min_words | 150 | first_comment | soft (default) | Below this the comment carries no story and no limitation | kept |
| `ph_first_comment_max_words` | max_words | 250 | first_comment | hard (default) | Above this nobody reads as far as the ask | kept |
| `ph_topics_max_count` | max_count | 3 | topics | hard (set) | A fourth launch tag. The form accepts three | changed |
| `ph_name_max_chars` | max_chars | 40 | name | hard (default) | Homepage card truncation; also catches a tagline appended to the name | kept |

### 5.3 The pattern checks

All 31 are `forbidden_regex`. The exact value of each is in 5.4, in this order. `flags` is the value the check sets, or the gate default in brackets.

| id | field | flags | hard or soft | What it catches | v4 |
| --- | --- | --- | --- | --- | --- |
| `ph_no_vote_ask` | all | [i] | hard (set) | Any vote ask, the softened forms (support us, show some love, #1 on Product Hunt, Product of the Day, thanks for the support) and the engagement asks (follow, repost, retweet, like, tag, link in bio) | changed |
| `ph_no_scarcity_or_reciprocity` | all | [i] | soft (set) | Fake scarcity, a countdown, a vote swap, and an invented offer: a promo code, a percentage off, a lifetime deal, a PH exclusive, a giveaway | changed |
| `ph_no_hype` | all | [i] | soft (set) | The brand hype list plus the tagline red flags. "the best" no longer fires on "best-effort" | changed |
| `ph_no_nx_multiplier` | all | [i] | soft (set) | A multiplier in any spelling: 10x, 3x faster, 54 times smaller, twice as fast, half the size. A screen size such as 1080x720 passes | changed |
| `ph_no_banned_verb_or_key_framing` | all | [i] | hard (set) | The banned launch verb in every form, and the deprecated one-key framing including the "one API key for all" spelling | changed |
| `ph_no_dashes` | all | [i] | hard (default) | Em dash and en dash. The belt behind sanitizeDraft and behind the dash warning gateAsset adds | kept |
| `ph_no_rocket` | all | [iu] | soft (default) | The rocket emoji | kept |
| `ph_description_opener` | description | [i] | soft (default) | A description that opens with We, We are, We have, Our, or with a question inside its first 120 characters | kept |
| `ph_first_comment_exclamations` | first_comment | [i] | soft (default) | Three or more exclamation marks in the maker comment | kept |
| `ph_no_social_proof_phrases` | all | [i] | soft (set) | Social-proof phrasing and a review rating (4.9/5, a star glyph). A GitHub star count is not a rating and passes when proof_points holds it | changed |
| `ph_no_hashtags` | all | [i] | soft (default) | A hashtag anywhere, "#ProductHunt" included | kept |
| `ph_tagline_clean` | tagline | `u` | soft (default) | An exclamation mark, a trailing period or an emoji in the tagline | new |
| `ph_tagline_no_raw_links` | tagline | [i] | hard (set) | A link or the {APP_URL} placeholder in the tagline; the form has its own link field | new |
| `ph_tagline_red_flags` | tagline | [i] | soft (default) | The tagline red-flag words and the "[X], but [Y]" shape | new |
| `ph_tagline_no_title_case` | tagline | none (case-sensitive) | soft (default) | Four capitalised words in a row in the tagline | new |
| `ph_description_clean` | description | `um` | soft (default) | An emoji, an exclamation mark, a bullet, bold or a heading; the field is plain text | new |
| `ph_description_no_raw_links` | description | [i] | hard (set) | A link or the {APP_URL} placeholder in the description | new |
| `ph_name_clean` | name | `u` | soft (default) | A colon, a pipe character, a spaced dash, a version number, a parenthesis or an emoji appended to the name | new |
| `ph_topics_clean` | topics | `u` | soft (default) | A hashtag, a comma-joined pair, a link or an emoji inside one topic entry | new |
| `ph_first_comment_no_anonymous_opener` | first_comment | [i] | hard (set) | Line 1 hiding behind a group: the team behind, part of the team, one of the contributors, one of the builders | new |
| `ph_first_comment_named_person` | first_comment | none (case-sensitive) | soft (default) | A capitalised first name in line 1, so the builder confirms it is in the profile. A nudge: it fires on a real name too | new |
| `ph_first_comment_emoji_cap` | first_comment | `u` | soft (default) | A second emoji anywhere, or any emoji below the greeting line. A skin-tone modifier or a variation selector does not count as a second | new |
| `ph_first_comment_limitation_present` | first_comment | [i] | soft (default) | A first comment with no limitation, no rough edge and no "[builder to add one]" anywhere in it (R8) | new |
| `ph_first_comment_ask_present` | first_comment | [i] | soft (default) | A first comment with no question mark at all (R9) | new |
| `ph_first_comment_no_lazy_ask` | first_comment | [i] | soft (default) | The filler asks: let me know what you think, any feedback welcome, check it out, thoughts?, AMA | new |
| `ph_first_comment_closing_present` | first_comment | [i] | soft (default) | No closing line saying the maker will be in the comments (R7 part 7) | new |
| `ph_no_competitor_framing` | all | [i] | hard (set) | Better-than-X positioning in every shape: better than, unlike other, X killer, ditch, switch from, we replaced, the only real options were, bloated legacy tools | new |
| `ph_competitor_negative_predicate` | all | none (case-sensitive) | soft (default) | A capitalised product name followed by a wrongdoer verb (GA4 means cookie banners, Lucidchart, ask you to sign up, Calendly charges you) | new |
| `ph_no_template_tells` | all | [i] | soft (default) | A phrase from this rulebook or from a sibling draft used as prose: the same wall, what makes our approach different, stated plainly, in plain words | new |
| `ph_no_ai_tells` | all | [i] | soft (default) | The AI-tell and hype vocabulary the brand rulebook bans, including powerful, robust, genuinely, excited to share, the future of, and the late-night-outage cliche | new |
| `ph_warnings_no_self_report` | warnings | [i] | soft (default) | A warning that is a count, a compliance boast, or a claim that a rule was followed. The only check that reads warnings | new |

### 5.4 The pattern values, verbatim

Quoted as a JavaScript engine reads them: single backslashes, where the TypeScript literal doubles every one. `ph_no_dashes` is the one value whose source carries the two dash characters themselves; it is written here with `\u` escapes, per the note at the top of this file.

**`ph_no_vote_ask`** (all, flags `i`)

```
\bup-?vot\w*|\bvote (?:for|us|me|it|this|now|today|here|if)\b|\b(?:cast|drop|give) (?:a|your|us a) vote\b|\bevery vote\b|\bvotes? (?:count|matter)\b|\bvoters? (?:get|win|receive)\b|\b(?:top of|climb|hit|reach|win|on) the leaderboard\b|\bleaderboard (?:spot|position|rank)\b|\bhelp us (win|reach|climb|trend|get to|hit|stay)\b|\breach (#|number |no\.? ?)?1\b|(#|\bnumber |\bno\.? ?)1 (on|of the day|today|spot)\b|\bproduct of the (day|week|month)\b|\btop (post|product) (of the day|badge)\b|\bsupport (our|the|this|my) launch\b|\b(love|appreciate|need|value) your support\b|\byour support (means|would|helps|matters|counts)\b|\b(thanks?|thank you|grateful) for (your|the|all the) ((\w+ )?support|love)\b|\bshow (some|your|us some) (love|support)\b|\bsupport us\b|\bin exchange for\b|\breturn the favou?r\b|\b(i'?ll|we'?ll) (support|back|boost) yours\b|\bfollow (?:me|us|for more)\b|\brepost (?:this|if)\b|\bretweet\b|\blike (?:this (?:post|tweet|thread)|if you)\b|\bplease (?:like|share|repost|retweet)\b|\bshare (?:this|it) with\b|\btag (?:a friend|someone)\b|\bsmash (?:that|the)\b|\blink in bio\b
```

**`ph_no_scarcity_or_reciprocity`** (all, flags `i`)

```
\b(first \d+ (users|people|makers|signups|hunters|customers|upvoters|voters)|limited (time|spots|offer)|only \d+ (left|spots|seats)|ends (tonight|today|at midnight)|hurry|last chance|don'?t miss|in return|return the favou?r|i'?ll (upvote|support) yours|giveaway|\d+ ?% off|promo ?code|use (the )?code [A-Z0-9]+|lifetime (deal|access)|(ph|product hunt) (exclusive|special)|for the ph community|early access for)
```

**`ph_no_hype`** (all, flags `i`)

```
\b(game.?chan[g]\w*|revolution(ar|i[sz])\w*|groundbreakin[g]|vira[l](ity)?|seamless\w*|unleash\w*|supercharg\w*|world'?s first|next-?gen\w*|all-in-one|ai-powered|cutting-edge|best-in-class|world-class|state-of-the-art|the best(?![- ]effort)|10x)\b
```

**`ph_no_nx_multiplier`** (all, flags `i`)

```
(?:\b\d+(?:\.\d+)?x\s+(?:faster|slower|better|cheaper|smaller|bigger|lighter|quicker|more|less|the|dev|developer|engineer|growth|productivity|results?|value)\b|\b10x\b)|\b(\d+(\.\d+)?|two|three|four|five|six|seven|eight|nine|ten|twenty|fifty|hundred) ?times (faster|slower|smaller|bigger|lighter|cheaper|better|more|fewer|less|quicker|as )|\btwice (as|the)\b|\bhalf the (size|cost|price|time|weight)\b
```

**`ph_no_banned_verb_or_key_framing`** (all, flags `i`)

```
\b(s[h]ip(s|ped|ping|pable)?|universal\s+api\s+ke[y]|one (api )?ke[y] (for|covers|to access|across) (all|every|hundreds))\b
```

**`ph_no_dashes`** (all, flags `i`)

```
[\u2014\u2013]
```

**`ph_no_rocket`** (all, flags `iu`)

```
\u{1F680}
```

**`ph_description_opener`** (description, flags `i`)

```
^\s*(We|We're|We've|Our)\b|^[^.!?\n]{0,120}\?
```

**`ph_first_comment_exclamations`** (first_comment, flags `i`)

```
![^!]*![^!]*!
```

**`ph_no_social_proof_phrases`** (all, flags `i`)

```
\b(trusted by|loved by|used by (teams|companies|developers) at|join \d[\d,]*\+? (users|developers|makers|teams)|\d(\.\d)?/5|testimonials?)\b|[★⭐]
```

**`ph_no_hashtags`** (all, flags `i`)

```
(^|\s)#[A-Za-z]
```

**`ph_tagline_clean`** (tagline, flags `u`)

```
!|\.$|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]
```

**`ph_tagline_no_raw_links`** (tagline, flags `i`)

```
https?://|\bwww\.|\{APP_URL\}
```

**`ph_tagline_red_flags`** (tagline, flags `i`)

```
\b(ai[- ]?powered|all[- ]in[- ]one|world'?s first|best|next[- ]?gen(eration)?|revolutionary|supercharged?|seamless(ly)?|but better|10x)\b|\b\w+, but (with|without|better|for|faster|simpler|smarter)\b
```

**`ph_tagline_no_title_case`** (tagline, no flags, case-sensitive)

```
\b[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+\b
```

**`ph_description_clean`** (description, flags `um`)

```
[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]|!|^\s*[-*•]|\*\*|^\s*#{1,6}\s
```

**`ph_description_no_raw_links`** (description, flags `i`)

```
https?://|\bwww\.|\{APP_URL\}
```

**`ph_name_clean`** (name, flags `u`)

```
[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]|[:|]| - |\bv?\d+\.\d+(\.\d+)?\b|\(
```

**`ph_topics_clean`** (topics, flags `u`)

```
[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]|^\s*#|https?://|,
```

**`ph_first_comment_no_anonymous_opener`** (first_comment, flags `i`)

```
^[^\n]*\b(we'?re|we are|i'?m|i am|this is) (the|part of the|one of the|from the|a member of the|on the|with the) ([\w.+-]+ )?(team|builders?|contributors?|makers?|founders?|maintainers?|crew|folks|people)\b|^[^\n]*\b(i'?m|i am) (one of the|a|the) (builders?|contributors?|makers?|founders?|co-?founders?|developers?|maintainers?|creators?|authors?|devs?)\b
```

**`ph_first_comment_named_person`** (first_comment, no flags, case-sensitive)

```
^[^\n]*\b(I'?m|I am|this is|my name is) [A-Z][a-z]+(?![\w.])
```

**`ph_first_comment_emoji_cap`** (first_comment, flags `u`)

```
\n[\s\S]*(?:(?![\u{1F3FB}-\u{1F3FF}\u{FE0F}])[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}])|(?:(?![\u{1F3FB}-\u{1F3FF}\u{FE0F}])[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}])[\u{1F3FB}-\u{1F3FF}\u{FE0F}]*[\s\S]*(?:(?![\u{1F3FB}-\u{1F3FF}\u{FE0F}])[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}])
```

**`ph_first_comment_limitation_present`** (first_comment, flags `i`)

```
^(?![\s\S]*\b(limitations?|rough edges?|does not (do|support|have|include|handle|run|work)|doesn'?t (do|support|have|include|handle|run|work)|not (there |here |available |supported |built |done )?yet|no [\w-]+ yet|cannot|can'?t|isn'?t (there|ready|built)|missing|known (gap|issue|bug)s?|early (alpha|beta|stage)|\[builder to add one\])\b)
```

**`ph_first_comment_ask_present`** (first_comment, flags `i`)

```
^(?![\s\S]*\?)
```

**`ph_first_comment_no_lazy_ask`** (first_comment, flags `i`)

```
\b(let (me|us) know what you think|any feedback (is )?(welcome|appreciated)|would love to hear (your )?thoughts|check it out|thoughts\?)|\bama\b
```

**`ph_first_comment_closing_present`** (first_comment, flags `i`)

```
^(?![\s\S]*\b(in the comments|answer(ing)? (every|each) (comment|question)|here all day|all day|around all day)\b)
```

**`ph_no_competitor_framing`** (all, flags `i`)

```
\b(better|worse|faster|cheaper|simpler|smarter|lighter|easier|stronger|more \w+) than\b|\bunlike (most|other|every|any|all|the rest|legacy|traditional|existing|closed|proprietary)\b|\b\w+[- ]killer\b|\b(ditch|dump|stop using|move off|migrate (away )?from|switch(ed|ing)? (away )?from|say goodbye to|we replaced|instead of paying for|blows? \w+ (away|out of the water)|puts? \w+ to shame|leaves? \w+ in the dust|the only real options? (were|was|is|are)|(bloated|overpriced|clunky|outdated|legacy) (tools?|alternatives?|competitors?|incumbents?|options?|software))\b
```

**`ph_competitor_negative_predicate`** (all, no flags, case-sensitive)

```
\b[A-Z][\w.+-]*,? (locks?|lock in|lock-in|buries|charges? (you|per|for|extra)|forces? you|makes? you|asks? you to (sign|pay|pick|create)|means (cookie|paying|vendor|lock)|sends? your data|holds? your \w+ hostage|nickel|gouges?|spies)\b
```

**`ph_no_template_tells`** (all, flags `i`)

```
\b(kept|keep|ran|run|running) (running |hitting |bumping )?into the same wall\b|\bthe same wall\b|\bwhat makes (our|my|the) approach different\b|\bstated plainly\b|\bstated as a fact\b|\bin plain words\b|\bsay it before anyone else does\b
```

**`ph_no_ai_tells`** (all, flags `i`)

```
\b(delve|delving|elevat(e|es|ed|ing)|unlock(s|ed|ing)?|leverag(e|es|ed|ing)|excited to (announce|share|introduce)|thrilled to|proud to (announce|share)|in today'?s|fast-paced|keep (thinking about|coming back to)|pattern i keep seeing|here'?s the thing|let that sink in|worth watching|effortless(ly)?|robust|powerful|genuinely|empower(s|ed|ing)?|streamlin(e|es|ed|ing)|transform(s|ed|ing)? (how|the way)|the future of|[1-4] ?a\.?m\.?)\b
```

**`ph_warnings_no_self_report`** (warnings, flags `i`)

```
\b(compliant|within (the |its )?[^.\n]{0,30}?(limit|range|cap|target)|no (emoji|emojis|hashtags?|em dash|en dash|dashes|exclamation marks?|vote asks?|competitors?) (used|appear|were used|present|mentioned)|verified\.?|count: ?(zero|one|two|none|0|1|2)|(was|were) (omitted|avoided|excluded|kept out)|(is|are) (used|included) (once|only once|exactly once)|all (fields|rules) (pass|comply|checked))\b
```

The order in `rulebook-checks.ts` is: `ph_tagline_max_chars`, `ph_description_max_chars`, `ph_first_comment_min_words`, `ph_first_comment_max_words`, `ph_topics_max_count`, `ph_name_max_chars`, `ph_no_vote_ask`, `ph_no_scarcity_or_reciprocity`, `ph_no_hype`, `ph_no_nx_multiplier`, `ph_no_banned_verb_or_key_framing`, `ph_no_dashes`, `ph_no_rocket`, `ph_description_opener`, `ph_first_comment_exclamations`, `ph_no_social_proof_phrases`, `ph_no_hashtags`, `ph_tagline_clean`, `ph_tagline_no_raw_links`, `ph_tagline_red_flags`, `ph_tagline_no_title_case`, `ph_description_clean`, `ph_description_no_raw_links`, `ph_name_clean`, `ph_topics_clean`, `ph_first_comment_no_anonymous_opener`, `ph_first_comment_named_person`, `ph_first_comment_emoji_cap`, `ph_first_comment_limitation_present`, `ph_first_comment_ask_present`, `ph_first_comment_no_lazy_ask`, `ph_first_comment_closing_present`, `ph_no_competitor_framing`, `ph_competitor_negative_predicate`, `ph_no_template_tells`, `ph_no_ai_tells`, `ph_warnings_no_self_report`.

### 5.5 Not machine-checkable, and therefore rules only

- Whether a figure is in `proof_points` (R2). The checks catch the shapes a fabricated number takes, never the fabrication.
- Whether a named person is the real builder (R7). `ph_first_comment_named_person` is a nudge: it fires on any capitalised first name in line 1, a correct one included. The group openers it cannot see are covered by `ph_first_comment_no_anonymous_opener`, which is hard.
- Whether a limitation is the gap the profile records (R18). `ph_first_comment_limitation_present` proves only that some limitation is there, which is what let "the self-hosted path also has fewer guardrails" and "first-time visitors sometimes land on a blank screen" pass.
- Whether a competitor sentence is about a competitor the profile names (R17). `ph_competitor_negative_predicate` is case-sensitive and name-blind, so it also fires on "Postgres locks the table".
- Whether a topic exists on Product Hunt's launch-tag list (R12), and whether the offer in R10 is the one the profile holds.
- The specificity of the ask (R9): only the presence of a question mark is checked.

The first four close the same way, and only that way: a profile-aware check kind that reads the builder's name and the competitor names out of `APP_PROFILE` at gate time. `gates.ts` would have to be handed the profile, which it is not today. Section 7 carries it as an open question.

## 6. Hook patterns

Openers for the first comment, or the shape of a tagline. Written fresh in the developer-first voice; none is copied from the source packs, and hook 10 is the only one whose shape is rewritten from a source template (ph-comment-responder type 8). Placeholders in braces come from APP_PROFILE; `[Builder first name]` and `[role]` are the GLOBAL_RULES placeholders the builder fills in.

Twelve hooks, in the order `hooks[0]` to `hooks[11]`. The first eight are unchanged from v3 and four are new in v4. No hook was dropped in v4. The four new ones exist because four rules asked for something the model had no shape for: R7's fixed first line, R17's competitor sentence pair, R18's profile-recorded gap and R9's two questions. Hook 4 is the shape the evaluation rated best on a first comment (plausible), and it is the one R18 now constrains.

1. "The {Nth} time I {re-did the same glue step}, I wrote {product} instead. Here is what it does."
2. "{Product} takes {a thing developers already have: a repo, a pipe file, a folder of PDFs} and gives back {a concrete output}. No {the step they dread}."
3. "Here is the whole setup: {one command or three lines}. That is the pitch."
4. "What it does not do yet: {limitation}. What it does: {the one thing it does well}."
5. "I built this for {specific role} who {specific pain}. If that is not you, it will look boring, and that is fine."
6. "Before: {the real sequence, step by step}. After: {one step}. Same result, and you can read the code that does it."
7. "{License}, runs {where the profile says}, plugs into {what the profile lists}. Pull it apart and tell me where it breaks."
8. "{Product} runs {on your own machine or in your own container}. {What stays on the user's side, from the profile}."
9. "Hi, I'm [Builder first name], [role] at {Product}. {The pain in one present-tense sentence from icp.pain}, so {Product} {what it does, from the one-liner}." *(new in v4)*
10. "{Competitor} is a {category} that {what it does}{, at {public price from the profile}}. {Product} is a {category} that {what it does}{, at {public price}}. Run both against your own {workload from the profile} and tell me which one held up." *(new in v4)*
11. "Not there yet: {gap recorded in the profile}. If you need it today, {what the profile says to do instead}. Tell me what that costs you and I will move it up the list." *(new in v4)*
12. "Two things I want to know: {a question about a design decision named in the profile}? And {a question about the ICP's own workload}?" *(new in v4)*

## 7. Open questions for the owner

- **Topic count.** Answered by the platform and still inconsistent in the code. Product Hunt's own page says "Launch tags: Choose up to 3 launch tags" (https://www.producthunt.com/launch/preparing-for-launch, fetched 2026-09-11), so v4 set `ph_topics_max_count` to 3 and made it hard. R12 still reads "a fourth only if the profile clearly spans a fourth category" and `lk_assets.pipe` line 35 still asks for `(3-4)`. The rule therefore invites a fourth topic that the gate then blocks, and the pipe asks for it too. Four of the ten evaluation drafts carried four topics. The edit the audit proposed is "Topics: exactly three from Product Hunt's existing launch-tag list, most specific first ... The form accepts at most three." Owner's call: approve that rewrite and the pipe edit, or relax the check.
- **R13 and R14 wording against their new checks.** `ph_name_clean` blocks a colon, a pipe character, a spaced dash, a parenthesis, a version number and an emoji in the name; `ph_first_comment_emoji_cap` allows one emoji and only in line 1. Both shapes come from the form's own rules ("Only the product's name, no description or emojis (unless it is a legit part of the name)", "Emojis are great too. We suggest using them sparingly"). Neither rule text says so yet, so the model is judged on a shape it was not told. The audit proposed adding the form's clause to R13 and "only at the end of the first comment's greeting line ... the name, tagline, description and topics carry none" to R14. Unresolved.
- **A hard check does not actually stop an approval.** `gateAsset` fills `blockers`, `runAsset` runs one repair pass over them, and the asset card shows "N hard-rule failures: fix before posting". But `api.approveAsset` sets the status to approved without reading `blockers`, and the Approve button is not disabled (it carries `data-blockers` for the test only). Cluster 1 of the evaluation is the evidence that a founder approves over a gate failure when the button allows it. Whether a blocker should refuse the approval outright is the owner's call; this document describes the code as it stands.
- **A tracked product link.** The same platform page says shortened links (bit.ly) and UTM-tracked links are not accepted for the product link, and the Plan stage issues a tracked link per venue. No rule here can fix it: R20 keeps every link out of the draft fields, so the collision is between the Plan stage and the launch form. Route to the owner with the Plan stage.
- **A product whose own feature is voting.** `ph_no_vote_ask` is hard. Its bare-vote branches were narrowed to asks ("vote for", "every vote", "votes count", "voters get"), which keeps a polling or elections product out of most of the pattern, but not all of it. Checks are code, not Settings, so such a founder would need the check relaxed for them. Same class: "Product of the Day" and "top product badge" also fire on a factual mention of a badge already won, which R2 would treat as unsourced proof anyway.
- **Google named in a comparative context.** The evaluation's plausible draft carried "GA4 means cookie banners, complex reports, and data sent to Google servers" in the description and the first comment. GLOBAL_RULES, R17 and `ph_competitor_negative_predicate` would all rewrite it, but brand rulebook 4.3 routes a foundation-model provider named in a comparative or adversarial context to Joe, and 4.3 itself records that the policy is not settled in writing. Flag for Joe, unresolved. Source URL: not captured for the draft (it is run data under `docs/eval-10/`); the policy is `.claude/rules/skills/brand-check/references/rulebook.md` section 4.3.
- **Which voice posts a maker comment.** A first comment goes out from a person's own maker account. Brand rulebook 3.5 has a rule for Joe's personal accounts and one for the brand account, and none for a maker comment on a launch page. R15 fixes the grammar (first person singular for a solo maker) and not the identity. Joe's call.
- **A link inside the first comment.** R20 bans a link in the name, tagline, description and topics only. The sources and the platform page allow images, videos and GIFs in a first comment and say nothing against a link there, so no rule is proposed either way and no check covers `first_comment`. Owner's call.
- **The 260-character description.** The form now allows 500. 260 is our house limit: it is what `lk_assets.pipe` line 35 asks for, what `ph_description_max_chars` blocks at, and the check description now says both numbers. Raising it changes the pipe's output contract, so it stays at 260 pending the owner.
- **A profile-aware check kind.** The four failures in 5.5 that no pattern can see (an invented name, an invented limitation, a negative sentence about a profile-listed competitor, an unsourced figure) are all the same shape: the check would have to read `APP_PROFILE` at gate time. `gates.ts` takes the draft and nothing else. Worth a decision before more soft nudges are added in their place.
- **Name length.** 40 characters is our limit, chosen to keep the homepage card intact. It is not asserted here as a Product Hunt rule.
- **Daylight saving.** The timezone table is for PST. During PDT every local time is one hour earlier.
- **Thumbnail and video skills.** `ph-thumbnail-creator` and `ph-video-demo` were USE in the review but were not in this channel's brief; they belong with the Assets stage, not with the listing draft.

## 8. Deliberately left out, and why

1. **Tagline formula 1 with a named product ("Notion for X")**, formula 6 ("X, but better"), formula 7 ("Nx faster"), and the examples table (Raycast "Supercharged productivity"). Naming another product as the reference point is comparison framing the brand rulebook (4.1) forbids, "but better" is literally "better than X", and the multiplier formulas require a benchmark the model cannot source.
2. **ph-description-writer's power-words list** (Transform, Unlock, Boost, Instant, Exclusive, Limited, Proven), every worked example ("competitors release faster", "10x", "sleep better at night"), the social-proof and testimonial slots in templates A to C, and the 4 Ps "push with urgency". All of it is the hype register or invented proof. `ph_no_ai_tells` now carries the surviving words as a check.
3. **ph-maker-comment's offer section** ("first 100 users", "lifetime access", "PH exclusive code") and the "we're the first to" and "the secret sauce" differentiator lines. Unverifiable claims and offers the model would have to invent. The "AMA!" closer is dropped as a borrowed convention, and `ph_first_comment_no_lazy_ask` now catches it.
4. **ph-safe-messaging's email, X and LinkedIn templates.** They are other channels' drafts, and they open with "Excited to share" (banned filler), carry the rocket, and lean on "Would love your support". The supporter briefing is dropped as well: our line is that nobody is briefed, people are told once.
5. **ph-ban-prevention's "safe supporter activation"** (activate in waves, use different time zones). Staggering coordination is still coordination. Kept: the six categories, the detection signals, the recovery steps.
6. **ph-launch-day-checklist's six supporter waves, hourly vote targets, "competitor activity" check, team roles, and the social progress-update template.** The targets are unsourced, the waves are coordination, the progress template invents numbers and carries the rocket. Kept: night-before checks, first ten minutes, emergency protocols.
7. **ph-comment-responder's "Great question!" openers, "Fun fact:", "Mind if I add you to our notify list for when it..." (banned verb), emoji tails, and "Impresses observers" as a reason to reply fast.** Replies are rewritten in section 4.3. The nine-minute rule became ten.
8. **ph-timing-optimizer's per-day vote counts, the line steering fast-spreading products to Wednesday, and the four-hour vote ladder.** Unsourced numbers. Kept: the reset time, the day trade-off, why the first four hours matter, the timezone table.
9. **ph-community-outreach's Reddit, Indie Hackers and Show HN templates, "Current MRR" line, karma-building plan, and "often reciprocal support".** Show HN goes to the Hacker News rulebook, Reddit to the Reddit rulebook. The MRR line invites confidential figures (rulebook 2.7). Reciprocity is a manipulation signal on Product Hunt and off-brand everywhere.
10. **ph-gallery-assets' image 2 "shocking stat", image 6 testimonials and metrics, the "PH algorithm favors video" claim, and the interactive-demo tool list.** Invented proof, an unsourced claim, and tooling choices that belong to the Assets stage.
11. **"Support our launch" and "We'd love your support" from the source's allowed list.** See R1.
12. **Any dollar figure, plan price or revenue number** from the source examples. Pricing is quoted only from the published page (rulebook 5.1); projections are confidential (2.7).
13. **The rest of ph-safe-messaging's "these are fine" column** (v4): "Thanks for your support", "Thanks for the incredible support", "Your support means a lot", "Show us some love", "#1 on Product Hunt", "Number 1 on", "Product of the Day". Each of them is a vote ask with the word taken out, and each is now in `ph_no_vote_ask`. Still allowed from that column, because they ask for attention and not for a vote: "Take a look", "Share your thoughts", "Give us feedback", "Leave a comment", "Tell us what you think". "Check it out" is allowed anywhere except as the whole ask in the first comment, where `ph_first_comment_no_lazy_ask` catches it.
14. **ph-maker-comment's greeting examples as written** (v4): "Hey PH! I'm [Name], founder of [Product]. (wave emoji)", "Hi everyone! [Name] here, the solo dev behind [Product]." The shape is kept and the exclamation marks, the invented name and "Hey PH" are not. R7 fixes the line to "Hi, I'm [Builder first name], [role] at {Product}." and `ph_first_comment_no_anonymous_opener` blocks the group openers the model reached for instead of a name.
15. **ph-comment-responder's type 8 template as written** (v4): the "Great question!" opener, "[Competitor] is solid, respect what they've built", the bullet list of differences, and "Best way to know is to try both!". The structure became R17 and hook 10: one sentence per product in the same shape, then one invitation to run both. The bullets would also fail `ph_description_clean` if they reached the description.
16. **ph-algorithm-guide's vote weighting and its myths section** (v4). Only the first-four-hour randomisation is kept, in 4.1. Vote weighting is nothing a draft can act on, and the myths section argues with the reader.
17. **The vote language outside the draft** (v4). The evaluation found "Number of upvotes and signups" as a brand angle success metric and "drives upvotes" in a target's why_fit on four apps. No Product Hunt draft field can express it and no check here sees it: the fix belongs to `lk_brand.pipe` and `lk_targets.pipe` (cluster 6). Listed so nobody looks for a rule here.
18. **Nothing from the hook library** (v4). No hook was dropped: the eight from v3 stand unchanged and four were added. Section 6.

## 9. Storage and versioning

**This document matches rulebook version 4.** `RULEBOOK_VERSION = 4` in `apps/launchkit/src/lib/rulebooks.ts`, with 12 `GLOBAL_RULES`, 20 Product Hunt rules and 12 hooks there, and 37 Product Hunt checks in `src/lib/rulebook-checks.ts`. When any of those five numbers changes, this file is out of date.

**Where the rules live at run time.** `seedRulebooksIfEmpty` (`src/data/seed.ts`) writes each default into the `platform_rules` table with `source: 'default'` and `version: RULEBOOK_VERSION`. `rulesFor` (`src/data/rules.ts`) reads the newest row for the platform by `updated_at` and hands its rules to `rulesBlock`, which builds the PLATFORM_RULES block, then the HOOK_PATTERNS block, then GLOBAL_RULES.

**How a stored row goes stale.** `isStale` is true when the row's `source` is anything other than `owner` and its `version` is below `RULEBOOK_VERSION`. `rulesFor` ignores a stale row and falls back to the code default, and `seedRulebooksIfEmpty` inserts the version 4 default above it rather than updating it, so the older row stays in the store as the record of what earlier drafts saw.

**How an owner edit survives.** A row saved from Settings carries `source: 'owner'`. `isStale` is false for it whatever its version, and the seeder skips it, so an owner's Product Hunt rules are never replaced by a newer default. One nuance: an owner edit that saved no hooks keeps the default hooks, because `rulesFor` falls back to the default `hooks` when the stored array is empty.

**What every draft records.** `rulebookMeta` returns the row's `version` and `source`, or `{ version: 4, source: 'default' }` when the fallback applies, and `api.ts runAsset` stamps `rulebook_version` and `rulebook_source` on every draft. A re-run can therefore prove which rules a given draft was written against. The runner also stamps `venue` (the selected target's name, which a `when` guard would read), `app_name` (the product's display name, which `countIn` reads), `punctuation_fixed`, `wording_fixed` and `slop_fixed`; the gate adds `warnings`, `blockers` and, when a repair pass improved the draft, `repaired`. All of them are `META_FIELDS`: a check whose field is `all` never reads them (5.1).

**Which sanitiser passes run before the gate**, in order:

1. `sanitizeDraft` (`src/domain/sanitize.ts`), in the pipe runner on every result: an em dash and a spaced en dash become a comma, an unspaced en dash inside a range ($8-$10, 2019-2024) becomes a hyphen, and stray comma sequences are tidied. The count reaches the card as `punctuation_fixed`. `ph_no_dashes` and `gateAsset`'s own dash warning are the belt behind it.
2. `sanitizeVerbs` (`api.ts draftOnce`), on launch drafts only, walking every field except `warnings`, which quote the draft's faults as written. `cleanVerbs` swaps the banned launch verb for the release verb, keeping the case of the first letter, and counts it as `wording_fixed`. Then `cleanSlop` swaps the 67 slop-lexicon terms for their plain replacements, longest term first, and counts them as `slop_fixed`. Quoted third-party text (a signal) and the observed profile are never touched by either.
3. `gateAsset`: the `ASSET_LIMITS` tagline cap of 60, the dash sweep over every string field, then all 37 checks of section 5. Each hit becomes a `warnings` line reading `field: description (evidence)`; a hard hit becomes a `blockers` entry too.
4. One repair pass, and only when there is at least one blocker: `runAsset` asks again with the blockers named (`repairHint` expands a count; a shape failure is passed through as its description line, which is why the descriptions in 5.2 and 5.3 are written to be actionable on their own), then keeps whichever of the two drafts has the smaller overage.

One consequence worth knowing: because `sanitizeVerbs` runs first, `ph_no_banned_verb_or_key_framing` can only fire on a spelling the swap table does not carry. The swap covers the verb and its three inflections, so the adjective form ending "pable" is the one that reaches the gate. The check is kept as the belt and as the record, and it is hard.
