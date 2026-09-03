# Launch Kit — Phase-0 Binding Inventory (Track B2, standalone)

Per `app-development-docs/02-app-structure.md` Phase 0. Every binding that must move,
found by inspecting `launchkit/` (frontend, backend, pipelines). Written 2026-08-29.

**Classification: Category 1 / Track B2 — standalone.** Own repo folder, own FastAPI
backend (port 8090: state, jobs, gates, attribution, SQLite), own Next.js 16 frontend
(port 3200: own router, next/font, next-themes), no shell-ui anywhere. Path:
01 → 02 (B2) → 03 all phases → ~~04~~ (no custom nodes needed — see below) → 05 → 06.

---

## 1. Shell/API bindings

| Today | Where | Target |
|---|---|---|
| Next.js App Router: `/` (marketing), `/dashboard`, `/launches/new`, `/runs`, `/settings`, `/p/[id]/[stage]` (7 stages) | `frontend/app/**` | One `app:` mount; state-flag navigation (view enum + project id + stage in component state, persisted via `useWorkspace()` appState). Marketing `/` page **does not port** — the store listing (README + screenshots) replaces it |
| REST client, hardcoded `http://localhost:8090` | `frontend/lib/api.ts` | Deleted. Pipeline seam: `client.use({pipeline})` once/session → `send`/`chat`; store reads/writes via `client.tool` execute on the SQL node |
| FastAPI app: projects CRUD, `/run/*`, gates (409 enforcement), assets/targets/signals mutations, `/plan`, `/attribution`, `/jobs`, `/admin/restart-pipe`, CORS | `backend/app/main.py` | Dissolves: orchestration + gate rules → app-side TS against the store; pipe runs → pipeline seam; `/jobs` → platform task status + a `runs` table; admin restart → not needed (deployed pipes) |
| No auth (single-user dev) | everywhere | `authenticated: true` in manifest; `useAuthUser()`; every gate signature stamped with the real user (doc 03 §5) |
| Long-poll `GET /jobs/{id}` from UI | `project-provider.tsx`, `lib/jobs.ts` | `useShellEvent('shell:event', …)` push + task status polling via the shell client |

## 2. Configuration → config-as-data

| Hardcoded today | Where | Target |
|---|---|---|
| 37 curated venues (seed list) | `backend/seed_venues.py` | Seed rows in the app store + Settings editor (add/disable venues). Litmus: another org adopts without code change |
| `SIGNAL_FALLBACK_COMMUNITIES` | `backend/app/rr.py` | Settings row (list), seeded with current values |
| `ASSET_LIMITS`, HN 14-day lock window, signal budget knobs | `rr.py` | Settings rows with current values as defaults |
| Asset types list (7) | pipes + UI + evals | Stays code (product vocabulary, not org vocabulary) — but pipe instructions live in the generator |
| Ports 8090/3200, localhost URLs | scripts, api.ts | Gone with the backend |

## 3. State/storage

| Today | Target |
|---|---|
| SQLite `launchkit.db` via SQLAlchemy — 8 tables: Project, Profile (versioned, Gate 1), Asset (versioned, Gate 2), Target (Gate 3), Signal, CommercialResult, Venue, StoreSignup, Job | `rocketride_sql` node (**default variant**); `db_postgres` as generator-emitted **external fallback** variant (doc 05 §2). Same node id across variants |
| `Job` rows (asyncio job tracking) | Replaced by platform task lifecycle + a slim `runs` history table |
| `StoreSignup` (mock store) | Replaced by marketplace store events when available; until then attribution keeps tracked links + a manual/webhook ingest pipe (open item OI-2) |
| **Data to migrate: NONE.** Everything in launchkit.db is dev/demo. Stage 3 = re-seed venues via seed pipe + recreate demo projects by running the app | — |

## 4. Backend logic → pipes

| Today | Target |
|---|---|
| 7 `.pipe` files (understand, brand, commercial, targets, assets, signals, rescore) — already platform pipes | Port nearly unchanged **into the generator** (`tools/gen-pipes.mjs` pattern): stable `project_id`s live in the generator; app-local copies under `apps/launchkit/pipelines/`; `${ROCKETRIDE_*}` secret refs already correct |
| `rr.py` orchestration: `ask()` retries, `parse_json_loose`, restart-on-poisoned-state | App-side TS (thin) — the deployed-pipe path makes most of the restart machinery obsolete; retries stay |
| `gate_signals` / `gate_asset` (deterministic quality gates, code-enforced) | `tool_python` steps INSIDE the pipes (server-side, client-independent). Single source of truth — no TS mirror (equivalence rule pinned in contract) |
| `rescore_signals` (fetch thread → judge → write help-first reply) — Python around a chat pipe | Its own pipe: agent + `tool_http_request` (GET whitelist: hn.algolia.com, api.stackexchange.com, api.github.com) + Claude-compat LLM. **Needs a Stage-1 probe** (fetch-inside-pipe is load-bearing) |
| Attribution ref codes (`lk_<kind>_<slug>`), plan assembly, venue flywheel writeback | App-side TS + SQL store |
| `mockstore.py` | Deleted. Real store integration (OI-2) |
| Eval suite (`backend/evals/`) | Stays workspace-side dev tooling; never ships in the app bundle |

**Custom nodes needed: none.** All required providers exist in the catalog
(verified against the workspace catalog 2026-08-29: `tool_python`, `rocketride_sql`,
`webhook`, `tool_http_request`, `tool_exa_search`, `tool_firecrawl`, `llm_openai_api`,
`agent_rocketride`). Re-verify against **staging's** catalog at Stage 0 (§1.2).

## 5. The clock

Nothing scheduled today (all runs user-triggered). Post-launch option: a signals-refresh
schedule per project (`deploy.setSchedule`) — out of scope for v1.

## 6. Secrets

`launchkit/.env` keys (FIRECRAWL, EXA, ANTHROPIC, GMI, OPENAI, GITHUB, REDDIT×2) →
server-side environment overlay on staging, org scope, set **by the owner** (you).
Pipes already reference them as `${ROCKETRIDE_*}` — names carry over unchanged.
Nothing ships in the bundle.

## 7. Identity/audit

No actor names hardcoded. All writes (gate approvals, asset approvals, target
selections, signal statuses) get stamped with `useAuthUser()` identity.

## 8. Frontend-quality bindings (the "do not compromise" list)

| Today | Risk | Target strategy |
|---|---|---|
| Tailwind v4 CSS-first + Flight Paperwork tokens (297-line globals.css) | Server canonical build ignores custom loaders/PostCSS | **Codegen, not loaders** (doc 03 §8.1): a `tools/gen-styles` step runs the Tailwind CLI at commit time and emits a static compiled `.css` imported by the app. Zero visual change, no build-time Tailwind dependency server-side |
| `--rr-*` shell tokens vs our `--lk` Flight Paperwork tokens | Two token systems | Keep Flight Paperwork inside the app surface; map page chrome (background/text) onto shell theme at the mount boundary |
| `next/font` (IBM Plex Sans/Mono) | Next-only API | Self-hosted `@font-face` in the compiled CSS (fonts bundled as app assets) |
| `next/image`, `next-themes`, Next router | Next-only APIs | Plain `<img>` (assets bundled); theme from the shell; state-flag nav |
| `motion` + motion-primitives + TanStack Table | Plain React deps | Bundle unchanged |
| Landing page (hero art, procedure timeline, ledger) | No marketing route in-app | Becomes the store listing README + screenshots; the artwork stays in the listing assets |
