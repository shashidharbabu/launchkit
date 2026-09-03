# Launch Kit — Feature Catalog & RocketRide Mapping

Brainstorm doc. Purpose: put every plausible feature on the table, say honestly how RocketRide would do it, and mark what's solid vs. speculative.

**Direction decisions so far (Aug 5, 2026):**
- **v1 scope locked:** Layers 1+2 substrate (F1–F6 profile/ICP + F7 pricing + F8 store listing) + **F16 ranked targets** + **F17 intent-signal reply queue**. Everything else is v1.5+.
- Store handles pricing/checkout/subscriptions → Launch Kit builds against a **mock store API** (Part 0) until real integration.
- **tryclean = optional v2 integration for B2B apps, not core infra** (Part 5).
- Venue targeting = **curated seed DB in Postgres + live niche discovery**, per `launchkit-launch-channels.md` market research.
- Mechanisms A (own network) + B (intent signals) in scope; C (cold prospecting) out.
- **GMI Cloud video (we hold node + API key):** v1 = script/storyboard; **v1.5 = GMI-generated demo video + short-form launch clips (F14/F14b)** via `tool_http_request` → GMI video API until the GMI-video node / PromptReel standalone ships — then Launch Kit delegates generation to it. Resolves README open question #2.

---

## Part 0 — The reframe

The README scopes Launch Kit as *"generate launch assets."* Your ask is bigger: **"a builder hosts an app on our store and can actually sell it."**

Those are different products. Selling needs four things, and asset generation is only one of them:

| Primitive | Who owns it | Status |
|---|---|---|
| **Host** — app runs, has a URL | App Store platform | ✅ exists |
| **Sellable surface** — pricing page, checkout, subscription, trial | App Store platform | ✅ **confirmed (Aug 5): the store handles builder-set pricing & subscriptions** |
| **Distribution** — the right people see it | **Launch Kit** | to build |
| **Attribution** — which channel produced which subscriber | Launch Kit generates ref-coded links; store records ref code at signup | 🟡 needs a small store-side contract |

**Definitions:** *distribution* = getting the app in front of the right people. *Attribution* = knowing which channel each subscriber came from — every link Launch Kit emits carries a ref code (`?ref=reddit_sideproject`), and the store stores that code with the signup. Attribution is what lets us prove "this subreddit produced 4 subscribers" — it is both the headline success metric and the fuel for cross-app learning (F26).

**Decision (Aug 5): build against a mock App Store API.** Launch Kit development does not wait on real store integration. We stand up a small mock service (FastAPI + fixture data) exposing the contract we need:
- `GET /apps/{id}` — listing: name, tagline, description, screenshots, pricing tiers
- `GET /apps/{id}/plans` — subscription plans the builder configured
- `POST /events` + `GET /apps/{id}/signups?ref=` — signup events with ref codes (attribution)

Launch Kit codes to this contract; swapping in the real store API later is a config change. The mock contract doubles as our integration spec to hand the store team.

---

## Part 1 — The contacts question, answered properly

"Get all the contacts of the people who build the app, publish on their socials and circles, and directly reach the people who'd buy it" is actually **three separate mechanisms** with three different legal regimes. Conflating them is what gets domains blacklisted.

### Mechanism A — The builder's own network (✅ do this)

The builder connects **their own** accounts and we work with **their own** data.

- **Their contacts:** Gmail contacts, calendar attendees, Slack workspaces, their own Drive/Sheets. All first-party — data they already lawfully hold. `tool_gmail`, `tool_calendar`, `tool_drive`, `tool_sheets`, `tool_slack` are all in the live catalog.
- **Their followers:** they post from their own X / LinkedIn / Reddit accounts.
- **What we add:** segment their contact list against the app's ICP, rank by fit, draft a *personal* note per person, hand it to them to send. Ten warm notes from a real person beat a thousand cold emails, and it's not spam because it's their actual relationship.

This is the compliant, honest version of the tryclean idea — and it's where tryclean itself would plug in (see Part 5).

### Mechanism B — Public intent signals (✅ do this — I think this is the killer feature)

Instead of buying a list of people who *might* want the app, **find the people who publicly said they want it, this week.**

- Reddit/HN/X/Discord/forums/GitHub issues where someone wrote *"does anyone know a tool that does X"*, *"how do you all handle Y"*, *"switching off Z, what else is there"*.
- These are public posts, no private graph touched, no ToS problem, and they are the highest-converting audience that exists — the person has already self-declared the need and is actively looking.
- Output isn't a contact list. It's a **reply queue**: thread link + what they asked + a drafted, genuinely-helpful reply that mentions the app once. Builder reviews and posts.
- Nodes: `tool_exa_search` / `tool_tavily` (semantic search over the web finds phrasings keyword search misses), `tool_firecrawl` / `tool_apify` for thread contents, `agent_rocketride` to judge relevance and draft.

This is the single feature I'd fight to keep. It converts, it's defensible, and it's genuinely useful rather than spammy.

### Mechanism C — Cold prospecting into strangers (⚠️ different product, decide separately)

Getting a list of strangers' emails to pitch. This needs a **licensed B2B data vendor** (Apollo, Clay, ZoomInfo, etc.), triggers CAN-SPAM / GDPR / CASL, needs domain warming and deliverability infrastructure, and has terrible conversion for a $9/mo dev tool. It is a real business, it just isn't this one.

**Recommendation:** A and B in scope. C explicitly out, and revisited only if a builder's app is genuinely B2B/enterprise-priced where cold outbound economics work at all.

---

## Part 2 — Feature catalog

Confidence: 🟢 nodes verified, clear path · 🟡 doable, design work needed · 🔴 speculative / blocked

### Layer 1 · Understand the app

| # | Feature | RocketRide mapping | |
|---|---|---|---|
| F1 | **Repo + site → app profile.** What it does, category, tech stack, maturity signals. | `webhook` → `question` → `agent_rocketride` [tools: `tool_github`, `tool_firecrawl`] → `extract_data` → `response_json` | 🟢 |
| F2 | **ICP synthesis.** Who specifically buys this, what job it does for them, what they use today. | Same agent, dedicated instruction pass | 🟢 |
| F3 | **Competitor & alternative map.** What people use instead, and their pricing. | `agent_rocketride` [`tool_exa_search`, `tool_firecrawl`] scraping competitor pricing pages | 🟢 |
| F4 | **Positioning angle.** The one sentence that makes this app not-a-commodity. | LLM synthesis over F1–F3 | 🟢 |
| F5 | **Voice/tone profile.** Inferred from their existing site copy + README + optional writing sample. | Falls out of the F1 scrape almost free | 🟢 |
| F6 | **Proof-point extraction.** Benchmarks, screenshots, stars, testimonials already sitting in the repo. | `tool_github` + agent | 🟢 |

### Layer 2 · Make it sellable *(the layer the README is missing)*

| # | Feature | RocketRide mapping | |
|---|---|---|---|
| F7 | **Pricing recommendation.** Scrape 5–10 comparable products' pricing pages → suggest tiers and a price point with rationale. Most builders under- or over-price by 5×. | `agent_rocketride` [`tool_firecrawl`, `tool_exa_search`] → `extract_data` → pricing table | 🟢 |
| F8 | **Store listing optimization.** Title, tagline, description, keywords, screenshot order for the App Store page itself. The store listing is the conversion surface every builder wastes. | LLM pass over profile + store listing scrape | 🟢 |
| F9 | **Landing page — actually generated.** Not just copy blocks: a real page. `tool_v0` is in the live catalog and generates React UI. | `agent_rocketride` [`tool_v0`] → deployable page | 🟡 needs a spike — unclear how v0 output round-trips |
| F10 | **Objection handling / FAQ / trust block.** The "but does it do X / is my data safe / why not just use Y" answers. | LLM over F2 + F3 | 🟢 |
| F11 | **Onboarding-gap flag.** Reads the repo/site and says "there's no demo, no free tier, no signup — you will not convert." | Agent with a rubric | 🟡 high value, low cost |

### Layer 3 · Asset generation *(README's `assets` pipeline)*

| # | Feature | RocketRide mapping | |
|---|---|---|---|
| F12 | **Platform-native launch copy.** X, LinkedIn, Product Hunt, newsletter blurb. | Parallel agent branches → `response_json` per asset | 🟢 |
| F13 | **Community-native copy (Reddit / HN).** Separate prompt treatment — these communities punish anything that smells like marketing — plus an explicit "post this as-is and you'll get flamed" warning. | Dedicated agent + rules from the target's own scraped posting guidelines | 🟢 must be its own thing, not a tone toggle |
| F14 | **Demo video: script + storyboard (v1) → GMI-generated video (v1.5).** v1 ships script, shot list, VO text. Generation path: **GMI Cloud video API** (we hold a key). Deployed `llm_gmi_cloud` node is *text-only* — so generation goes via agent + `tool_http_request` to GMI's video endpoint (spike needed for async job polling), until the GMI-video node / PromptReel standalone app exists, at which point Launch Kit delegates to it. `tts_openai`/`tts_elevenlabs` + `video_composer` + `thumbnail` are live for assembly. | v1: `agent` → script/storyboard JSON. v1.5: `agent` [`tool_http_request` → GMI video API] → clip URLs → `video_composer` | 🟢 brief / 🟡 GMI generation |
| F14b | **Short-form launch clips.** 15–30s teaser for X/LinkedIn + Product Hunt gallery video, generated from screenshots + GMI. Video assets measurably outperform text posts on launch day. | Same GMI path as F14, shorter format, per-platform aspect ratios | 🟡 rides on the F14 spike |
| F15 | **Per-recipient outreach drafts.** For Mechanism A and B — personalized, not templated. | Agent per recipient, with their context in the prompt | 🟢 |

### Layer 4 · Distribution

| # | Feature | RocketRide mapping | |
|---|---|---|---|
| F16 | **Ranked launch venues.** Subreddits, directories, awesome-lists, Discords, newsletters — each with fit rationale, posting rules, submission link. | `agent_rocketride` [`tool_exa_search`, `tool_firecrawl`] → `extract_data` | 🟢 README's targets pipeline |
| F17 | **Intent-signal reply queue.** ⭐ Mechanism B. People publicly asking for this, right now. | `agent_rocketride` [`tool_exa_search`, `tool_tavily`, `tool_apify`] → ranked threads + drafted replies | 🟢 highest-leverage feature in this doc |
| F18 | **Own-network activation.** ⭐ Mechanism A. Consented contact import → ICP-match → ranked warm list → personal drafts. | `tool_gmail` / `tool_calendar` / `tool_sheets` + agent scoring | 🟡 nodes exist; consent UX is the work |
| F19 | **Directory & awesome-list submission pack.** Pre-filled submission payloads per directory's actual form fields. | `tool_firecrawl` reads the form → agent fills it | 🟡 |
| F20 | **Niche newsletter / micro-creator finder.** Who writes to this exact audience, and the pitch. | `tool_exa_search` + agent | 🟢 |

### Layer 5 · Execute

| # | Feature | RocketRide mapping | |
|---|---|---|---|
| F21 | **Sequenced launch plan.** What goes where, in what order, on what day. Exportable. | Agent over approved assets × selected targets | 🟢 |
| F22 | **Assisted publishing.** Official APIs only, per-post human confirm. | `tool_http_request`, or `tool_n8n` (n8n already owns the OAuth + connectors for X/LinkedIn/Reddit/Discord) | 🟡 v1.5 |
| F23 | **Launch-day comment coach.** Launches are won in the replies. Drafts responses to incoming questions in the first 6 hours. | Agent + `tool_firecrawl` polling the live thread | 🟡 needs external scheduler — **no cron source node exists** |
| F24 | **Scheduling.** | Blocked on the same gap: external scheduler → `webhook` source | 🔴 v2 |

### Layer 6 · Learn *(the flywheel)*

| # | Feature | RocketRide mapping | |
|---|---|---|---|
| F25 | **Channel → signup attribution.** Which venue produced which user. | Needs store-side analytics; pipelines can only read what the platform records | 🔴 **platform gap** |
| F26 | **Cross-app learning.** "Apps like yours converted best on X." Every launch we run makes the next one smarter — no competitor can copy this. | Aggregate over our own Postgres + a vector store for similarity | 🟡 the real long-term moat |
| F27 | **Relaunch / iterate loop.** Fresh angle, new venues, for apps that flopped the first time. | Re-run of the same pipelines with outcome context | 🟢 once F25 exists |

---

## Part 3 — If we could only build three

1. **F17 — intent-signal reply queue.** Real users, this week, from public data. It's the honest version of what you actually want out of the tryclean idea.
2. **F7 + F8 — pricing + store listing.** You cannot sell without a price and a listing that converts. Cheapest features here, and they gate revenue directly.
3. **F16 — ranked targets with rules.** The README's core, and the thing builders genuinely can't do themselves.

F1–F6 are the prerequisite substrate; they're not optional, they're just not the product.

---

## Part 4 — How RocketRide does this, in one paragraph

Almost every feature above is the same shape: **`webhook` → `question` → `agent_rocketride` (with `tool_github` / `tool_firecrawl` / `tool_exa_search` / `tool_gmail` hanging off it via `control`) → `extract_data` → `response_json`.** The agent is the workhorse; the tools are the reach; `extract_data` makes it renderable. What differs between features is the instruction set, the tool set, and the output schema — not the graph topology. That's a good sign for build cost, and it's the real input to "how many pipelines" (next conversation).

Three hard platform constraints, all verified:
- **No cron source** → anything timed needs an external scheduler hitting a `webhook`.
- **No image/video generation in the deployed catalog** → visual assets are briefs + TTS + screenshot composition, not generated video.
- **No social-publishing nodes** → publishing goes through `tool_http_request` or `tool_n8n`.

---

## Part 5 — tryclean verdict (researched Aug 5, 2026)

**What Clean actually is:** an AI GTM engine for **B2B SaaS teams** — connects your CRM, relationship graph, and knowledge sources; profiles accounts against 75 buying signals; ranks accounts S→C; runs low-volume outreach via LinkedIn/email/phone. Positioned against Clay, Apollo, and AI SDRs. ([tryclean.ai](https://www.tryclean.ai/) · [docs](https://docs.tryclean.ai/) · [compare](https://www.tryclean.ai/compare))

**Verdict: not core infrastructure for Launch Kit.** Clean's motion assumes a CRM, a sales function, and B2B deal sizes. The median store builder is an indie dev with a prosumer app at a low price point — no CRM, no SDR motion, and unit economics where account-based outbound makes no sense. Their subscribers come from launch platforms, directories, communities, and intent signals (see `launchkit-launch-channels.md`), none of which Clean addresses.

**Where Clean does fit:**
1. **Integration, not foundation** — for the subset of store apps that are genuinely B2B with real ACV, "connect your Clean account" (or a warm intro to Clean) is a v2 integration. Their product handles Mechanism C better than we ever should.
2. **Partnership conversation still worth having** — RocketRide is a customer; "launch distribution for indie devs" may be adjacent to their roadmap. Ask whether their API can expose a builder's enriched contacts with that builder's authorization (would accelerate F18), and whose consent their ToS captures.

**What Clean cannot give us regardless:** Mechanism B. Nobody's contact graph contains "the person who posted on r/selfhosted four days ago asking for exactly this." The intent-signal reply queue (F17) is ours either way.
