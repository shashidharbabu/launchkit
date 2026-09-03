# Launch Kit Migration — Issues & Fixes Log

A running log of every real problem hit while migrating Launch Kit onto the
RocketRide shell platform, and how it was fixed. **Purpose: source material for
updating the app-development docs shared with app owners** — each entry is
written so a doc owner can lift the symptom → cause → fix → doc-gap directly.

Format per entry: **Symptom** (what the owner sees) · **Cause** (the real
mechanism) · **Fix** (what worked) · **Doc gap** (what the migration docs should
say so the next owner avoids it). Newest first within each section.

Last updated: 2026-09-02.

---

## A. Shell integration (the app inside the shell)

### A9. Two menus in one view — chrome rendered in two places at once
- **Symptom:** entering a launch showed the main menu twice: once as the app-wide rail and again inside the workspace.
- **Cause:** `app-chrome.tsx` rendered the main nav for every view while `workspace-shell.tsx` still rendered its own copy from the pre-migration layout (it also had a second `CommandPalette`). Neither knew about the other, and nothing typechecked as wrong.
- **Fix:** exactly one owner for app-wide chrome. `AppChrome` renders the top bar and the palette; the workspace renders only what is its own (title, run state, stage rail). Guard: assert `document.querySelectorAll('nav[aria-label="Main"]').length === 1` on every view in the navigation drive.
- **Doc gap:** when a view supplies its own layout, say explicitly which chrome the app shell owns and which the view owns, and give the duplicate-chrome assertion as a standard check.

### A10. Sequences read as a list, not as tabs — and long jobs must state their cost up front
- **Symptom:** the seven-stage procedure sat in a horizontal tab strip and read as "stale"; nothing told the user how long a stage takes or that it keeps running if they navigate away (some stages take minutes).
- **Fix:** the stage rail became a **vertical numbered list on the left** (current step highlighted, verdict dot per finished step, locked steps visible with the reason) so one step is done at a time. Every run-starting surface — each stage's orientation card, empty states, and the create-launch form — now states a **measured** typical duration and that the run continues in the background; the running indicator shows elapsed against that same measured time.
- **Method:** the durations come from the recorded runs in the trace store, not estimates, in one shared module (`lib/run-eta.ts`) so a single edit keeps every surface honest.
- **Doc gap:** recommend that any app running multi-minute pipelines publish a measured expectation before the click, and that empty states carry it too — an empty state is where "how long will this take?" is actually asked.


### A8. App text reads too small inside the shell → pin the type scale to px and enlarge; the app is token-only
- **Symptom:** owner reports the app's text is "very small" in the shell, though it looked normal in the original Next app and in the preview.
- **Cause:** NOT a shrink bug — verified the shell leaves the html root at the browser default 16px (zero `html`/`body`/`:root` font-size overrides in its CSS). The design system's 14px "workspace default" body is true-size but reads small beside the shell's chrome and on a wide viewport. Because the scale was `rem`-based, it would also have silently shrunk had the shell ever changed its root.
- **Fix:** audited usage first — the app uses ONLY design tokens (`text-body/data/meta/title/display/heading/read`; zero Tailwind default sizes such as `text-sm`), so enlarging is a 7-token change with no mixed sizes. Converted all seven to px and raised them (body 14→16, heading/read 16→18 to keep their step above body, data 13→14, meta 11→12, title 20→22, display 28→30), regenerated, and measured every token's rendered value in the hardened preview.
- **Doc gap:** embedded apps should pin their type scale to px (host-independent) and audit for Tailwind-default size utilities before bumping, otherwise a bump produces mixed sizes. Tokens that already equal the new body size (here heading/read) must move too — a bump has to preserve hierarchy, not just enlarge.

### A7. The shell's sidebar header (logo + app name) is shell chrome — an app cannot hide, replace, or re-target it
- **Symptom:** the sidebar shows a white "RocketRide / <APP NAME>" block at the top that navigates to the app store. An app that adds its own brand/home row beneath it shows the app name twice, and owners ask for the shell block to be removed.
- **Cause:** that block is rendered by the shell from `ShellBrandingConfig` (`appName`, `logo`, `iconDark`/`iconLight`), a shell-level branding config. `AppLayout` exposes exactly four props (`sidebar`, `showStatus`, `status`, `children`) — there is no header prop; the `header?: boolean` in the types belongs to `SidebarFooterMenuItem`, not the header. Hiding it would require CSS that reaches into shell chrome, which the styles doctrine forbids and which breaks on any shell update. Every app gets the block (Gridiron shows "RocketRide / GRIDIRON").
- **Fix (app side):** keep exactly ONE in-app home affordance (brand row → dashboard) and accept the shell header. Verified the in-app brand row navigates home even in a separate-root render. Do not attempt to hide shell chrome from inside an app.
- **Note:** the owner reported the in-app brand row "goes nowhere" — it had been clicked while already on the Dashboard, so nothing visibly changed. Verified it navigates from other views. A hover/cursor affordance helps; it is not a bug.
- **Doc gap / platform ask:** document that the header is shell-owned and store-linked, and add a per-app way to hide the sidebar header or let the app's brand row BE the header (e.g. `hideSidebarHeader`, or a manifest-level `ShellBrandingConfig` override).
- **RESOLUTION (2026-09-02):** the header belongs to the shell's **sidebar frame**, not to the app. Rendering the app as **full-screen** — `<AppLayout>` with no `sidebar` prop ("absent = one-column app spanning the full client area") — removes the shell sidebar column and its RocketRide/app-name header entirely; the app draws its own nav rail inside its own tree. That is the right choice for any app that wants its own brand/home affordance: pick the full-screen frame rather than a sidebar app with a duplicate row. It also makes the whole hoisted-sidebar problem class (A6) moot. Doc: the New App wizard's Sidebar checkbox should say it brings a non-removable, store-linked header.

### A6. `AppLayout`'s `sidebar` slot renders OUTSIDE the app's React tree → context hooks throw → blank app (ROOT CAUSE of the "blank page")
- **Symptom:** the app is blank in the real shell (deployed AND App Builder DEV preview) while the preview stub renders fine and `tsc`/`rsbuild`/server build all pass. DEV Console shows `Uncaught Error: useNav must be used within NavProvider`; the dev overlay mislabels it "Dev session failed — the app failed to compile" (it is a *runtime* throw, not a compile error). Other apps in the same org open normally.
- **Cause:** the shell renders `<AppLayout sidebar={...}>`'s `sidebar` element in **its own sidebar column, outside the app's React subtree**. Any app context hook called inside that sidebar (`useNav`, `useLkTheme`, any `useContext` of an app provider) has no provider ancestor and throws. The app's own error boundary cannot catch it (the sidebar is a different subtree), so the whole surface goes blank with no in-app trace. A preview stub whose `AppLayout` renders the sidebar *inline* (same tree) masks this completely — every "verified in preview" claim was blind to it.
- **Fix:** make the sidebar component **context-free**: read nav/theme in the chrome component (which lives inside the providers) and pass them down as plain props; wrap the sidebar element in its own class-based error boundary (works in any tree). Never call an app context hook from anything handed to `AppLayout`'s `sidebar`.
- **Doc gap (HIGHEST):** the `AppLayout` doc must state that the `sidebar` slot is rendered outside the app's provider tree, that sidebar content must be props-only (or carry its own providers), and that a faithful preview harness must render the sidebar in a *separate* React tree. This one sentence would have saved days.
- **Follow-on (same mechanism, found 2026-09-02):** the hoisted sidebar is also outside the app's `#lk-root` **DOM**, so ID-scoped design-system CSS and the `.dark` ancestor class never reach it → the sidebar renders unstyled / wrong theme even once it stops crashing. Fix: scope the design system by a **class** applied to both the app root and the sidebar root, and set the theme class on the sidebar root from a prop. Doc: "anything in the sidebar slot must carry its own scope + theme class."
- **Trap (2026-09-02):** with descendant scoping (`.lk-root .x`), utility classes placed ON the scope-root element itself never match (`.lk-root .border-r` ≠ `.lk-root.border-r`) — the hoisted sidebar root carried `border-r bg-sidebar` and computed `border-right: 0px`. Keep the scope root bare (scope + theme class only) and put utilities on an inner wrapper, or have the codegen also emit a self-form selector (`.lk-root.x`). Caught only because the preview stub now renders the sidebar in a separate React root outside `#lk-root`.

### A1. Tailwind cascade layers lose to the shell's CSS → app renders unstyled/cramped
- **Symptom:** app loads but layout is broken — collapsed spacing, nav crammed, backgrounds only half-applied; looked like "only 25% of the screen."
- **Cause:** Tailwind v4 emits utilities inside `@layer`. Cascade layers lose to ANY unlayered stylesheet, and the shell's own CSS is unlayered — so every app utility was being overridden regardless of specificity.
- **Fix:** in the styles codegen (`tools/gen-styles.mjs`), flatten every `@layer` into plain rules (order preserved) after compiling, and scope everything under the app root `#lk-root`. Also pin an explicit `#lk-root{min-height:100vh;background;color}` so the app surface fills the client area.
- **Doc gap:** the styles guide should warn that Tailwind/`@layer`-based CSS is overridden by the shell unless flattened, and that a MF-remote app must scope + fill its own root.

### A2. CSS scoping to avoid leaking into shell chrome
- **Symptom:** risk of the app's global resets (`*`, `body`, `:root`) restyling the shell.
- **Cause:** a MF remote shares the document with the shell; global selectors leak both ways.
- **Fix:** codegen rewrites `:root`/`html`/`body`/`*` selectors onto `#lk-root`, embeds fonts as `@font-face` data-URIs (no runtime font fetch), and the app renders a single `<div id="lk-root">`.
- **Doc gap:** doc should prescribe root-scoping + embedded fonts as the standard pattern for design-system-heavy apps, since the server build has no PostCSS/Tailwind pass.

### A3. Module Federation bundle caches hard — new deploys don't appear on refresh
- **Symptom:** owner deploys a new version, hard-refreshes, still sees the old app (old bugs, old layout).
- **Cause:** the shell loads the app's `remoteEntry.js`; the browser caches it aggressively and a normal hard-refresh (Cmd+Shift+R) does not clear the MF remote cache.
- **Fix (owner-side):** DevTools → Application → **Clear site data**, then fully quit + reopen the browser. Incognito is the fast confirm test.
- **Doc gap:** the deploy/publish doc must state plainly that MF bundles need a full site-data clear (not a hard refresh) to pick up a new version, and give the incognito test.

### A4. Publish rung vs. browser session — "which version am I actually seeing"
- **Symptom:** confusion over whether a fix is live; app served an older version than the newest registry version.
- **Cause:** publishing points an audience (`@me` / `@team` / `@public`) at a specific version. The browser resolves through the rung for the signed-in user; if only the team rung was updated but the user rung still pinned an old version, the user saw the old one.
- **Fix:** publish the new version to **all** relevant rungs (both team rungs + the user rung); verify with `listDeployments`.
- **Doc gap:** doc should explain the rung model and that the user's personal rung must be updated too, with a "verify which version each rung serves" step.

### A5. App icon shows as a broken image / generic placeholder
- **Symptom:** the app card in the launcher shows a broken image or the generic scaffold icon.
- **Cause:** the scaffold ships a placeholder `icon.svg`; if it isn't replaced with a valid, self-contained SVG, the card looks broken/unbranded.
- **Fix:** replace `apps/<app>/icon.svg` with a real, self-contained branded SVG (no external refs).
- **Doc gap:** the manifest/package doc should flag "replace the scaffold icon.svg before deploy" and require a self-contained SVG.
- **Update (2026-09-02):** the shell requests `/icon.svg` and receives **HTTP 401** — the launcher icon breaks because of platform-side asset auth, not a malformed SVG. Owners should not chase their icon file; report upstream.

---

## B. Data & storage (the "backend")

### B1. `rocketride_sql` cannot be driven on-demand from an app — needs a signed-in cloud identity
- **Symptom:** every store read/write fails with `ROCKETRIDE_CLIENT_ID is not set; RocketRide cloud DB nodes require a signed-in RocketRide cloud identity`.
- **Cause:** the `rocketride_sql` node resolves its per-tenant DB via a server-injected identity. That identity is present only for **server-run deployed/scheduled tasks**, NOT for a task an app spins up via `client.use()` in the browser. Confirmed dead ends: (a) `client.use()` from the app → no identity; (b) deploying the store pipe as a team service + `getTaskToken` → "pipeline is not running" (deployed pipes fire on triggers; they are not persistent query endpoints).
- **Fix:** move app storage off `rocketride_sql` entirely to the shell's **per-user workspace store** (`useWorkspace().appState` + `updateAppState`) — server-persisted, identity-scoped, no cloud-DB requirement. Implemented as an in-memory document store (`data/blobstore.ts`) hydrated from appState and flushed back on writes.
- **Doc gap (HIGH):** the data-migration doc currently implies apps can use `rocketride_sql` directly. It must state that `rocketride_sql` is for **server-run** pipes only, and that **interactive per-user app data belongs in `useWorkspace().appState`** (or a deployed/scheduled ingest pipe), not a client-initiated store pipe. This was the single biggest wrong assumption in the whole migration.

### B2. Pipeline answers can arrive as python-dict STRINGS, not JSON
- **Symptom:** a stage's data stored but rendered empty ("Nothing found", "0% confident").
- **Cause:** the engine sometimes returns an answer as a Python-repr string (`{'k': 'v', ...}`, single quotes) rather than JSON. Storing that verbatim yields an unparseable blob on read.
- **Fix:** the runner peels string answers with a loose parser (`parseJsonLoose`, mirroring rr.py) up to 3 layers; the read layer (`asData`) also recovers python-dict text. A string can never reach storage as data.
- **Doc gap:** doc should note that pipeline answers are not guaranteed strict JSON and apps must parse loosely on both write and read.

---

## C. Environment, accounts & deploy

### C7. App pipelines resolve secrets from the RUNNING user's environment, not the publisher's
- **Symptom (anticipated, confirmed in docs):** an app whose pipelines reference `${ROCKETRIDE_ANTHROPIC_KEY}` etc. works for the publisher and fails for every external installer with "key not set".
- **Cause:** secrets are layered server-side per org → team → user and merged for the *connection* that runs the task. An installed app runs pipelines under the installing user's connection, so their environment is consulted; there is no publisher-scoped secret store for app pipelines.
- **Fix (app side):** bring-your-own-keys — embed the shell's `EnvironmentView` with `requiredKeys` in the app's Settings, preflight each stage for the keys it needs and name the missing one, and minimise the key set (one LLM provider; optional GitHub token).
- **Doc gap / platform ask:** state this constraint prominently in the app docs (it decides launch scope), and add publisher-provided secrets for app pipelines so end users need no keys.

### C1. Two orgs can share the same display name — distinguish by id/devId, never name
- **Symptom:** moving the app "to the rocketride.ai account" looked like a same-org share, but the app id wouldn't publish there.
- **Cause:** the personal (gmail) org and the work (rocketride.ai) org both display as "Shashidhar's Workspace" but are different orgs with different developer ids (`rocketride_ai` vs `rocketride_sb`). An app id's namespace prefix must match the target org's developer id.
- **Fix:** re-namespace the app `rocketride_ai.launchkit` → `rocketride_sb.launchkit` (package.json id+publisher, AppDescriptor id, MF module name, deploy scripts), swap `.env` to the new org's key, redeploy fresh (starts at v1 under the new org), publish to the new org's rungs.
- **Doc gap:** doc should warn that org display names are not unique, that the developer id is the real namespace, and give the exact re-namespace checklist for moving an app between orgs.

### C2. Re-namespacing in place vs. re-scaffolding — DEV session brittleness
- **Symptom:** after moving orgs by editing the app id in place, the deployed build works but the App Builder **DEV** (live-edit) session is more fragile.
- **Cause:** deploy/build accepts an edited id, but the App Builder's DEV session assumes an app that went through its own scaffold under the current org. Editing the id without re-scaffolding leaves the DEV registration inconsistent.
- **Fix / recommendation:** for a clean org move, **re-scaffold** a fresh app via App Builder → New App under the target org, then port the source in. In-place re-namespace is fine for deploy-only but expect DEV-mode friction.
- **Doc gap:** doc should state that moving orgs is a re-scaffold operation, not an id edit, if DEV mode is needed.

### C3. App Builder DEV session ("watch: error") crashes on heavy file churn
- **Symptom:** DESIGN → Preview shows "Dev session failed — the app failed to compile"; status line reads `localhost:3991 watch: error`. Meanwhile the same `rsbuild dev` compiles clean from a terminal.
- **Cause:** the DEV session is a long-lived `rsbuild dev` (run by the editor extension). Reinstalling `node_modules`, swapping `.env`, or renaming files while it runs crashes its file-watcher, and the process stays stuck holding stale module references (and the port).
- **Fix:** kill the stuck dev process (frees the port); the extension respawns a fresh one that reads current code. If it persists, restart the DEV session from the App Builder / reopen the app.
- **Doc gap:** doc should tell owners to stop the DEV session before large dependency/config changes, and how to restart it (it's not a code error).

### C4. SDK websocket reconnect crash (`_debug_message` / `is_connected`) poisons the client
- **Symptom:** long-running scripts/sessions die after the first websocket drop; subsequent calls fail.
- **Cause:** SDK 1.3.0 reconnect path raises on the first drop and leaves the client permanently poisoned.
- **Fix:** shimmed reconnect/health-check in the client accessor; report upstream to the SDK team.
- **Doc gap:** known-issues list for the SDK version; owners with long dev sessions should expect reconnect flakiness.

### C6. The editor extension reverts `.env` to the account IT is connected to
- **Symptom:** after manually setting `.env` to a new org's API key and deploying, a later deploy fails with `App id '<new>.launchkit' is outside your developer namespace — it must be '<old>'` — `.env` silently reverted to the old key.
- **Cause:** the RocketRide editor extension manages the `.env` connection keys based on which account the **extension** is connected to. If the extension is still logged into the old account, it rewrites `.env` back to the old key on reconnect — fighting any manual edit.
- **Fix:** switch the **extension's** RocketRide connection (in the editor, not just the browser) to the target account. Then the extension writes the correct key and stops reverting. Until then, manual `.env` edits are transient — deploy immediately after editing, before the next reconnect.
- **Doc gap (HIGH):** doc must state that `.env` is extension-managed, that moving orgs means switching the **extension** account (browser login is separate), and that the extension login is the real source of truth for which org you deploy to.
- **Durable fix (2026-09-02):** switching the extension account was NOT enough — `.env` reverted again on the next reconnect and killed a deploy. Robust pattern: tooling overlays a separate, gitignored `.env.deploy` (target-org keys) over `.env` with last-key-wins, so the extension may rewrite `.env` freely without affecting deploys. Recommend this for any workflow deploying to an org other than the extension's login.

### C5. Staging session throttling on rapid reconnects
- **Symptom:** deploy/publish calls hang after many rapid API-key connections.
- **Cause:** repeated short-lived connections exhaust the session pool; staging stops answering new connects for a while.
- **Fix:** patient retry with cooldowns (a few minutes) between publish attempts; reuse one connection where possible.
- **Doc gap:** doc should recommend a single persistent client for a deploy session rather than one-shot scripts.

---

## D. Pipeline engine (carried over from pre-migration, still relevant)

### D1. Native `llm_anthropic` node is broken in all lane types (block-list `.strip()` crash)
- **Fix:** run Claude through `llm_openai_api` (profile custom, `base_url: https://api.anthropic.com/v1`). Works in direct AND agent lanes.

### D2. `.pipe` edits have no effect until the pipe is restarted
- **Fix:** restart the pipe (full filename incl. `.pipe`) after any edit, then re-run.

### D3. Engine "LLM error" flakiness scales with LLM round-trips
- **Fix:** tool-heavy stages fail more; cap and batch tool loops rather than relying on retries. (Pricing loop: 40%→100% success after capping.)
- **Signals lane (2026-09-02):** on GMI Qwen the scan takes 2–7+ minutes and one run stalled past 7 min after `llm_openai_api_1: Failed to get valid JSON response after 4 attempts` inside the agent. The stage is correct but not yet dependable; needs a reliability pass through the eval harness (fewer mandatory passes / waves, or Claude via compat with a compact output contract) before launch.

### D4. `tool_http_request` multi-entry `urlWhitelist` unbinds all agent tools
- **Fix:** one whitelist entry using regex alternation.

---

## E. Verification lessons (how we caught / mis-caught things)

- **E1. An API-key preview is NOT a faithful test of `rocketride_sql`.** The store only resolves with a signed-in user identity, so API-key preview successes were flukes. Visual/CSS preview is faithful; store-behavior preview is not. → Build a preview harness that mirrors the shell's `appState` (which behaves identically in preview and shell) for data verification.
- **E2. Verify in the destination environment, not a proxy.** Several "verified" claims for the data layer were unreliable because the proxy (API-key client) differed from production (signed-in shell). State the environment a verification actually covers.
- **E3. Make the app fail loud, not blank.** An uncaught render error blanked the whole surface with no cause. → Wrap the app in an error boundary that prints the error + component stack, so any failure is diagnosable without the browser console.
- **E4. Confirm WHICH app/screen is being reported before diagnosing "blank page".** The shell auto-opens the **last-active app**. Two "Launch Kit is blank" reports were actually (a) the shell itself not yet loaded (browser cache) and (b) a *different* app (Gridiron) in its own loading state — Launch Kit was never open. Hours went into diagnosing an app that wasn't on screen. → Owners: check the header/footer app name in the screenshot first; open the app explicitly from the switcher. Doc gap: the troubleshooting guide should say "the shell remembers your last app — confirm the app name in the title bar before reporting a blank."
- **E5. Full shell-integration audit method (what "the code is sound" actually means).** Verified against the real `shell.d.ts` (not a stub): every symbol imported from `shell` exists (`AppLayout`, `useAuthUser`, `useShellConnection`, `useWorkspace`); `useWorkspace`/`AppLayout` are officially sanctioned for apps; React share-scope aligned (`^18.2.0` singleton on both sides); `AppDescriptor` id/mount correct; `tsc` + `rsbuild build` + server build all pass. → Doc gap: publish this checklist as the standard "is my shell app sound" audit.
- **E6. A preview harness must reproduce the shell's rendering TOPOLOGY, not just its API.** An inline-sidebar stub passed every check while the real shell blanked, because the shell renders the `AppLayout` sidebar in a separate React root outside the app's DOM. Hardening the stub to do the same (separate `createRoot` on a body-level host) made it reproduce the context-hook crash AND the CSS-scope loss, and caught a third bug (root-level utilities) before deploy. → Doc gap: ship a reference harness that mirrors slot topology; "verified in preview" is meaningless otherwise.
- **E7. Class-name changes need a styles regeneration; the TypeScript build cannot catch a missing utility.** Adding `w-[220px]` and rebuilding passed `tsc` + `rsbuild` but rendered a 147px column: the design system is a generated artifact (`tools/gen-styles.mjs` scans source for class names), and the server build deliberately has no Tailwind pass. → Fix: `deploy-app.mjs` now runs `gen-styles` as a pre-step so a deploy can never ship stale styles; the preview drive asserts a computed style for any new layout class. Doc gap: state that the generated stylesheet must be regenerated (and committed) after any className change.

---

## F. Observability & tracing

### F1. `pipelineTraceLevel` on `use()` does NOT put step traces in `chat()` responses — step-level detail arrives as FLOW monitor events
- **Symptom:** with `pipelineTraceLevel: 'summary'` set on `client.use()`, a successful 88 s pipeline call's `chat()` response carried no `_trace`; the per-call trace row recorded timing, outcome and question correctly but zero steps.
- **Cause:** the `_trace`-in-response behaviour belongs to the one-shot execute path. For a persistent task (`use()` + `chat()`), the trace level enables `apaevt_flow` events, which are delivered over the DAP monitor subscription (`addMonitor({ token }, ['flow', ...])`), not embedded in chat answers. The shell re-emits engine events to apps as `shell:event` with `{ event: DAPMessage }`.
- **Fix:** two-layer tracing. Layer 1 — a per-call trace row (pipe, ms, question, ok/error) linked to the triggering run via a current-run tag set by `runJob` — needs no subscription and already maps a failed action to the failing pipeline call. Layer 2 subscribes to FLOW/TASK/OUTPUT events for the task token while a call is in flight and attaches the step timeline to the trace row.
- **Doc gap:** state explicitly which path returns `_trace` inline (execute) versus via monitor events (use/chat), and give the app-side recipe (`addMonitor` + `shell:event`).
- **Layer 2 VERIFIED (2026-09-02):** `client.addMonitor({ token }, ['flow'])` on the task token plus `pipelineTraceLevel: 'summary'` on `use()` delivers one `apaevt_flow` per component step. The app receives them through `useShellEvent('shell:event', …)` — the sanctioned hook; `useShellConnection()` exposes no `.on` — buckets them by `body.project_id` (the pipe's project id from its `.pipe` file, since flow events carry no token), and merges them into the per-call trace row. A real understand run produced **84 steps** (agent → llm_openai_api → tool_github / tool_firecrawl → memory → response_answers). Verified in the preview by forwarding the client's `onEvent` into a bus behind the stub's `useShellEvent`. Remaining check: confirm once in the real shell that its `shell:event` re-broadcast includes FLOW events (if a real-shell run shows 0 steps, the shell filters them — a platform ask).
- **Presentation (2026-09-02):** a raw step dump is unreadable — a clean understand run is ~84 steps. Present traces collapsed: the components involved plus ONLY the steps that errored, with a "Show all N steps" toggle into a scrollable panel. That is what makes a failed action map to its pipeline step at a glance; recommend it as the default trace UI for apps.

### F2. Navigator chat: persona + app map in the question text, model output validated against the real app map
- **Pattern:** a `chat → llm_openai_api (Claude via compat) → response_answers` pipe with NO agent or tools; the app prepends persona, view/stage map, rules, and a strict JSON action contract to each message (same as every stage's `build*Question`), plus CONTEXT (the user's real launches from the workspace store) and the last six turns. The prompt lives in one JSON file read by both the app and the test probe.
- **Safety:** the app validates `action.view` against the real view list and `action.projectId` against the user's real launches; anything else degrades to reply-only. A hallucinated view can never navigate.
- **Result (2026-09-02):** 8/8 on staging — correct workspace/launches/new-launch/runs/settings/home actions, question-only answers with `action: null`, and a clarifying question on an ambiguous "open my launch" with two launches.
- **Doc gap:** recommend this shape for in-app assistants: no agent unless tools are needed; contract in the question; validate every model-proposed action client-side.
- **Transport note:** the shell's `useChatMessages` hard-wires its own send path (`sendMessage(text, client, token)`) and cannot prepend context or parse a structured answer. For a custom transport, own the message state (`ChatMessage` = `{id, text, sender, timestamp}`) and use `ChatView` alone — it only renders and collects input. Show the reply as a toast when an action changes the view, or the user never sees it.

### F3. A "successful" agent run can hide failed tool calls — `tool_http_request` caps concurrency at 2 in-flight
- **Symptom:** the signals scan completes (`done`, no top-level error, 102 trace steps) but the app stores zero signals.
- **Cause (found in the trace):** two `tool_http_request_1` steps failed with `Too many concurrent requests: max 2 in-flight`. The agent fans out its thread fetches in parallel; the HTTP tool's default cap is 2; the failed calls starve the agent, which still returns a well-formed empty answer. Pipeline status stays green because the failures are inside tool steps.
- **Fix:** `tool_http_request` exposes `maxConcurrentRequests` (also `rateLimitPerSecond`/`rateLimitPerMinute`) — raised to 6 — and the agent's instructions now require one tool call at a time with a sequential retry on that error. After any `.pipe` edit the running task must be terminated (`use()` then `terminate(token)`), or the app's `useExisting: true` keeps the old config. Verification: pass 4 of the Phase 1b drive.
- **Doc gap:** document the HTTP tool's concurrency defaults, and that step-level FLOW tracing is the only way to see tool failures inside a green run; recommend agents that fetch many URLs set `maxConcurrentRequests` explicitly and serialise calls.

### F4. Signals gate rejects every GitHub hit as "app's own content" when the app's repo is on GitHub
- **Symptom:** the signals scan finishes clean (156 steps after the concurrency fix) yet the stage stays empty; `signals_meta` shows the finder returned candidates that were all `dropped_by_gate` with reason "app's own content" — for repos unrelated to the app.
- **Cause:** the gate derives "own domains" from `[repo_url, site_url, app_url]` by hostname and tests `url.includes(domain)`; a GitHub repo URL yields the bare host `github.com`, so any GitHub issue anywhere matches. Generic code/community hosts must never count as an "own domain"; the own-repo check needs the `host/owner/name` path.
- **Also observed (quality, not a bug):** low recall — three generic queries, no fresh Reddit/HN threads in the window (Reddit API access is still pending), coverage limited to GitHub/StackOverflow. The empty state said only "No signals yet." and hid the finder's coverage notes, queries and drop reasons.
- **Fix:** path-aware own-content matching for code hosts; surface `signals_meta` (queries, coverage notes, dropped-by-gate with reasons) in the empty state so an empty scan is explainable. Found only because the trace + meta were captured — a green run with an empty result is otherwise invisible.
- **Doc gap:** owners porting gate logic should treat generic hosts (github.com, gitlab.com, reddit.com, news.ycombinator.com) as never-own; and every "no results" state should show what was searched and why candidates were dropped.
- **Verified on a real run (2026-09-02):** with the fix, a live scan produced richer queries (ICP-pain phrasings, `site:reddit.com` searches), zero gate drops on unrelated URLs, one rescore rejection, and one kept signal — the first non-empty signals result through the shell app.
- **Fix status (2026-09-02):** shipped in v10 — shared hosts match only by the app's own path (`host/owner/name`), golden parity kept (43/43 incl. a new F4 regression test), scan report rendered in the empty state (verified seeded). Domain tests: `apps/launchkit/node_modules/.bin/tsc apps/launchkit/src/domain/*.ts --outDir tools/tests/domain/.build --module commonjs --target es2022 --moduleResolution node --esModuleInterop --skipLibCheck && node --test tools/tests/domain/*.test.mjs` (a bare `npx tsc` at the repo root resolves to a placeholder package, not TypeScript).

### C8. Running the engine locally on Apple Silicon — both documented paths are blocked
- **Symptom:** development against staging is slow and occasionally drops sessions, so the obvious move is a local engine. Neither documented path works on an arm64 Mac out of the box.
- **What was tried (2026-09-03):** (a) **Docker** — `ghcr.io/rocketride-org/rocketride-engine:latest` publishes **no arm64 manifest**; the amd64 image starts under emulation, then dies bootstrapping its Python AI dependencies: `No solution found when resolving dependencies … no version of onnxruntime-gpu` for the emulated platform. (b) **Native binary** — `build/apps/engine/engine` from the server repo is a real arm64 Mach-O, but the build never staged its bundled JRE (`dyld: Library not loaded: @rpath/libjli.dylib`, expected at `build/apps/engine/java/jre/lib/`) and the machine has **no JDK installed at all**, so it needs a JDK plus a rebuild.
- **Fix / ask:** publish an arm64 engine image (or make the AI dependency set optional so the amd64 image boots under emulation); document the JDK prerequisite and the runtime-staging step for source builds. Until then, local engine work costs a JDK install plus a full C++/Java/Python rebuild.
- **Workaround in place:** `tools/gen-preview-env.mjs local|staging` switches only the preview harness's dev engine (the harness builds its own client), so flipping to local is one command the moment an engine is available; deploys read `.env` + `.env.deploy` and are unaffected.

### D5. Dropping a second LLM provider: Qwen → Claude on the two stages that used it (validated 2026-09-03)
- **Why:** every provider is a key an end user (or the publisher) must supply. Removing GMI/Qwen cut the app's key set from five to four (Claude, Firecrawl, Exa, optional GitHub) and, with Claude publisher-supplied, leaves a customer just Firecrawl + Exa.
- **Risk going in:** both stages were *tuned* on Qwen, and Claude has a documented failure mode here — large JSON output killing the agent loop (the reason `lk_targets` needed a compact output contract).
- **Result — no regression, measurable improvement.** `lk_understand`: 80 trace steps, zero step errors, 0.95 confidence with richer sourcing notes (it reports which sources read thin). `lk_signals`: 200 steps (vs 110–156 on Qwen), zero step errors, **13 search queries vs 3**, **3 signals stored vs 1**, 5 candidates rejected by the relevance judge, zero gate drops.
- **Method that made this safe:** swap the `llm_openai_api` custom block, **rotate the pipe's `project_id`** so a fresh task picks up the new config (`useExisting: true` otherwise reuses the old one), then run each stage end-to-end through the app UI and read the stored data, not just the run status.
- **Doc gap:** document that changing a pipeline's model requires a task restart (or id rotation) to take effect, and that stage output should be re-validated from stored data — a green run can still store nothing.

## Open items to fold into the docs

- Reddit Data API self-serve is closed (2026) — manual approval only; note the alternative flows.
- Observability: the platform exposes task/flow/output events via the SDK monitor + `pipelineTraceLevel` on runs — document as the standard app-tracing mechanism (see the tracing work in progress).
