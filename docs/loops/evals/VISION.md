# Staging evals: vision

**Goal.** Every model-driven stage of Launch Kit produces output a careful founder could use with light edits, measured on the ten real apps of the 09-11 evaluation, on staging, with today's code.

**What is measured.** Each stage a model writes: profile (understand), brand (DNA and angles), commercial (pricing and listing), social launch (six posts), assets (site read, image briefs, cards copy, reel script, voice-over lines), targets (ranked venues), signals (finder, gate, thread read and relevance judge), plan (assembly of the decisions). Plus the navigator's replies when a turn touches it.

**How.** `launchkit-src/frontend/run-eval.mjs` drives all eight stages on the ten apps through the preview on real staging pipelines (two lanes), `eval-extract.py` and `eval-sheets.py` turn each store into facts and contact sheets, and one judge agent per app, never the agent that built or fixed anything, scores against [JUDGE.md](JUDGE.md). The rubric is fixed for the whole loop so scores compare across turns and with the 09-11 baseline.

**Bar (the stop condition).**
1. Every stage's mean over the ten apps is at least 3.5, and no stage scores below 2 on any app.
2. Every platform's mean post score is at least 3.5.
3. Zero blocker issues; high issues only where the cause is outside the app (a site that is down, a platform limit) and named as such.
4. Every drive ends with all eight stages ok, or the failure is traced to a named external cause.

**Baseline (09-11, same ten apps, same scale).** Stages: profile 3.8, brand 3.6, commercial 2.6, social 2.9, assets 2.9, targets 3.1, signals 1.7, plan 3.1 (overall 3.0). Posts after the rulebook v4 re-run (09-14): mean 3.52.

**Cap.** Three turns. Turn 1 measures everything on today's code; turns 2 and 3 fix the weakest stages, re-run only those stages from the turn-1 stores with `drive.rerun.mjs`, and re-judge those stages. If the cap is hit, the report says so, with the best scores reached and what is still below the bar.

**Rules.**
- Never edit `apps/launchkit/src` or a `.pipe` while a drive runs (the preview hot-reloads).
- Never run `tools/gen-pipes.mjs` (MIGRATION-ISSUES-LOG L9). After a `.pipe` edit, rotate that pipe's `project_id` so no stale task is reused.
- A fix that changes a rule changes the rulebook version (`RULEBOOK_VERSION`) in the same edit.
- When a judge finds a class of fault, fix the class (the prompt, the gate, the rulebook, a test), not the one draft, and record it under System improvements.
- Output lands in `docs/eval-10-0929/`; the 09-11 evidence in `docs/eval-10/` is never overwritten.
