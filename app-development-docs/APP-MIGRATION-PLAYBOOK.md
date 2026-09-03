# RocketRide App Migration Playbook

How to migrate an existing app onto the RocketRide platform as a first-class
App Store app: a React micro-frontend served by the shell, with its backend
logic expressed as deployed, schedulable pipelines. Written for teams
migrating several apps; distilled from the Spaceport migration (see
`apps/spaceport/docs/MIGRATION.md` for the worked example, and its
STORAGE.md for the storage deep-dive).

The playbook covers both source shapes we have:

- **Track A — in-repo apps**: built inside the saas monorepo (a subtree /
  branch under `apps/`), compiled against the in-repo `shell-ui` and
  `shared` workspace packages.
- **Track B — standalone apps**: built outside the saas repo. Two sub-cases:
  **B1** — already a RocketRide-workspace app (scaffolded against a vendored
  `shell.tgz`, possibly old); **B2** — an independent web app (own router,
  own REST/WebSocket backend, own auth).

The phases are the same for every track; only Phase 1 (acquisition) and the
Phase 5 translation tables differ. Do the phases in order — each one
de-risks the next.

---

## Phase 0 — Inventory the bindings before touching code

Every migration is the story of moving a handful of bindings. Find them
first; they define the work. Grep the source for each category and write the
list down — it becomes your contract (Phase 3).

| Binding | What to look for | Generic target form |
|---|---|---|
| **Shell/API** | `shell-ui`, `getShellApi`, `workspace:` deps (Track A); `react-router`, `axios`/`fetch` base URLs, auth SDKs (Track B2) | The vendored `'shell'` package: one `app:` mount, `<AppLayout>`, named hooks, the shell-owned client |
| **Configuration** | Hardcoded org/repo/team names, closed string-union enums for domain vocabulary, seed files with real people | Data with defaults: config rows in the app's store, editable in its Settings |
| **State/storage** | Direct DB drivers, connection strings in `.env`, browser `localStorage` for durable state | A pipeline-fronted store (graph/SQL/vector node as agent tool or data node); `useWorkspace()` prefs/appState for UI state |
| **Backend logic** | Express/FastAPI routes, workers, lambdas, scripts under `tools/` | `.pipe` files: deterministic logic in `tool_python`/data nodes, orchestration in agent instructions, HTTP via `tool_http_request` |
| **The clock** | GitHub Actions cron, crontabs, queue consumers | `deploy.setSchedule` on a deployed pipeline (cron + ttl) |
| **Secrets** | `.env` values the runtime reads, tokens in CI | Server-side layered environment (`${ROCKETRIDE_*}` substitution); the app bundle never carries a secret |
| **Identity/audit** | Custom auth, hardcoded actor names in audit trails | Shell identity (`useAuthUser()`); every write stamped with the real signed-in user |

Rule of thumb from Spaceport: the load-bearing algorithms usually port
unchanged; the work is almost entirely in the bindings.

## Phase 1 — Acquire the source, read-only

Keep the original OUTSIDE the target workspace as a reference; write all new
code fresh. Never copy files wholesale and "fix them up" — the scaffold and
the translation tables exist because wholesale copies fail in ways whose
symptoms appear far from the cause.

**Track A (monorepo subtree).** Sparse-clone only the app:

```bash
git clone --depth 1 --filter=blob:none --sparse \
  -b <branch> https://github.com/<org>/<saas-repo>.git v1-src
cd v1-src && git sparse-checkout set apps/<app>
```

**Track B (standalone repo).** Plain `git clone --depth 1`. For B1 also note
which server its `.rocketride/` was vendored from — an old shell.tgz means
the shell API may have moved under it.

Read before porting (30 minutes that save days): the app's own architecture
notes if any; its entry point and descriptor; its data layer (who talks to
what); its background jobs. Write down the runtime shape as a one-paragraph
description — if you cannot, you are not ready to port it.

## Phase 2 — Survey the target platform and prove the risky parts

1. **Docs, in this order**: `ROCKETRIDE_README.md` → `ROCKETRIDE_CONCEPTS.md`
   → `ROCKETRIDE_APPS.md` → `ROCKETRIDE_PIPELINES.md` → your language's API
   doc. The task router in the README tells you what to skip.
2. **Catalog check.** Every pipeline component you plan to use must exist in
   the target server's `.rocketride/services-catalog.json` — providers are
   never guessed. Check config schemas under `.rocketride/schema/`.
3. **Identity check.** `client.connect()` returns org, `developerId` (your
   app id must be `<developerId>.<name>`), and team ids. No developer id
   registered → claim one on the Deploy tab first.
4. **Probe what the architecture depends on.** If a component is
   load-bearing and you have not seen it work on THIS server, write a
   ten-line throwaway pipe and run it before committing the design.
   Spaceport's probe surfaced that `rocketride_graph` needs a server-side DB
   broker that staging does not have configured — discovered in minutes, not
   after the port. Budget for the probe; it is the cheapest insurance in
   this playbook.

## Phase 3 — Write a migration contract

One markdown file, written before any code, pinned decisions only. It should
answer: the target data model (config-as-data — every hardcoded org value
from Phase 0 gets a home), the store choice (with fallback variant if the
probe found risk), the pipeline inventory (which pipes, which providers,
what each agent's job is), the app's page/manifest plan, and any
cross-language equivalence rules (if logic is mirrored, pin the mechanism
that keeps the copies identical — e.g. shared templates with an
extraction-based test). Every later phase builds against this file; workers
or teammates get it as the spec.

## Phase 4 — Scaffold in the target workspace (never hand-create)

```bash
pnpm init                                       # workspace root, once
pnpm add ./.rocketride/client/rocketride.tgz    # vendored client, never npm
git init                                        # you want diffs per phase
```

Then `client.deploy.createApp('<slug>', { template, displayName,
developerId, ... })` (agents/scripts) or the App Builder's New App wizard
(humans). The scaffold carries load-bearing details that hand-rolled folders
get subtly wrong: the exact Module Federation plugin pin, the
`src/index.ts` async boundary, the HMR anchor in `AppDescriptor.ts`, the
`*.pipe` module declaration, and the vendored `file:` package pins. This is
true even for Track B1 apps that already "look scaffolded" — re-scaffold on
the target server and port into it, so the pins match that server.

## Phase 5 — Port in verified phases

Order matters — each layer is the spec for the next:

1. **Domain/engine logic** (the pure part) + its tests.
2. **Data layer** (store client, types) + tests.
3. **UI, faithful port** — behavior-preserving, against the new shell API.
4. **Product passes** (surface polish, entitlements) — after it works.

Gate every phase identically: typecheck clean (`tsc --noEmit`), tests green,
production build succeeds (`rsbuild build`), and — if you shard the work —
a diff-gate confirming nothing outside the phase's file list changed.

### Track A translation table (in-repo `shell-ui` → vendored `'shell'`)

| v1 (in-repo) | Target |
|---|---|
| `import { getShellApi } from 'shell-ui'` | Named imports from `'shell'`: `useShellConnection`, `getClient`, `useAuthUser`, `usePrefs`, `useWorkspace`, `useShellEvent` |
| Descriptor `components: { App, Sidebar, StatusBar }` slots | Descriptor `app:` — ONE mount; layout declared inside via `<AppLayout sidebar={...} showStatus>` (one React tree; module-level state replaces cross-slot bridging) |
| `"shell-ui": "workspace:~"`, `"shared": "workspace:~"` | `"shell": "file:../../.rocketride/shell/shell.tgz"`, `"rocketride": "file:../../.rocketride/client/rocketride.tgz"` — vendored, never registry, never bundled (MF `import: false`) |
| Monorepo rsbuild/webpack config | The scaffold's `rsbuild.config.mts`, unmodified in its MF shape |
| Client constructed or reached via repo internals | Always the shell's client: `useShellConnection()` / `getClient()` — never `new RocketRideClient()` in an app |

### Track B2 translation table (independent web app → shell app)

| Standalone | Target |
|---|---|
| Own router (react-router etc.) | State-flag navigation inside the single mount (or keep a memory router) — the shell owns the URL |
| Own auth (login pages, JWT handling) | Delete it. `authenticated: true` in the manifest; identity via `useAuthUser()`; the shell handles sign-in |
| REST/WS backend calls | The pipeline seam: `client.use({ pipeline })` once per session, then `send`/`chat`/`client.tool`; server push via `useShellEvent('shell:event', ...)` |
| Backend services (Express routes, workers) | `.pipe` files (Phase 6). Deterministic logic goes in `tool_python` or data nodes; a route that "calls out" becomes `tool_http_request` with a URL whitelist |
| `localStorage` / IndexedDB for durable state | `useWorkspace()` — `prefs` for small UI prefs, `appState` for your opaque blob; server-persisted per user |
| CSS framework (Tailwind/MUI/styled-components) | The styles doctrine: plain CSS style objects, `--rr-*` tokens (or a deliberate self-contained theme); stock `'shell'` components where they fit |
| `.env` consumed by frontend | Gone. Pipeline configs reference `${ROCKETRIDE_*}`; values resolve server-side from the layered environment |
| Own websocket/eventing | The one platform connection; monitors + `shell:event` |

Track B1 is the light case of the same table: mostly re-scaffold, re-vendor,
fix what the shell API changed underneath, and continue at Phase 6.

### Config-as-data (all tracks)

Dissolve every closed enum and constant found in Phase 0 into data rows with
the old values as seed defaults, and give each one an editor in the app's
Settings. Litmus test: another org must be able to adopt the app without a
code change, and none of YOUR org's vocabulary may survive in code.

## Phase 6 — Pipelines

- **Generate, don't hand-maintain.** One generator script owning every
  `.pipe` (and every variant) prevents divergence. Stable `project_id`s live
  in the generator — task addressing and deploy history key on them; never
  regenerate them.
- **App-local copies.** The app imports pipes from INSIDE its own folder
  (`apps/<app>/pipelines/`) — imports reaching outside the app folder fail
  the server build's resolution, and app-local copies make the deploy zip
  self-contained. The generator writes both locations.
- **Validate before deploying.** `client.validate({ pipeline })` against the
  target server for every variant.
- **Per-user vs team-service.** `use()` from the app = one task per user
  (isolation, user-billed). A shared/scheduled service = deployed
  `kind: 'pipe'` project addressed via
  `getTaskToken({ projectId, source, teamId })`. Ship both paths: deployed
  task first, per-user `use()` fallback.
- **Storage choice.** Prefer the built-in `rocketride_*` stores for
  zero-setup — but see the gotchas: cloud DB nodes require the server-side
  DB broker. If your target server lacks it, generate a second pipe variant
  on an external store (`graph_neo4j`, `db_postgres`, `qdrant`, ...) and
  make the variant a runtime app setting.

## Phase 7 — The clock

Whatever fired your background work before (Actions cron, crontab, queue)
becomes a schedule on the deployed pipeline:

```js
await client.deploy.add({ pipeline: { ...pipe, name }, comment, deployTo: teamId });
await client.deploy.preview(cron);                       // server-side validation
await client.deploy.setSchedule(projectId, sourceId, cron, teamId, { ttl });
```

Gotchas: `deploy.add` WITHOUT `deployTo` creates a registry version bound to
no team — `enable`/`setSchedule` then fail with "No deployment ... for
team". Write crons in the schedule editor's friendly shapes (`*/30 * * * *`,
`0 9 * * 1,2,3,4,5` — comma lists, not ranges). `ttl` bounds the run window;
app-embedded pipes can never be scheduled — only deployed ones.

## Phase 8 — Deploy and publish the app

```js
await client.deploy.verifyApp('./apps/<app>');   // local dry run: manifest, id, assets, pack size
await client.deploy.addApp('./apps/<app>', { comment });  // pack + upload; the SERVER builds
// poll listDeployments until buildStatus 'ok', then:
await client.publishApp('<developerId>.<app>', version, '@me');   // then @team, then @public via review
```

Server-build gotchas that cost us real deploy cycles:

1. **The server builds with its own canonical bundler config.** Custom
   rspack/rsbuild rules in your app config do NOT apply server-side (the
   `.pipe`-as-JSON rule is platform-canonical and safe). Anything that
   depends on a custom loader — e.g. importing non-JS assets as raw strings
   — must become generated code instead (a codegen script producing a `.ts`
   module, run before commit).
2. **Imports must stay inside the app folder** (or ride
   `appManifest.include` at real workspace-relative paths).
3. **Replace the scaffold README before v1** — versions are immutable and
   the store listing renders it verbatim.
4. **Registry versions are integers and forever**; your semver is display
   metadata. Roll back by re-publishing an older version, never rebuilding.

Manifest completeness while you are in there: `authenticated`, categories,
description, billing mode + plans if the app is paid, and
`contributes.configuration` for every runtime setting the app reads.

## Phase 9 — Secrets

Local `.env` values become server-side environment secrets (Environment
overlay; org scope recommended so team-scheduled runs resolve them). The
migration checklist per secret: name it `ROCKETRIDE_<APP>_<PURPOSE>`,
reference it as `${ROCKETRIDE_...}` in pipe configs only, document it in
`.env.example`, and have the OWNER set it — do not script credential
movement on someone's behalf. Nothing secret ever ships in the app bundle or
the `.pipe` files (substitution is server-side by design).

## Known platform gotchas (the reusable list)

| Gotcha | Consequence | Answer |
|---|---|---|
| pnpm, not npm | `npm install` corrupts the workspace layout | `npm i -g pnpm` once; everything else is pnpm |
| Registry `rocketride`/`shell` packages | Lag the server; break at runtime | Always the vendored tgz pins |
| Cloud DB nodes (`rocketride_graph`/`_sql`/`_vector`) | Need the server-side DB broker + engine-injected identity; client-side workarounds are ignored by design | Probe on YOUR server first; keep an external-store pipe variant |
| Server canonical bundler | Custom loader rules silently absent in server builds | Codegen instead of loaders |
| Cross-folder imports | Server build cannot resolve them | App-local copies or `include` |
| `deploy.add` without `deployTo` | Version exists, team binding does not | Pass `deployTo` (or `deploy.deploy` after) |
| `project_id` regenerated | Task addressing and history break silently | Stable ids, committed in the generator |
| Blocking the event loop in scripts | Websocket keepalive dies (~60s), `Connection closed` | Async I/O only around SDK calls |
| One `use()` per request | "Pipeline already running", cost, latency | `use()` once, keep the token, `useExisting: true` |

## The per-app checklist

Print this per app; a migration is done when every box is checked.

- [ ] Phase 0 binding inventory written (all seven categories)
- [ ] Source acquired read-only, outside the workspace
- [ ] Catalog + identity checks against the target server
- [ ] Load-bearing primitives probed empirically
- [ ] Migration contract written and reviewed
- [ ] App scaffolded via `createApp` under the org's developer id
- [ ] Engine/domain logic ported + tests green
- [ ] Data layer ported + tests green
- [ ] UI ported (translation table applied) — typecheck, tests, local build green
- [ ] No org vocabulary left in code (grep your org's names — zero hits)
- [ ] Pipes generated, validated server-side, app-local copies bundled
- [ ] Pipes deployed with `deployTo`, schedule set + previewed
- [ ] `verifyApp` clean; `addApp` server build green; published `@me`
- [ ] Manifest complete (auth, settings schema, billing if paid, real README)
- [ ] Secrets named, documented in `.env.example`, set by their owner
- [ ] Smoke pass in the shell: first-run flow, every write path, error states
- [ ] Migration notes written (what diverged from this playbook and why)

---

*Worked example: Spaceport (`apps/spaceport/docs/MIGRATION.md`) — a Track A
migration that exercised every phase above, including the storage probe
fallback and three server-build lessons.*
