# LinkedIn launch post rulebook (`linkedin_post`)

Reference for the `linkedin_post` platform rulebook in Launch Kit. Written 2026-09-11 from the USE and PARTIAL verdicts in `docs/social-launch-skills-review.md`, judged against `.claude/rules/skills/brand-check/references/rulebook.md` sections 1 to 3.

## Scope

Launch Kit drafts one LinkedIn launch post for the builder's personal account, plus one alternate hook. The output shape is fixed by `pipelines/lk_assets.pipe` line 33:

```
{"post": string, "alt_hook": string, "warnings": [string]}
```

This document holds four things:

1. The rules the drafting model receives verbatim as the `PLATFORM_RULES` block (`src/data/rules.ts` builds it; `src/lib/rulebooks.ts` seeds the default).
2. The mechanical checks a program can run on `post` and `alt_hook` after `sanitizeDraft` has already replaced every dash.
3. Hook patterns in our voice that seed line 1 and `alt_hook`.
4. A short launch-week rule set (cadence and reply triage) the model carries into `warnings`, never into the post body.

Nothing here posts anything. The builder pastes the post. That is the source pack's design and it is also the brand rulebook's approval workflow (section 5.5).

## Sources used

| Source | Repo and commit | Files read | License | Verdict in review |
| --- | --- | --- | --- | --- |
| LinkedIn agent skill | github.com/Jakeschincariol/linkedin-agent-skill, commit add2c238 (2026-09-07) | `skills/li-post/SKILL.md`, `skills/li-post/hooks.json` (21 formulas), `skills/li-human/SKILL.md`, `skills/li-human/slop.json`, `skills/li-human/humanize.py`, `skills/li-human/detect.py`, `skills/li-comment/SKILL.md`, `skills/li-reply/SKILL.md`, `skills/li-plan/SKILL.md`, `skills/li-repurpose/SKILL.md`, `skills/li-carousel/SKILL.md` (slide rules only), `templates/voice.md`, `README.md`, `LICENSE` | MIT (Jake Schincariol, 2026) | li-post, li-human, li-comment, li-reply, li-plan, li-repurpose: USE. li-carousel: PARTIAL. |
| Home of AI course | github.com/jamesgray007/hoai-course, commit de68d969 (2025-12-18) | `.claude/skills/writing-linkedin-posts/SKILL.md`, the "What to Avoid" and "Engagement Strategy: What Not to Do" sections only | No license file in the repo | SKIP as a source; its anti-pattern list used as a cross-check only. No text copied. |
| RocketRide brand rulebook | this repo, `.claude/rules/skills/brand-check/references/rulebook.md` | Sections 1 (vocabulary), 2 (positioning), 3 (tone) | internal | Governing. |
| Launch Kit defaults | this repo, `apps/launchkit/src/lib/rulebooks.ts`, `pipelines/lk_assets.pipe` lines 30 to 41 | current `linkedin_post` rules, `GLOBAL_RULES`, output shape | internal | Baseline being replaced. |

The source pack's own instructions use the banned launch verb four times and a handful of em dashes in prose. None of that text was copied. Every rule below was rewritten, and the brand rulebook's punctuation rule applies to this document as well.

## What the humanizer strips and scores (li-human)

Read in full because the checks below are modelled on it.

`humanize.py` runs three passes and reports a fourth:

1. Invisible characters: deletes zero-width space and joiners, word joiner, BOM, soft hyphen, Mongolian vowel separator, Arabic letter mark, LTR and RTL marks, Unicode tag characters (U+E0000 to U+E007F), and any leftover Unicode `Cf` character; turns no-break, narrow no-break, thin, figure, em and en spaces into plain spaces.
2. Typography: em dash to `, `, en dash between digits to `-` and elsewhere to `, `, curly quotes to straight, ellipsis to three dots, bullet and middle dot to `-`, arrow to `->`. Then it cleans the doubled punctuation an em dash leaves behind.
3. Lexicon: 113 stock words and phrases from `slop.json` (verbs, adjectives, nouns, connectives, openers, closers), replaced with plain words, longest match first, capitalisation preserved, URLs protected.
4. Structural tells, flagged only: "It's not just X, it's Y", "not only X but also Y", "It isn't about X. It's about Y", one-word question lines ("The result?"), "Here's what I learned", comma triads, the five reflex emoji (rocket, fire, bulb, sparkle, dart), hashtag walls of five or more, model self-reference, essay closers ("In summary"), reflex engagement bait ("Thoughts?", "Agree?", "Who else"), and uniform sentence length (coefficient of variation under 0.35 across four or more sentences).

`detect.py` scores five signals 0 to 100 and takes 60 percent of the mean plus 40 percent of the weakest check. PASS needs 70 overall with no check under 55:

| Check | Measures | Human target it uses |
| --- | --- | --- |
| Burstiness | sentence-length variation | coefficient of variation 0.55 or more |
| Specificity | numbers plus distinct proper nouns per 100 words | 4 or more |
| Slop density | lexicon hits per 100 words | 0 |
| Fingerprint | invisible chars (weight 4), em dashes (2), curly quotes, ellipses, hard spaces per 1,000 chars | 0 |
| Voice | contractions per 100 words (target 3), personal pronouns per 100 words (target 8), structural tells, uniform bullet length | as stated |

What was carried into this rulebook: the dash pass (already in `sanitizeDraft`), the invisible-character pass (new check), the lexicon (folded into a forbidden-word check with the brand additions), the structural tells (a check plus a rule), and the burstiness, specificity and voice targets (a rule, since they need a scorer rather than a regex). The scripts themselves are not vendored; see notes.

## Rules adopted

Numbered in the order the model should weigh them. Each rule is followed by where it came from and what changed.

1. **Line 1 is the hook and stands alone at 140 characters or fewer: one specific, true thing about this app (a number from proof_points, a named failure, a concrete before and after). No question mark in line 1 unless only this builder could ask the question. No emoji in line 1.**
   From li-post ("It has to survive truncation at ~140 chars mobile") and `hooks.json` rules ("No question marks in line 1 unless the question is specific enough that only you could ask it"). Changed: tied "specific" to the app profile, added the no-emoji clause from the slop.json rocket rule.

2. **Line 2 pays off line 1. It is never setup for line 3. If a reader stops after two lines they must still have the point.**
   From `hooks.json` rule 2 and li-post's shape ("the payoff of line 1, not setup for line 3"). Changed: added the stop-after-two-lines test.

3. **Length 120 to 200 words (about 900 to 1,300 characters). Under 120 reads as a passing thought; over 200 has to earn every line and the see-more tap has to be paid for by line 2.**
   From li-post ("900-1,300 characters is the working range"; "Under 400 reads as a thought") reconciled with the existing Launch Kit default and the pipe (120 to 200 words). Changed: kept the word range the pipe already states; added the character equivalent so both agree.

4. **One idea per post, in this order: what happened while building (the bug, the constraint, the first user), the app in one plain sentence (its name once, what it does once), what the reader can do with it today. If the draft holds two ideas, keep the stronger one and list the other in warnings as a second post.**
   From li-post ("One idea per post. If the draft has two, you have two posts. Say so") and the current Launch Kit rule ("one specific outcome or lesson, then what you built"). Changed: made the order explicit for a launch and routed the second idea into warnings.

5. **Every number, name, customer and outcome comes from APP_PROFILE.proof_points or BRAND_DNA. If the post needs a number you do not have, write {{your number}} in its place and add a warning. Never invent users, metrics, testimonials, benchmarks or partnerships, and never write a revenue or funding figure.**
   From li-post ("Numbers over adjectives"; "Never fabricate... leave {{your number}} in the draft and flag it") and brand rulebook 2.7 and 5.1 (financial projections confidential; do not assert capability without confirmation). Changed: named the two Launch Kit sources of truth; added partnerships and money to the never-invent list per rulebook 4.4 and 5.1.

6. **No URL and no {APP_URL} in the post body; LinkedIn suppresses posts with outbound links. End the body with the line "Link in the first comment." and add the warning "First comment: {APP_URL}" so the builder pastes it there.**
   From li-post ("No links in the post body... Put the link in the first comment and say so in the receipt"). Changed: mapped "the receipt" onto the `warnings` array, which is the only other field in the output shape. This changes where {APP_URL} lands for LinkedIn only.

7. **Close with exactly one of: a question only this post could ask, or one instruction. Never both. Never "Thoughts?", "Agree?", "Who else?", "Am I wrong?", "Comment YES", "Tag someone", "Repost if", "Follow me for more", "Save this", "Let that sink in", "Read that again".**
   From li-post ("one specific question, or one instruction. Never both"; "No engagement bait"), slop.json closers and the `engagement-bait` structure, cross-checked with the hoai anti-pattern list ("Comment YES if", "Share this with 3 people", "Follow me for more"). Changed: merged the three lists into one, dropped nothing.

8. **Paragraphs of one to three lines with a blank line between every one. No wall of text, no run of six or more one-sentence lines, at most three bullet lines, no line in ALL CAPS, no Title Case headline.**
   From li-post's shape ("short paragraphs, 1-3 lines each, blank line between every one... The white space is the format"), the existing Launch Kit rule ("No bullet-list dumps"), and hoai format anti-patterns ("Every. Sentence. As. Its. Own. Line.", "ALL CAPS FOR EMPHASIS"). Changed: gave the anti-patterns numbers so they can be checked.

9. **Write in first person with contractions (it's, we've, didn't): aim for three contractions and eight personal pronouns per 100 words. Vary sentence length: at least one sentence under six words and one over twenty, never four sentences in a row of the same length.**
   From `detect.py` VOICE (contractions target 3.0 per 100, pronouns 8.0 per 100) and BURSTINESS (variation 0.55 or more; "Break one sentence in half. Let another run long. Machines write even."). Changed: turned the scorer's thresholds into instructions the model can follow without running the script.

10. **Never these shapes: "It's not X, it's Y"; "not only X but also Y"; "This isn't about X. It's about Y"; a one-word question line such as "The result?"; "Here's what I learned"; a closing paragraph that opens "In summary" or "In conclusion"; a comma triad of three adjectives.**
    From slop.json `structures` (all eleven read; nine kept here, the hashtag wall and emoji moved to their own rules, model self-reference left to the global filler rule). Changed: none in substance.

11. **For releasing software say launch, release, deploy, deliver or roll out; the verb the brand rulebook bans in section 1.1 fails the forbidden-word check in every form. Never the deprecated one-key-for-every-model framing (section 1.2). Never the slop lexicon: delve, leverage, utilize, robust, crucial, vital, comprehensive, journey, landscape, realm, paradigm, synergy, testament to, cornerstone, empower, streamline, foster, facilitate, showcase, moreover, furthermore, additionally, ultimately, "in order to", "when it comes to", "in today's fast-paced world", "here's the thing", "let's face it", "excited to announce", "thrilled to share". No hype adjectives and no speed multipliers ("N times faster").**
    From slop.json `words` and `phrases`, brand rulebook 1.1 (banned words) and 1.3 (AI tells), and the task brief's hype set. Changed: two lexicon entries were dropped because they are RocketRide's own vocabulary (see "left out"); the banned launch verb and the deprecated key framing were added; the eleven filler terms already listed in `GLOBAL_RULES` are not repeated in the rule but stay in the check.

12. **Never name a competitor, never write "better than", "unlike other tools", "outperforms" or "alternative to". Show the thing working instead: one concrete detail of what it did, on what input. Name a partner only if it is in proof_points.**
    From brand rulebook 4.1 ("Never position RocketRide as better than X. Show, don't tell"), 4.4 (partners in discussion must not read as confirmed) and 3.1 ("Show, don't tell"). Not in the source pack. Added because a launch post is where this failure happens.

13. **Hashtags: at most three, all on the last line after the link line, only real categories people follow (for example #opensource #devtools #python). None inline in the body.**
    From li-post ("Three hashtags maximum, at the bottom, and only if they are real categories someone follows") and hoai ("Never use hashtags inline with text"). Changed: hoai allows five; li-post and the existing Launch Kit rule say three; three wins.

14. **Emoji: at most one in the whole post, never in line 1, and never rocket, fire, light bulb, sparkles or dart. Normal capitalisation and full punctuation throughout: this is a post, not a DM.**
    From slop.json `rocket` structure ("One emoji max, and not one of these five"), `GLOBAL_RULES` (at most one), and brand rulebook 3.2 (LinkedIn posts use normal capitalisation; lowercase openers are for Joe's DMs only). Changed: none.

15. **alt_hook is a second line 1 for the same post from a different hook family than the one used (see the hook patterns): 140 characters or fewer, one line, standing alone, no URL, no question mark unless the question is specific to this builder.**
    From li-post's loop ("Pick three hooks, not one... Different formulas, not three variations of one"). Changed: Launch Kit's shape has room for one alternate, not three, so the rule asks for a different family rather than a count.

16. **warnings must list: the first-comment link line, every {{your number}} placeholder, any second idea cut from the draft, and any claim you could not trace to proof_points.**
    From li-post's receipt block and its `{{your number}}` flag, plus brand rulebook 5.3 (unsupported capability claims get flagged). Changed: mapped onto the `warnings` field.

17. **Launch week, for warnings not the post: after the launch post, at most four posts in the week and never two of the same kind back to back: proof (one number from the launch), opinion (a position about the problem the app solves), teach (one thing the reader can do with the app today), story (a scene from building it with what it cost). Post Tuesday to Thursday between 7:30 and 9:30 am in the audience's timezone; the first line matters far more than the hour.**
    From li-plan ("Four posts a week beats seven"; the proof / opinion / teach / story / offer table; "Tuesday to Thursday, 7:30-9:30am local"; "the day and hour matter far less than whether the first line is good"). Changed: the "offer" slot is dropped because the launch post is the offer; the four kinds are tied to the app.

18. **Launch day replies, for warnings not the post: in the first hour sort every comment into lead, substance, peer, support, noise and answer in that order. Answer the question fully in public, use the commenter's name once with no exclamation mark, match their length. To a critic concede the true part first in their words, then hold the line; never delete, never reply twice. Ignore pitches. Never ask for likes, reposts, tags or comments as a favour.**
    From li-reply (the five buckets and every "How to reply" bullet) with the no-vote-ask clause from the task brief and the hoai "What Not to Do" list (engagement pods, comment-for-resource). Changed: condensed to one rule; the DM open-door line was dropped (outreach is out of scope).

## Mechanical checks

All `forbidden_regex` values are written without inline flags so they run in both JavaScript and Python. Apply the case-insensitive flag to every one except `post_all_caps_run`; do not apply the multiline flag (the patterns use `(?:^|\n)` where a line start is meant, and `^` alone means start of string). The emoji check needs the Unicode (`u`) flag in JavaScript. The two dash characters are written as `\u2014` and `\u2013` so this file itself contains none.

| id | field | kind | value | description |
| --- | --- | --- | --- | --- |
| post_min_words | post | min_words | 120 | li-post working range, lower bound |
| post_max_words | post | max_words | 200 | li-post working range, upper bound; matches lk_assets.pipe |
| post_max_chars | post | max_chars | 1400 | belt for the word limit: 1,300 chars plus the link line and hashtags |
| hook_line_max_chars | post | forbidden_regex | `^[^\n]{141,}` | line 1 longer than the 140-char mobile truncation |
| hook_line_no_reflex_question | post | forbidden_regex | `^[^\n]{0,30}\b(?:ever wondered?\|have you ever\|did you know\|what if i told you\|are you (?:tired\|sick) of\|are you still)\b` | rhetorical-question opener in line 1 |
| no_url_in_body | post | forbidden_regex | `https?://\|\bwww\.\|\{APP_URL\}` | li-post: no links in the body |
| first_comment_line_present | post | forbidden_regex | `^(?![\s\S]*\blink (?:is )?in the (?:first )?comments?\b)` | fails when the "Link in the first comment." line is missing (negative lookahead at start of string) |
| hashtags_max_three | post | forbidden_regex | `#\w+(?:[\s\S]*?#\w+){3}` | four or more hashtags |
| hashtags_last_line_only | post | forbidden_regex | `#\w+[^\n]*\n[\s\S]*\S` | a hashtag followed by more content on a later line |
| no_dashes | post | forbidden_regex | `[\u2014\u2013]` | em or en dash; sanitizeDraft already replaces these, this is the belt |
| invisible_chars | post | forbidden_regex | `[\u200B-\u200F\u2060\uFEFF\u00AD\u202F\u2009\u2007\u2003\u2002\u180E\u061C]` | humanize.py pass 1: characters a keyboard never produces |
| brand_banned_terms | post | forbidden_regex | `\bship(?:s\|ped\|ping)?\b\|universal\s+api\s+key` | brand rulebook 1.1, both hard bans |
| hype_terms | post | forbidden_regex | `game.?chang(?:er\|ing)\|groundbreaking\|revolutionar(?:y\|i[sz]e)\|\bviral\b\|seamless(?:ly)?\|unleash\|supercharge\|\b10x\b\|\b\d+x\s+(?:faster\|better\|quicker\|more)\b\|next[- ]gen\b\|world[- ]class\|best[- ]in[- ]class\|state[- ]of[- ]the[- ]art` | brand rulebook 1.3 hype set plus the task brief's additions |
| competitor_framing | post | forbidden_regex | `\bbetter than\b\|\bunlike (?:other\|most\|every\|any\|the rest)\b\|\boutperforms?\b\|\bcompetitors?\b\|\balternative to\b` | brand rulebook 4.1 |
| engagement_bait | post | forbidden_regex | `\bthoughts\?\|\bagree\?\|\bwho else\b\|\bam i wrong\?\|\bwho['’]s with me\b\|\bcomment (?:yes\|below\|['"]\w+['"])\b\|\bdrop a comment\b\|\bshare this with\b\|\bfollow me\b\|\btag (?:someone\|a friend)\b\|\brepost (?:if\|this)\b\|\blike (?:if\|this post)\b\|\blet that sink in\b\|\bread that again\b\|\bsave this for later\b` | slop.json engagement-bait and closers, hoai engagement anti-patterns |
| slop_lexicon | post | forbidden_regex | see "Forbidden-word lexicon" below | slop.json words and phrases minus the two brand-vocabulary exclusions |
| structural_tells | post | forbidden_regex | `it['’]s not (?:just\|only) [^.!?\n]{2,60}[,.] it['’]s\b\|\bnot only\b[^.!?\n]{2,80}\bbut also\b\|\b(?:this\|it) is(?:n['’]t\| not) about [^.!?\n]{2,60}[.!] it['’]s about\b\|(?:^\|\n)[ \t]*(?:the result\|the best part\|the kicker\|the catch)\?[ \t]*(?:\n\|$)\|\bhere['’]s what (?:i\|we) learned\b\|(?:^\|\n)[ \t]*(?:in summary\|to summari[sz]e\|in conclusion)\b` | slop.json structures, ported to run without the multiline flag |
| banned_emoji | post | forbidden_regex | `[🚀🔥💡✨🎯]` | the five reflex emoji from slop.json (u flag in JavaScript) |
| staccato_lines | post | forbidden_regex | `(?:^\|\n)(?:[^\n]{1,60}[.!?][ \t]*\n){5}[^\n]{1,60}[.!?]` | six or more consecutive short one-sentence lines with no blank line between |
| bullet_dump | post | forbidden_regex | `(?:(?:^\|\n)[ \t]*[-*•][ \t]+[^\n]*){4}` | four or more bullet lines |
| post_all_caps_run | post | forbidden_regex | `\b[A-Z]{4,}(?:\s+[A-Z]{4,}){2}\b` | three consecutive words of four or more capitals; case-sensitive |
| alt_hook_max_chars | alt_hook | max_chars | 140 | same truncation limit as line 1 |
| alt_hook_single_line | alt_hook | forbidden_regex | `\n` | the alternate hook is one line |
| alt_hook_no_dashes | alt_hook | forbidden_regex | `[\u2014\u2013]` | as for post |
| alt_hook_no_url | alt_hook | forbidden_regex | `https?://\|\bwww\.\|\{APP_URL\}` | as for post |
| alt_hook_brand_banned_terms | alt_hook | forbidden_regex | `\bship(?:s\|ped\|ping)?\b\|universal\s+api\s+key` | as for post |
| alt_hook_hype_terms | alt_hook | forbidden_regex | same as `hype_terms` | as for post |

In the table the alternation bar is escaped as `\|` for Markdown; the structured return carries the raw patterns. The `slop_lexicon`, `engagement_bait` and `structural_tells` patterns should also run on `alt_hook` if the check runner allows one pattern on two fields; they are listed once to keep the table readable.

## Forbidden-word lexicon

The `slop_lexicon` check is this pattern, one alternation, case-insensitive:

```
\bdelve|\bdeep[- ]dive|\bdive deep\b|\bleverag(?:e|es|ed|ing)\b|\butili[sz](?:e|es|ed|ing)\b|\bembark on\b|\bfoster(?:s|ed|ing)?\b|\bfacilitat(?:e|es|ed|ing)\b|\bshowcas(?:e|es|ed|ing)\b|\bunlock(?:s|ed|ing)?\b|\belevat(?:e|es|ed|ing)\b|\bstreamlin(?:e|es|ed|ing)\b|\bspearhead|\bcultivat(?:e|es|ed|ing)\b|\bamplif(?:y|ies|ied|ying)\b|\bcurat(?:e|es|ed|ing)\b|\bempower(?:s|ed|ing)?\b|\btransformative\b|\brobust(?:ly)?\b|\bpivotal\b|\bcrucial(?:ly)?\b|\bvital(?:ly)?\b|\bcomprehensive(?:ly)?\b|\bcutting[- ]edge\b|\bunparalleled\b|\binvaluable\b|\bmeticulous(?:ly)?\b|\bmyriad\b|\bmultifaceted\b|\bholistic(?:ally)?\b|\bbespoke\b|\binnovative\b|\bprofound(?:ly)?\b|\bremarkabl[ey]\b|\bcompelling\b|\btapestry\b|\brealm\b|\blandscape\b|\bjourney\b|\btestament to\b|\bcornerstone\b|\bbeacon\b|\bparadigm\b|\bsynergy\b|\btreasure trove\b|\bplethora\b|\barsenal\b|\bnorth star\b|\bmoreover\b|\bfurthermore\b|\badditionally\b|\bnevertheless\b|\bconsequently\b|\bthus\b|\bhence\b|\bnotably\b|\bimportantly\b|\bultimately\b|\bin essence\b|\bin conclusion\b|\bwhen it comes to\b|\bin order to\b|\ba wide range of\b|\bit is worth noting\b|\bin today['’]s (?:fast[- ]paced|digital)\b|\bever[- ](?:evolving|changing)\b|\blet['’]s face it\b|\bhere['’]s the thing\b|\bpicture this\b|\bimagine a world\b|\bit['’]s no secret\b|\bwe['’]ve all been there\b|\bthe choice is yours\b|\bfood for thought\b|\bthe future is here\b|\bat the end of the day\b|\bmove the needle\b|\bneedle[- ]moving\b|\bhad the opportunity to\b|\b(?:i['’]m |i am )?(?:excited|thrilled|humbled|proud|delighted) to (?:announce|share)\b|\bwithout further ado\b|\bbuckle up\b|\bthe harsh truth\b|\bspoiler alert\b|\byou['’]re welcome\b
```

Where each family came from:

| Family | Entries | Origin | Change |
| --- | --- | --- | --- |
| Verbs | delve, deep dive, leverage, utilize, embark on, foster, facilitate, showcase, unlock, elevate, streamline, spearhead, cultivate, amplify, curate, empower | slop.json `words`, family verbs | "harness" removed (RocketRide AIDE is "the developer harness", rulebook 2.5); "underscore" removed (a character name in developer text); one verb moved to `hype_terms` |
| Adjectives | transformative, robust, pivotal, crucial, vital, comprehensive, cutting-edge, unparalleled, invaluable, meticulous, myriad, multifaceted, holistic, bespoke, innovative, profound, remarkable, compelling | slop.json `words`, family adjectives | three entries moved to `hype_terms` |
| Nouns | tapestry, realm, landscape, journey, testament to, cornerstone, beacon, paradigm, synergy, treasure trove, plethora, arsenal, north star | slop.json `words`, family nouns | "ecosystem" removed (rulebook 3.1 uses "the SF ecosystem"; developers say "the npm ecosystem") |
| Connectives | moreover, furthermore, additionally, nevertheless, consequently, thus, hence, notably, importantly, ultimately, in essence, in conclusion, when it comes to, in order to, a wide range of, it is worth noting, had the opportunity to | slop.json `words` and `phrases` | none |
| Openers | in today's fast-paced world / digital age, ever-evolving, ever-changing, let's face it, here's the thing, picture this, imagine a world, it's no secret, we've all been there, excited / thrilled / humbled to announce or share, without further ado, buckle up, the harsh truth, spoiler alert | slop.json `phrases`, family openers; hoai "I'm excited to announce" | "proud to announce" and "delighted to share" added as the same corporate opener |
| Closers | the choice is yours, food for thought, the future is here, at the end of the day, move the needle, needle-moving, you're welcome | slop.json `phrases`, family closers | "let that sink in", "read that again", "save this for later", "drop a comment", "what are your thoughts", "who's with me" moved to `engagement_bait` |
| Brand additions | the launch verb of rulebook 1.1 in all four forms; the deprecated one-key framing of rulebook 1.1 and 1.2 | brand rulebook, task brief | kept in their own check (`brand_banned_terms`) so a hit is reported as a brand blocker, not as slop |
| Hype | the rulebook 1.3 set plus the task brief's additions (multipliers and superlative compounds) | brand rulebook 1.3, task brief | own check (`hype_terms`) |

## Hook patterns

Eight patterns for line 1 and `alt_hook`. Each keeps the mechanics of one `hooks.json` formula (the template shape and its trap) and drops the source example, which is written for agency owners and cold-DM senders. Slots in braces are filled from the app profile; every number must come from proof_points.

1. **Time anchor** (mechanics of formula 17). `{Task} used to take me {long time}. It now takes {short time}. One {file, component or decision} did it.` Trap: a ratio the reader cannot believe. Both times must be real.
2. **Cost of a wrong assumption** (formula 3). `{N hours or days} is what {one wrong assumption} cost me before I built {app}.` Trap: a fake-humble mistake. Name the assumption and give the fix by line 4.
3. **The log line** (formula 9). `"{The exact line from the stack trace, the PR review or the first user's message.}" That line is why {app} exists.` Trap: dialogue nobody said. Use the real text, including the ugly part.
4. **The receipt** (formula 10). `{One hard number from proof_points}. {Where it ran, on what input, with what model.}` Trap: a number with no story. The number opens the door; the second sentence is the room.
5. **The practice I stopped** (formula 1). `Everyone building with {LLMs, agents, RAG} says {common practice}. After {specific experience with app}, I stopped.` Trap: being contrarian about something nobody believes. Say what replaced the practice.
6. **The thing I deleted** (formulas 18 and 20). `I deleted {thing developers usually keep: the vector DB, the retry wrapper, the second model} from {app}. Here is what broke and what got faster.` Trap: a walk-away with no cost. Name the cost, not only the win.
7. **Two ways, one verdict** (formula 12). `A {heavy option: five-service pipeline, hosted platform} vs {the small thing I built in a weekend}. Here is where each one wins.` Trap: an unfair comparison. Concede what the heavy option does better, and never name a competitor.
8. **Copy this** (formula 21). `Here is the exact {config, prompt, .pipe file, script} I use to {specific outcome}. Copy it.` Trap: making the reader ask for the artifact. Give it in the post, not behind a comment-for-link.

Formulas not carried: 5 (list promise), 6 (insider secret), 7 (callout), 8 (question trap), 11 (myth bust), 13 (permission slip), 14 (pattern interrupt), 15 (warning), 16 (good vs great), 19 (curiosity gap). They fit opinion and teach posts in launch week, not the launch post itself, and 13 and 16 read as coaching content in any developer's voice.

## Deliberately left out and why

- **The `voice.md` questionnaire and the "ask for three past posts" step.** Launch Kit already carries the builder's voice in APP_PROFILE.voice and BRAND_DNA; the pipe resolves the precedence. Pointing voice.md at Joe's voice (review step 2) is a brand-account task, not a rulebook rule.
- **The three-hook presentation and the "POST READY" receipt block.** The output shape has one `alt_hook` and a `warnings` array; the receipt's contents were folded into rule 16.
- **li-post's "which you would post and why" sentence.** The model returns JSON, not commentary.
- **The `log.md` and `plan.md` files, and the ten-person engagement list from li-plan.** File state and a named list of people to comment on are outside a drafting rulebook; the cadence survived as rule 17.
- **li-comment's nine comment types.** They are for commenting on other people's posts. The one part that applies to a launch (never open with "Great post" or an emoji; two to four sentences; say the specific thing) went into rule 18 only as far as replies under our own post.
- **li-repurpose.** Extract-do-not-summarise is the right rule for turning the launch film or blog into a week of posts, but it produces four to six posts, and this rulebook covers one. It belongs to a later "launch week" asset type if one is added.
- **li-carousel's PDF build and 1080x1350 spec.** Tooling, not copy. The slide-copy limits (cover six words, headline three to seven words, at most 25 words per slide, 8 to 12 slides) are recorded here for a future document-post asset type and are not rules for the text post.
- **`detect.py` as a gate and `humanize.py` as a post-processor.** Both would run unchanged (no dependencies) but they are Python; Launch Kit's gate is TypeScript (`src/domain/gates.ts`). The regex parts are ported above; burstiness, specificity and voice became rule 9. If the owner wants the scorer, vendor the two scripts and `slop.json` under MIT and call them from the runner; do not reimplement the scoring in prose.
- **The comma-triad structural tell as a check.** slop.json's regex (`\w+, \w+, and \w+\.`) also matches ordinary lists ("Python, Go, and Rust."). Kept as rule 10 guidance, not enforced.
- **An emoji-count check.** Counting emoji portably needs a Unicode-aware scanner (`\p{Extended_Pictographic}` exists in JavaScript with the `u` flag but not in Python's `re`). The five reflex emoji are checked; "at most one" stays a rule.
- **Curly-quote normalisation.** `detect.py` scores curly quotes as a fingerprint but the brand rulebook does not ban them. Recommended for `sanitizeDraft` (straighten quotes, collapse ellipsis), not as a failing check.
- **hoai's hook table, storytelling framework, vulnerability test, poll and video advice, and "Top Voice" framing.** Superseded by the source pack per the review; the vulnerability material is coaching content, not launch drafting. Only its anti-pattern lists were used, as a cross-check.
- **hoai's "3-5 hashtags".** Conflicts with li-post and the existing default (three). Three wins.
- **The DM open door in li-reply's lead handling ("Happy to send you the template").** Outreach; li-dm and li-inbox were SKIP in the review.
- **Posting-time optimisation beyond one line.** li-plan itself says the hour matters far less than the hook; rule 17 keeps the one line and nothing more.
- **Any "undetectable" claim.** li-human is explicit that its five checks are local heuristics, not detector verdicts. Nothing in this rulebook promises a detection outcome.

## Notes for the merge

- Rule 6 moves {APP_URL} out of the post body for LinkedIn. The Assets UI should show the "First comment: {APP_URL}" warning next to the post so the builder pastes it. Every other platform keeps the pipe's existing placement.
- `ASSET_LIMITS` in `src/domain/gates.ts` has no `linkedin_post` entry today; `post_max_chars` (1400) and `alt_hook_max_chars` (140) are the natural additions.
- The word range (120 to 200) is unchanged from the pipe and the current default, so `lk_assets.pipe` line 33 needs no edit. If the owner prefers li-post's upper bound, raise both to 220 together.
- The forbidden-word regexes are the only place this document contains the banned strings, and it contains them as patterns (the launch verb inside `\bship(?:s|ped|ping)?\b`, the key phrase as `universal\s+api\s+key`) so a plain grep for the words themselves does not hit the prose.
- Two `slop.json` entries were removed on purpose because they are RocketRide vocabulary: "harness" (rulebook 2.5) and "ecosystem" (rulebook 3.1). If the brand rulebook changes, revisit.
- Brand-check should still run on every draft; this rulebook flags at draft time, it does not replace Dana's adversarial review or Joe's approval (rulebook 5.5).
