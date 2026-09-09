# Local development, and promoting to staging

The loop is: **run the app on your machine, run the pipelines on staging.** There is no
local engine and there does not need to be. The app is the thing you iterate on; the
pipelines are the thing you call.

## Why the pipelines stay remote

A `.pipe` executes on a RocketRide server, never in your browser. So a pipeline can never
reach a database or service on your laptop, and a local engine would not speed anything up:
a stage takes two to seven minutes because it is waiting on Claude, Firecrawl and Exa, not
because of platform overhead. Running the engine locally was attempted and is blocked
anyway (the Docker image has no arm64 manifest, and the native binary's JRE was never
staged).

The identity is already aligned. `apps/launchkit/preview/env.generated.ts` carries the same
`rocketride_sb` key as `.env.deploy`, so **a pipeline you run locally executes in the same
org, against the same data, as the deployed app.** `tools/gen-preview-env.mjs` overlays
`.env.deploy` over `.env` when it regenerates, which is what keeps that true. Never trust
`.env` alone: the RocketRide extension rewrites it back to a dead org's key.

## Working locally

```bash
cd apps/launchkit
npx rsbuild dev -c rsbuild.preview.mts     # http://localhost:3400
```

Edit anything under `apps/launchkit/src` and the page hot-reloads. Pipeline calls go to
staging exactly as they do in production.

Two rules that are easy to get wrong:

- **Run `node tools/gen-styles.mjs` after any className change.** Tailwind classes are
  compiled ahead of time into `src/styles.generated.ts`. Neither `tsc` nor the bundler can
  tell you a utility is missing; the element simply renders unstyled. `deploy-app.mjs` runs
  it for you, but the dev server does not.
- **Never open a second session on the preview's key while a drive is running.** Staging
  drops the first one, and every pipeline action fails instantly with "Server is not
  connected". In practice: do not open the app in your own browser while a
  `launchkit-src/frontend/drive.*.mjs` script is in flight.

Real pipeline runs are slow, so for pure UI work seed the app state instead of running
stages: the checkpoints in `docs/visual-baseline/flow-appstate-*.json` load into
`localStorage['lk-preview-appstate']` and give you a launch with finished stages.

## Changing a pipeline

`.pipe` sources live in `launchkit-src/pipelines/`. After editing:

```bash
node tools/gen-pipes.mjs      # writes pipelines/ and apps/launchkit/pipelines/
```

A running task keeps its old config, so the app will reuse the previous version. Force a
fresh task by rotating that pipe's id in `tools/pipe-ids.json` and re-running `gen-pipes`.
Rotating is safer than terminating, which needs a second session on the preview's key.

Never rotate `lk_store`'s id.

## Promoting to staging

When a change is ready, and only then:

```bash
node tools/deploy-app.mjs "v28: what changed"     # runs gen-styles + sync-ds, packs, builds
# bump the version literal in tools/publish-team.mjs and tools/publish-me.mjs
node tools/publish-team.mjs
node tools/publish-me.mjs
node tools/check-bindings.mjs                      # confirm every rung moved
```

`deploy-app.mjs` reports only the phase that failed. When a build fails, read the server's
real output:

```bash
node tools/build-log.mjs <version>
```

A healthy pack is **141 files**. If it is 106, the design-system mirror
(`apps/launchkit/src/ds`) was not committed and the server build will fail to resolve every
`@launchkit/design-system` import. See MIGRATION-ISSUES-LOG K8.

## What local cannot test

- **The shell's sidebar column and chrome.** The preview stub imitates it, but the real
  shell renders parts of the app outside `#lk-root`. Layout regressions there only appear
  in the deployed app.
- **A signed-in identity.** The preview authenticates with an API key. Anything that needs
  the signed-in user, including the cloud SQL store, cannot be exercised locally. That store
  is dead everywhere right now regardless (platform issue 2203).

## The Assets stage needs one more process: the studio forge

The Assets stage (after Social Launch) reads the live site, renders launch
cards and renders the reel. Those need a browser and ffmpeg, which the
pipeline runtime does not have, so they run in a small local service:

```bash
cd services/studio-forge && npm install      # once; reuses the drives' Playwright Chromium
npm start                                    # http://127.0.0.1:3500, keep it running
```

The app finds it at `http://localhost:3500` by default (Settings shows a
health check and lets you change the address). The reel script itself is
written by `lk_studio.pipe` on the RocketRide server like every other stage;
only the rendering is local. Outputs land in `services/studio-forge/out/`
(gitignored) and are served back to the app at `/files/...`.

Smoke test without the app: `node smoke.mjs https://your-site --reel` in the
forge directory. Full flow through the UI: `node drive.studio.mjs` in
`launchkit-src/frontend` with the preview on :3400 and the forge on :3500.
Design and the asset brainstorm: `docs/ASSETS-STAGE.md`.
