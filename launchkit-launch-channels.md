# Launch Kit — Launch Channel Market Research

Researched Aug 2026. This is the raw material for (a) the curated venue seed database and (b) the targets pipeline's ranking logic. Each channel class notes what it's good for and how Launch Kit uses it.

**Core strategic finding:** no single channel works. The Product Hunt spike fades by the next morning; sustainable subscriber acquisition = launch platform + evergreen directories + community presence + intent-signal replies, stacked. Launch Kit's job is orchestrating the stack per app.

---

## Class 1 — Launch platforms (one-day/one-week visibility spikes)

| Venue | Notes |
|---|---|
| **Product Hunt** | Still the biggest single-day audience; crowded, spike fades fast. Needs prepared assets + first-comment + launch-day reply presence (our F23). |
| **Uneed** | Daily launches, curated by the team rather than pure votes — fairer shot for genuinely good products. |
| **Fazier** | Daily launch platform, growing indie audience. |
| **Smol Launch** | 7-day visibility window instead of one crowded day — forgiving for first-time launchers. |
| **StartupBase** | Launch + directory hybrid. |
| **BetaList** | Pre-launch only: loyal early-adopter audience for waitlist building. Relevant when a store app launches in beta. |
| **Peerlist Launchpad** | Weekly launches, dev-heavy audience. |
| **DevHunt** | Dev tools specifically — high fit for most RocketRide store apps. |
| **Show HN (Hacker News)** | Huge reach, hostile to marketing. Needs the community-native treatment (F13) or don't post. |
| **Indie Hackers** | Launch post + ongoing build-in-public thread. |

**Launch Kit use:** rank per app, generate platform-specific assets, sequence (directories → soft community launch → PH/HN main day).

## Class 2 — Evergreen directories (compounding SEO, not spikes)

AlternativeTo (rides competitor search traffic — "X alternative"), SaaSHub, There's An AI For That, Futurepedia, Toolify (AI apps), StackShare (dev tools), G2 / Capterra (B2B apps only — needs reviews), SaaSCity, plus **GitHub awesome-lists** for the app's niche (submission = a PR, which `tool_github` can draft).

**Launch Kit use:** submission pack per directory (F19) — each has its own form fields; FireCrawl reads the form, agent pre-fills. These don't produce day-one subscribers; they produce month-three subscribers. Set expectation accordingly in the launch plan.

## Class 3 — Reddit (free, high-conversion, high-risk)

General promo-tolerant subs: r/SideProject, r/IMadeThis, r/AlphaandBetausers, r/RoastMyStartup, r/EntrepreneurRideAlong, r/Entrepreneur, r/startups, r/GrowthHacking, r/IndieBiz, r/SmallBusiness.

The real value is **niche subs per app** (a CLI tool → r/commandline; a self-hosted app → r/selfhosted) — these convert far better and are exactly what the targets pipeline discovers live. Every sub has different self-promo rules; scraping and summarizing those rules per target is a core feature, not a nicety.

## Class 4 — Intent signals (the reply queue, F17)

Existing tools prove the demand: **F5Bot, GummySearch, CustomerPing, Notifier.so** all monitor Reddit/HN/forums for keyword mentions so makers can reply helpfully. This is precisely our F17 — we build it natively with `tool_exa_search`/`tool_tavily` + agent ranking + drafted replies, integrated with the app profile so the queries are ICP-derived, not hand-written keywords.

**This is the channel with the strongest claim to "real subscribers, fast"** — the prospect has already declared the need in public.

## Class 5 — Newsletters (paid sponsorship, or free if newsworthy)

| Newsletter | Audience |
|---|---|
| TLDR network | 1.25M+ daily in the AI vertical alone; dev-heavy |
| The Rundown AI | 2M+ subscribers |
| Ben's Bites | 166K+, explicitly indie-maker lens — best fit for store apps |
| The Neuron, Mindstream, The Batch | AI-focused, sponsorship-driven |

Marketplaces like Paved catalog dev-newsletter placements. **Launch Kit use:** mostly paid → v1 lists them with pricing signal + drafts the pitch email for free-mention consideration. Niche micro-newsletters (F20) are more attainable free than the big ones.

## Class 6 — Marketplaces & deal platforms

AppSumo (lifetime deals — real revenue, brutal margins), Chrome Web Store / Slack App Directory / Shopify App Store where the app's form factor fits. Affiliate recruiting (find affiliates already promoting competitors, offer a commission). **Launch Kit use:** flag when applicable to the specific app; not core.

## Class 7 — Social / build-in-public

X build-in-public (still the indie-dev watering hole), LinkedIn (B2B apps), YouTube/TikTok/Shorts demo clips, micro-influencers in the app's niche. **Launch Kit use:** asset generation covers X/LinkedIn (F12); micro-influencer discovery folds into F20.

---

## Engineering consequence

Maintain a **curated venue seed database** (Postgres table, ~100 rows to start, from this doc) with: name, class, URL, submission URL, audience size signal, self-promo rules summary, fit tags, free/paid. The targets pipeline then does two jobs:
1. **Rank** the seed DB against the app profile (cheap, reliable, instant).
2. **Discover** niche venues the DB doesn't have (subreddits, Discords, awesome-lists specific to this app) via live search — and write the good finds back into the DB.

Every launch enriches the venue DB → cross-app learning (F26) starts on day one, not in v2.

## Sources

- [StartupBase — 20 Best Product Hunt Alternatives 2026](https://startupbase.io/blog/product-hunt-alternatives)
- [100 Free Platforms to Launch Your SaaS 2026](https://guillaumeduhan.medium.com/100-free-platforms-to-launch-your-saas-product-in-2026-3288e1868879)
- [SaaSCity — PH Alternatives Ranked](https://saascity.io/product-hunt-alternatives)
- [Smol Launch — 13 Best PH Alternatives](https://smollaunch.com/alternatives/product-hunt)
- [Superlaunch — 10 Best PH Alternatives](https://superlaunch.io/blog/best-product-hunt-alternatives)
- [How to get your first 100 users](https://shivanshudev.substack.com/p/how-to-get-your-first-100-users)
- [First 100 users for your startup](https://natiakourdadze.substack.com/p/how-to-find-the-first-100-users-for-a8f)
- [ClickIT — Top AI Newsletters 2026](https://www.clickittech.com/ai/best-ai-newsletters/)
- [GenAI.Works — Top 12 AI Newsletters 2026](https://genai.works/insights/top-12-ai-newsletters-to-follow-in-2026)
- [Dupple — Best AI Newsletters 2026](https://dupple.com/learn/best-ai-newsletters-2026)
- [Clean (tryclean.ai)](https://www.tryclean.ai/) · [Clean docs](https://docs.tryclean.ai/) · [Clean vs Clay/Apollo](https://www.tryclean.ai/compare)
