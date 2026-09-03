# Paste-ready prompt for your coding agent

App owners: after unzipping `app-development-docs/` into the root of your app repo, paste the prompt below to your coding agent (Claude Code, Cursor, etc.) verbatim. It works for every app category — the agent classifies your app and routes itself.

---

We are migrating this app onto the RocketRide platform for the App Marketplace launch on September 1, 2026. The complete migration documentation is in the `app-development-docs/` folder in this repo — it is the single source of truth for this process.

Your job is to drive this app through the migration using that documentation:

1. **Start by reading `app-development-docs/00-INDEX.md` in full.** It has the process flowchart, the documentation map, and a router table by app category.
2. **Classify this app** into one of the three categories in the router table — *standalone* (own repo, own backend/auth/router), *saas-structure* (built on shell-ui / the RocketRide saas app structure), or *already on staging* — by inspecting this repo. Tell me which category you chose and why before doing anything else.
3. **Follow that category's documented path in order** (docs 01 → 06 as routed). Do not skip steps and do not reorder phases — each doc de-risks the next, and each phase has verification gates that must pass before moving on.
4. **Obey the ground rules in 00-INDEX.md at all times**, especially: never hand-create app files (scaffold only, via `client.deploy.createApp`); pnpm, never npm; vendored `rocketride`/`shell` tarballs only, never the npm registry; never invent `client.*` methods or pipeline components — verify them against the vendored client, `.rocketride/services-catalog.json`, and `.rocketride/schema/`; and read the platform docs in `.rocketride/docs/` (starting with `ROCKETRIDE_README.md` and its task router) before writing any RocketRide code.
5. **The guide references canonical platform documents** (`README-apps.md`, `README-app-styles.html`, the release-process docs, `.rocketride/docs/*`). Read them where the guide sends you; never edit or restyle them — and never edit the `app-development-docs/` guide itself.
6. **Stop and hand back to me for anything human-owned**: installing the staging extension, minting API keys, claiming our org's developer id, redeeming the app-building token coupon `HACKANAPP` (Account → Billing on staging), setting secrets in the server environment, and getting custom-node PRs reviewed. Tell me exactly what to do; do not attempt these yourself.
7. **Produce the written artifacts before writing code**: the Phase-0 binding inventory and the migration contract (doc 03 §2). Show me both for review before any porting begins.
8. **Track progress against `app-development-docs/06-ready-to-deploy-checklist.md`** and keep it updated as we complete boxes. Our development deadline (through Stage 1, plus raising any custom-node PRs) is August 27, 6:00 PM; everything must be sign-off-ready before September 1.

If we hit an app-side blocker (structure, shell API, pipelines, this guide), tell me to contact **Shashidhar Babu — shashidhar.babu@rocketride.ai**. If the staging server or deploy pipeline itself is broken (server-side build failures before our code runs, DB broker gaps, staging outage), tell me to contact **Dmitrii**.

Begin with steps 1 and 2 now and report back.
