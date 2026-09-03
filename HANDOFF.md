# LAUNCH KIT — Full Project Handoff / Context File

> Give this file to a fresh Claude Code session. It contains everything decided,
> built, and tested as of 2026-08-11. Working directory:
> `/Users/shashidharbabu/rocketride-apps-gtm/` (app lives in `launchkit/`).
> Secrets are NOT in this file — they are in `launchkit/.env` (gitignored).

---

## 1. What this product is

**Launch Kit = GTM-in-a-box for RocketRide App Store publishers.** A builder
ships an app to the store; Launch Kit reads their repo + live site, builds an
app profile, recommends pricing, rewrites the store listing, ranks the venues
where THIS app should launch, writes platform-native posts, finds people
publicly asking for the app right now, and assembles an exportable launch plan
with per-venue tracked links → attribution ("r/reactjs got you 3 subscribers").

**Non-negotiables (product law, from `launchkit-readme.md`):**
1. Assisted, never autonomous — 3 human gates, nothing auto-publishes in v1.
2. No network/connection-graph scraping (ToS + privacy).
3. No "same-day subscribers" promise — deliver "launch-ready today".
4. Quality over volume — 5 right venues beat 50.

**Key strategy decisions made:**
- tryclean.ai: NOT core infra (it's B2B-CRM GTM; our users are indie devs).
  Possible v2 integration for B2B apps only.
- Mechanisms in scope: builder's OWN network (consented) + PUBLIC intent
  signals. Cold prospecting explicitly OUT.
- Store handles pricing/checkout/subscriptions → we built a MOCK store API
  (also serves as the integration spec for the real store team).
- Demo video: script/storyboard in v1; GMI-generated video in v1.5 (user has
  GMI key; PromptReel standalone app will own generation later).
- v1.5 publishing path = n8n (`tool_n8n` exists in catalog) — not built yet.

**Planning docs at repo root (read for full rationale):**
`launchkit-readme.md` (original spec) · `launchkit-engineering-brief.md` ·
`launchkit-features-brainstorm.md` (27 features, F1–F27) ·
`launchkit-launch-channels.md` (market research) · `launchkit-v1-pipeline-plan.md`.

---

## 2. Architecture (all built and working)

```
Next.js 16.3 (frontend/, port 3200) ──► FastAPI (backend/app/, port 8090)
        review-and-approve workspace         state · jobs · 3 gates · attribution
                                              │  rocketride SDK (python, chat())
                                     RocketRide CLOUD pipelines (6 .pipe files)
                                              │
                                     SQLite launchkit.db (swap via LAUNCHKIT_DATABASE_URL)
```

- All AI work is RocketRide pipelines invoked via `client.chat()` with
  `Question(expectJson=True)`; parameterized by question payload
  (`TASK:` / `ASSET_TYPE:` / `APP_PROFILE:` / `BUILDER_FEEDBACK:` etc).
- Pipeline runs take minutes → backend runs them as asyncio background jobs;
  UI polls `/jobs/{id}`.
- Gates enforced server-side: Gate 1 (profile approve) 409-blocks all
  downstream stages; Gate 2 per-asset approve; Gate 3 target selection.
- Deterministic quality gates in code (never trust model discipline):
  `rr.gate_signals` (thread-URL + own-content filter), `rr.gate_asset`
  (length/convention checks), plus the signals re-scorer (below).

## 3. The seven pipelines (`launchkit/pipelines/*.pipe`) — all tested on cloud

Common shape: `chat → agent_rocketride → response_answers`, with
`llm_openai_api` + `memory_internal` + tools attached via `control` arrays.

| Pipe | Purpose | Tools on agent |
|---|---|---|
| lk_understand | repo+site → app profile JSON (13 keys) | tool_github, tool_firecrawl |
| lk_brand | TASK=dna (site → Business DNA, Pomelli-style; evidence-only colors/fonts) / TASK=campaigns (DNA → 4-6 campaign concepts) — added 2026-08-27; results stored as CommercialResult kinds brand_dna / brand_campaigns; DNA auto-feeds lk_assets | tool_firecrawl |
| lk_commercial | TASK=pricing (scrape competitor pricing → tiers) / TASK=listing | tool_exa_search, tool_firecrawl |
| lk_targets | ranked venues; consumes CURATED_VENUES pool, discovers extras | tool_exa_search, tool_firecrawl |
| lk_assets | ASSET_TYPE=x_post/linkedin_post/reddit_post/producthunt/show_hn/newsletter_pitch/video_script | tool_firecrawl |
| lk_signals | intent-signal finder (Exa + HN Algolia via tool_http_request, GET-only whitelist) | tool_exa_search, tool_http_request |
| lk_rescore | LLM-only relevance judge (no agent) for signal 2nd pass | — |

### ⚠️ CRITICAL platform gotchas (hard-won — do not rediscover)
1. **Agent LLM MUST be `llm_openai_api` profile `custom` → GMI Cloud**
   (`base_url: https://api.gmi-serving.com/v1`, model
   `Qwen/Qwen3-235B-A22B-Instruct-2507-FP8`). The cloud engine's
   agent→`llm_anthropic` bridge CRASHES (`'list' object has no attribute
   'strip'` in ai/common/util.py — LangChain returns Claude content as block
   lists; engine bug, should be reported to engine team). `llm_anthropic`
   works fine in direct-lane (non-agent) use. Native `llm_gmi_cloud` node
   profiles 404 against GMI's current model ids.
2. **`use_existing=True` reuses a RUNNING pipeline with its OLD config.**
   All harnesses/backend terminate-then-start or restart explicitly
   (`/admin/restart-pipe/{pipe_name}` endpoint) after editing a .pipe.
3. **No cron source node** — recurrence needs external scheduler → webhook.
4. Models sometimes emit Python-dict JSON → `parse_json_loose()` handles it.
5. RocketRide API keys: **prod key has `task.control` (can run pipelines);
   dev-team key CONNECTS but is DENIED task.control.** Both noted in .env
   comments. Cloud URI: `https://api.rocketride.ai`.
6. Long-idle backend: RocketRide client websocket dies → rr.get_client()
   health-checks/reconnects + ask() retries once on transport errors (fixed
   2026-08-07 after real-app test caught it).
7. GitHub PAT is fine-grained and CANNOT see `rocketride-ai` / `rocketride-org`
   private repos (404) → profiles for own apps run site-only. DECIDED
   2026-08-11: stick to public repos; do not pursue org PAT access.
8. **`tool_http_request` with MULTIPLE `urlWhitelist` entries breaks the whole
   agent** (cloud engine, found 2026-08-11): the agent starts with NO tools
   bound (returns in ~8s claiming "no access to external tools"). Fix: ONE
   whitelist entry using regex alternation —
   `^https://(hn\.algolia\.com|api\.github\.com/search|api\.stackexchange\.com)/`.
   Report to engine team.
9. **Agent-loop flakiness (cloud engine, ~1-in-3 long agent runs)**, two modes:
   (a) run dies at compile time with `LLM error: ... Failed to get valid JSON
   response after 4 attempts` (the loop JSON gets ```json-fenced/truncated on
   big answers); (b) the run AFTER an abnormal death starts with no tools
   bound (mode of gotcha 8's symptom, but transient). Mitigations in rr.py:
   `ask()` retries once on LLM error; `run_signals()` detects the no-tools
   signature (empty search_queries_used + empty signals) and retries after
   `restart_pipe()`; lk_signals OUTPUT rule demands a compact object. A clean
   restart reliably clears the poisoned state. Report (a) to engine team.
10. Reddit is unreachable without API creds: Exa site-scoped reddit queries
   return only product pages (never threads), and reddit's public
   `/search.json` returns 403 even from residential IPs. Reddit recall REQUIRES
   the OAuth API (ROCKETRIDE_REDDIT_CLIENT_ID/SECRET, still empty in .env).

## 4. Backend (`launchkit/backend/app/`)

- `main.py` — routes: projects CRUD · `/run/understand` (+feedback) ·
  `/run/asset` (MUST stay declared BEFORE generic `/run/{kind}` — route-order
  bug was found and fixed) · `/run/{pricing|listing|targets|signals}` ·
  profile edit/approve · assets edit/approve · targets select · signals status
  · `/plan?fmt=json|markdown` (with per-venue ref links) · `/attribution` ·
  `/jobs` · `/admin/restart-pipe` · CORS allows any localhost port.
- `rr.py` — shared client w/ reconnect; stage runners; parse_json_loose;
  gate_signals; gate_asset; `rescore_signals()` (fetches ACTUAL thread content
  — HN via Algolia items API, others plain GET — then lk_rescore judges;
  fetch-fail keeps signal marked `unverified`).
- `db.py` — SQLAlchemy models: Project, Profile (versioned, Gate1 status),
  Asset (versioned, Gate2), Target (Gate3 selected), Signal, CommercialResult,
  Venue (curated|discovered), StoreSignup, Job.
- `mockstore.py` — mock store router: listing, plans, POST /mockstore/events
  (signup+ref), signups rollup.
- `seed_venues.py` — seeds 37 curated venues from market research (idempotent).
- Attribution: deterministic ref code `lk_<kind>_<slug>` per selected target;
  plan carries `ref_url`s; `/attribution` joins store signups → venue names.
- Venue flywheel: targets runs receive curated pool AND write discovered
  venues back (first real run learned 13 new venues).

## 5. Frontend (`launchkit/frontend/`, Next 16.3 + Tailwind v4 + motion)

- Landing `/`: depth-layered z-parallax hero (3 planes, blurred far layer —
  `components/fx/parallax-hero.tsx`) + scroll-velocity skew wrapper
  (`components/fx/velocity-skew.tsx`, rAF lerp, max 2.4°, reduced-motion
  safe) + motion-primitives (TextEffect/AnimatedGroup/InView) + create form.
- Workspace `/p/[id]`: AnimatedBackground gliding tabs (Profile · Commercial ·
  Assets · Targets · Signals · Plan), TextShimmer during runs, run-history
  panel, error surfacing.
  - Profile tab = structured FORM view (editable cards: one-liner, ICP,
    differentiators, proof points, gaps, confidence meter; JSON view toggle;
    per-field edits save as new version; "Regenerate with notes…" sends
    BUILDER_FEEDBACK).
  - Assets: per-card Approve / Copy / "Regenerate…" with feedback box.
  - Targets: checkbox select (Gate 3) w/ rules + submission links.
  - Signals: reply queue w/ Copy reply / Mark replied / Dismiss.
  - Plan: tracked links per venue + Simulate signup (dev) + attribution table
    + markdown export.
- `lib/api.ts` — API client, default base `http://localhost:8090`.
- motion-primitives installed: text-effect, animated-group, in-view,
  text-shimmer, animated-background (animated-group.tsx was patched for
  motion@12 typing — `motion.create(as as any) as React.ElementType`).
- `playwright` is a devDependency; Playwright scripts must RUN FROM
  `frontend/` (ESM resolution). TextEffect splits text per-word → text=
  selectors fail on hero; anchor on plain elements.

## 6. Ports on THIS machine (critical — other apps are running!)

| Port | What |
|---|---|
| 8090 | Launch Kit backend (8000 = user's rocketride-podcasts — NEVER touch) |
| 3200 | Launch Kit frontend (3000 + 3100 = user's other Next apps — NEVER touch) |
Kill only by port: `kill $(lsof -ti:8090 -sTCP:LISTEN)`. Never broad pkill.
Start commands + identity checks: `launchkit/.claude/skills/run-launchkit/SKILL.md`.

## 7. Test status (everything below actually ran and passed)

- Pipeline regression `backend/test_all.py`: understand/commercial/targets/
  assets PASS; signals honest-empty WARN (by design — no fabrication).
- Per-stage harnesses: test_understand/commercial/targets/assets/signals.py
  (+ shared `lk_common.py`). Outputs in `backend/test_output/`.
- Full-stack e2e via API: project → understand → Gate1 → asset → Gate2 → plan.
- Browser drive (Playwright, screenshots inspected): landing, scroll FX,
  create project, REAL pipeline run from UI, Gate 1 approve, tabs. Zero
  console errors.
- Attribution loop: simulated signups → rollup 3/1/1 correctly joined.
- Re-scorer: rejected 5/5 keyword-adjacent imposters (twice, different apps).
- **Real-app onboarding (`backend/test_realapp.py`, dashboard.rocketride.ai,
  project id 8e062f88a675): ALL STAGES PASS** — understand 104s (repo 404 →
  graceful site-only, confidence 0.75, real scraped proof "16,988 downloads/
  30 days"), pricing Free/$29/$79, listing tagline, 20 targets, reddit+show_hn
  assets w/ correct conventions, signals 0-kept/5-rejected, plan ready,
  attribution smoke OK.
- **Signals recall v2 (2026-08-11)**: finder rebuilt — 4 search passes (pain
  phrasings from ICP_PAIN / community-scoped Exa / HN Algolia / GitHub open
  issues + StackOverflow APIs), budget 8→14 calls, include-when-unsure stance
  (re-scorer owns precision), REPLYABILITY rules + code-enforced HN 14-day
  lock check in `rescore_signals()` (Algolia created_at). Payload now carries
  ICP_PAIN + COMMUNITIES (backend derives subreddits from the project's ranked
  targets; falls back to rr.SIGNAL_FALLBACK_COMMUNITIES). Results:
  motion-primitives 0 → 4 found → 2 kept post-rescore (1 verified GitHub
  issue asking for exactly this, 1 unverified SO thread — SO fetch 403s);
  dashboard 5 found → honest 0 kept (3 locked HN, 2 judged off-target).
  Precision checks: judge rejected every imposter across all runs; lock check
  caught every stale HN thread. Test: `backend/test_signals.py [profile.json]`
  (optional arg = any profile; harness has NO retries by design — expect
  ~1-in-3 runs to need a rerun, see gotcha 9).

### Steps 1-2 hardening (2026-08-11) — create + understand/Gate 1

- **Repo is now OPTIONAL** (public repos only, per the 2026-08-11 decision).
  Site-only analysis is a first-class path: `rr.run_understand` tells the
  agent "NONE SUPPLIED", the pipe sets `analysis_degraded`, the UI banners it.
- **URL normalisation server-side** (`main._norm_url`): accepts what builders
  type (`github.com/me/app`, bare domains, trailing slashes/whitespace),
  422s malformed input and non-GitHub repo URLs BEFORE a 2-minute run burns.
- **Create auto-starts understand** (`ProjectIn.autorun`, default true) and
  returns `{job_id, duplicate_of}`. `create_project` is now `async def` —
  it MUST be: a sync endpoint runs in a threadpool where
  `asyncio.create_task` raises "no running event loop" (bug found in test).
- **`lk_understand` contract gained `sources_read[]`** (`source`/`via`/`ok`/
  `note`, failures included with ok=false) **and `analysis_degraded`**. Gate 1
  is a review step; without the evidence trail the builder approves claims
  they cannot check. UI renders it as a Sources read card.
- **In-flight runs survive navigation/reload** — the workspace polls any
  queued/running job on mount. Consequence handled: startup now marks
  queued/running jobs from a dead process as errored, or the UI would poll a
  zombie job forever.
- Also: elapsed-time + staged progress readout during runs, approve button
  disabled (not hidden) while edits are unsaved, duplicate-site warning on the
  create form, inline 422s instead of `alert()`.
- Verified live: repo+site run 40s conf 0.92 with 5 sources (incl. a 404
  /pricing correctly ok=false); site-only run 70s conf 0.85 `degraded=true`.

## 8. Known weaknesses / next steps (in priority order)

1. **Signals recall via Reddit API** — the finder rework (done 2026-08-11, see
   §7) lifted recall on HN/GitHub/SO, but Reddit — the biggest pool of "is
   there a tool that…" asks — is fully blocked without OAuth creds (gotcha
   10). USER ACTION: create reddit app creds → fill
   ROCKETRIDE_REDDIT_CLIENT_ID/SECRET in .env. Then: best design is a
   backend-side Reddit search in rr.py (token refresh is awkward inside
   tool_http_request) injected into the finder payload as CANDIDATE_THREADS.
   Minor: finder sometimes stops at ~5 of its 14-call budget — consider a
   harder floor if recall matters more later.
2. Real store integration — swap `mockstore.py` calls for the store API
   (contract already defined by the mock). (GitHub PAT org access DROPPED
   2026-08-11 — public repos only.)
3. v1.5 queued publishing via n8n (`tool_n8n`), per-platform OAuth + final
   confirm. All ToS risk lives here — needs its own design pass.
4. Video generation v1.5 (confirmed next phase 2026-08-11): GMI video API via
   tool_http_request (async job polling spike needed), or delegate to
   PromptReel app when it exists.
5. Polish: launch-day comment coach (F23), venue DB admin UI, multi-user auth
   (match store auth), Postgres/Supabase swap for prod.
6. Report to engine team: agent→llm_anthropic bridge crash (gotcha 1),
   multi-entry urlWhitelist kills tools (gotcha 8), agent-loop JSON death on
   long runs (gotcha 9a).

## 9. How to run (quick)

```bash
cd /Users/shashidharbabu/rocketride-apps-gtm/launchkit
kill $(lsof -ti:8090 -sTCP:LISTEN) 2>/dev/null
(.venv/bin/uvicorn app.main:app --app-dir backend --port 8090 >/tmp/lk-api.log 2>&1 &)
cd frontend && (npm run dev -- -p 3200 >/tmp/lk-web.log 2>&1 &)
# verify: GET :8090/openapi.json title == "Launch Kit API"; :3200 contains "Launch Kit"
# tests: .venv/bin/python backend/check.py · backend/test_all.py · backend/test_realapp.py
```

`.env` (in launchkit/, gitignored) holds: ROCKETRIDE_URI/APIKEY (cloud, prod
key), FIRECRAWL, EXA, ANTHROPIC (direct-lane only), GMI (agent LLM + future
video), GITHUB_TOKEN, empty REDDIT placeholders. `env.example` documents them.

## 10. Existing demo projects in launchkit.db

- "MP Live Demo" — motion-primitives, full flow incl. attribution demo data.
- "RocketRide Dashboard" (8e062f88a675) — real-app run, complete launch
  package: approved profile, pricing, 20 targets (3 selected), 2 approved
  assets, plan ready.
