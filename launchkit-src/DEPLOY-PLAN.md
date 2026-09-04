# Launch Kit — path to deployment-ready

Status: **proposed, awaiting approval.** Nothing here is implemented.

## Goal

Take Launch Kit from a two-process localhost dev setup to a deployed application
that people other than its author can use safely. "Deployment-ready" is held to
these acceptance criteria:

1. The project is in version control with a reproducible clean-checkout build.
2. No unauthenticated access to any data or admin endpoint.
3. Secrets come from the host's secret store, never the image or repo.
4. Data survives redeploys and restarts (Postgres + real migrations).
5. In-flight pipeline runs behave sanely across a restart — no zombie polling,
   no silent data loss, and a bounded number run concurrently.
6. There is a health endpoint, structured logging, and a way to see why a run
   failed without SSH.
7. Per-user run limits exist, because every run spends real Exa/Firecrawl/GMI money.
8. The known ~1-in-3 engine flakiness is retried and its state is visible in the UI.
9. A documented rollback.

## Findings from the current codebase (not assumptions — verified)

| Area | State |
|---|---|
| Version control | **None.** No `.git` anywhere except the `branding/` clone. All work exists on one machine. |
| Auth | **None.** Every endpoint open, including `POST /admin/restart-pipe/{name}` (can terminate pipelines) and `GET /projects` (reads everything). |
| Tenancy | No `owner_id` on any model — all users would share all launches. |
| CORS | `allow_origin_regex` matches localhost only — a deployed frontend is blocked. |
| DB | SQLite file, `Base.metadata.create_all()`, no Alembic. `LAUNCHKIT_DATABASE_URL` is already honoured, so Postgres is a config swap + migrations. |
| Jobs | `asyncio.create_task` in-process. No queue, no concurrency cap, lost on restart (startup marks them errored). |
| mockstore | Fake App Store API mounted unconditionally, unauthenticated, writes to the live DB. |
| Frontend | `npm run build` passes clean. `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL` already externalised. |
| Secrets | `.env` correctly gitignored; `env.example` documents all 10 keys. |
| Reliability | ~1-in-3 long runs fail engine-side (documented in TEST-MATRIX, independently measured 2026-08-13). Retry fix took pricing 33% → 67%. |
| Preflight | `backend/check.py` passes; Reddit creds absent (WARN) so signals recall is degraded. |

## Blocking questions

**Q1 — Who is v1 for?**
*Recommended default: the RocketRide team only.* One shared workspace behind a
single login, deployed privately. Rationale: external publishers need real
accounts tied to store identity, and HANDOFF §8.5 lists "multi-user auth (match
store auth)" as undesigned. I would still add a nullable `owner_id` to `Project`
in the first migration so going multi-user later is a backfill, not a rewrite.
*Wrong answer costs:* the entire auth + schema layer.

**Q2 — Where does it deploy?**
*Recommended default: one Fly.io app for the backend + Fly Postgres, frontend on
Vercel.* Rationale: the backend is a stateful long-running async process (jobs
live in-process), which rules out serverless; Fly gives a persistent process and
managed Postgres with minimal ops. Docker Compose on a single VM is the
equivalent alternative if you'd rather self-host.
*Wrong answer costs:* Dockerfiles, CI deploy step, and config wiring.

**Q3 — What is the per-user ceiling on runs?**
*Recommended default: 20 pipeline runs per user per day, and a global cap of 3
concurrent runs.* Rationale: there is currently no limit of any kind, and each
run makes 15–20 LLM calls plus Exa and Firecrawl requests. A loop or an
enthusiastic user is an unbounded bill.
*Wrong answer costs:* rate-limit design and where it sits in the request path.

## Assumptions

1. **Scale.** Fewer than 50 users and under ~200 pipeline runs/day at v1. A
   single backend process with a concurrency semaphore is sufficient; no Redis
   or Celery.
2. **Data volume.** `launchkit.db` is 288KB today. The full migration fits in
   memory and can run as a one-shot script; no batched migration needed.
3. **Data trust.** Users supply a repo URL and a site URL. `_norm_url` already
   validates and 422s malformed input. Pipeline *output* is untrusted text that
   gets rendered — I will verify it is not passed to `dangerouslySetInnerHTML`
   anywhere except the existing static `jsonLd` block.
4. **Failure policy.** A failed pipeline run fails loud: job marked `error`, the
   reason shown in `/runs`, prior approved data untouched. Runs are *not*
   auto-retried beyond the 3 in-process attempts already added.
5. **Restart policy.** A run interrupted by a deploy is marked `interrupted` and
   is re-runnable by the user. I am not implementing resumable jobs — the
   pipelines are not idempotent mid-run and partial state would be worse.
6. **Idempotency.** Approvals (Gate 1/2/3) are the only state-changing writes
   that must not double-apply; they are already version-stamped writes, so
   re-submitting is safe. Job creation is not idempotent and does not need to be.
7. **Boundaries.** The FastAPI surface becomes internal-only, reached solely
   through the Next.js server. No public API contract, so no backwards-compat
   obligation. `/mockstore/*` is treated as internal and disabled by default.
8. **Environment.** Python 3.14 + `.venv` as today; Next 16.3. Backend needs
   outbound network to `api.rocketride.ai`, Exa, Firecrawl, GitHub, HN Algolia,
   StackOverflow. No inbound access except from the frontend.
9. **Secrets.** All 10 `env.example` keys move to the host secret store. The
   RocketRide key must be the prod key (dev-team key causes
   `Permission 'task.control' denied`).
10. **Out of scope, deliberately:** Reddit OAuth (HANDOFF §8.1), real store
    integration (§8.2), n8n publishing (§8.3), video generation (§8.4). Also not
    doing: resumable jobs, horizontal scaling, SOC2-grade audit logging.
11. **Testing.** I will write: auth tests (unauthenticated request → 401 on every
    route), a migration round-trip test, a rate-limit test, and a health-check
    test. I will *not* add tests that spend money on live pipelines — the
    existing `test_all.py` stays a manual, human-run suite.

## Plan

Ordered by risk: nothing is worth deploying until it is not wide open.

### Phase 0 — Version control (do first, independently of everything)
- `git init` at `rocketride-apps-gtm/`, `.gitignore` verified for `.env`,
  `.venv/`, `launchkit.db`, `node_modules/`, `backend/test_output/`.
- Confirm no secret has ever been staged before the first push.
- **Rejected:** initialising inside `launchkit/` only — `branding/` and the
  planning docs belong in the same history.

### Phase 1 — Close the security holes
- `backend/app/auth.py` — `require_user(request: Request) -> Principal`
  FastAPI dependency; `LAUNCHKIT_API_TOKEN` shared-secret check.
- Apply as a router-level dependency, not per-route, so a new endpoint is
  secure by default. Add a test asserting every route in `app.routes` rejects
  an unauthenticated call.
- `frontend/app/api/[...path]/route.ts` — server-side proxy that injects the
  token. This keeps the secret out of the browser **and** removes CORS entirely
  by making calls same-origin. `lib/api.ts` `BASE` becomes `/api`.
- Gate `mockstore_router` behind `LAUNCHKIT_ENABLE_MOCKSTORE` (default off).
- Move `/admin/*` behind a separate `require_admin`.
- **Rejected:** per-user JWT/NextAuth now — unnecessary for a single shared
  workspace and it front-runs the store-auth decision in Q1.

### Phase 2 — Durable data
- Add Alembic: `backend/alembic/`, `alembic.ini`.
- Baseline migration generated to match the *existing* `create_all` schema
  exactly, then a second migration adding `Project.owner_id` (nullable).
- Replace `init_db()`'s `create_all` with "run migrations to head".
- `backend/scripts/migrate_sqlite_to_pg.py` — one-shot copy of the 288KB DB.
- **Rejected:** keeping SQLite on a mounted volume — it survives restarts but
  not host moves, and `check_same_thread=False` with concurrent async writers
  is a corruption risk I don't want in prod.

### Phase 3 — Job safety
- `asyncio.Semaphore(LAUNCHKIT_MAX_CONCURRENT_RUNS)` around `_run_job`.
- Per-user daily quota check at job creation (Q3), returning 429 with a clear
  message the UI renders.
- Startup reconciliation: change the blanket "errored" to `interrupted` with a
  distinct status the `/runs` page renders as re-runnable.
- Surface retry attempts in `/runs` so a slow-but-recovering job is
  distinguishable from a hung one (carried over from the last session).

### Phase 4 — Packaging
- `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` for local parity.
- `GET /healthz` (process + DB) and `GET /readyz` (adds a RocketRide ping —
  kept separate so the load balancer isn't gated on a slow third party).
- Boot-time config validation reusing `check.py`'s logic: refuse to start with
  a missing required key rather than failing on the first user's run.

### Phase 5 — Deploy + CI
- GitHub Actions: typecheck + lint + `npm run build` + backend unit tests on PR;
  deploy on merge to `main`.
- Deploy per Q2; document rollback (previous release + `alembic downgrade`).

### Phase 6 — Verify against the deployed environment
- Re-run the Playwright drive-through against the deployed URL.
- One real end-to-end launch on a live app, confirming Gate 1→2→3.
- Fill in the empty Result cells in `TEST-MATRIX.md` — including row 2
  (`B vs Otter/Fireflies`), which the competitor-quality fix now targets.

## Estimate

Phases 0–3 are the substance (~60% of effort). Phase 4–5 are mechanical once
Q2 is answered. Phase 6 is a day of real-usage verification.
