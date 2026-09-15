# Social launch skills review

## Status, 2026-09-12: the rulebook is built and at version 4

The triage below is now implemented. `RULEBOOK_VERSION = 4` in `apps/launchkit/src/lib/rulebooks.ts`; the live rules and hook patterns per platform are there, the machine checks are in `apps/launchkit/src/lib/rulebook-checks.ts`, and `apps/launchkit/rulebooks/<platform>.md` documents every rule's source. Version 3 (2026-09-11) distilled the sources; version 4 (2026-09-12) reconciled every USE and PARTIAL verdict below against the code, filled the gaps and repaired the checks the ten-app evaluation exposed.

| Platform | Reconciled items | Gaps found and closed | Code items now sourced in the .md | Live rules | Hook patterns | Machine checks |
| --- | --- | --- | --- | --- | --- | --- |
| X | 44 | 19 | 4 | 20 | 11 | 33 |
| LinkedIn | 58 | 12 | 4 | 24 | 10 | 33 |
| Reddit | 39 | 6 | 5 | 22 | 9 | 37 |
| Product Hunt | 76 | 36 | 2 | 20 | 12 | 37 |
| Show HN | 60 | 14 | 6 | 21 | 10 | 36 |
| Newsletter | 36 | 9 | 2 | 17 | 11 | 31 |
| Total | 313 | 96 | 23 | 124 | 63 | 207 |

**In code now.** LinkedIn: li-post, li-human (the slop lexicon, 67 swap entries in `apps/launchkit/src/lib/slop-lexicon.ts` applied by `cleanSlop` before the gate, the rest as the `slop_lexicon` warning check), li-comment, li-reply and li-plan (as warnings guidance only, never the post body), li-repurpose, li-carousel slide rules, li-audit (one metric line). Reddit: the comment rules, the five-level product-mention ladder, the "this already exists" rule and the pre-flight checklist; the subreddit table is rebuilt for the developer ICP (eleven subs with verified rule snapshots, seeded into `venues.seed.ts`). X: the four thread frameworks and the checklist only, with our own hook library. Product Hunt: ph-safe-messaging (the full forbidden-phrase table, every phrase now a check), ph-ban-prevention, ph-maker-comment, ph-tagline-writer (formulas only), ph-description-writer (structure only), ph-gallery-assets, ph-launch-day-checklist, ph-comment-responder (its competitor-comparison template is the wording model for a Product Hunt first comment), ph-timing-optimizer, ph-community-outreach, ph-newsletter-pitch and ph-email-strategy (schedule and subject avoid-list). Hacker News: the Show HN drafting rules written from the HN guidelines, dang's presenting-your-work comment and ph-community-outreach; the vm0 skill stays a monitoring pointer and contributes no drafting rule.

**Deferred, with the reason.** li-profile, li-dm and li-inbox (not launch drafting; SKIP stands). li-audit beyond the one metric line, ph-launch-strategy, ph-hunter-finder, ph-profile-optimizer, ph-supporter-network, ph-real-time-monitor, ph-post-launch-followup, ph-content-recycling, ph-relaunch-strategy and ph-analytics-setup (planning, hunters, post-launch and analytics: operator work, not a draft field, so they belong to the Plan and Targets stages). ph-pricing-psychology, ph-conversion-tracking, ph-seo-benefits and ph-golden-kitty (SKIP stands: fake scarcity, revenue worksheets, competitor-comparison SEO and vote mobilisation). ph-thumbnail-creator and ph-video-demo are USE but belong to the Assets stage, not to a post rulebook. Instagram has no reviewed source, so there is no Instagram rulebook.

**Tested, 2026-09-14.** All six posts were re-drafted for the ten evaluation apps from their saved stores, sixty drafts, so the profile, the chosen angle and the pricing are identical to the first run and only the rules differ. Every acceptance criterion passed: zero hard-rule blockers, zero dashes, zero occurrences of the banned launch verb, zero invented person names against three in the first run, every draft stamped with the rulebook version it saw, and every platform above its baseline (X 3.6 to 4.0, LinkedIn 3.3 to 3.6, Reddit 2.7 to 3.2, Product Hunt 3.0 to 3.5, Show HN 2.8 to 3.0, newsletter 3.5 to 3.8; overall 3.03 to 3.52). The gate caught and repaired twenty-three hard failures that the first run approved into the plan. The brand check passed with flags on all three lenses, no blockers. Full results, what still fails and the ranked next fixes: `docs/EVAL-10-SOCIAL-V4.md`.

**Open for the owner.** Instagram: review `nicojunk/claude-ig` or `lucas-araujo-dev/ig-creator-kit`, or drop the channel. Joe's account switch: rulebook section 3.5 varies the RocketRide-mention rule by account and the drafting model cannot know which account posts; the Reddit rulebook caps the mention level when TONE says it is Joe's personal account, and every other platform needs the same signal passed in. Product Hunt rejects tracked links as the product URL, which collides with the per-venue tracked links the Plan stage issues.

Reviewed 2026-09-10 for the social launches rulebook. Every SKILL.md in each source was read in full. Verdicts are judged against the RocketRide brand rulebook (banned "ship", no em-dashes, no hype, show don't tell, no "better than X", developer-first ICP).

Verdict key: USE = adopt as-is or with light edits. PARTIAL = take the framework, strip or rewrite the flagged parts. SKIP = not useful for launch drafting.

## Handoff for the next agent

**Goal of this work.** Shashidhar is assembling a "social launches rulebook" for RocketRide: a set of skills that draft launch content for LinkedIn, Reddit, X, Product Hunt, Hacker News and (if a source is found) Instagram. This file is the triage of six candidate skill sources. The next step is to build the rulebook from the USE and PARTIAL rows below.

**Governing rules.** The brand rulebook is at `.claude/rules/skills/brand-check/references/rulebook.md` and the review gate is `.claude/rules/skills/brand-check/SKILL.md`. Anything adopted into the social rulebook must respect: no "ship/shipping", no em-dashes, no "universal API key", no hype words, no "better than X" competitor framing, no unverified capability claims, no financial figures, Joe's account rules in section 3.5 (no RocketRide mentions on dev forums, moderate on his social, full marketing voice on the brand account). Run the brand-check skill over every template before it enters the rulebook.

**Reproducing the clones.** The sources were cloned into a session scratchpad that will not survive. Re-clone with:

```bash
mkdir -p /tmp/social-skills && cd /tmp/social-skills
git clone --depth 1 https://github.com/Jakeschincariol/linkedin-agent-skill
git clone --depth 1 https://github.com/piupiuyao/reddit-founder-skill
git clone --depth 1 https://github.com/jamesgray007/hoai-course
git clone --depth 1 https://github.com/yoanbernabeu/producthunt-skills
git clone --depth 1 https://github.com/vm0-ai/vm0-skills
```

Paths to the skill files inside those clones:

- LinkedIn: `linkedin-agent-skill/skills/li-*/SKILL.md` (11 folders), plus `skills/li-post/hooks.json`, `skills/li-human/humanize.py`, `skills/li-human/detect.py`, `skills/li-human/slop.json`, `templates/voice.md`
- Reddit: `reddit-founder-skill/SKILL.md` (single 28 KB file)
- X: `hoai-course/.claude/skills/writing-x-posts/SKILL.md` plus `references/hooks.md` and `references/examples.md`; sibling `writing-linkedin-posts/SKILL.md`
- Product Hunt: `producthunt-skills/skills/<category>/<skill>/SKILL.md` (31 skills across strategy, content, marketing, launch-day, compliance, hunters, pricing, analytics, post-launch, awards); also `README.md`, `AGENTS.md`
- Hacker News: `vm0-skills/hackernews/SKILL.md`

**Instagram source is unresolved.** The requested `npx skillfish add petrogurcak/skills instagram-content` fails: the GitHub repo does not exist and skillfish reports "Repository not found". Not reviewed. Two candidates surfaced from a GitHub search, unreviewed: `nicojunk/claude-ig` and `lucas-araujo-dev/ig-creator-kit`. Ask Shashidhar whether to review one of these or drop Instagram.

**Mechanical check used.** Per skill folder, the counts below came from these greps and should be re-run on anything adopted:

```bash
grep -rinE '\bship(s|ped|ping)?\b' <dir> | wc -l
grep -rn '—' <dir> | wc -l
grep -rinE 'game.?chang|groundbreaking|revolutionar|viral' <dir> | wc -l
```

Results at review time: LinkedIn pack ship=4 emdash=6 hype=3; Reddit ship=1 emdash=61 hype=4; X posts ship=0 emdash=3 hype=2; hoai LinkedIn ship=0 emdash=14 hype=4; HN 0/0/0; Product Hunt "ship" in 5 skills and em-dashes in 18 of 31 files.

**Next steps, in order.**

1. Decide the rulebook shape with Shashidhar: one skill per channel under `.claude/rules/skills/social-launch/<channel>/`, or one skill with per-channel reference files. Recommendation: one skill per channel, each with a `references/` folder, so brand-check can sweep them independently.
2. LinkedIn: copy li-post, li-human, li-comment, li-reply, li-plan, li-repurpose. Rewrite "ship" in the instructions. Add "ship", "shipping", "universal API key" to `slop.json`. Point voice.md at Joe's voice (rulebook section 3.3 has three on-brand samples).
3. Reddit: extract the comment rules, the 5-level product-mention ladder, the "this already exists" rule and the pre-flight checklist. Replace the subreddit table with developer subs (r/programming, r/LocalLLaMA, r/MachineLearning, r/devops, r/selfhosted, r/opensource, r/ExperiencedDevs). Remove the karma warm-up section. Strip all em-dashes.
4. X: keep the four thread frameworks and the quick checklist. Do not copy hooks.md or examples.md. Write a developer hook library from Joe's real posts.
5. Product Hunt: copy the 7 core skills listed at the end of the Product Hunt section, then the 9 supporting USE skills. Strip em-dashes, rocket emoji, "ship", "Nx faster" from every template.
6. Hacker News: keep the vm0 skill as a monitoring tool under tooling. Write Show HN drafting rules from scratch, seeded from ph-community-outreach's Show HN section and the HN guidelines (plain title, no marketing language, founder answers every comment, no vote asks).
7. Run brand-check on the whole tree and record the verdict.

## Source status

| Channel | Source | Status | Last commit | License |
| --- | --- | --- | --- | --- |
| LinkedIn | github.com/Jakeschincariol/linkedin-agent-skill | 11 skills, cloned | 2026-09-07 | MIT |
| Reddit | github.com/piupiuyao/reddit-founder-skill | 1 skill, cloned | 2026-02-25 | none |
| Instagram | petrogurcak/skills instagram-content | NOT FOUND. Repo does not exist on GitHub; skillfish returns "Repository not found". | n/a | n/a |
| X | jamesgray007/hoai-course writing-x-posts | 1 skill (+ writing-linkedin-posts in same repo), cloned | 2025-12-18 | none |
| Product Hunt | github.com/yoanbernabeu/producthunt-skills | 35 skills, cloned | 2026-01-30 | MIT |
| Hacker News | vm0-ai/vm0-skills hackernews | 1 skill, cloned | 2026-09-11 | none in repo |

## LinkedIn: Jakeschincariol/linkedin-agent-skill (11 skills)

Overall: the strongest source in the set. Voice-file driven, never auto-posts, enforces no fabricated numbers, and the humanizer removes em-dashes and slop words by script. Conflicts: the SKILL.md text itself uses "ship/shipping" four times (li-post: "which you would ship", "Shipping #17") and a handful of em-dashes in prose. Those are in the instructions, not the output, but they must be rewritten before the text goes into our rulebook.

| Skill | What it is | Verdict | Why |
| --- | --- | --- | --- |
| li-post | One idea into a post: 3 hook options from 21 formulas, one draft, humanized, never published. | USE | Core drafting skill. Voice file, "numbers over adjectives", no links in body, no fabricated metrics all match our rules. Rewrite the four "ship" mentions. |
| li-human | Python humanizer plus a 5-check AI-detection scorer; strips em-dashes, slop lexicon, invisible characters. | USE | Directly enforces our em-dash and AI-tell bans and it runs locally with no dependencies. Add "ship" and "universal API key" to slop.json. |
| li-comment | 9 comment types for other people's posts; bans "Great post" openers; 2 to 4 sentences. | USE | Good for founder-account engagement around a launch. Community-first tone matches. |
| li-reply | Triages comments under your own post (lead / substance / peer / support / noise) and drafts replies in that order. | USE | Launch-day reply handling. Useful for the first-hour window. |
| li-plan | Weekly plan: 4 posts across proof / opinion / teach / story / offer, plus 10-person engagement list. | USE | Gives the launch week a cadence. The "offer" slot maps to brand-account posts. |
| li-carousel | Document post copy, 8 to 12 slides, HTML to PDF build. | PARTIAL | Useful format for feature breakdowns. Slide rules are fine; PDF build is optional tooling. |
| li-repurpose | Turns one long asset (video, blog, transcript) into 4 to 6 standalone posts. | USE | Fits our launch film and blog outputs well. Extract, do not summarise, is the right rule. |
| li-audit | Post-mortem ranked by engagement rate and reach multiple, not impressions. | PARTIAL | Post-launch only. Good metrics, but needs analytics exports we may not collect yet. |
| li-profile | Scores a profile out of 100 against a 12-part rubric and rewrites headline and about. | SKIP for rulebook | One-time profile work, not launch drafting. Keep as a separate tool for Joe's profile. |
| li-dm | 200-char invite note, first DM, two follow-ups. | SKIP for rulebook | Outreach, not launch content. Its rules are sound but out of scope. |
| li-inbox | Triages DMs into lead / recruiter / peer / ask / spam. | SKIP | Inbox management, not launch content. |

## Reddit: piupiuyao/reddit-founder-skill (1 skill)

| Skill | What it is | Verdict | Why |
| --- | --- | --- | --- |
| reddit-founder-growth | Post + comment playbook: karma warm-up plan, subreddit table with real upvote data, 5 post formulas, 5-level product-mention ladder, bad vs good comment examples. | PARTIAL | Substance is excellent and aligns with our rules (no em-dashes, no buzzwords, product link in first comment, "product is never the hero"). Problems: the file itself has 61 em-dashes, the subreddit list is indie-SaaS not developer subs (no r/programming, r/LocalLLaMA, r/MachineLearning, r/devops), and the karma warm-up advice (cat photos in r/aww) is off-brand for Joe's account. Adopt the comment-mode rules and the "this already exists" rule; rebuild the subreddit table for our ICP. |

Note: rulebook section 3.5 already says Joe's dev-forum posts carry no RocketRide mentions, which maps to this skill's Level 0 and Level 1 only.

## X: jamesgray007/hoai-course (2 relevant skills)

| Skill | What it is | Verdict | Why |
| --- | --- | --- | --- |
| writing-x-posts | Generic X guide: single post vs thread, 4 thread frameworks, hook types, posting times, plus references/hooks.md and examples.md. | PARTIAL | Structure (one idea per tweet, hook first, no links in main tweet, 1 to 2 hashtags) is fine and short. But it is creator-economy flavoured: hooks.md examples are "I made more in 30 days than a year at my job" style, "craft viral tweets" is the stated goal, and the close pushes "follow, repost, reply" CTAs. Keep the frameworks, drop the hook library, write our own developer hooks. |
| writing-linkedin-posts | Top Voice style LinkedIn guide: hooks table, vulnerability test, formats, anti-patterns. | SKIP | Superseded by the Jakeschincariol pack, which is more specific and has tooling. Its anti-pattern list ("I'm excited to announce", engagement pods) is a useful cross-check only. |

## Hacker News: vm0-ai/vm0-skills hackernews (1 skill)

| Skill | What it is | Verdict | Why |
| --- | --- | --- | --- |
| hackernews | curl and jq recipes for the public HN Firebase API: top / new / show / ask stories, item and user lookups. | SKIP for drafting, keep as a tool | Contains zero guidance on writing a Show HN post, title rules, or comment etiquette. It is a read-only API cheat sheet. Useful for monitoring our own Show HN thread and for research, so it earns a place in tooling, not in the rulebook. We need to write the Show HN drafting rules ourselves (HN guidelines: no marketing language, plain titles, founder answers every comment). |

## Product Hunt: yoanbernabeu/producthunt-skills (31 skills)

Overall: MIT, well structured, pure markdown (no scripts, APIs or env vars anywhere). Generic SaaS-launch advice, content unchanged since 2025-01, benchmarks and hunter names unsourced. Worth mining because it has Developer Tool sub-sections in gallery, video and thumbnail skills. Violations: "ship" in 5 skills, em-dashes in 18 of 31 files (mostly inside paste-ready templates), "game-changing" and "10x faster" formulas, rocket emoji everywhere, and three skills that describe reciprocity or FOMO tactics Product Hunt treats as manipulation.

| Skill | Category | What it is | Verdict | Why |
| --- | --- | --- | --- | --- |
| ph-launch-strategy | strategy | Objective framework (visibility / acquisition / badge / feedback) plus a 4 to 6 week prep timeline. | USE | Clean planning skeleton, no copy templates to conflict. |
| ph-competitor-analysis | strategy | Template for analysing prior launches in your category with day-of-week benchmarks. | PARTIAL | "10x better story" prompt and unverified benchmarks cut against no-hype and no-better-than-X. |
| ph-timing-optimizer | strategy | Day-by-day traffic vs competition, timezone table, 12:01 AM PT rule. | USE | Factual operational guidance. |
| ph-tagline-writer | content | Seven tagline formulas, 60-char limit, red-flag word list. | PARTIAL | Red-flag list matches ours; strip the "But Better", "Nx faster" formulas and a "shipped products" example. |
| ph-description-writer | content | AIDA / PAS / FAB / BAB formulas, three templates, power words. | PARTIAL | Structure fine; examples say "competitors ship faster", "Ship with confidence", "Transform". Rewrite examples. |
| ph-maker-comment | content | Eight-part first-comment structure with two worked examples. | USE | Best content skill in the set; bans unverifiable claims and upvote asks. Strip em-dashes. |
| ph-thumbnail-creator | content | 240x240 spec, GIF rules, five thumbnail types. | USE | Purely technical. |
| ph-gallery-assets | content | Six-image story sequence with a Developer Tool variant (terminal, before/after code). | USE | Maps directly to a RocketRide launch; "real product, not mockups" is show-don't-tell. |
| ph-video-demo | content | 30 to 60s three-act script, hook formulas, Developer Tool flow. | USE | Skip the "Bold Claim" hook, keep the rest. |
| ph-email-strategy | marketing | T-14 / T-7 / T-1 sequence, six timezone waves, tiered templates. | PARTIAL | Schedule is sound; copy is emoji-heavy and em-dashed. |
| ph-social-media-launch | marketing | Seven-post X schedule, three LinkedIn posts, supporter share templates. | PARTIAL | Cadence fine; copy is rocket-emoji hype. Structure only. |
| ph-community-outreach | marketing | Subreddit list, Indie Hackers and Show HN templates, be-a-member-first rules. | USE | Show HN guidance matches our dev-forum tone rule. Drop the MRR line. |
| ph-supporter-network | marketing | Four supporter tiers, briefing doc, staggered activation table. | PARTIAL | Tier 4 "launch swap partners" and coordinated upvote waves edge toward manipulation. |
| ph-launch-day-checklist | launch-day | Night-before checks, hour-by-hour PT schedule, emergency protocols. | USE | Operational and complete. |
| ph-comment-responder | launch-day | Ten comment types with responses, 9-minute rule. | USE | Competitor-comparison template matches show-don't-tell exactly. |
| ph-real-time-monitor | launch-day | Hourly log sheet, velocity formula, benchmark tables. | PARTIAL | Useful sheet; benchmarks unsourced, competitor "threat level" off-scope. |
| ph-ban-prevention | compliance | Six prohibited behaviours, detection signals, what to do if flagged. | USE | Reduces launch risk, no conflicts. |
| ph-algorithm-guide | compliance | Vote weighting, engagement depth, first-4-hour randomisation, myths. | USE | Grounded, cites PH sources. |
| ph-safe-messaging | compliance | Forbidden-to-allowed phrase table, compliant templates. | USE | The single most valuable asset in the repo. Clean em-dashes and emoji. |
| ph-hunter-finder | hunters | Self-hunt vs hunter decision, named hunter list, outreach template. | PARTIAL | Decision framework good; hunter list stale and unverifiable. |
| ph-profile-optimizer | hunters | Profile checklist, 4 to 8 week engagement plan. | USE | Strip "Ship a product" and "Building the future of" examples. |
| ph-launch-offers | pricing | Six offer types plus the not-tied-to-voting rule. | PARTIAL | Compliance rule matters; lifetime deals do not fit our published tiers. |
| ph-pricing-psychology | pricing | Anchoring, scarcity, decoy, FOMO templates. | SKIP | Fake countdowns and guilt copy; contradicts genuine-not-hype and PH's own rules. |
| ph-analytics-setup | analytics | GA4 / Plausible / Mixpanel snippets, UTM scheme. | PARTIAL | UTM convention useful; code belongs to engineering, not a content rulebook. |
| ph-conversion-tracking | analytics | Funnel stages, tracking snippets, ROI / CAC formulas. | SKIP | Off-scope, and revenue worksheets invite confidential numbers. |
| ph-post-launch-followup | post-launch | Day 1 to week 4 timeline, thank-you and review templates, retrospective. | USE | Practical, low-risk; voice cleanup needed. |
| ph-content-recycling | post-launch | Maps launch assets to website, blog, README, social, email, PR. | PARTIAL | Asset-to-channel matrix handy; PR and sales-deck sections off-scope. |
| ph-relaunch-strategy | post-launch | 6-month relaunch rule, eligibility, v2 maker comment. | PARTIAL | Useful later; contains "[game-changing feature]" formula. |
| ph-seo-benefits | post-launch | Backlink, badge embed, "[Product] alternatives" content ideas. | SKIP | SEO tactics and "vs Competitor" content brush against competitor policy. |
| ph-newsletter-pitch | awards | PH newsletter types incl. Developer Tools edition, pitch email. | USE | Short factual pitch; verify the editorial address first. |
| ph-golden-kitty | awards | Award categories, nomination timeline, vote-mobilisation templates. | SKIP | Vote-begging templates, "continue shipping", and irrelevant until a year after launch. |

Recommended core PH set: ph-safe-messaging, ph-ban-prevention, ph-maker-comment, ph-tagline-writer (formulas only), ph-gallery-assets, ph-launch-day-checklist, ph-comment-responder. Supporting: ph-timing-optimizer, ph-community-outreach.

## Recommendation for the rulebook

1. LinkedIn: adopt li-post, li-human, li-comment, li-reply, li-plan, li-repurpose. Rewrite "ship" in the instructions and add "ship" and "universal API key" to slop.json.
2. Reddit: take the comment rules, product-mention ladder and post pre-flight checklist. Rebuild the subreddit table for developer subs. Strip 61 em-dashes.
3. X: take the four thread frameworks and the checklist only. Write our own hook library.
4. Product Hunt: the 7 core skills above, every template passed through brand-check.
5. Hacker News: keep the vm0 skill as a monitoring tool. Write our own Show HN drafting rules, seeded from ph-community-outreach's Show HN section.
6. Instagram: no source. Candidates found on GitHub if we want one: nicojunk/claude-ig, lucas-araujo-dev/ig-creator-kit. Not reviewed.
7. Every adopted template goes through the existing brand-check skill before it enters the rulebook.
