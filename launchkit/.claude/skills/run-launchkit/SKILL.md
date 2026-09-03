---
name: run-launchkit
description: Launch and drive the Launch Kit app (FastAPI backend + Next.js frontend) on this machine. Use when asked to run, start, restart, screenshot, or smoke-test Launch Kit. Encodes the port map (8090/3200 — 8000, 3000, 3100 are OWNED BY OTHER APPS), the venv paths, and the Playwright driving recipe.
---

# Run Launch Kit

Two processes: FastAPI backend (pipeline orchestration) + Next.js frontend.
Everything runs from `launchkit/` at the repo root.

## Port map for THIS machine — do not deviate

| Port | Owner | Action |
|---|---|---|
| 8000 | **rocketride-podcasts API** (user's other app) | NEVER kill |
| 3000 | another next-server (v16.2.10) | NEVER kill |
| 3100 | RocketRide docs site (next 14) | NEVER kill |
| **8090** | Launch Kit backend | ours |
| **3200** | Launch Kit frontend | ours |

Kill only by port + listener: `kill $(lsof -ti:8090 -sTCP:LISTEN)`.
NEVER `pkill -f uvicorn` / `pkill -f next` — they match the other apps.

## Start

```bash
cd launchkit
# backend (its venv already has fastapi/uvicorn/sqlalchemy/rocketride)
kill $(lsof -ti:8090 -sTCP:LISTEN) 2>/dev/null
(.venv/bin/uvicorn app.main:app --app-dir backend --port 8090 >/tmp/lk-api.log 2>&1 &)

# frontend
cd frontend
kill $(lsof -ti:3200 -sTCP:LISTEN) 2>/dev/null
(npm run dev -- -p 3200 >/tmp/lk-web.log 2>&1 &)
```

Wait + IDENTITY-CHECK both (ports get reused on this machine — always verify
you're talking to Launch Kit, not just that the port answers):

```bash
python3 -c "import urllib.request,json;print(json.load(urllib.request.urlopen('http://localhost:8090/openapi.json'))['info']['title'])"
# → must print: Launch Kit API
python3 -c "import urllib.request;html=urllib.request.urlopen('http://localhost:3200').read().decode();assert 'Launch Kit' in html;print('frontend OK')"
```

Backend needs `launchkit/.env` (RocketRide cloud URI + prod apikey + tool
keys). If pipelines error with "Permission 'task.control' denied", the key in
.env is the dev-team key — use the prod one (see .env comments).

## Drive (headless browser)

`playwright` is a devDependency of `frontend/` with cached Chromium.
Scripts must run **from `frontend/`** (ESM resolution) — copy the script in,
run, delete:

```bash
cd frontend && cp /path/to/drive.mjs drive.tmp.mjs && node drive.tmp.mjs; rm -f drive.tmp.mjs
```

Driving gotchas (learned the hard way):
- Hero headline is `TextEffect` — text split into per-word spans, so
  `text=Full sentence` selectors FAIL on it. Anchor on plain elements:
  `a[href="#how"]`, `input[placeholder="App name"]`, `form button`.
- Workspace tab buttons carry `data-id` (`button[data-id="Targets"]`).
- "Run understand" fires a real cloud pipeline — allow 150s for
  `button:has-text("Approve profile (Gate 1)")` to appear.
- After approval assert `text=Gate 1 passed`.
- Screenshot and LOOK at it — selector-pass with broken layout has happened.

## Pipeline tests (no UI)

```bash
cd launchkit
.venv/bin/python backend/check.py      # env + pipes + server connectivity
.venv/bin/python backend/test_all.py   # full regression, ~8 min, runs real pipelines
```
