# Launch Kit: next work after the eval loop

Written 2026-09-29, while eval turn 3 runs. Three workstreams, in the order recommended at the end.

## 0. What a launch takes today (measured)

From the 11 clean full runs of turns 2 and 3 (all eight stages ok), `docs/eval-10-0929-t2` and `-t3`:

| Stage | Median | Range | What runs |
|---|---|---|---|
| Profile | 1.6 min | 1.3 to 2.6 | understand pipe (82 s) |
| Brand | 2.4 min | 1.8 to 2.8 | brand DNA (66 s), then campaigns (64 s) |
| Commercial | 3.2 min | 2.7 to 15.7 | pricing (152 s, tail 906 s), then listing (29 s) |
| Social | 10.2 min | 5.1 to 19.6 | six posts one after another (60 s each, tail 532 s) |
| Assets | 8.4 min | 4.2 to 37.1 | probe, images, kit, script, voice, reel (about 3.2 min of work) plus approvals |
| Targets | 1.9 min | 0.1 to 2.5 | targets pipe (119 s) |
| Signals | 4.8 min | 3.2 to 15.1 | signals finder plus rescore (273 s) |
| Plan | 0.1 min | | assembled in the app, no pipe |
| **Total** | **33.9 min** | 27.5 to 69.5 | |

- The pipelines themselves account for about **27 minutes** (median sum of successful runs per app). The other 7 minutes are the test harness: fixed waits, screenshots, clicking approvals.
- For a real builder, a launch is roughly **30 minutes of machine time plus their own review time** at each approval gate. The 45 minutes for hack-judge in turn 3 included a failed stage and a 5-minute wait on the reel approval.
- Every stage runs strictly after the one before it, and the six posts run one at a time. That serial order, not any single pipe, is most of the time.

## 1. Less text, more picture (logged feedback)

**Feedback:** the app is too verbose. Too much content on each screen; features should be understood from a graphic, not from paragraphs.

What we already know from the evals: every stage explains itself in prose (provenance lines, honest-empty paragraphs, warnings, rule text). The walk measures 11,720 characters on Settings alone.

Plan:
1. **Measure.** Extend `walk.mjs` to record visible words per stage above the fold and in total. This gives a baseline and a number each redesign has to lower.
2. **Set a budget per stage.** For example, a stage leads with one visual summary and at most about 40 words above the fold, with detail behind a disclosure. Proposed visuals per stage:
   - Profile: a fact card grid, with verified, unverified and gap chips.
   - Brand: colour swatches, type specimen, logo, and angle cards.
   - Commercial: pricing tier cards (current against proposed, with changes highlighted).
   - Social: one post preview per platform with status stamps (approved, blocked with the rule named).
   - Assets: thumbnails and the reel player.
   - Targets: a ranked bar list with fit and rules-read indicators.
   - Signals: signal cards with source, age and verdict, and the found/dropped/rejected/kept tally as a funnel.
   - Plan: a timeline.
   - Pipeline progress everywhere: stage-level progress instead of a spinner (the pipeline-observability reference in the rocketride-frontend skill).
3. **Run it as a design loop.** Screenshots of each stage, scored against a written rubric by the `design-critic` agent, one fix per turn, capped. The loop-engineering design mode applies: the render path exists (the preview on :3400 and `walk.mjs`).
4. Keep the honesty the evals bought: a warning stays visible, it just becomes a stamp with a one-line reason instead of a paragraph.

Open question for the owner: which screens drew the feedback, and from whom (a user, a demo, the team)? The first loop should start there.

## 2. One eval kit, run on staging and production

Today the pieces exist but are scattered and staging-only:
- deterministic: `npm run test:domain` (96 tests), typecheck, `tools/validate-pipes.mjs`, `walk.mjs` (16 read-only UI checks);
- end to end: `drive.full.mjs`, `run-eval.mjs`, `drive.rerun.mjs` against the local preview;
- judged: `docs/loops/evals/JUDGE.md` with one independent judge per app, and `eval-extract.py` and `eval-sheets.py` for evidence.

Plan: package them as one kit, `tools/evalkit/`, driven by one command, `evalkit --target staging|production --apps <list|all> --layers deterministic,e2e,judged`.
- **Target profiles.** A target file names the app URL (preview or the deployed shell app), which `.env` pair to read, and the browser profile that is signed in. It holds no secrets. Production uses the shell-mode drive patch from `docs/PROD-HANDOFF.md` (APP_URL, PROFILE_DIR).
- **Layers:**
  - deterministic, in minutes and free;
  - end to end: the drive of N apps in one lane, with a per-stage dump, stage timings and automatic one-lane reruns of stages that failed from infrastructure;
  - judged: one fresh judge per app, then a scorecard.
- **Outputs:** `docs/evals/<target>/<date>/` with the evidence, `scorecard.md` (stage means, per-app table, blockers, timings) and a diff against the last run on the same target.
- **Bar:** the one this loop used. Every stage mean at 3.5 or above, no stage below 2 on any app, posts at 3.5 or above, zero blockers. Timing gets its own bar from workstream 3.
- **Production rules:** runs only from the IDE that holds the production environment, and only with the owner's go-ahead for each run. It creates projects in the production org, so the kit tags them and deletes them afterwards. It never runs deploy or publish verbs.
- **Cost:** a judge reads about 250k tokens per app. Ten apps and ten judges is a real spend, so the judged layer is optional per run.

## 3. Cut the time of one launch

Target: under 15 minutes of machine time for a full launch, from about 27 today, with no loss on the judged scores.

1. **Run independent stages side by side.** After the profile is approved, Brand DNA, pricing research, Targets and Signals do not depend on each other. Pricing, the Targets finder and the Signals finder need only the profile, so they can start together. The critical path becomes profile, then the slowest of those (signals at about 4.5 min), then the dependent steps (listing, angles, posts).
2. **Draft the six posts in parallel.** About 10 minutes becomes about the slowest single post, 1 to 2 minutes.
3. **Cut the tails, not just the medians.** Pricing reaches 15 minutes and a post 9 minutes. These are retries, JSON failures and repair passes. Log each attempt's cause in the trace, then fix the biggest one, as was done with Show HN's scratch fields.
4. **Start the assets work early.** Probe and images need only the profile and the DNA, so they can run while the posts draft.
5. **Harness overhead** (7 minutes of waits): event-driven waits instead of fixed sleeps. This matters for the kit's speed, not the product's.

Risk to check first: staging dropped connections when two sessions shared one key. Many tasks inside ONE client connection are a different case and need a short measured test before building on it.

Measure with the kit's timing report: the same ten apps, before and after, with the median and the slowest app.

## Recommended order

1. **Eval kit, first cut** (deterministic plus end-to-end plus timings, on staging). Both other workstreams need its numbers to show they worked. The judged layer and production come right after.
2. **Launch time.** The biggest, clearest win (about 27 to under 15 minutes), mostly orchestration in `data/api.ts`, measured by the kit.
3. **Less text, more picture.** Run as a design loop once the owner names the screens; it changes the UI the kit drives, so the kit's selectors get updated with it.

The eval loop's own findings (commercial, signals and plan still near 2) stay open in `docs/loops/evals/STATE.md`, alongside these three workstreams.
