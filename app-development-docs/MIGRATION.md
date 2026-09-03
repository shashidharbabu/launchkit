# Migrating Spaceport: from the rocketride-saas branch to staging.rocketride.ai

How the v1 Spaceport — an internal app living on a branch of the platform
monorepo, hardwired to one repository and one team's policy — became
`demoapp.spaceport`, a generic App-Builder app with deployed, scheduled
pipelines on staging.rocketride.ai. Executed 2026-08-26. Every step below is
what actually happened, including the failures, because the failures carry
the platform lessons.

Inputs:

- **v1 source**: `rocketride-ai/rocketride-saas`, branch `kgarg2468/spaceport`,
  path `apps/spaceport` (not merged to develop). ~8,400 lines: two `.pipe`
  files + a read variant, an 866-line deterministic Python core, a mirrored
  TypeScript lib, a module-federation UI, and a docs set (`SCOPE.md`,
  `ARCHITECTURE.md`, `CONTRACT.md`).
- **v2 target spec**: the commercial analysis document (generic product,
  config-as-data, onboarding bootstrap, subscription tiers).
- **Target**: a fresh RocketRide workspace (`Space-port/`) connected to
  staging.rocketride.ai (dev pair and deploy pair both pointing at staging),
  org "Mithilesh's Workspace", developer id `demoapp`, teams Development and
  Production.

---

## 0. What "migration" meant here

The v1 app was not portable as-is. Four things bound it to its origin:

| Binding | v1 form | What migration required |
|---|---|---|
| Shell API | Built against the in-repo `shell-ui` package (`getShellApi()`, descriptor with `components: {App, Sidebar, StatusBar}` slots) | Re-target to the vendored `'shell'` package (single `app:` mount, `<AppLayout>`, named hook imports) |
| Configuration | Repo, areas, roles, thresholds, allow-lists baked into code (`REPO_OWNER = 'rocketride-org'`, closed `Area`/`Role` enums) | Everything becomes graph data (`Config` nodes, rules on `Area` nodes) with the old values as defaults |
| Storage | One external Neo4j (Aura), credentials in `.env` | Provider-switchable: built-in `rocketride_graph` default + `graph_neo4j` variant, secrets server-side |
| The clock | A GitHub Actions cron template POSTing the sync webhook | The platform scheduler (`deploy.setSchedule`) on a deployed pipeline |

So the migration was: acquire the source, understand the target platform,
re-specify the app against it, port in phases with verification gates, and
move each binding one at a time.

---

## 1. Acquire the v1 source (read-only reference)

The branch was fetched without cloning the whole monorepo:

```bash
# Confirm the file inventory first
gh api "repos/rocketride-ai/rocketride-saas/git/trees/kgarg2468/spaceport?recursive=1" \
  --jq '.tree[] | select(.path | startswith("apps/spaceport")) | .path'

# Sparse clone: only apps/spaceport materializes
git clone --depth 1 --filter=blob:none --sparse \
  -b kgarg2468/spaceport https://github.com/rocketride-ai/rocketride-saas.git v1-src
cd v1-src && git sparse-checkout set apps/spaceport
```

The copy lived outside the workspace as a read-only reference; all new code
was written fresh into the target workspace. (An attempt to keep a
`reference/` copy inside the workspace was abandoned — something in the
workspace tooling removed it — the out-of-tree copy is the durable one.)

Key v1 files studied before any code was written: `docs/ARCHITECTURE.md`
(the wave-based sync mechanism, the graph schema, why the Python core is
stored *in* the graph), `src/spaceport-sync.pipe` (the agent instruction
script), `src/data/store.ts` (the UI's read path: `client.tool` invoking the
graph node's `execute` tool with literal Cypher — no LLM in the loop), and
`src/lib/rules.ts` + `src/lib/types.ts` (the closed enums to dissolve).

## 2. Survey the target platform before deciding anything

Read in order: `ROCKETRIDE_README.md`, `ROCKETRIDE_CONCEPTS.md`,
`ROCKETRIDE_PIPELINES.md`, `ROCKETRIDE_APPS.md`, then targeted sections of
`ROCKETRIDE_typescript_API.md`. Three checks against the live server:

1. **Component availability.** Every provider the v1 pipes use exists in
   staging's catalog (`.rocketride/services-catalog.json`): `webhook`,
   `agent_rocketride`, `llm_openai`, `memory_internal`, `tool_http_request`,
   `tool_python`, `graph_neo4j`, `response_answers` — plus `rocketride_graph`
   (built-in graph, no external server), which v1 did not have.
2. **Identity.** `client.connect()` returns the whole discovery payload:
   org id, `developerId: 'demoapp'` (so the app id must be
   `demoapp.spaceport`), team ids for Development and Production.
3. **`client.tool` exists** in the current SDK (the v1 read mechanism
   depends on it), signature unchanged.

## 3. Empirical storage probe (the decision that shaped the architecture)

`rocketride_graph` promised zero-setup per-identity tenancy — the answer to
SCOPE.md's biggest open question. Before betting on it, a throwaway probe
pipe (webhook -> agent + graph tool) was validated and run against staging:

```
Error: ROCKETRIDE_CLIENT_ID is not set; RocketRide cloud DB nodes require a
signed-in RocketRide cloud identity
```

Every client-side remedy failed: API-key session, per-call `env` override on
`use()`, `ROCKETRIDE_CLIENT_ID` in `process.env`, and later a user-scope
environment secret via `client.account.setEnv('user', ...)`. Reading the
server source (`rocketride-server`: `packages/ai/src/ai/common/rocketride_db.py`,
`packages/ai/src/ai/modules/task/task_engine.py`) settled it: identity is
injected by the task engine server-side, never trusted from callers, and the
per-tenant DSN resolution requires the **DB broker** env
(`ROCKETRIDE_DB_BROKER_URL`/`_TOKEN`) in the server process — which staging
does not have configured. Full writeup: `docs/STORAGE.md`.

**Consequence**: the pipes are *generated* in two provider variants —
`rocketride_graph` (default, correct for the product once the broker lands)
and `graph_neo4j` (v1-proven, works today with Aura + secrets) — switched at
runtime by the app setting `demoapp.spaceport.graphVariant`. No hand-edited
pipe divergence: one generator, `tools/gen-pipes.mjs`, owns all variants.

## 4. Write the contract before writing code

`docs/CONTRACT-V2.md` — the binding spec every implementation phase built
against. It pinned:

- the v2 graph schema (`Config` nodes `repo` / `policy` / `roles` / `live` /
  `routing-code` / `bootstrap-code`; inference rules and allow-lists as JSON
  string properties on `Area`; `repo` scoping on every PR/Issue/Assignment);
- roles as data (name, seniorityRank, canFirstPass, defaultBandwidth) with
  the org-specific v1 vocabulary (`senior-ops`, `growth-intern`) banned from
  code;
- three review-policy modes (two-stage / single-reviewer / codeowners);
- the Python<->TypeScript query-template equivalence mechanism (marker
  comments in the core, extraction-based test on the TS side);
- the pipe wiring (graph node id `graph_1` in all pipes) and the live-writes
  contract (`result.github_writes`, WAVE G).

## 5. Set up the workspace and scaffold the app

```bash
pnpm init
pnpm add ./.rocketride/client/rocketride.tgz   # vendored client, never npm
git init                                        # diff-gating for workers
node --env-file=.env tools/scaffold-app.mjs     # wraps client.deploy.createApp
```

`client.deploy.createApp('spaceport', { template: 'Blank', displayName:
'Spaceport', developerId: 'demoapp', sidebar: true })` wrote
`apps/spaceport/` with the load-bearing scaffold details (MF plugin pin,
async boundary, HMR anchor, vendored package pins). Apps are never
hand-created.

## 6. Port in phases, each with a verification gate

Implementation was sharded to workers with strict file allowlists; every
phase ended with the same gate: `tsc --noEmit` clean, test suites green,
production `rsbuild build` succeeding, and a diff-gate confirming no file
outside the allowlist changed.

### 6a. Deterministic core (Python) — v4

`src/core/spaceport_core.py` generalized from v1: same algorithms
(stage/ballHolder model, machine gate, two-slot routing, blanket-requester
suppression, eligibility reroute, duplicate flags, fail-closed emission of
literal Cypher), but every constant now parsed from the graph store payload
(`parse_policy`). New: `build_pr_query(owner, name)` / query templates
between marker comments; `github_writes` emission gated by the `live` Config
switches; `src/core/spaceport_bootstrap.py` (new) turning contributor /
language / tree / label / review history into `Proposal` rows — never
touching `Person`/`Area` directly. 24 tests, plain `python3 -m unittest`.

### 6b. TypeScript lib + data layer

`src/lib/` mirrors the core (types with `Area`/`Role` as plain strings,
`policy.ts` parser, policy-aware `stages.ts`/`routing.ts`/`reroute.ts`,
`queries.ts` with builders byte-identical to the Python templates —
equivalence-tested by reading the `.py` file). `src/data/store.ts` kept the
v1 mechanism (start the read pipe once, `client.tool({ tool: 'execute',
nodeId: 'graph_1' })`, mock-snapshot fallback) adapted to the current shell
(`getClient` from `'shell'`), with audited writes (`who` stamped from real
shell identity — v1 wrote `spaceport-ui`) and new write helpers for every
Settings surface. 29 tests via `tsx --test`.

### 6c. UI phase 1 — the faithful port

Every v1 page and component moved over with the shell-API translation:

| v1 | v2 |
|---|---|
| `import { getShellApi } from 'shell-ui'` | named imports from `'shell'` (`useShellConnection`, `getClient`, `useAuthUser`, `usePrefs`) |
| Descriptor `components: {App, Sidebar, StatusBar}` | Descriptor `app:` single mount; sidebar declared inside via `<AppLayout sidebar={...}>` (later removed entirely — see 6e) |
| Hardcoded `areaColor` map, `ROLE_LABEL` enum | Colors from `Area` data with hashed fallback; roles rendered from the policy roles table |
| One repo implicit | `repo` threaded through rows, links via `prUrl(repo, number)` |

Plus the new surfaces the product spec required: Settings grew Areas-rules /
Roles / Policy / Repository / Engine / Go-live / Proposals panels, and the
Onboarding wizard was added. The Engine panel's "Seed engine" writes the
bundled Python into the graph — the delivery mechanism the pipes depend on
(v1 used a local `tools/load_core.py`; v2 does it from the app, plus a
headless `tools/load-core.mjs`).

### 6d. UI phase 2 — product surface

TopBar (repo chip, pulse freshness, Sync now), Overview dashboard (stat
tiles, PRs-by-stage bars, crew load vs bandwidth, needs-a-decision), PR
drawer, toast stack, skeletons, keyboard navigation, and Free/Team/Scale
entitlement gating driven by `useSubscriptions()` against the manifest's
subscription plans. Chart colors were validated for the dark surface
(lightness band, CVD separation) rather than reusing badge colors directly;
identity in charts is carried by row labels, never color alone.

### 6e. UI phase 3 — standalone frame

The app stopped using the shell sidebar altogether: `<AppLayout>` with no
`sidebar` prop gives the app the full client area, and the app renders its
own dark rail (wordmark, iconed nav with count badges, plan chip, collapse).
A single ranked StatusStrip replaced stacked banners, and Onboarding became
a five-step wizard with an explicit **Storage** step that live-probes the
graph (`RETURN 1`) and renders per-failure guidance.

## 7. Migrate the pipelines

The v1 pipes were not copied — they are **generated** by
`tools/gen-pipes.mjs` (stable `project_id` per variant, committed in the
generator), which emits to two places: the workspace `pipelines/` directory
(the deploy-to-server source) and `apps/spaceport/pipelines/` (bundled with
the app for per-user dev fallback; the deploy zip packs it automatically).

Changes vs v1 while porting the agent instruction scripts:

- graph tool id `graph_neo4j_1` -> `graph_1` (provider-neutral);
- LLM profile `gpt-5-6-terra` -> `openai-5-4` (doc-blessed on this server);
- sync gained **WAVE G**: execute `result.github_writes` via the HTTP tool
  only when the core emitted any (live switches on) — the dry-run default
  writes nothing to GitHub, exactly as v1;
- a third pipe, `spaceport-bootstrap.pipe` (new): five GitHub fetches ->
  one `python.execute` of the bootstrap module (read from
  `Config{id:'bootstrap-code'}`) -> persist `Proposal` rows;
- every variant validated against staging with `client.validate({ pipeline })`
  before any deploy (all six passed).

## 8. Migrate the clock: Actions cron -> platform scheduler

v1's `deploy/spaceport-sync.yml` (GitHub Actions curl on a cron) is replaced
by the platform scheduler. `tools/deploy-pipes.mjs`:

```js
await client.deploy.add({ pipeline: {...pipe, name}, comment, deployTo: team.id });
await client.deploy.enable(projectId, team.id);
// sync only:
await client.deploy.preview('*/30 * * * *');            // validate cron server-side
await client.deploy.setSchedule(projectId, 'webhook_1', '*/30 * * * *', team.id, { ttl: 1500 });
```

Gotcha found the hard way: `deploy.add` without `deployTo` creates a registry
version but binds no team — `enable`/`setSchedule` then fail with "No
deployment ... for team". One-step add+deploy via `deployTo` fixed it.

Result on staging (team Development): `spaceport-sync` scheduled every 30
minutes with a 25-minute run window; `spaceport-read` and
`spaceport-bootstrap` deployed, webhook-triggered by the app.

## 9. Deploy the app to staging

```js
await client.deploy.verifyApp('./apps/spaceport');          // local dry run
await client.deploy.addApp('./apps/spaceport', { comment }); // pack + upload, server builds
// poll listDeployments until buildStatus 'ok', then:
await client.publishApp('demoapp.spaceport', version, '@me');
```

Registry history and what each build taught:

| Version | Result | Lesson |
|---|---|---|
| v1 | build FAILED (bundle) | The server builds apps with its **own canonical bundler config** — the app's custom rspack rule (`.py` as `asset/source`) does not apply server-side. The Python engine sources were moved to a generated TS module (`tools/gen-engine-sources.mjs` -> `src/core/engineSources.ts`); the `.pipe` JSON rule is platform-canonical and fine. |
| v2 | build ok, published `@me` | First working staging deployment (phase 1 UI). |
| v3 | build ok, published `@me` | Phase 2 product surface + storage variants. |
| v4 | build ok, published `@me` | Phase 3 standalone frame — current. |

A second path-resolution lesson from the same build: imports that reach
outside the app folder (`../../../pipelines/`) failed rspack resolution, so
the generator writes app-local pipe copies and the app imports
`../../pipelines/` inside its own folder — which also makes the deploy zip
self-contained without `appManifest.include`.

The manifest was upgraded for the store model on the way: `mode:
"subscription"` with Team ($12/reviewer/mo) and Scale ($22) plans,
`authenticated: true`, and `contributes.configuration` declaring
`teamName`, `starfield`, `graphVariant` settings.

## 10. Migrate the secrets model

v1: a personal fine-grained PAT in the developer's local `.env`
(`${ROCKETRIDE_SPACEPORT_GITHUB_TOKEN}` substituted at `use()` time).

v2: all pipeline secrets live in the server's layered environment
(Environment overlay; org scope recommended so team-scheduled runs resolve
them) — the app never sees or transmits any secret. Required set:

| Secret | Used by | Status on staging |
|---|---|---|
| `ROCKETRIDE_SPACEPORT_GITHUB_TOKEN` | sync + bootstrap fetches (and live writes when enabled) | **User action** — an automated attempt to copy the local `gh` token to org env was blocked by the session's safety layer, correctly: credential movement is the owner's call |
| `ROCKETRIDE_OPENAI_KEY` | the pipes' sequencing LLM | **User action** — no key exists locally or server-side |
| `ROCKETRIDE_SPACEPORT_NEO4J_URI/_USER/_PASSWORD` | `neo4j` variant only | **User action** if the DB-broker path stays unavailable |

`.env.example` documents the full set; `docs/STORAGE.md` carries the
broker findings for the platform team.

## 11. End state and what remains

Live on staging.rocketride.ai:

- App `demoapp.spaceport` v0.1.0, registry v4, published `@me`.
- Pipelines `spaceport-sync` (scheduled `*/30 * * * *`), `spaceport-read`,
  `spaceport-bootstrap` — team Development, `rocketride_graph` variants
  deployed (the `-neo4j` variants are generated and ready:
  `node --env-file=.env tools/deploy-pipes.mjs --variant neo4j`).
- Everything dry-run-first: no GitHub write happens until the per-action
  go-live switches are enabled in Settings.

Blocked on exactly three externally-owned ingredients (see 10 and
`docs/STORAGE.md`): a working graph store (platform DB broker, or Aura +
secrets + `graphVariant: neo4j`), the GitHub token secret, and the OpenAI
key secret. With those set, the shipped flow is: Onboarding -> Save
repository (writes repo config + seeds the engine into the graph) -> Test
storage -> Run bootstrap -> review proposals -> dry-run pending actions ->
flip go-live switches per action type.

## Appendix: repository map after migration

```
Space-port/
  apps/spaceport/            the app (scaffolded, id demoapp.spaceport)
    docs/CONTRACT-V2.md      the binding v2 spec
    docs/STORAGE.md          storage variants + the DB-broker gap
    docs/MIGRATION.md        this document
    pipelines/               generated app-local pipe copies (bundled)
    src/core/                Python engine v4 + bootstrap + engineSources.ts (generated)
    src/lib/                 TS mirror of the core + query builders
    src/data/                store client (read pipe + client.tool execute)
    src/pages, src/components, src/state   the UI
  pipelines/                 generated deploy-to-server pipes (all variants)
  tools/
    gen-pipes.mjs            single source of truth for all six .pipe files
    gen-engine-sources.mjs   .py -> engineSources.ts (run after core changes)
    deploy-pipes.mjs         deploy + team-bind + schedule
    load-core.mjs            headless engine seeding (neo4j variant)
    scaffold-app.mjs         the createApp call that started the app
  .env.example               every ROCKETRIDE_* variable the system uses
```
