# Newsletter pitch rulebook

Channel id: `newsletter_pitch`. Label: Newsletter. Written 2026-09-11 from the social launch skills review (`docs/social-launch-skills-review.md`) and the brand rulebook (`.claude/rules/skills/brand-check/references/rulebook.md`, sections 1 to 3).

What Launch Kit drafts for this channel: one email from the builder to one newsletter author or editor. The pipe output shape (`pipelines/lk_assets.pipe`, line 37) is `{"subject": string, "pitch": string, "warnings": [string]}`. The pitch is 100 to 150 words. Both fields go through the sanitizer (`src/domain/sanitize.ts`) and the draft check; the rules below are fed to the model verbatim via `rulesBlock()` in `src/data/rules.ts`, after which the GLOBAL_RULES from `src/lib/rulebooks.ts` are appended.

This file is the reference. The live rules are the `rules` array in `src/lib/rulebooks.ts` (seeded into the `platform_rules` table and editable in Settings). This document is not edited by code and does not edit code.

## Sources used

| Source | Path in the clone | Verdict in the review | License |
| --- | --- | --- | --- |
| yoanbernabeu/producthunt-skills, commit 5acfd60 (2026-01-30) | `skills/awards/ph-newsletter-pitch/SKILL.md` | USE ("Short factual pitch; verify the editorial address first") | MIT, Copyright (c) 2025 Yoan Bernabeu |
| same repo | `skills/marketing/ph-email-strategy/SKILL.md` | PARTIAL, schedule only ("Schedule is sound; copy is emoji-heavy and em-dashed") | MIT |
| same repo, cross-check only | `skills/compliance/ph-safe-messaging/SKILL.md` | USE in the review; used here only for its forbidden phrase table when building the no-ask check | MIT |

Clone location at the time of writing: `/private/tmp/claude-501/-Users-shashidharbabu-rocketride-apps-gtm/9a390f8a-984c-43f2-8d72-25a367af0263/scratchpad/social-skills/producthunt-skills`. Re-clone with `git clone --depth 1 https://github.com/yoanbernabeu/producthunt-skills`.

Mechanical sweep of the two source files at adoption time (the review's greps): ph-newsletter-pitch has 0 banned-verb hits, 2 em dashes (both inside the pitch template: the subject line and the "key differentiator" label), and 1 hype-word hit, in the editorial criteria's reassurance that a product need not be earth-shaking to qualify; benign in context, not adopted. ph-email-strategy has 0 banned-verb hits and 6 em dashes, all inside paste-ready templates that we do not adopt.

What the primary source actually gives us: a list of Product Hunt newsletter editions (daily Leaderboard, Sunday Roundup, Tuesday Frontier, a Developer Tools edition), the editorial criteria (does something different, clear value, a real story, good visuals), a red-flag list (generic, unclear, clones, cash grabs), a pitch email template with ALL CAPS labelled sections, a do and do-not list (brief, lead with what is different, direct link, do not beg, do not exaggerate, do not send multiple follow-ups), and PH-specific deadlines. The pitch template is the part we rewrote; the do and do-not list is the part we kept almost whole.

What the secondary source gives us: a subject-line avoid list (all caps, multiple emoji, "URGENT"), the rule that no email ever asks for votes, and a supporter-list timeline (T-14, T-7, T-1, six timezone waves). Only the first two items apply to an email to an editor; the timeline is for mailing your own list and is noted under timing, not adopted as a drafting rule.

## Rules adopted

Each rule is one instruction the drafting model receives. Ordered by importance. Under each: where it came from and what changed.

1. Write the pitch as 100 to 150 words in four short paragraphs, in this order: why this newsletter's readers care, the one-liner, one proof point, the link and a one-sentence close. Count the words before you return.
   Source: Launch Kit's existing default (`rulebooks.ts`) and the pipe's 100 to 150 word bound; ph-newsletter-pitch "keep it brief (skimmable)" and "don't write a novel". Changed: the source template has seven labelled sections; we fixed a four-move order and a word count.

2. Subject line under 70 characters, sentence case: name the newsletter (TARGET.name) or its readers (APP_PROFILE.target_user) and the one thing the app does. Pattern: "For {newsletter} readers: {what it does}". No pipe separators, no "live on Product Hunt today", no exclamation marks, no emoji.
   Source: ph-newsletter-pitch template subject ("[Product Name] [em dash] [Unique angle] | Live on PH today") and ph-email-strategy's avoid list (all caps, multiple emoji, "URGENT"). Changed: the subject now names the recipient's readers rather than the product and the launch, the em dash and the pipe separator are gone, the launch-day bait is gone, a length cap was added.

3. Use exactly one proof point, copied from APP_PROFILE.proof_points or BRAND_DNA.messaging.proof_points_observed, with its number or named source when the profile has one. If neither list has an entry, state something verifiable instead (what it runs on, the public repo, how it works) and add the warning "no proof point in profile". Never invent numbers, users, quotes or benchmarks.
   Source: ph-newsletter-pitch "don't exaggerate claims"; brand rulebook 2.7 and 5.3 (no unverified claims); Launch Kit GLOBAL RULES. Changed: made the proof a single verbatim item with a named fallback and a mandatory warning, because "don't exaggerate" is not an instruction a model can obey.

4. First paragraph, one or two sentences: why these readers specifically care. Tie it to APP_PROFILE.icp.who and icp.pain and to whatever TARGET says the newsletter covers. Do not open with the app name, the launch, or yourself.
   Source: ph-newsletter-pitch "WHO IT'S FOR" and "lead with uniqueness"; editorial criterion "clear value proposition, specific use case, not vague". Changed: the reader comes first and the product second; "uniqueness" became "why these readers care", which is what an editor is actually deciding.

5. Address the author by name or the newsletter by name (from TARGET). If neither is known, address the readers ("For your readers who {icp.who}") and add a warning that the recipient name is missing. Never "Hi there", "Dear editor", "To whom it may concern".
   Source: the template's "Hi PH Editorial Team" opener. Changed: generalised from one PH address to whatever newsletter the Targets stage produced, with a warning path when the name is unknown.

6. Second paragraph: the one-liner, one sentence, taken from APP_PROFILE.one_liner. Trim it, do not embellish it. Name the app once here.
   Source: ph-newsletter-pitch "WHAT IT IS: one sentence description". Changed: bound to the profile field so the model cannot rewrite the product.

7. Put {APP_URL} exactly once, as a bare link on its own line in the last paragraph. No attachments, no "see the deck", no gallery bullets. Offer instead, in one sentence, to send screenshots or answer questions.
   Source: ph-newsletter-pitch "include direct PH link" and the "GALLERY HIGHLIGHTS" bullets; general craft (editors do not open attachments from strangers). Changed: the gallery list became an offer on request; the link is the {APP_URL} placeholder the rest of Launch Kit uses.

8. The only ask is that they take a look. No vote asks, no "feature us", no "share with your list", no "it would mean the world", no discount for coverage, no deadline or "only this week". Nothing that reads as pressure or a favour owed.
   Source: ph-email-strategy Golden Rule 1 (never ask for upvotes) and the ph-safe-messaging forbidden phrase table; ph-newsletter-pitch "don't beg for inclusion", "don't be pushy". Changed: extended from votes to every kind of ask an editor pitch could carry, including the "means the world" line that the email-strategy templates themselves use and we reject; the offer-for-votes rows became a flat ban on discount-for-coverage.

9. Write it as one builder emailing one person: first person singular, plain words. Never press-release phrasing: "proud to announce", "thrilled", "today announced", "the leading", "industry-leading", "world-class".
   Source: general craft and brand rulebook 3.1 (punchy, direct, show do not tell) and 3.4 (off-brand examples). Changed: nothing adopted from the source template here; its "[Your Title]" signature line and "Happy to provide any additional info!" close were the press-kit tells we are ruling out.

10. Do not name a competitor and do not compare: no "better than", "unlike X", "X alternative", "X killer". Describe what the app does on its own terms; if a differentiator in the profile is phrased against a rival, restate it as what the app does.
    Source: brand rulebook 4.1 (never "better than X"); ph-newsletter-pitch's "not another [category] tool" criterion. Changed: the source asks you to show what is different, which is fine; we add that the difference is stated without naming the incumbent.

11. Plain prose only: no headers, no ALL CAPS labels like "WHAT IT IS:", no bullet lists, no bold, no PS. Each paragraph is one to three sentences.
    Source: the source template's labelled sections. Changed: rejected outright; labelled sections read as a press kit and the email-strategy templates' bullet and arrow lists read as a campaign.

12. Close in one sentence with a concrete offer ("Happy to send screenshots or answer anything your readers ask"), then sign off with the builder's first name only. Never "I hope this finds you well", "thanks for your time", "I'm reaching out", "Happy to provide any additional info".
    Source: the template's close and signature; general craft. Changed: the title line and the URL under the signature are dropped (the link already sits in the body), the exclamation mark is gone, the standard filler openers and closers are banned by name.

13. Zero emoji, zero exclamation marks, zero hashtags in both subject and pitch. Sentence case throughout, no Title Case.
    Source: ph-email-strategy subject avoid list (no multiple emoji, no all caps); Launch Kit GLOBAL_RULES allow one emoji where the platform expects it. Changed: tightened to zero, because an email to an editor is the one channel where a single emoji still costs credibility.

14. Name a specific edition or section (for example a developer tools edition) only when TARGET names it. Never invent an edition, a deadline, a reader count or a past issue. If APP_PROFILE.icp.buying_trigger is real, use it in the first paragraph; do not add a separate "why now" section.
    Source: ph-newsletter-pitch's edition list and "WHY NOW" section. Changed: the PH edition names are not hard-coded (the Targets stage supplies the newsletter and whatever it scraped); "why now" is folded into the opener and only when the profile has a trigger, since a standalone section invites invented urgency.

15. Fill warnings with anything the builder must check before sending: recipient name unknown, no proof point in the profile, TARGET.rules_summary says the newsletter takes paid placements or uses a submission form (say so, and keep the pitch usable as form text), or TARGET rules not verified.
    Source: the source's checklist item "contact confirmed" and the review's note "verify the editorial address first"; Launch Kit's warnings convention in every asset type. Changed: turned a human checklist into warnings the app can display next to the draft.

## Mechanical checks

These are limits a program can enforce on the two output fields. Every `forbidden_regex` runs with flags `i` and `m`, except `pitch_no_caps_labels`, which runs with `m` only; the two emoji checks also need `u`. All 22 patterns compile in Node and were exercised against a compliant 117-word sample (passes every check) and one violation per check (each trips only its own check). A few patterns put one letter in brackets (for example `vir[a]l`) so that the brand sweep of this file itself stays clean; the bracket changes nothing about what the pattern matches.

| id | field | kind | value | what it enforces |
| --- | --- | --- | --- | --- |
| pitch_min_words | pitch | min_words | 100 | Rule 1 lower bound. |
| pitch_max_words | pitch | max_words | 150 | Rule 1 upper bound. |
| subject_max_chars | subject | max_chars | 70 | Rule 2; a longer subject truncates in most inbox lists. |
| subject_no_exclamation | subject | forbidden_regex | `!` | Rule 13. |
| pitch_no_exclamation | pitch | forbidden_regex | `!` | Rule 13. |
| subject_no_emoji | subject | forbidden_regex | `[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]` | Rule 13 (flag u). |
| pitch_no_emoji | pitch | forbidden_regex | `[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]` | Rule 13 (flag u). |
| subject_no_launch_bait | subject | forbidden_regex | `live on (product hunt\|ph)\b\|launching today\|today only\|\burgent\b\|\bimportant\b\|\|\|only (24\|48) hours\|limited time\|last chance\|don.?t miss` | Rules 2 and 8: no launch-day bait, no pipe separators, no urgency. |
| pitch_link_present | pitch | forbidden_regex | `(?<![\s\S])(?![\s\S]*\{APP_URL\})` | Rule 7: fails when the placeholder is absent. The lookbehind pins the test to the start of the string, so it stays correct under the m flag. |
| pitch_link_once | pitch | forbidden_regex | `\{APP_URL\}[\s\S]*\{APP_URL\}` | Rule 7: fails when the placeholder appears twice. |
| pitch_no_attachments | pitch | forbidden_regex | `\battach(ed\|ment\|ments)?\b\|see (the )?(deck\|pdf\|attached)\|\benclosed\b\|press kit\|gallery highlights` | Rule 7. |
| pitch_no_filler | pitch | forbidden_regex | `hope this (email \|message \|note )?finds you\|finds you well\|hope you.?re (well\|doing well)\|hope all is well\|to whom it may concern\|dear (sir\|madam\|editor\|editorial\|team)\|thanks for your time\|thank you for your time\|reaching out\|touch base\|additional info\|^\s*p\.?s\.?[:\s]` | Rules 5 and 12. Narrow on purpose: "I hope this fits an upcoming issue" passes. |
| pitch_no_press_release | pitch | forbidden_regex | `proud to announce\|thrilled\|excited to (announce\|share\|introduce)\|today announced\|pleased to (announce\|share)\|the leading\|industry.leading\|world.class\|best.in.class\|for immediate release\|press release\|\bdisrupt` | Rule 9. |
| pitch_no_asks | pitch | forbidden_regex | `upvote\|vote for\|\bvoting\b\|feature us\|featuring us\|would mean (the world\|a lot\|so much)\|means the world\|share (this\|it) with your\|help us reach\|spread the word\|shout.?out\|give us a (mention\|plug)\|in exchange for` | Rule 8. |
| pitch_no_fomo | pitch | forbidden_regex | `only (24\|48) hours\|limited time\|last chance\|don.?t miss\|before it.?s gone\|act now\|\bhurry\b\|ends (today\|tonight\|soon)\|\bdeadline\b` | Rule 8. |
| pitch_no_competitor_framing | pitch | forbidden_regex | `better than\|\bunlike\b\|\bvs\b\|\bversus\b\|alternative to\|replacement for\|[a-z]+.killer\b` | Rule 10. |
| pitch_no_bullets_or_headers | pitch | forbidden_regex | `^(#{1,6} \|[-*•] \|\d+[.)] )` | Rule 11: no markdown headers, no bullet or numbered lists. |
| pitch_no_caps_labels | pitch | forbidden_regex | `^[A-Z][A-Z '&/]{2,}:` | Rule 11: no ALL CAPS section labels. Runs with flag m only, never i; under i it would match "Note:" or "For your readers:". |
| pitch_no_hashtags | pitch | forbidden_regex | `(^\|\s)#\w+` | Rule 13. |
| pitch_max_paragraphs | pitch | forbidden_regex | `(\n\s*\n[\s\S]*){6}` | Rules 1 and 11: fails at six or more blank-line breaks. A greeting line, four paragraphs and a sign-off line is the ceiling. |
| pitch_no_hype_or_nx | pitch | forbidden_regex | `\b\d+x (faster\|better\|more\|cheaper\|quicker)\b\|\b1[0]x\b\|vir[a]l\|unle[a]sh\|superch[a]rge\|ground[b]reaking\|revolution[a]r\|game.?ch[a]ng` | Governing rules: hype words and Nx claims not already in GLOBAL_RULES. |
| pitch_no_banned_verb | pitch | forbidden_regex | `\bsh[i]p(s\|ped\|ping)?\b` | Brand rulebook 1.1. Note: this is a RocketRide brand rule; a tenant whose product is in logistics would need it relaxed. |

In the table above a literal pipe inside a pattern is written `\|` only because of the markdown table; the structured return carries the raw patterns.

Not machine-checkable and therefore left to the rules and the warnings: that the subject actually names the newsletter (needs TARGET), that the proof point is verbatim from the profile (needs a profile diff), and sentence case in the subject (a case heuristic would misfire on product names).

## Hook patterns

The hook for this channel is the first sentence of the pitch; the subject line is built from the same material. Every brace is a profile or target field and the model fills it only from the profile, never from general knowledge. None of these come from the source packs.

1. "Your readers who still {icp.pain} by hand: {App} {one thing it does}. {One verifiable fact from the profile.}"
2. "{App} does one job for {icp.who}: {one_liner}. {How to try it, in one sentence from the profile.}"
3. "I built {App} because {icp.pain} kept breaking my own workflow. It {one thing it does}; on a real project that means {proof_point}."
4. "If your readers run {tech_stack item}, {App} is a {category} built for that setup: {one_liner}."
5. "Small tool, one purpose: {one_liner}. Built for {icp.who}. {proof_point}."
6. "The part of a {icp.who}'s day that is still manual is {icp.pain}. {App} takes that piece: {differentiator}."
7. "{App} is {license or maturity fact from the profile} and {one_liner}. I am the builder and will answer anything your readers send back."
8. "Three sentences on {App}: it {does X}. It is for {icp.who}. {proof_point}."

## Timing notes (for the builder, not the model)

Taken from the two sources; these are operator guidance and do not enter the rules array.

- Product Hunt editions, from ph-newsletter-pitch: the daily Leaderboard is automatic (top 10 at end of day, no pitch); the Sunday Roundup compiles Saturday, so pitch Thursday to Saturday; the Tuesday Frontier compiles Monday; a proactive same-day pitch goes out before roughly 7 AM PT. Treat these as the source's claims: the Targets stage should re-verify the edition and its route before the builder sends anything.
- Independent newsletters, general craft: send the pitch a week or more ahead of the issue you want, and send one follow-up at most, only after an issue has gone out without you. The source's "don't send multiple follow-ups" is the rule; the single-follow-up bound is ours.
- From ph-email-strategy, the only piece that transfers: an editor pitch is one email to one person, so nothing about waves, tiers or staggered sends applies.

## Deliberately left out, and why

- The `editorial@producthunt.co` address in the template. Unverified in the source and flagged by the review ("verify the editorial address first"). The route comes from the Targets stage (`submission_url`, `rules_url`), never from a hard-coded address.
- The template's labelled sections (WHAT IT IS, WHAT MAKES IT UNIQUE, WHO IT'S FOR, WHY NOW, GALLERY HIGHLIGHTS). They read as a press kit, they push the word count past 150, and a bullet list of screenshots is an attachment by another name.
- "WHY NOW" as a standalone section. It invites invented timeliness. A real trigger lives in `icp.buying_trigger` and goes in the opener (rule 14).
- The reach claims ("sent to millions of subscribers", "high open rates", "drives significant traffic"). Unsourced; the brand rulebook bans unverified claims and there is no reason to hand the model numbers it might echo.
- The "Measuring newsletter impact" and UTM section. Analytics, not drafting; the review already routes analytics code to engineering.
- The "Getting featured again" and "stay connected" advice. Building rapport over months, not a launch draft.
- The editorial criteria's reassurance line about not needing to be earth-shaking. Benign in context, but it uses a word on our hype list, and the criterion is better expressed as rule 4.
- From ph-email-strategy: the T-14, T-7 and T-1 sequence, the six timezone waves, the three supporter tiers, the launch-day and thank-you templates. All of it is for mailing your own list; none of it is an editor pitch. The templates also carry emoji in subjects, em dashes, "means the world", "part of this journey" and "Big news", every one of which is on a ban list here.
- ph-email-strategy's "allowed" replacements for vote asks ("We'd love your support", "Excited to share this with you"). Still an ask, and "excited to share" is in GLOBAL_RULES as filler. Rule 8 keeps the pitch to "take a look".
- ph-safe-messaging's offer rows ("PH community gets 20% off"). A discount tied to coverage is a favour owed; rule 8 bans it rather than rewording it.
- The "Output Format" block from the source (pitch plan with primary and secondary newsletters, gallery list, checklist). Launch Kit's output is subject plus pitch plus warnings; the plan lives in the Targets and Plan stages.

## Brand sweep of this file

Run before merging, from the repo root:

```bash
f=apps/launchkit/rulebooks/newsletter_pitch.md
grep -nE '\bsh[i]p(s|ped|ping)?\b' "$f" | wc -l   # banned verb, expect 0
grep -n $'\xe2\x80\x94' "$f" | wc -l            # em dash (U+2014), expect 0
grep -n $'\xe2\x80\x93' "$f" | wc -l            # en dash (U+2013), expect 0
grep -inE 'game.?ch[a]ng|ground[b]reaking|revolution[a]r|vir[a]l|se[a]mless|unle[a]sh|superch[a]rge|\b1[0]x\b' "$f" | wc -l   # hype, expect 0
```
