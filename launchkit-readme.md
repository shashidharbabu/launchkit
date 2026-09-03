# Launch Kit

**GTM-in-a-box for RocketRide App Store publishers.**

A builder ships an app to the RocketRide App Store. Launch Kit reads their repo and live site, figures out what the app is and who it's for, generates a complete launch asset pack, ranks the specific places this app should launch, and hands the builder a ready-to-go launch — everything reviewed and approved by them before a single thing is published.

---

## The problem

Builders can build. Most of them cannot market. An app lands in the App Store with a one-line description, no launch post, no demo video, no idea which subreddit or directory would care, and it dies quietly with eleven installs.

That's a problem for the builder, and a bigger problem for the store: **every app that fails to find users makes the storefront less valuable.** Launch Kit exists to close that gap — it's flywheel infrastructure disguised as an app.

## Who it's for

- **Primary:** developers publishing an app to the RocketRide App Store who have no GTM function and no time to acquire one.
- **Secondary (later):** any indie developer or small team launching a software product.

---

## Non-negotiables

These are product commitments, not preferences. They shape the architecture, so don't design around them.

**1. Assisted, never autonomous.** Launch Kit drafts, ranks, and queues. A human reviews and approves before anything is published anywhere. No exceptions, no "auto-pilot mode" toggle in v1.

**2. No network scraping.** Do not scrape LinkedIn/X/anywhere for personal connection graphs. If relationship-based distribution ever enters scope, it happens through official APIs with explicit user authorization only. This is both a ToS issue and a privacy one.

**3. No same-day-users promise.** The product delivers *a launch-ready package today*, and reach when it goes out. It does not promise paying subscribers by end of day, and the marketing copy must not imply it. Over-promising here poisons trust in the whole store.

**4. Quality over volume.** A well-targeted launch in five right places beats a blast across fifty. Volume-optimized outreach is what gets accounts banned and domains blacklisted — and it converts worse anyway.

---

## User flow

```
1. CONNECT      Builder points Launch Kit at their app:
                repo URL + live app URL (+ App Store listing)

2. UNDERSTAND   Launch Kit reads the repo and the site, and produces an
                app profile: what it does, who it's for, the ICP, the
                differentiators, the proof points.
                → Builder confirms/corrects the profile. (Gate 1)

3. GENERATE     From the confirmed profile, produce the launch asset pack:
                launch post (X/LinkedIn), Reddit post, Product Hunt copy,
                Show HN title + comment, landing page copy, demo video.
                → Builder edits/approves each asset. (Gate 2)

4. TARGET       Produce a ranked list of where THIS app should launch:
                subreddits, directories, awesome-lists, communities,
                newsletters — each with a reason, rules summary, and
                submission link.
                → Builder selects targets. (Gate 3)

5. LAUNCH       Assemble the approved assets + selected targets into a
                sequenced launch plan the builder executes (v1) or
                approves for queued publishing (v1.5).
```

Three explicit human gates. That's the design.

---

## Architecture

```
Next.js app  ──►  FastAPI backend  ──►  RocketRide pipelines  ──►  Postgres
   (UI)              (orchestration)        (all AI work)          (state)
```

The pipelines do all the intelligence. The backend invokes them and manages state and approvals. The frontend is a review-and-approve workspace, not a chat box.

### Pipelines

Four `.pipe` graphs, one per stage. Keeping them separate (rather than one mega-pipeline) means each human gate is a natural pipeline boundary, and each stage can be re-run independently when the builder edits something upstream.

**`launchkit_understand.pipe`**
Input: repo URL + live app URL.
Reads the repository (GitHub tool) — README, package manifests, source structure — and scrapes the live site (FireCrawl) for positioning and existing copy. An LLM synthesizes both into a structured app profile: one-liner, category, target user, ICP signals, core differentiators, proof points, tech stack, screenshots available.
Output: structured JSON app profile.

**`launchkit_assets.pipe`**
Input: confirmed app profile + tone/voice preferences.
Generates the launch asset pack. Each asset type is its own branch so they run in parallel and can be regenerated individually: X/LinkedIn launch post, Reddit post (format-aware — Reddit punishes marketing copy), Product Hunt tagline + description + first comment, Show HN title + explainer, landing page copy blocks, demo video brief.
Output: asset pack, each item independently editable and regenerable.

**`launchkit_targets.pipe`**
Input: app profile.
Uses web search/scraping to identify and rank launch venues specific to this app — relevant subreddits, software directories, awesome-lists, Discord/Slack communities, niche newsletters. For each: why it fits this app, its posting rules, audience size signal, and a submission link. Ranked by fit, not by size.
Output: ranked target list with rationale per target.

**`launchkit_publish.pipe`** *(v1.5 — see scope)*
Input: approved assets + selected targets.
Sequences the launch (what goes where, in what order, at what time) and, where a platform offers a clean official API and the builder has authorized it, queues the post. Everything passes through a final human confirm.
Output: launch plan; queued/published items with status.

### Node verification required before building

The pipeline designs above assume: GitHub tool, FireCrawl/web-scraping, web search, LLM provider nodes, data extraction/structuring, and HTTP request nodes. **Verify each against the live node catalog** (`docs.rocketride.ai/nodes` and `nodes/src/nodes/` on the develop branch) before writing the pipelines — the catalog changes, and Stage 1 of the app lifecycle requires every step to map to a named, existing node. Where something doesn't map, decide deliberately: custom Python-extensible node, workaround, or scope cut.

Known gap to design around: **there is no cron source node.** Any scheduling (timed launches, follow-up reminders) needs an external scheduler pinging a webhook.

---

## v1 scope

**In:**
- Repo + site ingestion → app profile, with builder confirmation
- Full launch asset pack generation, individually editable and regenerable
- Ranked, reasoned target list
- Assembled launch plan, exported (copy-to-clipboard, markdown, downloadable)
- Builder executes the actual posting themselves

**Out (deliberately):**
- Any automated publishing to any platform
- Any connection/network graph analysis
- Scheduling and timed release
- Post-launch analytics and attribution
- Multi-app campaign management

**v1 ships value with zero publishing risk.** The asset generation and targeting *is* the hard part and the bulk of the value; posting is the easy part the builder can do in ten minutes. Do not let auto-publishing sneak into v1 — it's where all the ToS, deliverability, and reputational risk lives, and it needs its own design pass.

**v1.5:** queued publishing to platforms with clean official APIs, with per-platform authorization and a final confirm step.
**v2:** scheduling, post-launch performance feedback, and using outcomes to improve future targeting.

---

## Suggested stack

Aligned with the existing portfolio (closest sibling: Extractly).

| Layer | Tech |
|---|---|
| Frontend | Next.js + React + TypeScript + Tailwind + shadcn/ui |
| Backend | Python / FastAPI |
| Database | Postgres (Supabase) |
| AI / pipelines | RocketRide (`.pipe` graphs, invoked via SDK) |
| Auth | Match the standard app auth layer |

### Proposed structure

```
launchkit/
├── frontend/           # Next.js review-and-approve workspace
│   ├── app/            # profile · assets · targets · plan views
│   └── components/
├── backend/
│   ├── api/            # FastAPI routes (projects, profile, assets, targets, plan)
│   ├── services/       # RocketRide client wrapper, pipeline invocation
│   └── models/         # app profile, asset, target, launch plan
├── pipelines/          # launchkit_understand · assets · targets · publish
├── docs/               # architecture, pipeline docs
└── README.md
```

### Data model sketch

```
project        → one app being launched (repo url, site url, owner)
app_profile    → structured output of understand pipeline, versioned,
                 with builder-confirmed flag
asset          → one generated item (type, content, status: draft/edited/approved)
target         → one launch venue (name, url, rationale, rules, selected flag)
launch_plan    → assembled sequence of approved assets × selected targets
```

Every generated artifact keeps its pipeline execution reference, so any output can be traced back to the run that produced it.

---

## Open questions for Stage 1

1. **Node catalog verification** — do all four pipelines map cleanly to existing nodes? (Blocking.)
2. **Demo video generation** — does this call out to Raylight, to the GMI-node video idea (PromptReel), or does v1 just produce a *video brief* and leave production to the builder? Recommendation: brief only in v1, decide the generator once PromptReel's GMI capability question is resolved.
3. **Voice/tone capture** — how does the builder tell Launch Kit how they want to sound? Sample of their writing, a few toggles, or inferred from their existing site copy?
4. **Reddit and Show HN specifically** — these communities are hostile to anything that reads as marketing. Are we confident the generated copy clears that bar, or does it need a dedicated "community-native" prompt treatment and a human warning?
5. **Clean (tryclean.ai) relationship** — RocketRide is a customer of theirs. Worth a conversation before building anything adjacent to their space; possible partnership rather than parallel build.

---

## Success metrics

- % of App Store publishers who run Launch Kit before launching
- Time from "app published" to "launch executed" (baseline: often never)
- Assets approved without edits vs. heavily rewritten (asset quality signal)
- Targets selected vs. suggested (targeting quality signal)
- Downstream: installs/users for apps launched with Launch Kit vs. without

That last one is the real measure, and it's the reason this app exists.
