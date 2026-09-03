# Launch Kit — Engineering Understanding (pre-decision brief)

Status: brainstorming. This is what I understand + what I verified against the live stack.

> **Direction updates (Aug 5, 2026)** — see `launchkit-features-brainstorm.md` (feature catalog + decisions) and `launchkit-launch-channels.md` (channel market research):
> - Store owns pricing/checkout/subscriptions; Launch Kit develops against a **mock store API** (listing, plans, ref-coded signup events) so nothing waits on store integration. The mock contract is also the integration spec for the store team.
> - **tryclean:** researched — it's B2B-CRM-centric GTM; not core infra. Optional v2 integration for B2B store apps. §4's tension is resolved: Mechanisms A + B in, C out.
> - **Attribution** is a first-class requirement: every generated link carries a ref code; store records it at signup. This powers both the success metric and cross-app learning.
> - Targets pipeline = ranked **curated venue seed DB** (Postgres) + live niche discovery that writes back into the DB.
> - **v1 scope locked:** profile/ICP substrate (F1–F6) + pricing (F7) + store-listing optimization (F8) + ranked targets (F16) + intent-signal reply queue (F17). Demo video: script/storyboard in v1; **GMI-generated video in v1.5** (`tool_http_request` → GMI video API; delegate to PromptReel when it ships).

---

## 1. What the app actually is, in engineering terms

Not a chat app. Not an autopilot. It is a **stateful, human-gated workflow engine** where each stage is one stateless RocketRide pipeline invocation, and all the interesting state (versions, edits, approvals) lives in Postgres.

```
Next.js (review/approve workspace)
   │  REST
FastAPI (state machine + gates + pipeline orchestration)
   │  SDK invoke
RocketRide pipelines (all intelligence, stateless)
   │
Postgres (project · app_profile · asset · target · launch_plan + run refs)
```

The three human gates (profile → assets → targets) are **backend state transitions**, not pipeline concepts. Pipelines never block on a human. This is why 4 separate `.pipe` files beat one mega-pipeline: each gate is a natural process boundary, and each stage must be independently re-runnable when the builder edits something upstream.

Core engineering primitive: **every artifact is versioned, editable, regenerable, and traceable to the pipeline run that produced it.** That single requirement drives most of the schema.

## 2. Node catalog verification (blocking open question #1) — mostly PASS

Checked `.rocketride/services-catalog.json` (140 components on the connected server).

| Need | Node | Status |
|---|---|---|
| Read repo | `tool_github`, `tool_git` | ✅ |
| Scrape live site | `tool_firecrawl` | ✅ |
| Find launch venues | `tool_exa_search`, `tool_tavily`, `search_exa` | ✅ |
| Reason/synthesize | `agent_rocketride` (+`llm_anthropic`/`llm_openai`, `memory_internal`) | ✅ |
| Structured JSON out | `extract_data` (invoke: llm), `response_json` | ✅ |
| Arbitrary API calls | `tool_http_request` | ✅ |
| Publish to socials (v1.5) | **`tool_n8n`** + `tool_slack`, `tool_gmail` | ✅ — this is the answer for v1.5 |
| Scheduling | — | ❌ no cron source (sources = chat, dropper, filesys, telegram, webhook). External scheduler → webhook, as the README says |
| **Image / video generation** | `llm_gmi_cloud` is deployed but **text-only** (questions→answers; rejects image input). GMI *platform* video gen reachable via `tool_http_request` → GMI API (we hold a key); clean path later = GMI-video node / PromptReel app | 🟡 v1.5 via HTTP spike |

**Important finding:** `image_generate`, `talking_head`, `design_hero`, `design_brief` exist in the `nodes/src/nodes/` source tree but are **not in the connected server's catalog**. Only `video_composer` (image→video), `tts_openai`/`tts_elevenlabs`/`audio_tts`, `thumbnail`, `frame_grabber` are live. → **Confirms the README's recommendation on open question #2: v1 produces a demo-video *brief* only.** Revisit if/when the design/image nodes ship to the deployed catalog.

**Second finding:** `tool_n8n` ("trigger n8n workflows from a pipeline or agent") means v1.5 publishing does **not** need custom per-platform nodes. n8n already owns the OAuth and the connectors for X/LinkedIn/Reddit/Discord. RocketRide stays the brain; n8n is the hands. Big scope reducer.

## 3. Pipeline shape implications (lane-level)

RocketRide is a typed-lane DAG. Practical consequences:

- These are **agent-shaped, not RAG-shaped** pipelines. The pattern is `webhook → question → agent_rocketride → answers → response_*`, with `tool_github`/`tool_firecrawl`/`tool_exa_search` hanging off the agent via `control`, not via lanes.
- Agents output free-text `answers`. To get the reliable JSON the frontend renders, either force schema in the agent instructions + `response_json`, or post-process with `extract_data`. **Needs a deliberate decision — it's the difference between a workspace that renders and one that half-breaks.**
- Asset fan-out works natively: one source → N parallel agent branches → N `response_*` nodes with distinct `laneName`. But **"regenerate one asset"** is the real requirement, which argues for a parameterized single-asset path rather than always running all six branches.
- `tool_pipe` exposes an inline pipeline as an agent tool — an option if we want composition instead of orchestration in FastAPI.

## 4. The tension I have to flag

The brainstorm ask ("scan all circles and connections from all platforms, publish everywhere, get real users and subscribers by end of the same day", à la tryclean.ai) **directly contradicts three of the four non-negotiables in the README**:

- NN#2 forbids connection-graph scraping → "scan your whole circles from all the platforms" is exactly that.
- NN#3 forbids the same-day-users promise → "subscribers by end of that same day" is exactly that.
- NN#4 (quality over volume) is the opposite of "all possible platforms".

These aren't stylistic preferences — they're the difference between a store-trust asset and banned accounts + a blacklisted domain. **Someone has to decide which document wins before we scope pipelines.** My read: keep the non-negotiables, and get most of the emotional payload of the tryclean idea through the compliant path below.

### The compliant version of the "circles" idea

First-party, consented, official-API-only — and the nodes already exist:

- **Owned-audience activation:** builder OAuths their *own* X / LinkedIn / Reddit / Discord / Slack accounts. We draft; they confirm; n8n publishes. Their network, their accounts, their consent.
- **Warm list from their own data:** `tool_gmail` / `tool_drive` / `tool_calendar` are in the catalog. With explicit opt-in, we can build a "people who'd care about this launch" list from the builder's **own** mailbox and calendar — first-party data they already own, not a scraped graph. Draft personal intros, never bulk-send.
- **Honest same-day claim:** *"launch-ready package today, and it goes live today."* Reach today is deliverable. Subscribers today is not, and promising it burns the store.

## 5. Open decisions for the next step

1. **Non-negotiables vs. the tryclean framing** — which wins? (Blocks scope.)
2. **Pipeline count/granularity:** 4 stage-pipelines as specced, vs. 3 + parameterized single-asset regen, vs. fewer-bigger-agents. Trade-off is latency and regen cost vs. graph count.
3. **Structured output strategy:** agent-instructed JSON + `response_json`, or `extract_data` post-pass. Affects every frontend view.
4. **Voice/tone capture** (README Q3): inferred from their site copy is nearly free — we already scrape it in `understand`. Toggles are cheap. Writing sample is the most accurate and the most friction.
5. **Reddit / Show HN treatment** (README Q4): dedicated community-native prompt + an explicit "this will get you flamed if you post it as-is" warning, or cut those targets from v1.
6. **v1.5 publishing = n8n?** If yes, that changes the backend (webhook callbacks, per-platform auth storage) more than it changes the pipelines.
7. **Clean (tryclean.ai) conversation** (README Q5) — partner vs. build-adjacent. Worth resolving before we design anything in their space.

## 6. What I'd want to look at before we commit

- `ROCKETRIDE_PIPELINE_RULES.md` + `ROCKETRIDE_COMMON_MISTAKES.md` in full (only skimmed the component reference so far).
- The Extractly sibling app, for the FastAPI ↔ pipeline wrapper pattern we should copy rather than reinvent.
- `agent_rocketride` schema (`max_waves`, tool budget) — targets/understand are long-horizon agent runs, and wave limits will bite.
