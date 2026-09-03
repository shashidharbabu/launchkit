# Launch Kit v1 — Feature → Pipeline Map & Honest Dependency Audit

All node facts verified against `.rocketride/services-catalog.json` + `.rocketride/schema/*.json` (connected server, 140 components) on Aug 5, 2026.

---

## Part A — The honest headline

**The AI work is ~100% RocketRide. The app is not.**

Roughly: **35% of Launch Kit is pipelines, 65% is a conventional web app.** That's not a criticism of RocketRide — it's exactly the architecture the README describes ("pipelines do all the intelligence; the backend manages state and approvals"). But it should be said plainly before we estimate anything:

- Every *thinking* step maps to a pipeline. No feature in v1 needs an AI capability RocketRide can't reach.
- Every *remembering, approving, versioning, scheduling, linking, and rendering* step is FastAPI + Postgres + Next.js. Pipelines are stateless invocations; they cannot hold a draft between gates, dedupe against last week's run, or know that the builder already replied to a thread.

**And every pipeline needs at least one paid external API key.** RocketRide nodes are the *plumbing* to GitHub/FireCrawl/Exa — not replacements for them. There is no "reach the web" capability that doesn't bottom out in someone's paid API.

---

## Part B — Feature → Pipeline map

| # | Feature (plain) | Pipeline | % pure pipeline | External deps beyond nodes | Backend must do |
|---|---|---|---|---|---|
| 1 | **Figures out what your app is** (profile, ICP, differentiators, proof, voice) | `lk_understand.pipe` | **90%** | GitHub token (free), FireCrawl key (paid), LLM key | Store versioned profile, Gate 1 approval, handle builder edits |
| 2 | **Tells you what to charge** (competitor pricing → tiers) | `lk_commercial.pipe` | **85%** | Exa key (paid), FireCrawl key, mock Store API | Persist pricing rec; re-run trigger when profile edited |
| 3 | **Rewrites your App Store listing** | `lk_commercial.pipe` *(same file, second branch)* | **90%** | Mock Store API (read current listing) | Diff old vs new listing; push-back to store later |
| 4a | **Tells you where to launch** (ranked venues + rules) | `lk_targets.pipe` | **80%** | Exa key, FireCrawl key, Postgres | Seed the ~100-row venue DB (one-time, human-curated); write discovered venues back; Gate 3 selection |
| 4b | **Writes the posts for each place** | `lk_assets.pipe` | **95%** ⭐ purest | LLM key only | Per-asset versioning, edit/approve, single-asset regen |
| 5 | **Finds people asking for your app right now** | `lk_signals.pipe` | **65%** ⚠️ lowest | Exa key, **Reddit API (OAuth app)**, HN Algolia (free) | Dedupe vs. already-seen threads, recurrence (no cron node), rate limiting, "already replied" state |
| — | **Demo video script/storyboard** | `lk_assets.pipe` *(asset type)* | **95%** | LLM key | Nothing extra in v1 |
| — | **Approval gates, versioning, ref-code links, attribution** | **none — pure backend** | **0%** | Postgres | All of it |

### Why feature 5 is only 65%

The pipeline finds and drafts brilliantly. But the *product* is a queue that stays useful over time, and that needs:
- **Deduplication** — a thread found today must not reappear tomorrow. Pipelines are stateless; this is a Postgres `seen_threads` table.
- **Recurrence** — the value is checking daily. **There is no cron source node** (sources: `chat`, `dropper`, `filesys`, `telegram`, `webhook`). Backend scheduler → `webhook`.
- **Freshness** — Exa is great for semantic discovery but weaker on "posted in the last 48 hours." Direct Reddit API + HN Algolia via `tool_http_request` give recency. That's an OAuth app registration (free) and a whitelist entry.

---

## Part C — Proposed pipelines (5 files)

```
pipelines/
├── lk_understand.pipe    # repo + site → app profile          [Gate 1]
├── lk_commercial.pipe    # pricing rec + store listing rewrite
├── lk_targets.pipe       # seed-DB ranking + live discovery    [Gate 3]
├── lk_assets.pipe        # parameterized: one asset type per invocation  [Gate 2]
└── lk_signals.pipe       # intent-signal reply queue (recurring)
```

**Common shape — all five are the same graph:**
```
webhook → question → agent_rocketride → extract_data → response_json
                          │ (control)
              llm · memory_internal · tools…
```
What differs: instructions, tool set, output schema. Good news for build cost — pipeline #2 onward is mostly copy-and-retarget.

**Per-pipeline detail:**

| Pipeline | Tools on the agent | Notes |
|---|---|---|
| `lk_understand` | `tool_github`, `tool_firecrawl` | `tool_github` covers files, code search, issues, commits, releases — plenty. Longest-running agent; watch `max_waves`. |
| `lk_commercial` | `tool_exa_search`, `tool_firecrawl`, `tool_http_request` | Two branches (pricing / listing) from one source. **Open q: split into two files?** Different latency and different re-run triggers. |
| `lk_targets` | `db_postgres` (as agent tool — it's `['database','tool']`, NL→query, `invoke: llm`), `tool_exa_search`, `tool_firecrawl` | Confirmed the venue seed DB *is* queryable from inside the pipeline. Two-mode: rank known + discover new. |
| `lk_assets` | `llm` only (+ optional `tool_firecrawl` to read a target's posting rules) | Parameterized by `asset_type` so "regenerate just the Reddit post" is one cheap call rather than a six-branch fan-out. |
| `lk_signals` | `tool_exa_search`, `tool_http_request` (Reddit API, HN Algolia) | `tool_http_request` needs `urlWhitelist` configured — good, it's a security control, not a limitation. |

---

## Part D — Complete external dependency list

| Dependency | Needed for | Cost | Auth | Blocking? |
|---|---|---|---|---|
| **LLM key** (OpenAI / Anthropic / GMI) | all 5 pipelines | paid, usage | key | have |
| **FireCrawl API key** | understand, commercial, targets | **paid SaaS** | key | ⚠️ **need to procure** |
| **Exa API key** | commercial, targets, signals | **paid SaaS** | key | ⚠️ **need to procure** |
| **GitHub PAT** | understand | free | token | easy — mind rate limits |
| **Postgres / Supabase** | venue DB + all app state | our infra | conn string | easy |
| **Reddit API app** | signals (recency) | free | OAuth app registration | needs a real account + app registration |
| **HN Algolia API** | signals | free, no key | none | easy ✅ |
| **Mock Store API** | commercial, attribution | we build it | — | small FastAPI service |
| **Backend scheduler** | signals recurrence | we build it | — | APScheduler/cron → `webhook` |
| Tavily key | optional Exa alternative | paid | key | optional |
| GMI video API | v1.5 only | have key | key | not v1 |

**Two purchases gate the build: FireCrawl and Exa.** Nothing else is a real blocker.

---

## Part E — What is explicitly NOT a pipeline

Say this out loud so estimates aren't wrong by half:

1. The three approval gates + all state transitions
2. Artifact versioning, edit history, "regenerate this one thing"
3. Ref-code link generation and attribution rollups
4. The venue seed DB's initial ~100 curated rows (a seed script + human judgment, from `launchkit-launch-channels.md`)
5. Dedup / already-seen / already-replied state for the reply queue
6. Scheduling and recurrence (no cron node)
7. API key + OAuth credential storage
8. The whole Next.js review-and-approve workspace
9. Job orchestration: pipeline runs take **minutes**, so the backend needs async jobs + status polling, not request/response

**#9 is the biggest architectural consequence in this doc.** An agent doing live web scraping is not a sub-second call. Every pipeline invocation must be a background job with a status the UI can poll.

---

## Part F — Spikes to run before committing

| Risk | Spike |
|---|---|
| Agent emits free text; UI needs strict JSON | Build `lk_understand` first, end-to-end, and see whether agent-instructed JSON is reliable or `extract_data` post-pass is required. **This one pipeline answers the question for all five.** |
| `max_waves` limits on long agent runs | Time a real repo+site run; tune. |
| `tool_github` on large/private repos | Test rate limits and a monorepo. |
| Exa recency for intent signals | Compare Exa vs. direct Reddit API on "last 48h" recall. |
| FireCrawl on JS-heavy app sites | Test against 3 real store apps. |

**Recommendation: build `lk_understand.pipe` first, completely, including the FastAPI job wrapper and one UI view.** It de-risks the structured-output question, the latency/job question, and the FireCrawl/GitHub questions in one vertical slice — and every later pipeline is a variation on it.
