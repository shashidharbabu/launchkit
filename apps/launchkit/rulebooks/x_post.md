# X rulebook: x_post

Drafted 2026-09-11 from `docs/social-launch-skills-review.md` (X verdict: PARTIAL). This file is the reference. The drafting model receives only the numbered lines under "Rules adopted", verbatim, inside the `PLATFORM_RULES` block that `src/data/rules.ts` builds, followed by `GLOBAL_RULES`. Nothing here is merged into `src/lib/rulebooks.ts` yet; the orchestrator merges. Brand-check has not yet run on this file.

## What the model produces

From `pipelines/lk_assets.pipe`, the `ASSET_TYPE=x_post` output line:

- `post`: one tweet, max 280 characters, hook first, one concrete proof point, `{APP_URL}`.
- `thread_extension`: 2 to 4 follow-up tweets.
- `alt_variants`: 2 posts built on different hooks.
- `warnings`: strings.

The post launches the builder's app. It is written in the builder's voice from the approved app profile, the Business DNA and the chosen campaign angle. `BRAND_DNA` wins over `APP_PROFILE.voice`; an explicit `TONE` override wins over both.

## Sources

| Source | Path | Version | License | How it was used |
|---|---|---|---|---|
| jamesgray007/hoai-course | `.claude/skills/writing-x-posts/SKILL.md` | commit de68d9691036e12f92a57314284234002e7f9ff4, 2025-12-18 | None. No LICENSE file in the repo; the README's License section reads "This repository is provided as a learning resource for course participants." | Structure only, re-expressed in our words: the single-post shape, the four thread frameworks, the formatting rules, the quick checklist. No sentence is copied. |
| jamesgray007/hoai-course | `.claude/skills/writing-x-posts/references/hooks.md` and `references/examples.md` | same | same | Not opened, not used. The review marks them creator-economy. The hook library below is written fresh. |
| RocketRide brand rulebook | `.claude/rules/skills/brand-check/references/rulebook.md`, sections 1 to 3 | 2026-08-19 | internal | Governing rules: banned vocabulary (1.1), framing (1.2), AI tells (1.3), positioning (2), tone and capitalization (3.1 to 3.3), off-brand examples (3.4), account rules (3.5). |
| Launch Kit | `src/lib/rulebooks.ts` (GLOBAL_RULES, current x_post default), `src/domain/gates.ts` (ASSET_LIMITS, dash gate), `src/domain/sanitize.ts`, `src/data/rules.ts` | working tree | internal | What code already enforces, so the rules here do not contradict it. |
| Review | `docs/social-launch-skills-review.md`, X section and step 4 of the handoff | 2026-09-10 | internal | The keep list (single-post structure, four frameworks, checklist) and the drop list (hooks.md, examples.md, engagement CTAs). |

Mechanical sweep of the source `SKILL.md` at adoption, using the review's three greps: s-word 0, dashes 1 (line 19, in prose), hype 1 (line 3, the front-matter description). Neither line was carried over.

Because the source carries no open-source license, adoption is limited to ideas: a post holds one idea, a thread follows one of four step orders, a checklist runs before output. Every idea is rewritten and resized to our contract. Nothing from the source appears verbatim in this file or in the rules.

A note on one word. Brand rulebook 1.1 bans the verb for delivering software (the four-letter s-word) in every form, with no exceptions and no context. This file and the rules spell it letter by letter (s-h-i-p) where the model must recognise it, and the mechanical check matches it with a regex that does not contain the literal word, so a brand sweep of this folder returns zero hits for it.

## Rules adopted

Each rule is one line the drafting model can obey, ordered by importance. "From" names the origin. "Changed" says what moved from the source or from the current default in `rulebooks.ts`.

1. The post is under 280 characters including {APP_URL}; aim for 200. It carries exactly one idea: what the app does, in specific nouns, or one thing that changed while building it.
   From: source "Single Post" (under 280, under 200 is better, one idea per tweet); current default line 1. Changed: the budget explicitly includes the link placeholder; "one idea" is defined so the model cannot read it as "one topic".

2. The first line is the hook and it states the specific thing inside the first 8 words: the input and the output, the error you hit, the decision you made, or a number from APP_PROFILE.proof_points. Never open with a question, "Introducing", "Excited to announce", "Big news", or a thread emoji.
   From: source "The Hook (Tweet 1)"; current default "Hook in the first six words". Changed: the source's hook types (bold statement, tension, twist, open loop) are replaced by four concrete things a developer can verify; the openers list comes from GLOBAL_RULES and brand rulebook 3.4.

3. Use exactly one proof point from APP_PROFILE.proof_points in the post. If the profile has none, state what the app does in plain terms and put "no proof point in profile" in warnings. Never write a number, user count, quote or benchmark that is not in the profile.
   From: pipe contract ("one concrete proof point"); GLOBAL_RULES "never invent metrics"; brand rulebook 2.7 and 5.3. Changed: adds the fallback and the warning so a missing proof point cannot become an invented one.

4. {APP_URL} appears exactly once, as the last line of the post. No other link anywhere in the post or the thread; if a tweet needs a second link, describe where to find it and add a warning.
   From: current default "The link goes last as {APP_URL}"; pipe contract. Changed: "exactly once" and "no other link" are new, so the reach-reducing extra links the source warns about cannot appear.

5. Show, do not tell: replace every evaluative adjective (fast, powerful, simple, seamless, robust) with what the app does, in what time, on what input. Never write s-h-i-p, s-h-i-p-p-e-d or s-h-i-p-p-i-n-g (write launch, release, deploy, roll out) and never game-changer, revolutionary, groundbreaking, viral, seamless, unleash, supercharge, 10x, or "N times faster".
   From: brand rulebook 1.1, 1.3, 3.1 ("Show, don't tell"); GLOBAL_RULES filler list. Changed: adds the X-specific hype set the review found across the packs (viral, unleash, supercharge, Nx faster).

6. Never frame against another product: no "better than", "unlike X", "X is dead", "stop using X", "kills X". State a fact about this app only. If the campaign angle is a comparison, keep it to a plain fact about this app and add a warning that the comparison was dropped.
   From: brand rulebook 4.1 ("Never position RocketRide as better than X. Show, don't tell."), generalised to any app Launch Kit drafts for. Changed: new for X; the source's Contrarian framework had a "why they're wrong" step that invited exactly this.

7. thread_extension has 2 to 4 tweets, each under 250 characters, each a complete thought that reads on its own when quoted. No number prefixes, no "Thread", no thread emoji: X renders the thread.
   From: source "The Body" (each tweet under 250, each stands alone); pipe contract (2 to 4). Changed: the source's 5 to 10 tweet length is replaced by the contract; numbering and the thread marker are dropped (current default already bans the emoji).

8. Pick one thread shape and follow it one step per tweet: build story (what you tried, what broke, what you changed, what it does now); list (2 to 4 concrete things, one per tweet, each with how it works); problem to solution (the pain in specifics, what the app does about it, one thing it does not do yet); take (a common practice, what it costs you, what you do instead, where the take does not hold).
   From: the source's four frameworks (Storytelling, Listicle, Problem-Solution, Contrarian). Changed: compressed from seven steps to the contract's length, the closing CTA step removed, "why they're wrong" replaced by "what it costs you", and an honest-limitation step added to problem to solution. Full table below.

9. The last thread tweet ends on one specific question to developers who have the same problem, or one next step (try it on X, read the docs, open an issue). Never "follow for more", "repost if", "like if", "tag someone", "RT", "link in bio", countdowns, "limited spots", or "last chance".
   From: source "The Close" (punchy lesson, soft CTA) and "What to Avoid" (asking for engagement without providing value). Changed: the source's final "direct ask (follow, repost, reply)" is removed; the governing rules ban vote asks, reciprocity and FOMO. A question or a next step is the only allowed close.

10. alt_variants holds 2 complete posts, each under 280 characters with {APP_URL}, each built on a different hook pattern from the X hook library than the main post. A reworded copy of the main post does not count.
    From: pipe contract ("2 different hooks"). Changed: defines "different" as a different pattern, and makes each variant a full post so it can be swapped in without editing.

11. Sentence case: a capital at the start of every sentence, normal punctuation. No Title Case, no ALL CAPS words except acronyms (JSON, CLI, SDK), no exclamation marks, no ellipsis to trail off.
    From: brand rulebook 3.2 (LinkedIn and X posts use normal capitalization; lowercase starters are for Joe's personal DMs only); GLOBAL_RULES "Sentence case only". Changed: replaces the current default's "Lowercase throughout is welcome", which contradicts 3.2. Flagged under Open points.

12. None of these AI tells: "What I keep thinking about", "I keep coming back to", "The pattern I keep seeing", "Let that sink in", "Here is the thing", "Hot take:", the late-night-outage cliche, and three-fragment punchlines like "Smart team. Solid product. Worth watching."
    From: brand rulebook 1.3 and 3.4. Changed: two X-native tells added ("Let that sink in", "Hot take:").

13. No hashtags. The single exception is a tag APP_PROFILE names as one its community already uses, placed at the end of the post. At most one emoji in the whole draft, never in the first line, never the rocket.
    From: source "1-2 hashtags max (or none)" and "Emojis sparingly"; current default "No hashtags, or at most one"; GLOBAL_RULES "Emoji: at most one". Changed: tightened to none by default, the exception is defined, the rocket is named because the review found it everywhere in the Product Hunt pack.

14. First person in the builder's own voice: "I" for a solo builder, "we" for a team, whichever BRAND_DNA or APP_PROFILE.voice uses. Never third person about yourself, never "we are thrilled" or "proud to".
    From: GLOBAL_RULES "Write like the builder talking to a peer, in first person"; current default "Sound like a person typing, not a brand posting". Changed: pins the pronoun to the profile so the model does not switch mid-thread.

15. Name RocketRide or any other platform, vendor or model provider only when APP_PROFILE or BRAND_DNA lists it and the sentence does not work without it; at most once across the post and thread, never as the subject of the post, never in a comparison.
    From: brand rulebook 3.5 (moderate mentions on the founder's social accounts, only where it genuinely fits) and 4.3 (foundation model providers never in a comparative context). Changed: written for any builder's app, since Launch Kit drafts for the app profile, not for the brand account.

16. Claim only capabilities that APP_PROFILE states. If the campaign angle asks for one the profile does not confirm, leave it out and add a warning naming the missing claim. No pricing, revenue, funding or user numbers unless they are in proof_points.
    From: brand rulebook 2.7 and 5.3 (no unconfirmed capability claims; financial figures never in public content). Changed: generalised to the app profile as the source of truth.

17. warnings lists every dropped claim, every proof point you could not source, and any TARGET rule you had to bend. An empty warnings array means every number and claim traces to the profile.
    From: pipe contract (warnings on every asset) and the reddit_post default's "say so in warnings". Changed: gives warnings a defined meaning so the gate and the owner can trust an empty array.

## Thread shapes

The source's four frameworks assume 5 to 10 tweets. Our contract is the post plus 2 to 4 extension tweets, so each shape is one step per tweet, and the closing "CTA / follow prompt" step is replaced by a question or a next step (rule 9). Tweet 5 is optional.

| Shape | Source framework | Post (hook) | Tweet 2 | Tweet 3 | Tweet 4 | Tweet 5 (optional) |
|---|---|---|---|---|---|---|
| Build story | Storytelling | The outcome, or the moment it first worked | What you were trying to do and what broke (the error, the file, the hour it cost) | What you changed | What it does now, and one limitation you still have | One question to developers who hit the same thing |
| List | Listicle | A count and a noun: "3 things [app] does with [input]" | Item 1, with how it works in one clause | Item 2 | Item 3 (or the last item) | Which one to try first, and what you want to hear back |
| Problem to solution | Problem-Solution | The pain, in specifics: the step, the wait, the file | What the usual workaround costs you (your own experience, no vendor named) | What the app does about it, concretely | One thing it does not do yet | A question or a next step |
| Take | Contrarian | The position, stated plainly, with the practice it questions | What most people do and what it costs (a specific, never a named product) | What you do instead, and the evidence from your own build | Where the take does not hold | A question, not a dare |

Rules for every shape: each tweet stands alone when quoted; numbers come from `proof_points` only; no step names a competitor; the take shape never says another approach is wrong, only what it cost you.

## Developer hook library

Eight patterns, written fresh for this rulebook in the voice brand rulebook 3.3 shows: direct, specific, self-aware, no hype. Slots in square brackets are filled from the app profile. Examples use fictional apps (Docsift, Retryd, Pinmap, Lintline) and carry no real numbers; where a number belongs, the slot stays a slot. A pattern that ends in a colon is a thread opener and must be followed by thread_extension.

1. Plain function line.
   Pattern: [app] turns [input] into [output]. No [manual step you used to do by hand].
   Example: Docsift turns a folder of PDFs into a searchable index. No chunking script to babysit.
   Use when: the app has one clear input and one clear output.

2. The failure that started it.
   Pattern: I built [app] because [the specific failure: the error text, the file it broke, the step that silently failed]. It now [one clause].
   Example: I built Retryd because a cron job dropped a batch of webhooks and nothing logged it. It now replays every failed delivery from a log you can read.
   Use when: the profile's "why built" holds a real incident.

3. The stack, plainly.
   Pattern: [app]: [language], [runtime shape], [licence], [dependency count from the profile]. It does one thing: [thing].
   Example: Pinmap: Go, one binary, MIT, no runtime dependencies. It does one thing: maps every open port to the process that owns it.
   Use when: the reader cares how it is built. Counts come from the profile or the slot stays empty.

4. The unpopular choice.
   Pattern: We picked [choice] over [the expected choice]. Not sure everyone will love that. Here is why:
   Example: We picked SQLite over a hosted queue for the job store. Not sure everyone will love that. Here is why:
   Use when: a design decision is the story. State the decision; never say the other option is worse.

5. The limit up front.
   Pattern: [app] does [one thing] and nothing else. No [adjacent thing], on purpose. What it does do:
   Example: Lintline does one thing: it fails the build when a migration has no down step. No schema diffing, on purpose. What it does do:
   Use when: the app is narrow and that is the point.

6. Before and after, with a number you own.
   Pattern: [task] took [N] with [old way]. With [app] it takes [M]. Both numbers from our own runs.
   Example: Rebuilding the search index took [N] minutes with the shell script. With Docsift it takes [M]. Both numbers from our own runs.
   Use only when both N and M are in proof_points. Never fill the slots from memory.

7. The one command.
   Pattern: One command: [cmd]. Then [what appears], in [where].
   Example: One command: pinmap scan. Then every listening port and its process, in one table, no root needed.
   Use when: the first run is the demo.

8. What I got wrong.
   Pattern: I assumed [assumption]. It was not true: [what was true]. So I built [app].
   Example: I assumed our retries were idempotent. They were not: the same webhook hit the billing handler twice. So I built Retryd.
   Use when: the lesson is the hook. Self-aware, no moral tacked on the end.

## Quick checklist

Adapted from the source's six-question checklist. Run it before returning the JSON.

1. Does the first line say the specific thing, inside 8 words?
2. Is the post under 280 characters with {APP_URL} as its last line, and every thread tweet under 250?
3. Does every tweet read on its own when quoted?
4. Does every number, quote and capability trace to APP_PROFILE?
5. Does the thread end on a question or a next step, not a follow, repost or like ask?
6. Zero corporate speak, zero hype words, zero dashes, zero exclamation marks, zero named products in a comparative sentence?
7. Are the two alt_variants built on different hook patterns from the main post?

## Mechanical checks

Checks a program can enforce on the returned JSON before the draft reaches the store. Field convention: `post` is the post string; `thread_extension` and `alt_variants` mean each array item for `max_chars` and `forbidden_regex`, and the array length for `max_count`; `*` means every string field plus every item of both arrays. Regex values are JavaScript syntax; flags are named in the description. `gates.ts` already enforces the first and the dash check; they are listed so this file is complete on its own.

| id | kind | value | field | description |
|---|---|---|---|---|
| x_post_max_chars | max_chars | 280 | post | post including {APP_URL}, counted in code points (matches ASSET_LIMITS) |
| x_post_min_words | min_words | 8 | post | the post is never a bare link plus a noun |
| x_post_url_at_most_once | forbidden_regex | `\{APP_URL\}[\s\S]*\{APP_URL\}` | post | {APP_URL} at most once; its presence is the pipe contract (see Open points) |
| x_no_raw_links | forbidden_regex | `https?://\|www\.` | * | no raw URL anywhere; the only link is the {APP_URL} placeholder |
| x_thread_max_count | max_count | 4 | thread_extension | at most 4 thread tweets; the minimum of 2 needs a min_count kind (see Open points) |
| x_thread_tweet_max_chars | max_chars | 250 | thread_extension | each thread tweet under 250 characters |
| x_thread_no_numbering | forbidden_regex | `^\s*\d+\s*[/.)]` | thread_extension | no "1/" "2." "3)" prefixes; X renders the thread |
| x_post_no_thread_marker | forbidden_regex | `🧵\|^\s*thread\b\|\s1/\s*$\|\(1/\d*\)` | post | no thread emoji or "1/" marker on the post (case-insensitive) |
| x_alt_max_count | max_count | 2 | alt_variants | exactly two variants; the lower bound needs a min_count kind |
| x_alt_max_chars | max_chars | 280 | alt_variants | each variant is a complete post under 280 characters |
| x_no_dash | forbidden_regex | `[\u2014\u2013]` | * | no em dash or en dash in any string (duplicates the gates.ts check on purpose) |
| x_no_s_word | forbidden_regex | `\bs[h]ip(s\|ped\|ping)?\b` | * | the verb banned in brand rulebook 1.1, every form (case-insensitive) |
| x_no_hype | forbidden_regex | `game.?chang\|revolutionar\|groundbreak\|\bviral\b\|seamless\|unleash\|supercharg\|\b\d+x\b\|\d+ times (faster\|better\|more)\|excited to announce\|thrilled to\|big news` | * | hype and announcement filler (case-insensitive) |
| x_post_no_announcement_opener | forbidden_regex | `^\s*(introducing\|excited\|thrilled\|big news\|ever wonder\|what if\|have you ever\|are you)` | post | the post never opens with an announcement or a rhetorical question (case-insensitive) |
| x_no_engagement_asks | forbidden_regex | `follow (me\|us\|for)\|repost (if\|this)\|retweet\|\bRT\b\|like (if\|this)\|tag (a \|someone)\|link in bio\|limited (spots\|time\|seats)\|only \d+ (spots\|seats\|left)\|last chance\|don'?t miss\|upvote` | * | vote asks, reciprocity and FOMO (case-insensitive) |
| x_no_competitor_framing | forbidden_regex | `better than\|worse than\|\bunlike [A-Z]\|\bis dead\b\|stop using\|\bkills? [A-Z]\|\bbeats [A-Z]` | * | "better than X" positioning; case-sensitive so "unlike most" passes and "unlike Docker" fails |
| x_no_ai_tells | forbidden_regex | `keep (thinking about\|coming back to)\|pattern I keep seeing\|let that sink in\|here'?s the thing\|hot take\|\b[1-4] ?a\.?m\b\|worth watching` | * | brand rulebook 1.3 tells plus two X-native ones (case-insensitive) |
| x_hashtag_limit | forbidden_regex | `#\w+[\s\S]*#\w+` | * | at most one hashtag per tweet |
| x_emoji_limit | forbidden_regex | `🚀\|\p{Extended_Pictographic}[\s\S]*\p{Extended_Pictographic}` | * | never the rocket; at most one emoji per tweet (u flag) |
| x_no_exclamation_or_ellipsis | forbidden_regex | `!\|\.\.\.\|…` | * | no exclamation marks, no trailing-off ellipsis |

Not expressible with the current kinds, so left to the model and the rules: sentence case (an ALL CAPS regex would fail on JSON, CLI, SDK); the 8-word hook; "each tweet stands alone"; the different-pattern requirement on alt_variants; the minimum thread and variant counts; the presence of {APP_URL}.

## Left out, and why

- `references/hooks.md` and `references/examples.md`: not opened. The review read them and marked them creator-economy ("made more in 30 days than a year at my job"). The hook library above replaces them.
- The source's stated goal of engagement-maximising tweets, "Hook or Die", and the one-second-to-stop-the-scroll framing: hype framing, contrary to brand rulebook 3.1. The hook rule (2) keeps the mechanic (the first line does the work) without the framing.
- The close's "Final CTA: direct ask (follow, repost, reply)": a vote ask and a reciprocity tactic, banned by the governing rules. Replaced by rule 9.
- "Cliffhangers every 1 to 2 tweets" and the "open loop" hook type: FOMO mechanics. Replaced by "each tweet stands alone" (rule 7).
- The "bold statement / shock" hook type: invites unverifiable claims. Replaced by the four verifiable hook contents in rule 2.
- Thread length of 5 to 10 tweets with 7 as the sweet spot: the pipe contract is 2 to 4 extension tweets, and a launch post does not need seven. The frameworks were resized instead.
- "Engagement Mechanics" and "Algorithm Signals" (time-on-post, first-hour engagement, saves): unverifiable claims about X's ranking, and not drafting rules.
- "Best Posting Times" (Tuesday to Thursday, 9 to 11 and 1 to 3 Eastern): scheduling, not drafting; unsourced. If wanted it belongs in the plan stage with a source.
- The tone list ("Conversational, not formal", "Slightly provocative", "Authentic, not performative"): too vague for a drafting model. Replaced by rules 11, 12 and 14, which name the exact patterns to avoid.
- "Links in main tweet (reduces reach)": conflicts with the pipe contract that puts {APP_URL} in the post. Not adopted; see Open points.
- The Contrarian framework's "Why they're wrong" step: turns into "better than X" the moment a product is named. Replaced by "what it costs you", with no named target.
- The current default's "Lowercase throughout is welcome": contradicts brand rulebook 3.2 for X posts. Replaced by rule 11; see Open points.
- "1-2 hashtags max": loosened relative to the current default. Kept the default's "none, or at most one" and defined the one exception.

## Open points for the owner

1. Capitalization. The current x_post default and its summary ("Lowercase is fine") permit lowercase throughout. Brand rulebook 3.2 says LinkedIn and X posts use normal capitalization and reserves lowercase starters for Joe's personal DMs. Rule 11 follows the brand rulebook; the summary line in `rulebooks.ts` needs the same change when merged.
2. Link placement. The source advises keeping links out of the first tweet. The pipe contract puts {APP_URL} in the post. Rule 4 follows the contract. If the owner prefers the link in the last thread tweet, the `ASSET_TYPE=x_post` line in `lk_assets.pipe` and `ASSET_LIMITS` need to change first; until then the rule stands.
3. Check kinds. Two limits in the contract have no kind: a minimum count (thread_extension at least 2, alt_variants exactly 2) and a required pattern ({APP_URL} present in post and in each variant). Suggested additions: `min_count` and `required_regex`.
4. Field convention. `*` for "every string field and every array item" is proposed here; the checker needs to agree on it.
5. Account context. Brand rulebook 3.5 varies the RocketRide-mention rule by account. Launch Kit drafts in the builder's voice for the builder's app, so rule 15 takes the profile as the source of truth. A launch posted from the RocketRide brand account would need a TONE override, not a rule change.
