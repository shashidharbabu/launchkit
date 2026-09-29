# Launch Kit: handoff to production

Written 2026-09-29 for whoever takes Launch Kit (`rocketride_sb.launchkit`) from staging to RocketRide Cloud production, in an environment that already holds the production connection. Everything below was verified on 2026-09-28 and 2026-09-29 unless marked otherwise. Work on a new branch cut from `short-video-audio`.

## 1. Where things stand

**Code.** Branch `short-video-audio`, head `ab16f26` or later (pushed to `github.com/shashidharbabu/launchkit`). The app is `apps/launchkit`; the design system mirrors into it at deploy time; the studio forge is `services/studio-forge`.

**Staging (`https://staging.rocketride.ai`).** A fresh Cal.com launch passed all eight stages end to end on 2026-09-28 with zero errors (evidence: `docs/demo/cal-com-e2e-0928/`). The deployed staging app is still registry **v29** (2026-09-08) and does **not** carry the 09-28 fixes; the staging deploy of the new code was never made.

**Production (`https://api.rocketride.ai`, server 3.3.0.468, saas).** Partly set up on 2026-09-29, see section 2. **Registry v1 is deployed and published to `@me`, but it has never been exercised end to end.**

The 09-28 fixes that production v1 carries (commits `6120a28` to `ab16f26`):

| Commit | Fix |
|---|---|
| `6120a28` | The reel can be approved: the drop line's word budget is 2 for its 1.6 s window, and the voice repair can shorten short lines |
| `488960e` | `npm run test:domain` runs the suite (76 tests) with a stable build layout |
| `60d941e` | The money rule blocks revenue, funding and valuation figures, not prices (`FINANCIAL_FIGURES`) |
| `5aee1df` | Signals verify LinkedIn and other CORS-blocked threads through Exa (`lk_thread_fetch.pipe`); hosted community forum topics count as threads |
| `624d6e8` | Walk seed, reel wait in the drive, and `deploy-app.mjs`'s deleted-files guard finally runs |
| `ab16f26` | Evidence and `docs/MIGRATION-ISSUES-LOG.md` section L (read L1 to L11 before anything else) |

## 2. What production already has

| Item | State |
|---|---|
| Account | shashidhar.babu@rocketride.ai. Memberships: **Shashidhar's Workspace** `15477862-71df-48d0-b83e-49db58ea8700` (admin, and the account's **default org**) and RocketRide Growth `dad45948-…` (member) |
| Teams in that org | Production `0df87143-6fd8-47cc-9066-5b4bfa219039`, Development `ac1a9c8f-dc33-4f56-bb6d-b58ee84e8fed` |
| Developer id | **`rocketride_sb` claimed** for that org (it was `null`). Claimed with `client.call('rrext_deploy_app', { subcommand: 'developer_register', developerId: 'rocketride_sb' })`, the call the App Builder's Deploy tab makes |
| Org environment | Was empty. Now holds `ROCKETRIDE_ANTHROPIC_KEY`, `ROCKETRIDE_FIRECRAWL_KEY`, `ROCKETRIDE_EXA_KEY`, `ROCKETRIDE_GITHUB_TOKEN` (the keys validated against each provider on 09-28) |
| User environment | Already held `ROCKETRIDE_FIRECRAWL_KEY`, `ROCKETRIDE_GITHUB_TOKEN`, `ROCKETRIDE_GMI_KEY`, equal to those same valid keys |
| Team environments | Empty (Production and Development) |
| Registry | **v1**, build `ok`, 175 files packed, sha256 `5e6466f834f1…`, comment "prod v1: short-video-audio ab16f26, e2e-verified on staging 2026-09-28" |
| Bindings | `@me` → v1 (enabled). No team rung, no `@public` |
| API key to revoke | The CLI sign-in minted a key named **"CLI on Shashidhars-MacBook-Pro.local"**. Its local copies were deleted on 09-29; revoke it in Account → Keys unless you want it |

## 3. What is left, in order

Each step has a check that can only pass or fail. Do not move on while one fails.

1. **Connect your IDE to production, deploy pair only.** Check: `RR_ENV_OVERLAY` or your equivalent points both tool pairs at `https://api.rocketride.ai`, and `node tools/whoami.mjs` prints `ORG=Shashidhar's Workspace | devId=rocketride_sb`. See trap T4 before trusting any tool's target.
2. **Confirm the default org.** Check: `client.account.getProfile().defaultOrgId === '15477862-71df-48d0-b83e-49db58ea8700'`. Tasks run in the default org and its dev team, not the key's org (trap T1).
3. **Decide whether v1 is the version to test.** If your branch changes anything under `apps/launchkit`, deploy again: `node tools/deploy-app.mjs "<comment>"`. Check: it prints `BUILD OK, version N` and `tree check: no tracked files missing`. A failed build: `node tools/build-log.mjs <N>` prints the server's real log.
4. **Publish to `@me`.** Check: `client.whereApp('rocketride_sb.launchkit')` lists `@me` at your version. The scripts in `tools/publish-*.mjs` hardcode staging's version 29; apply appendix B first.
5. **Start the studio forge** on the machine whose browser runs the test: `cd services/studio-forge && npm start` (port 3500). Check: `GET http://127.0.0.1:3500/health` reports ffmpeg, Chromium and hyperframes. The forge sends `Access-Control-Allow-Private-Network: true`, which Chromium needs for an https page to call localhost.
6. **Run the full drive in the production shell** (apply appendix A):
   ```bash
   cd launchkit-src/frontend
   APP_URL='https://api.rocketride.ai/?appid=rocketride_sb.launchkit' \
   PROFILE_DIR=$HOME/.lk-drive-prod NAME="Cal.com" SITE=https://cal.com \
   REPO=https://github.com/calcom/cal.com OUTDIR=../../docs/demo/cal-com-prod-e2e \
   node drive.full.mjs
   ```
   A visible Chromium opens; sign in once, and the drive starts when Launch Kit mounts. About an hour of real Claude, Exa, Firecrawl and OpenAI spend.
   **Gate:** the `SUMMARY` line lists `profile, brand, commercial, social, assets, targets, signals, plan` under `ok`, `failed` is `[]`, errors `0`; the profile screenshot must not say "All tool calls failed" or "Partial analysis" (that means the task resolved the wrong secrets, trap T1/T2); `page_errors` hold only cross-origin fetches of third-party pages.
   Stage times on staging for comparison: profile 69 s, brand 148 s, commercial 175 s, social 27 min, assets 203 s, targets 163 s, signals 10 min, plan 4 s.
7. **Have someone other than the driver read the evidence cold** (screenshots per stage, `summary.json`) and try to find a stage whose output contradicts its "ok". In the shell the store lives server-side, so the drive's `appstate.json` dump is empty there; the screenshots are the evidence.
8. **Publish to the org's teams** once the gate passes: `node tools/publish-team.mjs <N>`. Check: `whereApp` lists `@team/Production` and `@team/Development` at N.
9. **Before `@public`:** section 5 (limitations), a brand check of `apps/launchkit/README.md` (it is the store listing, rendered verbatim; see `.claude/rules/skills/brand-check/`), then Submit for review. Joe approves anything public.

## 4. Traps, each one hit for real

- **T1. Tasks run in the default org, not the key's org.** On 09-28 staging pipelines ran in "Poushali's Workspace" (the account's default org then) and resolved its broken Firecrawl and GitHub secrets: GitHub 401, Firecrawl Unauthorized, and a profile written from training knowledge. Diagnose with `rocketride list --json`: each task's `teamId` must belong to the app's org. Fix: `account.setDefaultOrg(orgId)` and `account.setDevTeam(teamId)`, then `rocketride stop --token <t>` on any task still running elsewhere (`useExisting` re-attaches to it). MIGRATION-ISSUES-LOG L1.
- **T2. Secrets are layered org → team → user, most specific wins, and forwarded client keys lose.** The deployed app forwards nothing, so every `${ROCKETRIDE_*}` a pipe uses must exist server-side. A stale user-level key silently overrides a good org key: compare each layer before blaming a pipe. L2.
- **T3. `account.setEnv(scope, dict)` replaces the whole scope.** Read, merge, write, then re-read and compare every pre-existing key.
- **T4. Every `tools/*.mjs` reads `.env` then overlays `.env.deploy`, which holds the staging `rocketride_sb` key.** Whatever you use for production must win over that overlay, and a missing overlay file silently falls back to staging. Run `whoami` before every lifecycle action. Appendix B shows the one-line switch used on 09-29.
- **T5. Never put a production key in the preview.** `tools/gen-preview-env.mjs` writes `apps/launchkit/preview/env.generated.ts`, which the preview bundles into browser code; the 09-29 attempt to point the preview at production was refused for exactly that. Test production through the shell's own signed-in session (appendix A).
- **T6. The RocketRide extension rewrites `.env`** on reconnect, back to the account it is signed into. Never rely on `.env` alone for an identity.
- **T7. The extension materialises `<repo>/<app slug>/`.** A folder named `launchkit/` at the repo root is gitignored for that reason; sources live in `launchkit-src/`. After any deploy, `git status --short | grep -c '^ D'` must be 0 (`deploy-app.mjs` now checks it and exits 1).
- **T8. Do not run `tools/gen-pipes.mjs`.** Six templates in `launchkit-src/pipelines/` have drifted from the live pipes in `apps/launchkit/pipelines/` and would overwrite the 09-18 fixes. New pipes go straight into `apps/launchkit/pipelines/` and `data/runner.ts` PIPES. L9.
- **T9. Generated pipe ids drift** (the extension rewrites `project_id`). The drift is benign; do not reconcile ids to `tools/pipe-ids.json`. Never kill `deploy-app.mjs` after its `addApp` line: the registry version still lands and your label and version number diverge.
- **T10. A running task keeps its old config.** After a `.pipe` edit, rotate that pipe's `project_id` (or terminate its task) or `useExisting` reuses the old one.
- **T11. The permission gate treats `deploy-app.mjs` as a production deploy.** An agent needs explicit authorisation, and a refusal is not something to route around.

## 5. Production limitations to decide on

| Limitation | Effect in production | Options |
|---|---|---|
| **Studio forge is local** (`http://localhost:3500`, `data/studio.ts`) | The Assets stage (site read, images, cards, voice-over, reel) works only for a browser on a machine running the forge | Host the forge as a service and set its address in Settings, or hide Assets for external users |
| **`rocketride_sql` unavailable** (rocketride-server #2203, open) | Team workspaces (shared snapshot in `lk_store.pipe`) fail for everyone; Settings → Workspace "Check store" fails | Keep personal workspaces only, or run `lk_store.external.pipe` against a real Postgres with `ROCKETRIDE_LAUNCHKIT_PG_URI` |
| **Secrets resolve from the running user's org** (C7) | Your org's keys serve your org's members only; an external installer's runs resolve their own environment and fail without keys | Bring-your-own-keys panel (the shell's `EnvironmentView` with `requiredKeys`), or a platform ask for publisher-provided secrets |
| **Billing is live** (`lib/plan.ts` `PLAN_OVERRIDE = null` since 09-17) | Anyone without a subscription gets Free; paid plans go live only when a version is approved for the store | Confirm Free/Pro limits before `@public`; test with a promo code, never a code bypass |
| **Signals recall varies run to run** | 0 to 5 kept signals on identical inputs; unverifiable candidates are now judged on real text, so fewer survive | Measure over several runs per app, never one |

## 6. Where to read more

`docs/MIGRATION-ISSUES-LOG.md` (sections C, H, K, L), `docs/LAUNCH-PLAN.md` (phases and decisions), `docs/LOCAL-DEV.md` (the staging loop), `.rocketride/docs/ROCKETRIDE_APPS.md` (Deploy and Publish), `.rocketride/docs/ROCKETRIDE_CONCEPTS.md` (the two connection pairs, rungs).

## Appendix A: drive a deployed app in a real shell

Apply to `launchkit-src/frontend/drive.full.mjs`. It adds `APP_URL` (open a deployed app instead of the preview) and `PROFILE_DIR` (visible browser, persistent profile, wait up to 15 minutes for sign-in). Without either variable the drive behaves exactly as before.

```diff
-const b = await chromium.launch();
-const page = await b.newPage({ viewport: { width: 1600, height: 1100 } });
+// APP_URL opens the deployed app in a real shell instead of the preview, e.g.
+//   APP_URL='https://api.rocketride.ai/?appid=rocketride_sb.launchkit' PROFILE_DIR=~/.lk-drive-prod node drive.full.mjs
+// PROFILE_DIR keeps a visible browser with a persistent profile: sign in once in that window, and the
+// drive waits for the app to mount. No key is written anywhere; the shell's own session runs the pipes.
+const APP_URL = process.env.APP_URL || 'http://localhost:3400';
+const IN_SHELL = Boolean(process.env.APP_URL);
+const PROFILE_DIR = process.env.PROFILE_DIR || '';
+const VIEWPORT = { width: 1600, height: 1100 };
+const b = PROFILE_DIR
+  ? await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, viewport: VIEWPORT })
+  : await chromium.launch();
+const page = PROFILE_DIR ? (b.pages()[0] ?? await b.newPage()) : await b.newPage({ viewport: VIEWPORT });
```

```diff
-await page.goto('http://localhost:3400', { waitUntil: 'networkidle' });
-await page.evaluate(() => { localStorage.removeItem('lk-preview-appstate'); localStorage.removeItem('lk-nav'); });
-await page.reload({ waitUntil: 'networkidle' });
-await page.waitForTimeout(3000);
+if (IN_SHELL) {
+  // the shell holds the store server-side per user, so there is nothing to clear; wait out the sign-in
+  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
+  console.log('SIGN_IN_WAIT', JSON.stringify({ url: APP_URL, note: 'sign in in the browser window if asked' }));
+  await page.locator('#lk-root nav a', { hasText: 'Launches' }).first().waitFor({ timeout: 900000 });
+  console.log('APP_MOUNTED', JSON.stringify({ url: page.url() }));
+  await page.waitForTimeout(3000);
+} else {
+  await page.goto(APP_URL, { waitUntil: 'networkidle' });
+  await page.evaluate(() => { localStorage.removeItem('lk-preview-appstate'); localStorage.removeItem('lk-nav'); });
+  await page.reload({ waitUntil: 'networkidle' });
+  await page.waitForTimeout(3000);
+}
```

The production shell is served at `https://api.rocketride.ai/?appid=<app id>` (the same entry page as `https://staging.rocketride.ai/?appid=…`); `https://cloud.rocketride.ai` is the marketing site.

## Appendix B: point the tools at production

What was used on 09-29 and then reverted in this workspace (staging stays the default here):

1. Every `tools/*.mjs` overlay read becomes `readFileSync(process.env.RR_ENV_OVERLAY || '.env.deploy', 'utf8')` (34 files, one mechanical replacement; loop over files one by one, since zsh does not word-split an unquoted variable).
2. A gitignored `.env.prod` with all four connection variables on production, so nothing from `.env` leaks into a connection:
   ```
   ROCKETRIDE_URI=https://api.rocketride.ai
   ROCKETRIDE_APIKEY=<production key>
   ROCKETRIDE_DEPLOY_URI=https://api.rocketride.ai
   ROCKETRIDE_DEPLOY_APIKEY=<production key>
   ```
   A production key can be minted without touching the repo's `.env`: run `rocketride login --deploy --uri https://api.rocketride.ai` from an empty folder and copy the pair it writes there.
3. Then `RR_ENV_OVERLAY=.env.prod node tools/<tool>.mjs`. Tool keys (Firecrawl, Exa, GitHub, Anthropic) still come from `.env`; they only matter for the preview, which must stay on staging (T5).
4. `tools/publish-me.mjs` and `tools/publish-team.mjs` take the registry version as `process.argv[2]` instead of the hardcoded `29`:
   ```js
   const version = Number(process.argv[2]);
   if (!Number.isInteger(version) || version < 1) { console.error('usage: node tools/publish-me.mjs <registry version>'); process.exit(2); }
   const res = await client.publishApp('rocketride_sb.launchkit', version, '@me');
   ```
