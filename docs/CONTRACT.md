# Launch Kit — Migration Contract (doc 03 §2)

Pinned decisions only. Written before any porting, 2026-08-29, against
`app-development-docs/` (Track B2). Companion: [BINDING-INVENTORY.md](BINDING-INVENTORY.md).
Every later phase builds against this file.

## D1 — Target data model (config-as-data)

`rocketride_sql`, one schema, app-scoped tables:

- `projects(id, name, site_url, repo_url, created_by, created_at)`
- `profiles(id, project_id, version, data JSON, status, approved_by, approved_at)` — Gate 1
- `assets(id, project_id, asset_type, version, data JSON, status, approved_by, job_ref)` — Gate 2
- `targets(id, project_id, rank, data JSON, selected, selected_by)` — Gate 3
- `signals(id, project_id, rank, data JSON, status, status_by)`
- `commercial_results(id, project_id, kind, data JSON)` — pricing | listing | brand_dna | brand_campaigns
- `venues(id, name, kind, url, submission_url, rules_summary, audience, tags, source, enabled)` — **config-as-data**: seeded with today's 37, editable in Settings
- `app_settings(key, value JSON)` — fallback communities, asset limits, HN lock days, store variant
- `runs(id, project_id, kind, status, started_by, started_at, finished_at, error)` — replaces `Job`
- `signups(id, project_id, ref_code, occurred_at, source)` — attribution ingest (OI-2)

All writes stamped with `useAuthUser()` identity (`*_by` columns). JSON payload columns
keep today's shapes — the pipeline output contracts do not change in this migration.

## D2 — Store choice

**Default variant: `rocketride_sql`** (launch requirement). **External fallback variant:
`db_postgres`**, emitted by the same generator with identical node id `sql_1`, switched by
app setting `<devId>.launchkit.storeVariant` — never hand-edited. **No data migration**:
current launchkit.db is dev/demo; Stage 3 = seed pipe (venues + settings) only.
Stage-0 probe: `SELECT 1` through `rocketride_sql` on staging before any port (doc 05 §1);
broker failure → report to Dmitrii, develop against `external` variant meanwhile.

## D3 — Pipeline inventory (generator-owned, stable project_ids)

| Pipe | Providers (as tuned in the Aug-2026 eval fix pass) | Job |
|---|---|---|
| `lk_understand` | agent + llm_openai_api (GMI Qwen) + tool_github + tool_firecrawl | repo+site → profile (eval: UP TO THE MARK) |
| `lk_brand` | agent + llm_openai_api (**Claude via compat**) + tool_firecrawl | dna / campaigns |
| `lk_commercial` | agent + llm_openai_api (**Claude via compat**) + tool_exa + tool_firecrawl | pricing (capped loop) / listing |
| `lk_targets` | agent + llm_openai_api (**Claude via compat**) + tool_exa + tool_firecrawl | ranked venues, compact contract |
| `lk_signals` | agent + llm_openai_api (GMI Qwen) + tool_exa + tool_http_request | finder (help-first replies happen in rescore) |
| `lk_rescore` | chat + llm_openai_api (**Claude via compat**) | relevance judge + reply writer |
| `lk_rescore_fetch` (**new**) | webhook/agent + tool_http_request (whitelist: hn.algolia, api.stackexchange, api.github) + tool_python | moves the thread-fetch + gates server-side (today they live in rr.py) — **Stage-1 probe required** |
| `lk_seed` (**new**) | webhook + tool_python + rocketride_sql | seeds venues + app_settings (doc 05 §5) |
| probe pipes | webhook + rocketride_sql / tool_http_request | ten-line throwaway probes, not shipped |

Deterministic gates (`gate_asset`, `gate_signals`, HN-lock check) move INTO pipes as
`tool_python` steps. **Cross-language equivalence rule: there is no mirror** — Python in
the pipe is the single source; the UI renders pipe verdicts and never re-implements them.

Per-user vs team-service: stage runs are **per-user `use()`** (user-billed, isolated).
`lk_seed` (+ any future signals refresh schedule) are **deployed team services**.

## D4 — App page/manifest plan

- **id** `<developerId>.launchkit` (claim developer id BEFORE scaffolding), `authenticated: true`, **`sidebar: false` (full-screen frame, decided 2026-09-02 — the shell sidebar frame carries a non-removable RocketRide/app-name header; the app renders its own rail)**.
- **One `app:` mount**, `<AppLayout>` (full-screen frame; the app renders its OWN rail) with: Dashboard · Launches (list → workspace: the 7-stage rail) · Runs · Settings (venues editor, store variant, community fallbacks). **AMENDED 2026-09-02 (owner):** the landing page DOES port, as the `home` view (Home rail item; brand → Home; the navigator chat docks on top once built). The store listing (README + screenshots) remains the storefront.
- **Manifest**: categories (marketing/GTM), icon (existing rocket mark), full README (rewritten from the current landing copy — "Six stages. Three gates."), `contributes.settings` for every D1 `app_settings` key.
- **Billing (DECIDED 2026-08-31, owner): PAID app.** Manifest ships billing mode +
  plans from day one. Plan shape (to confirm at manifest-writing time):
  **Free** — 1 active launch, all 7 stages, no attribution history;
  **Pro** — unlimited launches + attribution history + regenerate without limit.
  Users additionally pay their own platform tokens for pipeline runs (per
  `pricing-plans.md`) — app subscription and token spend are separate meters, and
  the app must say so plainly in the store listing so nobody is surprised.
  **Owner testing stays free:** the owner's own org is entitled via the developer/
  publisher path (a publisher does not pay for their own app), so no plan purchase
  is needed for our testing; verify this holds on staging before publish and, if it
  does not, add an entitlement override for the owner org rather than a code bypass.

## D5 — Frontend port strategy (quality is a constraint, not a wish)

1. **Flight Paperwork survives intact**: `tools/gen-styles` codegen compiles Tailwind v4 +
   tokens to one static CSS artifact at commit time (no server-side PostCSS/loader
   dependency — doc 03 §8.1 compliant). Fonts self-hosted via `@font-face`.
2. Components port as-is (motion, motion-primitives, TanStack, stage components,
   GateSlip/stamps) — they are plain React.
3. Next-isms replaced mechanically: router → state-flag nav (+ appState persistence),
   next/image → `<img>`, next-themes → shell theme, next/font → @font-face.
4. Port order (doc 03 §4): domain TS (gates/status/plan/attribution) → data layer
   (SQL store client + pipe seam) → UI faithful port → polish. Each phase gated on
   `tsc --noEmit` + tests + production `rsbuild build`.
5. Visual acceptance: side-by-side Playwright screenshots (current app vs ported app)
   for landing-equivalent dashboard, workspace stages, both themes — reviewed by you
   before Stage 2 deploy.

## D6 — Open items (tracked, not blockers)

- **OI-1**: Reddit Data API application pending (ticket filed 2026-08-29) — signals
  recall + venue-rule verification upgrade lands whenever credentials do; no
  architecture change (backend-side search moves into `lk_rescore_fetch`-style pipe).
- **OI-2**: real store signup events for attribution — mock store dies in migration;
  tracked links remain, ingest pipe (`signups` table) activates when store webhooks exist.
- **OI-3**: verify staging catalog parity + Claude-compat (`api.anthropic.com/v1` via
  `llm_openai_api`) works from **staging** engine (Stage-0/1 probes).
- **OI-4 (CONFIRMED 2026-08-31, blocks Stage-3 verification only): staging DB broker
  unreachable.** `tools/probe-sql.mjs` — validation passes, task start fails with
  `RocketRide cloud database resolution failed at task start: DB broker unreachable:
  <urlopen error timed out>`, reproducible on retry. Reported to Dmitrii (owner:
  staging infra). Until fixed: pipes stay two-variant per doc 05 §2, data layer is
  built + unit-tested against the execute seam, live store verification deferred.
- **OI-5 (2026-09-02, launch-defining):** pipeline secrets resolve from the RUNNING user's org/team/user environment, not the publisher's — external users must bring their own keys (BYOK via the shell's embeddable `EnvironmentView` with `requiredKeys`) unless the platform adds publisher-provided secrets. Minimum-keys decision pending (LAUNCH-PLAN §5).

## D7 — Observability (DECIDED 2026-09-02, shipped v6–v8)

Two-layer pipeline tracing, no separate backend:
- **Layer 1 (per call):** the runner records one trace row per pipeline call — pipe, ms, question, ok/error — linked to the triggering run (`runJob` tags the current run). Stored in the per-user workspace store (`traces`, capped at 60), fail-safe.
- **Layer 2 (per step):** `pipelineTraceLevel: 'summary'` on `use()` + `client.addMonitor({ token }, ['flow'])` per task; the app receives `apaevt_flow` via `useShellEvent('shell:event')`, buckets by `body.project_id`, and merges the step timeline into the trace row. `chat()` responses carry no inline `_trace` — events are the only path. A real run yields ~84 steps.
- **Surface:** the Runs row expands to the trace, collapsed by default: components involved + ONLY error steps; "Show all N steps" opens a scrollable full timeline. Verified in the hardened preview (which forwards real engine events). Real-shell check pending: that the shell's `shell:event` includes FLOW events.

## Stage 0 — status (verified 2026-08-31 by probe, `tools/probe-identity.mjs`)

| Step | State |
|---|---|
| Staging healthy (docs bundle HTTP 200, 184 KB, no stale build markers) | ✅ |
| Extension + workspace vendoring (10 docs, client tgz present) | ✅ |
| `.env` all four vars — URI form `https://staging.rocketride.ai:443` works as-is | ✅ verified |
| API key valid — connects as **Shashidhar's Workspace** (`7531f3b9…`), `org.admin`, teams **Production** `05664e52…` / **Development** `65d4253f…`, both with `task.control` | ✅ verified |
| `HACKANAPP` redeemed | ✅ (owner) |
| **`developerId: null`** | ❌ **BLOCKS scaffold, deploy, publish** — owner must claim |
| Pipe secrets in the staging environment overlay (org scope) | ⏳ owner, before first pipeline run |

Vendored client verbs confirmed present: `deploy.createApp/addApp/verifyApp/add/
enable/setSchedule/preview/versions`, plus `client.listDeployments/publishApp/submitApp`
(the latter three live on the client root, not `client.deploy` — noted so the deploy
scripts call the right receiver).

**Client gotcha worth remembering:** the constructor option is `auth`, **not** `apikey`
(`new RocketRideClient({ uri, auth, persist: true })`). Passing `apikey` is silently
ignored and every call fails with the misleading "Connection closed normally".

### Secrets the pipes need (exact list, org scope)

Same names the pipes already reference — no new secrets invented:

| Secret | Used by | Why |
|---|---|---|
| `ROCKETRIDE_ANTHROPIC_KEY` | brand, commercial, targets, assets, rescore | Claude via the OpenAI-compat endpoint (the fix-pass model) |
| `ROCKETRIDE_GMI_KEY` | understand, signals | GMI Qwen agent LLM |
| `ROCKETRIDE_FIRECRAWL_KEY` | understand, brand, commercial, targets | site + pricing-page scraping |
| `ROCKETRIDE_EXA_KEY` | commercial, targets, signals | discovery search |
| `ROCKETRIDE_GITHUB_TOKEN` | understand | public repo reads (optional — degrades gracefully) |
| `ROCKETRIDE_REDDIT_CLIENT_ID` / `_SECRET` | signals, targets (future) | pending Reddit approval — set when granted |
| `ROCKETRIDE_OPENAI_KEY` | — | **not needed**; no pipe references it after the fix pass |
