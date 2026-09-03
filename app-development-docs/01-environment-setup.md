# 01 — Environment Setup (Stage 0)

**Everyone does this first, regardless of category.** Goal: a workspace connected to `staging.rocketride.ai` with the correct extension, the 10-doc set, a working deploy target, and your org's developer id claimed. Budget ~30 minutes.

> Corrected from the original rollout post — three details there were wrong and cost real time. Follow **this** version. (Source: the verified staging test notes `01-setup.md` / `03-findings.md`, unchanged. Staging infrastructure itself is documented in **Dmitrii's** `PLAN-staging-production.md` / `README-release-process.md`.)

---

## Step 0 — Confirm staging is healthy before touching your editor

```bash
curl -s -o /tmp/docs.zip -w 'HTTP %{http_code}  %{size_download} bytes\n' \
  https://staging.rocketride.ai/client/docs
unzip -l /tmp/docs.zip
```

- **Good:** HTTP 200, ~185 KB, and the listing contains `ROCKETRIDE_APPS.md`, `ROCKETRIDE_CONCEPTS.md`, `ROCKETRIDE_PIPELINES.md`, `ROCKETRIDE_UI_COMPONENTS.md`, `ROCKETRIDE_INTEGRATIONS.md` plus a `stubs/` directory.
- **Do NOT use `curl -I`** — the route is GET-only; a `405` from HEAD means the endpoint is *working*. Only 404 is bad.
- **HTTP 404**, or the zip lists `ROCKETRIDE_QUICKSTART.md` / `PIPELINE_RULES.md` / `COMMON_MISTAKES.md`: staging is running the wrong build. Stop, and report it to **Dmitrii**.

## Step 1 — Remove EVERY existing RocketRide extension

> **The trap:** version numbers are inverted. `rocketride.rocketride-1.3.0-universal` is the *older marketplace* build (bundles 8 old docs and **deletes any doc it doesn't recognize**); `1.2.0` is the *newer staging* build. If both are installed, the old one wipes the 5 new docs on every connect. Anyone who "uninstalls the old one" by picking the lower version number removes the wrong extension.

Identify each install by **content**, never by version:

```bash
for d in ~/.cursor/extensions/*rocketride* ~/.vscode/extensions/*rocketride*; do
  [ -d "$d" ] || continue
  printf '%s\n' "$d"
  if [ -d "$d/docs" ]; then echo "    OLD BUILD — remove"
  elif grep -q "client/docs" "$d/rocketride.js" 2>/dev/null; then echo "    NEW BUILD — keep"
  else echo "    unknown"; fi
done
```

Move every OLD BUILD aside (reversible):

```bash
mkdir -p ~/rocketride-local-archive/removed-extensions
mv ~/.cursor/extensions/rocketride.rocketride-1.3.0-universal \
   ~/rocketride-local-archive/removed-extensions/ 2>/dev/null
```

Also check `extensions.json` in `~/.cursor/extensions/` and `~/.vscode/extensions/` — a directory on disk that is **absent from the registry is an orphan** and can be re-picked-up on a rescan (this is what makes the bug intermittent). Remove orphans too.

## Step 2 — Fully QUIT the editor

Not "Reload Window". Uninstalling leaves the extension registered in the running process. Quit the app entirely, then reopen.

## Step 3 — Install the staging VSIX

Extensions panel → `…` (top right) → **Install from VSIX…** → paste:

```
https://staging.rocketride.ai/client/vscode
```

If you use **Cursor, do this inside Cursor**. `code --install-extension` installs into VS Code no matter which editor you're sitting in.

## Step 4 — Connect to staging

Connection settings → **Cloud** → **Use custom server** →

```
https://staging.rocketride.ai
```

(The rollout post's `staging.rocketrid.ai` is a typo — missing `e` — and does not resolve.)

Two returning-user traps:
- Settings schema moved `rocketride.*` → `rocketride.development.*`. Old settings are silently ignored and you fall back to `local` mode. **Check the connection panel actually says Cloud.**
- In Cursor, `Cmd+,` opens the account pane, not extension settings — use the RocketRide sidebar or command palette.

## Step 5 — Verify the workspace got the new docs

Open your workspace (wait ~30 s for the connect), then:

```bash
ls .rocketride/docs/*.md | xargs -n1 basename          # want 10 files
grep -o 'ROCKETRIDE_[A-Za-z_]*\.md' CLAUDE.md | sort -u | wc -l   # want 10
```

- **8 docs incl. QUICKSTART/PIPELINE_RULES/COMMON_MISTAKES:** you still have the old extension somewhere → back to Step 1.
- **10 docs on disk but CLAUDE.md lists 8:** the routing stub didn't reinstall. Run **RocketRide: Install agent integrations** from the palette, or `diff .rocketride/docs/stubs/CLAUDE.md CLAUDE.md`.

## Step 6 — Configure the deploy target

Your `.env` needs all four variables. Mint a staging API key from the staging UI's settings/API-key page:

```
ROCKETRIDE_URI=https://staging.rocketride.ai
ROCKETRIDE_APIKEY=<key issued by staging>
ROCKETRIDE_DEPLOY_URI=https://staging.rocketride.ai
ROCKETRIDE_DEPLOY_APIKEY=<key issued by staging>
```

Per the agent rules, an absent DEPLOY pair means **no deploy target is configured** and nothing can be deployed/published/scheduled. For staging testing dev == deploy is fine — just don't assume the isolation exists.

## Step 7 — Claim your org's developer id (blocks deploy & publish)

Every app id is `<developerId>.<name>`. An org with no developer id can **build** an app but Store and Deploy render read-only. Claim it once, self-service, on the **Deploy tab** (letters and underscores only) — *before* scaffolding, or the wizard scaffolds `local.<slug>` and you're forced into a manual id rename in `package.json` (`appManifest.id` + `publisher`). Renaming after a deploy makes it a different app — do it before anything ships.

Verify with the identity probe:

```js
const res = await client.connect();
// expect: org, developerId (non-null!), teams (Development / Production)
```

## Step 8 — Sanity-check the vendored client vs the API doc

Install the client **from the workspace tarball**, never npm:

```bash
pnpm init                                       # workspace root, once
pnpm add ./.rocketride/client/rocketride.tgz
```

Then verify the deploy verbs you plan to use actually exist on `client.deploy` (`Object.keys(client.deploy)`). The API doc and the vendored client have drifted before (`listDeployments`/`publishApp` were missing from an older tarball). If a documented verb is missing, close and reopen the workspace against staging so the latest tarball is re-vendored; if it's still missing, ping **Shashidhar**.

## Step 9 — Redeem your app-building token coupon

Pipeline runs during development consume platform tokens, and every app owner gets a token grant for this migration. In the shell on staging: sidebar footer → **Account → Billing** → redeem code:

```
HACKANAPP
```

Redeem it **before** you start running pipes — validation runs, storage probes, and test deploys all meter tokens. If the code doesn't apply to your org, ping **Shashidhar**.

---

## Full verification script

```bash
echo "— staging reachable —"
curl -s -o /tmp/docs.zip -w 'docs bundle: HTTP %{http_code} %{size_download}b\n' \
  https://staging.rocketride.ai/client/docs
unzip -l /tmp/docs.zip | grep -c 'ROCKETRIDE_' | sed 's/^/docs in bundle: /'

echo "— exactly one extension? —"
ls -d ~/.cursor/extensions/*rocketride* ~/.vscode/extensions/*rocketride* 2>/dev/null

echo "— workspace —"
ls .rocketride/docs/*.md 2>/dev/null | wc -l | sed 's/^/docs on disk: /'
grep -o 'ROCKETRIDE_[A-Za-z_]*\.md' CLAUDE.md 2>/dev/null | sort -u | wc -l \
  | sed 's/^/docs CLAUDE.md routes to: /'
grep -c 'ROCKETRIDE_QUICKSTART\|ROCKETRIDE_PIPELINE_RULES\|ROCKETRIDE_COMMON_MISTAKES' \
  CLAUDE.md 2>/dev/null | sed 's/^/stale doc references (want 0): /'

echo "— deploy target —"
grep -c 'ROCKETRIDE_DEPLOY_APIKEY' .env 2>/dev/null | sed 's/^/deploy key set (want 1): /'
```

**Want:** bundle 10 · extensions 1 · docs on disk 10 · routes to 10 · stale 0 · deploy key 1 — plus `developerId` non-null from the identity probe.

## Known issues on staging (so you don't re-debug them)

| Symptom | Status | What to do |
|---|---|---|
| App deploy fails server-side at **materialize** ("transport zip unreadable … utf-8 codec") | Server bug, **fixed prior to 2026-08-26** (verified by a successful full migration) | If it recurs, it's not your app — report to **Dmitrii** with the build log from `client.deploy.versions(appId)` |
| Custom app icons render broken in the app switcher for **dev-session** apps | Open, low | Cosmetic; re-check after a real deploy |
| Package tab's APP ID field looks editable but isn't | Open | Edit `appManifest.id` in `package.json` by hand (before first deploy only) |

**Done? → Continue to [02-app-structure.md](02-app-structure.md).**
