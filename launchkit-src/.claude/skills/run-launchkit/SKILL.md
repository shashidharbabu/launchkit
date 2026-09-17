---
name: run-launchkit
description: Launch and drive the Launch Kit app on this machine. Use when asked to run, start, restart, screenshot, or smoke-test Launch Kit. Encodes the current architecture (browser-only app at apps/launchkit on port 3400, plus the studio-forge Node service on 3500), the port map, and the Playwright driving recipe.
---

# Run Launch Kit

Verified 2026-09-16. There is **no FastAPI backend and no Next.js frontend**. An
earlier version of this skill described a `launchkit/backend` on 8090 and a
Next dev server on 3200; that stack is retired. If you find yourself starting
uvicorn for this app, you are following the old skill.

## What the app actually is

Launch Kit is a **browser-only React app** at `apps/launchkit`, built with
rsbuild. It has no server of its own. Pipelines run by calling the RocketRide
connection straight from the browser:

    api.ts (facade) -> runner.ts ask(pipe, question) -> RocketRide connection

All application state lives in a blobstore backed by `localStorage` under the
key `lk-preview-appstate`. There is no database to start.

One real service exists, and it is optional: **studio-forge**, a small Node
service at `services/studio-forge` that renders brand probes, cards, voice and
reels for the Assets stage.

## Port map for THIS machine, do not deviate

| Port | Owner | Action |
|---|---|---|
| 8000 | rocketride-podcasts API (another app) | NEVER kill |
| 3000 | another next-server | NEVER kill |
| 3100 | RocketRide docs site | NEVER kill |
| **3400** | Launch Kit preview | ours |
| **3500** | studio-forge | ours |

Kill only by port and listener: `kill $(lsof -ti:3400 -sTCP:LISTEN)`.
Never `pkill -f node`, it matches the other apps.

## Start

```bash
# the app (from the repo root)
cd apps/launchkit
kill $(lsof -ti:3400 -sTCP:LISTEN) 2>/dev/null
nohup npx rsbuild dev -c rsbuild.preview.mts > /tmp/lk-preview.log 2>&1 &

# studio-forge, only needed for the Assets stage
cd services/studio-forge
kill $(lsof -ti:3500 -sTCP:LISTEN) 2>/dev/null
nohup npm start > /tmp/lk-forge.log 2>&1 &
```

Identity-check both rather than trusting that a port answers:

```bash
python3 -c "
import urllib.request,json
h=urllib.request.urlopen('http://localhost:3400',timeout=5).read().decode()
assert 'lk-root' in h, 'port 3400 is not Launch Kit'
print('preview OK')
print('forge:', json.load(urllib.request.urlopen('http://127.0.0.1:3500/health',timeout=5))['service'])
"
# -> preview OK / forge: studio-forge
```

## Secrets

- The RocketRide connection comes from the workspace `.env`
  (`ROCKETRIDE_URI` / `ROCKETRIDE_APIKEY`). Never run lifecycle verbs against
  the dev pair.
- The OpenAI key lives **only** in `services/studio-forge/.env` and must never
  reach the browser bundle. `apps/launchkit/preview/env.generated.ts` is
  generated and must never be committed.

## Drive (headless browser)

`playwright` is a devDependency of `launchkit-src/frontend` with cached
Chromium. Scripts must run **from that folder** or ESM resolution fails.

```bash
cd launchkit-src/frontend
SLUG=cal-com STAGE="Social Launch" BUTTONS="Draft for X;Draft for LinkedIn" node drive.rerun.mjs
```

Useful drives already written: `drive.full.mjs` (a whole launch end to end),
`drive.rerun.mjs` (re-press named buttons for one saved app),
`drive.studio.mjs`, `drive.signals-fix.mjs`, `drive.shots.mjs`.
`eval-extract.py` turns saved stores into the evaluation matrix.

Driving gotchas, learned the hard way:

- The app root is `#lk-root`. Stage links are
  `#lk-root nav[aria-label="Stages"] a:visible`.
- A platform that already has a draft shows **Redraft**, not "Draft for". The
  fallback selector is `button[aria-label="Redraft the <Platform> post"]`.
- Buttons stay **disabled** while any run is in flight, and the disabled state
  outlives the loading shimmer. Wait for enabled, not for the shimmer, or the
  next click races the last run and can lose a whole app's drafts.
- `drive.rerun.mjs` seeds from `appstate.rerun.json` by default and **saves
  over it**. Back that file up before a run you care about. `SEED=original`
  forces the first-run store instead.
- Run one lane at a time. Three concurrent lanes degraded the pipeline enough
  that buttons stayed disabled past budget.
- Screenshot and actually look at it. A selector pass with a broken layout has
  happened.

## studio-forge API

Async jobs. `POST /probe | /images | /voice | /kit | /reel` returns 202 with
`{job_id, kind, status, files}`. That envelope is **not** the result: poll
`GET /jobs/:id` for `{status, result}`. Reading the envelope as the result once
produced a false "regression" report. Also `GET /health`, `GET /concepts`,
`GET /files/<project>/<job>/<file>`.

## Tests (no UI)

```bash
cd apps/launchkit && npx tsc --noEmit        # typecheck
```

TypeScript smoke tests bundle with esbuild:
`--bundle --platform=node --format=esm --loader:.pipe=text`.
