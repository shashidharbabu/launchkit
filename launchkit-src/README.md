# Launch Kit

GTM-in-a-box for RocketRide App Store publishers: you built the app, Launch Kit
gets it users. It reads your repo + live site, builds an app profile,
recommends pricing, rewrites your store listing, ranks the venues where THIS
app should launch, writes platform-native posts, finds people publicly asking
for your app right now, and assembles a launch plan with per-venue tracked
links so you can see which venue produced which subscribers.

**Product law:** assisted, never autonomous. Three human gates; nothing
auto-publishes. Quality over volume — 5 right venues beat 50. No
network-graph scraping; public intent signals only.

See `../launchkit-readme.md` (original spec) and
`../launchkit-v1-pipeline-plan.md` (feature → pipeline map) for rationale.
`../HANDOFF.md` is the living session-to-session state doc.

## The builder's flow (what a user actually does)

1. **Create** — app name + live site URL; the GitHub repo is **optional**
   (public repos only — site-only analysis is a supported path). URLs are
   normalised server-side (`myapp.com` → `https://myapp.com`) and rejected up
   front if malformed, and the form warns if you already have a project for
   that site. Creating the project **starts the analysis immediately** and
   drops you in the workspace watching it run.
2. **Profile (Gate 1)** — the run reads your site (and repo) and drafts an app
   profile (one-liner, ICP, differentiators, proof points, gaps, confidence).
   While it runs you get a staged progress readout with an elapsed counter;
   leaving and returning (or reloading) picks the run back up. The profile
   shows **Sources read** — every file and URL the agent actually fetched,
   ✓/✕ — so Gate 1 is a review of evidence, not of assertions. If the repo or
   site couldn't be read, a "partial analysis" banner says so. Edit any field,
   or "Regenerate with notes…". **Approving it unlocks everything else** —
   until then all downstream stages 409.
3. **Commercial** — pricing tiers (scraped competitor pricing) + a rewritten
   store listing.
4. **Assets (Gate 2)** — platform-native launch posts (reddit, Show HN,
   Product Hunt, X, LinkedIn, newsletter pitch, video script). Approve / copy /
   regenerate-with-feedback per asset.
5. **Targets (Gate 3)** — ranked launch venues for this specific app, with
   rules and submission links. Tick the ones you'll actually use.
6. **Signals** — a reply queue of people *publicly asking right now* for what
   the app does (HN, GitHub issues, StackOverflow; Reddit needs API creds —
   next iteration). Each has a drafted honest reply; copy, mark replied, or
   dismiss. Every candidate is verified against the actual thread content and
   dropped if off-target or locked (unanswerable).
7. **Plan** — the exportable launch plan: selected venues, approved assets,
   and a tracked link per venue (`?ref=lk_<kind>_<slug>`). Post with those
   links; store signups carrying the ref appear in the attribution table:
   *"OSSInsight → 3 signups."*

## Structure

```
launchkit/
├── pipelines/                # 7 RocketRide cloud pipelines (.pipe JSON)
│   ├── lk_understand.pipe    # repo + site → app profile JSON incl. sources_read evidence trail (tool_github, tool_firecrawl)
│   ├── lk_brand.pipe         # TASK=dna (site → Business DNA) | TASK=campaigns (DNA → campaign concepts) (tool_firecrawl)
│   ├── lk_commercial.pipe    # TASK=pricing | TASK=listing (tool_exa_search, tool_firecrawl)
│   ├── lk_targets.pipe       # ranked venues; consumes CURATED_VENUES, discovers more
│   ├── lk_assets.pipe        # ASSET_TYPE=x_post|linkedin_post|reddit_post|producthunt|show_hn|newsletter_pitch|video_script
│   ├── lk_signals.pipe       # intent-signal finder: 4 search passes (Exa, HN Algolia, GitHub issues, StackOverflow)
│   └── lk_rescore.pipe       # LLM-only relevance judge (signals 2nd pass, no agent)
├── backend/
│   ├── app/                  # FastAPI service (port 8090)
│   │   ├── main.py           # projects CRUD · /run/* stages · 3 gates · plan · attribution · jobs · /admin/restart-pipe
│   │   ├── rr.py             # shared RocketRide client (reconnect + retries), stage runners,
│   │   │                     #   parse_json_loose, gate_signals/gate_asset, re-scorer + HN lock check
│   │   ├── db.py             # SQLAlchemy models → SQLite launchkit.db (LAUNCHKIT_DATABASE_URL to swap)
│   │   └── mockstore.py      # mock store API — doubles as the real store integration spec
│   ├── seed_venues.py        # seeds 37 curated venues from market research (idempotent)
│   ├── lk_common.py          # test harness: fresh-restart runner, loose JSON parse, signal gate
│   ├── check.py              # env + pipe validation + server connectivity
│   ├── test_all.py           # full pipeline regression (~8 min)
│   ├── test_understand/commercial/targets/assets/signals.py   # per-stage e2e
│   ├── test_realapp.py       # full-flow onboarding of a real app via the API
│   └── test_output/          # saved run artifacts (gitignored)
├── frontend/                 # Next.js 16 + Tailwind v4 + motion-primitives (port 3200)
├── .env                      # secrets (gitignored; see env.example)
└── .venv/                    # python 3.14 + rocketride SDK
```

## Running the app

Ports on this machine: **8090** backend, **3200** frontend (8000, 3000, 3100
belong to other apps — never kill those; kill only by port:
`kill $(lsof -ti:8090 -sTCP:LISTEN)`).

```bash
cd launchkit
.venv/bin/uvicorn app.main:app --app-dir backend --port 8090
# in another shell
cd frontend && npm run dev -- -p 3200
```

Open http://localhost:3200 — landing page (z-parallax hero + scroll-velocity
skew) → create a project → workspace tabs (Profile · Commercial · Assets ·
Targets · Signals · Plan). Pipeline runs are asyncio background jobs polled by
the UI; gates are enforced server-side. See
`.claude/skills/run-launchkit/SKILL.md` for identity checks and the Playwright
driving recipe.

## Running pipeline tests

```bash
cd launchkit
.venv/bin/python backend/check.py                 # verify setup + validate all pipes
.venv/bin/python backend/test_all.py              # full regression, dependency order
.venv/bin/python backend/test_understand.py       # default: motion-primitives; or <repo_url> <site_url>
.venv/bin/python backend/test_commercial.py both
.venv/bin/python backend/test_targets.py
.venv/bin/python backend/test_assets.py
.venv/bin/python backend/test_signals.py          # optional arg: path to a profile JSON
.venv/bin/python backend/test_realapp.py          # full flow vs a real app via the API
```

All invocations are `client.chat()` with a parameterized question payload
(`TASK:` / `ASSET_TYPE:` / `APP_PROFILE:` / `ICP_PAIN:` / `COMMUNITIES:`).
Downstream tests read the latest `profile_*.json` from `test_output/`, so run
understand first. Harnesses have NO retries by design (flakiness stays
visible); the backend does retry — see gotchas below.

## Deterministic quality gates (design principle)

Agents produce candidates; code enforces contracts — model discipline alone
proved insufficient. The layers on the signals queue:

1. **`gate_signals`** — drops non-thread URLs (repo homepages, articles) and
   the app's own content.
2. **Re-scorer** (2nd pass) — the backend fetches each candidate thread's
   ACTUAL content (HN via Algolia items API, others via GET) and
   `lk_rescore.pipe` judges whether replying with this app genuinely helps
   that author. Verified live repeatedly: rejects keyword-adjacent imposters.
   Fetch failures keep the signal marked `unverified` rather than silently
   emptying the queue.
3. **Replyability check (code, 2026-08-11)** — HN threads lock ~14 days after
   posting; the re-scorer rejects older HN items using Algolia's `created_at`.
   A reply queue of locked threads is fake value.

**Signals recall v2 (2026-08-11):** the finder runs 4 search passes — pain
phrasings mined from `icp.pain` (direct asks / problem statements /
alternative-seeking), community-scoped Exa passes over subreddits taken from
the project's own ranked targets, HN Algolia, and GitHub open issues +
StackOverflow APIs — with a 14-call budget and an include-when-unsure stance
(the re-scorer owns precision). Result: honest queues with real prospects
where they exist, honest-empty where they don't. Reddit itself is unreachable
without OAuth creds (Exa returns only product pages; public JSON 403s) —
`ROCKETRIDE_REDDIT_CLIENT_ID/SECRET` in `.env` are reserved for that.

## Close-the-loop layer

- **Venue knowledge base** — `venues` table seeded with 37 curated venues
  (`backend/seed_venues.py`). Targets runs receive the curated pool AND write
  discovered venues back (`source=discovered`) — cross-app learning.
- **Mock Store API** (`/mockstore/*`) — listing, plans, signup events with ref
  codes, rollup by ref. The router doubles as the integration spec for the
  real store team; swapping = repointing these calls.
- **Attribution** — deterministic ref code per selected target
  (`lk_<kind>_<slug>`); plan carries per-venue tracked links;
  `GET /projects/{id}/attribution` joins store signups back to venue names.
  Plan tab includes a dev-only "Simulate signup".

## Review-quality layer

- **Profile form view** — Gate 1 is structured editable cards (JSON view as a
  toggle); per-field edits save as a new draft version.
- **Regenerate with notes** — profile and every asset accept builder feedback
  (`feedback` → `BUILDER_FEEDBACK` in the agent prompt).
- **Run history panel** — per-project job log, auto-refreshing.

## Prerequisites

Runs against **RocketRide cloud** (`https://api.rocketride.ai`) — `.env` holds
the cloud prod API key (the dev-team key connects but is DENIED task.control)
plus FireCrawl, Exa, GMI, Anthropic (direct-lane only), GitHub keys.

### Agent LLM: known-good stack

Agents use `llm_openai_api` (profile `custom`) → GMI Cloud:
`base_url: https://api.gmi-serving.com/v1`, model
`Qwen/Qwen3-235B-A22B-Instruct-2507-FP8`. **Do not switch agent LLMs to
`llm_anthropic`** — the cloud engine's agent→Anthropic bridge crashes
(`'list' object has no attribute 'strip'`; engine bug). `llm_anthropic` is
fine in direct-lane (non-agent) use. Native `llm_gmi_cloud` profiles 404
against GMI's current model ids.

### Platform gotchas (hard-won — full list in ../HANDOFF.md §3)

- `use_existing=True` reuses a RUNNING pipeline with its OLD config — always
  terminate + restart after editing a .pipe (`/admin/restart-pipe/{pipe}`).
- `tool_http_request` with MULTIPLE `urlWhitelist` entries silently detaches
  ALL agent tools — use ONE entry with regex alternation.
- Long agent runs die ~1-in-3 with an engine-side `LLM error … Failed to get
  valid JSON response`; the run after an abnormal death may start with no
  tools bound. Backend mitigations in `rr.py`: `ask()` retries once on LLM
  error; `run_signals()` detects the no-tools signature (empty
  `search_queries_used`) and retries after a forced pipe restart.
- Models sometimes emit Python-dict JSON → `parse_json_loose()`.
