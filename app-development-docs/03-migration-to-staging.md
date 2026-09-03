# 03 — Migration Playbook (Stage 1 → Stage 2)

The phase-by-phase process that takes an app from "source acquired" to "deployed and published on staging".

> **Canonical sources (unchanged):** this doc distills [APP-MIGRATION-PLAYBOOK.md](APP-MIGRATION-PLAYBOOK.md) and the Spaceport worked example [MIGRATION.md](MIGRATION.md) (Track A, executed 2026-08-26 — it exercised every phase, including the failures; both bundled with this package). Read those for full depth; release-train mechanics belong to **Dmitrii's** `README-release-process.md`. Do the phases **in order**; each one de-risks the next. Prerequisites: doc 01 done, doc 02 read, Phase 0 binding inventory written.

---

## §1 — Survey the platform before deciding anything

1. **Docs, in this order:** `ROCKETRIDE_README.md` → `ROCKETRIDE_CONCEPTS.md` → `ROCKETRIDE_APPS.md` → `ROCKETRIDE_PIPELINES.md` → your language's API doc. The README's task router tells you what to skip.
2. **Catalog check.** Every pipeline component you plan to use must exist in staging's `.rocketride/services-catalog.json` — providers are never guessed. Check config schemas under `.rocketride/schema/`. *A component missing from the catalog = you need doc 04 (custom nodes) — start that PR **now**, it has review latency.*
3. **Identity check.** `client.connect()` must return your org, a non-null `developerId`, and team ids.
4. **Probe the load-bearing parts.** If a component is load-bearing and you have not seen it work on **this** server, write a ten-line throwaway pipe and run it before committing the design. The Spaceport probe surfaced a server-side storage gap in minutes instead of after the port. Budget for the probe — it is the cheapest insurance in this playbook. (For DB nodes specifically, see doc 05.)

## §2 — Write a migration contract

One markdown file (`docs/CONTRACT.md` in your workspace), written **before any code**, pinned decisions only:

- the target data model — **config-as-data**: every hardcoded org value from Phase 0 gets a home;
- the store choice (with a fallback variant if the probe found risk);
- the pipeline inventory (which pipes, which providers, what each agent's job is);
- the app's page/manifest plan;
- any cross-language equivalence rules (if logic is mirrored between Python and TS, pin the mechanism that keeps the copies identical — e.g. shared templates + an extraction-based test).

Every later phase builds against this file; teammates or agents get it as the spec.

## §3 — Scaffold in the target workspace

Per doc 02: `pnpm init` → `pnpm add ./.rocketride/client/rocketride.tgz` → `git init` → `client.deploy.createApp(...)` under **your developer id**. Never hand-create; re-scaffold even for B1.

## §4 — Port in verified phases

Order matters — each layer is the spec for the next:

1. **Domain/engine logic** (the pure part) + its tests.
2. **Data layer** (store client, types) + tests.
3. **UI, faithful port** — behavior-preserving, against the new shell API.
4. **Product passes** (polish, entitlements) — after it works.

**Gate every phase identically:** `tsc --noEmit` clean · tests green · production `rsbuild build` succeeds · (if work is sharded) a diff-gate confirming nothing outside the phase's file list changed.

### Track A translation table (in-repo `shell-ui` → vendored `'shell'`)

| v1 (in-repo) | Target |
|---|---|
| `import { getShellApi } from 'shell-ui'` | Named imports from `'shell'`: `useShellConnection`, `getClient`, `useAuthUser`, `usePrefs`, `useWorkspace`, `useShellEvent` |
| Descriptor `components: { App, Sidebar, StatusBar }` slots | Descriptor `app:` — ONE mount; layout declared inside via `<AppLayout sidebar={...} showStatus>` (one React tree; module-level state replaces cross-slot bridging) |
| `"shell-ui": "workspace:~"`, `"shared": "workspace:~"` | `"shell": "file:../../.rocketride/shell/shell.tgz"`, `"rocketride": "file:../../.rocketride/client/rocketride.tgz"` — vendored, never registry, never bundled (MF `import: false`) |
| Monorepo rsbuild/webpack config | The scaffold's `rsbuild.config.mts`, unmodified in its MF shape |
| Client constructed via repo internals | Always the shell's client: `useShellConnection()` / `getClient()` |

### Track B2 translation table (independent web app → shell app)

| Standalone | Target |
|---|---|
| Own router (react-router etc.) | State-flag navigation inside the single mount (or a memory router) — the shell owns the URL |
| Own auth (login pages, JWT handling) | **Delete it.** `authenticated: true` in the manifest; identity via `useAuthUser()`; the shell handles sign-in |
| REST/WS backend calls | The pipeline seam: `client.use({ pipeline })` once per session, then `send`/`chat`/`client.tool`; server push via `useShellEvent('shell:event', …)` |
| Backend services (Express routes, workers) | `.pipe` files (§6). Deterministic logic → `tool_python`/data nodes; a route that "calls out" → `tool_http_request` with a URL whitelist |
| `localStorage` / IndexedDB for durable state | `useWorkspace()` — `prefs` for small UI prefs, `appState` for your opaque blob; server-persisted per user |
| CSS framework (Tailwind/MUI/styled-components) | Plain CSS style objects, `--rr-*` tokens; stock `'shell'` components where they fit |
| `.env` consumed by frontend | **Gone.** Pipeline configs reference `${ROCKETRIDE_*}`; values resolve server-side |
| Own websocket/eventing | The one platform connection; monitors + `shell:event` |

Track B1 is the light case of the same table: re-scaffold, re-vendor, fix what the shell API changed underneath, then continue at §6.

### Config-as-data (all tracks)

Dissolve every closed enum and hardcoded constant found in Phase 0 into data rows with the old values as seed defaults, and give each one an editor in the app's Settings. **Litmus test:** another org must be able to adopt the app without a code change, and none of YOUR org's vocabulary may survive in code (grep your org names — zero hits).

## §5 — Audited identity

Every write your app performs is stamped with the real signed-in user from `useAuthUser()` — never a hardcoded actor name like `myapp-ui`.

## §6 — Pipelines

- **Generate, don't hand-maintain.** One generator script (`tools/gen-pipes.mjs` pattern) owns every `.pipe` and every variant. **Stable `project_id`s live in the generator** — task addressing and deploy history key on them; never regenerate them.
- **App-local copies.** The app imports pipes from INSIDE its own folder (`apps/<app>/pipelines/`) — imports reaching outside the app folder fail the server build's resolution, and app-local copies make the deploy zip self-contained. The generator writes both locations (workspace `pipelines/` for deploy, app-local for bundling).
- **Validate before deploying:** `client.validate({ pipeline })` against staging for **every** variant.
- **Per-user vs team-service.** `use()` from the app = one task per user (isolation, user-billed). A shared/scheduled service = deployed `kind: 'pipe'` project addressed via `getTaskToken({ projectId, source, teamId })`. Ship both paths: deployed task first, per-user `use()` fallback.
- **Storage:** staging-managed `rocketride_*` stores are the launch requirement — full detail and migration steps in **doc 05**.
- **Custom nodes:** any node not in staging's catalog must go through the **doc 04** PR process before your pipe can reference it on staging.

## §7 — The clock: your cron becomes a schedule

Whatever fired your background work before (Actions cron, crontab, queue consumer):

```js
await client.deploy.add({ pipeline: { ...pipe, name }, comment, deployTo: teamId });
await client.deploy.enable(projectId, teamId);
await client.deploy.preview('*/30 * * * *');            // server-side cron validation
await client.deploy.setSchedule(projectId, 'webhook_1', '*/30 * * * *', teamId, { ttl: 1500 });
```

Gotchas:
- `deploy.add` **without `deployTo`** creates a registry version bound to no team → `enable`/`setSchedule` fail with "No deployment … for team". Always pass `deployTo`.
- Write crons in the schedule editor's friendly shapes (`*/30 * * * *`, `0 9 * * 1,2,3,4,5` — comma lists, not ranges).
- `ttl` bounds the run window; **app-embedded pipes can never be scheduled** — only deployed ones.

## §8 — Deploy and publish the app

```js
await client.deploy.verifyApp('./apps/<app>');            // local dry run: manifest, id, assets, pack size
await client.deploy.addApp('./apps/<app>', { comment });  // pack + upload; the SERVER builds
// poll listDeployments/versions until buildStatus 'ok', then:
await client.publishApp('<developerId>.<app>', version, '@me');   // then @team, then @public via review
```

Server-build lessons that cost real deploy cycles:

1. **The server builds with its own canonical bundler config.** Custom rspack/rsbuild loader rules do NOT apply server-side (the `.pipe`-as-JSON rule is platform-canonical and safe). Anything depending on a custom loader — e.g. importing non-JS assets as raw strings — must become **generated code** (a codegen script producing a `.ts` module, run before commit).
2. **Imports must stay inside the app folder** (or ride `appManifest.include` at real workspace-relative paths).
3. **Replace the scaffold README before v1** — versions are immutable and the store listing renders it verbatim.
4. **Registry versions are integers and forever**; your semver is display metadata. Roll back by re-publishing an older version, never rebuilding.

If the server build fails at a phase **before** your code runs (e.g. `materialize`), that is infrastructure — collect the build log from `client.deploy.versions(appId)` and ping **Dmitrii**.

## §9 — Secrets

Local `.env` values become **server-side environment secrets** (Environment overlay; org scope recommended so team-scheduled runs resolve them). Per secret:

1. Name it `ROCKETRIDE_<APP>_<PURPOSE>`.
2. Reference it as `${ROCKETRIDE_...}` **in pipe configs only** — substitution is server-side by design.
3. Document it in `.env.example`.
4. Have the **owner** set it — never script credential movement on someone else's behalf.

Nothing secret ever ships in the app bundle or the `.pipe` files.

---

## Known platform gotchas (the reusable list)

| Gotcha | Consequence | Answer |
|---|---|---|
| pnpm, not npm | `npm install` corrupts the workspace layout | `npm i -g pnpm` once; everything else is pnpm |
| Registry `rocketride`/`shell` packages | Lag the server; break at runtime | Always the vendored tgz pins |
| Cloud DB nodes (`rocketride_graph`/`_sql`/`_vector`) | Need the server-side DB broker + engine-injected identity; client-side workarounds are ignored by design | Probe on staging first; see doc 05 |
| Server canonical bundler | Custom loader rules silently absent in server builds | Codegen instead of loaders |
| Cross-folder imports | Server build cannot resolve them | App-local copies or `include` |
| `deploy.add` without `deployTo` | Version exists, team binding does not | Pass `deployTo` (or `deploy.deploy` after) |
| `project_id` regenerated | Task addressing and history break silently | Stable ids, committed in the generator |
| Blocking the event loop in scripts | Websocket keepalive dies (~60 s), `Connection closed` | Async I/O only around SDK calls |
| One `use()` per request | "Pipeline already running", cost, latency | `use()` once, keep the token, `useExisting: true` |

**Next → [04-custom-nodes.md](04-custom-nodes.md)** if you need nodes not in the catalog, otherwise **[05-data-migration.md](05-data-migration.md)**.
