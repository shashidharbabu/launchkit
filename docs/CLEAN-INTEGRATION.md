# Clean integration for Launch Kit's Signals stage

Written 2026-09-10. Research only: no code changed. Companion to [LAUNCH-PLAN.md](LAUNCH-PLAN.md) and [ASSETS-STAGE.md](ASSETS-STAGE.md) (the Studio forge pattern referenced below). Every claim carries its source. The probes quoted here were run from this machine on 2026-09-10 with a small Node script (global fetch); no credentials were sent and nothing was registered with Clean.

## 0. The one-line answer

Does Clean have an API key? Not one a customer can use from outside the product, as far as anything public shows: Clean publishes no REST API, no developer page and no API-key setting; its only advertised programmatic surface is an MCP server that accepts OAuth 2.1 bearer tokens only; and the single public mention of a "Clean API key" is in the privacy policy, for Clean's own Chrome extension. Whether a workspace member can mint such a key, and whether the MCP server would accept it, is a question only Clean can answer (section 6, task 1).

## 1. What Clean offers (facts with sources)

### Product

- Clean is "an AI GTM system for B2B SaaS teams" that "connects company knowledge, relationship data, buyer signals, lead profiling, and low-volume outbound into one warm revenue motion" (https://www.tryclean.ai/faq).
- It learns a company from its site, uploaded documents and chosen Gmail threads, researches "Role, company, funding, and timing" on every candidate, ranks candidates by fit, and "Verifies every contact: Email and phone checked against trusted providers" (https://tryclean.ai/).
- Profiling model: every account is scored "against 75 buying signals across 8 categories for under a dollar", then ranked "S through C with the evidence behind every score" (https://www.tryclean.ai/icp-scoring). Signal types named on the site: hiring patterns, product launches, funding, technology changes, role changes, content themes, customer similarity, relationship context, public problem statements (https://www.tryclean.ai/buyer-signals).
- Workflow in the app: upload knowledge; "Tell Clean your ideal leads" by pasting a website, describing best customers, or listing ideal companies; get "a ranked list with the account, contact information, connect path, timing signal, and fit evidence already attached" (https://www.tryclean.ai/lead-generation). A deep search on one account returns a sourced dossier: firmographics, signals, and every decision maker's contact details (https://www.tryclean.ai/profile-research).
- Warm paths come from the team's own LinkedIn graph; the "Clean for LinkedIn" Chrome extension connects a member's LinkedIn session to their Clean account (privacy policy, last updated September 1, 2026: https://www.tryclean.ai/privacy).
- Data handling (same policy): data flows only to the customer's workspace and Clean's hosting processors; Gmail access is read-only and scoped to chosen leads; LinkedIn session cookies are stored encrypted; deletion on disconnect, backups expire within 30 days.
- RocketRide is listed among the customer logos on the homepage (https://tryclean.ai/), and the user has an account.
- Team: Clean AI Labs, Inc.; Pavan Kumar, Pratham Patel, Clarissa Saputra, Tejas Gupta (https://www.tryclean.ai/builders). Every page books demos through Tejas's Calendly link. Customer story: Vivameda, "$50K signed in two weeks", reply rate "4% to 11%" (https://www.tryclean.ai/customers).

### Integrations (https://www.tryclean.ai/integrates-with and child pages)

- HubSpot and Salesforce: Clean reads Companies, Contacts and Deals (HubSpot) or Accounts, Contacts, Leads and Opportunities (Salesforce), and writes the S to C rank and its evidence back onto the records (https://www.tryclean.ai/integrates-with/hubspot, https://www.tryclean.ai/integrates-with/salesforce). The homepage lead list shows an "Add all to CRM" action.
- Clay and Apollo: hand-off by export and import. "You export or sync the enriched table from Clay, then import those records into Clean as leads" (https://www.tryclean.ai/integrates-with/clay). No API is mentioned on either page.
- Slack: ranked accounts, evidence and draft outreach posted to channels; approve, edit or decline from Slack (https://www.tryclean.ai/integrates-with/slack). Pages also exist for Outreach, Salesloft, LinkedIn Sales Navigator, Notion and Gong.

### Programmatic access

- MCP is the advertised API. "Clean exposes its lead intelligence through a native MCP server. Any MCP-compatible client can query accounts, retrieve S-to-C rankings, and pull buying-signal data programmatically." A connected client can "Retrieve S-to-A ranked accounts and their supporting evidence in any MCP host", "Inspect individual buying signals by category on demand", and "Feed Clean's lead intelligence into your own internal agents or tooling". The page's comparison table lists "REST API polling" as the inferior alternative ("Custom integration, webhook mapping, ongoing maintenance"), which reads as: MCP is the API, and there is no separate REST product (https://www.tryclean.ai/answers/sales-tool-with-mcp).
- MCP endpoint and auth, verified by probe on 2026-09-10:
  - `https://huginn.tryclean.ai/mcp` answers 401 with `WWW-Authenticate: Bearer resource_metadata="https://huginn.tryclean.ai/.well-known/oauth-protected-resource"` for both GET and an unauthenticated `initialize` POST.
  - Protected resource metadata: resource `https://huginn.tryclean.ai/mcp`, authorization server `https://huginn.tryclean.ai`.
  - Authorization server metadata (`https://huginn.tryclean.ai/.well-known/oauth-authorization-server`): authorize `/mcp/authorize`, token `/mcp/token`, dynamic registration `/mcp/register`, scopes `mcp` and `offline_access`, response type `code`, grant types `authorization_code` and `refresh_token`, PKCE `S256`, token endpoint auth `none`. There is no `client_credentials` grant, so the OAuth side offers no machine-to-machine path. `offline_access` means refresh tokens are issued, which is what makes a bridge (option b) possible.
  - `https://huginn.tryclean.ai/health` returns `{"ok":true,"service":"huginn-api","db":"ok"}`; `/docs`, `/api` and `/openapi.json` on that host are 404.
- The web app (`https://app.tryclean.ai`, sign-in at `/sign-in?redirect_url=...`) carries a brand config with `mcpServerName: "clean"` and public tutorial videos at `https://app.tryclean.ai/tutorials/claude-code.mp4`, `/tutorials/claude-desktop.mp4` and `/tutorials/extension.mp4` (HEAD 200). A white-label brand in the same config ("Vivameda") has its own `apiOrigin` and `huginnOrigin` (`https://mcp.vivameda.com`), so the MCP server is a per-brand product surface and Clean does white-label deployments (not documented publicly).
- A REST host exists but is private to the app: `https://api.tryclean.ai/health` is 200; every other path answers 401 `{"error":{"code":"unauthenticated","message":"Missing or malformed Authorization header"}}`. A non-JWT bearer gets "Invalid Compact JWS"; a well-formed HS256 JWT gets `Unsupported "alg" value for a JSON Web Key Set`. So that API validates asymmetric JWTs against a key set (the session tokens the app's sign-in issues); its CORS preflight allows only `https://app.tryclean.ai`; `ApiKey` and `Token` schemes and an `x-api-key` header are all rejected as malformed; no OpenAPI document is reachable.
- The privacy policy says the Chrome extension stores "Your Clean API base URL, API key, and a short-lived connect-session token" locally and reads the user's LinkedIn data "through Clean's API" (https://www.tryclean.ai/privacy). This is the only public evidence that API keys exist. Nothing says a user can create one, where, or what it unlocks.

### What does not exist publicly

- No docs site: `https://docs.tryclean.ai/` returns Vercel `DEPLOYMENT_NOT_FOUND`; on `www.tryclean.ai`, `/pricing`, `/api`, `/developers`, `/docs`, `/changelog`, `/partners` and `/mcp` are 404; `mcp.tryclean.ai` and `kernel.tryclean.ai` are 404. The sitemap (102 URLs: https://www.tryclean.ai/sitemap.xml) has no pricing, developer, API, changelog or partner page.
- Pricing: none published. The only number is "under a dollar" per profiled lead.
- Webhooks, rate limits, plans that include API access: not mentioned anywhere on the site.
- Access model: "Clean is in closed beta and onboards a few teams at a time, so you start by requesting access" (https://www.tryclean.ai/integrates-with/hubspot); "One demo call. Indexed in a day. Replies in your pipeline inside a week." (https://tryclean.ai/, FAQ).
- Partner or agency programme: no programme page. The use-cases page says agencies "can run separate client motions with shared infrastructure: different ICPs, different knowledge bases, different tones, and unified reporting" (https://www.tryclean.ai/use-cases). White-labelling is visible only in the app bundle.
- MCP tool list: unknown until someone authenticates. The `clean` server registered in this machine's Claude Code config (`claude mcp get clean`: type http, `https://huginn.tryclean.ai/mcp`) still reports "Needs authentication"; a non-interactive session cannot run the OAuth flow.

### Name collisions to ignore

- Search engines still hold stale pages titled "Clean MCP. One context layer for every coding agent" (`www.tryclean.ai/mcp`, `docs.tryclean.ai`) that describe a hosted code-search MCP "with an API key". That was an earlier, unrelated product line from the same team (open source at https://github.com/cleanmcp/clean-mcp, MIT, tools `index_repo`, `search_code`, `list_repos`); its hosts are gone. The "API key" in those snippets is not the GTM product's.
- "Cleanlist.ai" (https://www.listyourtool.com/tools/cleanlist-ai, https://chatgate.ai/post/cleanlist-ai) is a different company.
- Third-party coverage: the two GTM tool round-ups that search returned (https://syncgtm.com/blog/best-gtm-engineering-tools-2026, https://pipeline.zoominfo.com/sales/ai-gtm-tools) do not mention Clean. No independent write-up of Clean's API or MCP server was found.

## 2. Does an API key path exist?

Verdict: unknown, leaning no. Three facts:

1. No, publicly: no page, setting, plan or document mentions a customer API key for the GTM product; the MCP server advertises OAuth only; `api.tryclean.ai` wants a JWT that the app's sign-in issues.
2. Yes, internally: Clean's own extension holds a "Clean API key" against a "Clean API base URL", so key issuance exists in their backend.
3. Unknown: whether a workspace member can mint a key in the app, whether `huginn.tryclean.ai/mcp` accepts it as a bearer, and its lifetime. Only Clean can answer, and the existing relationship (RocketRide's logo on their homepage) makes this a one-email question.

## 3. What the Signals stage does today (code facts)

- Purpose: find public posts where a person asks for, or describes living with, the problem the app solves, then draft a help-first reply. Targets ranks launch venues (`apps/launchkit/pipelines/lk_targets.pipe`: agent + Exa + Firecrawl). Neither stage discovers accounts or people.
- Run path (`apps/launchkit/src/data/api.ts`, `runStage(id, 'signals')`): `buildSignalsQuestion(profile, subreddits from selected targets)` (`src/domain/questions.ts`: APP_PROFILE JSON, ICP_PAIN, PAIN_HINTS, COMMUNITIES) → `askSignals('lk_signals.pipe')` (`src/data/runner.ts`, restarts the pipe once on the no-tools death signature) → `gateSignals` (`src/domain/gates.ts`: drops non-URLs, the app's own content, non-thread URLs) → `rescoreSignals` (`src/data/rescore.ts`: the browser fetches HN, StackExchange and GitHub content, `lk_rescore.pipe` judges relevance and writes the final reply) → rows in the `signals` table with status carried by URL, plus a `signals_meta` commercial result (queries, coverage notes, gate drops, rescore rejections).
- Pipe (`apps/launchkit/pipelines/lk_signals.pipe`): `chat → agent_rocketride ("Launch Kit intent-signal scout", max_waves 24) → response_answers`, controlled by `llm_openai_api` (Claude Sonnet through the Anthropic compat endpoint, `${ROCKETRIDE_ANTHROPIC_KEY}`), `memory_internal`, `tool_exa_search` (`${ROCKETRIDE_EXA_KEY}`) and `tool_http_request` (GET only, whitelist HN Algolia, GitHub search and StackExchange, 2 requests per second). Output contract: `{signals:[{rank, platform, url, title_or_quote, posted_when, why_relevant, intent_strength, drafted_reply}], search_queries_used, coverage_notes, confidence}`. Reddit is not searchable from the pipe.
- UI (`apps/launchkit/src/components/launchkit/stages/signals-stage.tsx`): `LockedGate` before Gate 1; an `Orient` lead; a queue of `SignalCard` (source row, quote, drafted reply in a `Well`, `ProvenanceLine`, `StatusStamp` go or unverified, Copy reply, Mark replied, Dismiss with a confirm dialog); `HonestEmpty` states ("No signals yet." with "Scan for live demand", and "Queue clear."); a `ScanReport` built from `signals_meta`.
- Types: `SignalRow` (`src/lib/types.ts`), `SignalData` (`src/domain/types.ts`); `Profile.icp` is `Icp { who, pain, current_alternatives, buying_trigger }`.
- Plumbing a new job kind touches `STAGE_KINDS` in `src/domain/status.ts`, `jobLabel` in `src/lib/jobs.ts`, `runJob` and `stageDots` in `src/components/launchkit/project-provider.tsx`, and the `api` facade.
- Constraint from LAUNCH-PLAN.md: pipeline secrets are per org. `${ROCKETRIDE_*}` resolves in the connection owner's environment, so any Clean token in a pipe is the running user's own (bring your own keys), never RocketRide's.
- Local-service precedent: the Assets stage calls the Studio forge (`services/studio-forge/server.mjs`, Node on `127.0.0.1:3500`, CORS open, `GET /health`, job routes, secrets in its own gitignored `.env`) from the browser through `src/data/studio.ts` (`studioUrl()` from the `studio_url` setting; start a job, then poll `/jobs/:id`), with a Settings card (`src/pages/settings.tsx`) that edits the URL and shows `/health`. Errors carry the fix: "Start it with npm start in services/studio-forge".
- RocketRide's `mcp_client` node (`rocketride-server/nodes/src/nodes/tool_mcp_client`): profiles `RocketRide` (stdio), `streamable_http` (`endpoint`) and `sse`; fields `serverName`, `transport`, `endpoint`, `headers` (object) and `bearer` (secure, sent as `Authorization: Bearer`). Tools are discovered once at pipeline start via `tools/list` and cached; each request has a 20 second timeout; there is no OAuth flow and no token refresh.

## 4. Three integration options

### Option a: Clean's MCP server through `mcp_client` in a pipe

Shape: a new `lk_leads.pipe` (or a second agent in `lk_signals`) whose `agent_rocketride` controls an `mcp_client` node pointed at `https://huginn.tryclean.ai/mcp`, bearer from `${ROCKETRIDE_CLEAN_TOKEN}`. The agent receives the ICP, calls Clean's tools for ranked people and companies, and returns Launch Kit's lead contract (section 5).

```json
{ "id": "mcp_client_1", "provider": "mcp_client",
  "config": { "profile": "streamable_http",
    "streamable_http": { "serverName": "clean",
                         "endpoint": "https://huginn.tryclean.ai/mcp",
                         "bearer": "${ROCKETRIDE_CLEAN_TOKEN}" },
    "parameters": {} },
  "control": [{ "classType": "tool", "from": "agent_rocketride_1" }] }
```

Field names come from the node's `services.json`; confirm where a saved pipe places `bearer` (inside the profile block or beside it) before relying on this snippet.

Precondition: a bearer that Clean's MCP server accepts without an interactive flow. Two ways to get one: (1) Clean issues a long-lived token or API key (unknown; task 1); (2) run the OAuth flow once (Claude Code `/mcp`, or a short script doing dynamic registration, PKCE and a loopback redirect with `offline_access`) and paste the access token into the environment. Path 2 works only until that access token expires; the lifetime is unknown and the node cannot refresh.

Effort: small once a token exists, about 1 day: pipe, `buildLeadsQuestion`, `runStage('leads')`, a gate, the `leads` table and the Leads view. Add half a day if a token script is needed.

Risk: high on auth, medium on fit. A static token expires silently and the stage goes empty behind an opaque MCP 401. Each Launch Kit user needs their own Clean workspace and token, and Clean is invite-only. Tool names and schemas are unknown. Clean's own UI shows lead searches as long-running ("Clean is thinking… Scanning corporate spend: press, job boards, filings…"), and the node's 20 second per-request timeout may cut such calls off. Tools are cached at pipe start, so a restart is needed whenever Clean adds one.

### Option b: a small local bridge that holds the OAuth session (the Studio forge pattern)

Shape: `services/clean-bridge`, a Node service on `127.0.0.1:3510` with no dependencies beyond Node itself. It registers a public client once at `/mcp/register`, runs the authorization-code flow with PKCE against `/mcp/authorize` with scopes `mcp offline_access`, receives the code on a loopback redirect, stores the refresh token encrypted in its own gitignored `.env`, and refreshes access tokens on demand. Routes: `GET /health` (connected, workspace, token expiry), `GET /connect` (the authorize URL the Settings card opens), `GET /callback`, `GET /tools` (proxied `tools/list`), `POST /leads` (a job: calls the right Clean tools for the ICP, normalises the result into the lead contract), `GET /jobs/:id`, and `GET /token` (a fresh access token, which lets option a run in a local RocketRide runtime). Browser side: `src/data/clean.ts` mirroring `src/data/studio.ts`, a `clean_url` setting, and a Settings card with a Connect button and a health line.

Effort: medium, 2 to 3 days: OAuth client with loopback callback and refresh (1 day), bridge routes and the job model copied from the forge (half a day), app client, Settings card, Leads view and contract (1 day).

Risk: medium. Unknowns are Clean's registration policy (loopback redirect URIs are the norm for public PKCE clients, but their server may restrict them), refresh-token lifetime, and rate limits. Structural: one more local service per user, the same trade-off already taken for the Studio forge; external users of the deployed app cannot use it unless the bridge is hosted, which then needs multi-tenant token storage. Tool schemas stay unknown until task 1.

### Option c: native lead finding in `lk_signals` (Exa plus enrichment)

Shape: an `lk_leads.pipe` with the `lk_targets` skeleton (agent + `tool_exa_search` + `tool_firecrawl`) plus one enrichment provider behind `tool_http_request` (POST allowed, URL whitelist to that provider only, key in `${ROCKETRIDE_ENRICH_KEY}`; candidates are Hunter, People Data Labs or Apollo's enrichment endpoint). The agent derives 8 to 10 company search phrasings from `icp.who`, `icp.buying_trigger` and `target_user`, uses Exa's company and people search (LinkedIn profile results), reads company pages with Firecrawl for evidence, calls enrichment for email verification, and returns ranked companies and people with `why_fit`, evidence lines and verification flags. A judge pass in the `lk_rescore` pattern rejects weak fits before storage.

Effort: medium to large, 3 to 5 days: pipe and prompt (1 day), enrichment integration and its key in the BYOK panel (1 day), gate plus judge (half a day), UI and contract (1 day), eval cases in `backend/evals` (1 day, real token cost).

Risk: quality and compliance rather than auth. No relationship graph, no verified phone, no 75-signal model; contact enrichment raises consent and data-handling questions for the app's privacy copy; one more required key for every user; Exa recall for people is uneven. Upside: no dependency on Clean's closed beta, it works for external users under bring-your-own-keys, and the same pipe can later merge Clean results as a second source.

Recommendation: do option b now for RocketRide's own launches (the account exists, and the bridge's `/token` route also unblocks option a in a local runtime), and keep option c as the external-launch path, since neither a nor b can be offered to outside users while Clean stays invite-only. Decide after task 1: a yes from Clean on a long-lived token collapses b into a.

## 5. Data flow and the Leads step

In, from the approved profile (Gate 1):

- `site_url`, `one_liner`, `description`, `category`, `target_user`, `icp.who`, `icp.pain`, `icp.current_alternatives`, `icp.buying_trigger`, `differentiators`, `proof_points`.
- Optional: the selected targets' `audience_signal` values (venue audiences double as company hints) and the Brand DNA voice for the drafted message.
- Mapping to Clean's own intake ("Paste your website", "Describe your best customers", "List a few ideal companies"): `site_url` becomes the website; `icp.who` plus `target_user` become the best-customers description; ideal companies are an optional free-text field on the Leads step.

Out, a new `leads` table (one row per person or company) plus a `leads_meta` commercial result:

```ts
type LeadRow = {
  id: string; project_id: string; rank: number; job_id: string;
  status: 'new' | 'contacted' | 'dismissed'; status_by?: string;
  kind: 'person' | 'company';
  data: {
    name: string; title?: string; company: string; company_domain?: string;
    fit: 'S' | 'A' | 'B' | 'C'; fit_score?: number;
    fit_evidence: { category: string; text: string; source_url?: string }[];
    timing_signal?: string; warm_path?: string;
    email?: string; email_verified?: boolean;
    phone?: string; phone_verified?: boolean;
    linkedin_url?: string;
    drafted_message?: string;
    source: 'clean' | 'native'; source_id?: string; fetched_at: string;
  };
};

type LeadsMeta = {
  source: 'clean' | 'native';
  query: Record<string, unknown>;
  counts: { returned: number; kept: number; dropped: number };
  coverage_notes: string;
  dropped: { name: string; reason: string }[];
};
```

Rules carried over from posts: never fabricate a contact; a contact field is either verified by the provider (the word "Verified") or shown as unverified; `status` survives re-runs by `source_id` or `linkedin_url` (the `carrySignalStatusByUrl` pattern); the drafted message follows the same help-first rules as replies.

On the Signals stage: the stage keeps one queue and gains a `Segmented` switch above it (ariaLabel "Signal kind", options Posts and Leads). No step numbering: posts and leads are parallel, not sequential. The Leads view:

- `Orient` lead: "People and companies that fit your profile, ranked with evidence. Write to them in your own words, mark contacted, or dismiss." The detail names the source: "Ranked by Clean against the approved profile", or "Found by Launch Kit, contact details verified by <provider>".
- `LeadCard`: rank and a fit `Badge` with the word ("S fit"); name, title, company link; the evidence list (category: text); each contact field with a `StatusStamp` (go "Verified" or hold "Unverified"); a `Well` with the drafted message; `ProvenanceLine` parts ["From Clean", "Ranked against the approved profile"]; actions Copy email, Copy message, Mark contacted, Dismiss (confirm dialog, same as posts). Colour never carries meaning alone: every stamp and badge has a word.
- `HonestEmpty` states: not connected ("No leads yet." / "Clean is not connected to Launch Kit." / action "Connect Clean", which opens Settings); connected but empty ("No leads yet." / "Clean found nobody matching the approved profile. Widen who the buyer is, or the buying trigger, in your profile." / action "Find leads"); queue clear ("Queue clear." with the contacted and dismissed counts).
- A `LeadsReport` like `ScanReport`, built from `leads_meta`. Keep the existing `RawData` block; do not add another.
- Settings: a "Clean" card next to the Studio card (bridge URL, Connect, health line with workspace name and token expiry). `stageDots.signals` stays as it is: hold while either queue has new items.

## 6. First three concrete tasks

1. Authenticate and inventory (half a day, no code). In an interactive Claude Code session run `/mcp`, authenticate the existing `clean` server, and record in this document: the `tools/list` output (names, input schemas, result shapes), one real `tools/call` for a lead search with its latency and result size, and whether an access token pasted as `bearer` into a scratch `mcp_client` pipe on the dev connection works at all. Watch `https://app.tryclean.ai/tutorials/claude-code.mp4` and check the app's Settings for any token or key page. The same day, email hello@tryclean.ai (or Tejas) with four questions: a long-lived token or API key that `huginn.tryclean.ai/mcp` accepts; refresh-token lifetime; rate limits and per-lead cost on RocketRide's plan; whether Launch Kit users outside RocketRide could be onboarded.
2. Bridge skeleton (1 to 1.5 days). `services/clean-bridge` with `/health`, `/connect`, `/callback`, `/tools` and `/token`, dynamic registration and PKCE, encrypted refresh-token storage in its own gitignored `.env`, plus `src/data/clean.ts` and the Settings card. Exit: the running preview shows "Connected" and lists Clean's tools by name.
3. Lead contract and Leads view on fixtures (1 day). Types in `src/lib/types.ts` and `src/domain/types.ts`; `leads` and `leads_meta` storage in `src/data/api.ts`; `STAGE_KINDS` and `jobLabel` entries; the `Segmented` switch, `LeadCard`, empty states and `LeadsReport`, driven by a fixture file until task 1 fixes the real shapes. Then wire `POST /leads` (option b) or `lk_leads.pipe` (option a or c) behind the same `api.runStage(id, 'leads')`. Add three eval cases to `backend/evals` when option c starts.

## 7. Sources

Clean, first party
- https://tryclean.ai/ (homepage, customer logos, FAQ)
- https://www.tryclean.ai/faq
- https://www.tryclean.ai/how-it-works
- https://www.tryclean.ai/lead-generation
- https://www.tryclean.ai/profile-research
- https://www.tryclean.ai/icp-scoring
- https://www.tryclean.ai/buyer-signals
- https://www.tryclean.ai/use-cases
- https://www.tryclean.ai/security-and-deliverability
- https://www.tryclean.ai/for/devtools
- https://www.tryclean.ai/compare
- https://www.tryclean.ai/customers
- https://www.tryclean.ai/builders
- https://www.tryclean.ai/integrates-with
- https://www.tryclean.ai/integrates-with/hubspot
- https://www.tryclean.ai/integrates-with/salesforce
- https://www.tryclean.ai/integrates-with/clay
- https://www.tryclean.ai/integrates-with/slack
- https://www.tryclean.ai/answers/sales-tool-with-mcp
- https://www.tryclean.ai/answers/leads-with-contact-info-and-insights
- https://www.tryclean.ai/answers/crm-you-can-talk-to
- https://www.tryclean.ai/privacy
- https://www.tryclean.ai/support
- https://www.tryclean.ai/sitemap.xml
- https://huginn.tryclean.ai/.well-known/oauth-authorization-server
- https://huginn.tryclean.ai/.well-known/oauth-protected-resource
- https://huginn.tryclean.ai/health
- https://huginn.tryclean.ai/mcp (401 probe)
- https://api.tryclean.ai/health and https://api.tryclean.ai/v1/me (401 probes)
- https://app.tryclean.ai/ (brand config in the public JS bundle; tutorial video assets)

Dead or stale
- https://docs.tryclean.ai/ (404, Vercel DEPLOYMENT_NOT_FOUND)
- https://www.tryclean.ai/pricing, /api, /developers, /docs, /changelog, /partners, /mcp (404)
- https://mcp.tryclean.ai/ and https://kernel.tryclean.ai/ (404)
- https://github.com/cleanmcp/clean-mcp (the earlier code-search product)

Third party
- https://syncgtm.com/blog/best-gtm-engineering-tools-2026 (does not mention Clean)
- https://pipeline.zoominfo.com/sales/ai-gtm-tools (does not mention Clean)
- https://www.listyourtool.com/tools/cleanlist-ai and https://chatgate.ai/post/cleanlist-ai (a different company)

RocketRide and Launch Kit, local
- `.rocketride/docs/ROCKETRIDE_PIPELINES.md` (Pattern 13, `mcp_client`)
- `rocketride-server/nodes/src/nodes/tool_mcp_client/README.md` and `services.json`
- `apps/launchkit/pipelines/lk_signals.pipe`, `lk_targets.pipe`, `lk_rescore.pipe`
- `apps/launchkit/src/data/api.ts`, `runner.ts`, `rescore.ts`, `studio.ts`
- `apps/launchkit/src/domain/questions.ts`, `gates.ts`, `status.ts`, `types.ts`
- `apps/launchkit/src/components/launchkit/stages/signals-stage.tsx`, `project-provider.tsx`
- `services/studio-forge/server.mjs`
- `docs/LAUNCH-PLAN.md`
