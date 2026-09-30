# Launch Kit eval kit

One command for the checks that decide whether a Launch Kit build is good, with the same bar every time.

```bash
node tools/evalkit/evalkit.mjs --layers deterministic                         # about a minute, free
node tools/evalkit/evalkit.mjs --layers deterministic,e2e --apps dub,khoj      # plus real launches on staging
node tools/evalkit/evalkit.mjs --layers deterministic,e2e,judged,scorecard \
  --out docs/evals/staging/2026-09-30 --compare docs/eval-10-0929-t3           # the full measurement
```

## Layers

| Layer | What it runs | Cost | Passes when |
|---|---|---|---|
| deterministic | `npm run test:domain`, typecheck, every live pipe validated on staging, `walk.mjs` (16 read-only UI checks) | about 1 minute, no model calls | all four pass |
| e2e | `run-eval.mjs`: the full eight-stage launch of each app in one lane, then evidence (`extract.json`, `plates.jpg`, `poster.jpg`); a Targets or Signals stage that failed from the connection is re-run once from the saved store | about 35 minutes per app on staging | every app's drive finishes |
| judged | `judge.mjs`: one fresh `claude -p` judge per app, following `docs/loops/evals/JUDGE.md`, checking facts against the live site | about 250k tokens per app | every app has `judged.json` |
| scorecard | `scorecard.mjs`: gates, stage means, lowest app per stage, posts, issues by severity, timings, and the comparison with `--compare` | free | always; the bar is reported, not enforced |

The e2e layer refuses to start when the deterministic layer failed in the same run: a broken build is not worth a launch run.

## The bar

The one the 09-29 eval loop used: every stage mean at 3.5 or above, no stage below 2 on any app, the posts' mean at 3.5 or above, zero blockers. `--bar` changes the number.

## Output

`--out` (default `docs/evals/staging/<date-time>/`) holds one folder per app (store, screenshots, drive log, judged verdict), `scorecard.md`, `scorecard.json` and `report.json` (which layers ran and passed). An existing app folder is renamed to `<app>.previous-<time>` rather than mixed with the new run.

## Before a run

- The preview on :3400: `cd apps/launchkit && npx rsbuild dev -c rsbuild.preview.mts`
- The studio service on :3500 for the Assets stage: `cd services/studio-forge && npm start`
- `.env` holds the dev pair (staging). Nothing else may use that key while an e2e run is going: staging drops a second session.

## Staging traps the kit already handles

- One lane only (`LANES=1`); a second session on the key drops connections.
- The runner kills an app after `--max-min` minutes (default 120); the drive saves the store after every stage, so a killed app keeps what it finished.
- A pipe call that hits its own 8-minute deadline fails once; a dropped connection retries after 5 s and 20 s.
- An empty `appstate.json` from a failed start breaks the evidence scripts: the kit renames old folders before a run.

## Production

This kit drives the local preview against staging. To measure production, work from the IDE that holds the production environment, and get the owner's go-ahead for each run, because a run creates launch projects in the production org:

1. Apply `docs/PROD-HANDOFF.md` Appendix A to `drive.full.mjs` there. It adds `APP_URL` for the deployed app and `PROFILE_DIR` for a signed-in browser. The drive's store dump reads the preview's localStorage, so in the shell the evidence is the screenshots and the drive log until the store can be read from the page.
2. Run the drive per app with `APP_URL=https://api.rocketride.ai/?appid=<app id>` and `OUTDIR=docs/evals/production/<date>/<app>`.
3. Run `judge.mjs` and `scorecard.mjs` on that folder, exactly as for staging, and delete the test launches afterwards.

The kit never deploys, publishes or schedules anything.
