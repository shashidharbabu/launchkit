# 06 — Ready-to-Deploy Checklist (Stage 4)

Print this per app. **An app is marketplace-ready when every box is checked.** Send the completed checklist (or blockers) to **Shashidhar Babu** — shashidhar.babu@rocketride.ai.

**Deadlines:** Stage 0–1 + custom-node PRs raised → **today (2026-08-27) 6:00 PM** · Stages 2–3 → this week · this checklist signed off → **before Sept 1**.

---

## Stage 0 — Environment (doc 01)

- [ ] Exactly one RocketRide extension installed (the staging build — verified by content, not version)
- [ ] Connected to `https://staging.rocketride.ai` in **Cloud** mode
- [ ] 10 docs on disk; `CLAUDE.md` routes to 10; zero stale doc references
- [ ] `.env` carries all four connection vars; deploy pair points at staging
- [ ] Org `developerId` claimed (identity probe returns it non-null)
- [ ] Vendored client installed from `.rocketride/client/rocketride.tgz`; planned `client.deploy.*` verbs verified to exist
- [ ] Token coupon **`HACKANAPP`** redeemed (Account → Billing) — build tokens available for pipeline runs

## Stage 1 — Development / serverless structure (docs 02 + 03)

- [ ] Phase 0 **binding inventory** written (all seven categories)
- [ ] Source acquired read-only, kept **outside** the workspace
- [ ] Catalog + identity checks against staging done; load-bearing primitives **probed empirically**
- [ ] **Migration contract** written and reviewed
- [ ] App scaffolded via `createApp` under the org's developer id (re-scaffolded for B1; never hand-created)
- [ ] Engine/domain logic ported + tests green
- [ ] Data layer ported + tests green
- [ ] UI ported (translation table applied) — `tsc --noEmit` clean, tests green, local `rsbuild build` green
- [ ] Own backend deleted (B2): no Express/FastAPI/workers/own auth/own router remain
- [ ] Config-as-data: **no org vocabulary in code** (grep your org's names — zero hits); every former constant editable in Settings
- [ ] Durable UI state in `useWorkspace()` prefs/appState — no `localStorage` for durable state
- [ ] Every write stamped with real shell identity (`useAuthUser()`)

## Custom nodes (doc 04) — if applicable

- [ ] Capability confirmed not already covered by catalog / `tool_python` / `tool_http_request`
- [ ] Node implemented in `rocketride-server/nodes/src/nodes/<name>` with tests in `nodes/test`, all passing
- [ ] PR raised on `rocketride-server` (target `develop`), reviewers requested, Shashidhar notified
- [ ] PR **merged and node visible in staging's `services-catalog.json`**
- [ ] No deployed pipe references an unmerged node

## Stage 2 — On staging (doc 03 §6–§9)

- [ ] All pipes **generated** by one generator; stable `project_id`s committed
- [ ] App-local pipe copies bundled under `apps/<app>/pipelines/`; no cross-folder imports
- [ ] `client.validate({ pipeline })` green for **every** variant against staging
- [ ] Pipes deployed **with `deployTo`** (team-bound); scheduled pipes: cron `preview`ed, `setSchedule` with `ttl` set
- [ ] `verifyApp` clean; `addApp` server build green (`buildStatus: 'ok'`); published `@me`
- [ ] Manifest complete: id, publisher, description, icon, **real README** (scaffold README replaced), categories, `authenticated`, settings schema, billing mode + plans if paid
- [ ] Secrets named `ROCKETRIDE_<APP>_<PURPOSE>`, documented in `.env.example`, **set by their owner** in the org-scope environment overlay; nothing secret in the bundle or `.pipe` files

## Stage 3 — Data on staging DBs (doc 05)

- [ ] Storage probe green for every store used
- [ ] `default` variant (`rocketride_graph`/`_sql`/`_vector`) deployed and active
- [ ] Data exported, imported through a pipe/seed path, and verified (counts + read paths)
- [ ] Personal / open-source DB credentials removed from staging env and `.env`
- [ ] Any broker gap reported to Dmitrii; external variant (if temporarily live) explicitly flagged

## Stage 4 — Final smoke pass in the shell

- [ ] Launch from the app switcher on staging (not the dev session — no `dev` badge)
- [ ] First-run flow works for a fresh user (onboarding, seeds, empty states)
- [ ] Every write path exercised; every scheduled pipe observed firing once
- [ ] Error states render sanely (disconnected, store unreachable, missing setting)
- [ ] Icon renders in the switcher; store listing (README, description, categories) reads correctly
- [ ] Publish target advanced per plan: `@me` → `@team` → `@public` via review
- [ ] **Migration notes written** — what diverged from this guide and why (send with the checklist)

---

## Escalation

| Problem | Contact |
|---|---|
| Anything app-side: structure, shell API, pipes, this checklist | **Shashidhar Babu** — shashidhar.babu@rocketride.ai |
| Staging outage, server-side build failure before your code runs, DB broker gaps, release train | **Dmitrii** |
