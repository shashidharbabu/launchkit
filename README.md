# Launch Kit — RocketRide app

GTM-in-a-box for shipped apps: app profile, pricing, store listing, ranked launch
venues, platform-native posts, and live demand signals — seven stages, three human
approval gates, nothing published without you.

## Layout

| Path | What it is |
|---|---|
| `apps/launchkit/` | **The shipping app** — a RocketRide shell app (Module Federation remote). `src/` is the whole product; `pipelines/` holds the generated `.pipe` files it runs. |
| `launchkit-src/pipelines/` | Pipeline sources of truth (edit here, then `node tools/gen-pipes.mjs`). |
| `launchkit-src/frontend/` | The original Next.js app the shell app was ported from — the design system's source and the visual reference. |
| `launchkit-src/backend/` | The pre-migration FastAPI backend plus the eval suite (`evals/`). |
| `tools/` | Build, deploy and probe scripts (styles codegen, pipe codegen, deploy/publish, preview env). |
| `docs/` | Launch plan, migration contract, issues log, manual test checklist, screenshots. |

## Working on it

```bash
pnpm install                                   # once
node tools/gen-preview-env.mjs staging         # or: local
cd apps/launchkit && npx rsbuild dev -c rsbuild.preview.mts   # → http://localhost:3400
```

The preview harness runs the whole app locally against a real engine. To load a
finished launch instead of starting empty, paste in the browser console:

```js
fetch('/lk-seed.json').then(r=>r.text()).then(t=>{localStorage.setItem('lk-preview-appstate',t);location.reload()})
```

After any className change run `node tools/gen-styles.mjs` — the design system is a
generated artifact and the server build has no Tailwind pass.

## Deploying

```bash
node tools/deploy-app.mjs "message"   # build + upload (runs gen-styles first)
node tools/publish-team.mjs && node tools/publish-me.mjs
node tools/check-bindings.mjs         # which version each rung serves
```

Credentials come from `.env` (managed by the editor extension) overlaid with
`.env.deploy`; both are gitignored, as is `apps/launchkit/preview/env.generated.ts`.

## Docs worth reading first

- [docs/LAUNCH-PLAN.md](docs/LAUNCH-PLAN.md) — phased plan to public launch, with open decisions
- [docs/MIGRATION-ISSUES-LOG.md](docs/MIGRATION-ISSUES-LOG.md) — every platform issue hit and how it was fixed
- [docs/TEST-CHECKLIST.md](docs/TEST-CHECKLIST.md) — manual test pass
- [docs/CONTRACT.md](docs/CONTRACT.md) — pinned architecture decisions
