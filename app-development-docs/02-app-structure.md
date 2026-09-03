# 02 — The Target App Architecture (Stage 1: "serverless" structure)

> **Canonical sources (unchanged, read them for full detail):** the app-building reference is **Rod's `README-apps.md`** (manifest, AppDescriptor, shell hooks, Documents/VFS, build config) and the visual/component reference is **`README-app-styles.html`** (design-owner doc: archetypes, stock components, decision log). This doc only summarizes the migration-relevant subset — when in doubt, those docs win.

Every marketplace app — no matter where it started — ends up in **one shape**: a React micro-frontend served by the platform shell via Module Federation, with **all backend logic expressed as deployed, schedulable pipelines** (`.pipe` files) instead of your own servers. That is what "moving to the serverless architecture" means: your app ships no backend of its own; the RocketRide engine runs your pipes.

```
your-workspace/
  apps/<app>/                  the app (scaffolded — NEVER hand-created)
    package.json               appManifest: id <developerId>.<name>, settings, billing
    rsbuild.config.mts         the scaffold's MF config — do not modify its MF shape
    src/index.ts               MF async boundary (scaffold-owned)
    src/AppDescriptor.ts       one `app:` mount (+ HMR anchor)
    src/...                    your UI, data layer, domain logic
    pipelines/                 app-local copies of your .pipe files (bundled with the app)
    icon.svg, README.md        store listing assets (README renders verbatim — replace the scaffold one)
  pipelines/                   deploy-to-server pipes (generated)
  tools/                       generators + deploy scripts (gen-pipes, deploy-pipes, …)
  .rocketride/                 vendored client/shell, docs, catalog, schemas (server-managed)
  .env / .env.example          connection pairs; every ROCKETRIDE_* var documented
```

## First, identify your track

| Track | You are… | Effort |
|---|---|---|
| **A — in-repo app** | Built inside the saas monorepo (under `apps/`), compiled against in-repo `shell-ui` / `shared` workspace packages | Medium: re-target to the vendored `'shell'` package |
| **B1 — old RR-workspace app** | Already scaffolded against a vendored `shell.tgz`, possibly from an old server | Light: re-scaffold on staging, re-vendor, fix what the shell API changed |
| **B2 — standalone app** | Independent web app: own router, own REST/WebSocket backend, own auth | Full: every binding moves (this doc + all of doc 03) |
| **Already on staging** | Scaffolded against staging and running | Verify the checklist at the bottom of this doc, then jump to docs 04/05/06 |

## The scaffold is not optional

New apps are created **only** through the scaffold:

```bash
pnpm init                                       # workspace root, once
pnpm add ./.rocketride/client/rocketride.tgz    # vendored client — never npm
git init                                        # you want diffs per phase
```

```js
await client.deploy.createApp('<slug>', {
  template: 'Blank', displayName: '<Name>', developerId: '<yourDevId>', sidebar: true,
});
```

(Humans: App Builder → New App wizard.) The scaffold carries load-bearing details hand-rolled folders get subtly wrong: the exact `@module-federation/rsbuild-plugin` pin (**2.5.1** — must match the shell's MF runtime generation), the `src/index.ts` async boundary, the HMR anchor in `AppDescriptor.ts`, the `*.pipe` module declaration, and the vendored `file:` package pins. **This is true even for B1 apps that already "look scaffolded"** — re-scaffold on the target server and port *into* it so the pins match staging.

## Phase 0 — Inventory your bindings before touching code

Every migration is the story of moving a handful of bindings. Grep your source for each category and **write the list down** — it becomes your migration contract (doc 03 §3).

| Binding | What to look for | Target form |
|---|---|---|
| **Shell/API** | `shell-ui`, `getShellApi`, `workspace:` deps (A); `react-router`, `axios`/`fetch` base URLs, auth SDKs (B2) | The vendored `'shell'` package: one `app:` mount, `<AppLayout>`, named hooks, the shell-owned client |
| **Configuration** | Hardcoded org/repo/team names, closed string-union enums for domain vocabulary, seed files with real people | Config-as-data: rows in the app's store, editable in Settings |
| **State/storage** | Direct DB drivers, connection strings in `.env`, `localStorage` for durable state | A pipeline-fronted store (staging DB nodes — see doc 05); `useWorkspace()` prefs/appState for UI state |
| **Backend logic** | Express/FastAPI routes, workers, lambdas, scripts | `.pipe` files: deterministic logic in `tool_python`/data nodes, orchestration in agent instructions, HTTP via `tool_http_request` |
| **The clock** | GitHub Actions cron, crontabs, queue consumers | `deploy.setSchedule` on a deployed pipeline |
| **Secrets** | `.env` values the runtime reads, tokens in CI | Server-side layered environment (`${ROCKETRIDE_*}`); the bundle never carries a secret |
| **Identity/audit** | Custom auth, hardcoded actor names | Shell identity (`useAuthUser()`); every write stamped with the real signed-in user |

Rule of thumb: **the load-bearing algorithms usually port unchanged; the work is almost entirely in the bindings.**

## Phase 1 — Acquire your source, read-only

Keep the original **outside** the target workspace as a reference; write all new code fresh. Never copy files wholesale and "fix them up" — wholesale copies fail in ways whose symptoms appear far from the cause.

- **Track A:** sparse-clone only your app:
  ```bash
  git clone --depth 1 --filter=blob:none --sparse -b <branch> <saas-repo-url> v1-src
  cd v1-src && git sparse-checkout set apps/<app>
  ```
- **Track B:** plain `git clone --depth 1`. For B1, note which server its `.rocketride/` was vendored from.

Read before porting (30 minutes that save days): entry point + descriptor, the data layer (who talks to what), background jobs, any architecture notes. Write the runtime shape as **one paragraph** — if you cannot, you are not ready to port.

## What your app receives and uses (the shell contract)

- Identity: `useAuthUser()`; connection: `useShellConnection()` / `getClient()` — **never `new RocketRideClient()` in an app**.
- Layout: one `app:` mount; sidebar declared inside via `<AppLayout sidebar={...}>` (or none — the app gets the full client area).
- Durable UI state: `useWorkspace()` — `prefs` for small preferences, `appState` for your opaque blob. Not `localStorage`.
- Styling: plain CSS style objects on `--rr-*` tokens, stock `'shell'`/`shared` components where they fit. See `README-app-styles.html` for the canonical component library and rules.
- Backend seam: `client.use({ pipeline })` once per session, then `send`/`chat`/`client.tool`; server push via `useShellEvent('shell:event', …)`.

## Manifest completeness (required for the store)

In `apps/<app>/package.json` → `appManifest`: `id` (`<developerId>.<name>`), `publisher`, `name`, `description`, `icon`, real `README` (versions are immutable; the listing renders it verbatim), `categories`, `authenticated: true`, billing mode + plans if paid, and `contributes.configuration` / `settings` for **every** runtime setting the app reads.

## ✅ "Already on staging" verification checklist

Even if your app runs on staging today, confirm:

- [ ] Scaffolded via `createApp` against **staging** (MF pin 2.5.1, async boundary, HMR anchor present)
- [ ] App id is `<developerId>.<name>` (not `local.<slug>`)
- [ ] `shell` / `rocketride` deps are `file:` pins to the workspace tgz's, not registry versions
- [ ] No custom loader rules in your bundler config that the server build won't apply (codegen instead — see doc 03 §8)
- [ ] All imports stay inside the app folder (or ride `appManifest.include`)
- [ ] Pipes are app-local copies under `apps/<app>/pipelines/`
- [ ] Manifest complete (above); scaffold README replaced
- [ ] No org vocabulary hardcoded (grep your org's names — zero hits); config is data
- [ ] Storage is NOT a personal/public DB → if it is, doc 05 is mandatory for you

**Next → [03-migration-to-staging.md](03-migration-to-staging.md)** (Tracks A/B1/B2), or docs 04/05/06 if you're already structured.
