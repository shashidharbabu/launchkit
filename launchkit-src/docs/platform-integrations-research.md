# Platform Integrations Research: User-Connected Direct Posting

**Product context:** Launch Kit — a B2B SaaS go-to-market assistant that helps software builders launch their apps. Question: which platforms let our END USERS connect their own accounts (OAuth or equivalent) so Launch Kit can publish posts directly through the platform's official API?

**Research date: 2026-08-27**

---

## Executive Summary

Of the 20 platforms/groups researched:

| Verdict | Count | Platforms |
|---|---|---|
| **EASY** | 8 | LinkedIn (member posting), Bluesky, Mastodon, Dev.to, Discord, Slack, Telegram, Newsletter APIs (Buttondown / Kit / Mailchimp) |
| **MODERATE** | 6 | X (Twitter), Reddit, Facebook Pages, Instagram, Threads, Hashnode |
| **HARD** | 3 | YouTube, TikTok, Product Hunt |
| **IMPOSSIBLE** | 3 | Hacker News, Medium, Substack |

Key 2026 shifts that shaped these verdicts:

- **X killed its free tier (Feb 6, 2026)** — new developers get pay-per-use only: ~$0.015 per plain post, **~$0.20 per post containing a URL** (which launch posts always contain). Technically simple; economically a per-post COGS line.
- **Hashnode's GraphQL API went paid (May 2026)** — every request now requires the publication to be on a Pro plan.
- **Substack shipped a first official API in 2026, but it only does profile search** — no publishing endpoints. Medium remains closed to new integration tokens.
- **Meta's stack (FB Pages, Instagram, Threads) is all free but App-Review-gated**; Threads is the friendliest of the three (250 posts/user/day, no Facebook Page coupling).
- **TikTok and YouTube both force content from unaudited API clients to private** — shipping either without completing their audits produces posts nobody can see.

---

## Summary Table

| # | Platform | Direct posting via official API | Auth | Cost | Verdict |
|---|---|---|---|---|---|
| 1 | X (Twitter) | Yes (POST /2/tweets) | OAuth 2.0 PKCE user context; no app review | Pay-per-use: ~$0.015/post, ~$0.20/post with link; no free tier for new devs | **MODERATE** |
| 2 | LinkedIn | Yes — member feed (Posts API) | OAuth 2.0, `w_member_social` via self-serve "Share on LinkedIn"; org pages need partner approval | Free | **EASY** (member) / HARD (org pages) |
| 3 | Reddit | Yes (`/api/submit`) | OAuth 2.0, self-serve app registration | Free ≤100 QPM (non-commercial framing); commercial volume needs a Reddit agreement (~$0.24/1k calls reference) | **MODERATE** |
| 4 | Facebook Pages | Yes (Pages feed/photos) | OAuth via Facebook Login; `pages_manage_posts` needs App Review (2–6 wks) + Business Verification | Free | **MODERATE** (heavy review) |
| 5 | Instagram | Yes (2-step container publish) | OAuth (Instagram Login or Facebook Login); `instagram_business_content_publish` App Review; Professional accounts only | Free; ~100 posts/user/24h | **MODERATE** |
| 6 | Threads | Yes (Threads API) | OAuth 2.0 (Threads Login), Meta App Review for publish scope | Free; 250 posts/user/24h | **MODERATE** |
| 7 | Bluesky | Yes (`createRecord`) | AT Protocol OAuth (recommended 2026) or app passwords; no review | Free | **EASY** |
| 8 | Mastodon | Yes (`POST /api/v1/statuses`) | OAuth 2.0 with dynamic client registration per instance; no review | Free | **EASY** |
| 9 | YouTube | Yes (`videos.insert`) | Google OAuth (sensitive scope verification); API compliance audit or uploads locked private | Free; ~100 uploads/day project quota | **HARD** |
| 10 | TikTok | Yes (Content Posting API) | OAuth 2.0; mandatory content audit or posts forced SELF_ONLY, 5 users/day | Free | **HARD** |
| 11 | Product Hunt | Partial (`createPost` exists) | OAuth 2.0; **write scope only by emailing PH for approval** | Free | **HARD** |
| 12 | Hacker News | No — official API is read-only | n/a | n/a | **IMPOSSIBLE** |
| 13 | Dev.to (Forem) | Yes (`POST /api/articles`) | Per-user API key (no OAuth) | Free; 30 req/30s | **EASY** |
| 14 | Hashnode | Yes (`publishPost` GraphQL) | Personal Access Token | **Pro plan required on the publication since May 2026** | **MODERATE** |
| 15 | Medium | No — no new integration tokens issued | n/a (legacy tokens only) | n/a | **IMPOSSIBLE** |
| 16 | Discord | Yes (webhooks / bot messages) | Webhook URL paste or bot invite; no review <100 servers | Free | **EASY** |
| 17 | Slack | Yes (`chat.postMessage`, incoming webhooks) | OAuth 2.0; Marketplace review optional | Free (1 msg/sec/channel) | **EASY** |
| 18 | Telegram | Yes (Bot API `sendMessage` to channels) | Bot token; user adds bot as channel admin; no review | Free | **EASY** |
| 19 | Substack | No — 2026 official API is profile search only | n/a | n/a | **IMPOSSIBLE** (officially) |
| 20 | Buttondown / Mailchimp / Kit | Yes (create + send emails/broadcasts/campaigns) | Buttondown: API key; Kit v4 & Mailchimp: OAuth 2.0 or API key | Free API (user pays platform subscription) | **EASY** |

---

## Per-Platform Details

### 1. X (Twitter) — MODERATE

- **Posting:** Yes. `POST /2/tweets` (text, media via media upload, polls, replies/threads). OAuth 2.0 Authorization Code + PKCE with `tweet.write offline.access` — true user-context posting, no app review gate.
- **Pricing (the whole story in 2026):** On **Feb 6, 2026** X replaced tiers with **pay-per-use as the default**. No free tier for new developers. Rates: **~$0.015 per plain post created, ~$0.20 per post containing a URL**, ~$0.005/read (other reporting cites $0.001 for owned reads), reads capped ~2M/mo. Legacy Basic ($200/mo, 3,000 posts) and Pro ($5,000/mo) persist only for grandfathered subscribers; Enterprise ~$42k/mo. Existing free-tier users got a one-time ~$10 credit. Credits are bought in the Developer Console.
- **Practical constraints:** Launch posts almost always contain a link → budget ~$0.20/post. For a Launch Kit user posting a launch thread of 5 posts with 1 link: ~$0.26. Manageable as passed-through or absorbed COGS, but must be metered. Automation rules still prohibit spammy duplicate posting across accounts. Pricing has changed 4+ times since 2023 — build the billing assumption as a config, not a constant.
- **Verdict: MODERATE** — trivial engineering, real per-post cost and platform-policy volatility.
- Sources: https://postproxy.dev/blog/x-api-pricing-2026/ · https://www.xpoz.ai/blog/guides/understanding-twitter-api-pricing-tiers-and-alternatives/ · https://opentweet.io/how-to/x-api-pay-per-use-explained · https://api.sorsa.io/blog/twitter-api-pricing-2026

### 2. LinkedIn — EASY (member posting) / HARD (organization pages)

- **Posting:** Yes, two distinct tracks.
  - **Member posting (our core case — founder posts to own profile):** the self-serve **"Share on LinkedIn"** product grants `w_member_social` ("Post, comment and like posts on behalf of an authenticated member") **the same day, no partner approval**. Use the Posts API (`/rest/posts`) with OAuth 2.0 (3-legged).
  - **Organization/Company Page posting:** requires the **Community Management API**, a gated Marketing partner product: access form, established business, legal name/address/website/privacy policy, use-case alignment, Marketing API ToS. Weeks-to-months, can be rejected.
- **Constraints:** 60-day access tokens (refresh tokens for approved partners), versioned REST API (`LinkedIn-Version` header, monthly versions), per-app and per-member daily throttles. "Social media management" is an explicitly supported use case for Community Management, so ToS risk is low if approved.
- **Verdict: EASY** for member-profile posting (ship first); **HARD** for company pages (later, behind partner approval).
- Sources: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview?view=li-lms-2026-06 · https://developer.linkedin.com/product-catalog/marketing/community-management-api · https://www.blotato.com/blog/linkedin-posting-api · https://zernio.com/blog/linkedin-posting-api

### 3. Reddit — MODERATE

- **Posting:** Yes. OAuth 2.0 (`submit` scope) → `POST /api/submit` (link, text, image posts to any subreddit the user can post in). Self-serve app registration at reddit.com/prefs/apps.
- **Cost/tiers:** **Free tier: 100 queries/minute per OAuth client** — plenty for posting workloads. Commercial/high-volume data access requires a direct agreement with Reddit (widely cited ~$0.24/1k calls, ~$12k/50M req/mo — never published as a self-serve rate card). A posting-only SaaS at low volume generally lives in the free tier, but Reddit's Data API Terms distinguish non-commercial use; a commercial tool should register via Reddit's API access form to stay clean.
- **Practical constraints:** the real risk isn't the API, it's **subreddit culture**: automated self-promotional posting is exactly what moderators ban. Launch Kit should frame this as "user reviews and clicks post per subreddit," respect per-sub rules, and never mass-submit. Rate limit headers (`X-Ratelimit-*`) must be respected.
- **Verdict: MODERATE** — easy API, non-trivial policy/culture surface.
- Sources: https://www.techloy.com/reddit-api-pricing-in-2026-complete-guide-for-developers-and-businesses/ · https://www.socialcrawl.dev/blog/reddit-data-api-2026 · https://www.xpoz.ai/blog/guides/reddit-api-pricing-tiers-and-alternatives/

### 4. Facebook Pages (Meta Graph) — MODERATE (leaning hard)

- **Posting:** Yes — to **Pages only** (personal profile posting has been dead since 2018). `POST /{page-id}/feed` (or `/photos`) with a Page access token.
- **Auth/review:** Facebook Login → `pages_manage_posts` + prerequisites `pages_read_engagement`, `pages_show_list`. **Advanced Access requires Meta App Review (2–6 weeks, expect at least one rejection: screencast requirements are picky) plus Business Verification (legal docs via Meta Business Suite, ~1–2 weeks).**
- **Cost:** Free. Rate limits per-app and per-page (typically generous for posting).
- **Constraints:** review demands a working demo showing exactly the requested permission in use; privacy policy at a real domain; annual Data Use Checkup. Social-media-management is a recognized use case, so approval is attainable — it's paperwork-heavy, not forbidden.
- **Verdict: MODERATE** — free and well-trodden, but weeks of Meta review before any non-admin user can connect.
- Sources: https://singhamandeep.com/facebook-page-api-permissions-app-review/ · https://bundle.social/blog/facebook-api-permissions · https://www.postpeer.dev/blog/best-facebook-posting-api

### 5. Instagram (Graph API content publishing) — MODERATE

- **Posting:** Yes — feed images, videos, Reels, carousels, Stories via the two-step flow: `POST /{ig-user-id}/media` (container) → `POST /{ig-user-id}/media_publish`. **Professional (Business/Creator) accounts only** — personal accounts have no API path since Basic Display's EOL.
- **Auth/review (2026):** two paths — (a) **Instagram Login (newer)**: no Facebook Page needed; scopes `instagram_business_basic` + `instagram_business_content_publish`; (b) **Facebook Login (classic)**: requires linked FB Page. Either way, posting for arbitrary users requires **App Review (~2–4 weeks)**; development mode + Tester roles works without review for your own accounts.
- **Cost/limits:** Free. ~100 published posts per user per 24h; container statuses must be polled.
- **Constraints:** media must be hosted at a public URL for ingestion; format/aspect-ratio rules; app review screencast requirements similar to FB Pages.
- **Verdict: MODERATE** — free, established, but review-gated and business-account-only, and launch-announcement content is image/video-first (extra product work for Launch Kit).
- Sources: https://developers.facebook.com/documentation/instagram-platform/content-publishing · https://storrito.com/resources/Instagram-API-2026/ · https://www.blotato.com/blog/instagram-posting-api

### 6. Threads API — MODERATE

- **Posting:** Yes — text (500 chars), image, video, carousels (≤20 items), reply control; 2026 updates added ghost posts, GIFs, spoiler tags, share-to-Instagram-Stories, and richer third-party SMM support (search, replies, webhooks/notifications for publish/delete).
- **Auth/review:** OAuth 2.0 ("Login with Threads"), `threads_basic` + `threads_content_publish`; **Meta App Review required** for public users but the Threads use case is lighter-weight than FB/IG review; dev mode + testers for pre-review development.
- **Cost/limits:** **Free — no paid tier.** 250 publishing actions per user per 24h rolling window (plus ~1,000 replies).
- **Verdict: MODERATE** — the friendliest Meta property; review is the only real gate.
- Sources: https://www.socialmediatoday.com/news/meta-updates-threads-api-with-more-third-party-app-integrations/817502/ · https://www.socialcrawl.dev/blog/threads-api · https://postproxy.dev/blog/how-to-post-to-threads-via-api/

### 7. Bluesky (AT Protocol) — EASY

- **Posting:** Yes — `com.atproto.repo.createRecord` with `app.bsky.feed.post` (text, images, external-link embeds/cards, threads).
- **Auth:** **OAuth for AT Protocol** is the recommended path for multi-user products in 2026 (developer preview since Sept 2024, granular scopes rolling out); legacy app-password + `createSession` still works. No app review, no approval, no gatekeeper.
- **Cost/limits:** Free. Generous PDS rate limits (thousands of points/hour — posting is nowhere near them).
- **Constraints:** OAuth client metadata must be hosted at a public URL; link cards require you to fetch/upload the thumb yourself. Track the OAuth spec — still evolving.
- **Verdict: EASY** — the most open major network; also where indie-dev/builder audiences live in 2026.
- Sources: https://docs.bsky.app/blog/oauth-atproto · https://docs.bsky.app/blog/oauth-improvements · https://www.blotato.com/blog/bluesky-api-pricing

### 8. Mastodon — EASY

- **Posting:** Yes — `POST /api/v1/statuses` (text, media via `/api/v2/media`, CWs, visibility levels).
- **Auth:** OAuth 2.0 per instance, with **dynamic client registration** (`POST /api/v1/apps`) — the app registers itself against whatever instance the user types, then runs a standard authorization-code flow. No review anywhere.
- **Cost/limits:** Free. Default 300 req/5min per account; posting limits per-instance but ample.
- **Constraints:** the only complexity is multi-instance UX ("enter your server"); some instances frown on cross-posted corporate content — post visibility/CW options help.
- **Verdict: EASY** — pairs naturally with Bluesky in one "fediverse" milestone.
- Source: https://docs.joinmastodon.org/methods/statuses/ (canonical docs; API unchanged in 2026)

### 9. YouTube (Data API) — HARD

- **Posting:** Yes — `videos.insert` uploads videos (Shorts included) with metadata.
- **Auth/review:** Google OAuth with the **sensitive `youtube.upload` scope → Google OAuth app verification required** for public users. Separately, YouTube enforces an **API compliance audit**: **videos uploaded through unverified/unaudited API clients are locked as private** (creator gets an email) — so an unaudited Launch Kit would upload videos nobody can watch. Quota increases require the audit too.
- **Cost/limits:** Free. 2026 quota model: uploads bill to their **own bucket of ~100 `videos.insert` calls/day per project** (cost re-rated from the long-documented ~1,600 units to ~100), separate from the 10,000-unit daily pool.
- **Verdict: HARD** — two review processes (Google OAuth verification + YouTube compliance audit) before a single public upload; only worth it once Launch Kit generates launch videos at volume.
- Sources: https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits · https://developers.google.com/youtube/v3/revision_history · https://bundle.social/blog/youtube-api-quota-exceeded-limits-fixes

### 10. TikTok (Content Posting API) — HARD

- **Posting:** Yes — Direct Post (video/photo, caption, privacy) or upload-to-inbox draft.
- **Auth/review:** OAuth 2.0 (`video.publish` scope), but the killer is the **content audit**: **unaudited clients can only post SELF_ONLY (private) content, max 5 users per 24h, and users' accounts must themselves be private at posting time.** Posts made while unaudited stay private forever, even after passing the audit. The audit reviews your app end-to-end for ToS compliance; audited apps still carry a 24h active-creator cap based on your audit application estimates.
- **Cost:** Free.
- **Verdict: HARD** — nothing works publicly until the audit clears; also lowest content-fit for B2B software launches.
- Sources: https://developers.tiktok.com/docs/en/content-sharing-guidelines · https://developers.tiktok.com/doc/content-posting-api-get-started · https://bundle.social/blog/tiktok-api-approval

### 11. Product Hunt (API v2) — HARD

- **Posting:** Partial. The GraphQL API v2 (`api.producthunt.com/v2/api/graphql`) schema includes a **`createPost` mutation** (name, tagline, url) and OAuth 2.0 user auth — but **write scope is not self-serve**: apps are read-only (public/private scopes) by default, and write access is granted case-by-case by emailing hello@producthunt.com with your use case. Historically granted for comments/goals-style integrations, not third-party launch schedulers. There is no supported way to configure the full launch experience (gallery, makers, first comment, launch date scheduling) via API.
- **Cost/limits:** Free; complexity-based GraphQL rate limiting.
- **Verdict: HARD** — treat PH as a guided manual step in Launch Kit (prepared assets + checklist + reminder), not an API integration, unless PH grants write access.
- Sources: https://api.producthunt.com/v2/docs · https://github.com/producthunt/producthunt-api · https://help.producthunt.com/en/articles/484971-does-product-hunt-have-an-api · https://rollout.com/integration-guides/product-hunt/reading-and-writing-data-using-the-product-hunt-api

### 12. Hacker News — IMPOSSIBLE

- **Posting:** No. The official HN API (Firebase, `hacker-news.firebaseio.com`) is **strictly read-only** — stories, comments, users, no auth, no write endpoints. All submissions must go through news.ycombinator.com manually; scripted form submission violates site norms and risks bans/shadowbans.
- **Workaround for Launch Kit:** generate the title + URL and deep-link the user to `https://news.ycombinator.com/submitlink?u=<url>&t=<title>` for a one-click manual submit. Coach on Show HN rules.
- **Verdict: IMPOSSIBLE** (by design).
- Sources: https://github.com/HackerNews/API · https://firebase.blog/posts/2014/10/hacker-news-now-has-api-its-firebase/

### 13. Dev.to (Forem API) — EASY

- **Posting:** Yes — `POST https://dev.to/api/articles` (markdown body, title, tags, canonical_url, draft/published flag). Forem API v1 (`Accept: application/vnd.forem.api-v1+json`).
- **Auth:** per-user **API key** generated in Settings → Extensions (no OAuth for third parties) — users paste their key into Launch Kit. No review.
- **Cost/limits:** Free; **30 requests / 30 seconds**; 429s return `Retry-After` that may be either an integer or an HTTP-date — handle both.
- **Verdict: EASY** — ideal for the launch-blog-post leg; `canonical_url` support makes it safe for cross-posting.
- Sources: https://developers.forem.com/api/v1 · https://dev.to/ankitg12/publishing-to-devto-programmatically-in-2026-what-actually-works-2nkd

### 14. Hashnode — MODERATE

- **Posting:** Yes — GraphQL at `gql.hashnode.com`, `publishPost` mutation (title, markdown, tags, SEO meta, publication id).
- **Auth:** Personal Access Token from Account Settings → Developer (pasted by user, like Dev.to). No app review.
- **Cost (the 2026 catch):** **since May 13, 2026 the GraphQL API is Pro-plan-only** — every query/mutation against a free publication errors. Your users must be (or become, self-serve) Hashnode Pro.
- **Verdict: MODERATE** — trivial engineering, but the paywall means only a subset of users can connect; gate the integration with a clear "requires Hashnode Pro" label.
- Sources: https://hashnode.com/changelog/2026-05-13-graphql-api-paid-access · https://github.com/kieksme/mcp-hashnode

### 15. Medium — IMPOSSIBLE

- **Posting:** No, for any new integration. Medium's Help Center: **no new API integration tokens are issued and no new integrations are allowed**; only pre-existing tokens keep working. The old REST write API was already unmaintained for years before the door closed.
- **Workaround:** Medium's manual **Import story** tool honors canonical URLs — Launch Kit can publish to Dev.to/Hashnode/own blog and instruct users to import.
- **Verdict: IMPOSSIBLE** for a new SaaS.
- Sources: https://help.medium.com/hc/en-us/articles/213480228-API-Importing · https://github.com/iancarson/medium-publishing-without-api

### 16. Discord — EASY

- **Posting:** Yes, two patterns: (a) **incoming webhooks** — user creates a webhook in their server's channel settings and pastes the URL; Launch Kit POSTs rich embeds, no auth infra at all; (b) a Launch Kit **bot** the user invites via OAuth 2.0 (`bot` scope + Send Messages), posting via `POST /channels/{id}/messages`.
- **Review:** none for webhooks; bots need Discord verification only past 100 servers (self-serve, light).
- **Cost/limits:** Free; ~5 req/2s per webhook, global 50 req/s for bots — irrelevant at launch-announcement volume.
- **Verdict: EASY** — ship webhooks in an afternoon; "announce to your community" is a natural Launch Kit step.
- Source: https://discord.com/developers/docs/resources/webhook (canonical docs; unchanged)

### 17. Slack — EASY

- **Posting:** Yes — `chat.postMessage` with Block Kit, or **incoming webhooks** created during OAuth install.
- **Auth:** OAuth 2.0 v2 (`chat:write`, `incoming-webhook` scopes); user installs the Launch Kit Slack app into their workspace and picks a channel. **No Slack review needed** to distribute outside the Marketplace (public distribution just requires enabling it; Marketplace listing review is optional and only for directory placement).
- **Cost/limits:** Free; ~1 message/sec/channel posting guideline. Note Slack's 2025-era per-app method tiers for *new non-Marketplace apps* are generous for posting use.
- **Verdict: EASY.**
- Source: https://docs.slack.dev/messaging/sending-and-scheduling-messages/ (canonical docs)

### 18. Telegram — EASY

- **Posting:** Yes — Bot API `sendMessage` / `sendPhoto` to a channel or group where the bot is an admin. Users add the shared Launch Kit bot (or their own bot token) as admin of their announcement channel; Launch Kit posts by `@channelname` or chat id.
- **Auth:** bot token (from @BotFather); no OAuth, no review, no cost.
- **Limits:** ~30 msgs/sec overall, 20 msgs/min per group; channels effectively unconstrained at our volume.
- **Verdict: EASY** — the cheapest integration on this list.
- Source: https://core.telegram.org/bots/api (canonical docs)

### 19. Substack — IMPOSSIBLE (officially)

- **Posting:** No. Substack's **first official Developer API (2026) covers only authenticated profile search** (e.g., look up a creator by LinkedIn handle) — **no publishing endpoints for posts or Notes**. All programmatic publishing today rides on reverse-engineered private endpoints (community libraries, "Substack Gateway"-style proxies) using session cookies — fragile and a ToS risk unacceptable for a SaaS acting on users' accounts.
- **Workaround:** Launch Kit generates the newsletter draft (markdown/HTML) and the user pastes into Substack; or route newsletter sending through Buttondown/Kit/Mailchimp (below), or use Substack's email-to-publish where enabled for drafts.
- **Verdict: IMPOSSIBLE** via official API today; watch this space — the API's existence suggests expansion.
- Sources: https://apisubstack.com/ · https://github.com/jakub-k-slys/substack-api · https://www.netrows.com/blog/best-substack-newsletter-data-apis-2026

### 20. Buttondown / Mailchimp / Kit (ConvertKit) — EASY

- **Buttondown:** "Everything you can do in Buttondown, you can do with the API." `POST /v1/emails` creates an email that immediately sends (or schedule via `publish_date`; draft → send-draft flow available). Auth: per-user API key. Free API on all plans.
- **Kit (formerly ConvertKit), v4 API (`api.kit.com/v4`):** full broadcasts lifecycle — create, manage, **send** broadcasts. Auth: **OAuth 2.0 with PKCE (for apps in the Kit App Store) or X-Kit-Api-Key** for personal use. 72 documented operations; proper third-party-app model.
- **Mailchimp Marketing API:** create campaign → set content → `POST /campaigns/{id}/actions/send`. OAuth 2.0 supported for third-party apps (datacenter-prefixed endpoints); 10 concurrent connections, generous limits.
- **Verdict: EASY (all three)** — one "newsletter" abstraction in Launch Kit can back onto whichever the user has. Kit's OAuth is the best-fit primary; Buttondown is the simplest secondary; Mailchimp covers the long tail.
- Sources: https://developers.kit.com/api-reference/upgrading-to-v4 · https://docs.buttondown.com/api-emails-create · https://docs.buttondown.com/sending-via-email · https://mailchimp.com/developer/marketing/api/campaigns/

---

## Recommended v1.5 Integration Set (indie software builders launching apps)

Chosen for effort-vs-value: where builder audiences actually are at launch time, weighted by zero-review paths first.

1. **X (Twitter)** — still *the* launch channel. Pay-per-use (~$0.20/link post) is a metered COGS, not a blocker: cap free-plan posts, pass through or absorb on paid plans.
2. **LinkedIn (member posting)** — highest-value B2B channel, self-serve `w_member_social`, same-day access. Defer company pages.
3. **Bluesky** — zero-gatekeeper OAuth, and the 2026 indie-dev audience is here.
4. **Mastodon** — near-free marginal effort after Bluesky; same "fediverse" milestone.
5. **Dev.to** — the launch blog post leg; API key + one POST; `canonical_url` enables the Medium-import and SEO story.
6. **Threads** — free, 250 posts/user/day, one Meta app review; unlocks the fastest-growing text network.
7. **Discord + Slack + Telegram webhooks ("Announce to your community")** — three integrations, one internal abstraction, roughly a week total; every builder has at least one of these communities.
8. **Reddit** — high launch value, free tier sufficient; ship with a human-in-the-loop "review per subreddit before posting" UX to manage culture/ToS risk.

**Explicit non-goals for v1.5:** Hacker News (ship the `submitlink` deep-link + Show HN checklist instead), Product Hunt (guided manual launch checklist; email PH about write scope in parallel), Medium (import-from-canonical instructions), Substack (draft export), TikTok/YouTube/Instagram (audit/review-heavy, media-first — revisit when Launch Kit generates launch videos), Hashnode (fast follow — gate on "requires Hashnode Pro").

## Phased Rollout

- **Phase 1 (weeks 1–2) — zero-review core:** Bluesky, Mastodon, Dev.to, Discord/Slack/Telegram webhooks. No external approvals can block the release date.
- **Phase 2 (weeks 2–4) — the big two:** LinkedIn member posting (self-serve, same-day) and X pay-per-use (metering + billing guardrails), plus Reddit with the per-subreddit review UX. Submit the Meta app (Threads scopes) for review at the *start* of this phase.
- **Phase 3 (weeks 5–8) — review-gated + newsletter:** Threads (once review clears), newsletter abstraction (Kit OAuth → Buttondown → Mailchimp), Hashnode (Pro-gated).
- **Phase 4 (backlog, demand-driven):** Facebook Pages + Instagram (piggyback on the now-verified Meta business), YouTube (OAuth verification + compliance audit), TikTok (content audit), LinkedIn company pages (Community Management partner application), Product Hunt write scope (if granted).

---

*Compiled 2026-08-27 for Launch Kit by web research against official docs and current (2026) third-party integration guides. Pricing and review policies on X, Meta, and Reddit have historically changed with little notice — re-verify before committing billing math.*
