# Judge brief (fixed for the whole loop)

You are judging one app's Launch Kit run. You did not build or fix anything in it, and you have not seen anyone's reasoning about it. Your job is to find what is wrong, not to be encouraging. Every claim you make must quote the stored output.

## Inputs (all under `docs/eval-10-0929/<slug>/`)

- `summary.json`: the drive's record (stage ok/failed, timings, counts, page errors).
- `appstate.json` (and `appstate.rerun.json` when present; judge the newest row of each kind): the app's full store: `profiles`, `commercial_results` (dna, campaigns, pricing, listing, signals_meta), `assets` (the six posts with `warnings`, `blockers`, `repaired`), `studio` (probe, images, cards, script, voice, reel), `targets`, `signals`, `runs`, `traces`, `platform_rules`.
- `extract.json`: mechanical facts per stage. Screenshots `*.png`, `plates.jpg`, `poster.jpg`.
- The standards: `apps/launchkit/src/lib/rulebooks.ts` (GLOBAL_RULES and each platform's rules), `.claude/rules/skills/brand-check/references/rulebook.md` (brand rules), and the app's own site and repo named in `summary.json` (you may fetch them to check facts).

## Scores, 1 to 5, per stage and per post

- **5**: a careful founder would use it as is. Every claim traces to the profile or the live site; no rule is broken.
- **4**: light edits (a word, a line).
- **3**: usable with real edits; one notable fault.
- **2**: needs rework: an invented fact, a contradiction with another stage, a broken rule a reader would notice, or output that misses the app.
- **1**: wrong, broken, missing, or harmful to publish.
- **0** (posts only): the draft was not produced.

## What each stage is judged on

- **profile**: matches the live site and repo; confidence and `analysis_degraded` honest; gaps are real product gaps, not read failures; nothing invented.
- **brand**: DNA faithful to the site (voice, colours, claims); angles distinct from one another, grounded in the profile, no competitor negativity; the chosen angle is usable.
- **commercial**: pricing options anchored on current public prices where they exist; no invented tiers, quotas or features; revenue maths right; the listing agrees with the chosen pricing and names no competitor negatively; categories and keywords sensible.
- **social**: judge each of the six posts (`x_post`, `linkedin_post`, `reddit_post`, `producthunt`, `show_hn`, `newsletter_pitch`) against its platform rulebook and GLOBAL_RULES: no invented person, origin story, limitation, mechanism or number; no competitor swipe; length and shape; blockers left unresolved; the stage score is your overall judgement of the set.
- **assets**: the site read found the right logo and colours; image briefs and plates show this product's world; card copy is right (name, tagline, no error text); the reel script's beats are true to the product (no template beats, no invented scenario numbers); voice lines fit; the reel was approved only if it deserved to be.
- **targets**: venues fit the app's maturity and audience; ranking defensible; no dead, off-topic or duplicate venues; rules summaries accurate.
- **signals**: kept signals are real buyers (not builders, vendors or the app's own content), recent, and verified from their text; replies help first and invent nothing; an honest empty result with a sensible scan report scores on its correctness, not its count.
- **plan**: consistent with every decision taken (angle, pricing, listing, selected venues); complete; actionable; no stale or contradictory text.

## Issues

For each issue: `stage`, `severity` (exactly one of `blocker`, `high`, `medium`, `low`), `summary` (one sentence), `evidence` (a verbatim quote from the store or site, with where it is), `systemic` (true if the cause is in Launch Kit's prompts, rules, gates or code rather than this app's facts), and `cause_hint` (where you think it comes from: a file, a rule, a pipe), if you can tell.

- **blocker**: publishing it would embarrass the founder or mislead a reader (an invented fact about the product, a named person who is not real, a wrong price presented as current).
- **high**: a reader would notice and it undercuts the post or stage.
- **medium**: a real flaw a careful editor would fix.
- **low**: polish.

## Output

Return exactly this JSON:

```json
{
  "slug": "",
  "scores": {"profile": 0, "brand": 0, "commercial": 0, "social": 0, "assets": 0, "targets": 0, "signals": 0, "plan": 0},
  "post_scores": {"x_post": 0, "linkedin_post": 0, "reddit_post": 0, "producthunt": 0, "show_hn": 0, "newsletter_pitch": 0},
  "issues": [{"stage": "", "severity": "", "summary": "", "evidence": "", "systemic": true, "cause_hint": ""}],
  "best": "",
  "worst": "",
  "notes": ""
}
```

When a turn re-judges only some stages, score only those stages and return the others as `null`.
