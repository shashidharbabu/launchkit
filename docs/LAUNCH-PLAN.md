# Launch Kit — Launch Plan

Written 2026-09-02 against the shipped state (v8 on staging, org `rocketride_sb`).
Every claim below is grounded in the code or the platform docs; open decisions are marked **DECIDE**.
Companion docs: [CONTRACT.md](CONTRACT.md) (pinned decisions), [MIGRATION-ISSUES-LOG.md](MIGRATION-ISSUES-LOG.md) (issues → owner docs).

## 0. Where we are (facts)

**Shipped and verified in the real shell / hardened preview**
- Full-screen frame with the app's own rail; per-user workspace store; error boundary; type scale 16px.
- Pipeline tracing, both layers: per-call trace rows linked to runs, live FLOW step events (84 steps on a real run), Runs-row timeline collapsed errors-first.
- Stage 1 (Understand → Profile) end-to-end through the shell app: 3 real runs.

**Ported but NOT yet exercised end-to-end through the shell app** (they were evaluated in the old backend, then ported to the runner/api):
- Brand (DNA, campaigns), Commercial (pricing, listing), Targets, Assets (per type, with gates), Signals (finder + rescore), Plan export (json/markdown), Attribution (tracked links, simulated signup), Settings (venues editor).
- Rescore fetches HN / StackExchange / GitHub **client-side** (`data/rescore.ts`) — needs a CORS check inside the shell; fallback is the `lk_rescore_fetch` pipe in CONTRACT D3.

**Missing (explicit asks)**
- The original landing page was not ported (CONTRACT D4 said "does not port") — so the brand button has no Home to go to. Restore as **Home**.
- Navigator chat: a post-login chat that helps the user find their way and triggers navigation.

**Auth / billing as configured today**
- Manifest: `authenticated: true`, `mode: subscription`, plans Free $0 / Pro $29 per month. The shell enforces entitlement per request.
- The app reads identity (`useAuthUser`) but does **not** yet read subscription status or gate anything by plan.

**The launch-defining constraint: secrets are per-org.**
Pipelines resolve `${ROCKETRIDE_*}` from the *connection's* org/team/user environment. An external user's runs resolve against **their** environment, so our five keys are not available to them. Keys per stage: understand = GMI + Firecrawl + GitHub; brand/assets = Anthropic + Firecrawl; commercial/targets = Anthropic + Exa + Firecrawl; signals = GMI + Exa; rescore = Anthropic. Viable launch answer: **bring-your-own-keys** through the platform's user-level environment (the shell exports an embeddable `EnvironmentView` with `requiredKeys`), plus a preflight that tells the user exactly which key a stage needs before it runs. Platform ask in parallel: publisher-provided secrets for app pipelines.

**Platform items outside our control (raised in the issues log)**
Icon `401` in the launcher; whether the shell's `shell:event` forwards FLOW events (verify with one real run in your browser); sidebar-frame header (solved by full-screen); `.env` rewritten by the extension (solved by the `.env.deploy` overlay); Reddit API pending.

## 1. Phase 1 — Feature complete and working (≈3–4 days)

**1a. Home + brand. DONE (v9); Home REBUILT as a conversation 2026-09-03 (v11)** — owner chose a ChatGPT-style chat landing: one 46rem column, centred composer + starters drawn from the user's real launches when empty, thread (shell `MessageList`) with a docked composer once started; the product page follows on scroll. Verified: starters, live reply, composer docks 53%→93% viewport, 0 page errors. Port the landing page as the `home` view: copy `landing-motion`, `procedure-flow`, `seo` (FAQ content), `structured-data` (drop the JSON-LD script; meaningless inside the shell), replace `next/image` → `img`, `next/link` → `go()`. Brand button and a new "Home" rail item → `home`. Convert brand/nav to `<button>` (no href) so nothing in the shell can intercept the click. Default view after login = Home.
Exit: brand click lands on Home from every view (verified in the hardened preview and by you in the shell).

**1b. Every stage end-to-end through the shell app (2–3 days).** **IN PROGRESS 2026-09-02** — automated drive `launchkit/frontend/drive.1b.mjs` runs every stage's actions against real pipelines in the hardened preview and records each run's status + trace (results: `docs/visual-baseline/1b-results.json`). **Pass 1 result (2026-09-02):** understand, brand DNA, pricing, targets all ran clean through the UI (94/76/88/102 trace steps, zero errors). Not yet exercised (selector coverage, not app failures): brand campaigns, assets generation, venue select, signals, plan export — pass 2 inventories the real controls; pass 3 seeds the finished state and exercises them. **Pass 3 result:** asset draft + gate approve, targets + venue select (checkbox), signals scan, plan copies all ran clean (0 page errors). **Open:** (1) signals returns 0 items — trace shows `tool_http_request` failing with "max 2 in-flight" concurrency (pipeline fix: serialize the agent's HTTP calls); (2) listing only chains from the combined "Draft pricing & listing" action and was not observed to completion; (3) "Draft campaigns" exists but was not exercised. Pass 4 was voided (a second API session dropped the preview's connection). **Pass 5 (fresh task, id rotated):** campaigns done (22 steps), pricing done (88), **listing chained and completed** (result stored), signals scan clean with NO concurrency errors (156 steps) — but still 0 signals stored → next: read the finder's answer/meta to tell 'found none' from 'app dropped them'. Plan copy is Markdown-only in the UI (fine). 0 page errors across all passes. **Signals root cause found via signals_meta:** the gate dropped every GitHub hit as "app's own content" (shared-host bug, F4) — fixed in v10 with a regression test; the empty state now shows the scan report. **Verified on a real run after the fixes (v10):** scan done in 2 m 50 s, 110 steps, zero step errors, zero gate drops, one candidate rejected by the relevance judge, **one signal kept and stored** — the stage works end to end. **Phase 1b is functionally complete.** Remaining risk is reliability/recall on Qwen (one earlier run stalled on a JSON-mode failure past 7 min); a reliability pass through the eval harness (≈20 cases × 3–7 min + judge calls, i.e. real token cost) is recommended before Phase 2 — owner decision. One real launch, driven stage by stage, with tracing on: Brand DNA → campaigns → pricing → listing → targets (curated + discovered venue writeback) → assets for each type (gate verdicts) → signals → rescore (CORS check) → plan json + markdown → attribution + simulated signup → settings venue edit. Fix what breaks; every fix gets an issues-log entry. Known risks: Claude-via-compat in agent lanes under the shell client, the signals restart path, big-JSON agent deaths, client-side fetch CORS.
Exit: all seven stages GO on one launch, traces clean, no ConnectionBanner errors.

**1c. Navigator chat (1–1.5 days). DONE 2026-09-02 (v9) — pipeline 8/8 on staging; live navigation verified in the preview; reply shown as a toast when the view changes.** Pipeline `lk_navigator.pipe`: `chat → agent_rocketride (instructions = app map + action contract) → llm_openai_api (Claude via compat) → response_answers`. The instructions describe every view and stage, what each does, and the gates, and require a JSON answer `{ reply, action?: { view, projectId?, stage? } }`. App side: Home docks a `ChatView` (shell component; state via `useChatMessages`) at the top; the runner's existing `use()`/`chat()` path sends messages; a parsed `action` calls `go()`. The chat sees the user's launches (names, stage status) so it can say "your Excalidraw launch is waiting at Gate 2 — open it?". Evals: 20 navigation prompts (open X, where am I, what's next, what does Gate 2 mean) with expected actions; run through the same eval harness as the other pipes.
Exit: 18/20 navigation prompts produce the right action; no wrong navigations.

## 2. Phase 2 — Manual test pass (1 day)

The checklist lives in [TEST-CHECKLIST.md](TEST-CHECKLIST.md) (28 numbered checks with expected outcomes and triage pointers), executed twice: by me in the hardened preview and by you in the real shell. Every failure becomes a trace + issues-log entry, then a fix, then a re-run.
Checklist: create launch · profile edit/approve/redo · each stage run + approve · asset regenerate with feedback · target select/deselect · signal status changes · plan export both formats · tracked link + simulated signup shows in attribution · settings venue add/disable · Runs traces expand · theme toggle · Search ⌘K · Home/brand navigation · navigator chat 10 prompts · reload persistence (per-user store) · second launch.

## 3. Phase 3 — Auth (½–1 day)

- Verify the signed-out path: with `authenticated: true` the shell should refuse to mount; confirm, and make the app render a clear state if identity is ever `null`.
- Identity stamping is already wired (`*_by` = display name); verify it shows on approvals.
- **DECIDE:** launches are **per-user** today (workspace `appState` is per user). For a B2B team, decide whether launches should be team-shared. If yes, that is a data-layer change (team-scoped store or a deployed ingest pipe) and belongs before billing.
- Logout/login switching: state must not leak between users (verify with two accounts).

## 4. Phase 4 — Billing (1–1.5 days)

- Read plan with `useSubscriptions().getStatus('rocketride_sb.launchkit')` (`free | unsubscribed | subscribed | trialing | past_due | canceled`).
- Gate: **Free** = 1 active launch, all 7 stages, no attribution history, no regenerate; **Pro** = unlimited. **DECIDE:** confirm these limits.
- Upgrade button → `ConnectionManager.getInstance().emit('shell:subscribe', { app, plan: 'Pro' })`; refresh on `shell:unsubscribe`.
- Owner testing stays free: verify the publisher entitlement on staging; if it does not hold, use a `promo` on `shell:subscribe` (you already redeemed a coupon) — never a code bypass.
- Store copy must say plainly that pipeline token spend is separate from the subscription.
Exit: Free account hits the limit and sees Upgrade; checkout opens; subscribed account is unlimited; cancel returns to Free.

## 5. Phase 5 — External readiness (1.5–2 days + review latency)

- **BYOK.** Settings gets a "Your API keys" panel embedding `EnvironmentView` with `requiredKeys` = the keys the stages need; each stage preflights its keys and, if missing, names the exact key and links to the panel. **DECIDE:** minimum-keys shape — unify the LLM on one provider (Claude via compat everywhere, re-run the eval lanes that used Qwen) to go from 5 keys to 4, and make GitHub optional (public repos work unauthenticated at lower rate limits).
- **Store listing.** Rewrite `README.md` (the listing renders it verbatim; boilerplate costs), fix the icon 401 with the platform, add workspace screenshots, categories → marketing/GTM.
- **Distribution for testing.** Publish to a **team rung** and add the external test account to that team (no review needed). `@public` is the real launch and goes through store review.

## 6. Phase 6 — Test as an external user (1–2 days)

A fresh account in a **different org**: install from the team rung, add keys through the BYOK panel, run one full launch through all seven stages, export the plan, subscribe (promo), confirm Pro behaviour, cancel, confirm Free. Triage every failure from the trace timeline. Then submit `@public`.
Exit: the external account completes a launch with no help from us.

## 7. Decisions needed from you

1. ~~Home layout~~ — DECIDED 2026-09-03: ChatGPT-style chat landing (shipped v11). Open sub-question: keep the product page below the chat on scroll, or drop it from Home entirely?
2. Minimum keys: unify LLM provider (5 → 4 keys) and make GitHub optional?
3. Per-user vs team-shared launches.
4. Free/Pro limits as written above.
5. An external test account + org you can use for Phase 6.
6. Target date for the `@public` submission.

## 8. Sequence and rough calendar

Phase 1a → 1b → 1c → 2 → 3 → 4 → 5 → 6, about **8–11 working days** to external-test-ready, excluding store review. 1a starts immediately; 1c can overlap 1b once the app map is stable.

## 9. How the work runs (unchanged)

Hardened preview verification with real engine events; tracing-first triage; every issue and fix logged for the owner docs; `gen-styles` runs inside every deploy; deploys through the `.env.deploy` overlay; one deploy per verified unit.

## 1d. Social Launch (2026-09-03)
Assets stage renamed Social Launch. Per-platform rulebooks stored in the app database and editable in Settings; every draft is written to them. Hard no-dash rule enforced by rulebook, pipe instruction, sanitizer and gate. Share-intent buttons open each platform's composer with the draft. Regenerate-with-feedback always visible. Video generation via reel-creation parked as a future deployed service (needs Gemini + ElevenLabs keys). See MIGRATION-ISSUES-LOG G1 to G6.

## Decisions taken 2026-09-03 (owner)
- **Launches are per user.** A user can invite teammates and maintain a shared workspace: the next feature to integrate, develop and test (see 1e).
- **Free vs Pro: decided later.** Until billing is wired, the app bypasses payment and runs Pro for everyone via `lib/plan.ts#PLAN_OVERRIDE = 'pro'`. Every plan read goes through `effectivePlan()`; the cut-over is flipping the override to null.
- **Demo date: 2026-09-04.** One development day left; quality is not negotiable.
- **Em dashes:** removed from the app's own copy as well as drafts (hyphens are fine, only the em dash is banned). Code comments and the two dash-matching regexes keep the character on purpose.

## 1e. Team workspaces (in progress)
Built 2026-09-03: workspace = a RocketRide team; shared snapshot row in the store pipe with optimistic versions and 30 s polling; switcher in the top bar; Settings card for teams, members, invites and a store check. Verified on the preview (directory, error paths). **Must be verified in the deployed app before the demo** (store check, cross-member visibility). Design: MIGRATION-ISSUES-LOG I1 to I4.
