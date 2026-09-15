# Newsletter pitch rulebook

Channel id: `newsletter_pitch`. Label: Newsletter. Written 2026-09-11 from the social launch skills review (`docs/social-launch-skills-review.md`) and the brand rulebook (`.claude/rules/skills/brand-check/references/rulebook.md`, sections 1 to 3). Reconciled against the code for rulebook version 4 on 2026-09-12.

What Launch Kit drafts for this channel: one email from the builder to one newsletter author or editor. The pipe output shape (`pipelines/lk_assets.pipe`, line 37) is `{"subject": string, "pitch": string, "warnings": [string]}`. The pitch is 100 to 150 words. Both fields go through the sanitizers (`src/domain/sanitize.ts`) and the draft gate; the rules below are fed to the model verbatim via `rulesBlock()` in `src/data/rules.ts`, which emits PLATFORM_RULES, then HOOK_PATTERNS, then the 12 GLOBAL_RULES from `src/lib/rulebooks.ts`.

This file is the reference. The live rules are the `rules` array in `src/lib/rulebooks.ts` (seeded into the `platform_rules` table and editable in Settings). This document is not edited by code and does not edit code.

Version 4 holds 17 rules, 11 hook patterns and 31 mechanical checks for this channel: 2 rules and 9 checks are new, 7 rules and 9 checks changed, and no hook was removed. See "Storage and versioning" for how a stored row goes stale and what each draft records.

## Sources used

| Source | Path in the clone | Verdict in the review | License |
| --- | --- | --- | --- |
| yoanbernabeu/producthunt-skills, commit 5acfd60 (2026-01-30) | `skills/awards/ph-newsletter-pitch/SKILL.md` | USE ("Short factual pitch; verify the editorial address first") | MIT, Copyright (c) 2025 Yoan Bernabeu |
| same repo | `skills/marketing/ph-email-strategy/SKILL.md` | PARTIAL, schedule only ("Schedule is sound; copy is emoji-heavy and em-dashed") | MIT |
| same repo, cross-check only | `skills/compliance/ph-safe-messaging/SKILL.md` | USE in the review; used here for its forbidden phrase table and red-flag list when building the no-ask and vote-ask checks | MIT |
| Jakeschincariol/linkedin-agent-skill, cloned 2026-09-07 | `skills/li-human/slop.json` | USE ("Directly enforces our em-dash and AI-tell bans") | MIT |
| RocketRide brand rulebook | `.claude/rules/skills/brand-check/references/rulebook.md`, sections 1.1, 1.2, 1.3, 2.7, 3.1, 3.4, 4.1, 5.3 | internal, final authority Joe | internal |
| RocketRide, this task: the ten-app eval | `docs/EVAL-10-APPS.md` (clusters 3, 9, 10, 16, 20) and `docs/eval-10/judged.json` (the ten stored newsletter drafts and the judge's issues) | internal | internal |
| RocketRide, this task: Launch Kit's own code defaults | `src/lib/rulebooks.ts` (GLOBAL_RULES, the platform default), `src/domain/questions.ts` (the THIN_PROFILE override) | internal | internal |

What each source gives this channel:

- **ph-newsletter-pitch**: the Product Hunt newsletter editions (daily Leaderboard, Sunday Roundup, Tuesday Frontier, a Developer Tools edition), the editorial criteria (does something different, clear value, a real story, good visuals), a red-flag list (generic, unclear, clones, cash grabs), a pitch email template with ALL CAPS labelled sections, a do and do-not list (brief, lead with what is different, direct link, do not beg, do not exaggerate, do not send multiple follow-ups), and PH-specific deadlines. The pitch template is the part we rewrote; the do and do-not list is the part we kept almost whole.
- **ph-email-strategy**: a subject-line avoid list (all caps, multiple emoji, "URGENT" or "IMPORTANT", "Please upvote", lines 243 to 247), the rule that no email ever asks for votes (Golden Rule 1, lines 20 to 26), one subject formula we reject outright ("Quick favor? (launching today)", line 240, now caught by `pitch_no_asks`), and a supporter-list timeline (T-14, T-7, T-1, six timezone waves). Only the avoid list and the vote rule apply to an email to an editor; the timeline is for mailing your own list and is noted under timing, not adopted as a drafting rule.
- **ph-safe-messaging**: the forbidden-to-allowed phrase table (lines 26 to 46) and the red-flag phrase list (lines 299 to 314). Both columns matter here: the forbidden column seeds `pitch_no_vote_ask`, and the allowed column ("We'd love your support", "Excited to share this with you", "PH community gets 20% off") is banned rather than adopted, because a softened ask is still an ask.
- **li-human's slop.json**: 67 of its terms have a plain drop-in replacement and live in `src/lib/slop-lexicon.ts` as `SLOP_SWAPS`. `cleanSlop` applies them to every field of this channel's draft except `warnings`, before the gate runs, and the count lands on the draft card as `slop_fixed`. This is why the rules below do not repeat the whole lexicon: the swap has already happened by the time a check looks.
- **The brand rulebook**: 1.1 the banned launch verb, 1.2 the deprecated one-key-for-every-model framing, 1.3 the AI writing tells, 2.7 and 5.3 no unverified claims, 3.1 and 3.4 the tone and the off-brand examples, 4.1 never "better than X".
- **The ten-app eval**: every rule change and every added check in version 4 traces to a stored draft. The per-app evidence is in "What version 4 changed and why" under the rules, and in the check notes.

Clone location at the 2026-09-11 re-audit: `/private/tmp/claude-501/-Users-shashidharbabu-rocketride-apps-gtm/9a390f8a-984c-43f2-8d72-25a367af0263/scratchpad/social-skills-v4/producthunt-skills`, commit 5acfd604b66c9491365e24ccbf31f24e3b2ddfa3 (2026-01-30), unchanged from the adoption commit; all three source files re-read in full. Re-clone with `git clone --depth 1 https://github.com/yoanbernabeu/producthunt-skills`. The LinkedIn pack: `git clone --depth 1 https://github.com/Jakeschincariol/linkedin-agent-skill`.

Mechanical sweep of the two Product Hunt source files at adoption time (the review's greps): ph-newsletter-pitch has 0 banned-verb hits, 2 em dashes (both inside the pitch template: the subject line and the "key differentiator" label), and 1 hype-word hit, in the editorial criteria's reassurance that a product need not be earth-shaking to qualify; benign in context, not adopted. ph-email-strategy has 0 banned-verb hits and 6 em dashes, all inside paste-ready templates that we do not adopt.

## Rules adopted

Each rule is one instruction the drafting model receives. Numbered 1 to 17 in the order they appear in the `newsletter_pitch` entry of `DEFAULT_RULEBOOKS` in `src/lib/rulebooks.ts`, which is the order the model reads them in. Under each: where it came from and what changed. Where a rule changed for version 4 the wording below is the new wording.

1. Write the pitch as 100 to 150 words and aim for 110 to 140 so a trim still lands inside the band. Shape: a greeting line, then four short paragraphs in this order: why this newsletter's readers care, the one-liner, one proof point, the link on its own line followed by the one-sentence close, then the sign-off line. Count the words before you return; under 100 or over 150 the draft check flags it.
   Source: Launch Kit's existing default (`rulebooks.ts`) and the pipe's 100 to 150 word bound (`lk_assets.pipe` line 37); ph-newsletter-pitch "keep it brief (skimmable)" (line 155) and "don't write a novel" (line 162). Changed in v4: the aim band 110 to 140 was added inside the hard bound, and the shape now names the greeting line and the sign-off line explicitly, with the link and the close in one paragraph. Four of the ten eval drafts landed at 89, 98, 99 and 99 words (hoppscotch, excalidraw, hack-judge, khoj), so the floor was being missed by one to eleven words; an aim band inside the bound is what a model can actually hit.

2. Subject line of 70 characters or fewer (aim for 45 to 60), sentence case: name the newsletter (TARGET.name) or its readers (APP_PROFILE.target_user) and the one thing the app does. Shape to adapt, not to fill: "For {newsletter} readers: {what it does}". Never the literal words "your readers" in place of a name, no pipe separators, no "live on Product Hunt today", no "Introducing", no exclamation marks, no emoji.
   Source: ph-newsletter-pitch template subject, line 121 ("[Product Name] [em dash] [Unique angle] | Live on PH today"); ph-email-strategy's avoid list, lines 243 to 247 (all caps, multiple emoji, "URGENT" or "IMPORTANT"). Changed in v4: "under 70" became "70 characters or fewer", because `subject_max_chars` allows exactly 70 and dub's 70-character subject passed the gate and failed the judge; an aim band of 45 to 60 was added; the pattern is now labelled as a shape to adapt after khoj filled it with the literal words "For your readers:"; "Introducing" was named. Earlier changes kept from v3: the subject names the recipient's readers rather than the product and the launch, the em dash and the pipe separator are gone, the launch-day bait is gone, a length cap was added.

3. Use exactly one proof point, copied from APP_PROFILE.proof_points or BRAND_DNA.messaging.proof_points_observed: one figure with its noun (stars, paying customers, monthly clicks), or one named-customer list, or one quote, never two joined with "and" (stars and forks are two). Name where it comes from in plain words ("on GitHub", "from the pricing page"), never as a parenthetical citation, a "(source: ...)" note or a repository path, and state the figure without a sentence saying what it proves. If neither list has an entry, state something verifiable instead (what it runs on, the public repo, how it works) and add the warning "no proof point in profile". Never invent numbers, users, quotes or benchmarks.
   Source: ph-newsletter-pitch "don't exaggerate claims" (line 164); brand rulebook 2.7 and 5.3 (no unverified claims); Launch Kit GLOBAL_RULES. Changed in v4: "exactly one" now says what one is, because the old wording was read as one sentence and five of ten drafts packed two figures or a figure plus a logo list into it (excalidraw, formbricks, dub, documenso, khoj); the plain-words sourcing rule and the ban on a gloss ("which reflects real adoption") answer continue's pasted citation and documenso's added claim. Kept from v3: a single verbatim item with a named fallback and a mandatory warning, because "don't exaggerate" is not an instruction a model can obey.

4. First paragraph, one or two sentences: why these readers specifically care. Tie it to APP_PROFILE.icp.who and icp.pain and to whatever TARGET says the newsletter covers. Do not open with the app name, the launch, or yourself.
   Source: ph-newsletter-pitch "WHO IT'S FOR" (line 134) and "lead with uniqueness" (line 156); editorial criterion "clear value proposition, specific use case, not vague". Changed: nothing in v4. Kept from v3: the reader comes first and the product second; "uniqueness" became "why these readers care", which is what an editor is actually deciding. Version 4 adds the machine check `pitch_no_self_or_question_opener` for the mechanical half of this rule.

5. Line one is a greeting on its own line: "Hi {author first name}," from TARGET, or "Hi {newsletter} team," when only the newsletter is known. If neither is known, write exactly "Hi [Editor first name]," and add the warning that the recipient name is missing. The first paragraph then starts with the readers' situation in your own words; never reuse the words of this rule or of a hook pattern as the opening, and never "Hi there", "Dear editor", "To whom it may concern".
   Source: the template's "Hi PH Editorial Team" opener (line 123), generalised. Changed in v4: the old fallback handed the model a sentence to fill ("For your readers who {icp.who}") and three of ten drafts opened with it verbatim (cal-com, excalidraw, documenso), so the fallback is now a bracketed greeting placeholder in the same convention GLOBAL_RULES uses for the builder's name, and the rule says in so many words not to reuse its own wording. Kept from v3: the warning path when the name is unknown.

6. Second paragraph: the one-liner, one sentence, taken from APP_PROFILE.one_liner. Trim it, do not embellish it. Name the app once here.
   Source: ph-newsletter-pitch "WHAT IT IS: one sentence description" (lines 128 to 129). Changed: nothing in v4. Kept from v3: bound to the profile field so the model cannot rewrite the product.

7. Put {APP_URL} exactly once, as a bare link on its own line in the last paragraph, and no other link, domain or repository path anywhere in the subject or the pitch (no "github.com/...", no "www.", nothing in parentheses). No attachments, no "see the deck", no gallery bullets. Offer instead, in one sentence, to send screenshots or answer questions.
   Source: ph-newsletter-pitch "include direct PH link" (lines 125, 126 and 157) and the "GALLERY HIGHLIGHTS" bullets (lines 140 to 142); general craft (editors do not open attachments from strangers). Changed in v4: the rule bound the placeholder but never said no other link, and two drafts pasted a repository path into the proof sentence (excalidraw's "(github.com/excalidraw/excalidraw)", continue's "(source: github.com/continuedev/continue repo metadata)"). Kept from v3: the gallery list became an offer on request; the link is the {APP_URL} placeholder the rest of Launch Kit uses.

8. The only ask is that they take a look. No vote asks in any form (upvote, vote, leaderboard, "support our launch", "we'd love your support"), no "feature us", no "share with your list", no "it would mean the world", no discount for coverage, no deadline or "only this week". Nothing that reads as pressure or a favour owed. The vote-ask check is hard: the draft cannot be approved over it.
   Source: ph-email-strategy Golden Rule 1, lines 20 to 26 (never ask for upvotes); ph-safe-messaging's forbidden phrase table (lines 26 to 46) and red-flag list (lines 299 to 314); ph-newsletter-pitch "don't beg for inclusion" (line 163), "don't be pushy" (line 166). Changed in v4: the safe-messaging rows "support our launch" and "love your support" were in neither the rule nor the check, so the rule now names the vote-ask forms and says the check is hard, which tells the model what the gate will do rather than leaving it to infer. Kept from v3: extended from votes to every kind of ask an editor pitch could carry, including the "means the world" line that the email-strategy templates themselves use and we reject; the offer-for-votes rows became a flat ban on discount-for-coverage.

9. Write it as one builder emailing one person: first person singular, plain words. Never press-release phrasing: "proud to announce", "thrilled", "today announced", "the leading", "industry-leading", "world-class".
   Source: general craft and brand rulebook 3.1 (punchy, direct, show do not tell) and 3.4 (off-brand examples). Changed: nothing in v4. Nothing was adopted from the source template here; its "[Your Title]" signature line (line 148) and "Happy to provide any additional info!" close (line 144) were the press-kit tells we are ruling out.

10. Do not name a competitor and do not compare: no "better than", "unlike X", "X alternative", "X killer". Describe what the app does on its own terms; if a differentiator in the profile is phrased against a rival, restate it as what the app does.
    Source: brand rulebook 4.1 (never "better than X"); GLOBAL_RULES (a competitor named only as a neutral fact); ph-newsletter-pitch's "not another [category] tool" criterion. Changed: nothing in v4, though its check lost two false positives. Kept from v3: the source asks you to show what is different, which is fine; we add that the difference is stated without naming the incumbent.

11. Plain prose only: no headers, no ALL CAPS labels like "WHAT IT IS:", no bullet lists, no bold, no PS. Each paragraph is one to three sentences.
    Source: the source template's labelled sections and bullet list (lines 128 to 142). Changed: nothing in v4, though both of its checks were dead after line one until the m flag was set. Kept from v3: rejected outright; labelled sections read as a press kit and the email-strategy templates' bullet and arrow lists read as a campaign.

12. Close in one sentence with a concrete offer ("Happy to send screenshots or answer anything your readers ask"), then sign off on its own line with the builder's first name from APP_PROFILE or BRAND_DNA. When neither names one, the sign-off line is exactly "[Builder first name]" and warnings say so; never an invented name and never another placeholder wording such as "[Your name]" or "[First name]". Never "I hope this finds you well", "thanks for your time", "I'm reaching out", "Happy to provide any additional info".
    Source: the template's close and signature (lines 144 to 149); GLOBAL_RULES never-invent-a-person rule, which names the placeholder [Builder first name]; general craft. Changed in v4: the old wording said "first name only" and the model obliged with an invented "Pete" on cal-com and four different placeholder spellings elsewhere, so the sign-off is now bound to the GLOBAL placeholder, which makes the drift checkable. Kept from v3: the title line and the URL under the signature are dropped (the link already sits in the body), the exclamation mark is gone, the standard filler openers and closers are banned by name.

13. Zero emoji, zero exclamation marks, zero hashtags in both subject and pitch. Sentence case throughout, no Title Case.
    Source: ph-email-strategy subject avoid list, line 244 (no all caps) and line 245 (no multiple emoji); Launch Kit GLOBAL_RULES allow one emoji where the platform expects it. Changed: nothing in v4; the sentence-case half now has a check for the subject (`subject_no_title_case`). Kept from v3: tightened to zero, because an email to an editor is the one channel where a single emoji still costs credibility.

14. Name a specific edition or section (for example a developer tools edition) only when TARGET names it. Never invent an edition, a deadline, a reader count or a past issue. If APP_PROFILE.icp.buying_trigger is real, use it in the first paragraph; do not add a separate "why now" section.
    Source: ph-newsletter-pitch's edition list and "WHY NOW" section (line 137). Changed: nothing in v4. Kept from v3: the PH edition names are not hard-coded (the Targets stage supplies the newsletter and whatever it scraped); "why now" is folded into the opener and only when the profile has a trigger, since a standalone section invites invented urgency.

15. Fill warnings with anything the builder must check before sending: recipient name unknown, no proof point in the profile, TARGET.rules_summary says the newsletter takes paid placements or uses a submission form (say so, and keep the pitch usable as form text), or TARGET rules not verified.
    Source: the source's checklist item "contact confirmed" and the review's note "verify the editorial address first"; Launch Kit's warnings convention in every asset type. Changed: nothing in v4; every stored eval draft carried the recipient, name and TARGET warnings, so the rule is working. Kept from v3: turned a human checklist into warnings the app can display next to the draft.

16. **New in v4.** If APP_PROFILE marks the product archived, acquired, sunset or read-only, say so in the one-liner paragraph in plain words (for example: the repo is archived and the code stays public under Apache 2.0). Never soften it to "now acquired by X" alone; an editor who finds out after running it will not run you again.
    Source: RocketRide, this task (the ten-app eval, continue issue 12: the pitch never says the repo is archived). Why it was added: continue's pitch presented an archived, read-only project as a live tool and said only "now acquired by Cursor"; nothing in the rulebook told the model to state the status. Not machine-checkable, and deliberately so: only the profile knows the status.

17. **New in v4.** Never the stock scene "often hit a wall", "hit the same wall", "kept running into the same wall", or any opening sentence that would fit a different app unchanged. Name the concrete step that fails for these readers: the report they rebuild, the consent banner they add, the spreadsheet five judges share.
    Source: RocketRide, this task (the ten-app eval; the phrase appears in five of ten stored pitches, and dub issue 9 names it recurring across platforms). Why it was added: hack-judge, plausible, formbricks, dub and hoppscotch all open on the same wall, and dub used it verbatim in its Product Hunt first comment and its Show HN body too; a phrase that survives across five apps is a template tell an editor recognises. Its check is `newsletter_no_template_phrases`.

### The thin-profile override

Not a rule in the array, but it outranks every rule above and every hook pattern. `buildAssetQuestion` in `src/domain/questions.ts` appends a THIN_PROFILE section after PLATFORM_RULES when the profile's confidence is under 0.5 or `analysis_degraded` is true: describe the app only in the words of its one-liner and category, name no feature, workflow, export, integration or step the profile does not state, write "[Builder: two sentences on why you built it]" where a platform wants the builder's story, keep the draft short, and say in warnings that the profile was thin. Source: RocketRide, this task (eval cluster 16, hack-judge, whose pitch correctly stayed general). It is the reason a hook pattern with a story slot is never a licence to invent one.

## Mechanical checks

These are the limits a program enforces on the draft, from the `newsletter_pitch` entry of `RULEBOOK_CHECKS` in `src/lib/rulebook-checks.ts`, run by `runRulebookCheckHits` in `src/domain/gates.ts`. Version 4 holds 31 checks: 8 hard and 23 soft.

**Hard and soft.** A hard failure becomes a blocker: `gateAsset` puts it in the draft's `blockers` array as well as its `warnings`, the UI shows blockers apart, approval is refused over one, and `runAsset` in `src/data/api.ts` fires one repair pass that names exactly those failures back to the model (the draft with the smaller overage wins; on a tie the first draft stands). A check is hard when it sets `hard: true`, or, with no `hard` flag, when its kind is one of max_chars, max_words, max_count, required_prefix or required_regex, or when its id matches the gate's HARD_IDS pattern (`banned_verb`, `raw_links`, `link_present`, `link_once`, `vote_ask`, `no_dash` and the rest). `pitch_no_asks` sets `hard: false` so it stays a warning; `pitch_min_words` is soft on purpose, because a repair that adds words invites invention, and rule 1's aim band is the real fix.

**Flags, corrected.** The gate compiles every `forbidden_regex` with flag `i` only, unless the check sets `flags` itself (and with `iu` when the value carries a `\u{...}` escape, which is the two emoji checks). So `pitch_no_filler` and `pitch_no_bullets_or_headers` carry `im`, `pitch_no_caps_labels` carries `m` alone (never `i`: under `i` it would match "Note:" or "For your readers:"), and `subject_no_title_case` carries the empty string so it stays case-sensitive. Everything else runs with the default. The earlier sentence in this file claiming `i` and `m` on every pattern described the intent, not the code; three checks were dead after line one for want of the m flag and version 4 sets it on them.

**Fields.** `subject` and `pitch` name one draft field. `all` means every string field of the draft except the stamped metadata: `runRulebookCheckHits` reads through `fieldsOf`, which skips META_FIELDS (`warnings`, `blockers`, `repaired`, `venue`, `app_name`, `rulebook_version`, `rulebook_source`, `punctuation_fixed`, `wording_fixed`, `slop_fixed`), so an `all` check never reads a value the runner or the gate stamped as if the model had written it. Four checks moved from `pitch` to `all` in version 4 so the subject is swept too.

**Verified.** All 31 values compile in Node under the flags above. A rule-1-shaped sample of 115 words with a 60-character subject passes every one of the 31; the same sample with the link, the close and the sign-off split into three blocks trips `pitch_max_paragraphs`, which is the ceiling the audit predicted once the greeting line became mandatory. Each of the nine added checks was fired against the exact stored draft text it was written for. A few patterns put one letter in brackets (for example `vir[a]l`) so that the brand sweep of this file itself stays clean; the bracket changes nothing about what the pattern matches.

| id | field | kind | hard or soft | v4 | what it catches |
| --- | --- | --- | --- | --- | --- |
| pitch_min_words | pitch | min_words | soft | | Rule 1 lower bound; the hit line carries the count. |
| pitch_max_words | pitch | max_words | hard | | Rule 1 upper bound; hard by kind, so the repair pass cuts whole sentences. |
| subject_max_chars | subject | max_chars | hard | | Rule 2; a longer subject truncates in most inbox lists. Allows exactly 70, which is why rule 2 now says "70 or fewer". |
| subject_no_exclamation | subject | forbidden_regex | soft | | Rule 13. |
| pitch_no_exclamation | pitch | forbidden_regex | soft | | Rule 13. |
| subject_no_emoji | subject | forbidden_regex | soft | | Rule 13; flags iu. |
| pitch_no_emoji | pitch | forbidden_regex | soft | | Rule 13; flags iu. |
| subject_no_launch_bait | subject | forbidden_regex | soft | | Rules 2 and 8: launch-day bait, a pipe separator, urgency words. |
| pitch_link_present | pitch | forbidden_regex | hard | | Rule 7: fails when the placeholder is absent. The lookbehind pins the test to the start of the string, so it stays correct whatever the flags. |
| pitch_link_once | pitch | forbidden_regex | hard | | Rule 7: fails when the placeholder appears twice. |
| pitch_no_attachments | pitch | forbidden_regex | soft | | Rule 7: an attachment, a deck, a press kit, gallery bullets. |
| pitch_no_filler | pitch | forbidden_regex | soft | changed | Rules 5 and 12: stock openers and closers, and a PS on any line. Narrow on purpose: "I hope this fits an upcoming issue" passes. Flags now im, so the PS branch sees a PS after line one. |
| pitch_no_press_release | all | forbidden_regex | soft | changed | Rule 9, and now rule 2: "Introducing" and "Announcing" were added and the field widened to all, so a press-release subject is swept. |
| pitch_no_asks | pitch | forbidden_regex | soft | changed | Rule 8, favour asks only: feature us, mean the world, share with your list, spread the word, a plug, in exchange for, "quick favour". The vote terms moved to the hard check below; `hard: false` is now explicit. |
| pitch_no_fomo | pitch | forbidden_regex | soft | | Rule 8: urgency and scarcity. |
| pitch_no_competitor_framing | pitch | forbidden_regex | soft | changed | Rule 10. Two verified false positives removed: "vs" no longer fires on "VS Code" (continue) and "alternative to" and "replacement for" no longer fire before an article or determiner (formbricks' "alternative to the survey tools"); the killer branch now needs a space or hyphen, so "painkiller" passes. Still catches "alternative to Typeform", "Cal.com vs Calendly", "Unlike Postman", "Slack killer", "better than". |
| pitch_no_bullets_or_headers | pitch | forbidden_regex | soft | changed | Rule 11: a markdown header, a bullet or a numbered list. Flags now im, so a bullet after line one fires. |
| pitch_no_caps_labels | pitch | forbidden_regex | soft | changed | Rule 11: an ALL CAPS section label at a line start. Flags now m, so "Hi Sam," followed by "WHAT IT IS:" fires; it was passing before. |
| pitch_no_hashtags | pitch | forbidden_regex | soft | changed | Rule 13. The class now requires a letter after the hash, so a rank or an issue number such as "#1" no longer reads as a hashtag. |
| pitch_max_paragraphs | pitch | forbidden_regex | soft | | Rules 1 and 11: fails at six or more blank-line breaks. With the greeting line mandatory, greeting, four paragraphs and sign-off is the ceiling. Note that the `countIn` exemption for a line holding only the link applies to max_count checks, not to this pattern. |
| pitch_no_hype_or_nx | all | forbidden_regex | soft | changed | Governing rules: hype words and Nx claims not already in GLOBAL_RULES. Field widened to all, so a hype word in the subject is caught. |
| pitch_no_banned_verb | all | forbidden_regex | hard | changed | Brand rulebook 1.1 and 1.2: the banned launch verb, plus the deprecated one-key-for-every-model framing. Field widened to all. `sanitizeVerbs` swaps the verb before the gate, so this is the belt on the braces. A tenant whose product is in logistics would need it relaxed; there is no exception in the brand rule. |
| pitch_no_vote_ask | all | forbidden_regex | hard | **new** | Rule 8, the hard half: a vote, follow, repost, like, share or reciprocity ask in any form, including the softened ones the sources list as allowed ("support us", "show some love", "we'd love your support", "reach #1"). The same pattern as the Product Hunt and X checks, so the three channels cannot disagree. |
| pitch_one_proof_point | pitch | forbidden_regex | hard | **new** | Rule 3: a second traction figure, or a figure plus a named-customer list, where the rule allows exactly one. Fired against excalidraw's stars plus customer list, formbricks' and khoj's stars-and-forks pair, dub's clicks plus links, documenso's stars plus forks. |
| pitch_no_raw_links | all | forbidden_regex | hard | **new** | Rule 7: any link, domain or repository path; the only link is the {APP_URL} placeholder. Mirrors the X and Reddit link checks. |
| pitch_no_citation | pitch | forbidden_regex | soft | **new** | Rule 3: a citation pasted into the prose ("(source: ...)", "repo metadata", "per the repo", "citing"). |
| pitch_placeholder_form | pitch | forbidden_regex | soft | **new** | Rule 12 and the GLOBAL never-invent-a-person rule: a name placeholder in any wording other than [Builder first name] or [Editor first name]. Eight of ten drafts drifted to "[Your name]", "[First name]" or "[Your first name]". |
| newsletter_no_template_phrases | all | forbidden_regex | soft | **new** | Rules 5 and 17: the template opener "For your readers" at a line start, and the stock wall scene in any tense. |
| pitch_no_ai_tells | all | forbidden_regex | soft | **new** | Brand rulebook 1.3 and the GLOBAL filler rule: leverage, utilize, delve, elevate, se[a]mless, cutting-edge, "in today's", the "what I keep thinking about" family, "here's the thing", "let that sink in". Mirrors the Reddit and X lexicon checks; this channel had none. |
| pitch_no_self_or_question_opener | pitch | forbidden_regex | soft | **new** | Rule 4 and the GLOBAL no-rhetorical-question rule: a first paragraph that opens on the builder (I, we, our) or on a question, greeting line skipped. |
| subject_no_title_case | subject | forbidden_regex | soft | **new** | Rules 2 and 13: five capitalised words in a row in the subject. Case-sensitive by design, and five in a row rather than three, so a newsletter's own Title Case name ("For The Pragmatic Engineer readers") passes. |

Pattern values, exactly as the gate compiles them (single backslashes, the way a JavaScript engine reads the TypeScript string literal). A literal pipe inside a pattern is an alternation, not a table separator, which is why these sit outside the table:

```
pitch_min_words                   100
pitch_max_words                   150
subject_max_chars                 70
subject_no_exclamation            !
pitch_no_exclamation              !
subject_no_emoji                  [\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]
pitch_no_emoji                    [\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]
subject_no_launch_bait            live on (product hunt|ph)\b|launching today|today only|\burgent\b|\bimportant\b|\||only (24|48) hours|limited time|last chance|don.?t miss
pitch_link_present                (?<![\s\S])(?![\s\S]*\{APP_URL\})
pitch_link_once                   \{APP_URL\}[\s\S]*\{APP_URL\}
pitch_no_attachments              \battach(ed|ment|ments)?\b|see (the )?(deck|pdf|attached)|\benclosed\b|press kit|gallery highlights
pitch_no_filler                   hope this (email |message |note )?finds you|finds you well|hope you.?re (well|doing well)|hope all is well|to whom it may concern|dear (sir|madam|editor|editorial|team)|thanks for your time|thank you for your time|reaching out|touch base|additional info|^\s*p\.?s\.?[:\s]
pitch_no_press_release            proud to announce|thrilled|excited to (announce|share|introduce)|today announced|pleased to (announce|share)|the leading|industry.leading|world.class|best.in.class|for immediate release|press release|\bdisrupt|\bintroducing\b|\bannouncing\b
pitch_no_asks                     feature us|featuring us|would mean (the world|a lot|so much)|means the world|share (this|it) with your|spread the word|shout.?out|give us a (mention|plug)|in exchange for|quick favou?r
pitch_no_fomo                     only (24|48) hours|limited time|last chance|don.?t miss|before it.?s gone|act now|\bhurry\b|ends (today|tonight|soon)|\bdeadline\b
pitch_no_competitor_framing       better than|\bunlike\b|\bvs\b(?!\.? ?code\b)|\bversus\b|alternative to (?!(?:the|a|an|your|their|most|every|what|any)\b)|replacement for (?!(?:the|a|an|your|their|most|every|what|any)\b)|\b[a-z]+[- ]killer\b
pitch_no_bullets_or_headers       ^(#{1,6} |[-*•] |\d+[.)] )
pitch_no_caps_labels              ^[A-Z][A-Z '&/]{2,}:
pitch_no_hashtags                 (^|\s)#[A-Za-z]\w*
pitch_max_paragraphs              (\n\s*\n[\s\S]*){6}
pitch_no_hype_or_nx               \b\d+x (faster|better|more|cheaper|quicker)\b|\b1[0]x\b|vir[a]l|unle[a]sh|superch[a]rge|ground[b]reaking|revolution[a]r|game.?ch[a]ng
pitch_no_banned_verb              \bsh[i]p(s|ped|ping)?\b|universal\s+api\s+ke[y]
pitch_no_vote_ask                 \bup-?vot\w*|\bvote (?:for|us|me|it|this|now|today|here|if)\b|\b(?:cast|drop|give) (?:a|your|us a) vote\b|\bevery vote\b|\bvotes? (?:count|matter)\b|\bvoters? (?:get|win|receive)\b|\b(?:top of|climb|hit|reach|win|on) the leaderboard\b|\bleaderboard (?:spot|position|rank)\b|\bhelp us (win|reach|climb|trend|get to|hit|stay)\b|\breach (#|number |no\.? ?)?1\b|(#|\bnumber |\bno\.? ?)1 (on|of the day|today|spot)\b|\bproduct of the (day|week|month)\b|\btop (post|product) (of the day|badge)\b|\bsupport (our|the|this|my) launch\b|\b(love|appreciate|need|value) your support\b|\byour support (means|would|helps|matters|counts)\b|\b(thanks?|thank you|grateful) for (your|the|all the) ((\w+ )?support|love)\b|\bshow (some|your|us some) (love|support)\b|\bsupport us\b|\bin exchange for\b|\breturn the favou?r\b|\b(i'?ll|we'?ll) (support|back|boost) yours\b|\bfollow (?:me|us|for more)\b|\brepost (?:this|if)\b|\bretweet\b|\blike (?:this (?:post|tweet|thread)|if you)\b|\bplease (?:like|share|repost|retweet)\b|\bshare (?:this|it) with\b|\btag (?:a friend|someone)\b|\bsmash (?:that|the)\b|\blink in bio\b
pitch_one_proof_point             (?:\d[\d,.]*\s?(?:[kmb]\+?|\+)?\s*(?:github |paying |monthly |active |weekly |daily |registered )?(?:stars?|forks?|users?|customers?|subscribers?|downloads?|installs?|clicks?|links?|teams?|companies|developers?|sign-?ups?|contributors?|deployments?|workspaces?|sites?|orgs?|organi[sz]ations?)\b|\b(?:teams|companies|engineers|developers|people) (?:at|from|like|including) \w+(?:, \w+)+)[\s\S]*?(?:\d[\d,.]*\s?(?:[kmb]\+?|\+)?\s*(?:github |paying |monthly |active |weekly |daily |registered )?(?:stars?|forks?|users?|customers?|subscribers?|downloads?|installs?|clicks?|links?|teams?|companies|developers?|sign-?ups?|contributors?|deployments?|workspaces?|sites?|orgs?|organi[sz]ations?)\b|\b(?:teams|companies|engineers|developers|people) (?:at|from|like|including) \w+(?:, \w+)+)
pitch_no_raw_links                https?://|\bwww\.|\bgithub\.com/|\bgitlab\.com/
pitch_no_citation                 \(source:|(?<![-\w])source:\s|\brepo metadata\b|\bper (?:the )?(?:repo|readme|github)\b|\bciting\b
pitch_placeholder_form            \[(?!(?:Builder|Editor) first name\])[^\]\n]*\bname\b[^\]\n]*\]
newsletter_no_template_phrases    (^|\n)\s*for your readers\b|\b(hit|hits|hitting|ran|run|running) (into )?(the same |a )?wall\b
pitch_no_ai_tells                 \b(leverag\w*|utili[sz]\w*|delve|elevate|seamless\w*|cutting[- ]edge|in today'?s|keep (thinking about|coming back to)|pattern i keep seeing|here'?s the thing|let that sink in|game on)\b
pitch_no_self_or_question_opener  ^\s*(?:(?:hi|hello|hey)[^\n]*\n\s*)?(?:(?:i|i'm|i am|my name|we|we're|we are|our)\b|[^.!?\n]{0,120}\?)
subject_no_title_case             \b(?:[A-Z][a-z]+ ){4}[A-Z][a-z]+\b
```

### Where each check came from

- `pitch_no_asks` and `pitch_no_vote_ask`: ph-email-strategy/SKILL.md lines 20 to 26 (Rule 1: Never Ask for Upvotes) and ph-safe-messaging/SKILL.md lines 26 to 46 (the forbidden-to-allowed table) and 299 to 314 (Red Flag Phrases). Changed: the allowed-column replacements ("We'd love your support", "Support our launch") are banned here, not adopted. "Quick favour" comes from ph-email-strategy line 240, a subject formula we reject.
- `subject_no_launch_bait`: ph-email-strategy/SKILL.md lines 243 to 247 (Subject Line Formulas, Avoid) and ph-newsletter-pitch/SKILL.md line 121 (the template subject with the pipe and "Live on PH today").
- `pitch_no_filler`: ph-newsletter-pitch/SKILL.md line 123 ("Hi PH Editorial Team") and line 144 ("Happy to provide any additional info!"); the rest is general craft, RocketRide.
- `pitch_no_attachments`: ph-newsletter-pitch/SKILL.md lines 140 to 142 (GALLERY HIGHLIGHTS bullets) and line 158 (Highlight visual assets), rejected.
- `pitch_no_caps_labels` and `pitch_no_bullets_or_headers`: ph-newsletter-pitch/SKILL.md lines 128 to 142 (the ALL CAPS labelled sections and bullet list of the template), rejected outright.
- `pitch_no_banned_verb` and `pitch_no_hype_or_nx`: brand rulebook 1.1, 1.2 and 1.3, and GLOBAL_RULES.
- `pitch_no_ai_tells`: brand rulebook 1.3 (AI writing tells) and the GLOBAL_RULES filler rule; the pattern mirrors the Reddit and X lexicon checks.
- `subject_no_title_case`: GLOBAL_RULES sentence case, rule 13, and ph-email-strategy/SKILL.md line 244 (no all caps).
- `pitch_one_proof_point`, `pitch_no_raw_links`, `pitch_no_citation`, `pitch_placeholder_form`, `newsletter_no_template_phrases`, `pitch_no_self_or_question_opener`: added 2026-09-11 from the ten-app eval (`docs/EVAL-10-APPS.md` clusters 3 and 20; the newsletter issues in `docs/eval-10/judged.json`): RocketRide, this task. Hard: `pitch_one_proof_point` (rule 3's shape), `pitch_no_raw_links` (a link where none is allowed), and `pitch_no_vote_ask` (a vote ask). The rest are soft.
- `pitch_no_hashtags`: the letter-after-the-hash narrowing has no entry in the version 4 audit; the code is its only record, and the intent is plain from the behaviour (a rank such as "#1" is not a hashtag). Listed here so the next reconciliation does not read it as drift.

Not machine-checkable and therefore left to the rules and the warnings: that the subject actually names the newsletter (needs TARGET), that the proof point is verbatim from the profile (needs a profile diff), sentence case inside the subject beyond the five-word run (a case heuristic would misfire on product names), an invented bare sign-off name such as cal-com's "Pete" (only a variant placeholder is detectable, not a plausible human name), rule 16's archived or acquired status (only the profile knows it), and rule 17's wider claim that an opening sentence would fit a different app unchanged (the check catches the one phrase, not the category).

## Hook patterns

The hook for this channel is the first sentence of the pitch; the subject line is built from the same material. Every brace is a profile or target field and the model fills it only from the profile, never from general knowledge. None of these come from the source packs: all eleven are RocketRide, this task. They are the `hooks` array of the `newsletter_pitch` entry in `rulebooks.ts`, and `rulesBlock()` sends them to the model as HOOK_PATTERNS, to adapt and never to copy. No hook was dropped in version 4; hooks 9 to 11 are new.

1. "Your readers who still {icp.pain} by hand: {App} {one thing it does}. {One verifiable fact from the profile.}"
2. "{App} does one job for {icp.who}: {one_liner}. {How to try it, in one sentence from the profile.}"
3. "I built {App} because {icp.pain} kept breaking my own workflow. It {one thing it does}; on a real project that means {proof_point}."
4. "If your readers run {tech_stack item}, {App} is a {category} built for that setup: {one_liner}."
5. "Small tool, one purpose: {one_liner}. Built for {icp.who}. {proof_point}."
6. "The part of a {icp.who}'s day that is still manual is {icp.pain}. {App} takes that piece: {differentiator}."
7. "{App} is {license or maturity fact from the profile} and {one_liner}. I am the builder and will answer anything your readers send back."
8. "Three sentences on {App}: it {does X}. It is for {icp.who}. {proof_point}."
9. **New in v4.** "Hi {author first name}, one tool for the {icp.who} in your audience: {App}, {one_liner}. It is {license or where it runs, from the profile}, and the one number I will put my name to is {proof_point}."
10. **New in v4.** "Hi {author first name}, {App} has been {maturity fact from the profile: in production since, on version N, licensed under X} and does one job for {icp.who}: {one_liner}. Use only when the profile shows an established product; never write an origin story for it."
11. **New in v4.** "Hi {author first name}, {App} is {status fact from the profile: archived, acquired by, no longer maintained} and its code stays public under {license}. For readers who {icp.who} it still does {one thing}: {one_liner}. Use only when the profile marks the product archived or acquired."

Source for hooks 9 to 11: RocketRide, this task (2026-09-11). The established-product and archived-product shapes answer eval cluster 10 (nine of the ten apps were established products drafted as first launches) and continue issue 12. All three open on the greeting line rule 5 now mandates, which is why they read as whole first lines rather than as sentences.

Hook 3 carries an unresolved tension with the GLOBAL never-invent-an-origin rule: see the open questions below. Under the thin-profile override, hooks 3, 5, 7, 8, 9, 10 and 11 lose their story, number or maturity slot and the draft falls back to hook 1, 2, 4 or 6.

## Timing notes (for the builder, not the model)

Taken from the two sources; these are operator guidance and do not enter the rules array.

- Product Hunt editions, from ph-newsletter-pitch: the daily Leaderboard is automatic (top 10 at end of day, no pitch); the Sunday Roundup compiles Saturday, so pitch Thursday to Saturday; the Tuesday Frontier compiles Monday; a proactive same-day pitch goes out before roughly 7 AM PT. Treat these as the source's claims: the Targets stage should re-verify the edition and its route before the builder sends anything.
- Independent newsletters, general craft: send the pitch a week or more ahead of the issue you want, and send one follow-up at most, only after an issue has gone out without you. The source's "don't send multiple follow-ups" is the rule; the single-follow-up bound is ours.
- From ph-email-strategy, the only piece that transfers: an editor pitch is one email to one person, so nothing about waves, tiers or staggered sends applies.

## Storage and versioning

This document matches rulebook version 4: `RULEBOOK_VERSION = 4` in `src/lib/rulebooks.ts`. The 17 rules, 11 hooks and 12 GLOBAL_RULES described here are the exact strings the model receives at version 4, and the 31 checks are the exact checks the gate runs.

**How a stored row goes stale.** `rulesFor` in `src/data/rules.ts` takes the newest `platform_rules` row for the platform by `updated_at`. `isStale` calls a row stale when its `source` is anything other than `owner` and its `version` is below `RULEBOOK_VERSION`; a stale row is ignored and the code default is used instead. `seedRulebooksIfEmpty` in `src/data/seed.ts` then inserts the version 4 default as a new row above the stale one rather than editing the old row in place, so the store keeps the history of which version was live when each draft was written. This is why a rule change is worth nothing without the version bump: without it, a row seeded at version 3 would still be served and the model would still read the old text.

**How an owner edit survives.** A row whose `source` is `owner` is never stale, whatever its version, so an edit made in Settings outlives every later default. `rulesFor` returns the owner's `rules` array verbatim, and falls back to the default `name`, `summary` and `hooks` for whatever the row does not carry: a row that predates hooks, or an owner edit that saved none, keeps the default hooks rather than sending the model none.

**What every draft records.** `rulebookMeta` returns the version and source actually served (the stored row's, or `RULEBOOK_VERSION` and `default` when the code default won), and `runAsset` in `src/data/api.ts` stamps `rulebook_version` and `rulebook_source` onto every draft it writes. Both keys are in the gate's META_FIELDS, so no check whose field is `all` or `*` ever sweeps them. A re-run can therefore prove which rules a given draft saw, which is the only way to read an old draft's warnings fairly.

**Which sanitizer passes run before the gate.** In order, for every draft of this channel:

1. `sanitizeDraft` (`src/domain/sanitize.ts`), inside the pipe runner on the raw model answer: every em dash and en dash in every string becomes a comma, except an unspaced en dash inside a range, which becomes a hyphen. The count reaches the draft card as `punctuation_fixed`. GLOBAL_RULES also asks the model not to write them, and `gateAsset` still warns on any that survive, per field.
2. `sanitizeVerbs`, which walks every field except `warnings` (warnings quote the draft's faults as written) and runs two passes on each string: `cleanVerbs` swaps the banned launch verb for the release verb with the first letter's case preserved, counted as `wording_fixed`; then `cleanSlop` swaps the 67 `SLOP_SWAPS` terms from `src/lib/slop-lexicon.ts` for their plain replacements, longest term first, counted as `slop_fixed`.
3. The runner stamps `venue` (from TARGET.name, which a venue-scoped `when` guard would read) and `app_name` (the product's display name, which a `max_count` product-name check would count). Neither is used by a `newsletter_pitch` check today: this channel has no `when` guard and no `max_count` check.
4. `gateAsset` runs the 31 checks and writes `warnings` and `blockers`. The counters and the rulebook stamps are written after it, and META_FIELDS keeps all of them out of every `all` check whenever they are present.

So by the time a check looks at the draft, a dash, the banned verb and a slop term have already been replaced. `pitch_no_banned_verb` and `pitch_no_ai_tells` are the belt on those braces, for the forms the swaps do not reach.

## Deliberately left out, and why

- The `editorial@producthunt.co` address in the template (line 120). Unverified in the source and flagged by the review ("verify the editorial address first"). The route comes from the Targets stage (`submission_url`, `rules_url`), never from a hard-coded address. Still unverified at the version 4 re-audit: no external URL was opened.
- The template's labelled sections (WHAT IT IS, WHAT MAKES IT UNIQUE, WHO IT'S FOR, WHY NOW, GALLERY HIGHLIGHTS). They read as a press kit, they push the word count past 150, and a bullet list of screenshots is an attachment by another name.
- "WHY NOW" as a standalone section. It invites invented timeliness. A real trigger lives in `icp.buying_trigger` and goes in the opener (rule 14).
- The reach claims ("sent to millions of subscribers", "high open rates", "drives significant traffic"). Unsourced; the brand rulebook bans unverified claims and there is no reason to hand the model numbers it might echo.
- The "Measuring newsletter impact" and UTM section. Analytics, not drafting; the review already routes analytics code to engineering. The tracked-link row per approved post is `plan.ts`'s job (eval cluster 12), not a rule here.
- The "Getting featured again" and "stay connected" advice. Building rapport over months, not a launch draft.
- The editorial criteria's reassurance line about not needing to be earth-shaking. Benign in context, but it uses a word on our hype list, and the criterion is better expressed as rule 4.
- From ph-email-strategy: the T-14, T-7 and T-1 sequence, the six timezone waves, the three supporter tiers, the launch-day and thank-you templates. All of it is for mailing your own list; none of it is an editor pitch. The templates also carry emoji in subjects, em dashes, "means the world", "part of this journey" and "Big news", every one of which is on a ban list here.
- ph-email-strategy's "allowed" replacements for vote asks ("We'd love your support", "Excited to share this with you") and its "Quick favor? (launching today)" subject formula (line 240). Still an ask, and "excited to share" is in GLOBAL_RULES as filler. Rule 8 keeps the pitch to "take a look", and version 4 makes the point mechanical: the softened forms sit inside `pitch_no_vote_ask`, which is hard, and "quick favour" inside `pitch_no_asks`.
- ph-safe-messaging's offer rows ("PH community gets 20% off", "Everyone from PH gets early access", "First 100 signups from PH win"). A discount or a perk tied to coverage is a favour owed; rule 8 bans it rather than rewording it.
- The "Output Format" block from the source (pitch plan with primary and secondary newsletters, gallery list, checklist). Launch Kit's output is subject plus pitch plus warnings; the plan lives in the Targets and Plan stages.
- The other four reviewed source packs (reddit-founder-skill, hoai-course, vm0-skills, and every li-* skill except li-human's lexicon). None of them addresses an editor pitch, and no sentence of theirs appears in any rule, hook or check here.
- No hook pattern was left out or removed in version 4. The eight from version 3 are unchanged and three were added. The audit raised dropping hook 3 rather than guarding it; that is recorded below as an open question rather than acted on, because dropping a hook is an owner's call about voice, not a reconciliation.

## Open questions for the owner

Unresolved. Each carries its evidence; none is decided here.

1. **Hook 3 and the invented origin story.** Hook 3 reads "I built {App} because {icp.pain} kept breaking my own workflow", and GLOBAL_RULES forbids inventing an origin story, a previous job or the moment that made you build it when APP_PROFILE holds none. The thin-profile override also strips the slot when confidence is low, but a mid-confidence profile with no `why_built` leaves the hook standing and the model filling it. Two options: carry the guard "only when APP_PROFILE records why it was built" in the hook text, as hooks 10 and 11 carry their own guards, or drop hook 3. Evidence: the version 4 reconciliation records the conflict against `hooks[2]`; hooks 10 and 11 were added with guards for exactly this reason. Not changed in the code, so this document describes hook 3 as it stands.
2. **`pitch_one_proof_point` is hard, and its usual trigger is the stars-and-forks pair.** A hard failure fires the repair pass, which will cut the draft to one figure. The judge did count stars plus forks as two proof points on formbricks, but a single legitimate proof phrased with two nouns would trip the same pattern. Evidence: it fires on all five stored drafts that carried two figures, and the audit lists it as a design call the owner may want to revisit. Leaving it soft would mean the drafts keep going out with two.
3. **`newsletter_no_template_phrases` will be noisy until the new rules bite.** It fires on nine of the ten stored drafts, almost all on the wall phrase, because it was written from those drafts. It is soft, and rule 17 is the real fix. Evidence: the phrase is in five of ten pitches and in dub's Product Hunt and Show HN drafts as well. Expect the warning count to fall as version 4 drafts replace version 3 ones; if it does not, the rule failed and the check is the wrong instrument.
4. **Whether Launch Kit should flag a foundation model provider or a named competitor inside a tenant app's own customer list.** Excalidraw's stored pitch names Meta and Microsoft in a customer list and continue's names Cursor as the acquirer. Brand rulebook 4.3 asks that OpenAI, Anthropic, Google and Meta be routed to Joe when named in a comparative or adversarial context, and 4.2 lists Cursor as a competitor; both were written for RocketRide's own content, not for a tenant's. The version 4 checks treat these as neutral facts and do not flag them. Flagged for Joe, per rulebook 4.3. Source URL: not captured; the policy is internal, at `.claude/rules/skills/brand-check/references/rulebook.md` sections 4.2 and 4.3.
5. **The banned launch verb has no logistics exception.** `pitch_no_banned_verb` is hard and brand rulebook 1.1 allows no exceptions in any context, so a tenant whose product is in logistics cannot describe its own domain. Evidence: rulebook 1.1, "No exceptions, no context." The owner would have to relax it per tenant; nothing in the code does that today.
6. **Rule 2's aim band versus `subject_max_chars`.** The rule now asks for 45 to 60 characters and the check still allows 70. That is deliberate, the same shape as rule 1's word band, but it means a 65-character subject is on-rule-breaking and gate-passing. Evidence: dub's subject was exactly 70 and passed the gate while failing the judge, which is what prompted the rule change rather than a check change.

Two brand-rulebook items do not arise on this channel and need no decision: the account-specific tone rules (3.5), because the pitch always goes from the tenant's builder to an editor, and the App Builder naming question (5.2), because no draft field names a RocketRide product.

## Brand sweep of this file

Run before merging, from the repo root:

```bash
f=apps/launchkit/rulebooks/newsletter_pitch.md
grep -inE 's[h]ip' "$f" | wc -l                 # banned verb, any form or position, expect 0
grep -n $'\xe2\x80\x94' "$f" | wc -l            # em dash (U+2014), expect 0
grep -n $'\xe2\x80\x93' "$f" | wc -l            # en dash (U+2013), expect 0
grep -inE 'game.?ch[a]ng|ground[b]reaking|revolution[a]r|vir[a]l|se[a]mless|unle[a]sh|superch[a]rge|\b1[0]x\b' "$f" | wc -l   # hype, expect 1 (see below)
```

The banned-verb grep is deliberately boundary-free and bracket-split, in the same form `sanitize.ts` writes it. A pattern that anchors on a word boundary cannot see the verb when a regex backslash sits in front of it, which is how one slipped into an earlier draft of this file and passed the sweep; the boundary-free form catches every position and every ending, and it does not match this file's own bracket-split pattern values. The hype grep is expected to hit exactly once, on the `pitch_no_ai_tells` pattern value, which is quoted verbatim from the code and must not be altered. Every other hype word in this file, including the prose ban list describing that same check, is bracket-split in the file's own convention, so a second hit means a real one crept in.
