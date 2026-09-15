# Show HN rulebook

Platform id: `show_hn`. Drafting target: the RocketRide Wave agent in `pipelines/lk_assets.pipe` (ASSET_TYPE=show_hn, output `{title, body, warnings}`), seeded into the `platform_rules` table from `src/lib/rulebooks.ts`. Written 2026-09-11 from the review in `docs/social-launch-skills-review.md` (HN row, next step 6), and reconciled against the code on 2026-09-12 for rulebook version 4. This file is the reference, and as of version 4 it quotes what the code actually sends: the rules and hooks below are the live entries in `DEFAULT_RULEBOOKS`, and the checks below are the live entries in `RULEBOOK_CHECKS`. Version 4 carries 21 rules, 10 hook patterns and 36 machine checks.

Draft shape: a title plus a body that aims for 150 words and never leaves the 100 to 200 band. On HN the body goes in the submission's text field and appears under the title; the app link goes in the submission's url field.

## What a Show HN is, in HN's own terms

Show HN is for something you made that other people can try. The thing must exist and be usable today: things people can run on their computers or hold in their hands. Blog posts, sign-up pages, landing pages, newsletters, lists and fundraisers are off topic. The project should be non-trivial: a quickly generated one-off is off topic, because anybody can produce one of those now, and what belongs there is something personal and interesting to you, with how and why explained. It should be something you worked on personally and are around to discuss. It need not be polished; early-stage work is welcome. Make it easy to try, ideally without a signup or an email. New releases of something already shown are only substantive enough if they are a major overhaul. Do not ask friends to upvote or comment. (Paraphrased from https://news.ycombinator.com/showhn.html.)

One Launch Kit condition sits on top of that page. When the profile behind a draft is thin (confidence under 0.5, or `analysis_degraded` true), `buildAssetQuestion` in `src/domain/questions.ts` adds a THIN_PROFILE block after PLATFORM_RULES and before CAMPAIGN_ANGLE, and that block overrides every hook and every rule below that asks for a story, a limitation or a how-it-works paragraph: describe the app only in the words of its one-liner and category, name no feature, workflow or step it does not state, and where a rule wants the builder's story write the placeholder. A short true draft beats a long plausible one, which is also the HN reading.

## Sources used

| Source | Where | License | Version seen | Used for |
| --- | --- | --- | --- | --- |
| Show HN guidelines | https://news.ycombinator.com/showhn.html | Y Combinator page, no open license; paraphrased, never copied | fetched 2026-09-11 | what qualifies, the no quickly-generated one-offs line, try-it rule, no vote asks, repeat-release rule |
| Hacker News guidelines | https://news.ycombinator.com/newsguidelines.html | same | fetched 2026-09-11 | title rules (no uppercase, exclamation, site name, gratuitous numbers, editorializing), no solicitation, the generated-text rule, comment conduct |
| dang, tips on presenting your work | https://news.ycombinator.com/item?id=22336638 (posted 2020-02-15, edited 2026-03-28), read via https://hacker-news.firebaseio.com/v0/item/22336638.json | author's comment; paraphrased | fetched 2026-09-11 | clear statement of what it is, backstory, what is different, no marketing language, no landing pages, easy to try, personal username, no booster comments, the repost rule and its "once or twice a year, more starts to be excessive" tail, hand-written text |
| HN formatting help | https://news.ycombinator.com/formatdoc | same as guidelines | fetched 2026-09-11 | plain-text rendering: blank lines for paragraphs, asterisks for italics, indent for code, URLs in a submission's text are not linked |
| ph-community-outreach, Hacker News section | https://github.com/yoanbernabeu/producthunt-skills, `skills/marketing/ph-community-outreach/SKILL.md` (HN section from line 188; the Show HN template at lines 197 to 215) | MIT | commit 5acfd60, 2026-01-30 | the body skeleton (technical details, specific questions), the HN avoid list (marketing speak, "AI-powered" without substance, voting rings, complaining about downvotes) |
| vm0-skills hackernews | https://github.com/vm0-ai/vm0-skills, `hackernews/SKILL.md` | no license file in the repo | commit a5a7935, 2026-09-11 | monitoring only; contains no drafting guidance |
| RocketRide brand rulebook | `.claude/rules/skills/brand-check/references/rulebook.md`, sections 1 to 3, plus 4.1 | internal | 2026-08-19 | banned verb, no dashes, no hype, no ranking comparisons, no invented numbers, show don't tell, account tone rules |
| li-human slop lexicon | https://github.com/Jakeschincariol/linkedin-agent-skill, `skills/li-human/slop.json`, distilled into `src/lib/slop-lexicon.ts` | MIT | commit add2c23, 2026-09-07 | the 67 swap entries `cleanSlop` applies to every Show HN field except `warnings` before the gate runs |
| Launch Kit ten-app evaluation | `docs/EVAL-10-APPS.md` (findings and clusters), `docs/eval-10/judged.json` (per-app issues), `docs/eval-10/*/appstate.json` (the ten Show HN drafts) | internal | run and judged 2026-09-11 | every version 4 rule change and all 13 new checks; the word-count, invented-origin, invented-limitation, rule-echo, mixed-person and self-count findings |
| Launch Kit current defaults | `src/lib/rulebooks.ts` (show_hn entry, `GLOBAL_RULES` 1 to 12, `RULEBOOK_VERSION`), `src/lib/rulebook-checks.ts` (`RuleCheck.hard`, `when`, `required_regex`), `src/domain/gates.ts` (`gateAsset`, `runRulebookCheckHits`, `META_FIELDS`, `countIn`), `src/domain/sanitize.ts`, `src/domain/questions.ts` (THIN_PROFILE), `src/data/rules.ts` and `src/data/seed.ts` (version and source), `src/data/api.ts` (`runAsset`, the repair pass), `pipelines/lk_assets.pipe` line 36 | internal | working tree 2026-09-12 | output shape, the word budget, the live rules and hooks, hard and soft handling, the sanitiser order, the store's staleness rule |
| Launch Kit legacy Python gate | `launchkit/backend/app/rr.py` `gate_asset`, ported to `src/domain/gates.ts` | internal | ported before the rulebook checks existed | the standing "title must start with 'Show HN:'" warning that still runs beside `title_required_prefix` |
| RocketRide, this task | the reconciliation recorded in `docs/social-launch-skills-review.md` (status section, 2026-09-12) | internal | 2026-09-11 and 2026-09-12 | the hook shapes, which no source skill supplies, and the checks and rule clauses no source supplies: read-failure leaks, internal uncertainty, rule echo, self-counts, mixed person |

## The conflict every draft must carry

HN's guidelines (In Comments) say: do not post generated text or AI-edited text, HN is for conversation between humans. dang's presenting-tips comment, in its 2026-03-28 edit, goes further: write your text by hand, do not use an LLM to generate any of it, not even to edit or spruce it up, because LLM language leaves imprints that draw backlash on HN.

Launch Kit's Show HN draft is LLM-generated by construction. The honest position is that the draft is a briefing outline: it tells the builder what to cover, in what order, and at what length, and the builder types the real post themselves. Rule 6 makes the drafting model put that instruction first in `warnings` on every draft, and since version 4 the `warnings_hand_rewrite_first` check enforces it as a hard failure: the first warning must match the line character for character, and a draft that misses it carries a blocker and cannot be approved. The hook patterns below are fill-in shapes for the builder, not sentences to paste.

Recommendation for the app, still not done: label the Show HN card "outline, rewrite by hand before submitting" and do not offer copy-to-clipboard on this asset type. As of 2026-09-12 `src/components/launchkit/stages/assets-stage.tsx` renders every asset type through the same `CopyButton`, with no per-type label, so the recommendation stands.

## Rules adopted

The live rules, in the order `rulesBlock` sends them to the model, numbered 1 to 21. Each entry gives the text the drafting model receives, then where it came from and what changed for version 4. Rules 18 to 21 are new in version 4. A reference to GLOBAL_RULES N in this file means the Nth entry of the `GLOBAL_RULES` array counting from 1, all 12 of which `rulesBlock` appends after the platform rules and the hooks.

1. Title: start with exactly "Show HN: " then state what the thing is in plain words, 80 characters max including the prefix. Count the characters yourself before returning; if over 80, cut the description, never the name. Pattern: "Show HN: <Name>, <what it does for whom>" or "Show HN: <what it does>". No superlatives, no "AI-powered", no exclamation marks, no version numbers unless it is a major overhaul, no domain name unless it is the product's own name (HN shows the domain next to the title), a comma between name and description, never a dash.
   From: HN guidelines (no uppercase or exclamation, no site name, crop gratuitous numbers, do not editorialize); Show HN guidelines (title begins with "Show HN"); HN's submit form limit of 80 characters; the ph-community-outreach avoid list ("AI-powered"). Changed in v4: the model is now told to count the characters itself and what to cut when it is over, and the no-domain rule carves out a product whose name is a domain. Evidence: the ten-app evaluation, cluster 2, where excalidraw's title ran to 84 characters and cal-com's to 82 while both drafts claimed 79, and cal-com's own name is a domain.

2. Body, first sentence: say what the project is and what it does, naming the input and the output, so no reader has to ask "what is this". Shape: "<Name> is a <kind of tool> that takes <input> and produces <output>." You may put "Hi HN," in front of it, with a comma, nothing else.
   From: dang ("Include a clear statement of what your project is or does. If you don't, the discussion will consist of 'I can't tell what this is'"). Unchanged in v4. The template's "Hey HN!" had already become an optional "Hi HN," with no exclamation mark.

3. Body order: aim for 150 words, never more than 200 and never fewer than 100. Count the words before you return; if over 200, delete whole sentences, never excuse the length in a warning. 3 to 5 paragraphs separated by blank lines, and "Hi HN," belongs to the first paragraph, not on a line of its own: (1) what it is and how to try it, (2) why you built it, (3) how it works technically, (4) what is different and what it cannot do yet, (5) the one question you want answered. Plain text only: no markdown headers, no bold, no bullet symbols, no numbered lists. HN renders none of them.
   From: dang (clear statement, backstory, what is different); ph-community-outreach HN template (technical details, then specific questions); HN formatting help (blank lines separate paragraphs, asterisks italicize, indent is code, nothing else renders). Changed in v4: the band became a target of 150 with a count instruction, over-length text is cut by deleting whole sentences, and "Hi HN," is pulled into the first paragraph. Evidence: cluster 2, where all ten bodies landed between 241 and 307 words against the 200 cap (mean 278), and cal-com spent a paragraph slot on a bare "Hi HN," line.

4. How to try it: one sentence saying what {APP_URL} opens and whether it needs an account. {APP_URL} must be the running thing itself, never a landing page, waitlist, video-only page or Product Hunt page. If APP_PROFILE shows a signup or email gate, say so plainly in the body and add a warning. Write {APP_URL} once in the body, on its own line; HN does not turn URLs in a submission's text into links.
   From: Show HN guidelines (easy to try, no signups or emails, no landing pages or fundraisers); dang (not a landing page, market test, fundraiser, blog post or curated list); HN formatting help (URLs in the text field are not linked). Changed in v4: the own-line placement moved from advice to a requirement, and two checks now enforce it (`body_link_present`, `body_app_url_own_line`). A Product Hunt page stays excluded explicitly, because the source skill frames HN as a Product Hunt funnel and HN's own "do not use HN primarily for promotion" rule cuts against that.

5. How it works: 2 to 4 sentences naming only what APP_PROFILE or BRAND_DNA records: tech_stack names, a README architecture line, a documented data path. State a data flow (what is written where, what runs at the edge, what streams over what) only when the profile records it; from stack names alone, list the names and stop. Never infer a mechanism from a name. Use specific nouns ("a Postgres table", "a single Go binary"), never "AI-powered", "smart", "intelligent" or "powerful".
   From: ph-community-outreach HN template ("Technical details: built with, interesting technical challenge"); dang ("technical details are great", "use factual, direct language"); brand 3.1 (show, don't tell); GLOBAL_RULES 12 (a thin profile gets no added mechanism). Changed in v4: the old wording asked for "where data goes and what runs where", and the model supplied it from nowhere. Evidence: dub's draft routed click events to Upstash and Tinybird, and khoj's described a setup time, from profiles that list stack names only.

6. warnings must always contain this exact line first, verbatim, periods included: "HN guidelines ask that posted text be written by hand, not generated or edited by an LLM. Treat this draft as an outline: rewrite every sentence in your own words before submitting." Every further warning names something the builder must verify: the earlier HN thread when the profile shows one, a signup or email gate at {APP_URL}, an app that cannot be tried today, a how-it-works paragraph the profile could not fill, a sentence that reads as a sales pitch. A warning never states a word or character count; the gate counts and its count stands.
   From: HN guidelines ("Don't post generated text or AI-edited text"); dang's 2026-03-28 edit. Changed in v4: "verbatim, periods included" states what the new `warnings_hand_rewrite_first` check tests; the rule now says what every further warning must be about; and self-counts are banned. Evidence: the model's own counts were wrong on every over-length draft ("The title is 79 characters" on 84, "the lower end of the 100 to 200 word range" on 252) and sat beside the gate's correct count.

7. Never ask for votes, comments, shares, stars, follows or "support". Never mention upvotes, the front page, ranking, launch day, or that you are "launching" anything. HN bans vote solicitation and readers report it.
   From: HN guidelines ("Don't solicit upvotes, comments, or submissions"); Show HN guidelines ("Please don't ask friends to upvote or comment"); ph-community-outreach ("Don't ask for upvotes (ever)", voting rings get you banned). Unchanged in v4 as rule text; its check was widened and made hard, and now sweeps every field (see `body_no_vote_ask`).

8. No marketing language anywhere: never "excited", "thrilled", "proud", "launching today", "join us", "sign up now", "limited", "the future of", "next generation", "game on". No exclamation marks, no emoji, no hashtags, no call to action other than the one question.
   From: dang ("Drop any language that sounds like marketing or sales. On HN, that is an instant turnoff"); ph-community-outreach avoid list ("Marketing speak"); brand 1.3 and 3.1; GLOBAL_RULES 2 and 7. Unchanged in v4. The emoji half of it finally has a check (`no_emoji`), which the version 3 table promised and the code did not carry.

9. What is different: one sentence stating the design decision that sets it apart, as a fact about the approach ("it runs entirely in the browser", "it stores the index as a flat file"), in your own words. Name prior art only as a neutral noun (what it is, its public price); never a parenthetical or clause that grades it ("closed, branded, no API worth building on"), never "the only real option was", never "every tool we tried", never "better than", "unlike bloated X", "X killer" or any comparison that ranks another tool.
   From: dang ("explaining what's different about it"); brand 4.1 (never "better than X"; state facts, do not editorialize them); GLOBAL_RULES 11 (a competitor named only as a neutral fact). Changed in v4: "in your own words" was added because six of ten bodies opened paragraph four with this rule's own example phrasing, and the grading clause is now named as the pattern to avoid. Evidence: cal-com's body reduced Calendly to "closed, branded, no API worth building on", which ranks nothing explicitly and so passed the old ranking check.

10. Limitations: up to three, each one taken from APP_PROFILE (a gap it records, a plan-only feature, a missing platform, an early stage). If the profile records none, write exactly "Limitation: [builder to add one]" as its own sentence and add a warning. Never a limitation the profile does not state, and never a read failure of the analysis (a 404, an unreachable page, a missing screenshot) dressed as a product gap. State them flat; no "but", no roadmap promise; a number only if it is in proof_points.
    From: Show HN guidelines (need not be complicated or slick; early stage is fine); GLOBAL_RULES 10 (never invent a limitation). Changed in v4: the old "2 or 3 concrete things" was a standing instruction to invent, and it beat GLOBAL_RULES 10 on every app in the evaluation; the count is now a ceiling bound to the profile, with a placeholder when the profile holds nothing, and the platform rule yields to GLOBAL_RULES 10 rather than competing with it. Evidence: limitations manufactured on seven apps, including cal-com's three-part list that appears nowhere in its profile.

11. Close with exactly one specific question about a choice the profile shows (a storage format, a deployment path, a listed limitation, a stack decision), never an internal debate the profile does not mention. Then one sentence that you will be in the thread: "I built it and will be in the thread" for a solo builder, "I am one of the builders and will be in the thread" for a team. Never "let me know what you think", "any feedback welcome", or "genuinely".
    From: ph-community-outreach HN template, lines 210 to 213 ("I'd appreciate any feedback, especially on: a technical question, a UX question"), rewritten; Show HN guidelines ("which you're around to discuss"). Changed in v4: the question must attach to a choice the profile shows, the team sign-off got its own wording, and "genuinely" is banned outright. Evidence: documenso's closing question invented an iframe-versus-widget debate, and five drafts used "genuinely" straight out of the old rule text.

12. Numbers: no star, fork, user, customer, subscriber or download counts at all, even when proof_points holds them; on HN they read as a pitch. Any other figure (a size, a latency, a throughput) only if it appears in APP_PROFILE.proof_points, once, with its unit and how it was measured. No speed multipliers ("ten times faster") or benchmark claims from anywhere else. If proof_points is empty, the body has no numbers about performance or adoption at all.
    From: brand 2.7 and GLOBAL_RULES 5 (never invent metrics, users, testimonials or benchmarks); HN guidelines (gratuitous numbers); the lk_assets.pipe GLOBAL rule (only proof_points). Changed in v4: a social-proof count is now banned even when it is in the profile, where the old wording let it through. Evidence: excalidraw's body carried "131,595 GitHub stars" and continue's "5,359 forks", and khoj's warning read the old rule the other way. The unit-and-method requirement stands, and the Indie Hackers "Key Numbers" block in the source skill (MRR, beta users, lines of code) stays dropped.

13. Vocabulary: never the verb spelled s-h-i-p in any form (s-h-i-p-s, s-h-i-p-p-e-d, s-h-i-p-p-i-n-g); write launched, released, deployed, delivered or built. Adjectives at most one per sentence and only ones that name a checkable property (local, offline, single-binary, open source); no intensity adjectives without a number behind them.
    From: brand 1.1 (the banned launch verb); brand 1.3 and GLOBAL_RULES 8. Unchanged in v4. The hype word list became a rule about adjective type, because a list never covers the next synonym, and the verb is spelled letter by letter so the rule text itself passes the brand sweep.

14. Why you built it: 1 or 2 sentences in first person, only from what APP_PROFILE or BRAND_DNA records (a README history line, a founder quote, a dated origin). When the profile has none, state the problem in the present tense from icp.pain and write "[Builder: one sentence on why you built it]" as its own sentence. Never a previous company, a previous tool, a hackathon, a wall you kept hitting, or any moment the profile does not record; never "I noticed that many developers struggle with".
    From: dang ("Include text giving the backstory of how you came to work on this... That tends to seed discussion in a good direction"; "Personal stories and technical details are great"); GLOBAL_RULES 10. Changed in v4: the old "a personal, concrete story" was an instruction to invent whenever the profile holds none, which was every profile in the evaluation; the source is now bound to the profile, with a placeholder otherwise, so the platform rule yields to GLOBAL_RULES 10 instead of overriding it. Evidence: an origin invented on all ten apps, including formbricks' "at a previous company" and hack-judge's "after co-judging a university hackathon".

15. Voice: one person throughout: "I" for a solo builder, "we" for a team, per APP_PROFILE, never both in one post; a team member who signs off alone writes "I am one of the builders", not "I built this". Short declarative sentences averaging under 20 words, one idea per sentence, no rhetorical questions, no jokes, no self-deprecation about the code, no thanks in advance.
    From: brand 3.1 (punchy, direct, brevity, developer-first); GLOBAL_RULES 3 and 6 (no rhetorical-question openers; first person in the builder's voice). Changed in v4: "never both in one post" and the team sign-off wording. Evidence: five of ten drafts switched person between the origin paragraph and the closer, cal-com and excalidraw from "We built" to "I built", and documenso, khoj and dub through the hybrid "I built this with the team".

16. Mention the stack the app runs on (language, framework, platform, model provider) once, as a fact inside the how-it-works paragraph, never as a recommendation or a pitch for that platform.
    From: brand 3.5 (dev forums: personal accounts carry no product pitching; the platform is mentioned only where it genuinely fits); dang (technical details welcome). Unchanged in v4: the platform is a stack fact, stated once. The account rule itself (no RocketRide mention from Joe's personal account) still cannot be decided by the drafting model; see the open questions.

17. If APP_PROFILE, its proof_points, a README badge or BRAND_DNA shows an earlier HN thread (a news.ycombinator.com/item link, an "N points on HN" badge), name that submission in the first warning after the hand-rewrite line, link it in the body and say in one sentence what changed since. If the profile shows a product launched more than a year ago or a version past 1.0 with no thread recorded, still warn that HN accepts a repeat Show HN only for a major overhaul, about once or twice a year, and tell the builder to search HN for the earlier thread before posting.
    From: dang ("Include links to any previous HN threads that are relevant"; repost only when significantly different, with a comment linking the previous thread; "once or twice a year, more starts to be excessive"); Show HN guidelines ("New features and upgrades generally aren't substantive enough"). Changed in v4: the trigger widened from a literal thread link to a badge, a points mention, an age past a year or a version past 1.0, and the warning must now name the submission. Evidence: khoj, public since 2021 with v1.0.0 in 2023, drew no repeat warning at all, so Targets ranked Show HN first for it; dub's README badge links item?id=32939407 and formbricks' profile records 122 HN points.

18. Never make an absolute claim about the field: not "no other tool does this", not "every tool we tried was closed", not "the only real option was X". HN readers name the counterexample within minutes. Name prior art by name in one neutral clause, or say nothing about the field.
    New in v4. From: dang ("Use factual, direct language"); brand 4.1; RocketRide, this task. Evidence: documenso's body said "every available tool was closed-source, expensive at volume" while DocuSeal and OpenSign exist, and neither that nor cal-com's grading parenthetical was caught by the ranking check, because rule 9 only forbade ranking words.

19. A read failure of the analysis is never a fact about the product. A page that returned 404 or 503, a repo that could not be reached, a screenshot that was not found, a field the profile could not fill: these go in warnings, never in the body, and never become a limitation.
    New in v4. From: RocketRide, this task. Evidence: GLOBAL_RULES 10 points the model at the profile's honest gap, and on two apps that gap was Launch Kit's own scrape artifact: plausible's body published "The /pricing page currently returns a 404" and hoppscotch's published an unlisted Enterprise price for a site that publishes one.

20. Never write what you do not know into the body ("I do not know yet whether it needs an account", "I will fill in the stack later", "the details I can share are limited"). Where the profile is silent, write the placeholder [Builder: what to add] as its own sentence and put the open question in warnings.
    New in v4. From: RocketRide, this task. Evidence: hack-judge's body published its own uncertainty on three points, including "I do not know yet whether it requires an account"; no builder would submit that, and the placeholder convention already exists in GLOBAL_RULES 9 and 10.

21. Write in the builder's words, not the rulebook's. Never reuse the rule text itself ("the design decision that sets it apart", "one question I genuinely want answered", "stated plainly"), never the word "genuinely", and never a sentence that another platform's draft for this app already uses.
    New in v4. From: RocketRide, this task. Evidence: six of ten bodies opened paragraph four with rule 9's example phrase and five used "genuinely" from rule 11; an HN reader who sees ten posts built from the same phrases calls them generated, which is the one verdict this rulebook exists to avoid.

## Mechanical checks

The 36 live checks for `show_hn`, from `RULEBOOK_CHECKS` in `src/lib/rulebook-checks.ts`, run by `runRulebookCheckHits` in `src/domain/gates.ts` after `gateAsset` has done its own two sweeps. Each failure becomes one warning line in the shape `field: description (evidence)`.

How the gate reads a check:

- `RuleCheck` is `{ id, description, kind, value, field, flags?, hard?, when? }`. Kinds in use here: `max_chars`, `min_words`, `max_words`, `max_count`, `forbidden_regex`, `required_regex` (the field must match) and `required_prefix`.
- Hard or soft. The gate honours an explicit `hard` first. With none set, a check is hard when its kind is in HARD_KINDS (`max_chars`, `max_words`, `required_prefix`, `required_regex`, `max_count`) or its id matches HARD_IDS (`banned_verb`, `brand_banned`, `s_word`, `raw_links`, `raw_urls`, `url_in_body`, `link_present`, `link_once`, `url_at_most_once`, `url_max_once`, `vote_ask`, `vote_or_reciprocity`, `no_dash`, `no_dashes`). A hard hit is pushed to `data.blockers` as well as `data.warnings`, blocks approval, and triggers the one repair pass in `runAsset`. Five `show_hn` checks carry the flag in the file: `body_no_vote_ask`, `warnings_hand_rewrite_first`, `body_link_present`, `body_app_url_own_line` and `body_no_read_failure_leak` are all `hard: true`. The table below states the effective value, which is what the builder sees. Note that `min_words` is not a hard kind: a body under 100 words is a warning, while a body over 200 is a blocker.
- Regex flavour: JavaScript. The gate compiles a `forbidden_regex` with the check's own `flags` when it sets one, otherwise with `iu` when the value carries a `\u{...}` escape and with `i` otherwise. Four checks set flags here: `no_emoji` uses `iu`, and `body_link_present`, `body_app_url_own_line` and `all_no_caps_run` use the empty string, so those three are case-sensitive. A `required_regex` compiles with `flags ?? ""`, so `warnings_hand_rewrite_first` is case-sensitive too. A pattern JavaScript cannot compile is skipped, never fatal.
- `required_regex` tests the first entry of the field only: for an array such as `warnings` that is the model's first line (the gate's own lines are appended after it), and for a string field it is the whole string. A miss is a hit, reported as `starts "<first 40 characters>"`, or `empty` when the field is absent.
- `max_count` does not count characters. `countIn` picks what to count from the id: an id containing `url` counts the literal `{APP_URL}` token, one containing `raw_links` counts `https?://`, one containing `paragraph` counts blank-line separators after first removing any line that holds nothing but the link, one containing `product_name` counts the stamped `app_name`, and anything else counts hashtags. All three `show_hn` `max_count` checks land on one of the first three branches.
- The `when` guard (`{ field, regex }`) runs a check only when another field matches, which is how the venue-scoped Reddit title checks read the `venue` the runner stamps. No `show_hn` check uses it: nothing here is venue-scoped.
- A check whose field is `all` or `*` sweeps every string field, and every string inside an array field, except META_FIELDS: `warnings`, `blockers`, `repaired`, `venue`, `app_name`, `rulebook_version`, `rulebook_source`, `punctuation_fixed`, `wording_fixed` and `slop_fixed`. Those are stamped by the runner and the gate, not written by the model, so an `all` check never reads them. That is what keeps `body_no_vote_ask` from firing on a warning that says the draft must not ask for votes, and what lets `warnings_no_self_count` name `warnings` explicitly when it does need to read them.
- Writing conventions in this file: dash classes are written as unicode escapes and four hype words are bracket-split, so this document stays clean under the brand sweep while the patterns still match the real words. A pipe inside a table cell is written `\|` so the table renders; the engine sees a bare pipe. The dash class is written the same way in both places: `rulebook-checks.ts` holds the TypeScript literal `[\u2012\u2013\u2014\u2015]`, so the value the engine compiles is a class of the four real characters.

| id | kind | value | field | hard or soft | what it catches |
| --- | --- | --- | --- | --- | --- |
| title_required_prefix | required_prefix | `Show HN: ` | title | hard | A title that does not open with exactly "Show HN: " (Show HN guidelines) |
| title_max_chars | max_chars | 80 | title | hard | HN's submit form cuts titles at 80 characters |
| title_no_exclamation | forbidden_regex | `!` | title | soft | An exclamation mark in the title |
| title_no_superlative | forbidden_regex | (full value below) | title | soft | A superlative or hype word in the title |
| title_no_listicle_number | forbidden_regex | `\b\d+\s+(ways\|reasons\|tips\|tricks\|things\|tools\|lessons)\b` | title | soft | The gratuitous "N ways to" number HN crops |
| title_no_dash | forbidden_regex | `[\u2012\u2013\u2014\u2015]` | title | hard | An em or en dash where a comma belongs (brand 1.1) |
| title_no_banned_verb | forbidden_regex | `\bsh[i]p(s\|ped\|ping)?\b` | title | hard | The banned launch verb in the title (brand 1.1) |
| title_no_link | forbidden_regex | `https?://\|\{APP_URL\}` | title | soft | A link in the title; the link belongs in the submission's url field |
| body_min_words | min_words | 100 | body | soft | A body under the 100-word floor |
| body_max_words | max_words | 200 | body | hard | A body over the 200-word cap; the blocker names the overshoot and the repair pass is told how many words to delete |
| body_no_exclamation | forbidden_regex | `!` | body | soft | An exclamation mark anywhere in the body |
| body_no_hashtag | forbidden_regex | `(^\|\s)#[A-Za-z]\w*` | body | soft | A hashtag |
| body_no_markdown | forbidden_regex | `(^\|\n)[ \t]*(#{1,6}\s\|[-*]\s\|\d+\.\s)\|\*\*[^*\n]+\*\*\|__[^_\n]+__` | body | soft | Headers, bold, bullet or numbered lists; HN renders none of them |
| body_no_vote_ask | forbidden_regex | (full value below) | all | hard | A vote, follow, repost, like, share or reciprocity ask, including the softened forms (support us, show some love, reach #1) and launch-day language. Widened in v4 from the body to every field, and made a blocker |
| body_no_banned_verb | forbidden_regex | `\bsh[i]p(s\|ped\|ping)?\b` | body | hard | The banned launch verb in the body (brand 1.1) |
| body_no_hype | forbidden_regex | (full value below) | body | soft | The governing hype list plus the HN-specific tells |
| body_no_marketing_phrase | forbidden_regex | (full value below) | body | soft | Marketing phrasing; dang: drop anything that sounds like marketing or sales |
| body_no_ranking_comparison | forbidden_regex | (full value below) | body | soft | Better-than-X positioning (brand 4.1) |
| body_no_dash | forbidden_regex | `[\u2012\u2013\u2014\u2015]` | body | hard | An em or en dash in the body (brand 1.1) |
| body_no_rhetorical_opener | forbidden_regex | (full value below) | body | soft | A rhetorical-question opener, including one on the line after a bare "Hi HN," line. Pattern changed in v4 |
| body_app_url_max_once | max_count | 1 | body | hard | The `{APP_URL}` token more than once |
| body_max_paragraph_breaks | max_count | 4 | body | hard | More than five paragraphs; a line holding only the link does not count as one |
| body_max_raw_links | max_count | 2 | body | hard | More than two raw `https?://` links. Raised from 1 to 2 in v4, because rule 17 asks for the earlier HN thread and rule 4 allows one public repo link; `{APP_URL}` stays the only app link |
| warnings_hand_rewrite_first | required_regex | (full value below) | warnings | hard | New in v4: the first warning is not the hand-rewrite line, character for character. The one check that enforces the conflict section |
| body_link_present | forbidden_regex | `^(?![\s\S]*\{APP_URL\})` | body | hard | New in v4: the `{APP_URL}` placeholder is missing altogether, so nothing in the post can be tried |
| body_app_url_own_line | forbidden_regex | `[^\s]+[ \t]*\{APP_URL\}\|\{APP_URL\}[ \t]*[^\s]+` | body | hard | New in v4: `{APP_URL}` sits inside a sentence, where HN will not link it |
| no_emoji | forbidden_regex | `[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]` | all | soft | New in v4: an emoji in any model-written field. Replaces the version 3 table's `body_no_emoji`, which never landed in code |
| body_no_read_failure_leak | forbidden_regex | (full value below) | body | hard | New in v4: a read failure of the analysis (a 404, an unreachable page, a profile field name) written into the body as a product fact |
| body_no_internal_uncertainty | forbidden_regex | (full value below) | body | soft | New in v4: something the builder does not know, published in the body instead of raised in warnings |
| body_no_prior_art_negative | forbidden_regex | (full value below) | body | soft | New in v4: a competitor graded or dismissed, or an absolute claim about every other tool |
| body_no_invented_origin_tell | forbidden_regex | (full value below) | body | soft | New in v4: an origin-story tell (a previous company, a wall you kept hitting, a moment) the profile does not record |
| body_no_social_proof_count | forbidden_regex | (full value below) | body | soft | New in v4: a star, fork, user, customer or download count, or MRR and ARR, which HN reads as a pitch |
| body_consistent_person | forbidden_regex | (full value below) | body | soft | New in v4: both "we built" and "I built" in one post |
| body_no_rule_echo | forbidden_regex | (full value below) | body | soft | New in v4: the rulebook's own phrasing reused as prose, including the word "genuinely" |
| all_no_caps_run | forbidden_regex | `\b[A-Z]{4,}(?:\s+[A-Z]{4,}){2}\b` | all | soft | New in v4: three consecutive words in capitals (GLOBAL_RULES 4, sentence case only). Pattern shared with the LinkedIn rulebook |
| warnings_no_self_count | forbidden_regex | (full value below) | warnings | soft | New in v4: the model reporting its own word or character count in a warning. Only the gate counts |

### Long check values in full

Read with single backslashes, as a JavaScript engine sees them.

```
title_no_superlative
\b(best|fastest|easiest|simplest|ultimate|most powerful|world'?s first|first ever|blazing(ly)? fast|ai[- ]?powered|next[- ]?gen(eration)?|revolution[a]r\w*|ground[b]reaking|game[- ]?chang\w*)\b

body_no_vote_ask
\bup-?vot\w*|\bvote (?:for|us|me|it|this|now|today|here|if)\b|\b(?:cast|drop|give) (?:a|your|us a) vote\b|\bevery vote\b|\bvotes? (?:count|matter)\b|\bvoters? (?:get|win|receive)\b|\b(?:top of|climb|hit|reach|win|on) the leaderboard\b|\bleaderboard (?:spot|position|rank)\b|\bhelp us (win|reach|climb|trend|get to|hit|stay)\b|\breach (#|number |no\.? ?)?1\b|(#|\bnumber |\bno\.? ?)1 (on|of the day|today|spot)\b|\bproduct of the (day|week|month)\b|\btop (post|product) (of the day|badge)\b|\bsupport (our|the|this|my) launch\b|\b(love|appreciate|need|value) your support\b|\byour support (means|would|helps|matters|counts)\b|\b(thanks?|thank you|grateful) for (your|the|all the) ((\w+ )?support|love)\b|\bshow (some|your|us some) (love|support)\b|\bsupport us\b|\bin exchange for\b|\breturn the favou?r\b|\b(i'?ll|we'?ll) (support|back|boost) yours\b|\bfollow (?:me|us|for more)\b|\brepost (?:this|if)\b|\bretweet\b|\blike (?:this (?:post|tweet|thread)|if you)\b|\bplease (?:like|share|repost|retweet)\b|\bshare (?:this|it) with\b|\btag (?:a friend|someone)\b|\bsmash (?:that|the)\b|\blink in bio\b|\b(?:front ?page|launch(?:ing)? (?:day|today))\b

body_no_hype
\b(game[- ]?chang\w*|revolution\w*|ground[b]reaking|v[i]ral|seamless\w*|unleash\w*|supercharg\w*|\d+x( faster| better| more)|\b10x\b|\d+ ?times (faster|better|more)|blazing\w*|cutting[- ]?edge|state[- ]of[- ]the[- ]art|next[- ]?gen(eration)?|ai[- ]?powered|the future of|best[- ]in[- ]class|world[- ]class|effortless\w*|lightning[- ]fast)\b

body_no_marketing_phrase
\b(excited|thrilled|proud to|delighted|pleased to announce|announc(e|ing)|join us|sign up now|get started today|limited time|don'?t miss|game on|check out our|we'?d love your support)\b

body_no_ranking_comparison
\b(better than|worse than|\w+[- ]killer|blows? \w+ (away|out of the water)|puts? \w+ to shame|leaves? \w+ in the dust|unlike (most|other|every|all) \w+)\b

body_no_rhetorical_opener
^[ \t]*(hi hn,?\s*)?(ever|have you|do you|did you|what if|why do|why is|tired of|are you|imagine|wouldn'?t it be)\b[^.\n]*\?

warnings_hand_rewrite_first
^HN guidelines ask that posted text be written by hand, not generated or edited by an LLM\. Treat this draft as an outline: rewrite every sentence in your own words before submitting\.$

body_no_read_failure_leak
\breturns? (a |an )?(404|403|500|502|503)\b|\b(404|403|500|502|503) (error|page|status|response)\b|\bnot (confirmed )?reachable\b|\b(could|can) ?not be (fetched|reached|scraped|read|confirmed)\b|\bscraped content\b|\bscrape (returned|failed|artifact)\b|\bat (the )?time of (analysis|scraping)\b|\bhomepage anchor\b|\bAPP_PROFILE\b|\bproof_points\b|\bBRAND_DNA\b|\banalysis_degraded\b|\bthe profile (does not|doesn't|didn't|did not) (state|hold|record|list|mention)\b|\binferred from the (url|slug|campaign angle)\b

body_no_internal_uncertainty
\bI do not know (yet )?(whether|if)\b|\b(details|specifics) I can share (honestly )?are limited\b|\bonce I have confirmed\b|\bwhat I can say publicly\b|\bI will fill in\b|\bstill being finalized\b|\bconfirm (this|that|it) (is accurate )?before (submitting|posting)\b

body_no_prior_art_negative
\bthe only (real |viable |serious |decent |mature )?(options?|alternatives?|choices?|tools?) (was|were|is|are)\b|\bevery (available |existing |other )?(tool|option|alternative|product|solution|vendor)s? (we (tried|evaluated|looked at|used) )?(was|were|is|are|had|required|stored|forced|pushed)\b|\bno api worth\b|\bworth building on\b|\((closed|proprietary|bloated|clunky|expensive|slow|locked)[^)]{0,80}\)|\block(s|ed|ing)? (you|your (data|responses|documents|notes)|users|teams) in\b|\bkept (adding friction|shrinking)\b|\bjust to (open|send|see|view|run)\b

body_no_invented_origin_tell
\bat (a|my) (previous|last|old|former) (company|job|startup|employer|team)\b|\bafter (co-)?judging\b|\bkept (running|bumping) into (the same|a) (wall|problem|issue)\b|\b(we|i) (got|grew) tired of\b|\bfor a long time (i|we) used\b|\bcarried us (fine )?until\b|\b(a few|two|three|several) years ago (we|i) (wanted|needed|started|were)\b|\b(was|were) the final push\b

body_no_social_proof_count
\b\d[\d,.]*\s?[km]?\+?\s*(github )?(stars|forks|users|customers|subscribers|downloads|installs|signups|sign-ups|teams|companies|paying (customers|users|subscribers))\b|\b(mrr|arr)\b|\b(trusted|used|loved) by\b

body_consistent_person
\b(we|we've|we have) (built|made|wrote|created|started|maintain)\b[\s\S]*\b(i|i've|i have) (built|made|wrote|created|started)\b|\b(i|i've|i have) (built|made|wrote|created|started)\b[\s\S]*\b(we|we've|we have) (built|made|wrote|created|started|maintain)\b

body_no_rule_echo
\bthe (design )?decision that (sets it apart|separates|sets [a-z.]+ apart)\b|\b(the )?one (question|thing) (i|we) (genuinely |would |really )?(want|would like|like) (answered|to know|your opinion on)\b|\bgenuinely\b|\bstated plainly\b

warnings_no_self_count
\b(is|at|sits at|currently|within|comes in at|totals?)\b[^.]{0,40}\b\d+[- ](characters?|chars|words?)\b
```

### Sources for the checks added or changed in v4

- `warnings_hand_rewrite_first`: HN guidelines, https://news.ycombinator.com/newsguidelines.html#generated, and dang's 2026-03-28 edit, https://news.ycombinator.com/item?id=22336638. It needed the new `required_regex` kind, which replaces the version 3 note that rule 6 was "not expressible with the current check kinds".
- `body_link_present` and `body_app_url_own_line`: Show HN guidelines (something people can try) and HN formatting help, https://news.ycombinator.com/formatdoc (URLs in the text field are not linked); rule 4. Evidence for the own-line check: continue's body put the link mid-sentence.
- `no_emoji`: rule 8 and GLOBAL_RULES 7. The range form is copied from the Reddit rulebook's check of the same name.
- `body_no_read_failure_leak` and `body_no_internal_uncertainty`: RocketRide, this task, from the ten-app evaluation (cluster 3, the plausible and hoppscotch 404s, and the hack-judge body).
- `body_no_prior_art_negative`: brand 4.1 and GLOBAL_RULES 11, with dang's "use factual, direct language"; evidence in `docs/eval-10/judged.json`, cal-com issue 5 and documenso issue 2.
- `body_no_invented_origin_tell`: GLOBAL_RULES 10; evidence in cluster 3, where an origin was invented on all ten apps.
- `body_no_social_proof_count`: HN guidelines (gratuitous numbers) and rule 12 as changed; evidence in judged.json, excalidraw issue 4 and continue issue 10.
- `body_consistent_person`: rule 15 as changed; evidence in judged.json, cal-com issue 5, excalidraw issue 5 and documenso issue 3.
- `body_no_rule_echo`: RocketRide, this task, from dub issue 9 and the six Show HN bodies in `docs/eval-10/*/appstate.json` that open paragraph four with rule 9's example phrase.
- `all_no_caps_run`: HN guidelines (no uppercase in titles) and GLOBAL_RULES 4.
- `warnings_no_self_count`: RocketRide, this task, from cluster 2, where every over-length draft carried a false self-count.
- `body_no_vote_ask` (changed): widened to the reciprocity and launch-day forms, moved to field `all` and flagged hard.
- `body_no_rhetorical_opener` (changed): the old value allowed only spaces or tabs after "Hi HN,", so an opener on the line below a bare "Hi HN," line was never tested; `\s*` covers the blank line. Flags stay `i`. The version 3 table claimed `imu`, which was wrong in two ways: `m` would fire on any paragraph that opens "Do you", including a legitimate closing question, and `u` is not needed now that the emoji check carries its own flags.
- `body_max_raw_links` (changed): the cap went from 1 to 2 so a repeat Show HN can carry both the earlier thread and a repo link.

### Known false positives, left in place

- `body_no_vote_ask` is hard and matches `\bup-?vot\w*`, so a product whose own feature is upvoting cannot describe it without a blocker. The builder has to reword or the owner has to scope the check.
- `title_no_superlative` matches a bare `best`, which catches "best-effort".
- `body_no_hype` matches `\b10x\b` on its own, so a version or dimension written "10x" trips it.
- `gateAsset` still carries the "title must start with 'Show HN:'" warning ported from the legacy Python gate, which duplicates `title_required_prefix`: one missing prefix produces two warning lines, one of them also a blocker.

## Hook patterns

On HN the title is the hook and the first body sentence is the second hook; nothing else in the post gets read before a reader decides to click through. These are fill-in shapes for the builder to write by hand (see the conflict section), not sentences to paste. Numbers and dates in the placeholders must come from the profile. The 10 live hooks, in the order `rulesBlock` sends them:

1. Title: Show HN: <Name>, a <kind of tool> that <verb>s <input> into <output>
2. Title: Show HN: <Name>, <what it does>, written in <language> and runs <where>
3. Opener: This is a <thing> for <who>. You point it at <input>, it <does the step>, and you get <output> as <format>. The interesting part is <the one technical decision>.
4. Opener: <Name> does one thing: <the thing>. It runs <locally, in the browser, as a single binary> and stores <what> in <where>. Here is how it works and where it falls short.
5. Opener: Last <month or project, from the profile> I needed <capability> that <constraint: worked offline, ran on a laptop, had no login>, could not find one, and built <Name>.
6. Opener: I have been using <Name> on my own <workload, from the profile> since <date from the profile>. It <what>. Posting it because <specific reason: I want opinions on the storage format>.
7. Opener: <Name> is a <kind of tool> that takes <input> and gives you <output>. [Builder: one sentence on why you built it, or the origin line the README records.]
8. Opener: <Name> does <the one job, from one_liner> for <icp.who, from the profile>. The part that took the longest to get right was <a README or changelog item the profile records>.
9. Opener for a repeat Show HN: <Name> has been public since <repo creation date from the profile>; the earlier thread is <link from the profile>. This post is about <the major change the profile records>, which is why I think it clears the bar for a second Show HN.
10. Closer: The choice I want a second opinion on is <a storage or deployment decision named in tech_stack or the README>: <option A the profile shows> or <option B>? I built it and will be in the thread.

Sources. No source skill supplies Show HN hooks, so hooks 1 to 8 are RocketRide, this task, built from dang's clear-statement and backstory tips (https://news.ycombinator.com/item?id=22336638) and the first-sentence shape of rule 2. Hooks 7 and 8 are new in v4 and replace two dropped ones (see what was left out). Hook 9 is new in v4: its shape is written fresh here, from dang's repost paragraph (link the previous Show HN and say what is different). Hook 10 is new in v4, RocketRide, this task, and exists to bind rule 11's closing question to a choice the profile actually records.

## Storage and versioning

This document matches rulebook version 4: `RULEBOOK_VERSION = 4` in `src/lib/rulebooks.ts`, bumped 2026-09-12 when the reconciliation landed. Version 3 (2026-09-11) distilled the sources; version 4 reconciled them against the code and closed the gaps the ten-app evaluation exposed.

How a stored row goes stale, and how an owner edit survives. `seedRulebooksIfEmpty` in `src/data/seed.ts` inserts the default for every platform when `platform_rules` is empty, and also inserts the v4 default above a stale seeded row, so the store records which version each draft was written against rather than silently drifting. `rulesFor` in `src/data/rules.ts` reads the newest row for the platform by `updated_at`, and `isStale` decides whether to trust it: a row is stale when its `source` is anything other than `owner` and its `version` is below `RULEBOOK_VERSION`. So a row seeded from version 1, 2 or 3 gives way to this code default, while an edit the owner made in Settings is kept whatever version it carries, because its `source` is `owner`. A stored row that saved no hooks keeps the default hooks, which is how a row written before hooks existed still gets the 10 patterns above.

Every draft carries the rulebook it was written against. `rulebookMeta` returns the trusted row's `version` and `source`, or `{ version: 4, source: 'default' }` when the row is stale or missing, and `runAsset` in `src/data/api.ts` stamps `rulebook_version` and `rulebook_source` onto every draft before it is stored. A re-run can therefore prove which rules a given draft actually saw, which matters most for the drafts the evaluation judged against version 2 wording.

Which sanitiser passes run before the gate, in order:

1. `sanitizeDraft` (`src/domain/sanitize.ts`), called by the runner on every pipe result in `src/data/runner.ts`. It walks every string in the draft and takes out em and en dashes: an unspaced en dash inside a range (a price span, a letter span, a year span) becomes a hyphen, every other one becomes a comma, and the surrounding punctuation is tidied. The count is stamped as `punctuation_fixed`.
2. `sanitizeVerbs` (same file), called in `runAsset`. It walks every field except `warnings`, which quote the draft's faults as written, and applies two passes to each string: `cleanVerbs` turns the banned launch verb into release, releases, released or releasing with the first letter's case preserved, counted as `wording_fixed`; then `cleanSlop` replaces the 67 slop-lexicon terms in `src/lib/slop-lexicon.ts` with their plain equivalents, longest term first so "delve into" is replaced before "delve", counted as `slop_fixed`.
3. The runner then stamps `venue` (from the target, unused on HN) and `app_name`, and `gateAsset` runs last: its own em and en dash sweep over every string field, the standing "title must start with 'Show HN:'" warning, then the 36 checks above.

The gate's output is two lists. `warnings` holds one line per failure in the shape `field: description (evidence)`, and `blockers` holds the subset a founder cannot post over. A non-empty `blockers` list triggers exactly one repair pass: `runAsset` builds a REPAIR note that names each hard failure with the cut to make (`repairHint` turns "(252 words, cap 200)" into an instruction to delete at least 67 words, whole sentences at a time, and a paragraph overshoot into an instruction to merge paragraphs), redrafts once, and keeps the redraft only when its `overage` is smaller. The blockers the pass was asked to fix are recorded on the draft as `repaired`. If the redraft throws, the first draft stands, blockers and all.

## Posting-day rules for the builder (not sent to the drafting model)

- Post from a personal username, not the company or product name; HN reads a brand username as promotion (dang).
- Put an email address in the HN profile so moderators can contact you and, if the post sinks, send a repost invite (dang).
- Answer every substantive comment, especially in the first hours. Reply to the argument, not the tone; agree where the critic is right; never complain about downvotes or ranking (HN guidelines, In Comments; ph-community-outreach HN avoid list).
- Do not ask anyone to upvote or comment. Tell teammates, friends and users not to post booster comments; HN readers spot them and flame the poster (Show HN guidelines; dang).
- Do not delete and repost. If it got no attention, wait; do not resubmit the same thing (HN guidelines). A second Show HN for the same project only after a major overhaul, once or twice a year at most, with a link to the previous thread and what changed; dang's own words for more than that are that it "starts to be excessive" (Show HN guidelines; dang).
- Write every comment reply by hand as well; the generated-text rule applies to comments, not just the post (HN guidelines).
- Monitoring: the vm0-skills `hackernews/SKILL.md` is a set of curl and jq recipes for the public HN Firebase API (top, new, show stories; item and user lookups; `kids` on an item lists its comments). It contains nothing about writing. The repo has no license file, so do not copy the file into this repo; the API itself is public and documented at https://github.com/HackerNews/API, and a short script polling `/v0/item/<your thread id>.json` for new `kids` gives the same result. Use it to watch your own thread for unanswered comments.

## Deliberately left out and why

- The ph-community-outreach body template's "Hey HN!" opener and "Happy to discuss the implementation!" closer: exclamation marks, and the greeting-plus-cheer register is exactly the tone HN calls marketing.
- Its "Performance/scale info" bullet: invites numbers that are not in proof_points.
- Its "Time it well (morning US)" tip: unsourced and operational; timing is not a drafting rule and HN does not publish one.
- Its "be a member first for 2 to 4 weeks, build karma" advice: operational, and the review already judged karma warm-up off-brand; HN's own ask is simply to participate as a person, which is covered by the personal-username rule above.
- Its Product Hunt cross-promotion framing (HN as a launch-day funnel to a Product Hunt page): HN's guidelines say not to use HN primarily for promotion, and a Product Hunt page is a landing page under the Show HN rule.
- Its Reddit and Indie Hackers sections, including the "Key Numbers" block with MRR: other channels, and brand 2.7 makes financial figures confidential.
- The vm0-skills API recipes: not drafting guidance; kept as a monitoring pointer only, and not vendored because the repo carries no license.
- dang's advice for hardware that cannot be tried online (post a video, or a detailed write-up with photos): Launch Kit drafts for software that has a URL, and rule 4 requires {APP_URL} to open the running thing, so there is no draft field for it. If Launch Kit ever profiles a physical product this comes back.
- HN's reader-side comment rules (be kind, do not cross-examine, no shallow dismissals): they govern how the builder replies, so they live in the posting-day section, not in the drafting rules.
- dang's "put your email in your profile" and "personal username" tips: account setup, not text; posting-day section.
- A hype word list in the model rules: the mechanical check carries the list; the rule the model gets is about adjective type, which generalizes to words the list does not name.
- The common HN title convention of a dash between the name and the description: replaced with a comma throughout per brand 1.1.
- Two hook patterns were dropped in v4, and both for the same reason: their slots could only be filled by inventing, which GLOBAL_RULES 10 forbids. "Opener: <Name> is a <kind of tool> that takes <input> and gives you <output>. I built it because <the specific thing that kept going wrong at work>." was filled from nowhere on hack-judge; live hook 7 replaces it, with a builder placeholder in the same slot. "Opener: I got tired of <the manual chore, named exactly>, so I wrote <Name>. It <one-sentence what>, and you can try it at {APP_URL} without an account." invites the same invented origin, and also put the link inside a sentence, which `body_app_url_own_line` now blocks; live hook 8 replaces it, with both slots bound to the profile.
- The check the version 3 table called `body_no_emoji`, with `\p{Extended_Pictographic}`: it never landed in code, and v4 adopted the explicit range form already used by the Reddit rulebook instead, on field `all` rather than `body`.

## Open questions for the owner

None of these is resolved here. Each needs Joe's call or an owner decision about the app.

1. Naming a model provider as a stack fact. Rule 16 and the hooks let the draft name the platform, framework and model provider once, and khoj's draft listed OpenAI, Anthropic, Google Gemini and DeepSeek as configurable providers. That is a stack fact rather than a comparison, but brand rulebook section 4.3 explicitly marks foundation-model-provider mention policy as unsettled and asks that any content naming those companies be routed for review. Evidence: `docs/eval-10/khoj/appstate.json`, show_hn body. Source: `.claude/rules/skills/brand-check/references/rulebook.md` section 4.3.
2. A comparative mention that carries a number. plausible's draft wrote "about 135KB less per visitor than the Google Analytics script" and named a painful Google Analytics 4 migration. Both the comparison and the named provider fall under the same unsettled 4.3 policy, and the number only means something against the other product, so removing the name removes the claim. Evidence: `docs/eval-10/plausible/appstate.json`. URL not captured for the 135KB figure; it came from the profile, not from a source page.
3. The posting account. Brand 3.5 says Joe's personal account carries no RocketRide mention on dev forums, while rule 16 has the model name the platform once when the profile lists it. The drafting model cannot know which account posts. The Reddit rulebook already caps its mention level when TONE says the post goes out from Joe's personal account; Show HN has no equivalent. Two options: pass an ACCOUNT signal into `buildAssetQuestion`, or drop the platform mention from show_hn by default.
4. App Builder naming. Bucket 3 has no finalized public name (brand 5.2), and no HN draft in the evaluation named it. If a RocketRide app's profile ever names it, that name flows straight into the stack sentence rule 16 asks for, so the brand-check pass should sweep show_hn bodies for it.
5. Whether `body_no_read_failure_leak` should stay hard. It is flagged hard on the principle that a founder cannot post a tool artifact as a product fact, not because it is a cap, a shape or a link. If the owner wants blockers limited to shape and caps, this is the one to downgrade to soft.
6. The prior-launch assertion behind rule 17. A draft-only check cannot see the profile, so the rule can ask for the warning but nothing verifies it. The proposal on the table is a code assertion in `runAsset` for show_hn: when the profile JSON matches `news\.ycombinator\.com\/item\?id=\d+` or an "N points" badge, or a proof point mentions Hacker News, require a warning matching `(earlier|previous|prior|repeat)[^.]*(show hn|hn thread|hn submission)` and otherwise append one, soft so Targets can read it. Not implemented, so khoj-shaped cases still depend on the model obeying the rule.
7. The duplicate title-prefix warning in `gateAsset`, ported from the legacy Python gate. Removing it is a one-line change to shared code that every platform's gate runs, so it is left for the owner rather than done here.
8. Whether the app should label the Show HN card as an outline and withhold copy-to-clipboard, per the conflict section. Still a recommendation; the assets stage gives every asset type the same copy affordance.

## Self-check performed on this file

After writing, this file was swept with the mechanical greps from `.claude/rules/skills/brand-check/SKILL.md` step 3 (the dash grep, the banned-verb grep, the hype grep and the deprecated-framing grep). The dash grep and the banned-verb grep return nothing: the verb appears only inside the bracket-split regex value `sh[i]p`, spelled letter by letter in rule 13, or as the phrase "the banned launch verb". The hype grep returns only the ban lists it is meant to find, in rule 8, rule 12 and the check values. The regexes in the tables are written so they match the real words in a draft without spelling those words here; the orchestrator's brand-check pass records the final verdict.
