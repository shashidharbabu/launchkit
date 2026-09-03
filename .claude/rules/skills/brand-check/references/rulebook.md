# RocketRide Brand and Messaging Rulebook

Single source of truth for brand-check reviews. Compiled from SOUL.md,
MEMORY.md, DATA.md, competitors.md. Last updated: 2026-08-19. Maintained by
Steve Dinkleberg. Final authority on all unsettled items: Joe.

Punctuation note: the source guide's em-dashes were replaced with commas,
colons, and sentence breaks per the em-dash ban (section 1.1). Wording is
otherwise verbatim.

---

## 1. Vocabulary: banned words, required replacements, and why

### 1.1 Banned words (hard rules)

| Banned | Use instead | Why |
|---|---|---|
| **ship / shipping** | launch, release, deploy, deliver, roll out | Joe explicitly banned this word (Aug 17, 2026). No exceptions, no context. |
| **universal API key** | "integrates with MaaS providers (TokenRouter, OpenRouter, etc.) so users maintain one account to access hundreds of models" | Deprecated framing corrected by Joe (Aug 19, 2026). The key is with the MaaS provider, not with RocketRide. |
| **em-dashes** | commas, colons, semicolons, or a new sentence | Hard tell that AI wrote it. Joe removed all em-dashes from the ICP doc himself (July 26, 2026). Applies to ALL writing: drafts, docs, analysis, everything. |

### 1.2 Product and technical framing rules

**RocketRide does NOT provide large foundation model inference.**

- Wrong: "RocketRide Cloud provides inference for GPT-4, Claude, Gemini..."
- Right: "Users run their own models on their own hardware, or route through a
  MaaS provider. RocketRide connects, orchestrates, and observes."

**RocketRide does not serve weights.** Never write anything implying it does.

**MaaS integration framing (Aug 19, 2026 correction):**

- Wrong: "One API key covers all your LLMs"
- Right: "Integrates with MaaS providers so users maintain one account to
  access hundreds of models without managing individual API keys. RocketRide
  provides detailed token consumption and spend tracking across these
  interface layers, rolled up to the full pipeline."

### 1.3 AI writing tells: flag these

These phrases read as AI-generated filler and are not Joe's voice:

| Flagged phrase | Why |
|---|---|
| "What I keep thinking about is..." | AI hedge, not Joe |
| "I keep coming back to..." | Same category |
| "The pattern I keep seeing..." | Same category |
| "Smart team. Cool project. Worth watching." | Staccato fragment punchline, not Joe |
| "Less meta. More done." | Same, fragment punchlines |
| "where things break at 2am" | Tired startup cliche |
| "game-changer" / "groundbreaking" / "revolutionary" | Generic hype, not grounded |

---

## 2. Positioning: approved statements and framing

### 2.1 One-line pitch (approved)

> RocketRide lets developers build, deploy, and maintain AI pipelines from the
> best components (any model, any tool, any agent), production-ready, from
> inside their IDE.

### 2.2 Core competitive moat (approved, use exactly)

> The only platform that is simultaneously IDE-native + MIT-licensed +
> self-hostable.

This is the defensible POV. Keep coming back to it. It is the through-line in
all positioning.

### 2.3 The problem we solve

Three-part structure:

- **Build:** Tool Discovery Chaos. 1,000+ models, frameworks, tools, changing
  weekly.
- **Deploy:** Prototype does not equal Production. AI demos work. AI at scale
  breaks.
- **Maintain:** Constant Refactoring. Models deprecate, APIs change, tools
  break.

### 2.4 ICP (Ideal Customer Profile)

Software developers building AI solutions, new to AI or mid-journey. VS Code /
fork users or CLI via SDK/MCP. Transitioning from hand-written code to AI
coding agents. Building AI-native apps, AI-driven automation, or adding AI to
legacy apps. Currently juggling fragmented tools. Bottom-up adoption at
startups and mid-market.

When writing content: speak to their frustrations and aspirations. They are
switching from hand-writing code to using AI coding agents. That tension is
the emotional entry point.

### 2.5 The four product buckets (approved names)

1. **RocketRide AIDE**: the developer harness. Free, MIT, IDE-native.
2. **RocketRide Cloud**: hosted runtime. Launching June 18, 2026. Invite-only
   preview at https://cloud.rocketride.ai/
3. **RocketRide App Builder** (name TBD, do not finalize in public copy)
4. **RocketRide App Store**

### 2.6 The two entities

- **rocketride.org**: open source, MIT license, independent foundation. Linux
  Foundation + AAIF member. Zero lock-in.
- **rocketride.ai**: commercial cloud, Delaware C-Corp.

Never conflate them. OSS credibility is a moat. Do not dilute it by blurring
the org/commercial line.

### 2.7 What to never assert without confirmation

Do not make specific product capability claims without confirmation from Joe
or verified internal docs. When uncertain, frame around architecture and
philosophy, not specific features.

**Financial projections are strictly confidential.** Never reference specific
numbers publicly. Ever.

---

## 3. Tone: on-brand vs off-brand

### 3.1 How RocketRide content should sound

- **Punchy and direct.** Short sentences. Gets to the point. No fluff.
- **Community-first.** Celebrates partners, teams, the SF ecosystem. Gives
  credit freely. Tags contributors.
- **Genuine enthusiasm, not hype.** Excited but grounded. Never salesy.
- **Brevity over elaboration.** Says what needs to be said and stops.
- **Show, don't tell.** Demonstrate value through specifics. Do not declare
  superiority.
- **Developer-first voice.** Speak to what developers actually feel, not what
  a marketer thinks they feel.

### 3.2 Capitalization rules

- **LinkedIn posts and X posts:** normal capitalization (capital letters at
  sentence starts).
- **Personal DMs and messages from Joe:** lowercase sentence starters are
  authentic Joe. Do not correct them.

### 3.3 On-brand examples

From Joe's actual LinkedIn post (OS Summit NA, May 18, 2026):

> "I spoke up in a breakout session this morning. Not sure everyone loved what
> I said."

Why it works: direct, slightly self-aware, no setup padding. He says the thing
immediately.

> "Yes, AI can generate boilerplate. It can't generate institutional
> knowledge, fresh perspective, or the kind of hunger that comes from someone
> who has everything to prove."

Why it works: specific contrast. Not abstract. Real "either...or"
construction. Short declarative ending.

> "At RocketRide, we're betting on early-in-career builders. We want people
> who are curious, move fast, and want to grow with us as we build the AI
> runtime that developers actually want to use."

Why it works: RocketRide mention is natural and earned, not forced. "Actually
want to use" is honest and grounded.

### 3.4 Off-brand examples (do not publish)

FAIL: "What I keep thinking about is how fragmented the AI tooling space has
become, and why that's a real problem for developers."
Why off-brand: AI hedge opener, no specificity, no punch.

FAIL: "We're shipping something big today."
Why off-brand: "shipping" is banned. Full stop.

FAIL: "RocketRide is the game-changing platform that revolutionizes how teams
build AI pipelines."
Why off-brand: generic hype. Nothing specific. Reads as marketing boilerplate.

FAIL: "Smart team. Solid product. Worth watching."
Why off-brand: staccato fragment punchline, not Joe's style.

FAIL: "The best part? It just works, even at 2am when things break."
Why off-brand: tired startup cliche.

FAIL: "RocketRide gives you a universal API key for all your AI services."
Why off-brand: incorrect framing. Deprecated Aug 19, 2026.

### 3.5 Account-specific tone rules

**Joe's personal account, dev forums (Reddit, HN, dev.to):**

- No RocketRide mentions. Joe is a developer with a POV, not a marketer.
- Lean into community energy. Be genuine.

**Joe's personal account, social (X, LinkedIn, Instagram, Medium):**

- Moderate RocketRide mentions. Joe is a founder who happens to be building
  something relevant.
- Only mention RocketRide when it genuinely fits the point being made.

**RocketRide brand account, social (X, LinkedIn, Instagram):**

- Full marketing voice. Product angle front and center.
- Confident, builder-energy, developer-first. Not salesy. Not corporate.

---

## 4. Competitor mentions: policy

### 4.1 Universal rule (all companies)

> Never position RocketRide as "better than X". Show, don't tell.

This applies to every company, including direct competitors. Make factual
comparisons. Let the features speak.

### 4.2 Direct tooling competitors: factual comparisons OK

Approved comparison format (from DATA.md):

| Feature | RocketRide | LangFlow | Dify | Sim.ai | n8n |
|---|---|---|---|---|---|
| License | MIT | BUSL | Apache 2.0 | Apache 2.0 | Sustainable Use |
| IDE-Native | Yes | No | No | No | No |

These are factual feature comparisons. They are on-brand. The rule is: state
facts, do not editorialize them into "therefore we're better."

**Confirmed direct competitors to monitor:**

- LangChain / LangSmith (largest mindshare, dominant OSS orchestration
  framework)
- Flowise / FlowiseAI (48K stars, MIT, YC-backed, biggest OSS mindshare
  threat)
- Diffy
- Sim.ai
- Haystack (deepset)
- Azure PromptFlow (Microsoft; IDE-native overlap, Azure-locked)
- Gumloop ($50M Series B, different ICP but significant funding)
- Stack AI
- Relevance AI
- Lamatic.ai
- CrewAI
- Cursor (now SpaceX/xAI-owned, $60B acquisition June 2026; classified as
  competitor)
- LangSmith Fleet / Managed Deep Agents (major platform expansion at
  Interrupt 26)

### 4.3 Foundation model providers (OpenAI, Anthropic, Google, Meta)

WARNING: FLAG FOR JOE. Policy not explicitly confirmed in writing.

Working understanding: RocketRide integrates with these providers and routes
through MaaS layers that include them. Positioning against them as competitors
would be self-defeating and factually wrong; they are upstream infrastructure,
not competitors. The "show don't tell" and "no direct shots" rules apply
universally.

However, there is no formal written policy distinguishing foundation model
providers from tooling competitors for competitor-mention purposes. Joe must
confirm the exact rule before this becomes autonomous.

**Rule for the checker:** flag any content that names OpenAI, Anthropic,
Google, or Meta in a comparative or adversarial context and route for Joe's
review.

### 4.4 Partners: handle with care

Do not let content imply a confirmed partnership where one is still in
discussion.

Confirmed partners: GMI Cloud/SCALE at GMI, FireCrawl, MLOps Community,
Frontier Tower SF, CodeRabbit, Google Developer Group.

Partnerships in discussion (not confirmed): Microsoft, n8n, AI LA, Daytona,
AI Camp, AI Collective, Bond AI SF.

---

## 5. Additional checks the reviewer must catch

### 5.1 Factual accuracy traps

- **Hallucinated events.** There is no "RocketRide Developer Day" or "Beyond
  Build" event at GitHub HQ. Joe corrected this twice (June 1 and June 2,
  2026). Flag any event reference that isn't verifiable from Joe or public
  sources.
- **Inference claims.** Any sentence implying RocketRide runs or serves
  foundation model inference is wrong. Flag it.
- **Financial numbers.** Any specific revenue, ARR, or projection figure is
  confidential and must never appear in public content.
- **Pricing changes.** Current pricing: Self-Hosted: Free | Builder: $49/mo |
  Pro: $250/mo | Enterprise: $2,500+/mo. Flag if copy references different
  numbers.

### 5.2 App Builder name

Bucket 3 (App Builder) does not have a finalized public name. Flag any content
that refers to it by a specific product name; it may be outdated or invented.

### 5.3 Unsupported capability claims

Flag any specific feature claim not verifiable in DATA.md or SOUL.md. Rule: if
uncertain, frame around architecture and philosophy, not features.

### 5.4 MaaS framing check

Any content that:

- describes RocketRide as providing model inference,
- uses "universal API key" language, or
- implies users don't need a MaaS provider account

...should be flagged and rewritten to the approved framing in section 1.2.

### 5.5 Content approval workflow

No content goes live without Joe's explicit review and approval. The checker
flags, it does not publish. The workflow is: Steve drafts, then Dana reviews
adversarially, then Joe approves, then Joe posts.

### 5.6 URL policy

Every flagged item or published piece referencing an external source must
include the direct source URL. "URL not captured" is acceptable to note;
sourcing from memory alone is not.

---

## What is not yet settled

1. **Foundation model provider mention policy** (OpenAI / Anthropic / Google /
   Meta): the distinction between them and tooling competitors is not formally
   documented. Flag and route to Joe.
2. **App Builder product name**: Bucket 3 has no finalized public-facing name.
3. **Specific feature claims on Cloud**: some Cloud features are still being
   validated. When in doubt, flag.

Do not treat this rulebook as final without Joe's review of the unsettled
items above.
