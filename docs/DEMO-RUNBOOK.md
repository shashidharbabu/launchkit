# Launch Kit demo runbook, local stack

The whole launch runs on this machine: the app in the preview harness on port
3400, the studio renderer on port 3500, and the eight pipelines on the staging
engine through the development key. Nothing here needs the App Builder or a
deploy. Measured end to end on 2026-09-18 with Cal.com; the timings below are
from that run (`docs/demo/cal-com/summary.json`).

## Before the demo (10 minutes)

1. Preview. From `apps/launchkit`:

       npx rsbuild dev -c rsbuild.preview.mts

   Serves http://localhost:3400. It reads `preview/env.generated.ts`; if that
   file is missing, run `node tools/gen-preview-env.mjs staging` from the repo
   root first.

2. Studio. From `services/studio-forge`:

       npm start

   Serves http://localhost:3500. Check http://localhost:3500/health returns
   `"ok":true` with ffmpeg and chromium listed. Its OpenAI key lives in
   `services/studio-forge/.env` and nowhere else.

3. Pipelines start on demand. The first call to each one after a quiet period is
   a cold start (one to two minutes); the run recorded below warmed all of
   them, and they stay warm for about an hour. If the demo is more than an hour
   after the warm-up, run Stage 1 once on a throwaway launch before you start.

4. Open http://localhost:3400 in the browser you will demo from. An empty
   store loads the finished Cal.com launch on its own (the preview reads
   `apps/launchkit/public/dev/flow-appstate-cal-com.json` before the app
   mounts), so the Launches list and Run history are full on the first open.
   Check both before the audience arrives. `?seed=cal-com` reloads that
   launch over whatever is in the store, `?seed=blank` empties it for a
   start-from-nothing run, and any other saved launch works the same way
   (`?seed=dub`) once its file is in `public/dev/`.

## The demo (25 to 35 minutes live, or 8 with the safety net)

Two ways to run it. Live: create a new launch and click through every stage,
which is the honest version and takes the full time. Safety net: open the
seeded Cal.com launch, walk the completed stages, and re-run one live stage
(Brand at about 2.5 minutes, or Signals at about 8) so the audience sees a
pipeline execute. Reloading the seed URL restores the finished state if a live
re-run goes wrong.

| # | Stage | What you click | What to point at | Measured |
|---|---|---|---|---|
| 1 | New launch | Launches, New launch, name + site + repo, Analyze my app | The profile a person would accept; the rail unlocking | 88 s (understand 75 s) |
| 2 | Profile | Approve profile | Gate one: nothing moves without a human approving | (in 1) |
| 3 | Brand | Brand DNA renders, then Choose this angle | Angles are ranked against the rulebook, not generated blind | 154 s (DNA 76 s, angles 73 s) |
| 4 | Commercial | Select a pricing plan, approve the listing | Gate two: listing approval is a commercial decision | 256 s |
| 5 | Social Launch | Draft for each platform, approve | 124 rules, 207 checks; a draft that fails is repaired, then trimmed | 575 s for six platforms (43 to 145 s each) |
| 6 | Assets | Read the site, Make the images, Make the cards, Write the script, Write the voice-over, Render the reel | Studio runs locally; the reel is a real mp4. Do not run the voice-over live | site 13 s, images 75 s (four plates), cards 9 s, script 21 s, **voice-over 1316 s**, reel 82 s |
| 7 | Targets | Rank venues, pick three | Venues ranked from the profile, with sources. The seed has 13 ranked and none picked: pick three live | 153 s |
| 8 | Signals | Search for demand | A signal is a person who needs the app, never a builder announcing a rival. The seed holds three, one of them a person complaining about Calendly pricing | 478 s |
| 9 | Plan | Opens on its own | The readiness view: what is approved, what is not, what is left | 4 s |

Talking points that hold up:

- Three human approval gates (profile, listing, drafts). The app never posts
  anything anywhere; it prepares and a person presses send.
- The brand rulebook is enforced in code (`domain/gates.ts`,
  `lib/rulebook-checks.ts`), including the dash ban, on every draft.
- Signals filters on intent: buyer, builder or vendor. Say the number from
  the diagnosis: over 19 signals from four apps, only 5 were a person who
  needed the app and 6 were competitors announcing their own tool; the gate
  now drops those.

## What the local stack cannot show

Say these out loud rather than letting someone find them:

- Billing. Plans come from the store and only exist once a version is approved
  for it. Locally the Settings page shows the stand-in tier and the Subscribe
  button has nothing to subscribe to.
- Teams and shared workspaces. They need the signed-in shell identity; the
  preview has one local user.
- The store persists in the browser. Clearing site data clears the launch.
- The rescore judge cannot fetch pages from the browser (CORS), so every
  signal reads `unverified` here. In the deployed app that check runs.

## If something goes wrong

- A stage button stays disabled for more than 12 minutes: the pipe call has a
  deadline of 12 minutes for Signals and 8 for the rest, after which the
  runner restarts the connection and retries once. Wait for that; do not
  reload mid-run.
- "Server is not connected" in the console: the WebSocket dropped and the
  runner is reconnecting. Same advice, wait.
- Studio step fails: check port 3500 is up and `services/studio-forge/.env`
  has the key. The reel needs ffmpeg and the bundled chromium; health lists
  both.
- The voice-over takes 22 minutes on this machine (local TTS on the CPU).
  Never start it live; the seeded launch already has it, and the reel that
  uses it renders in about 80 seconds if you want one live studio step.
- On the drive that produced the seed, one pipe call (the image briefs) went
  silent for ten minutes with no error, and every other button stayed
  disabled while it ran. The same step took 75 seconds on the retry. If a
  button stays disabled with no step text changing for more than three
  minutes, reload the seed URL rather than waiting for the deadline.
- Everything else: reload the seed URL and continue from the finished launch.

Two things the seeded launch shows on purpose. The reel is rendered but not
approved, so gate three is yours to press on stage. Run history carries two
errored runs from the drive that made the seed (a site probe that timed out
before the DOM fallback existed, and the image-briefs call that stalled);
both were retried and succeeded, and the history keeps the record.

## Why the App Builder's Deploy tab is read-only

The app id is `rocketride_sb.launchkit`. The extension is signed in with the
`.env` key, which belongs to the `rocketride_ai` developer namespace, while
`.env.deploy` carries the `rocketride_sb` key that owns the app. Every deploy
so far went through `node tools/deploy-app.mjs`, which reads both files and
deploys as `rocketride_sb`. That path still works and does not need the
builder; renaming the app id would move the store, the pipe ids and the
billing app id, and is not worth doing for a demo.
