# Launch Kit: the Social Launch rulebook at version 4

Version 3 distilled six open-source skill packs into a rulebook. Version 4 reconciled every adopted rule against the code, closed 96 gaps where a rule had nothing enforcing it, and was tested by re-drafting all six posts for the same ten apps from their saved stores, so the profile, the angle and the pricing are identical and only the rules differ.

All four acceptance criteria pass. Zero hard-rule blockers on all sixty drafts, zero dashes and zero occurrences of the banned launch verb, zero invented person names where the first run had three, every draft stamped with the rulebook version it was written against, and every platform above its baseline with none regressing. The mean post score went from 3.03 to 3.52.

The gate caught and repaired twenty-three hard failures before a draft reached the store, each of them a failure the first run approved into the plan: the "it's not X, it's Y" template, two proof points where one is allowed, a product named three times at mention level 2, "54 times smaller than Google Analytics", and every over-length Show HN body.

What still fails is narrower and clearer than before. Thirty-three high or blocker issues remain across sixty drafts, and thirteen of them are one fault: the model asserts a product mechanism the profile does not record. Reddit and Show HN carry most of it, because both rulebooks require a technical paragraph the profile often cannot supply.

The brand check passed with flags on all three lenses and no blockers; its flags for Joe are recorded below unresolved, as the skill requires.

## Scores

One judge per app, never the agent that drafted, scoring each post 1 to 5 against the platform rulebook, GLOBAL_RULES and the brand rulebook. The v1 column is the same app's score in `docs/EVAL-10-APPS.md`.

| App | X | LinkedIn | Reddit | Product Hunt | Show HN | Newsletter | Mean | v1 mean |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hack-judge | 4 | 4 | 3 | 3 | 3 | 4 | 3.5 | 2.2 |
| excalidraw | 5 | 5 | 4 | 4 | 3 | 4 | 4.2 | 2.8 |
| cal-com | 4 | 4 | 3 | 4 | 3 | 4 | 3.7 | 2.5 |
| plausible | 4 | 3 | 3 | 4 | 3 | 4 | 3.5 | 3.0 |
| formbricks | 4 | 4 | 3 | 3 | 4 | 3 | 3.5 | 3.3 |
| documenso | 3 | 4 | 4 | 4 | 3 | 3 | 3.5 | 3.3 |
| dub | 4 | 2 | 3 | 4 | 2 | 4 | 3.2 | 3.2 |
| hoppscotch | 4 | 3 | 2 | 3 | 3 | 4 | 3.2 | 3.3 |
| continue | 4 | 4 | 4 | 3 | 2 | 4 | 3.5 | 3.2 |
| khoj | 4 | 3 | 3 | 3 | 4 | 4 | 3.5 | 3.5 |

| Platform | Baseline | Version 4 | Change |
| --- | --- | --- | --- |
| X | 3.6 | 4.0 | plus 0.4 |
| LinkedIn | 3.3 | 3.6 | plus 0.3 |
| Reddit | 2.7 | 3.2 | plus 0.5 |
| Product Hunt | 3.0 | 3.5 | plus 0.5 |
| Show HN | 2.8 | 3.0 | plus 0.2 |
| Newsletter | 3.5 | 3.8 | plus 0.3 |
| All six | 3.03 | 3.52 | plus 0.48 |

Two apps did not gain: hoppscotch fell 3.3 to 3.2 and dub held at 3.2. Neither is a rulebook regression. Hoppscotch's Reddit post lost a point for an invented limitation, and dub's LinkedIn and Show HN drafts carry the mechanism fault described below.

### The acceptance criteria, measured

| Criterion | Result |
| --- | --- |
| Zero hard-rule blockers on every draft | Pass, 60 of 60 |
| Zero dashes, zero banned verb, zero invented person names | Pass; the judges found no invented name, against three in the first run |
| Mean post score per platform at or above baseline, none regressing | Pass, all six above baseline |
| Every draft references the rulebook version it was written against | Pass, 60 of 60 stamped version 4 |

`docs/eval-10/acceptance-v4.json` holds the per-draft record, `judged-social-v4.json` the ten judge results.

## What changed in the rulebook

### The audit, source by source

Six auditors, one per platform, reconciled every USE and PARTIAL verdict in `docs/social-launch-skills-review.md` against three places: the rule in `apps/launchkit/rulebooks/<platform>.md`, the rule or hook in `apps/launchkit/src/lib/rulebooks.ts`, and the machine check in `apps/launchkit/src/lib/rulebook-checks.ts`. Every adopted rule now lands in exactly one of the last two. The sources were re-cloned the same day and read again rather than trusted from the earlier pass.

| Source | Commit read | Verdicts in the review | Where it lands now |
| --- | --- | --- | --- |
| Jakeschincariol/linkedin-agent-skill (MIT) | 2026-09-07 | 7 USE, 2 PARTIAL, 3 SKIP | LinkedIn rules and hooks; li-human's lexicon split between `lib/slop-lexicon.ts` (67 swaps applied before the gate) and the `slop_lexicon` warning check; li-reply and li-plan as warnings guidance only; li-audit one metric line |
| piupiuyao/reddit-founder-skill (no license, every rule rewritten) | 2026-02-25 | 1 PARTIAL | Reddit rules 1 to 2 (the venue rule and the five-level ladder), rule 7 (the existing tool), the pre-flight checklist as rules 8 to 12; the karma warm-up and the indie-SaaS table stay out |
| jamesgray007/hoai-course writing-x-posts (no license, ideas only) | 2025-12-18 | 1 PARTIAL, 1 SKIP | X rule 8 (the four thread shapes resized to 2 to 4 tweets) and the checklist as rules; not one sentence copied, no hook from its hooks.md |
| yoanbernabeu/producthunt-skills (MIT) | 2026-01-30 | 16 USE, 11 PARTIAL, 4 SKIP | Product Hunt rules and checks (the whole ph-safe-messaging phrase table is now checks), the newsletter pitch shape, the Show HN seed, and the operator sections that stay in the documents rather than the drafts |
| vm0-ai/vm0-skills hackernews (no license) | 2026-09-11 | SKIP for drafting | A monitoring pointer in `show_hn.md` and nothing else; every Show HN rule comes from the HN guidelines, dang's presenting-your-work comment and ph-community-outreach |
| HN guidelines, Show HN guidelines, dang item 22336638, HN formatdoc | read 2026-09-12 | n/a | Show HN rules 1 to 17, including the hand-rewrite warning the HN generated-text rule requires |
| Product Hunt launch guide and preparing-for-launch | read 2026-09-12 | n/a | The vote-ask wording, the three-tag cap, the name-field rule, the tagline limit |
| Verified subreddit rule snapshots (Wayback and a Redlib mirror) | July to September 2026 | n/a | The eleven-sub developer table in `reddit_post.md` section 8 and the same eleven rows in `venues.seed.ts` |

### What the reconciliation found

96 gaps (an adopted rule with nothing enforcing it) and 23 undocumented code items (a rule or check the document did not source). Both sets are closed: the gaps became rules, hooks or checks, and the undocumented items gained their source line.

Counts read from the code, version 3 at commit f1d43e5 against version 4.

| Platform | Rules | Hook patterns | Machine checks | Of those, hard |
| --- | --- | --- | --- | --- |
| X | 17 to 20 | 8 to 11 | 19 to 33 | 6 |
| LinkedIn | 18 to 24 | 8 to 10 | 27 to 33 | 3 |
| Reddit | 18 to 22 | 7 to 9 | 26 to 37 | 7 |
| Product Hunt | 16 to 20 | 8 to 12 | 17 to 37 | 7 |
| Show HN | 17 to 21 | 8 to 10 | 23 to 36 | 5 |
| Newsletter | 15 to 17 | 8 to 11 | 22 to 31 | 3 |
| Six platforms | 101 to 124 | 47 to 63 | 134 to 207 | 31 |

GLOBAL_RULES stayed at 12. A hard check is one a founder cannot post over: a platform cap, a required shape, a link where the platform forbids one, a vote ask, the banned launch verb.

### The mechanisms the rulebook needed

Four additions to the gate, all in `apps/launchkit/src/domain/gates.ts`, because several adopted rules could not be expressed before:

1. A per-check `hard` flag. A failed check used to be a blocker only if its kind was a cap or its id matched a pattern, so a vote ask, an over-length hook line and a broken shape were warnings the drive approved straight past. A check now declares itself hard, becomes a blocker, and triggers the repair pass in `api.ts runAsset`.
2. `required_regex`, a kind whose field must match rather than must not. The HN guidelines forbid generated text, so a Launch Kit Show HN draft must carry the hand-rewrite line as its first warning, verbatim; that is now a hard check on the warnings field.
3. A `when` guard, so a check can run for one venue only. The r/SideProject title format and the r/MachineLearning prefix apply to those subs and nowhere else; the runner stamps the venue it drafted for and the guard reads it.
4. Metadata fields excluded from the sweep. The runner stamps the venue, the product name, the rulebook version and the fix counts onto a draft; a check whose field is "all" must not read them as the draft's own words.

### The repair pass, and what it took to make a cap hold

A hard failure triggers a repair ask that names the cut in the units the check counts, and the draft with the smaller overage wins. The run showed one ask is not enough: told only its cap, the model trims to just over it. Documenso's Show HN went 267 words, then 234, both over the 200-word cap; cal-com's went 227 and formbricks' 252, and on those two neither repair attempt beat the original, so the first draft stood. The Show HN document records why: the model's own counts were wrong on every over-length draft, asserting "the lower end of the 100 to 200 word range" beside a gate count of 252.

Three changes, in `api.ts runAsset`:

1. The repair ask names the cut ("delete at least 49 words, whole sentences at a time") instead of restating the cap. Documenso then went 249 words to 196 in two asks, under the cap, in 123 seconds.
2. Two repair attempts, the second saying to delete a whole sentence or paragraph rather than words inside sentences.
3. A deterministic last resort when both asks fail. For a word cap the draft loses whole paragraphs from the middle, never the first (the opener) and never the last (the closing question); for a character cap it loses whole trailing sentences. The cut is kept only when the total overage strictly falls, so it can never trade one blocker for another, and it is recorded in `repaired` with a warning naming what went. Measured on the two bodies that defeated both asks: cal-com 227 words to 170 and formbricks 252 to 160, two blockers to zero each, first and last paragraphs intact.

The cap itself was left at 200. It is ours rather than HN's, and raising it to fit a model that cannot count its own words would have been the wrong repair.

### The deterministic sanitiser before the gate

`sanitizeDraft` replaced dashes and `cleanVerbs` swapped the banned launch verb already. `cleanSlop` now swaps the slop-lexicon terms that have a plain drop-in replacement (leverage to use, delve to look, myriad of to many), counted on the draft card beside the dash and verb counts. The lexicon entries with no safe swap (a deletion such as "notably", a word with a developer sense such as unlock or landscape, a hype word that needs a rewrite rather than a synonym) stay as the `slop_lexicon` warning check, and "harness" and "ecosystem" were dropped because they are RocketRide vocabulary.

The brand check then pruned eight more swaps, taking the lexicon from 67 to 59. Its reasoning is worth keeping: `robust to solid` replaced one evaluative adjective with another, and "Solid product" sits inside a FAIL example in brand rulebook 3.4; `multifaceted to complicated` turned a neutral word into a self-own in a launch post; `imagine a world where to imagine if` preserved the rhetorical opener GLOBAL_RULES bans; `move the needle to make a difference` traded filler for filler; and `paradigm to model` puts a loaded noun into a RocketRide context. A swap that changes the meaning is worse than the word it replaces.

### What the gate caught that version 3 approved

Independent of any judge: every row below is a hard failure the version 4 gate raised on a first draft and the repair pass then fixed, counted across the sixty drafts. The right column is the same failure in `docs/EVAL-10-APPS.md`, where it reached the plan approved.

| Fixed before the draft was stored | Times | The same failure in the first run |
| --- | --- | --- |
| `topics: More than 3 topics; Product Hunt's form accepts up to 3 launch tags` | 5 | Not checked in version 3; the tag cap is new in version 4 |
| `body: Body over 200 words` (Show HN) | 5 | Cluster 2: every Show HN body ran 241 to 307 words and was approved |
| `body: More than five paragraphs` (Show HN) | 3 | Cluster 2, the same drafts |
| `body: Product named three or more times in the body (the ladder says once)` | 2 | dub's Reddit post named the product three times at mention level 2 |
| `description: Description over 260 characters` (Product Hunt) | 2 | Cluster 2: over on three apps, approved |
| `alt_variants: An alt variant over 280 characters` | 1 | Cluster 20: alt variants unchecked |
| `post: Two traction numbers in the post; the rule allows one proof point` | 1 | Cluster 20: two proof points where one is allowed |
| `post: The "it's not X, it's Y" contrast in any form` | 1 | Cluster 20's lead example, approved on formbricks and hoppscotch |
| `first_comment: Maker comment over 250 words` | 1 | Cluster 2 |
| `pitch: Two proof points` (newsletter) | 1 | Cluster 20, on four apps |
| `body: Better-than-X positioning or a multiplier against a named product` | 1 | plausible's "the tracking script is 54 times smaller than Google Analytics", brand rulebook 4.1 |

Twenty-three hard failures caught and repaired before the draft reached the store. In the first run none of these fired as a gate hit, and the drafts carrying them were approved into the plan.

## The brand check

The skill ran over three surfaces in parallel: the six reference documents, every rule, hook, check description and lexicon pair in the code, and a judgment pass against brand rulebook sections 2 and 3 rather than its ban lists.

**Verdict: PASS WITH FLAGS on all three, no blockers.** Every hard-banned term the sweep found sits inside a rule or a regex that forbids it, which is how a rulebook has to read. The sweep is recorded in full so the next reviewer does not repeat it: the banned launch verb 0 hits in prose and 7 inside bracket-split regexes, em and en dash 0 in all six documents, hype words 15 hits all inside ban lists or rejected source formulas, the late-night cliche 0, hallucinated events 0, in-discussion partners 2 both benign.

### What it found in this work, and what was done

Two coverage findings and five style notes were real defects, all fixed after the drafts finished, as version 4 amendments:

| Finding | Fix |
| --- | --- |
| The deprecated one-key framing is checked on two platforms of six, so a draft carrying "One API key covers all your LLMs" passes the gate on four | The pattern is on all six, verified to catch both wordings on every platform |
| The adjective form of the banned verb is caught on two platforms while the X rule asserts it is banned everywhere | The adjective is in every banned-verb pattern and the sanitiser swaps it for releasable |
| Eight slop swaps are bad swaps | Pruned, 67 to 59, with the reasoning above |
| The LinkedIn contrast ban does not distinguish the empty template from the concrete contrast brand 3.3 rewards | The rule now says so in its first clause |
| A LinkedIn rule cites "section 1.2", which the model never receives | The rule states the framing itself |

The amendments landed after the sixty drafts, so they cannot have changed the measured result. That is checked rather than asserted: `amendment-safety.py` greps every draft field for the deprecated framing, the adjective form and all eight pruned terms and reports zero hits across all sixty.

### Flags for Joe, unresolved

The skill flags and does not decide, so these are recorded as written. All fall under brand rulebook 4.3, which records the foundation-model-provider mention policy as unconfirmed.

1. Reddit rule 7 requires every draft to name the obvious existing alternative and state a present-tense fact about it, within the first 120 words. When that alternative is OpenAI, Anthropic, Google or Meta, 4.3 wants the content routed for review, and nothing routes it. The rulebook concedes the point itself: "rule 7 still allows a neutral present-tense fact about a product from Google, OpenAI, Anthropic or Meta. Confirm the rule before this runs unattended."
2. Show HN rule 16 tells the model to name the stack once, model provider included. khoj's draft listed OpenAI, Anthropic, Google Gemini and DeepSeek as configurable providers: a stack fact rather than a comparison, but 4.3 says the checker may not make that call alone.
3. The account rules in 3.5 (Joe's personal account on dev forums carries no RocketRide mention) are carried on one platform of six. Reddit rule 19 caps the mention level when TONE or BRAND_DNA says the post is from Joe's personal account; X, LinkedIn, Show HN, Product Hunt and the newsletter have no equivalent, and Product Hunt has no 3.5 category at all.
4. Whether the section 1.1 ban extends to the adjective form is Joe's call. The amendment above made the code consistent with what the X rule already asserts, which is the stricter reading; reversing it means changing eight patterns and one rule together.

## What still fails

158 issues across sixty drafts, 33 of them high or blocker. Clustered by cause, with the judge's own evidence.

### 1. The model asserts a mechanism the profile does not record (13 of 33)

The largest remaining fault, and the one the rules already forbid. GLOBAL_RULES rule 12 tells a thin profile to stay general; Show HN rule 5 says never infer a mechanism from a name. Both were broken in the same sentence pattern.

hack-judge, whose site returned 503 so the profile holds no differentiator and no proof point, still got: "Hackathon Judge Aid is a web tool that takes hackathon submissions and a scoring rubric and produces a structured score sheet each judge fills in independently". Its Product Hunt maker comment asserts "Judges score submissions independently against the same criteria, and the app aggregates the results into a single ranked view", then the warnings on the same draft concede "Builder must re-analyze once the site is live and add at least one concrete, verifiable detail before launch".

Why it survives: the rule is prose, and no check can test whether a sentence names a mechanism the profile lacks. It needs either a check that extracts noun phrases from the draft and requires each to appear in the profile, or a second model pass whose only job is to strike unsupported claims.

### 2. An invented limitation where the profile records none (6)

Every platform rule requires one honest limitation, and the profile often has none, so the model writes one. cal-com: "the Platform API onboarding docs are thinner than I'd like. I don't have a clean fix for that yet", which is the same invented limitation the first run's judge flagged, reworded. formbricks: "The part that's still rough is the insights dashboard", built from a scraping gap rather than a product gap.

The v4 rule already says to use the profile's honest gap or a placeholder. It needs to be a hard check: when `profile.gaps` is empty, the limitation sentence must be the placeholder.

### 3. A competitor carries a claim or an adjective the profile does not hold (4)

cal-com's Reddit body: "Calendly's API handles basic booking data but it's not designed for embedding the full scheduling UI inside another product". Its X alt variant reproduces a competitor comparison the LinkedIn draft of the same run correctly refused. The neutral-competitor rule reaches the main body and not the variants.

### 4. Invention inside fields no check reads (2)

`alt_hook` and `alt_variants` are checked for length, dashes, links, the banned verb and hype, and for nothing else. hack-judge's alt_hook invents a scene and a number and offers it to the builder as a drop-in first line: "The rubric existed. Every judge at the hackathon had it. They still scored the same project four different ways." khoj's flattens a qualified privacy claim into an absolute the profile contradicts.

Every content rule that applies to the main field should apply to its alternates.

### 5. The length repair deleted required content (1)

cal-com's Show HN lost its how-it-works paragraph to the deterministic trim, so the body names no mechanism and no stack. The trim protects the opener and the closing question; it does not know that rule 3 requires the technical paragraph. A `required_regex` on the body would make the trim skip it, because the trim only keeps a cut when the overage strictly falls.

### The tension worth naming

Reddit and Show HN carry 18 of the 33 high or blocker issues, and both rulebooks require a technical paragraph plus a limitation plus prior art. When the profile is thin, those requirements and GLOBAL_RULES rule 12 pull in opposite directions, and the model resolves the conflict by inventing. The rules cannot both be satisfied; the rulebook should say which one yields, and it should be rule 12.

## What was fixed after the run

The owner settled the precedence question and asked for the flags that are not Joe's to be closed. Both landed after the sixty drafts, so the numbers above are the measurement of version 4 as tested; these changes are what version 4 enforces now. Counts went from 124 rules and 207 checks to 130 rules and 243 checks, 66 of them hard.

**The precedence, now rule 1 on all six platforms.** When a platform asks for something the profile does not hold, the thin-profile rule wins: write the shorter post, put the placeholder where the missing part belongs, and say in warnings which rule could not be satisfied. A short true post beats a complete invented one. This is the conflict that produced 18 of the 33 remaining issues on Reddit and Show HN.

**The profile reaches the gate.** Several adopted rules depend on the profile rather than on the words in front of them, and `gates.ts` took the draft and nothing else. A `when` guard can now read three pseudo-fields from a `GateContext`: `$thin` (the understand pass could not evidence the profile), `$noGaps` (the profile records no gap), `$ownApp` (the app being launched is RocketRide's own). That is what makes the next three checks possible.

| Fix | What it closes |
| --- | --- |
| `thin_profile_no_mechanism`, hard on all six: a mechanism verb pattern in a draft written from an unevidenced profile | The largest remaining cluster. An evidenced profile may state the same sentence; only a thin one may not |
| `limitation_placeholder_when_no_gap`, hard on Reddit, Product Hunt and Show HN: with no gap recorded, the limitation must be the placeholder | Cluster 2, the invented limitation, 6 issues |
| `alt_hook_no_invented_scene` and `alt_no_competitor_framing`, hard | Cluster 4 and part of 3: the alternates were checked for shape only, so an invented scene in a variant passed |
| `body_how_it_works_present`, a `required_regex` on the Show HN body | Cluster 5: the trim only keeps a cut when the overage falls, so a required sentence now survives it |

**The brand-check flags that are not Joe's, closed.** `no_financial_figures` is hard on all six, because brand rulebook 2.7 is absolute and the skill's own tiers make a financial figure a blocker, while the two checks that existed were soft. `rr_no_inference_claim` and `rr_two_entities` carry brand 1.2 and 2.6, which were absolute written policy that nothing enforced; both are scoped to `$ownApp`, because those rules bind RocketRide's own content and Launch Kit drafts a tenant's post in the tenant's voice.

**`approveAsset` refuses a draft with an outstanding hard failure.** This was the one finding that reached past drafting: the handler set `status: 'approved'` without reading `blockers`, so a founder could approve over the gate and the first run's evidence is that they do. It now throws with the failure named: "This draft still fails 1 hard rule: body: Body over 200 words (254 words, cap 200). Redraft it, or edit the draft until the check passes."

**Brand rulebook 4.3 is routed, not decided.** The policy is unwritten and Joe's to settle, so no rule here takes a position. What 4.3 asks of the checker is to flag a provider named in a comparative context and route it for review, and nothing routed. `provider_comparison_needs_review` is hard on all six: a comparative or adversarial mention blocks with the instruction to route the draft, and a neutral stack mention passes, which is consistent with 4.3's own working understanding that these providers are upstream infrastructure rather than competitors.

Verification: 22 assertions on the new checks (each fires in the situation it guards and is silent outside it), the false-positive probe over ten ordinary developer sentences still clean, every check compiles, four assertions on the approval guard, and the typecheck passes.

## The venue list, verified rather than adopted

`github.com/mmccaff/PlacesToPostYourStartup` (7,369 stars, CC0-1.0, link-checked in CI) is a compiled list from a 2014 "Ask HN: where can I post my startup to get beta users?" thread: 19 subreddits and 82 websites, name and URL only, no rules information. Every entry was fetched, and the ones that render through JavaScript were opened in a browser.

**Three of the 82 earned a place**, and they are in `venues.seed.ts` with their terms quoted and dated:

| Venue | Why it passed |
| --- | --- |
| Awesome Indie | Free, community-ranked, "the indie products launching today"; 10,133 makers |
| Launching Next | States it plainly: "Submitting to Launching Next is free", reviewed daily, and the paid upgrade buys only a faster decision |
| Betabound | "Request a free announcement of your beta testing opportunity", curated, and only for an app that has a real beta programme |

**The rest were rejected with cause.** Collaborizm is shut down (its homepage now points at a Substack about the company's story); Launched fails DNS and Loop fails SSL. eBool ($47 to $197), Postmake ($79 to $199) and TinyLaunch ($29) sell the listing. TinyLaunch advertises "a Badge & 72+ DR Backlink", SaaSRow "free listings with DoFollow backlinks", LaunchIgniter runs a "Link Exchange" and a "Directory Submission Service", and PitchWall's own submit page sells "Sponsored Guest Post" and paid-backlink protection. Side Projectors sells side projects, Starter Story is a revenue database, BetaTesting is a paid research panel, and the investor databases and press contacts are a different action entirely. Their 19 subreddits contain no developer sub at all, so ours stay as they are.

**The verification was worth more than the three venues.** It showed the startup-directory space is largely a paid-backlink economy, and that `lk_targets.pipe` had no rule against it: the pipe never mentioned paid placement, sponsorship or backlinks, and `gateTargets` demotes by venue kind, so a backlink farm calling itself a launch platform passed straight through. Targets discovers venues by search, which is exactly where those rank well. The pipe now carries a rule: a venue that sells the listing, advertises a DoFollow backlink or a domain-authority number, runs a link exchange or a paid submission service, or charges before a human sees the product, is not a launch venue; a free path with an optional paid fast-track is fine, and the row must say the paid tier only buys speed.

### What the test found

A backend end-to-end test over the store, the seed, the rulebook, the gate, the Targets question, the pipe, `gateTargets`, the asset and signals gates and the plan: 51 assertions. It failed first time, on a real defect: `seedVenuesIfEmpty` builds its insert field by field and never copied `rules_source`, so the provenance added for all thirteen subreddits and these three venues existed in the seed file and nowhere else. Fixed on the insert and the update path.

A live Targets run then proved it through the app rather than in a unit test. khoj's saved store held 51 venue rows, none carrying `rules_source` and none of the three new venues, so it predated both changes; after the run the store holds 55 rows, the three venues are in it, and `rules_source` is backfilled on fourteen rows. The same run showed the established-product rule working on a real ranking: Show HN moved from first to seventh and Product Hunt from sixth to eighth for a product with more than 30,000 stars, while the niche subreddits (r/selfhosted, r/LocalLLaMA, r/ObsidianMD, r/emacs) took the top places. No paid-placement venue appeared in the ranking.

Both live runs were driven from a seeded copy of the app's store and the draft record was restored afterwards, because `drive.rerun.mjs` writes to one output file per app: seeding it from the first-run store and saving over `appstate.rerun.json` discards the re-run drafts already in it. The driver now continues from the previous re-run by default, and `docs/eval-10/targets-verification-v4.json` holds the venue counts and the ranked list from both runs.

A second live run tested the opposite case, because a venue that never gets chosen is not worth seeding. hack-judge is an alpha on a free tier whose profile the understand pass could not evidence, and there Betabound ranked ninth with the reason "Beta-tester recruitment platform; alpha app needs early users who are hackathon organizers willing to test", above Product Hunt and the directories, in a list led by BetaList, r/hackathon and r/AlphaAndBetaUsers. So the venue is picked for the maturity its rules row describes and passed over for a launched product, which is what the row asks for.

## Next

Ranked by how many of the 33 remaining high or blocker issues each would close. Items 2 to 5 of the original list are done above.

1. Re-run the sixty drafts against the rulebook as it now stands. Everything above this line was measured on version 4 as tested; the precedence rule and the eleven new checks have unit evidence but not a full run behind them. This is the first thing to do.
2. A semantic claims pass for an evidenced profile. `thin_profile_no_mechanism` closes the thin-profile case deterministically, but on a rich profile a mechanism claim can still be wrong in a way no pattern sees: cal-com's Show HN "asserts the exact claim the profile's own confidence note says could not be confirmed". The honest fix is a second model pass whose only job is to strike sentences whose factual content is not in the profile, run on the Reddit body, the Show HN body and the Product Hunt maker comment. `src/data/api.ts runAsset`.
3. The newsletter close "Happy to send screenshots or answer anything your readers ask" is identical in all ten apps, lifted from the rule's own example. Product Hunt already bans rulebook-phrase reuse; the newsletter rulebook needs the same check. `rulebook-checks.ts`.
4. documenso's X post carried an ungrammatical core claim through both runs ("Documenso is self-hostable, embeddable, and fully compliant e-signatures"). A subject-complement agreement fault is not machine-checkable; it belongs in the redraft loop's feedback, not the gate.
5. The posting-account signal. Brand rulebook 3.5 varies the rule by account and the pipe has no account field, so Reddit rule 19 can only fire when the builder says so in TONE. Pass an ACCOUNT signal into `buildAssetQuestion` and default it to the builder's own account. `src/domain/questions.ts`.
6. Label the Show HN card "outline, rewrite by hand before submitting" and drop copy-to-clipboard on that asset type, which is the recommendation the HN generated-text rule leaves standing. `src/components/launchkit/stages/assets-stage.tsx`.
7. Joe's two flags, both the same unwritten brand rulebook 4.3 policy: whether a foundation model provider may be named in a comparative context at all, and whether Show HN rule 16's stack sentence may name one as a fact. Routing is in place; the policy is not.
