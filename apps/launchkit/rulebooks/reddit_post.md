# Reddit post rulebook (`reddit_post`)

Status: in code at rulebook version 4, 2026-09-12. `RULEBOOK_VERSION = 4` in `src/lib/rulebooks.ts`, the live `reddit_post` entry there holds 22 rules and 9 hook patterns, and `src/lib/rulebook-checks.ts` holds 37 machine checks for this platform. This document is the reference behind that entry: where each rule came from, what a program can enforce, which subreddits the pipe may target, and what was left out on purpose. Version 3 (2026-09-11) distilled the sources; version 4 (2026-09-12) reconciled all 39 items against the code, closed six gaps, brought five code items into this document for the first time, and repaired the checks the ten-app evaluation exposed.

The drafting model receives the numbered rules of section 4 verbatim, after the `PLATFORM_RULES` header, then the hook patterns of section 9 under a `HOOK_PATTERNS` header, then `GLOBAL_RULES` (12 lines). Everything else here is for the owner and for whoever maintains the checks.

## 1. Sources used

Every source the live code draws on, with the file path or URL and what was taken.

| Source | What was taken | License | Path or URL |
| --- | --- | --- | --- |
| piupiuyao/reddit-founder-skill, `SKILL.md` (28 KB, one file, last commit 2026-02-25) | Comment rules, the 5-level product-mention ladder, the "this already exists" rule, the post pre-flight checklist, the post formulas, the formatting bans, and the line "If the subreddit is not listed: use universal rules and Level 0 or Level 1 only", which became rule 2's default for an unlisted sub | No license in the repo. Nothing is copied verbatim; every adopted rule is rewritten in our words. | Re-clone at `/private/tmp/claude-501/-Users-shashidharbabu-rocketride-apps-gtm/9a390f8a-984c-43f2-8d72-25a367af0263/scratchpad/social-skills-v4/reddit-founder-skill/SKILL.md` (`git clone --depth 1 https://github.com/piupiuyao/reddit-founder-skill`) |
| Review verdict | PARTIAL: take the comment rules, ladder, already-exists rule, pre-flight checklist; drop karma warm-up and the indie-SaaS subreddit table; strip the 61 em dashes the source file carried. The review's status table now records this platform at 39 reconciled items, 6 gaps closed, 5 code items newly sourced, 22 rules, 9 hooks and 37 checks | n/a | `docs/social-launch-skills-review.md`, the status table, the Reddit section and step 3 of the handoff |
| RocketRide brand rulebook | Banned vocabulary and the em and en dash ban (1.1), the MaaS framing (1.2), the AI writing tells (1.3), no invented numbers and the confidentiality rules (2.7, 5.1), the account rules (3.5, behind rule 19), never "better than X" (4.1, behind rule 7 and the `no_better_than` check), and the unsettled foundation-model-provider policy (4.3, behind section 15) | internal | `.claude/rules/skills/brand-check/references/rulebook.md` |
| `GLOBAL_RULES`, 12 lines | The dash ban, the AI-filler list, sentence case, one concrete detail and no invented metrics, the builder's voice, the emoji cap, the banned launch verb, and lines 9 to 12: never invent a person; never invent an origin story, a previous tool, the moment that made you build it or a limitation; a competitor named only as a neutral fact with no negative word attached; a thin profile stays general. Lines 9 to 12 were added on 2026-09-11 for version 3 from the ten-app evaluation's clusters 3, 6 and 16, and rule 7 here was rewritten so it no longer collides with line 10 | internal | `apps/launchkit/src/lib/rulebooks.ts` |
| The live `reddit_post` entry | The 22 rules of section 4 and the 9 hooks of section 9, quoted as the model receives them | internal | `apps/launchkit/src/lib/rulebooks.ts` |
| The machine checks | The 37 checks of section 7: id, kind, value, field, flags, hardness and venue guard | internal | `apps/launchkit/src/lib/rulebook-checks.ts` |
| The gate | How a check runs: the per-check `hard` flag, the `when` guard, the `required_regex` kind, `max_count` counting through `countIn`, `META_FIELDS`, and the rule that a pattern JavaScript cannot compile is skipped rather than fatal | internal | `apps/launchkit/src/domain/gates.ts` (`runRulebookCheckHits`, `gateAsset`) |
| The sanitisers | The three passes that run before the gate: the dash replacement, the banned-verb swap, and the 67 slop swaps, with their counts on the draft card (section 14) | internal | `apps/launchkit/src/domain/sanitize.ts`, `apps/launchkit/src/lib/slop-lexicon.ts` |
| li-human slop lexicon | The 67 swap entries in `slop-lexicon.ts` that `cleanSlop` applies to every field except warnings before the gate runs; the entries with no safe drop-in replacement were left out (section 12) | MIT (Jake Schincariol) | `Jakeschincariol/linkedin-agent-skill`, `skills/li-human/slop.json`; re-clone at `.../scratchpad/social-skills-v4/linkedin-agent-skill/skills/li-human/slop.json` |
| Storage and versioning | How a stored rulebook row goes stale, how an owner edit survives, and the version and source stamped on every draft | internal | `apps/launchkit/src/data/rules.ts`, `apps/launchkit/src/data/seed.ts` |
| The runner | The venue and app_name stamping a venue-scoped check and the mention-ladder count depend on, and the one repair pass a blocker triggers | internal | `apps/launchkit/src/data/api.ts` (`runAsset`) |
| Ten-app evaluation | Clusters 3, 6, 9, 12, 15, 16 and 20 behind the six changed rules, the eleven added checks and the three changed check values; the per-app drafts are the evidence quoted in sections 11 and 15 | internal | `docs/EVAL-10-APPS.md`, `docs/eval-10/` (per-app stores and `judged-batch-*.json`) |
| Output shape | `reddit_post` returns `{title, body, suggested_flair, warnings}`; body 150 to 300 words; `{APP_URL}` once; TARGET may carry a subreddit and its rules | internal | `apps/launchkit/pipelines/lk_assets.pipe` line 34 |
| Subreddit rules | Each sub's own rules page, read through the Wayback Machine or a Redlib mirror because reddit.com answers HTTP 403 to non-browser requests | public | Section 8 lists the exact snapshot per sub; section 13 is the verification log |
| Seeded venues | The eleven developer subreddit rows, each with its verified rules snapshot and that snapshot's source | internal | `apps/launchkit/src/data/venues.seed.ts` |
| RocketRide, this task | Rules 19 and 20, hooks 7 and 8, the section 5 formulas as rewritten for a developer audience, and every judgement in sections 12 and 15 | internal | This document |

## 2. How this fits the pipe

The pipe passes `TARGET` (a subreddit plus whatever rules text the builder pasted). The post is always written for that one sub. Rules 1 and 2 turn the TARGET into two decisions the model must make before writing: the venue (main feed, a recurring thread, or a specific day) and the product-mention level. Everything after that is shape and voice.

What the runner does around the draft, all of it new since this document was first written:

- When the caller passes no target for a `reddit_post`, `runAsset` takes the first selected subreddit target by rank, so the draft is written for the sub the builder actually picked. Before that fix, Social ran before Targets and seven of ten evaluated apps were drafted for r/SideProject while the plan used another sub.
- Before the gate runs, `runAsset` stamps two fields on the draft: `venue` (the target's name, in the seed's form, for example `r/SideProject`) and `app_name` (the product's display name). The two venue-scoped checks read `venue`; the mention-ladder count reads `app_name`. Both are in the gate's `META_FIELDS`, so a check whose field is `all` never sweeps them.
- `gateAsset` returns two lists: `warnings`, which the card shows, and `blockers`, the subset a builder cannot post over. A blocker blocks approval and triggers one repair pass that names the cut to make; the draft with the smaller overage wins, and the kept draft records `repaired`.
- Every draft carries `rulebook_version` and `rulebook_source` (section 14).

Three things the pre-version-4 defaults got wrong that this rulebook fixes:

- "Obey the subreddit's rules on self-promotion" was a single line with no data. The model cannot obey rules it has never seen, so section 8 gives it the verified rule per sub and rules 1 and 2 turn those into instructions.
- "Mention {APP_URL} once" is right for most subs and wrong for r/startups and r/artificial, where a link in the body gets the post removed. Rule 11 makes the link conditional on the mention level.
- The default venue was undocumented. Rule 18 now says when r/SideProject is the default, at which level, with which title format, and that it never overrides a sub the builder selected.

## 3. The product-mention ladder

Adopted from the source skill's comment strategy and extended to posts. The level is a cap set by the TARGET; the model may go lower, never higher.

| Level | What it means | Post example | Where it is the cap |
| --- | --- | --- | --- |
| 0 | No product name, no link. A technical write-up or a discussion about the engineering problem. | "I spent three weeks on retry semantics for long-running agent steps. Here is what broke." | r/programming, r/ExperiencedDevs |
| 1 | The problem and your approach; the product unnamed, no link. "I built something for this" at most. | "I ended up writing my own runner for this; happy to go into how it handles X." | r/startups main feed, r/artificial, r/vscode, and every sub whose rules are not yet verified |
| 2 | Named once, builder disclosed in the same sentence, `{APP_URL}` once in the last paragraph. | "I built Foo to do this. It is MIT and runs on one box." | r/LocalLLaMA, r/opensource, r/selfhosted, r/devops, r/MachineLearning, r/commandline |
| 3 | Named with link, plus the honest alternative named for the reader who should use it instead. | "If you only need X, Bar already does that well; Foo is for the case where Y." | r/webdev Showoff Saturday, r/SideProject |
| 4 | Direct pitch using the thread's own template (name, one-liner, link, what you want). | The Share Your Startup template, the New Project Megathread comment. | Only inside a sub's own showcase thread |

"Named once" means the sentence that discloses you built it. The `body_product_name_max_count` check counts the stamped `app_name` in the body and blocks at three or more; the cap in the check is 2, so one repeat inside a long body passes and a third does not.

Joe's personal account: rulebook section 3.5 says no RocketRide mentions on dev forums, so any post from that account is capped at Level 1 regardless of the sub. Rule 19 carries that cap to the model. It can only fire when the builder says so in TONE or BRAND_DNA, because the pipe has no posting-account field (section 15, item 1).

When Targets has selected no subreddit at all, rule 18 sets the default: r/SideProject at Level 2, one below the ladder's Level 3, because no builder confirmed the venue.

## 4. Rules the model receives (verbatim, in this order)

These are the 22 entries of the live `rules` array for `reddit_post`, in the order the model receives them. Rules 19 to 22 are new in version 4; rules 2, 7, 8, 9, 13 and 18 carry new wording, and the wording below is the new wording.

1. Obey the TARGET subreddit's rules over every rule below. When the TARGET only allows project posts in a thread or on a day (r/selfhosted: the current New Project Megathread for anything under 3 months old; r/devops: the Weekly Self Promotion Thread; r/MachineLearning: the [D] Self-Promotion Thread; r/webdev: Showoff Saturday; r/startups: the Share Your Startup thread; r/ExperiencedDevs: AI topics on Wednesdays and Saturdays only), write the draft for that venue, name the venue in the first warnings line, and never draft a main-feed product post for it.

   *Source: the source skill's idea that each sub has one place where promotion is allowed, filled in with the verified venues in section 8 (r/selfhosted rule 6, the r/devops Weekly Self Promotion Thread, the r/MachineLearning [D] Self-Promotion Thread, r/webdev rule 5, the r/startups Share Your Startup thread, r/ExperiencedDevs rule 10). Unchanged in version 4; the project-age sentence the audit proposed is still open (section 15, item 5).*

2. Set the product mention level from the TARGET before writing and never exceed it. Level 0 (no product name, no link, a technical write-up or discussion): r/programming, r/ExperiencedDevs. Level 1 (the problem and your approach, product unnamed, no link): r/startups main feed, r/artificial, r/vscode, and every sub not listed here until its rules are verified and added. Level 2 (named once, builder disclosed, {APP_URL} once): r/LocalLLaMA, r/opensource, r/selfhosted, r/devops, r/MachineLearning, r/commandline. Level 3 (named, link, plus the honest alternative named): r/webdev Showoff Saturday, r/SideProject. Level 4 (direct pitch with the thread's template) only inside a sub's own showcase thread. 'Named once' means the sentence that discloses you built it; the machine check blocks a body that names the product three or more times. State the level used in warnings.

   *Source: the source skill's five-level product-mention ladder, written for comments and extended here to posts; the Level 1 default for an unlisted sub is the skill's own line "If the subreddit is not listed: use universal rules and Level 0 or Level 1 only"; r/commandline and r/vscode from their own pages (section 8); the three-mention cap from the ten-app evaluation, where dub named the product three times at "named once". Changed in version 4: r/vscode and r/commandline placed, the unlisted-sub default written down, and "named once" defined so a check can count it.*

3. Use only numbers that appear in APP_PROFILE.proof_points. Never write user counts, revenue, growth rates, benchmark comparisons or speedups that are not there. Numbers about the build itself (weeks spent, model size, hardware, lines of code) are allowed when they come from the profile. If proof_points is empty the post carries no traction numbers at all.

   *Source: brand rulebook 2.7 and 5.1; the pipe's own global rule that only proof_points may be used. Unchanged in version 4.*

4. Title: 6 to 16 words, 100 characters or fewer, sentence case, first person, one concrete detail (what it does, what it runs on, or a real constraint). No emoji, no exclamation mark, no question, no clickbait, no hashtags, never "Show HN:". r/MachineLearning: start with "[P] ". r/SideProject: "<Name> - <short description>". r/opensource: name the license in the title or the first sentence. r/devops link posts: the article title, unedited.

   *Source: the source skill's title patterns and pre-flight checklist, with the number requirement softened to one concrete detail so nothing is invented; the per-sub prefixes from the verified rules (r/MachineLearning's [P] convention, the r/SideProject sidebar format, r/opensource rule 4, the r/devops "do not editorialize the title" line). Unchanged in version 4.*

5. Body: 150 to 300 words as flowing paragraphs of 2 to 4 sentences. No bullet points, no numbered lists, no bold text, no headings, no horizontal rules, no TL;DR. The only structured lines allowed are up to 4 "Key: Value" lines for real figures from proof_points.

   *Source: the source skill's "Formatting, strictly no exceptions" section, including its Key: Value exception, tied here to proof_points. Unchanged in version 4.*

6. Paragraph order: (1) the problem as a scene you hit, 1 to 2 sentences; (2) what you built and how it works, in plain words, named at the allowed level; (3) the "this already exists" sentence; (4) one thing that was hard or still is not good; (5) one specific question; (6) the link line if the level allows it.

   *Source: the source skill's formula 1 body and its four-part story framework, with the community-offer step removed and the link moved to the end. Unchanged in version 4.*

7. Within the first 120 words, name the obvious existing alternative and state, in the present tense, the one thing it does or does not do that left your case uncovered ('Devpost collects submissions; it has no scoring step'). Take that fact from APP_PROFILE (icp.pain, proof_points, the public description of the alternative), never from a history you invent: never 'X worked fine until', 'X carried us until', 'I ran X for a while', 'the final push', 'that was the moment'. If APP_PROFILE records that the builder used the alternative, quote the profile's own words and nothing more. State the difference as a fact. Never say you are better, faster, cheaper, smaller or lighter than it, and never attach a negative word to its name.

   *Source: the source skill's "Address 'this already exists' before someone else does", rewritten against GLOBAL_RULES lines 10 and 11 and brand rulebook 4.1; the ten-app evaluation, cluster 3, where six of ten Reddit drafts invented a prior-tool history. Changed in version 4: a present-tense fact about the alternative replaces the old "I ran X for six months" example, which told the model to write a history it did not have, and the template idioms are named so the model cannot reach for them.*

8. Disclose that you are the builder in the same sentence that first names or describes the product. Write 'I built' or 'I made' only when APP_PROFILE shows one builder; for a team, a company, or a product older than a year write 'we built', 'I work on', 'I maintain' or 'I'm one of the maintainers of', and keep the same person (I or we) that the other posts in this run use. Never 'I found this' or 'came across this'. Where the TARGET requires affiliation disclosure (r/LocalLLaMA rule 4) repeat it in plain words.

   *Source: the earlier default "Disclose that you are the builder" plus r/LocalLLaMA rule 4; the ten-app evaluation (cal-com, plausible, formbricks, documenso), where a solo build was claimed for a company product and the person flipped between I and we inside one run. Changed in version 4: the choice between I and we is now tied to what APP_PROFILE shows, and the run keeps one person.*

9. Include one real limitation or unsolved problem, stated plainly: the honest gap APP_PROFILE records (an early stage, a missing platform, a feature not there yet), or the placeholder 'Limitation: [builder to add one]' when it records none. Follow it with 'I do not know yet' or with the profile's own roadmap line; never with a plan the profile does not state ('I'm working on', 'on the roadmap', 'coming soon'). A read failure (a 404, an unreachable page, a timeout) is Launch Kit's own scrape artifact, never a limitation of the product. Open the sentence with the fact, not with 'The honest limitation is'. A draft without a limitation fails.

   *Source: the source skill's "one honest failure required", rewritten against GLOBAL_RULES line 10; the ten-app evaluation, cluster 3, where three drafts invented a roadmap and one presented a 404 as a product gap. Changed in version 4: the gap comes from the profile or from the placeholder, the follow-up may not be an invented plan, a read failure is never a limitation, and the sentence may not open with the template phrase.*

10. End with exactly one specific question the community can answer from their own experience (their setup, their failure mode, the choice they made). Never "thoughts?", "what do you think?", "let me know", "would love to hear". No asks for upvotes, stars, follows, shares, signups or feedback-for-feedback; no discounts, promo codes or community-exclusive offers.

   *Source: the source skill's "End with a real question, not 'thoughts?'" and "Never ask for upvotes"; the brand rules on vote asks and reciprocity; r/startups rule 4, whose own "return the favour" language is why feedback-for-feedback is named. Unchanged in version 4.*

11. {APP_URL} exactly once, in the final paragraph, as the bare placeholder, and only at Level 2 or above. If the TARGET restricts links in the body (r/startups rules 3 and 5, r/artificial rules 2 and 4), leave it out of the body and add the warning "post the link as your first comment, if the sub allows it". For r/opensource the link must be a repo with an OSI-listed LICENSE file; say which license in the body.

   *Source: the source skill's checklist item "product link goes in first comment, not post body", reconciled with the pipe's own "{APP_URL} once"; r/startups rules 3 and 5, r/artificial rules 2 and 4, r/opensource rule 4. Unchanged in version 4.*

12. Always add this warning line, in these words: "This draft was model-assisted. Rewrite it in your own words before posting; r/programming rule 1, r/LocalLLaMA rule 3 and r/opensource rule 3 remove LLM-written posts, and r/selfhosted and r/ExperiencedDevs require you to answer the AI-disclosure bot honestly."

   *Source: r/programming rule 1, r/LocalLLaMA rule 3, r/opensource rule 3, and the AI-disclosure bots on r/selfhosted and r/ExperiencedDevs. Unchanged in version 4. Nothing in the source skill covered it, and no check enforces it yet (section 15, item 6).*

13. Beyond GLOBAL_RULES, never write: leverage, utilize, innovative, honest take, here's the thing, the irony is, it's funny how, nobody tells you, full transparency, excited to announce, thrilled to, the honest limitation, the honest gap, genuinely, that part I'm proud of. Contractions are welcome. Vary sentence length. Past tense for what you did, present tense for what it does.

   *Source: the source skill's "Language, never use" list merged with GLOBAL_RULES and de-duplicated; the four template phrases come from the evaluation's own Reddit drafts. Changed in version 4: "the honest limitation", "the honest gap", "genuinely" and "that part I'm proud of" were added after every eval draft opened its limitation or closed its question with one of them.*

14. No AI-pattern structure: no sentence that starts with "Not X, just Y", no rhythmic triplets of adjectives ("fast, simple, and free"), no closing summary or "In conclusion", no rhetorical questions, no DM solicitation ("DM me", "PM me"); write "I'll answer questions here" instead.

   *Source: the source skill's "Sentence structures that signal AI"; r/startups rule 6 for the DM line. Unchanged in version 4.*

15. suggested_flair: the TARGET's real flair for this kind of post (r/opensource: Promotional; r/MachineLearning: Project; r/LocalLLaMA: Resources or Discussion; r/webdev: Showoff Saturday; r/selfhosted: New Project Megathread; r/devops: the weekly thread has none). If you are not sure, write "none" and say so in warnings.

   *Source: the pipe's output shape, which carries suggested_flair, plus the flair lists read per sub (section 8). Unchanged in version 4.*

16. warnings always has at least one line and lists, in order: the venue if the main feed is not allowed; the mention level used; any TARGET rule the draft bends or that needs the builder's action (account history under the 10% rule, user flair, karma in the sub, day-of-week limits, the 250-character minimum, a submission statement); the model-assisted line from rule 12.

   *Source: the pipe's requirement that warnings carry anything that could break the TARGET's rules, expanded into an ordered list. Unchanged in version 4.*

17. Write in the builder's voice from APP_PROFILE.voice or BRAND_DNA: the person who wrote the code explaining it to a peer, not a company announcing. If a sentence reads as marketing, cut it and say in warnings what you cut.

   *Source: brand rulebook 3.1 and 3.5, with the earlier default "no marketing tone" rewritten as an action the model can take. Unchanged in version 4.*

18. When no TARGET subreddit is given and Targets has selected none, write for r/SideProject at mention level 2 (the ladder allows 3 there; 2 is the default because no builder confirmed the venue), use the '<Name> - <short description>' title, say so in the first warnings line, and keep every rule above. Never default to r/SideProject when Targets holds a selected subreddit.

   *Source: the ten-app evaluation, cluster 12 (Social ran before Targets, and seven apps were drafted for r/SideProject while the plan used another sub); api.ts runAsset now passes the first selected subreddit target, so this rule fires only when Targets has selected none. In code since version 3 and undocumented until now; reworded in version 4 to add the Targets condition, the title format and the reason Level 2 sits one below the ladder's Level 3.*

19. When TONE or BRAND_DNA says the post goes out from Joe's personal account, cap the mention level at 1 whatever the sub allows: no product name, no link, and write in warnings that the cap came from the account, not the sub.

   *Source: brand rulebook 3.5, which allows no RocketRide mention from Joe's personal account on dev forums, and section 3 of this document, which capped that account at Level 1. New in version 4. The pipe has no posting-account field, so the cap fires only when the builder writes it in TONE or BRAND_DNA (section 15, item 1).*

20. A showcase-thread entry (the venues in rule 1) follows the thread's own template fields in order: name, one line on what it does, what it runs on, license, {APP_URL}, what you want from readers. It stays between 150 and 200 words so the body floor holds, states the price if the product is paid (the r/MachineLearning thread asks for it), and still carries one limitation and no hype.

   *Source: RocketRide, this task; formula D in section 5; the r/MachineLearning [D] Self-Promotion Thread text, which asks for the price of a paid product. New in version 4. The word band is 150 to 200 rather than the source skill's 60 to 120 so that the body floor in section 7 holds without a repair pass.*

21. r/commandline: only a CLI or TUI, older than 30 days by first commit, at Level 2 with the Command Line Interface or Terminal User Interface flair. Title as '<name>: <what it does in the terminal>'. In the body list the similar and alternative tools and the one way yours differs (their rule 7), and if any of the code was model-written add the line 'This software's code is partially AI-generated' (their rule 5). A tool that talks to an LLM is off-topic there (their rule 6): write in warnings 'r/commandline removes generative-AI projects; pick another sub' and draft nothing else for it.

   *Source: r/commandline rules 4, 5, 6 and 7 (Wayback snapshot 20260811152913 of `https://old.reddit.com/r/commandline/about/rules/`) and the sub's own title convention seen on the live mirror on 2026-09-11. New in version 4.*

22. r/vscode: its rules page could not be read (2026-09-11), so treat it as an unlisted sub: Level 1, suggested_flair 'none', and tell the builder in warnings to read https://www.reddit.com/r/vscode/about/rules/ before posting. A theme goes only in the Weekly theme sharing thread; a new theme post on the main feed is removed.

   *Source: r/vscode, whose rules page could not be read on 2026-09-11 (section 13); only the mirror sidebar and the AutoModerator weekly theme thread were read. New in version 4.*

## 5. Post formulas by venue

The source skill had five formulas built around indie-SaaS milestones. Four survive, rewritten for a developer audience; section 12 says which were dropped.

**A. Technical write-up (Level 0).** For r/programming and r/ExperiencedDevs. The post is about how something was built, not what. Open on the concrete engineering problem, walk through the decision and the tradeoff, show what broke, close with the question. The product may exist behind the story but is never named and never linked. r/programming rule 5 says it in one line: they care how you build it, not what you built.

**B. "I built" demo (Level 2 or 3).** For r/LocalLLaMA, r/selfhosted, r/opensource, r/SideProject, r/commandline, r/webdev on Saturday. Title pattern: "I built <thing> that <does one job> on <constraint>", except on r/commandline, where the sub's own shape is "<name>: <what it does in the terminal>". Body follows the rule 6 paragraph order. A screenshot or short screen recording attached to the post is expected on r/SideProject and r/webdev; put "attach the demo recording from the video asset" in warnings. On r/commandline the body also carries the similar-and-alternative-tools paragraph and, where any of the code was model-written, the partial-AI note; a tool that talks to a model is off-topic there and rule 21 turns the draft into a warning instead.

**C. Honest insight discussion (Level 0 or 1).** For r/startups main feed, r/ExperiencedDevs, r/devops, r/artificial, and r/vscode until its rules are verified. Title pattern: "<common belief>. <what happened when I tried it>". The body thinks out loud through one specific experience and ends on a question the sub can argue about. If the product appears at all it is one unnamed sentence.

**D. Showcase-thread entry (Level 4).** For the New Project Megathread, the Weekly Self Promotion Thread, the [D] Self-Promotion Thread, the Share Your Startup thread. The thread's template fields in order (name, one line on what it does, what it runs on, license, link, what you want from readers), still no hype and still one limitation. This is the only place the pitch is allowed to be direct. Version 4 pinned the length at 150 to 200 words in rule 20, not the source skill's 60 to 120: the `body_min_words` floor is 150, so a shorter entry warns on every run. Section 15, item 5 carries the alternative the audit preferred.

## 6. Pre-flight checklist

Adapted from the source skill's checklist. The model applies it before returning; the builder applies it again before posting. Items 12 to 16 were added in version 4, each now backed by a check.

1. Venue decided from the TARGET rules and named in warnings.
2. Mention level decided and not exceeded; link present only at Level 2 or above.
3. Title in first person, sentence case, one concrete detail, under 100 characters, no prefix except the ones a sub requires.
4. Body 150 to 300 words, flowing paragraphs, no list lines, no bold, no headings.
5. The "this already exists" sentence appears in the first 120 words and states a present-tense fact, not a comparison and not a history.
6. Builder disclosed in the sentence that first names the product, in the person APP_PROFILE supports.
7. One real limitation stated, taken from the profile or left as the placeholder.
8. Every number traces to proof_points.
9. Ends on one specific question; no vote, star, follow or share ask; no offer.
10. No em dash, no en dash, no banned vocabulary, no hype words.
11. Warnings carry the model-assisted line.
12. The product is named at most twice in the body; the ladder says once.
13. No prior-tool idiom and no dated personal history the profile does not record.
14. No plan or roadmap line the profile does not state, and no read failure dressed as a limitation.
15. The venue-scoped title shape holds: the r/SideProject `<Name> - <short description>` format, the r/MachineLearning `[P] ` prefix.
16. No negative word attached to a named tool, anywhere in the draft.

## 7. Mechanical checks

These are the 37 checks the gate runs on the returned JSON, in the order they appear in `src/lib/rulebook-checks.ts`. Eleven are new in version 4 and six carry changed values, flags or hardness; each is marked in its note.

How the gate reads a row:

- **Fields.** A named field is read as itself, and an array field is read element by element. `all` and `*` mean every string field except the stamped metadata the gate lists in `META_FIELDS`: warnings, blockers, repaired, venue, app_name, rulebook_version, rulebook_source, punctuation_fixed, wording_fixed and slop_fixed. For a Reddit draft an `all` check therefore sweeps title, body and suggested_flair, and nothing else. A check that names `warnings` explicitly still reads it.
- **Flags.** The gate compiles a `forbidden_regex` with the check's own flags, or `i` by default, or `iu` when the value carries a `\u{...}` escape. Four Reddit checks set flags to the empty string and so are case-sensitive: `no_better_than`, `title_sideproject_format`, `body_no_competitor_negative`, `body_names_need_proof`. Two set `im`: `body_no_list_lines` and `body_no_headings_or_bold`. A pattern JavaScript cannot compile is skipped, never fatal.
- **Hardness.** A hard failure becomes a blocker: it blocks approval and triggers the repair pass. The per-check `hard` flag decides it; with no flag the gate falls back to the kinds `max_chars`, `max_words`, `required_prefix`, `required_regex` and `max_count`, plus an id pattern that catches the banned verb, raw links, the link placeholder, the dash ban and the vote asks. Fourteen of the 37 are hard.
- **Counting.** `max_count` counts the elements of an array field; in a string field `countIn` counts `{APP_URL}` when the id carries `url`, raw links for `raw_links`, paragraph breaks for `paragraph`, the stamped `app_name` for `product_name`, and hashtags otherwise.
- **Guards.** `when: { field, regex }` runs a check only when another field matches, compiled with `i`. Both Reddit guards read the `venue` the runner stamps: `title_sideproject_format` on `^r/sideproject$` and `ml_title_prefix` on `^r/machinelearning$`.
- **`required_regex`.** The kind exists now: the first entry of the field must match, so a string field is itself and an array's first line is the model's first line. No Reddit check uses it yet; the joined-warnings check this section asked for in version 3 is still open (section 15, item 6).
- **The dash class.** `no_dashes` is written in the source with `\u` escapes on purpose. A dash sweep over the source once replaced the literal characters with commas and the check then fired on every comma. Never put a literal em or en dash in `rulebook-checks.ts`.

| id | kind | value | field | hard | What it catches |
| --- | --- | --- | --- | --- | --- |
| title_max_chars | max_chars | `100` | title | hard | Reddit allows 300; ours stops at 100 so the title reads in one line on mobile. Hard by kind, so a 109-character title (dub) comes back through the repair pass. |
| title_min_words | min_words | `6` | title | soft | A title shorter than six words carries no concrete detail. |
| title_max_words | max_words | `16` | title | hard | Past 16 words the title is a sentence, not a title. |
| title_no_show_hn | forbidden_regex | `^\s*Show HN:` | title | soft | Another platform's convention on Reddit; `gateAsset` also warns separately when a Reddit title opens with Show HN. |
| title_no_bang_or_question | forbidden_regex | `[!?]` | title | soft | No exclamation marks and no question titles. |
| title_no_clickbait | forbidden_regex | `\b(you won'?t believe\|this one (trick\|thing)\|changed my life\|insane\|crazy\|mind-?blowing\|must[- ]see)\b` | title | soft | r/artificial rule 3 removes clickbait titles; so do we. |
| body_min_words | min_words | `150` | body | soft | Below 150 words there is no room for the problem, the alternative and the limitation. Soft: `min_words` is not in the gate's hard kinds, so a short body warns and does not trigger the repair pass (section 15, item 5). |
| body_max_words | max_words | `300` | body | hard | Above 300 words Reddit skims. Hard by kind: formbricks came back at 313 words and went through the repair pass. |
| body_no_list_lines | forbidden_regex | `^\s*(?:[-*•]\|\d+[.)])\s+` | body | soft | No bullets or numbered lists; flowing paragraphs only. Version 4 set flags `im`: without `m` the anchor matched only the first line, so a bullet on line two passed. |
| body_no_headings_or_bold | forbidden_regex | `^\s*#{1,6}\s\|\*\*[^*]+\*\*` | body | soft | No markdown headings, no bold. Version 4 set flags `im` for the same anchor reason. |
| body_no_tldr | forbidden_regex | `\btl;?dr\b` | body | soft | Summary lines read as generated. |
| body_app_url_max_once | max_count | `1` | body | hard | Counts the literal `{APP_URL}` through `countIn` (the id carries `url`); zero is valid at Level 0 and 1. Hard. |
| body_no_raw_urls | forbidden_regex | `https?://\|www\.` | body | hard | Links only through the placeholder. Hard. |
| body_no_lazy_closer | forbidden_regex | `\b(thoughts\?\|what do you think\|let me know\|would love to hear\|any feedback is appreciated)\b` | body | soft | The closing question must be specific. |
| no_vote_or_reciprocity_asks | forbidden_regex | `\bup-?vot\w*\|\bvote (?:for\|us\|me\|it\|this\|now\|today\|here\|if)\b\|\b(?:cast\|drop\|give) (?:a\|your\|us a) vote\b\|\bevery vote\b\|\bvotes? (?:count\|matter)\b\|\bvoters? (?:get\|win\|receive)\b\|\b(?:top of\|climb\|hit\|reach\|win\|on) the leaderboard\b\|\bleaderboard (?:spot\|position\|rank)\b\|\bhelp us (win\|reach\|climb\|trend\|get to\|hit\|stay)\b\|\breach (#\|number \|no\.? ?)?1\b\|(#\|\bnumber \|\bno\.? ?)1 (on\|of the day\|today\|spot)\b\|\bproduct of the (day\|week\|month)\b\|\btop (post\|product) (of the day\|badge)\b\|\bsupport (our\|the\|this\|my) launch\b\|\b(love\|appreciate\|need\|value) your support\b\|\byour support (means\|would\|helps\|matters\|counts)\b\|\b(thanks?\|thank you\|grateful) for (your\|the\|all the) ((\w+ )?support\|love)\b\|\bshow (some\|your\|us some) (love\|support)\b\|\bsupport us\b\|\bin exchange for\b\|\breturn the favou?r\b\|\b(i'?ll\|we'?ll) (support\|back\|boost) yours\b\|\bfollow (?:me\|us\|for more)\b\|\brepost (?:this\|if)\b\|\bretweet\b\|\blike (?:this (?:post\|tweet\|thread)\|if you)\b\|\bplease (?:like\|share\|repost\|retweet)\b\|\bshare (?:this\|it) with\b\|\btag (?:a friend\|someone)\b\|\bsmash (?:that\|the)\b\|\blink in bio\b\|\b(?:star (?:the\|my\|our\|this) repo\|give (?:it\|us) a star\|feedback for feedback)\b` | all | hard | No vote asks, no follows, reposts or likes, no reciprocity, no offers, and the Reddit tail: no star asks and no feedback-for-feedback. Changed in version 4: the value is the shared vote-ask pattern every platform now uses, with the Reddit tail kept, the field widened from body to `all`, and `hard` set explicitly. |
| no_dm_solicit | forbidden_regex | `\b(dm me\|send me a dm\|pm me\|message me)\b` | body | soft | r/startups rule 6. |
| no_hashtags | forbidden_regex | `(^\|\s)#[A-Za-z]\w*` | all | soft | Reddit has no hashtags. |
| no_emoji | forbidden_regex | `[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]` | all | soft | None on Reddit. The `\u{...}` escapes make the gate compile it with flags `iu`. |
| no_dashes | forbidden_regex | `[\u2014\u2013]` | all | hard | Em and en dash ban, duplicated from the sanitiser so this rulebook is complete on its own. Hard through the gate's id list. |
| no_banned_verb | forbidden_regex | `\bsh[i]p(s\|ped\|ping)?\b` | all | hard | The one word the brand rulebook bans outright, written split so a sweep of the source file stays clean. Hard through the gate's id list. |
| no_hype | forbidden_regex | `\b(game[- ]?chang\w*\|ground-?breaking\|revolution(ary\|i[sz]e\w*)\|vir(al\|ality)\|seam-?less(ly)?\|unlea[s]h\w*\|super-?charge\w*\|\d+x (faster\|better\|cheaper\|more)\|1[0]x)\b` | all | soft | Hype list from the governing rules. |
| no_ai_tells | forbidden_regex | `\b(leverag\w*\|utiliz\w*\|innovative\|honest take\|here'?s the thing\|the irony is\|it'?s funny how\|nobody tells you\|full transparency\|excited to announce\|thrilled to\|in today'?s\|the honest (?:limitation\|gap\|truth\|answer)\|genuinely (?:curious\|like to know\|want\|think)\|that part I'?m proud of)\b` | all | soft | Rule 13 vocabulary. Changed in version 4: the four limitation-and-question template phrases were added after every eval draft used one. |
| no_setup_pivot | forbidden_regex | `(^\|[.!?]\s+)not [^,.]{1,40}, just\b` | body | soft | The "Not X, just Y" pattern from rule 14. |
| no_better_than | forbidden_regex | `\b(?:\d+(?:\.\d+)? ?(?:x\|times) )?(?:[Bb]etter\|[Ff]aster\|[Cc]heaper\|[Ss]marter\|[Ss]impler\|[Ee]asier\|[Ss]maller\|[Ll]ighter\|[Ss]afer\|[Mm]ore (?:accurate\|reliable\|secure\|private\|powerful)\|[Ll]ess \w+\|[Ff]ewer \w+) than (?:the \|most \|other \|any \|every \|a \|an )?(?!I\b)[A-Z]` | body | hard | Better-than-X positioning, including a multiplier against a named product. Changed in version 4: the target must now be capitalised, so "54 times smaller than Google Analytics" (plausible) and "less RAM than an Electron app" (hoppscotch) are caught while "grew faster than the insights it gave me" passes. Set hard because brand rulebook 4.1 makes it a blocker; flags are empty, so the pattern is case-sensitive. |
| traction_numbers_need_proof | forbidden_regex | `\b\d[\d,.]*\s?[km]?\+?\s*(users\|customers\|signups\|sign-ups\|downloads\|stars\|installs\|teams\|companies\|clicks\|links\|requests\|events\|contributors\|forks\|subscribers\|organi[sz]ations)\b\|\bMRR\b\|\bARR\b\|\$\s?\d` | body | soft | A traction figure that must appear in APP_PROFILE.proof_points. Soft on purpose: the figure may be real. Changed in version 4 to add clicks, links, requests, events, contributors, forks, subscribers, organisations and the plus sign, after dub's "100M+ clicks and 2M+ links a month" passed. |
| warnings_present | min_words | `4` | warnings | soft | The warnings list must carry a real line. It runs on each warnings line separately, not on the joined array, so a short true line such as "Level 2." fires it (section 15, item 6). |
| title_sideproject_format (new in v4) | forbidden_regex | `^(?!(?!(?:I\|We\|My)\b)[^\n]{1,40} - \S)` | title | hard | New in version 4. The r/SideProject sidebar format `<Name> - <short description>`; hack-judge and dub both ignored it. Hard, case-sensitive, and venue-guarded: it runs only when the stamped `venue` matches `^r/sideproject$`. |
| body_product_name_max_count (new in v4) | max_count | `2` | body | hard | New in version 4. Counts the stamped `app_name` in the body through `countIn`, word-bounded and case-insensitive, and blocks at three or more; dub named the product three times at "named once". With no name stamped the check cannot fire. |
| body_no_prior_tool_idiom (new in v4) | forbidden_regex | `\b(?:carried (?:us\|me) (?:fine \|well )?until\|(?:worked\|was\|were\|did) (?:fine\|great\|ok\|okay\|well) (?:for (?:us\|me) )?until\|was the (?:final\|last) (?:push\|straw)\|(?:that\|this\|it) was the moment\|the moment (?:I\|we) (?:stopped\|realized\|realised\|decided)\|until (?:I\|we) (?:realized\|realised))\b` | body | hard | New in version 4. The invented prior-tool history in its template idiom: carried us until, worked fine until, was the final push, that was the moment. Hard, because a true history does not need the template. |
| body_no_invented_history (new in v4) | forbidden_regex | `\b(?:for a long time,? (?:I\|we) (?:used\|ran\|relied on)\|(?:I\|we) (?:used\|ran\|tried) \S+(?: \S+)? for (?:a while\|(?:a few\|several\|two\|three\|four\|five\|six\|\d+) (?:weeks\|months\|years))\|a (?:few\|couple of) years ago,? (?:I\|we)\|(?:back )?in 20\d\d,? (?:I\|we) (?:started\|began\|was\|were)\|when \S+(?: \S+){0,3} (?:rolled out\|launched\|changed\|shut down\|was acquired\|got acquired),? (?:I\|we) had to\|earlier this year\|later this year\|last (?:year\|month\|spring\|summer\|autumn\|fall\|winter),? (?:I\|we))\b` | body | soft | New in version 4. A dated personal history with a tool (for a long time I used, I ran X for a while, a few years ago we, when X rolled out I had to, earlier this year). Soft, because APP_PROFILE can record a real one. |
| body_no_competitor_negative (new in v4) | forbidden_regex | `(?:[Dd]oesn\|[Dd]idn)'?t (?:touch\|even (?:try\|bother)\|bother)\b\|[Cc](?:ouldn'?t\|an'?t\|annot) tell (?:me\|us\|you)\b\|\b[Kk]ept shrinking\b\|\b[Ee]xpensive plan\b\|\b[Pp]aywall\w*\|\b[Ll]ock(?:s\|ed\|ing)? (?:you\|your \w+(?: \w+)?\|data\|users) in\b\|\b[Vv]endor lock-?in\b\|\b[Cc]harges? (?:you \|extra )?for\b\|\b[Bb]uries\b\|\b[Oo]verkill\b\|\b[Nn]ickel[- ]and[- ]dim\w*\|\b[Ss]caled-down\b\|\b[Ww]atered-down\b\|\b[Hh]alf-baked\b\|\b[Ww]e replaced [A-Z]\|\b[Dd]itch(?:ed\|ing)? [A-Z]` | all | hard | New in version 4. A negative word attached to a named tool: doesn't touch, couldn't tell me, kept shrinking, expensive plan, paywall, locks you in, charges for, buries, overkill, scaled-down, we replaced X, ditch X. Hard, case-sensitive, field `all`, from GLOBAL_RULES line 11 and brand rulebook 4.1. |
| body_no_invented_roadmap (new in v4) | forbidden_regex | `\b(?:I'?m\|we'?re\|I am\|we are) (?:working on\|planning\|going to\|about to)\b\|\bon (?:the\|my\|our) roadmap\b\|\bnext (?:on the list\|up)\b\|\bcoming soon\b\|\b(?:I\|we) plan to\b` | body | soft | New in version 4. A plan the profile does not state (I'm working on, on the roadmap, coming soon, we plan to). Soft, because a README roadmap can make it true. |
| body_names_need_proof (new in v4) | forbidden_regex | `\b(?:used by\|trusted by\|teams at\|companies (?:like\|such as)\|customers (?:like\|include)) [A-Z]` | body | soft | New in version 4. Customer and logo name-dropping (used by, trusted by, teams at, companies like) that must trace to proof_points. Soft; case-sensitive, so the capitalised name is what triggers it. |
| body_builder_disclosure_present (new in v4) | forbidden_regex | `^(?![\s\S]*\b(?:I\|we) (?:built\|made\|wrote\|maintain\|work on\|created\|develop)\b)(?![\s\S]*\b(?:I'?m\|I am\|we'?re\|we are) (?:one of )?the (?:builders?\|maintainers?\|authors?\|contributors?\|developers?\|team)\b)` | body | soft | New in version 4. The positive disclosure check section 7 asked for, written as a negative lookahead: the body must say I or we built, made, wrote, maintain, work on, created or develop it, or name the writer as one of the maintainers. Soft, because a Level 0 write-up names no product. |
| body_question_present (new in v4) | forbidden_regex | `^(?![\s\S]*\?)` | body | soft | New in version 4. The body must contain at least one question mark; rule 10 asks for one specific closing question. Soft. |
| body_no_read_failure_as_gap (new in v4) | forbidden_regex | `\b(?:returns? (?:a \|an )?(?:404\|500\|503)\b\|(?:404\|503) (?:page\|error)\|(?:page\|site\|docs?) (?:is \|was )?(?:unreachable\|down\|not reachable)\|could(?: not\|n'?t) (?:be )?(?:load\|reach\|fetch)\w*\|timed out)\b` | body | soft | New in version 4. A scrape artifact (a 404, an unreachable page, a timeout) presented as the product's limitation. Soft. |
| ml_title_prefix (new in v4) | required_prefix | `[P] ` | title | hard | Merged in version 4, having been listed here since version 3 and left out because the kind could not be scoped to one sub. The r/MachineLearning main-feed prefix, the trailing space included. Hard by kind, and venue-guarded on `^r/machinelearning$`. |

Still wanted, and not yet built: a `required_regex` on the joined warnings array that checks for rule 12's "model-assisted" phrase, and a count of question marks in the last paragraph of the body rather than anywhere in it.

## 8. Subreddit table for the developer ICP

The eleven developer subs the owner named, then r/SideProject and r/startups, which the pipe also uses. "Verified" means the rule text was read from the sub's own rules page (a Wayback snapshot of `old.reddit.com/r/<sub>/about/rules/`, date given) or from the live sidebar through a Redlib mirror on 2026-09-11. reddit.com itself returned HTTP 403 to every direct request, so the builder should open the sub's rules page in a browser before posting; rules change, and r/programming, r/selfhosted and r/ExperiencedDevs all changed theirs in 2026.

**r/vscode could not be verified.** Every route failed on 2026-09-11: old.reddit.com answered the "Welcome to Reddit" shell, the mirror shows the sidebar and the posts but no rules list, and web.archive.org holds no capture of either `old.reddit.com/r/vscode/about/rules/` or `www.reddit.com/r/vscode/about/rules/` for 2024, 2025 or 2026. Its row below carries only what the mirror sidebar and the AutoModerator weekly theme thread showed, and rule 22 caps the sub at Level 1 until someone reads the rules in a browser.

| Sub | Members | Max level | Where a launch post can go | Title style | Flair | What gets removed | Verified rules snapshot |
| --- | --- | --- | --- | --- | --- | --- | --- |
| r/programming | 6.9M | 0 | Main feed, technical write-up only, and only if the AI policy allows it | What you learned building it, no product name | None documented | Product promotion and "I made this" demos (rule 5), LLM-written content (rule 1), applications of existing LLM tools and tool reviews (rule 2 and the AI policy), blogspam (rule 11), aggregators (rule 6), low-effort posts (rule 10) | `https://web.archive.org/web/20260811153143/https://old.reddit.com/r/programming/about/rules/`, 2026-08-11, plus `https://www.reddit.com/r/programming/wiki/ai-policy` (policy dated 2026-05-23) and the live mirror sidebar, 2026-09-11 |
| r/LocalLLaMA | 821k | 2 | Main feed with Resources or Discussion flair | Name the model size, hardware or quantization it runs with | Resources, Discussion | Self-promotion past the 1/10th rule and undisclosed affiliation (rule 4), mostly LLM-generated text or code and bots posing as humans (rule 3), anything unrelated to Llama or LLMs (rule 2) | `https://web.archive.org/web/20260807221923/https://old.reddit.com/r/LocalLLaMA/about/rules/`, 2026-08-07 |
| r/MachineLearning | 3.1M | 2 | Main feed with `[P] ` if there is technical substance; otherwise the [D] Self-Promotion Thread | `[P] ` prefix, method named | Project | Promotion of paid products where the intent is to promote (rule 2), SEO and marketing campaigns, with a permanent ban and history purged (rule 3), spam (rule 1), bare arXiv links (rule 5) | `https://web.archive.org/web/20260716084247/https://old.reddit.com/r/MachineLearning/about/rules/`, 2026-07-16, plus the [D] Self-Promotion Thread seen live on the mirror, 2026-09-11 |
| r/devops | 512k | 2 | Weekly Self Promotion Thread for the launch; main feed for a Level 1 discussion with a submission statement | Operational problem first ("how I run X in prod"); a link post uses the article title, unedited | None (the weekly thread has none) | Vendor spam ("buy an ad from reddit instead"), articles with no 3 to 5 sentence submission statement, editorialized titles | Live mirror sidebar "Rules and guidelines" plus the Weekly Self Promotion Thread seen live, 2026-09-11; no Wayback capture used. Open `https://old.reddit.com/r/devops/about/rules/` |
| r/selfhosted | 837k | 2 | New Project Megathread if under 3 months old; main feed only after that | What it replaces or what it runs on | New Project Megathread for a new project; the Wednesday flair for a dashboard or tool post | Excessive self-promotion and apps that are not production ready or have no docs (rule 2), standalone posts for projects under 3 months old (rule 6), blog links with no why-it-matters line (rule 4), and every new post until OP answers the AI-compliance bot | `https://web.archive.org/web/20260811152937/https://old.reddit.com/r/selfhosted/about/rules/`, 2026-08-11, plus the New Project Megathread for the week of 2026-09-10 seen live and the mods' rules post of 2026-04-07 |
| r/opensource | 381k | 2 | Main feed with Promotional flair | License in the title | Promotional | Excessive self-promotion past the 10% guideline (rule 2), repositories with no OSI-listed LICENSE file (rule 4), AI-generated content, which is ban-worthy (rule 3), drive-by accounts that will not join the discussion (rule 6) | `https://web.archive.org/web/20260726134356/https://old.reddit.com/r/opensource/about/rules/`, 2026-07-26 |
| r/ExperiencedDevs | 415k | 0 | Main feed, Wednesday or Saturday only for AI topics, as a discussion | A question senior devs argue about | No post flair; the account needs user flair and karma in the sub | Advertisements and surveys without mod approval (rule 8), AI topics on any other day (rule 10), posts from accounts with no user flair or no karma there, and posts where OP does not answer the AI-disclosure sticky or comment within 2 hours (rule 11), low effort, venting and bragging (rule 9) | `https://web.archive.org/web/20260728122025/https://old.reddit.com/r/ExperiencedDevs/about/rules/`, 2026-07-28 |
| r/commandline | 131.4k | 2 | Main feed, for a CLI or TUI older than 30 days that does not talk to a model | `<name>: <what it does in the terminal>`, the sub's own convention | Command Line Interface, Terminal User Interface (Fun also seen) | AI-generated post text or titles and largely AI-generated projects (rule 5), projects that interact with generative AI or LLMs unless they are popular ones such as Ollama or GGML (rule 6), projects under 30 days old or with few commits (rule 4), GUI-only tools (rule 2), URL shorteners and more than 3 posts a day (rule 3), and posts from accounts that have not agreed to the rules once on new reddit | `https://web.archive.org/web/20260811152913/https://old.reddit.com/r/commandline/about/rules/`, 2026-08-11, plus the live mirror `https://safereddit.com/r/commandline`, 2026-09-11 |
| r/vscode | 224.0k | 1 | Not verified. Until the rules page is read: a Level 1 discussion about the editor problem, no product name, no link | Descriptive, about the editor workflow or the extension problem | None (no flair list reachable) | Not verified. Seen live: new theme posts are removed and theme creators must not repost weekly (the AutoModerator weekly theme thread) | None. No snapshot exists; `https://safereddit.com/r/vscode`, 2026-09-11, sidebar and weekly thread only. Open `https://www.reddit.com/r/vscode/about/rules/` before posting |
| r/webdev | 3.3M | 3 | Showoff Saturday only | Plain "I built" | Showoff Saturday | Commercial promotion and solicitation, with a ban possible (rule 4), any project, portfolio or feedback post on a day other than Saturday (rule 5), excessive self-promotion against the 9:1 rule (rule 3) | Live mirror sidebar "Posting Guidelines", 2026-09-11; no Wayback capture used. Open `https://old.reddit.com/r/webdev/about/rules/` |
| r/artificial | count not captured | 1 | Main feed as a discussion, only from an account with history there | Descriptive, no clickbait | None captured | Promo in a first post or comment and self-inserting your product (rule 2), selling anything (rule 4), clickbait, generic, sensationalized or misleading titles (rule 3), dumps of personal LLM conversations (rule 5), "what is the best tool" requests (rule 10) | `https://web.archive.org/web/20260828184531/https://old.reddit.com/r/artificial/about/rules/`, 2026-08-28 |
| r/SideProject | count not captured | 3 (2 when it is the unconfirmed default under rule 18) | Main feed | `<Name> - <short description>`, the sidebar's submission format | None captured | Nothing documented: the rules page is empty, so only Reddit's site-wide rules are certain | `https://web.archive.org/web/20260828184531/https://old.reddit.com/r/SideProject/about/rules/`, 2026-08-28: the page lists no formal rules, so only the sidebar is verified |
| r/startups | count not captured | 1 on the main feed, 4 inside the Share Your Startup thread | Share Your Startup thread for the launch; main feed for a Level 1 lessons post of 250 characters or more | Lesson or method, never the product name | None (the thread has none) | Promotional posts of any kind outside the stickied thread (rule 2), submissions that tie the topic to your own project by name or URL or run under 250 characters (rule 3), feedback requests outside the Feedback Thread (rule 4), comment links you are affiliated with or that carry no context (rule 5), DM solicitation (rule 6), your own blog without prior mod approval (rule 7) | `https://web.archive.org/web/20260823233758/https://old.reddit.com/r/startups/about/rules/`, 2026-08-23, plus the "Share your startup" quarterly post of 2026-07-11 seen live on the mirror |

The same eleven developer rows are seeded into the venues table by `apps/launchkit/src/data/venues.seed.ts`, each carrying this rules summary and its snapshot source inline, and the two files must be kept in sync (r/SideProject and r/startups were already in the generated seed and still carry their older one-line summaries, which is item 12 of section 15).

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

Consequence: Level 2 on the main feed only with method and evaluation in the body and a visible feedback intent; the plain launch goes in the thread as formula D. Pricing must be stated there if the product is paid, which is why rule 20 carries the price line.

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

Consequence: under 3 months old, formula D in the megathread; older, formula B at Level 2 with install and docs detail, and the builder must answer the bot. The age comes from APP_PROFILE, and getting it wrong is how khoj, a 2021 project, was drafted with the megathread flair (section 15, item 5).

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

### r/commandline

Why it fits: the terminal-first developer, and the CLI or TUI half of what the ICP builds. Off-limits for any app whose product talks to a model, which is most of them; usable for a runtime CLI, a TUI or a plain developer tool. Added in version 4.

Self-promotion rule (verified: Wayback snapshot 20260811152913 of `https://old.reddit.com/r/commandline/about/rules/`, seven rules; plus the live mirror `https://safereddit.com/r/commandline` on 2026-09-11 for the member count, the flair list and the agree-to-the-rules sidebar):

- Rule 4, "No new projects newer than 30 days. Shared projects must be interesting": a project created less than a month ago or with only a few commits is removed, and a project must be a little unique rather than something created many times over.
- Rule 5, "AI Code Policy": post text or titles generated with AI are strictly prohibited; projects are judged by human effort and how noteworthy they are; largely AI-generated projects are strictly prohibited; if more than a small portion of the code is AI-generated, the post must carry the note "This software's code is partially AI-generated".
- Rule 6, "No generative AI-related projects (except for popular ones)": projects or software that interacts with generative AI, including LLMs, are not allowed unless the post is about popular projects such as Ollama or GGML.
- Rule 7: list similar and alternative software and how yours is different, so readers know what type of software the project is.
- Rule 2: no GUI-only tools (a CLI or TUI that also has a GUI is fine); no low-quality blogspam. Rule 3: no URL shorteners or redirectors, no more than 3 posts a day. Rule 1: follow Reddit's content policy.

Consequence: formula B at Level 2 for a non-AI CLI or TUI older than 30 days, with the similar-tools paragraph, the install line and the partial-AI note where it applies. For a tool that talks to a model, rule 21 turns the draft into a warning rather than a post.

### r/vscode

Why it fits: the ICP's editor, and the IDE-native half of the moat line. Added in version 4 as an unverified sub.

Rules: not verified. Every route failed on 2026-09-11 (see section 13). What was read on the live mirror `https://safereddit.com/r/vscode`:

- Sidebar: "A subreddit for working with Microsoft's Visual Studio Code"; "VS Code is a source code editor, and not an IDE"; other Visual Studio flavours go to r/VisualStudio. 224.0k members.
- An AutoModerator "Weekly theme sharing thread": new posts about themes are removed, and theme creators must not repost weekly.
- No rules list, no flair list, and no wiki page of rules; the mirror's wiki is a settings guide.

Consequence: formula C at Level 1 until the rules are verified and this entry is rewritten; never Level 2 and never a link. Rule 22 also tells the builder, in warnings, to read `https://www.reddit.com/r/vscode/about/rules/` in a browser first.

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

Why it fits: the one sub whose stated purpose is sharing a project and receiving feedback; it matches the "I built" shape of a Launch Kit post exactly, and it is the default venue when Targets selected none.

Self-promotion rule (partly verified: Wayback snapshot 20260828184531 of `https://old.reddit.com/r/SideProject/about/rules/` lists no formal rules at all; the sidebar is verified):

- Sidebar: "a subreddit for sharing and receiving constructive feedback on side projects"; also a place to get motivated, so links to projects you find interesting are welcome.
- Submission format: "[Project name] - [Short description]", with "Reddit - A website for sharing and discussing links" as the example. This is the format the `title_sideproject_format` check enforces.
- No self-promotion limit found on the rules page: unverified beyond the sidebar. The source skill's claim that every top post has a video or GIF is its own observation and unverified.

Consequence: formula B at Level 3 with the sidebar title format and the demo recording attached; Level 2 when r/SideProject is the unconfirmed default of rule 18.

### r/startups

Why it fits: the founder audience for the company story, with the product kept out of the main feed entirely.

Self-promotion rule (verified: Wayback snapshot 20260823233758 of `https://old.reddit.com/r/startups/about/rules/`; the "Share your startup - quarterly post" of 2026-07-11 seen live on the mirror):

- Rule 2, "No direct sales, advertisements, or promotion": no promotional posts of any kind; the only exception is the stickied Share Your Startup thread; self-promotion is anything you have a stake in, including a friend at the company; the mods have the final say.
- Rule 3: submissions discuss methodologies, experiences, strategies and markets WITHOUT tying them to your own project by name or URL; clear titles; at least 250 characters; no legal questions.
- Rule 4: all feedback requests belong in the Feedback Thread. Rule 5: comment links need a sentence of context and must be to content you have no affiliation with. Rule 6: no DM solicitation, no "I DMed you" notices. Rule 7: sharing your own blog needs prior mod approval and the full body in the post.
- The Share Your Startup template asks for name and URL, headquarters, elevator pitch, life-cycle stage, this month's goals, and whether readers get a discount. Skip the discount line; the brand rules forbid offers.
- The "I will not promote" title tag mentioned by the source skill does not appear on the rules page: unverified convention, do not rely on it.

Consequence: the launch is formula D in the Share Your Startup thread; a main-feed post is formula C at Level 1 with no name and no URL, 250 characters or more. The 250-character minimum belongs to this sub only; warnings that cite it for r/SideProject are wrong.

## 9. Hook patterns (developer voice, written fresh)

The nine entries of the live `hooks` array, in order. The model receives them under a `HOOK_PATTERNS` header after the rules, with the instruction to pick one and adapt it, never to copy the words. Every placeholder is filled from the profile; none of these carries a number the profile does not have. When the profile is thin (confidence under 0.5, or analysis degraded), the `THIN_PROFILE` block in `src/domain/questions.ts` overrides every hook and every rule that asks for a story, a moment, a limitation or a mechanism, per GLOBAL_RULES line 12.

1. I got tired of <manual step> in <context>, so I built <thing> that does it in <N> lines of <language>.

   *Source: RocketRide, this task (written fresh for version 3 in the developer voice).*

2. I run <thing> on a <hardware> in my <place>. The part that took <N> weeks was <problem>.

   *Source: RocketRide, this task.*

3. I open sourced the <component> I kept rewriting on every project. <License>, <stack>.

   *Source: RocketRide, this task.*

4. Post-mortem: <pipeline or agent> failed on <event>. What I changed and what I still don't trust.

   *Source: RocketRide, this task.*

5. How do you handle <failure mode> in <context>? I built <thing> for it and I'm not sure my tradeoff is right.

   *Source: RocketRide, this task.*

6. <N> months in, <thing> does <one concrete job>. It still can't <limitation>.

   *Source: RocketRide, this task.*

7. <Existing tool> collects <its job>; it has no <the step you needed>. That gap is what <thing> does. (replaces hook 2, '<Existing tool> carried us until <specific limit>. This is what I wrote when it didn't.', which the model filled literally on dub)

   *Source: RocketRide, this task, answering the ten-app evaluation's cluster 3. New in version 4: it replaces version 3's second hook, and the parenthetical naming what it replaced is part of the live string the model receives.*

8. I open sourced <thing> under <License>. It does <one job> on <hardware or runtime>; it does not yet <limitation from the profile>.

   *Source: RocketRide, this task. New in version 4.*

9. For r/commandline only: <name>: <what it does in the terminal>, <language>. Similar to <tool A> and <tool B>; the one difference is <difference>.

   *Source: r/commandline rule 7 and the sub's own title convention seen on the live mirror on 2026-09-11 (for example "hop: project sessions beyond tmux"). New in version 4.*

One hook was dropped in version 4; section 12 says which and why.

## 10. Comment rules for the builder (launch day and after)

Adopted from the source skill's comment mode, rewritten. These are for the human in the thread; the pipe does not draft comments, and no rule in the live entry covers them, so a future `reddit_comment` asset would reuse this section as its rulebook.

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
| 1 (venue) | Source skill's "Subreddit Comment Rules" idea that each sub has a place for promotion; the earlier default "Obey the subreddit's rules on self-promotion" | Rewritten for version 3 with the verified venues per sub so the model has data, not a wish. Unchanged in version 4 |
| 2 (ladder) | Source skill's 5-level Product Mention Strategy for comments, and its line that an unlisted sub gets Level 0 or 1 only | Extended to posts; the cap per sub set from the verified rules; Joe's account moved into its own rule (19). Version 4 placed r/commandline at Level 2 and r/vscode at Level 1, made Level 1 the default for every unverified sub, and defined "named once" so `body_product_name_max_count` can enforce it |
| 3 (numbers) | Brand rulebook 2.7 and 5.1; the pipe's own global rule ("only use proof_points") | Made explicit that build-time numbers are fine and traction numbers need the profile; the source skill's "Body has at least one concrete metric" checklist item was dropped because it invites invention |
| 4 (title) | Source skill's title patterns and checklist ("first person", "specific number or time constraint"); the earlier default title rule | Number requirement softened to "one concrete detail" so no number is invented; per-sub prefixes added from verified rules. Version 4 added the checks that enforce two of those shapes rather than changing the rule |
| 5 (body shape) | Source skill's "Formatting, strictly no exceptions" and the Key: Value exception | Kept whole; TL;DR ban added; the Key: Value lines tied to proof_points |
| 6 (paragraph order) | Source skill's Formula 1 body and the 4-part story framework | The "community-exclusive offer" step removed; the link moved to the end and made conditional |
| 7 (already exists) | Source skill's "Address 'this already exists' before someone else does" | Version 4 rewrote it: the reason is now a present-tense fact about the alternative, taken from APP_PROFILE, and the invented-history idioms are banned by name. The old example ("I ran X for six months; it broke on Y") collided with GLOBAL_RULES line 10 and six of ten eval drafts resolved the collision by inventing a history |
| 8 (disclosure) | The earlier default "Disclose that you are the builder"; r/LocalLLaMA rule 4 | Tied to the sentence that names the product; "I found this" banned from the sub's own rule. Version 4 tied the choice of I or we to what APP_PROFILE shows and required one person across the run, after four drafts claimed a solo build of a company product |
| 9 (limitation) | Source skill's "Be an imperfect person" and "one honest failure required" | Kept the requirement; dropped the framing that the flaw exists to farm engagement. Version 4 sourced the gap from the profile or the placeholder, banned the invented roadmap that followed it in three drafts, ruled that a read failure is never a limitation, and banned the template opener |
| 10 (question, no asks) | Source skill's "End with a real question, not 'thoughts?'" and "Never ask for upvotes"; brand rules on vote asks and reciprocity | Reciprocity, offers and discounts added to the ban; r/startups rule 4 "return the favor" text is the reason feedback-for-feedback is named |
| 11 (link) | Source checklist "Product link goes in first comment, not post body"; pipe shape "{APP_URL} once" | Reconciled: link in the body at Level 2+, moved to a first-comment warning where the sub forbids body links |
| 12 (AI disclosure) | r/programming rule 1, r/LocalLLaMA rule 3, r/opensource rule 3, r/selfhosted and r/ExperiencedDevs bots | New in version 3; nothing in the source skill covered it and it is the single biggest removal risk for a model-drafted post. Still has no check |
| 13 (vocabulary) | Source skill's "Language, never use" list; GLOBAL_RULES | Merged and de-duplicated; "utilize", "innovative", "full transparency" added. Version 4 added the four phrases the eval drafts used as their template for rules 9 and 10 |
| 14 (structure) | Source skill's "Sentence structures that signal AI" | Kept the setup-pivot and fake-casual bans; added triplets, closing summaries and DM solicitation (r/startups rule 6) |
| 15 (flair) | Pipe output shape has `suggested_flair` | New in version 3; flairs taken from the verified rules and live flair lists |
| 16 (warnings) | Pipe output shape requires a warning when the post could break TARGET rules | Expanded into an ordered list of what warnings must contain |
| 17 (voice) | Brand rulebook 3.1 and 3.5; the earlier default "No marketing tone" | Rewritten as an action (cut the sentence, say so) rather than a mood |
| 18 (default venue) | The ten-app evaluation, cluster 12: Social ran before Targets and seven apps were drafted for r/SideProject while the plan used another sub; `api.ts` `runAsset` now passes the first selected subreddit | In code since version 3 and undocumented until now. Version 4 added the "Targets has selected none" condition, the r/SideProject title format, and the reason Level 2 sits below the ladder's Level 3 |
| 19 (account cap) | Brand rulebook 3.5 and section 3 of this document | New in version 4. The cap existed in this document and in no rule, so the model never saw it |
| 20 (showcase thread) | Formula D of section 5; the r/MachineLearning [D] Self-Promotion Thread text | New in version 4. The formula lived only in this document at 60 to 120 words, which fails the 150-word body floor on every run; the rule pins 150 to 200 words and carries the price line the thread asks for |
| 21 (r/commandline) | r/commandline rules 4, 5, 6 and 7, and the sub's title convention | New in version 4, with the sub itself |
| 22 (r/vscode) | The r/vscode mirror sidebar and weekly theme thread; the unlisted-sub default of rule 2 | New in version 4, with the sub itself. It states what could not be read, rather than guessing |

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
- r/SoftwareEngineering, r/cscareerquestions, r/ChatGPT, r/aiagents from the source's comment list: outside the subs the owner named; r/aiagents may be worth a later look.
- Version 3's second hook, "<Existing tool> carried us until <specific limit>. This is what I wrote when it didn't.": dropped in version 4. The model filled it literally and invented a Bitly history for dub, which is the root cause the evaluation's cluster 3 names. Hook 7 states the same gap as a present-tense fact instead, and `body_no_prior_tool_idiom` is hard so the idiom cannot come back through another route.
- The slop-lexicon entries that have no safe drop-in replacement ("the honest limitation right now is", "the honest gap right now is", "genuinely", "that part I'm proud of", "I'd love to hear", "Great question", "Happy to help"): they are deletions or rewrites, not one-for-one swaps, so `cleanSlop` cannot carry them without mangling a sentence. They became rule 13's vocabulary list and the `no_ai_tells` and `body_no_lazy_closer` patterns instead.
- Formulas A and C as rules: they stay guidance in section 5. Only formula D became a rule (20), because it is the one shape whose length collides with a machine check.
- Section 10's comment rules: no `reddit_comment` asset exists, so nothing in the live rules covers them. This is a deliberate gap, not an oversight.

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
| r/commandline | Wayback rules page (seven rules) plus live mirror sidebar, flairs and member count | 2026-08-11 (snapshot 20260811152913), 2026-09-11 (mirror) | https://old.reddit.com/r/commandline/about/rules/ |
| r/vscode | Not verified. old.reddit.com answered the "Welcome to Reddit" shell; the mirror showed the sidebar, the member count and the weekly theme thread but no rules list; web.archive.org holds no capture of the old or www rules page for 2024, 2025 or 2026; the mirror wiki is a settings guide | 2026-09-11 (mirror only) | https://www.reddit.com/r/vscode/about/rules/ |
| r/webdev | Mirror sidebar Posting Guidelines | 2026-09-11 | https://old.reddit.com/r/webdev/about/rules/ |
| r/artificial | Wayback rules page | 2026-08-28 | https://old.reddit.com/r/artificial/about/rules/ |
| r/SideProject | Wayback rules page (empty) plus sidebar | 2026-08-28 | https://old.reddit.com/r/SideProject/about/rules/ |
| r/startups | Wayback rules page plus live quarterly thread | 2026-08-23 (snapshot), 2026-07-11 (thread) | https://old.reddit.com/r/startups/about/rules/ |

reddit.com itself was never reachable from this machine; every verification above went through a Wayback snapshot or a Redlib mirror. The nine rows that predate version 4 were not re-fetched on 2026-09-12; their dates stand as recorded.

Mechanical sweep of this file (the brand-check greps from `.claude/rules/skills/brand-check/SKILL.md`): banned verb 0 outside the one bracket-split regex value quoted from the code in section 7, em dash 0, en dash 0, hype 0 outside the ban lists, AI tells 0 outside the ban lists. Re-run after any edit.

## 14. Storage and versioning

This document matches rulebook version 4. `RULEBOOK_VERSION = 4` in `src/lib/rulebooks.ts`, and sections 4 and 9 reproduce the live `reddit_post` rules and hooks as the model receives them.

**Where the rules live at run time.** The defaults in `rulebooks.ts` seed the `platform_rules` table. `seedRulebooksIfEmpty` (`src/data/seed.ts`) inserts the default as a new row with `source: 'default'` and `version: 4`; it inserts above a stale seeded row rather than editing one, so the store keeps a record of which version each draft was written against. `rulesFor` (`src/data/rules.ts`) then reads the newest row for the platform by `updated_at`.

**How a stored row goes stale.** `isStale` is true when a row's `source` is not `owner` and its `version` is below `RULEBOOK_VERSION`: a row seeded from an older default gives way to the code default, so a workspace that was seeded at version 3 gets version 4 without anyone touching Settings.

**How an owner edit survives.** A row the owner saved carries `source: 'owner'`, and `isStale` is false for it at any version, so an owner edit always wins over the code default and a version bump never overwrites it. A stored row that saved no hooks keeps the default hooks; a stored row that saved no name or summary falls back to the default's.

**What every draft carries.** `runAsset` stamps `rulebook_version` and `rulebook_source` from `rulebookMeta` on every draft, so a re-run can prove which rules the draft saw: version 4 and `default` for a workspace running the code defaults, or the owner's version and `owner` where Settings was edited. Both fields are in the gate's `META_FIELDS`, so no check whose field is `all` ever sweeps them.

**The sanitiser passes that run before the gate, in order.**

1. `sanitizeDraft` (`src/domain/sanitize.ts`), inside the pipe runner on every pipe result: an em dash becomes a comma, an unspaced en dash inside a range (a year span such as 2019 to 2024, a letter span such as A to C, a price span) becomes a hyphen, and any other en dash becomes a comma, with the comma tidied against neighbouring punctuation. It walks every string in the result, warnings included. The count reaches the draft card as `punctuation_fixed`.
2. `cleanVerbs`, through `sanitizeVerbs` in `runAsset`: the banned launch verb becomes release, releases, released or releasing, with the case of the first letter preserved. The count reaches the card as `wording_fixed`.
3. `cleanSlop`, in the same pass: the 67 slop-lexicon terms in `src/lib/slop-lexicon.ts`, longest term first so "delve into" is replaced before "delve", become their plain replacements. The count reaches the card as `slop_fixed`.

Passes 2 and 3 run on every field except `warnings`, which quote the draft's faults as written; pass 1 runs on every field. Only then does `gateAsset` run the 37 checks of section 7, so a check never fires on something a sanitiser already fixed, and `no_dashes` and `no_banned_verb` are the backstop for anything the sanitisers do not reach. Reddit has no residual `slop_lexicon` warning check; that check exists only in the LinkedIn set, so slop with no safe swap is caught here by rule 13 and the `no_ai_tells` pattern instead.

## 15. Open questions for the owner

Unresolved. Each one needs a decision that this document cannot make.

1. **Which account posts.** Rule 19 caps the mention level at 1 for Joe's personal account, per brand rulebook 3.5, but the pipe has no posting-account field: the cap fires only when the builder writes it into TONE or BRAND_DNA. Who sets that, and whether the RocketRide brand account (full marketing voice under 3.5) ever posts on Reddit at all, is the owner's call. The review's own open list carries the same item for every other platform.
2. **Foundation model providers in a comparison.** Brand rulebook 4.3 flags this policy as unconfirmed. The evaluation produced "the tracking script is 54 times smaller than Google Analytics" (plausible) and an Obsidian Copilot line (khoj). The changed `no_better_than` check blocks the comparative shape, but rule 7 still allows a neutral present-tense fact about a product from Google, OpenAI, Anthropic or Meta. Confirm the rule before this runs unattended.
3. **Naming an acquisition.** The evaluation's continue draft wrote "Continue was acquired by Cursor earlier this year". The date is caught by `body_no_invented_history`, and Cursor is a listed competitor under brand rulebook 4.2, but no rule anywhere says whether an acquisition may be named as a neutral fact in a Reddit body. Source URL not captured; the evidence is the draft in `docs/eval-10/continue/`.
4. **App Builder's public name.** Nothing in the Reddit evidence names bucket 3, and no rule here mentions it. Recorded because brand rulebook 5.2 asks every reviewer to flag it: if a Reddit draft ever names it, this rulebook needs a line.
5. **The thread entry's word floor, and the project's age.** Two loose ends from the same rule. Rule 20 pins a showcase-thread entry at 150 to 200 words so `body_min_words` (150) is satisfied, which is longer than a thread entry wants to be; the audit preferred a venue guard that relaxes the floor to 60 words inside a thread, which needs the runner to know the thread and not only the sub. Note that `body_min_words` is soft in the live gate, because `min_words` is not one of the hard kinds, so a shorter entry warns rather than blocking and no repair pass fires; the audit's note that called it hard was wrong about the live code. Separately, the audit proposed adding to rule 1 that the project's age comes from APP_PROFILE (repo created date, first release) and that the date used goes in warnings. That sentence is not in the live rule 1, so khoj's failure (a 2021 project drafted with the r/selfhosted New Project Megathread flair) is still uncovered, and r/commandline's 30-day limit lives only in rule 21.
6. **Two checks that cannot see what they need.** `warnings_present` runs `min_words` on each warnings line separately, because the gate reads an array element by element, so a short true line such as "Level 2." fires it; the fix is either to join an array field for `min_words` and `max_words`, or to replace the check with a `required_regex` on the joined warnings that also looks for rule 12's "model-assisted" phrase, which today has no check at all. Owner's call on which.
7. **`body_no_competitor_negative` is hard and matches idioms, not names.** "Kubernetes is overkill for this", or a sentence about the builder's own hosted edition charging for seats, would block the draft and spend the repair pass. The value keeps GLOBAL_RULES line 11's own words (locks, buries, overkill, charges for) and deliberately leaves out slow, bloated and clunky, which describe the builder's own limitation as often as a rival's product. Downgrade it to soft if the false-positive rate on real drafts is high.
8. **The product-name count is case-insensitive.** `countIn` compiles the stamped `app_name` with flags `gi`, so a product whose name is an ordinary word (Continue, Plausible) counts every ordinary use of that word in the body toward the cap of 2, and the check is hard. The audit asked for a case-sensitive count; the live code is case-insensitive.
9. **r/vscode is unverified.** Section 8 and section 13 record what failed. Until someone opens the rules page in a browser, rule 22 keeps the sub at Level 1 with no flair, which may be stricter than the sub actually requires.
10. **r/SideProject has no rules page.** The Wayback snapshot lists no formal rules, so the title format comes from the sidebar and the self-promotion limit is unknown. The `title_sideproject_format` check is hard on the strength of a sidebar line; and the 250-character minimum some drafts' warnings cite for this sub is r/startups rule 3, not r/SideProject's.
11. **Member counts.** r/artificial, r/SideProject and r/startups have no captured member count, and the counts that exist were read on 2026-09-11 from a mirror. They are context, not a decision input, but they will drift.
12. **The two older venue rows.** r/SideProject and r/startups sit in `venues.seed.ts` with their original one-line summaries and no snapshot source, while the eleven developer rows carry the verified summary and its source. Either bring those two up to the same standard or accept the difference.
