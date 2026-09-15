# X rulebook: x_post

Drafted 2026-09-11 from `docs/social-launch-skills-review.md` (X verdict: PARTIAL) and reconciled against the code for rulebook version 4 on 2026-09-12. This file is the reference and it now matches the code: `RULEBOOK_VERSION = 4` in `src/lib/rulebooks.ts`, 20 rules, 11 hook patterns, 33 machine checks. The merge is done, so nothing here is a proposal: the rules and hooks are `DEFAULT_RULEBOOKS` entry `x_post` in `src/lib/rulebooks.ts` and the checks are `RULEBOOK_CHECKS['x_post']` in `src/lib/rulebook-checks.ts`. The drafting model receives the numbered lines under "Rules adopted" verbatim and in that order inside the `PLATFORM_RULES` block that `rulesBlock` in `src/data/rules.ts` builds, then the eleven hook patterns under `HOOK_PATTERNS`, then the twelve `GLOBAL_RULES`. Where this file cites a GLOBAL rule by number, the numbering is 1 to 12 in the order the `GLOBAL_RULES` array holds them. Brand-check has not yet run on this file.

## What the model produces

From `pipelines/lk_assets.pipe`, the `ASSET_TYPE=x_post` output line:

- `post`: one tweet, max 280 characters, hook first, one concrete proof point, `{APP_URL}`.
- `thread_extension`: 2 to 4 follow-up tweets.
- `alt_variants`: 2 posts built on different hooks.
- `warnings`: strings.

The post launches the builder's app. It is written in the builder's voice from the approved app profile, the Business DNA and the chosen campaign angle. `BRAND_DNA` wins over `APP_PROFILE.voice`; an explicit `TONE` override wins over both.

Around those four keys the runner and the gate stamp metadata that the model never writes: `blockers` and the gated `warnings` list (`gateAsset`), `repaired` when the second pass won, `venue` when a target was passed, `app_name`, `rulebook_version`, `rulebook_source`, `punctuation_fixed`, `wording_fixed` and `slop_fixed`. All of them sit in `META_FIELDS` in `src/domain/gates.ts`, so a check whose field is `all` or `*` never sweeps them; only a check that names a field reads one, which is how x_warnings_no_narrated_fix can read `warnings`.

## Sources

Sources used, with the path or URL and what was taken. Every source the code draws on for x_post is listed, including the ones added when v4 was reconciled.

| Source | Path or URL | Version | License | What was taken |
|---|---|---|---|---|
| jamesgray007/hoai-course | `.claude/skills/writing-x-posts/SKILL.md` | commit de68d9691036e12f92a57314284234002e7f9ff4, 2025-12-18 | None. No LICENSE file in the repo; the README's License section reads "This repository is provided as a learning resource for course participants." | Structure only, re-expressed in our words: the single-post shape, the four thread frameworks, the formatting rules, the quick checklist. No sentence is copied. |
| jamesgray007/hoai-course | `.claude/skills/writing-x-posts/references/hooks.md` and `references/examples.md` | same | same | `examples.md` was never opened. `hooks.md` was opened once during the v4 reconciliation, only to check our hook library against it; nothing was taken, and the two echoes it found (a close reading "Here is why:" and two hooks ending on a colon) were removed from hooks 4 and 5. The review marks both files creator-economy. |
| RocketRide brand rulebook | `.claude/rules/skills/brand-check/references/rulebook.md` | 2026-08-19 | internal | Governing rules: banned vocabulary (1.1), MaaS and inference framing (1.2), AI tells (1.3), positioning (2), what to never assert (2.7), tone and capitalization (3.1 to 3.3), off-brand examples (3.4), account rules (3.5), competitor policy (4.1), foundation model providers (4.3), factual traps (5.1 financial figures, 5.2 the App Builder name, 5.3 unsupported claims, 5.4 the MaaS check). Sections 1.2, 4.1, 5.1 and 5.4 were added to this table when v4 closed the gaps they cover. |
| RocketRide brand-check gate | `.claude/rules/skills/brand-check/SKILL.md`, step 5 severity tiers | 2026-08-19 | internal | The blocker tier that the gate's `hard` flag mirrors. The v4 audit files a vote ask under it, which is why x_no_vote_ask is hard rather than one more warning. |
| Jakeschincariol/linkedin-agent-skill | `skills/li-human/slop.json`, distilled into `src/lib/slop-lexicon.ts` | MIT, per the header of `src/lib/slop-lexicon.ts` | MIT | The 67 swap pairs `cleanSlop` applies to every field except `warnings` before the gate runs. An X draft is sanitised by this lexicon even though the source pack is a LinkedIn pack; the terms with no safe drop-in replacement stayed on LinkedIn as its `slop_lexicon` warning check and are not checked on X. |
| Launch Kit pipe contract | `pipelines/lk_assets.pipe`, the `ASSET_TYPE=x_post` output line | working tree | internal | The four output keys and their budgets: max 280, hook first, one concrete proof point, `{APP_URL}`, 2 to 4 follow-up tweets, 2 variants on different hooks, warnings. Rules 1, 3, 4, 7, 10 and 17 and the link-presence checks cite it. |
| Launch Kit code | `src/lib/rulebooks.ts` (RULEBOOK_VERSION, GLOBAL_RULES, the x_post entry), `src/lib/rulebook-checks.ts`, `src/lib/slop-lexicon.ts`, `src/domain/gates.ts` (ASSET_LIMITS, runRulebookCheckHits, META_FIELDS), `src/domain/sanitize.ts`, `src/domain/questions.ts` (THIN_PROFILE), `src/data/rules.ts`, `src/data/seed.ts`, `src/data/runner.ts`, `src/data/api.ts` (runAsset) | working tree, 2026-09-12 | internal | What the code enforces and in what order, so no rule here contradicts it: the kinds, the hardness resolution, the field convention, the sanitiser passes, the repair pass, and the version and source stamped on every draft. |
| Launch Kit eval, the GLOBAL rules | `docs/EVAL-10-APPS.md` clusters 3, 6 and 16; `docs/eval-10/judged.json` | 2026-09-11 | internal | Four GLOBAL_RULES added after the ten-app run (never invent a person; never invent an origin story, a previous tool or a limitation; a competitor only as a neutral fact; a thin profile stays general). They govern the thread shapes (what broke, one thing it does not do yet) and the hook library, and `src/domain/questions.ts` adds a THIN_PROFILE section that overrides every hook pattern when confidence is under 0.5 or analysis_degraded is true. |
| Launch Kit eval, the X drafts | `docs/eval-10/judged.json` (hack-judge, plausible, formbricks, documenso, dub, continue, khoj, excalidraw, hoppscotch, cal-com); `docs/EVAL-10-APPS.md` clusters 2, 3, 6, 10, 13, 20 | 2026-09-11 | internal | The quoted failures behind every v4 change: rules 2, 3, 4, 5, 10, 15 and 17 tightened, rules 18, 19 and 20 added, fourteen checks added and five repaired, so each quoted X failure is now named by a rule or a check. |
| Review | `docs/social-launch-skills-review.md`, X section, the status table and step 4 of the handoff | 2026-09-12 | internal | The keep list (single-post structure, four frameworks, checklist), the drop list (hooks.md, examples.md, engagement CTAs), and the reconciled counts this file must match (44 items, 19 gaps closed, 4 code items newly sourced, 20 rules, 11 hooks, 33 checks). |
| RocketRide, this task | no external source | 2026-09-11 and 2026-09-12 | internal | The eight original hook patterns, the three added in v4, the thread-shape table, and the wording of rules 18, 19 and 20 where the audit records no outside source. |

Mechanical sweep of the source `SKILL.md` at adoption, using the review's three greps: banned verb 0, dashes 1 (line 19, in prose), hype 1 (line 3, the front-matter description). Neither line was carried over. The clone re-checked for v4 at `social-skills-v4/hoai-course` is at the same commit, de68d96, with no LICENSE file, as the review states.

Because the source carries no open-source license, adoption is limited to ideas: a post holds one idea, a thread follows one of four step orders, a checklist runs before output. Every idea is rewritten and resized to our contract. Nothing from the source appears verbatim in this file or in the rules.

A note on one word. Brand rulebook 1.1 bans the verb for delivering software in every form, with no exceptions and no context. This file and the rules spell it letter by letter (s-h-i-p) where the model must recognise it, and the code matches it with a bracket-split regex (`s[h]ip`) that does not contain the literal word, so a brand sweep of this folder and of `src/lib` and `src/domain` returns zero hits for it. `cleanVerbs` in `src/domain/sanitize.ts` swaps the four verb forms before the gate runs; the adjective form is not swapped, which is why rule 5 names it and x_no_s_word matches it.

## Rules adopted

Each rule is one line the drafting model can obey, in the order `rulebooks.ts` holds them, which is the order the model reads them in. "From" names the origin. "Changed" says what moved from the source, from the v3 default, or in the v4 reconciliation. Seven rules were tightened for v4 and three are new; where a rule changed, the line below is the new wording.

1. The post is under 280 characters including {APP_URL}; aim for 200. It carries exactly one idea: what the app does, in specific nouns, or one thing that changed while building it.
   From: source "Single Post" (under 280, under 200 is better, one idea per tweet); the pipe contract; the v3 default line 1.
   Changed: nothing in v4. The budget still counts the link placeholder, and "one idea" is still defined so the model cannot read it as "one topic".

2. The first line is the hook and it states the specific thing inside the first 8 words: the input and the output, the error you hit, the decision you made, or a number from APP_PROFILE.proof_points. When the CAMPAIGN_ANGLE hook is a string of adjectives, open on the fact behind it and drop the slogan. Never open with a question, "Introducing", "Excited to announce", "Big news", or a thread emoji.
   From: source "The Hook (Tweet 1)"; the opener ban list from GLOBAL_RULES and brand rulebook 3.4.
   Changed: v4 tightened it. The CAMPAIGN_ANGLE sentence is new: when the chosen angle's hook is a string of adjectives, the post opens on the fact behind it and drops the slogan. Evidence: `docs/eval-10/judged.json`, documenso, whose post opened "Documenso is self-hostable, embeddable, and fully compliant e-signatures", the angle slogan used as the hook. The source's hook types (bold statement, tension, twist, open loop) stay replaced by four things a developer can verify.

3. Use exactly one proof point from APP_PROFILE.proof_points in the post; a before-and-after pair from proof_points counts as one. A star, fork, user or download count is stated bare, as a number and a noun; never say what those people think, chose, trust or agree with. If the profile has none, state what the app does in plain terms and put "no proof point in profile" in warnings. Never write a number, user count, quote or benchmark that is not in the profile.
   From: pipe contract ("one concrete proof point"); GLOBAL_RULES "Never invent metrics, users, testimonials, or benchmarks"; brand rulebook 2.7 and 5.3.
   Changed: v4 tightened it in two places. A before-and-after pair from proof_points counts as one proof point, which settles the clash with hook 6, and a star, fork, user or download count is stated bare, with nothing said about what those people think, chose, trust or agree with. Evidence: judged.json, continue (a post carrying 35,870 stars and 5,359 forks was approved) and documenso ("14,980 GitHub stars from developers who agree"). The new checks x_post_one_proof_point (hard) and x_no_star_attribution hold the two halves.

4. {APP_URL} appears exactly once, as the last line of the post, and never in thread_extension; each alt variant carries it once, last. No other link anywhere in the post, the thread or the variants; if a thread tweet needs a second link, say where it lives (the README, the docs page) and add a warning. The last thread tweet's next step may say the link is in the first tweet.
   From: the v3 default ("The link goes last as {APP_URL}"); pipe contract.
   Changed: v4 tightened it. The thread is now named (never {APP_URL} in thread_extension), each alt variant carries it once and last, a thread tweet that needs a second link says where it lives, and the last thread tweet's next step may say the link is in the first tweet. Evidence: judged.json, plausible, whose fourth thread tweet ended on {APP_URL} while its warning said the link had been removed. Three hard checks now hold it: x_thread_url_in_body, x_post_link_present, x_alt_link_present.

5. Show, do not tell: replace every evaluative adjective (fast, powerful, simple, seamless, robust) and every vague time claim (in minutes, in seconds, instantly) with what the app does, in what time from proof_points, on what input. Never write the launch verb spelled s-h-i-p in any form, including s-h-i-p-s, s-h-i-p-p-e-d, s-h-i-p-p-i-n-g and the adjective s-h-i-p-p-a-b-l-e (write launch, release, deploy, roll out), and never game-changer, revolutionary, groundbreaking, viral, seamless, unleash, supercharge, blazing, 10x, or "N times faster".
   From: brand rulebook 1.1, 1.3 and 3.1 ("Show, don't tell"); GLOBAL_RULES filler list.
   Changed: v4 tightened it. Vague time claims (in minutes, in seconds, instantly) join the evaluative adjectives, the adjective form of the banned launch verb is named because `sanitize.ts` swaps only the verb forms, and "blazing" joins the hype list to match the check. Evidence: `docs/EVAL-10-APPS.md`, hoppscotch "Self-host in minutes" inside the X post the judge rated strongest, and cluster 13, the banned verb in the excalidraw thread.

6. Never frame against another product: no "better than", "unlike X", "X is dead", "stop using X", "kills X". State a fact about this app only. If the campaign angle is a comparison, keep it to a plain fact about this app and add a warning that the comparison was dropped.
   From: brand rulebook 4.1 ("Never position RocketRide as better than X. Show, don't tell."), generalised to any app Launch Kit drafts for; GLOBAL_RULES neutral-competitor line.
   Changed: nothing in v4 in the wording; the enforcement moved. x_no_competitor_framing was repaired (case-sensitive again, plus the "one thing X does not" and "Ditch X" forms) and x_no_competitor_negativity was added for a named product with a negative verb attached.

7. thread_extension has 2 to 4 tweets, each under 250 characters, each a complete thought that reads on its own when quoted. No number prefixes, no "Thread", no thread emoji: X renders the thread.
   From: source "The Body" (each tweet under 250, each stands alone); pipe contract (2 to 4).
   Changed: nothing in v4. The lower bound of two tweets still has no check kind, so it stays a rule the model obeys on trust (Open point 3).

8. Pick one thread shape and follow it one step per tweet: build story (what you tried, what broke, what you changed, what it does now); list (2 to 4 concrete things, one per tweet, each with how it works); problem to solution (the pain in specifics, what the app does about it, one thing it does not do yet); take (a common practice, what it costs you, what you do instead, where the take does not hold).
   From: the source's four frameworks (Storytelling, Listicle, Problem-Solution, Contrarian), resized to the contract.
   Changed: nothing in v4. The long form is the table below, and GLOBAL_RULES 10 now governs the "what broke" and "one thing it does not do yet" steps, so a shape cannot invent the scene it asks for.

9. The last thread tweet ends on one specific question to developers who have the same problem, or one next step (try it on X, read the docs, open an issue). Never "follow for more", "repost if", "like if", "tag someone", "RT", "link in bio", countdowns, "limited spots", or "last chance".
   From: source "The Close" (punchy lesson, soft CTA) and "What to Avoid"; the governing rules on vote asks, reciprocity and FOMO.
   Changed: nothing in v4 in the wording; its teeth changed. The vote, follow, repost, like and tag asks moved out of the soft x_no_engagement_asks into the new hard x_no_vote_ask, so an ask now blocks approval and triggers the repair pass instead of adding one more warning.

10. alt_variants holds 2 complete posts, each under 280 characters with {APP_URL} last, each built on a different hook pattern from the main post and from each other, and each opening on a different fact of the profile: another proof point, the input and output line, or a decision. A variant that reuses the main post's opening clause or its proof point is a copy and does not count.
    From: pipe contract ("2 different hooks").
    Changed: v4 tightened it. "Different" is now defined twice over, a different hook pattern from the main post and from each other, and a different opening fact of the profile, and reusing the main post's opening clause or its proof point is named as a copy. Evidence: judged.json, continue, whose two variants repeated the star and fork counts of the main post. The placeholder requirement is checked by x_alt_link_present.

11. Sentence case: a capital at the start of every sentence, normal punctuation. No Title Case, no ALL CAPS words except acronyms (JSON, CLI, SDK), no exclamation marks, no ellipsis to trail off.
    From: brand rulebook 3.2 (LinkedIn and X posts use normal capitalization; lowercase starters are for Joe's personal DMs only); GLOBAL_RULES "Sentence case only".
    Changed: nothing in v4. This rule replaced the v2 default's "Lowercase throughout is welcome", and the summary line in `rulebooks.ts` now reads "One idea, the specific thing in the first eight words, the link last, no hashtags", so Open point 1 is closed. x_post_all_caps_run is the partial check that came with v4.

12. None of these AI tells: "What I keep thinking about", "I keep coming back to", "The pattern I keep seeing", "Let that sink in", "Here is the thing", "Hot take:", the late-night-outage cliche, and three-fragment punchlines like "Smart team. Solid product. Worth watching."
    From: brand rulebook 1.3 and 3.4.
    Changed: nothing in v4. x_no_ai_tells gained the X-native lines ("Read that again", "nobody tells you about", "the harsh truth", "spoiler alert") and x_no_fragment_punchline now catches the three-fragment shape this rule names.

13. No hashtags. The single exception is a tag APP_PROFILE names as one its community already uses, placed at the end of the post. At most one emoji in the whole draft, never in the first line, never the rocket.
    From: source "1-2 hashtags max (or none)" and "Emojis sparingly"; the v3 default; GLOBAL_RULES "Emoji: at most one".
    Changed: nothing in v4. x_emoji_limit, listed in the v3 table here but never merged into the code, is in `rulebook-checks.ts` now, so the rocket and a second emoji are caught rather than trusted.

14. First person in the builder's own voice: "I" for a solo builder, "we" for a team, whichever BRAND_DNA or APP_PROFILE.voice uses. Never third person about yourself, never "we are thrilled" or "proud to".
    From: GLOBAL_RULES "Write like the builder talking to a peer, in first person"; the v3 default ("Sound like a person typing, not a brand posting").
    Changed: nothing in v4. "proud to" is matched by x_no_hype now, which it was not before, so the phrase this rule bans has a check behind it.

15. Name RocketRide or any other platform, vendor or model provider only when APP_PROFILE or BRAND_DNA lists it and the sentence does not work without it; at most once across the post and thread, never as the subject of the post, never in a comparison. Never the phrase "universal API key" or "one API key for every model" about any platform: where a MaaS provider is involved, the account and the key are with that provider.
    From: brand rulebook 3.5 (moderate mentions on the founder's social accounts, only where it genuinely fits) and 4.3 (foundation model providers never in a comparative context).
    Changed: v4 tightened it. Brand rulebook 1.2 and 5.4 (the Aug 19, 2026 correction) are now carried on X: the deprecated one-key framing is banned in words, and x_no_s_word matches it, as `brand_banned_terms` already did on LinkedIn and its sibling did on Product Hunt. Where a MaaS provider is involved, the account and the key are with that provider.

16. Claim only capabilities that APP_PROFILE states. If the campaign angle asks for one the profile does not confirm, leave it out and add a warning naming the missing claim. No pricing, revenue, funding or user numbers unless they are in proof_points.
    From: brand rulebook 2.7 and 5.3 (no unconfirmed capability claims; financial figures never in public content), generalised to the app profile as the source of truth.
    Changed: nothing in v4. Rules 18 and 19 carry the two failures this rule did not stop, and x_no_money_figures is the new check behind its money clause (brand rulebook 5.1).

17. warnings lists every dropped claim, every proof point you could not source, and any TARGET rule you had to bend, and it describes the draft exactly as returned: never write that a link, a name or a comparison was removed or revised unless the returned text no longer contains it, and never state a character or word count (the gate counts). An empty warnings array means every number and claim traces to the profile.
    From: pipe contract (warnings on every asset) and the reddit_post default's "say so in warnings".
    Changed: v4 tightened it. warnings must describe the draft exactly as returned: never that a link, a name or a comparison was removed unless the returned text no longer holds it, and never a character or word count, because the gate counts. Evidence (EVAL-10-APPS.md cluster 2): plausible "has been removed to comply" with the link still present; dub "Revised to remove the direct comparison" with Bitly still named; formbricks "No comparison framing used" beside a thread naming two vendors; continue "approximately 230" on a 246-character post. x_warnings_no_narrated_fix reads the field.

18. If a capability in the draft is inferred from the campaign angle, the app name or the category rather than stated by APP_PROFILE, cut it from the draft. A warning that admits an inferred claim is not a substitute for removing it.
    From: RocketRide, this task. Evidence: judged.json, hack-judge, whose X warning read "All claims about app functionality are inferred from the campaign angle and app name" beside a post that asserted a rubric and score collection.
    Changed: new in v4. The model kept an invented mechanism and confessed it in warnings; the rulebook now says the confession does not license the claim. Not checkable mechanically: GLOBAL_RULES 12 and the THIN_PROFILE block in `src/domain/questions.ts` are the other half, and hook 11 is the shape to use instead.

19. A privacy, security or compliance claim (data never leaves your machine, no third parties, SOC 2, HIPAA, 21 CFR Part 11) carries the condition and the edition APP_PROFILE attaches to it. Beside a cloud model, a hosted tier or a self-hosted edition the absolute form is dropped, and a standard the profile does not list is never named.
    From: RocketRide, this task. Evidence: judged.json, khoj ("Any LLM, local or cloud. Your data never leaves your machine.") and documenso ("Compliance is included: 21 CFR Part 11, SOC2, HIPAA, ESIGN Act, and UETA. You do not configure it separately").
    Changed: new in v4. Rule 16 covers capability claims in general, but the model treated privacy and compliance as slogans rather than claims. x_no_absolute_privacy_claim warns on the absolute form; the edition and condition themselves stay judgment.

20. When APP_PROFILE shows prior releases, a version number, a star count or a founding year, write the launch as a release, not a debut: name the version or the change from the profile, and never write 'I built' or 'is here' for a product the profile says has existed for years.
    From: RocketRide, this task. Evidence: EVAL-10-APPS.md clusters 3 and 10, where nine of the ten evaluated apps were established products and one draft said "So I built Cal.com" about a product at v6.8.
    Changed: new in v4. The hook library assumed a first launch, so established products were drafted as debuts. Hook 9 ("The release note as a post") is the pattern this rule points at.

## Thread shapes

The source's four frameworks assume 5 to 10 tweets. Our contract is the post plus 2 to 4 extension tweets, so each shape is one step per tweet, and the closing "CTA / follow prompt" step is replaced by a question or a next step (rule 9). Tweet 5 is optional.

| Shape | Source framework | Post (hook) | Tweet 2 | Tweet 3 | Tweet 4 | Tweet 5 (optional) |
|---|---|---|---|---|---|---|
| Build story | Storytelling | The outcome, or the moment it first worked | What you were trying to do and what broke (the error, the file, the hour it cost) | What you changed | What it does now, and one limitation you still have | One question to developers who hit the same thing |
| List | Listicle | A count and a noun: "3 things [app] does with [input]" | Item 1, with how it works in one clause | Item 2 | Item 3 (or the last item) | Which one to try first, and what you want to hear back |
| Problem to solution | Problem-Solution | The pain, in specifics: the step, the wait, the file | What the usual workaround costs you (your own experience, no vendor named) | What the app does about it, concretely | One thing it does not do yet | A question or a next step |
| Take | Contrarian | The position, stated plainly, with the practice it questions | What most people do and what it costs (a specific, never a named product) | What you do instead, and the evidence from your own build | Where the take does not hold | A question, not a dare |

Rules for every shape: each tweet stands alone when quoted; numbers come from `proof_points` only; no step names a competitor; the take shape never says another approach is wrong, only what it cost you.

Two v4 rules bind the table. GLOBAL_RULES 10 (never invent an origin story, a previous tool, the moment that made you build it, or a limitation) governs the "what broke" step of the build story and the "one thing it does not do yet" step of problem to solution: when `APP_PROFILE` records neither, the shape is the wrong one to pick, not a licence to write the scene. Rule 20 rules out the build story altogether for a product the profile shows as established; the release note hook and the list shape are what is left.

## Developer hook library

Eleven patterns, written fresh for this rulebook in the voice brand rulebook 3.3 shows: direct, specific, self-aware, no hype. Slots in square brackets are filled from the app profile. Examples use fictional apps (Docsift, Retryd, Pinmap, Lintline) and carry no real numbers; where a number belongs, the slot stays a slot. The model receives these eleven lines under `HOOK_PATTERNS` and may adapt one, never copy it. After v4 no pattern ends on a colon: the open-loop tease was the source device this file left out, and two hooks that still carried it were rewritten.

1. Plain function line.
   Pattern: [app] turns [input] into [output]. No [manual step you used to do by hand].
   Example: Docsift turns a folder of PDFs into a searchable index. No chunking script to babysit.
   Use when the app has one clear input and one clear output.

2. The failure that started it.
   Pattern: I built [app] because [the specific failure: the error text, the file it broke, the step that silently failed]. It now [one clause].
   Example: I built Retryd because a cron job dropped a batch of webhooks and nothing logged it. It now replays every failed delivery from a log you can read.
   Use when the profile's "why built" holds a real incident.

3. The stack, plainly.
   Pattern: [app]: [language], [runtime shape], [licence], [dependency count from the profile]. It does one thing: [thing].
   Example: Pinmap: Go, one binary, MIT, no runtime dependencies. It does one thing: maps every open port to the process that owns it.
   Use when the reader cares how it is built. Counts come from the profile or the slot stays empty.

4. The unpopular choice.
   Pattern: We picked [choice] over [the expected choice] for [the part of the app]. Not sure everyone will love that; the thread says what it cost and what it bought.
   Example: We picked SQLite over a hosted queue for the job store. Not sure everyone will love that; the thread says what it cost and what it bought.
   Use when a design decision is the story. State the decision; never say the other option is worse. Must be followed by a thread.
   Rewritten for v4: the v3 close "Here is why:" echoed the source's Contrarian close and ended the post on a colon, the open-loop device this file lists under Left out. The first tweet now stands alone and the thread carries the cost and the gain.

5. The limit up front.
   Pattern: [app] does [one thing] and nothing else. No [adjacent thing], on purpose.
   Example: Lintline does one thing: it fails the build when a migration has no down step. No schema diffing, on purpose.
   Use when the app is narrow and that is the point; the thread lists what it does do, one item per tweet.
   Rewritten for v4: the v3 close "What it does do:" was the same colon open loop. The list moved into the thread, one item per tweet.

6. Before and after, with a number you own.
   Pattern: [task] took [N] with [old way]. With [app] it takes [M]. Both numbers from our own runs.
   Example: Rebuilding the search index took [N] minutes with the shell script. With Docsift it takes [M]. Both numbers from our own runs.
   Use only when both N and M are in proof_points. Never fill the slots from memory.

7. The one command.
   Pattern: One command: [cmd]. Then [what appears], in [where].
   Example: One command: pinmap scan. Then every listening port and its process, in one table, no root needed.
   Use when the first run is the demo.

8. What I got wrong.
   Pattern: I assumed [assumption]. It was not true: [what was true]. So I built [app].
   Example: I assumed our retries were idempotent. They were not: the same webhook hit the billing handler twice. So I built Retryd.
   Use when the lesson is the hook. Self-aware, no moral tacked on the end.

9. The release note as a post.
   Pattern: [app] [version from the profile] is out: [the one change], so [what that removes or fixes].
   Example: Retryd 2.0 is out: replays are now per endpoint, so one dead webhook no longer holds up the whole batch.
   Use when the profile shows prior releases; the launch is a version, not a debut, and the version and the change come from the profile or the slot stays a slot.
   New in v4, for rule 20: nine of the ten evaluated apps were established, and a debut hook made every one of them read as false. Source: RocketRide, this task (EVAL-10-APPS.md clusters 3 and 10).

10. The number you can check.
    Pattern: [one public number from proof_points], and one sentence on what the app does.
    Example: [N] GitHub stars and one job: it fails the build when a migration has no down step.
    Use when the profile holds one strong public number; the number is stated bare, never with what those people think, and never filled from memory.
    New in v4, for rule 3: one public number, stated bare. Source: RocketRide, this task (judged.json documenso, stars attributed to "developers who agree"; hoppscotch, judged strongest for its bare stack line).

11. The one-liner, plainly.
    Pattern: [APP_PROFILE.one_liner]. [category].
    Example: A CLI that checks hackathon repos for commits older than the event date. Judging tooling.
    Use only when THIN_PROFILE is set: nothing is added, no mechanism, no story, no number; the post is short and true.
    New in v4, for GLOBAL_RULES 12: the only hook allowed when THIN_PROFILE is set, because every other pattern has a slot the profile cannot fill. Source: RocketRide, this task (the THIN_PROFILE block in `src/domain/questions.ts`; EVAL-10-APPS.md cluster 16, hack-judge).

## Quick checklist

Adapted from the source's six-question checklist and extended for v4. It is not sent to the model, because every item is already a rule; run it before returning the JSON, and run it again by hand on a draft the gate passed.

1. Does the first line say the specific thing, inside 8 words, and not the campaign angle's slogan?
2. Is the post under 280 characters with {APP_URL} as its last line, and every thread tweet under 250?
3. Does every tweet read on its own when quoted?
4. Does every number, quote and capability trace to APP_PROFILE?
5. Does the thread end on a question or a next step, not a follow, repost or like ask?
6. Zero corporate speak, zero hype words, zero dashes, zero exclamation marks, zero named products in a comparative sentence?
7. Are the two alt_variants built on different hook patterns from the main post and from each other, each opening on a different fact?
8. Does the post carry {APP_URL} exactly once, does each variant carry it last, and does no thread tweet carry it at all?
9. Is there exactly one traction count in the post, stated bare, with nothing said about what those people think?
10. Is every capability in the draft stated by APP_PROFILE rather than inferred, and does every privacy, security or compliance line carry the profile's own condition and edition?
11. Does warnings describe the draft exactly as returned, with no narrated fix and no character or word count?
12. For an established product: does the post read as a release with a version or a change from the profile, not as a debut?

## Mechanical checks

Checks a program enforces on the returned JSON before the draft reaches the store. They live in `RULEBOOK_CHECKS['x_post']` in `src/lib/rulebook-checks.ts` and run in `runRulebookCheckHits` in `src/domain/gates.ts`. Thirty-three checks: fourteen hard, nineteen soft.

How to read the table:

- **Kinds.** The gate knows seven: `max_chars`, `min_words`, `max_words`, `max_count`, `forbidden_regex`, `required_regex` (the field must match) and `required_prefix`. x_post uses four of them: 27 `forbidden_regex`, 3 `max_chars`, 2 `max_count`, 1 `min_words`. `required_regex` and `required_prefix` and `max_words` are unused here, and so is the optional `when` guard (`{ field, regex }`, which runs a check only when another field matches), because X has one venue and no venue-scoped title shape; the guard exists for the Reddit title checks that read the `venue` field the runner stamps.
- **Field.** `post`, `thread_extension`, `alt_variants` and `warnings` name a field; `*` (and `all`, which `fieldsOf` treats identically) means every string field plus every string inside an array, minus `META_FIELDS`. For an array field a `max_chars` or `forbidden_regex` check reads each item and reports it as `thread_extension[2]`; a `max_count` check reads the array's length. Open point 4 is closed by this convention.
- **Hard or soft.** `runRulebookCheckHits` resolves `c.hard ?? (HARD_KINDS.has(kind) || HARD_IDS.test(id))`. `HARD_KINDS` is `max_chars`, `max_words`, `max_count`, `required_prefix` and `required_regex`; `HARD_IDS` matches the id tokens `banned_verb`, `brand_banned`, `s_word`, `raw_links`, `raw_urls`, `url_in_body`, `link_present`, `link_once`, `url_at_most_once`, `url_max_once`, `vote_ask`, `vote_or_reciprocity`, `no_dash` and `no_dashes`. The table says which route made each check hard: (kind), (id) or an explicit (flag). A hard failure is a blocker: it lands in `data.blockers`, the draft card shows it in a no-go banner reading "fix before posting", and `runAsset` in `src/data/api.ts` runs one repair pass that names the blockers and keeps whichever of the two drafts has the smaller overage. `approveAsset` itself does not refuse the approval, so the banner, the count the Approve button carries as `data-blockers`, and the repair pass are what hold the line.
- **Flags.** The default is `i`, or `iu` when the value carries a `\u{...}` escape. Three checks set `flags: ''` on purpose so their case classes bite (x_no_competitor_framing, x_no_competitor_negativity, x_post_all_caps_run) and x_emoji_limit sets `iu` for its Unicode property escapes; the field column names a flag whenever the check sets one.
- **Values.** Quoted as a JavaScript engine reads them, with single backslashes, not as the doubled-backslash TypeScript literals in the source. A `|` inside a value is written `\|` so the table renders; the regex reads a bare `|`. The two dash code points are written `\u2014` and `\u2013`, which is how the source writes them too.
- **max_count counting.** `countIn` decides what a count means for a string field: an id holding `url` counts `{APP_URL}`, `raw_links` counts real addresses, `paragraph` counts blank-line breaks, `product_name` counts the product's name from the stamped `app_name`, and anything else counts hashtags. Both x_post `max_count` checks read arrays, so `countIn` never runs here.
- **v4.** "added" means the check is new in version 4; "changed" means its value, flags or hardness moved; an empty cell means it is carried from version 3 unchanged.

| id | kind | value | field | hard or soft | what it catches | v4 |
|---|---|---|---|---|---|---|
| x_post_max_chars | max_chars | 280 | `post` | hard (kind) | the post is over the platform cap, {APP_URL} counted in (ASSET_LIMITS holds the same 280) |  |
| x_post_min_words | min_words | 8 | `post` | soft | a post that is a bare link and a noun |  |
| x_post_url_at_most_once | forbidden_regex | `\{APP_URL\}[\s\S]*\{APP_URL\}` | `post` | hard (id) | a second {APP_URL} in the post |  |
| x_no_raw_links | forbidden_regex | `https?://\|www\.` | `*` | hard (id) | a real address anywhere; the only link is the placeholder |  |
| x_thread_max_count | max_count | 4 | `thread_extension` | hard (kind) | a fifth thread tweet |  |
| x_thread_tweet_max_chars | max_chars | 250 | `thread_extension` | hard (kind) | a thread tweet that will not fit a quote |  |
| x_thread_no_numbering | forbidden_regex | `^\s*\d+\s*[/.)]` | `thread_extension` | soft | a "1/", "2." or "3)" prefix; X renders the thread |  |
| x_post_no_thread_marker | forbidden_regex | `🧵\|^\s*thread\b\|\s1/\s*$\|\(1/\d*\)` | `post` | soft | a thread emoji or a "1/" marker on the post |  |
| x_alt_max_count | max_count | 2 | `alt_variants` | hard (kind) | a third alt variant |  |
| x_alt_max_chars | max_chars | 280 | `alt_variants` | hard (kind) | a variant that is not a postable post |  |
| x_no_dash | forbidden_regex | `[\u2014\u2013]` | `*` | hard (id) | a dash that survived sanitizeDraft; the belt on the sanitiser, and gateAsset warns separately |  |
| x_no_s_word | forbidden_regex | `\bs[h]ip(?:s\|ped\|ping\|pable)?\b\|universal\s+api\s+ke[y]\|\bone\s+(?:api\s+)?ke[y]\s+(?:for\|covers\|to access\|unlocks)\s+(?:all\|every\|hundreds)` | `*` | hard (flag) | the banned launch verb in every form including the adjective, and the deprecated one-key framing | changed |
| x_no_hype | forbidden_regex | `game.?chang\|revolutionar\|groundbreak\|\bviral\b\|seamless\|unleash\|supercharg\|(?:\b\d+(?:\.\d+)?x\s+(?:faster\|slower\|better\|cheaper\|smaller\|bigger\|lighter\|quicker\|more\|less\|the\|dev\|developer\|engineer\|growth\|productivity\|results?\|value)\b\|\b10x\b)\|\d+ times (faster\|better\|more)\|excited to announce\|thrilled to\|big news\|proud to\|delighted to\|pleased to announce\|world.?s first\|first.ever\|blazing\|lightning.fast\|cutting.edge\|next.gen\|best.in.class\|state.of.the.art` | `*` | soft (flag) | hype words, announcement filler, superlatives and Nx multipliers | changed |
| x_post_no_announcement_opener | forbidden_regex | `^\s*(introducing\|excited\|thrilled\|big news\|ever wonder\|what if\|have you ever\|are you)` | `post` | soft | an announcement or rhetorical-question first line |  |
| x_no_engagement_asks | forbidden_regex | `limited (?:spots\|time\|seats\|offer)\|only \d+ (?:spots\|seats\|left)\|last chance\|don.?t miss\|ends (?:tonight\|today\|at midnight)\|\bhurry\b\|\d+ (?:hours\|days) left\|\bcountdown\b` | `*` | soft (flag) | scarcity, a countdown, urgency | changed |
| x_no_competitor_framing | forbidden_regex | `[Bb]etter than\|[Ww]orse than\|\b[Uu]nlike [A-Z]\|\b[Ii]s dead\b\|[Ss]top using\|\bkills? [A-Z]\|\b[Bb]eats [A-Z]\|\b(?:[Oo]ne\|[Ss]ome) ?thing (?:that )?[A-Z][a-z][A-Za-z0-9]* (?:does\|do\|can\|will)(?:n[’']t\| not)\b\|[A-Z][A-Za-z0-9]+[- ]killer\b\|\b[Dd]itch [A-Z]` | `*`, flags `` | soft (flag) | better-than-X, "unlike Docker", "X is dead", "Ditch GA4", "one thing Bitly does not" | changed |
| x_no_ai_tells | forbidden_regex | `keep (thinking about\|coming back to)\|pattern I keep seeing\|let that sink in\|here'?s the thing\|hot take\|\b[1-4] ?a\.?m\b\|worth watching\|\bread that again\b\|\bnobody (?:talks\|tells you) about\b\|\bthe harsh truth\b\|\bspoiler alert\b` | `*` | soft (flag) | the tells of brand rulebook 1.3 plus the X-native ones ("Read that again", "Hot take:") | changed |
| x_hashtag_limit | forbidden_regex | `#\w+[\s\S]*#\w+` | `*` | soft | a second hashtag in one field |  |
| x_no_exclamation_or_ellipsis | forbidden_regex | `!\|\.\.\.\|…` | `*` | soft | an exclamation mark or an ellipsis that trails off |  |
| x_no_vote_ask | forbidden_regex | `\bup-?vot\w*\|\bvote (?:for\|us\|me\|it\|this\|now\|today\|here\|if)\b\|\b(?:cast\|drop\|give) (?:a\|your\|us a) vote\b\|\bevery vote\b\|\bvotes? (?:count\|matter)\b\|\bvoters? (?:get\|win\|receive)\b\|\b(?:top of\|climb\|hit\|reach\|win\|on) the leaderboard\b\|\bleaderboard (?:spot\|position\|rank)\b\|\bhelp us (win\|reach\|climb\|trend\|get to\|hit\|stay)\b\|\breach (#\|number \|no\.? ?)?1\b\|(#\|\bnumber \|\bno\.? ?)1 (on\|of the day\|today\|spot)\b\|\bproduct of the (day\|week\|month)\b\|\btop (post\|product) (of the day\|badge)\b\|\bsupport (our\|the\|this\|my) launch\b\|\b(love\|appreciate\|need\|value) your support\b\|\byour support (means\|would\|helps\|matters\|counts)\b\|\b(thanks?\|thank you\|grateful) for (your\|the\|all the) ((\w+ )?support\|love)\b\|\bshow (some\|your\|us some) (love\|support)\b\|\bsupport us\b\|\bin exchange for\b\|\breturn the favou?r\b\|\b(i'?ll\|we'?ll) (support\|back\|boost) yours\b\|\bfollow (?:me\|us\|for more)\b\|\brepost (?:this\|if)\b\|\bretweet\b\|\blike (?:this (?:post\|tweet\|thread)\|if you)\b\|\bplease (?:like\|share\|repost\|retweet)\b\|\bshare (?:this\|it) with\b\|\btag (?:a friend\|someone)\b\|\bsmash (?:that\|the)\b\|\blink in bio\b` | `*` | hard (flag) | every vote, follow, repost, like, tag, share and reciprocity ask, the softened forms included | added |
| x_thread_url_in_body | forbidden_regex | `\{APP_URL\}` | `thread_extension` | hard (flag) | the placeholder in a thread tweet (plausible thread tweet 4) | added |
| x_post_link_present | forbidden_regex | `(?<![\s\S])(?![\s\S]*\{APP_URL\})` | `post` | hard (flag) | a post with no {APP_URL} at all: the empty-match lookahead fails once for the whole field | added |
| x_alt_link_present | forbidden_regex | `(?<![\s\S])(?![\s\S]*\{APP_URL\})` | `alt_variants` | hard (flag) | a variant with no {APP_URL} | added |
| x_emoji_limit | forbidden_regex | `\u{1F680}\|\p{Extended_Pictographic}[\s\S]*\p{Extended_Pictographic}` | `*`, flags `iu` | soft | the rocket, or a second emoji in one field | added |
| x_post_one_proof_point | forbidden_regex | `\b\d[\d,.]*\+?\s?[km]?\s*(?:github\s+)?(?:stars?\|forks?\|users?\|downloads?\|installs?\|developers?\|teams?\|companies\|customers?\|contributors?\|signups?\|sign-ups\|subscribers?\|clones?\|deployments?)\b[\s\S]*\b\d[\d,.]*\+?\s?[km]?\s*(?:github\s+)?(?:stars?\|forks?\|users?\|downloads?\|installs?\|developers?\|teams?\|companies\|customers?\|contributors?\|signups?\|sign-ups\|subscribers?\|clones?\|deployments?)\b` | `post` | hard (flag) | two traction counts in the post (continue: 35,870 stars and 5,359 forks) | added |
| x_no_contrast_shape | forbidden_regex | `(?:^\|[.!?]\s+\|\n)not (?:just\|only\|merely)\b[^.,;:\n]{1,40}[,;:.]\|\bit.s not (?:just \|only )?[^.,;\n]{1,40}[,.;] it.s\b\|\bnot [^,.\n]{1,40}, just\b` | `*` | soft | "Not just a count, a revenue signal" and the "it is not X, it is Y" shape | added |
| x_no_competitor_negativity | forbidden_regex | `\b(?!(?:It\|This\|That\|We\|You\|They\|He\|She\|The\|Each\|Every\|Our\|Your\|My\|Nothing\|Everything\|Something\|Most\|Some\|No\|One\|All\|Both\|Which\|What\|Who\|Then\|Now\|Here\|There\|Also\|And\|But\|So\|If\|When\|Because\|Nobody\|Everyone)\b)[A-Z][A-Za-z0-9.]+(?:,? (?:and\|or) [A-Z][A-Za-z0-9.]+)* (?:locks?\|buries\|bury\|hides?\|traps?\|charges? (?:you\|extra\|for)\|gouges?\|holds? your \w+ hostage\|nickel-and-dimes?\|is (?:dead\|slow\|bloated\|overkill\|broken\|expensive)\|are (?:dead\|slow\|bloated\|overkill\|broken\|expensive)\|(?:does\|do\|can)(?:n[’']t\| not) (?:touch\|care\|let you\|support\|offer))\b` | `*`, flags `` | soft | a named product with a negative verb ("Qualtrics and SurveyMonkey lock your response data") | added |
| x_no_star_attribution | forbidden_regex | `\b(?:stars?\|users?\|developers?\|teams?\|forks?\|downloads?) (?:from (?:people\|developers\|teams\|users) )?(?:who\|that) (?:agree\|chose\|switched\|trust\|believe\|know\|get it\|love\|want\|understand)\b` | `*` | soft | "14,980 GitHub stars from developers who agree" | added |
| x_no_absolute_privacy_claim | forbidden_regex | `\b(?:never\|nothing\|no data\|zero data) (?:ever )?(?:leaves?\|is sent\|gets sent\|sent\|goes)\b\|\bno (?:third\|3rd)[- ]part(?:y\|ies)\b\|\b(?:zero\|no) (?:tracking\|telemetry)\b` | `*` | soft | "your data never leaves your machine" with no condition attached | added |
| x_no_money_figures | forbidden_regex | `\bMRR\b\|\bARR\b\|\$\s?\d\|\d[\d,.]*\s?(?:USD\|EUR\|GBP)\b\|\bper (?:seat\|month\|user)\b\|/mo\b` | `*` | soft | a price, MRR or ARR figure | added |
| x_warnings_no_narrated_fix | forbidden_regex | `\b(?:has\|have\|was\|were) been (?:removed\|revised\|dropped\|rewritten\|replaced)\b\|\b(?:removed\|revised\|rewritten\|dropped\|replaced) to (?:comply\|avoid\|keep\|stay)\b\|\brevised to\b\|\bwould be safer\b\|\bno comparison framing\b\|\bcomplies with\b\|\bapproximately \d+\b\|\b\d+ characters, (?:within\|under)\b` | `warnings` | soft | a warning that narrates a fix the draft never applied, or states a count | added |
| x_post_all_caps_run | forbidden_regex | `\b[A-Z]{4,}(?:\s+[A-Z]{4,}){2}\b` | `*`, flags `` | soft | three words in capitals in a row ("DITCH GA4. START FREE.") | added |
| x_no_fragment_punchline | forbidden_regex | `(?:^\|[.!?]\s)(?:\w[\w'’,-]*(?:\s\w[\w'’,-]*){0,2}\.\s){2}\w[\w'’,-]*(?:\s\w[\w'’,-]*){0,2}\.` | `*` | soft | three one-to-three-word sentences in a row | added |

Known limits of the checks, verified when v4 was merged:

- A pattern JavaScript cannot compile is skipped, never fatal, and the first hit per check stops that check's sweep of the remaining fields, so one fault yields one warning.
- x_post_link_present and x_alt_link_present are the required-pattern workaround: the value matches the empty string at position 0 only when the field holds no `{APP_URL}` anywhere. The hit therefore carries no evidence text, and the check fires once for the whole field. It is built the same way as the newsletter rulebook's pitch_link_present.
- x_no_competitor_negativity runs case-sensitive and reads any capitalised word outside its pronoun exclusion list as a product name, so a capitalised sentence-start subject trips it ("Rebuilding locks the index"). It is soft for that reason, and the judgment stays with GLOBAL_RULES 11 and rule 6.
- x_no_exclamation_or_ellipsis matches `!=` inside a code fragment. Left as it is, noted here.
- x_no_dash and x_no_s_word are belts, not the first line of defence: the sanitiser has already swapped both by the time the gate reads the draft. What reaches them is a form the sanitiser does not swap, which is why the adjective form of the banned verb now blocks.
- x_no_vote_ask took the vote, follow, repost, like, tag and share half of the old x_no_engagement_asks, which kept the scarcity half. Two forms were dropped in the split because they misfired: `like (if|this)` matched "a tool like this", and a bare `RT` matched any "rt" token.
- Not verified end to end: the 33 checks were never run over the stored eval drafts (`docs/eval-10/<slug>/appstate.json`) as a batch. What was verified when v4 was merged is each added and changed regex against its own positive and negative samples in node, and the evidence behind every addition is the line quoted from `docs/eval-10/judged.json` in the rule or check that cites it.

Not expressible with the current kinds, so left to the rules and to the model: the minimum of two thread tweets and the exact count of two variants (no `min_count` kind exists); sentence case in full (an ALL CAPS regex would fail on JSON, CLI and SDK, so x_post_all_caps_run only catches a run of three long capitalised words); the 8-word hook; "each tweet stands alone when quoted"; the different-pattern and different-fact requirements on alt_variants (no cross-field kind); and every judgment rule, which is 8, 16, 18, 19 and 20.

## Storage and versioning

This file matches rulebook version 4: `RULEBOOK_VERSION = 4` in `src/lib/rulebooks.ts`, 12 GLOBAL_RULES, 20 x_post rules, 11 hook patterns, 33 machine checks.

**Where the rules live at run time.** `seedRulebooksIfEmpty` in `src/data/seed.ts` inserts each default rulebook into the `platform_rules` table, with `source: 'default'` and `version: RULEBOOK_VERSION`. `rulesFor` in `src/data/rules.ts` reads the newest row for the platform by `updated_at` and falls back to the code default.

**How a stored row goes stale.** `isStale` marks a row whose `source` is anything other than `owner` and whose `version` is below `RULEBOOK_VERSION`. A stale row is ignored, the code default is used in its place, and on the next load the seed inserts the v4 default above it rather than editing it, so the store keeps a record of which version every earlier draft was written against. A v3 seeded row therefore stops governing drafts the moment this version landed, without being deleted.

**How an owner edit survives.** A row with `source: 'owner'` is never stale, whatever its version, so a Settings edit outlives every later default and the seed skips the platform entirely. The cost is the mirror image: an owner-edited x_post rulebook does not receive the v4 rules, and the owner has to fold them in by hand. A stored row that holds no hooks keeps the default hooks, so an owner edit that saved only rules still sends the eleven patterns.

**What every draft carries.** `runAsset` in `src/data/api.ts` reads `rulebookMeta` and stamps `rulebook_version` and `rulebook_source` on every draft, so a re-run can prove which rules the model saw: the version is the stored row's when a live row governs, and `RULEBOOK_VERSION` with source `default` when the code default does. Beside them it stamps `venue` (when a target was passed), `app_name` (so a mention count and the draft agree on the product's name) and the three sanitiser counts, and the gate adds `warnings` and `blockers`. All of these are `META_FIELDS`, so no `*` check reads them.

**Which sanitiser passes run before the gate.** In this order:

1. `sanitizeDraft` (`src/domain/sanitize.ts`), inside `ask` in `src/data/runner.ts`, as the pipe result comes back: every em dash and en dash in every string becomes a comma, with an unspaced en dash inside a range becoming a hyphen, and the count is stored for `punctuationFixed` to read and show on the card as `punctuation_fixed`.
2. `sanitizeVerbs`, in `draftOnce`, which walks every field except `warnings` and runs `cleanVerbs` then `cleanSlop`: the banned launch verb becomes release, releases, released or releasing with the first letter's case kept (`wording_fixed`), and each of the 67 terms in `src/lib/slop-lexicon.ts` becomes its plain replacement, longest term first (`slop_fixed`). `warnings` is left alone so it can quote the draft's faults as written.
3. `gateAsset` (`src/domain/gates.ts`): the `ASSET_LIMITS` cap on `post` (280), a dash warning per field, then the 33 rulebook checks, then `warnings` and `blockers` written back onto the draft.

The order is why the two swapped faults are checked at all: a dash or a verb form that the sanitiser handles is gone before the gate reads it, and what reaches x_no_dash or x_no_s_word is a form the sanitiser does not handle. The swap can also leave an odd sentence ("It releases as an npm package"), which no check can catch and only rule 5 can prevent.

## Left out, and why

- `references/hooks.md` and `references/examples.md`: `examples.md` was never opened; `hooks.md` was opened once in the v4 reconciliation only to compare, and nothing was taken. The review read them and marked them creator-economy ("made more in 30 days than a year at my job"). The hook library above replaces them.
- The two echoes of `hooks.md` that survived into v3 and were removed in v4: the close "Here is why:" on hook 4 (the source's Contrarian close is "Here's why:") and the colon that ended hooks 4 and 5, which is the open-loop device this section already listed as left out. No hook pattern was dropped in v4; the library went from eight patterns to eleven.
- The source's stated goal of engagement-maximising tweets, "Hook or Die", and the one-second-to-stop-the-scroll framing: hype framing, contrary to brand rulebook 3.1. The hook rule (2) keeps the mechanic (the first line does the work) without the framing.
- The close's "Final CTA: direct ask (follow, repost, reply)": a vote ask and a reciprocity tactic, banned by the governing rules. Replaced by rule 9, and since v4 blocked by x_no_vote_ask.
- "Cliffhangers every 1 to 2 tweets" and the "open loop" hook type: FOMO mechanics. Replaced by "each tweet stands alone" (rule 7).
- The "bold statement / shock" hook type: invites unverifiable claims. Replaced by the four verifiable hook contents in rule 2.
- Thread length of 5 to 10 tweets with 7 as the sweet spot: the pipe contract is 2 to 4 extension tweets, and a launch post does not need seven. The frameworks were resized instead.
- "Engagement Mechanics" and "Algorithm Signals" (time-on-post, first-hour engagement, saves): unverifiable claims about X's ranking, and not drafting rules.
- "Best Posting Times" (Tuesday to Thursday, 9 to 11 and 1 to 3 Eastern): scheduling, not drafting; unsourced. If wanted it belongs in the plan stage with a source. The LinkedIn rulebook carries its launch-week timing as a warnings line only, which is the pattern to follow if X ever needs one.
- The tone list ("Conversational, not formal", "Slightly provocative", "Authentic, not performative"): too vague for a drafting model. Replaced by rules 11, 12 and 14, which name the exact patterns to avoid.
- "Links in main tweet (reduces reach)": conflicts with the pipe contract that puts {APP_URL} in the post. Not adopted; see Open points. v4 went the other way and made the placeholder's presence a hard check.
- The Contrarian framework's "Why they're wrong" step: turns into "better than X" the moment a product is named. Replaced by "what it costs you", with no named target.
- The v2 default's "Lowercase throughout is welcome": contradicts brand rulebook 3.2 for X posts. Replaced by rule 11; the summary line in `rulebooks.ts` was corrected with it, so Open point 1 is closed.
- "1-2 hashtags max": loosened relative to our default. Kept the default's "none, or at most one" and defined the one exception.
- "alternative to X" as a competitor pattern: left out of x_no_competitor_framing on purpose. GLOBAL_RULES 11 allows a competitor as a neutral fact, and the phrase is often exactly that. It is worth adding only if the owner makes that check hard (see Open points).
- Two alternations from the old x_no_engagement_asks value, `like (if|this)` and a bare `RT`: dropped in the v4 split because they matched "a tool like this" and any "rt" token. The ask half of that check moved to x_no_vote_ask, where the same intent is written with tighter alternations.
- A `min_count` kind: proposed in v3 Open point 3 and still not built, so the lower bounds in rules 7 and 10 remain unchecked. `required_regex` from the same open point does now exist in the gate, but x_post gets the same result from a `forbidden_regex` lookahead, so it uses that.

## Open points for the owner

1. Capitalization. Closed for v4. Rule 11 follows brand rulebook 3.2, and the x_post summary line in `rulebooks.ts` now reads "One idea, the specific thing in the first eight words, the link last, no hashtags", with no lowercase permission in it. The account case is open under point 5.
2. Link placement. Open, unchanged. The source advises keeping links out of the first tweet; the pipe contract puts {APP_URL} in the post and rule 4 follows the contract, which v4 hardened into x_post_link_present. If the owner prefers the link in the last thread tweet, the `ASSET_TYPE=x_post` line in `lk_assets.pipe`, `ASSET_LIMITS`, rule 4 and three checks all have to move together; until then the rule stands.
3. Check kinds. Half closed. `required_regex` exists in the gate now, and the presence of {APP_URL} is enforced without it by an empty-match lookahead. A minimum array length still has no kind, so "thread_extension at least 2" and "alt_variants exactly 2" are trusted to the model. Suggested addition: `min_count`.
4. Field convention. Closed. `fieldsOf` accepts `all` and `*` as the same thing, meaning every string field plus every string in an array, minus `META_FIELDS`.
5. Account context. Open, unchanged, and it needs Joe. Brand rulebook 3.5 varies the RocketRide-mention rule by account, and rule 11 applies 3.2 to every X draft. Launch Kit drafts in the builder's voice for the builder's app, so rule 15 takes the profile as the source of truth; a launch posted from the RocketRide brand account, or from Joe's own account with its lowercase openers, would need a TONE override rather than a rule change. The Reddit rulebook already caps its mention level when TONE says the post goes out from Joe's personal account; X has no equivalent signal.
6. The one-key framing on a builder's own product. Open. x_no_s_word is hard and matches "universal API key" and "one API key for/covers/to access all, every or hundreds". Brand rulebook 1.2 is about RocketRide's own copy, but Launch Kit drafts for any app, so a builder whose product genuinely is a model aggregator would be blocked from describing it. The regex is deliberately narrow. If the owner wants only RocketRide copy policed, this half should be split into a separate soft check. Evidence: brand rulebook 1.2 and 5.4 (the Aug 19, 2026 correction).
7. Is one proof point the right hard limit? Open. x_post_one_proof_point blocks a post carrying two traction counts, on the strength of rule 3 and EVAL-10-APPS.md cluster 20. A list-shaped post with two counts is the case it will hurt. If the owner finds it too blunt, drop the `hard: true` and keep the warning; the rule does not change either way. Evidence: `docs/eval-10/judged.json`, continue, whose post carried 35,870 stars and 5,359 forks and was approved before this check existed.
8. Are the two competitor checks the right severity? Open. Brand rulebook 4.1 calls "better than X" positioning a blocker, and the brand-check severity tiers agree, but x_no_competitor_framing and x_no_competitor_negativity are both soft here because their precision is not blocker-grade: the first rests on case classes, the second misfires on a capitalised sentence-start subject. The owner may flip x_no_competitor_framing to hard, in which case "alternative to X" deserves a second look (see Left out). Evidence: brand rulebook 4.1; `docs/eval-10/judged.json`, formbricks and dub.
9. Foundation model providers. Open, and explicitly for Joe. Brand rulebook 4.3 records no settled policy on naming OpenAI, Anthropic, Google or Meta in a comparative context, and says to flag it. Rule 15 forbids naming any provider in a comparison, so an app profile that treats one of them as its rival now trips x_no_competitor_framing or x_no_competitor_negativity as a warning. Someone has to decide whether that is the wanted behaviour when the content is a builder's app rather than RocketRide's own. Evidence: brand rulebook 4.3 ("WARNING: FLAG FOR JOE. Policy not explicitly confirmed in writing.").
10. The App Builder name. No X rule and no hook names it, which is what brand rulebook 5.2 asks for while bucket 3 has no public name. Nothing to decide unless a name is settled; recorded here so the next reconciliation does not add one.
