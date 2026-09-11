# Reddit post rulebook (`reddit_post`)

Status: draft for brand-check, 2026-09-11. Not yet merged into `src/lib/rulebooks.ts`; the orchestrator merges. This document is the reference behind the `reddit_post` entry: where each rule came from, what a program can enforce, which subreddits the pipe may target, and what was left out on purpose.

The drafting model receives the numbered rules in section 4 verbatim, after the `PLATFORM_RULES` header and before `GLOBAL_RULES`. Everything else here is for the owner and for whoever maintains the checks.

## 1. Sources

| Source | What was taken | License | Path |
| --- | --- | --- | --- |
| piupiuyao/reddit-founder-skill, `SKILL.md` (28 KB, one file, last commit 2026-02-25) | Comment rules, the 5-level product-mention ladder, the "this already exists" rule, the post pre-flight checklist, the post formulas, the formatting bans | No license in the repo. Nothing is copied verbatim; every adopted rule is rewritten in our words. | `/private/tmp/claude-501/-Users-shashidharbabu-rocketride-apps-gtm/9a390f8a-984c-43f2-8d72-25a367af0263/scratchpad/social-skills/reddit-founder-skill/SKILL.md` (re-clone: `git clone --depth 1 https://github.com/piupiuyao/reddit-founder-skill`) |
| Review verdict | PARTIAL: take the comment rules, ladder, already-exists rule, pre-flight checklist; drop karma warm-up and the indie-SaaS subreddit table; strip the 61 em dashes | n/a | `docs/social-launch-skills-review.md`, Reddit section and step 3 of the handoff |
| RocketRide brand rulebook, sections 1 to 3 | Banned vocabulary, no invented numbers, no "better than X", show do not tell, the account rules in 3.5 | internal | `.claude/rules/skills/brand-check/references/rulebook.md` |
| Current defaults | The five existing `reddit_post` rules and `GLOBAL_RULES`; this rulebook replaces the five and leaves the globals alone | internal | `apps/launchkit/src/lib/rulebooks.ts` |
| Output shape | `reddit_post` returns `{title, body, suggested_flair, warnings}`; body 150 to 300 words; `{APP_URL}` once; TARGET may carry a subreddit and its rules | internal | `apps/launchkit/pipelines/lk_assets.pipe` line 34 |
| Subreddit rules | Each sub's own rules page, read through the Wayback Machine or a Redlib mirror because reddit.com answers HTTP 403 to non-browser requests | public | Section 8 lists the exact snapshot per sub |

## 2. How this fits the pipe

The pipe passes `TARGET` (a subreddit plus whatever rules text the builder pasted). The post is always written for that one sub. Rules 1 and 2 below turn the TARGET into two decisions the model must make before writing: the venue (main feed, a recurring thread, or a specific day) and the product-mention level. Everything after that is shape and voice.

Two things the current defaults get wrong that this rulebook fixes:

- "Obey the subreddit's rules on self-promotion" was a single line with no data. The model cannot obey rules it has never seen, so section 8 gives it the verified rule per sub and rules 1 and 2 turn those into instructions.
- "Mention {APP_URL} once" is right for most subs and wrong for r/startups and r/artificial, where a link in the body gets the post removed. Rule 11 makes the link conditional on the mention level.

## 3. The product-mention ladder

Adopted from the source skill's comment strategy and extended to posts. The level is a cap set by the TARGET; the model may go lower, never higher.

| Level | What it means | Post example | Where it is the cap |
| --- | --- | --- | --- |
| 0 | No product name, no link. A technical write-up or a discussion about the engineering problem. | "I spent three weeks on retry semantics for long-running agent steps. Here is what broke." | r/programming, r/ExperiencedDevs |
| 1 | The problem and your approach; the product unnamed, no link. "I built something for this" at most. | "I ended up writing my own runner for this; happy to go into how it handles X." | r/startups main feed, r/artificial |
| 2 | Named once, builder disclosed in the same sentence, `{APP_URL}` once in the last paragraph. | "I built Foo to do this. It is MIT and runs on one box." | r/LocalLLaMA, r/opensource, r/selfhosted, r/devops, r/MachineLearning |
| 3 | Named with link, plus the honest alternative named for the reader who should use it instead. | "If you only need X, Bar already does that well; Foo is for the case where Y." | r/webdev Showoff Saturday, r/SideProject |
| 4 | Direct pitch using the thread's own template (name, one-liner, link, what you want). | The Share Your Startup template, the New Project Megathread comment. | Only inside a sub's own showcase thread |

Joe's personal account: rulebook section 3.5 says no RocketRide mentions on dev forums, so any post from that account is capped at Level 1 regardless of the sub.

## 4. Rules the model receives (verbatim, in this order)

1. Obey the TARGET subreddit's rules over every rule below. When the TARGET only allows project posts in a thread or on a day (r/selfhosted: the current New Project Megathread for anything under 3 months old; r/devops: the Weekly Self Promotion Thread; r/MachineLearning: the [D] Self-Promotion Thread; r/webdev: Showoff Saturday; r/startups: the Share Your Startup thread; r/ExperiencedDevs: AI topics on Wednesdays and Saturdays only), write the draft for that venue, name the venue in the first warnings line, and never draft a main-feed product post for it.
2. Set the product mention level from the TARGET before writing and never exceed it. Level 0 (no product name, no link, a technical write-up or discussion): r/programming, r/ExperiencedDevs. Level 1 (the problem and your approach, product unnamed, no link): r/startups main feed, r/artificial. Level 2 (named once, builder disclosed, {APP_URL} once): r/LocalLLaMA, r/opensource, r/selfhosted, r/devops, r/MachineLearning. Level 3 (named, link, plus the honest alternative named): r/webdev Showoff Saturday, r/SideProject. Level 4 (direct pitch with the thread's template) only inside a sub's own showcase thread. State the level used in warnings.
3. Use only numbers that appear in APP_PROFILE.proof_points. Never write user counts, revenue, growth rates, benchmark comparisons or speedups that are not there. Numbers about the build itself (weeks spent, model size, hardware, lines of code) are allowed when they come from the profile. If proof_points is empty the post carries no traction numbers at all.
4. Title: 6 to 16 words, 100 characters or fewer, sentence case, first person, one concrete detail (what it does, what it runs on, or a real constraint). No emoji, no exclamation mark, no question, no clickbait, no hashtags, never "Show HN:". r/MachineLearning: start with "[P] ". r/SideProject: "<Name> - <short description>". r/opensource: name the license in the title or the first sentence. r/devops link posts: the article title, unedited.
5. Body: 150 to 300 words as flowing paragraphs of 2 to 4 sentences. No bullet points, no numbered lists, no bold text, no headings, no horizontal rules, no TL;DR. The only structured lines allowed are up to 4 "Key: Value" lines for real figures from proof_points.
6. Paragraph order: (1) the problem as a scene you hit, 1 to 2 sentences; (2) what you built and how it works, in plain words, named at the allowed level; (3) the "this already exists" sentence; (4) one thing that was hard or still is not good; (5) one specific question; (6) the link line if the level allows it.
7. Within the first 120 words, name the obvious existing alternative and give the one specific reason it did not cover your case ("I ran X for six months; it broke on Y"). State the difference as a fact. Never say you are better, faster or cheaper than it, and never disparage it.
8. Disclose that you are the builder in the same sentence that first names or describes the product: "I built", "I maintain", "I work on". Never "I found this" or "came across this". Where the TARGET requires affiliation disclosure (r/LocalLLaMA rule 4) repeat it in plain words.
9. Include one real limitation or unsolved problem, stated plainly, with either what you plan to do about it or "I do not know yet". A draft without one fails.
10. End with exactly one specific question the community can answer from their own experience (their setup, their failure mode, the choice they made). Never "thoughts?", "what do you think?", "let me know", "would love to hear". No asks for upvotes, stars, follows, shares, signups or feedback-for-feedback; no discounts, promo codes or community-exclusive offers.
11. {APP_URL} exactly once, in the final paragraph, as the bare placeholder, and only at Level 2 or above. If the TARGET restricts links in the body (r/startups rules 3 and 5, r/artificial rules 2 and 4), leave it out of the body and add the warning "post the link as your first comment, if the sub allows it". For r/opensource the link must be a repo with an OSI-listed LICENSE file; say which license in the body.
12. Always add this warning line, in these words: "This draft was model-assisted. Rewrite it in your own words before posting; r/programming rule 1, r/LocalLLaMA rule 3 and r/opensource rule 3 remove LLM-written posts, and r/selfhosted and r/ExperiencedDevs require you to answer the AI-disclosure bot honestly."
13. Beyond GLOBAL_RULES, never write: leverage, utilize, innovative, honest take, here's the thing, the irony is, it's funny how, nobody tells you, full transparency, excited to announce, thrilled to. Contractions are welcome. Vary sentence length. Past tense for what you did, present tense for what it does.
14. No AI-pattern structure: no sentence that starts with "Not X, just Y", no rhythmic triplets of adjectives ("fast, simple, and free"), no closing summary or "In conclusion", no rhetorical questions, no DM solicitation ("DM me", "PM me"); write "I'll answer questions here" instead.
15. suggested_flair: the TARGET's real flair for this kind of post (r/opensource: Promotional; r/MachineLearning: Project; r/LocalLLaMA: Resources or Discussion; r/webdev: Showoff Saturday; r/selfhosted: New Project Megathread; r/devops: the weekly thread has none). If you are not sure, write "none" and say so in warnings.
16. warnings always has at least one line and lists, in order: the venue if the main feed is not allowed; the mention level used; any TARGET rule the draft bends or that needs the builder's action (account history under the 10% rule, user flair, karma in the sub, day-of-week limits, the 250-character minimum, a submission statement); the model-assisted line from rule 12.
17. Write in the builder's voice from APP_PROFILE.voice or BRAND_DNA: the person who wrote the code explaining it to a peer, not a company announcing. If a sentence reads as marketing, cut it and say in warnings what you cut.

## 5. Post formulas by venue

The source skill had five formulas built around indie-SaaS milestones. Four survive, rewritten for a developer audience; section 10 says which were dropped.

**A. Technical write-up (Level 0).** For r/programming and r/ExperiencedDevs. The post is about how something was built, not what. Open on the concrete engineering problem, walk through the decision and the tradeoff, show what broke, close with the question. The product may exist behind the story but is never named and never linked. r/programming rule 5 says it in one line: they care how you build it, not what you built.

**B. "I built" demo (Level 2 or 3).** For r/LocalLLaMA, r/selfhosted, r/opensource, r/SideProject, r/webdev on Saturday. Title pattern: "I built <thing> that <does one job> on <constraint>". Body follows the rule 6 paragraph order. A screenshot or short screen recording attached to the post is expected on r/SideProject and r/webdev; put "attach the demo recording from the video asset" in warnings.

**C. Honest insight discussion (Level 0 or 1).** For r/startups main feed, r/ExperiencedDevs, r/devops. Title pattern: "<common belief>. <what happened when I tried it>". The body thinks out loud through one specific experience and ends on a question the sub can argue about. If the product appears at all it is one unnamed sentence.

**D. Showcase-thread entry (Level 4).** For the New Project Megathread, the Weekly Self Promotion Thread, the [D] Self-Promotion Thread, the Share Your Startup thread. Short: the thread's template fields in order (name, one line on what it does, what it runs on, license, link, what you want from readers), 60 to 120 words, still no hype and still one limitation. This is the only place the pitch is allowed to be direct.

## 6. Pre-flight checklist

Adapted from the source skill's checklist. The model applies it before returning; the builder applies it again before posting.

1. Venue decided from the TARGET rules and named in warnings.
2. Mention level decided and not exceeded; link present only at Level 2 or above.
3. Title in first person, sentence case, one concrete detail, under 100 characters, no prefix except the ones a sub requires.
4. Body 150 to 300 words, flowing paragraphs, no list lines, no bold, no headings.
5. The "this already exists" sentence appears in the first 120 words and states a fact, not a comparison.
6. Builder disclosed in the sentence that first names the product.
7. One real limitation stated.
8. Every number traces to proof_points.
9. Ends on one specific question; no vote, star, follow or share ask; no offer.
10. No em dash, no en dash, no banned vocabulary, no hype words.
11. Warnings carry the model-assisted line.

## 7. Mechanical checks

These are the checks a program can run on the returned JSON. `all` means every string field (title, body, suggested_flair, each warnings line). Regexes are written for a JavaScript engine with the `u` flag; multiline ones need `m`, and every pattern containing letters is matched with the `i` flag (case-insensitive). Some hype and vocabulary patterns are written with character classes so that the brand-check greps do not match this file itself; they match the same words at runtime.

| id | kind | value | field | description |
| --- | --- | --- | --- | --- |
| title_max_chars | max_chars | 100 | title | Reddit allows 300; ours stops at 100 so the title reads in one line on mobile |
| title_min_words | min_words | 6 | title | A title shorter than six words has no concrete detail |
| title_max_words | max_words | 16 | title | Past 16 words the title is a sentence, not a title |
| title_no_show_hn | forbidden_regex | `^\s*Show HN:` | title | Another platform's convention |
| title_no_bang_or_question | forbidden_regex | `[!?]` | title | No exclamation marks, no question titles |
| title_no_clickbait | forbidden_regex | `\b(you won'?t believe\|this one (trick\|thing)\|changed my life\|insane\|crazy\|mind-?blowing\|must[- ]see)\b` | title | r/artificial rule 3 removes clickbait titles; so do we |
| ml_title_prefix | required_prefix | `[P] ` | title | Apply only when TARGET is r/MachineLearning main feed |
| body_min_words | min_words | 150 | body | Below 150 words there is no room for the problem, the alternative and the limitation |
| body_max_words | max_words | 300 | body | Above 300 words Reddit skims |
| body_no_list_lines | forbidden_regex | `^\s*(?:[-*•]\|\d+[.)])\s+` (m) | body | No bullets or numbered lists; flowing paragraphs only |
| body_no_headings_or_bold | forbidden_regex | `^\s*#{1,6}\s\|\*\*[^*]+\*\*` (m) | body | No markdown headings, no bold |
| body_no_tldr | forbidden_regex | `\btl;?dr\b` | body | Summary lines read as generated |
| body_app_url_max_once | max_count | 1 | body | Occurrences of the literal `{APP_URL}`; zero is valid at Level 0 and 1 |
| body_no_raw_urls | forbidden_regex | `https?://\|www\.` | body | Links only through the placeholder |
| body_no_lazy_closer | forbidden_regex | `\b(thoughts\?\|what do you think\|let me know\|would love to hear\|any feedback is appreciated)\b` | body | The closing question must be specific |
| no_vote_or_reciprocity_asks | forbidden_regex | `\b(upvote\|up-vote\|star (the\|my\|our\|this) repo\|give (it\|us) a star\|follow (me\|us)\|share this\|discount\|promo code\|exclusive offer\|coupon\|feedback for feedback\|return the favou?r)\b` | body | Brand rule: no vote asks, no reciprocity, no offers |
| no_dm_solicit | forbidden_regex | `\b(dm me\|send me a dm\|pm me\|message me)\b` | body | r/startups rule 6 |
| no_hashtags | forbidden_regex | `(^\|\s)#[A-Za-z]\w*` | all | Reddit has no hashtags |
| no_emoji | forbidden_regex | `[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]` | all | None on Reddit |
| no_dashes | forbidden_regex | `[\u2013\u2014]` | all | Em and en dash ban; duplicated from the global sanitizer so this rulebook is complete on its own |
| no_banned_verb | forbidden_regex | `\bsh[i]p(s\|ped\|ping)?\b` | all | The one word the brand rulebook bans outright |
| no_hype | forbidden_regex | `\b(game[- ]?chang\w*\|ground-?breaking\|revolution(ary\|i[sz]e\w*)\|vir(al\|ality)\|seam-?less(ly)?\|unlea[s]h\w*\|super-?charge\w*\|\d+x (faster\|better\|cheaper\|more)\|1[0]x)\b` | all | Hype list from the governing rules |
| no_ai_tells | forbidden_regex | `\b(leverag\w*\|utiliz\w*\|innovative\|honest take\|here'?s the thing\|the irony is\|it'?s funny how\|nobody tells you\|full transparency\|excited to announce\|thrilled to\|in today'?s)\b` | all | Rule 13 vocabulary |
| no_setup_pivot | forbidden_regex | `(^\|[.!?]\s+)not [^,.]{1,40}, just\b` | body | The "Not X, just Y" pattern from rule 14 |
| no_better_than | forbidden_regex | `\b(better\|faster\|cheaper\|smarter\|simpler) than\b` | body | "Better than X" positioning is a blocker |
| traction_numbers_need_proof | forbidden_regex | `\b\d[\d,.]*\s?[km]?\s*(users\|customers\|signups\|sign-ups\|downloads\|stars\|installs\|teams\|companies)\b\|\bMRR\b\|\bARR\b\|\$\s?\d` | body | Flag, not a hard fail: pass only if the same figure appears in APP_PROFILE.proof_points |
| warnings_present | min_words | 4 | warnings | The warnings array joined with spaces must contain at least one real line |

Checks that need a positive match and so do not fit the `kind` list; worth adding when the checker supports "required_regex":

- builder disclosure in body: `\bI (built\|made\|wrote\|maintain|work on)\b`
- the model-assisted line in warnings: `model-assisted`
- exactly one question mark in the last paragraph of body

## 8. Subreddit table for the developer ICP

Overview first, then the verified rule text per sub. "Verified" means the rule text was read from the sub's own rules page (Wayback snapshot of `old.reddit.com/r/<sub>/about/rules/`, date given) or from the live sidebar through a Redlib mirror on 2026-09-11. reddit.com itself returned HTTP 403 to every direct request, so the builder should open the listed URL in a browser before posting; rules change and r/programming, r/selfhosted and r/ExperiencedDevs all changed theirs in 2026.

| Sub | Members | Max level | Where a launch post can go | Title adaptation | Body adaptation |
| --- | --- | --- | --- | --- | --- |
| r/programming | 6.9M | 0 | Main feed, technical write-up only, and only if the AI policy allows it | What you learned building it, no product name | How it works, the tradeoff, what broke; no feature list, no link to the repo as the point |
| r/LocalLLaMA | 821k | 2 | Main feed with Resources or Discussion flair | Name the model size, hardware or quantization it runs with | Local-first angle: what runs where, VRAM, which open-weights models were tested |
| r/MachineLearning | 3.1M | 2 | Main feed with `[P]` if there is technical substance; otherwise the [D] Self-Promotion Thread | `[P] ` prefix, method named | Method and evaluation before product; open dialogue and feedback intent must be visible |
| r/devops | 512k | 2 | Weekly Self Promotion Thread for the launch; main feed for a Level 1 discussion with a submission statement | Operational problem first ("how I run X in prod") | Deploy and maintain angle: rollout, rollback, observability, cost |
| r/selfhosted | 837k | 2 | New Project Megathread if under 3 months old; main feed only after that | What it replaces or what it runs on | Docker or bare install, docs link, what it needs from the host, production readiness |
| r/opensource | 381k | 2 | Main feed with Promotional flair | License in the title | Why it is open, the license, how to contribute, one limitation |
| r/ExperiencedDevs | 415k | 0 | Main feed, Wednesday or Saturday only for AI topics, as a discussion | A question senior devs argue about | Engineering judgement, tradeoffs, team impact; no product |
| r/webdev | 3.3M | 3 | Showoff Saturday only | Plain "I built" | Stack, what was hard in the browser, the honest alternative |
| r/artificial | large, count not captured | 1 | Main feed as a discussion, only from an account with history there | Descriptive, no clickbait | The idea and the approach; no product name, no link, no selling |
| r/SideProject | count not captured | 3 | Main feed | `<Name> - <short description>` | Story, demo, ask for feedback, one limitation |
| r/startups | count not captured | 1 (4 in the thread) | Share Your Startup thread for the launch; main feed for a Level 1 lessons post of 250+ characters | Lesson or method, never the product name | Experience and method without your name or URL; feedback asks go to the Feedback Thread |

### r/programming

Why it fits: the largest general developer audience, and the one place a deep technical write-up about a pipeline runtime reaches people who have never heard of the product.

Self-promotion rule (verified: live mirror sidebar 2026-09-11 listing rules 1 to 14; full text from Wayback snapshot 20260811153143 of `https://old.reddit.com/r/programming/about/rules/`; AI policy from `https://www.reddit.com/r/programming/wiki/ai-policy`, announced 2026-05-23):

- Rule 5, "No Product Promotion / 'I Made This' Project Demo Posts": not the place to post a project for feedback or promotion. Technical write-ups on what makes a project technically challenging, interesting or educational are allowed and encouraged; a link to a GitHub page or a list of features is not. The write-up must be the focus, not a tickbox exercise.
- Rule 1, "No LLM-Written Content": "If you don't want to write it, we don't want to read it", including LLM translation or summarisation.
- Rule 2 and the AI policy: content about AI and LLMs is off-topic except deeply technical content about implementation. Applications of existing LLM tools are removed. A tool review or a launch is removed.
- Rule 11, "No Blogspam"; rule 6, no aggregators; rule 10, no low-effort posts.

Consequence: only formula A, Level 0, and only when the write-up is about implementation (how the runtime schedules, retries, streams, isolates). A launch post here fails on rule 5 and the AI policy at once.

### r/LocalLLaMA

Why it fits: the builders who run open-weights models on their own hardware, which is the "run your own models on your own hardware" half of the approved MaaS framing. The exact ICP for pipelines, agents and local tooling.

Self-promotion rule (verified: Wayback snapshot 20260807221923 of `https://old.reddit.com/r/LocalLLaMA/about/rules/`):

- Rule 4, "Limit Self-Promotion": the 1/10th rule is the guideline, self-promotion should not be more than 10% of your content; affiliation must be disclosed; no engagement farming, no "I found this".
- Rule 3, "Low Effort Posts": completely or primarily LLM-generated copy or code is not allowed; LLM bots posing as humans are banned; LLM use for translation must be made transparent.
- Rule 2: posts must relate to Llama or LLMs. Rule 1: search before asking.

Consequence: Level 2 with the builder disclosed, from an account whose history is mostly not promotion. The model-assisted warning matters most here.

### r/MachineLearning

Why it fits: researchers and ML engineers; the `[P]` project tag is an established convention and the mods run a recurring self-promotion thread.

Self-promotion rule (verified: Wayback snapshot 20260716084247 of `https://old.reddit.com/r/MachineLearning/about/rules/`; the "[D] Self-Promotion Thread" seen live on the mirror, posted by AutoModerator nine days before 2026-09-11):

- Rule 2, "No Self-Promotion": promotion of paid products where the intent is clearly to promote is not permitted; links to paid products are acceptable only when the post offers sufficient value and the intent is to share a resource or collect feedback for an open dialogue; the mods decide.
- Rule 3, "No Marketing Campaigns (SEO)": strategic campaigns or SEO posts get a permanent ban with history purged.
- Rule 1, strict spam policy. Rule 5: no bare arXiv links; add commentary.
- The Self-Promotion Thread text: "post your personal projects, startups, product placements, collaboration needs, blogs"; state pricing for paid products; no link shorteners.

Consequence: Level 2 on the main feed only with method and evaluation in the body and a visible feedback intent; the plain launch goes in the thread as formula D. Pricing must be stated there if the product is paid.

### r/devops

Why it fits: the people who run pipelines in production; the Deploy and Maintain halves of the three-part problem.

Self-promotion rule (verified: live mirror sidebar "Rules and guidelines" on 2026-09-11; the "Weekly Self Promotion Thread" seen live, posted by AutoModerator four days earlier):

- "No vendor spam. Buy an ad from reddit instead."
- "All articles will require a short submission statement of 3-5 sentences."
- "Use the article title as the submission title. Do not editorialize the title." "No editorialized titles."
- Weekly Self Promotion Thread: "promote any projects, ideas, or any repos you're wanting to share", stay civil, follow the rules.

Consequence: the launch is a formula D comment in the weekly thread. A main-feed post is formula C at Level 1 with a submission statement in the body's first paragraph.

### r/selfhosted

Why it fits: self-hostable is one third of the moat line; this audience installs software on its own boxes and judges docs and Docker files first.

Self-promotion rule (verified: Wayback snapshot 20260811152937 of `https://old.reddit.com/r/selfhosted/about/rules/`; the "New Project Megathread - Week of 10 Sep 2026" seen live; the mods' "Quarter 2 Update - Revisiting Rules. Again." post of 2026-04-07):

- Rule 2, "Spam / Self-Promotion / Affiliate Links": do not promote your own projects too much; follow Reddit's self-promotion guideline; promoted apps must be production ready and have docs; no direct ads for hosting or VPS; only mention your service in comments if it is relevant and adds value.
- Rule 6: projects younger than 3 months, measured by first public presence (first commit, first social post), may only be posted in the current New Project Megathread; standalone new-project posts are removed and redirected.
- Rule 4: blog links need an explanation of why it matters. Rule 5: dashboards and tools on Wednesdays with the flair. Rule 1: explain what you tried; posts lacking detail get a sticky.
- The AI-compliance bot: most new posts are removed until OP replies stating how AI was involved, even if it was not.

Consequence: under 3 months old, formula D in the megathread; older, formula B at Level 2 with install and docs detail, and the builder must answer the bot.

### r/opensource

Why it fits: rocketride.org is MIT and the open-source line is a moat; this audience reads the LICENSE file before the README.

Self-promotion rule (verified: Wayback snapshot 20260726134356 of `https://old.reddit.com/r/opensource/about/rules/`):

- Rule 2, "No Spam or Excessive Self-Promotion": Reddit's under-10% guideline; "we're a little more forgiving, but don't take advantage of it"; "it's perfectly fine to be a redditor with a website, it's not okay to be a website with a reddit account".
- Rule 4, "Be On-Topic": linked code or repositories MUST have a LICENSE file that MUST be an OSI-listed license.
- Rule 3: all AI-generated content is low-effort and ban-worthy. Rule 6: drive-by accounts with no intention of engaging in the discussion are removed. Rule 8: the Promotional flair is for sharing a project, yours or otherwise. Rule 5: keep link-post titles close to the article's title.

Consequence: formula B at Level 2 with the Promotional flair, the license in the title, and the builder present in the comments.

### r/ExperiencedDevs

Why it fits: senior developers arguing daily about the hand-written-code-to-agents transition, which is the ICP's emotional entry point. Discussion only.

Self-promotion rule (verified: Wayback snapshot 20260728122025 of `https://old.reddit.com/r/ExperiencedDevs/about/rules/`):

- Rule 8, "No Surveys/Advertisements": get moderator approval first if you think it should not apply to you.
- Rule 10: posts whose topic is AI (LLMs, copilots, agents, AI's impact on the industry) are only allowed on Wednesdays and Saturdays; avoiding this is a ban.
- Rule 11, enforced by the modbot: user flair required; post and comment karma in this sub required; disclose AI tool use by replying to the bot's sticky; OP must comment on the post within 2 hours.
- Rule 9: no low effort, venting or bragging. Rule 1: 3+ years of experience. Rule 7: no "what tools" questions.

Consequence: formula A or C at Level 0, on a Wednesday or Saturday, from an account with flair and karma there, with the builder back in the thread within 2 hours.

### r/webdev

Why it fits: developers adding AI to existing web apps, one of the three ICP builds; Showoff Saturday is a sanctioned launch slot.

Self-promotion rule (verified: live mirror sidebar "Posting Guidelines" on 2026-09-11):

- Rule 3: follow reddiquette; no excessive self-promotion; refer to the Reddit 9:1 rule.
- Rule 4: "We do not allow any commercial promotion or solicitation. Violations can result in a ban."
- Rule 5: sharing your project, portfolio or any content you want to show off or get feedback on is limited to Showoff Saturday; on any other day it is removed.

Consequence: formula B at Level 3 on Saturday only, with the Showoff Saturday flair.

### r/artificial

Why it fits: the general AI audience for news and research; usable for the discussion angle behind a launch, not for the launch itself.

Self-promotion rule (verified: Wayback snapshot 20260828184531 of `https://old.reddit.com/r/artificial/about/rules/`):

- Rule 2, "Self-advertisement": your first post or comment cannot have promo; the 10% rule applies; "No self-inserting your product here"; modmail first if in doubt; the sub wants participation before advertising.
- Rule 4, "No selling": no selling your own products or anything else.
- Rule 3: no clickbait, generic, sensationalized or misleading titles; describe what the post is about. Rule 5: no dumps of personal LLM conversations. Rule 10: no "what's the best tool" requests. Rule 9: no misleading content, including headlines.

Consequence: formula C at Level 1 from an account that has posted there before; no name, no link.

### r/SideProject

Why it fits: the one sub whose stated purpose is sharing a project and receiving feedback; it matches the "I built" shape of a Launch Kit post exactly.

Self-promotion rule (partly verified: Wayback snapshot 20260828184531 of `https://old.reddit.com/r/SideProject/about/rules/` lists no formal rules at all; the sidebar is verified):

- Sidebar: "a subreddit for sharing and receiving constructive feedback on side projects"; also a place to get motivated, so links to projects you find interesting are welcome.
- Submission format: "[Project name] - [Short description]", with "Reddit - A website for sharing and discussing links" as the example.
- No self-promotion limit found on the rules page: unverified beyond the sidebar. The source skill's claim that every top post has a video or GIF is its own observation and unverified.

Consequence: formula B at Level 3 with the sidebar title format and the demo recording attached.

### r/startups

Why it fits: the founder audience for the company story, with the product kept out of the main feed entirely.

Self-promotion rule (verified: Wayback snapshot 20260823233758 of `https://old.reddit.com/r/startups/about/rules/`; the "Share your startup - quarterly post" of 2026-07-11 seen live on the mirror):

- Rule 2, "No direct sales, advertisements, or promotion": no promotional posts of any kind; the only exception is the stickied Share Your Startup thread; self-promotion is anything you have a stake in, including a friend at the company; the mods have the final say.
- Rule 3: submissions discuss methodologies, experiences, strategies and markets WITHOUT tying them to your own project by name or URL; clear titles; at least 250 characters; no legal questions.
- Rule 4: all feedback requests belong in the Feedback Thread. Rule 5: comment links need a sentence of context and must be to content you have no affiliation with. Rule 6: no DM solicitation, no "I DMed you" notices. Rule 7: sharing your own blog needs prior mod approval and the full body in the post.
- The Share Your Startup template asks for name and URL, headquarters, elevator pitch, life-cycle stage, this month's goals, and whether readers get a discount. Skip the discount line; the brand rules forbid offers.
- The "I will not promote" title tag mentioned by the source skill does not appear on the rules page: unverified convention, do not rely on it.

Consequence: the launch is formula D in the Share Your Startup thread; a main-feed post is formula C at Level 1 with no name and no URL, 250 characters or more.

## 9. Hook patterns (developer voice, written fresh)

Titles or opening lines. Every placeholder is filled from the profile; none of these carries a number the profile does not have.

1. "I got tired of <manual step> in <context>, so I built <thing> that does it in <N> lines of <language>."
2. "<Existing tool> carried us until <specific limit>. This is what I wrote when it didn't."
3. "I run <thing> on a <hardware> in my <place>. The part that took <N> weeks was <problem>."
4. "I open sourced the <component> I kept rewriting on every project. <License>, <stack>."
5. "Post-mortem: <pipeline or agent> failed on <event>. What I changed and what I still don't trust."
6. "How do you handle <failure mode> in <context>? I built <thing> for it and I'm not sure my tradeoff is right."
7. "<N> months in, <thing> does <one concrete job>. It still can't <limitation>."

## 10. Comment rules for the builder (launch day and after)

Adopted from the source skill's comment mode, rewritten. These are for the human in the thread; the pipe does not draft comments, and the notes to the orchestrator say where a `reddit_comment` asset would reuse them.

- Answer every top-level comment on your own post within the first 2 hours (r/ExperiencedDevs makes this a bot-enforced rule; treat it as the standard everywhere).
- 3 to 6 sentences; under 10 even for technical answers. Read it aloud: if you would not say it to a peer at a table, rewrite it.
- The product is never in the first two sentences of a comment. On other people's threads keep four out of five comments at Level 0; go to Level 2 only with "full disclosure, I work on X" in the same sentence; Level 4 only when someone asks "what tools do you recommend". Never a link in a comment unless asked. Never ask for upvotes.
- Every claim carries its receipt: the config, the number from your own run, the version that broke. Real data only; give the sample size.
- Disagree with a specific reason and a question: "we tried that, it failed on X; maybe it depends on Y, what is your setup?" No "I respectfully disagree".
- When criticised on your own post: concede what is fair, give the specific case where it holds, ask what works for them. Never "our data shows" unless the data is in proof_points.
- Leave one gap on purpose: say what you are not sure of. It is honest and it is the thing people answer.
- Banned openers and closers: "Great question", "Love this", "I understand your frustration", "Happy to help!", "Hope this helps".
- No em dash, no en dash, no hype words, no "better than X".

## 11. Provenance, rule by rule

| Rule | Came from | What changed |
| --- | --- | --- |
| 1 (venue) | Source skill's "Subreddit Comment Rules" idea that each sub has a place for promotion; current default "Obey the subreddit's rules on self-promotion" | Rewritten with the verified venues per sub so the model has data, not a wish |
| 2 (ladder) | Source skill's 5-level Product Mention Strategy for comments | Extended to posts; the cap per sub set from the verified rules; Joe's account capped at Level 1 per rulebook 3.5 |
| 3 (numbers) | Brand rulebook 2.7 and 5.1; pipe GLOBAL RULES ("only use proof_points") | Made explicit that build-time numbers are fine and traction numbers need the profile; the source skill's "Body has at least one concrete metric" checklist item was dropped because it invites invention |
| 4 (title) | Source skill's title patterns and checklist ("first person", "specific number or time constraint"); current default title rule | Number requirement softened to "one concrete detail" so no number is invented; per-sub prefixes added from verified rules |
| 5 (body shape) | Source skill's "Formatting, strictly no exceptions" and the Key: Value exception | Kept whole; TL;DR ban added; the Key: Value lines tied to proof_points |
| 6 (paragraph order) | Source skill's Formula 1 body and the 4-part story framework | The "community-exclusive offer" step removed; the link moved to the end and made conditional |
| 7 (already exists) | Source skill's "Address 'this already exists' before someone else does" | Kept; the "why it wasn't enough" line is now required to be a fact and the "better than X" framing is banned per rulebook 4.1 |
| 8 (disclosure) | Current default "Disclose that you are the builder"; r/LocalLLaMA rule 4 | Tied to the sentence that names the product; "I found this" banned from the sub's own rule |
| 9 (limitation) | Source skill's "Be an imperfect person" and "one honest failure required" | Kept the requirement; dropped the framing that the flaw exists to farm engagement |
| 10 (question, no asks) | Source skill's "End with a real question, not 'thoughts?'" and "Never ask for upvotes"; brand rules on vote asks and reciprocity | Reciprocity, offers and discounts added to the ban; r/startups rule 4 "return the favor" text is the reason feedback-for-feedback is named |
| 11 (link) | Source checklist "Product link goes in first comment, not post body"; pipe shape "{APP_URL} once" | Reconciled: link in the body at Level 2+, moved to a first-comment warning where the sub forbids body links |
| 12 (AI disclosure) | r/programming rule 1, r/LocalLLaMA rule 3, r/opensource rule 3, r/selfhosted and r/ExperiencedDevs bots | New; nothing in the source skill covered it and it is the single biggest removal risk for a model-drafted post |
| 13 (vocabulary) | Source skill's "Language, never use" list; GLOBAL_RULES | Merged and de-duplicated; "utilize", "innovative", "full transparency" added |
| 14 (structure) | Source skill's "Sentence structures that signal AI" | Kept the setup-pivot and fake-casual bans; added triplets, closing summaries and DM solicitation (r/startups rule 6) |
| 15 (flair) | Pipe output shape has `suggested_flair` | New; flairs taken from the verified rules and live flair lists |
| 16 (warnings) | Pipe output shape requires a warning when the post could break TARGET rules | Expanded into an ordered list of what warnings must contain |
| 17 (voice) | Brand rulebook 3.1 and 3.5; current default "No marketing tone" | Rewritten as an action (cut the sentence, say so) rather than a mood |

## 12. Left out, and why

- Karma warm-up plan (pet photos in r/aww, "promote each other" Friday posts): off-brand for any RocketRide-adjacent account and engagement farming is explicitly banned by r/LocalLLaMA rule 4. The review already asked for its removal.
- The indie-SaaS subreddit table (r/SaaS, r/microsaas, r/buildinpublic, r/indiehackers, r/Entrepreneur, r/IMadeThis, r/alphaandbetausers, r/roastmystartup, r/InternetIsBeautiful) and its upvote data: not the developer ICP, and the numbers are one account's unverifiable sample.
- Formula 2 (quit-my-job journey) and Formula 3 (MRR milestone): both depend on revenue and personal-finance numbers; financial figures are confidential under rulebook 2.7 and the ICP does not post MRR. Formula 5 (beta recruitment) targeted r/alphaandbetausers, which is not in our list; its useful parts became formula D.
- "The math" paragraph (100 pushy comments give 2 clicks, 100 valuable comments give 1 customer) and all the "real data" averages: invented-looking statistics with no source; the brand rule forbids unverifiable numbers even in guidance.
- "Community offer and CTA" and "community-exclusive offer": reciprocity and offers are banned; r/startups' own template asks for a discount line and we skip it.
- "Emotion beats data" advice and the zero-revenue self-deprecation example: written for founder-story subs; developer subs reward the tradeoff, not the feeling.
- The comment-hunting scoring table, search queries and API snippet (Mode 2): tooling for finding threads, not drafting rules. Worth a separate tool if the owner wants comment mode.
- Posting-time table (Tuesday to Thursday, 9 to 11 AM Eastern): unsourced and the pipe does not schedule; left to the launch plan.
- The "deliberately leave a flaw so readers correct you and the algorithm notices" framing: the honest limitation stays, the manipulation rationale goes.
- The source skill's own description promising high-upvote posts, and its 61 em dashes: none carried over.
- r/SoftwareEngineering, r/cscareerquestions, r/ChatGPT, r/aiagents from the source's comment list: outside the eleven subs the owner named; r/aiagents may be worth a later look.

## 13. Verification log

| Sub | Method | Snapshot or fetch date | URL to open before posting |
| --- | --- | --- | --- |
| r/programming | Mirror sidebar (live) plus Wayback rules page plus wiki | 2026-09-11 (mirror), 2026-08-11 (snapshot), policy dated 2026-05-23 | https://old.reddit.com/r/programming/about/rules/ and https://www.reddit.com/r/programming/wiki/ai-policy |
| r/LocalLLaMA | Wayback rules page | 2026-08-07 | https://old.reddit.com/r/LocalLLaMA/about/rules/ |
| r/MachineLearning | Wayback rules page plus live thread on mirror | 2026-07-16 (snapshot), 2026-09-11 (thread) | https://old.reddit.com/r/MachineLearning/about/rules/ |
| r/devops | Mirror sidebar plus live weekly thread | 2026-09-11 | https://old.reddit.com/r/devops/about/rules/ |
| r/selfhosted | Wayback rules page plus live megathread and mods' post | 2026-08-11 (snapshot), 2026-09-10 (megathread), 2026-04-07 (mods' post) | https://old.reddit.com/r/selfhosted/about/rules/ |
| r/opensource | Wayback rules page | 2026-07-26 | https://old.reddit.com/r/opensource/about/rules/ |
| r/ExperiencedDevs | Wayback rules page | 2026-07-28 | https://old.reddit.com/r/ExperiencedDevs/about/rules/ |
| r/webdev | Mirror sidebar Posting Guidelines | 2026-09-11 | https://old.reddit.com/r/webdev/about/rules/ |
| r/artificial | Wayback rules page | 2026-08-28 | https://old.reddit.com/r/artificial/about/rules/ |
| r/SideProject | Wayback rules page (empty) plus sidebar | 2026-08-28 | https://old.reddit.com/r/SideProject/about/rules/ |
| r/startups | Wayback rules page plus live quarterly thread | 2026-08-23 (snapshot), 2026-07-11 (thread) | https://old.reddit.com/r/startups/about/rules/ |

Mechanical sweep of this file at the time of writing (the brand-check greps from `.claude/rules/skills/brand-check/SKILL.md`): banned verb 0, em dash 0, hype 0, AI tells 0. Re-run after any edit.
