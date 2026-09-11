# Launch Kit — Manual Test Checklist (Phase 2)

Run twice: once by the builder in the hardened preview, once by the owner in the real shell (staging, signed in as the org account, after clearing site data). Record each line as PASS / FAIL with the run id; every FAIL gets a trace (Runs → expand row → Pipeline trace) and an entry in [MIGRATION-ISSUES-LOG.md](MIGRATION-ISSUES-LOG.md).

Legend: **Expect** = what you must see. **Triage** = where to look when it fails.

## Facts established by the automated Phase 1b passes (2026-09-02)
- The app **disables every stage action while any run is in flight**; wait for the Runs badge to clear before clicking the next action.
- Commercial's single action "Draft pricing & listing" runs pricing **then listing automatically**; "Regenerate" re-runs pricing only. Commercial has **no approve gate** (gates are Profile, Assets, Targets).
- Brand is two vertical steps: "Extract Business DNA" first; "Draft the angles" appears once DNA is shown; "Choose this angle" on one angle turns the Brand dot green and Social Launch shows the angle in a banner.
- Assets: one "DRAFT …" button per type; after a draft: Approve, Copy, Regenerate with feedback, Redraft.
- Targets: venues are selected with the checkbox "Select <venue> for the plan".
- Signals: "Scan for live demand" takes **2–7 minutes** on the current model; an empty result now shows a **Scan report** (queries, coverage, drop reasons).
- Plan: "Copy launch plan" and "Copy markdown" both copy the Markdown plan; tracked links appear per selected venue.
- Typical durations seen: understand 1.5–2 min · brand DNA 1.5 min · campaigns 1 min · pricing 2 min · listing ~0.5 min · asset draft 0.5 min · targets 2 min.

## A. Shell integration
1. Open the app from the launcher. **Expect:** app fills the client area, own rail on the left, no shell sidebar column or "RocketRide / LAUNCH KIT" header.
2. Click the Launch Kit brand. **Expect:** Home view (landing). Click Dashboard, Launches, Runs, Settings. **Expect:** each view, rail highlight follows.
3. Toggle theme (rail bottom). **Expect:** whole app including rail switches; reload keeps it.
4. Press ⌘K. **Expect:** command palette opens; pick "New launch". 
5. Reload the page. **Expect:** launches and runs persist (per-user store). Sign out, sign in as a second account. **Expect:** that account sees none of the first account's launches.

## B. Launch creation and Stage 1 (Profile)
6. New launch → name, site URL, repo URL → Analyze. **Expect:** run appears in Runs as running; profile lands within ~2 min with a confidence and sources.
7. Edit one profile field, save. **Expect:** new version, HOLD stamp until approved.
8. "Something's wrong — redo it" with feedback. **Expect:** a new understand run; feedback reflected.
9. Approve. **Expect:** GO stamp, Stage 2 unlocked. **Triage:** Runs → trace: `lk_understand.pipe`, steps through tool_github / tool_firecrawl.

## C. Stage 2 (Brand) and Stage 3 (Commercial)
10. Run Brand DNA. **Expect:** Step 1 card, "Extracted" stamp. Run the angles. **Expect:** Step 2 card with an "At a glance" table and one card per angle (goal, where it plays, what you would make, how you would know). Press "Choose this angle". **Expect:** the card turns green with "Chosen, click to drop", the banner says "Chosen: <name>", and it survives a reload.
11. Run pricing. **Expect:** Step 1 card: tiers with Keep/Dropped and an editable price each, the research below with every competitor's own tiers; no "LLM error". Drop a tier, press "Use this pricing". **Expect:** green banner "Chosen: …" that survives a reload. Run listing. **Expect:** Step 2 card with the store page copy and "Approve listing"; approving turns the Commercial dot green.
12. (No gate here, but two decisions.) Plan shows "What this launch says" with the angle, the kept tiers and the listing title; the markdown export ends with Campaign angle, Pricing and Listing sections. **Triage:** traces for `lk_brand.pipe`, `lk_commercial.pipe` (Claude via compat; Exa/Firecrawl invokes).

## D. Stage 4 (Assets)
13. Generate each asset type. **Expect:** draft with gate verdict; a failing gate shows exactly why.
14. Regenerate one asset with feedback. **Expect:** new version honouring feedback. Edit, approve. **Expect:** GO.
**Triage:** `lk_assets.pipe` trace; gate logic is in `domain/gates.ts`.

## E. Stage 5 (Targets)
15. Run targets. **Expect:** ranked venues (curated + discovered); discovered venues appear in Settings → venues.
16. Select / deselect targets. **Expect:** selection persists after reload. **Triage:** `lk_targets.pipe`.

## F. Stage 6 (Signals)
17. Run signals. **Expect:** list of live threads with relevance; rescore writes help-first replies. Check one HN, one StackExchange, one GitHub thread. **Expect:** thread details load (client-side fetch; if blank in the shell, it is CORS — log it).
18. Change a signal's status (keep / reject). **Expect:** persists. **Triage:** `lk_signals.pipe`, `lk_rescore.pipe`.

## G. Stage 7 (Plan) and Attribution
19. Copy the launch plan ("Copy launch plan" / "Copy markdown"). **Expect:** the clipboard holds a Markdown plan starting `# Launch Plan — <app>` with all approved stages (JSON export is API-only).
20. Copy a tracked link; simulate a signup with its ref. **Expect:** attribution shows the signup under that ref.

## H. Runs and tracing
21. Open Runs. **Expect:** every run above is listed with status, duration, launch link.
22. Expand a successful run. **Expect:** collapsed trace: components line + "No step errors" + "Show all N steps" → scrollable timeline.
23. Force a failure (e.g. remove a key, run a stage). **Expect:** NO-GO, error text, and the erroring step surfaced first.

## I. Settings
24. Add a venue, disable a venue, reload. **Expect:** persists; targets respect enabled flag.

## J. Navigator chat (after Phase 1c)
25. On Home ask: "open my latest launch", "what is gate 2", "where do I add API keys", "show runs". **Expect:** correct navigation or a correct answer; never a wrong navigation.

## K. Auth and billing (after Phases 3–4)
26. Signed-out visit. **Expect:** shell blocks or app shows a clear sign-in state.
27. Free account: second active launch. **Expect:** limit message + Upgrade → checkout opens. Subscribe with promo. **Expect:** limit lifted. Cancel. **Expect:** back to Free.

## L. External user (Phase 6)
28. Fresh account, different org: install from the team rung, add keys in Settings, complete steps 6–20 with no help.

## Social Launch (stage 04, 2026-09-03)
- [ ] Stage rail and flow strip say "Social Launch"; no "Assets" anywhere in the UI (run labels read "Social Launch — <platform>").
- [ ] Picker shows seven platform cards, each with its rulebook summary; Draft/Redraft label reflects whether a draft exists.
- [ ] Every draft card has a visible "Regenerate with feedback" section with a textarea and a primary Regenerate button (no toggle).
- [ ] Action row: "Share on X" opens x.com/intent/post with the post prefilled; LinkedIn, Reddit, HN, email open their composers; Product Hunt copies the listing and opens new-post; video has Copy only.
- [ ] New drafts contain no em/en dash; if the model slipped one in, the card says "N dashes replaced by the punctuation rule" and no dash warning remains.
- [ ] Settings → "Platform rulebooks": switching platforms swaps the text; saving shows a toast; the next draft for that platform follows the edited rules.
- [ ] Drive: `cd launchkit-src/frontend && node drive.social.mjs` → prints SOCIAL_OK (runs one real LinkedIn draft).

## Team workspaces (2026-09-03)
- [ ] Top bar shows the workspace switcher with Personal and every team you belong to.
- [ ] Settings → Workspace lists the organisation, teams (member counts), members of the selected team, and an invite form; a non-admin sees the server's "Admin role required" message, not a blank.
- [ ] Deployed app: "Check store" reports ok with the dialect and a round-trip time. (Preview with an API key: it fails and says why.)
- [ ] Deployed app: switch to a team, create a launch, switch to Personal (it is gone), back to the team (it is there). A teammate opening the same team sees it within 30 s; saving on both sides yields a "teammate saved first" reload, never a silent overwrite.
- [ ] Drive: `cd launchkit-src/frontend && node drive.workspace.mjs` → WS_OK (preview-level checks only).

## Flow and quality (2026-09-03 evening)
- [ ] Every stage ends with a footer stating its state and a "Next: <stage>" button; Profile's button is disabled until approved; approving the profile lands on Brand.
- [ ] Brand shows "Step 2 of 2: Campaign angle" with "Choose this angle"; Social Launch shows the chosen angle in a green banner above the picker (no "Short video" tile any more; the spoken script lives on the Assets stage) and the draft reflects it.
- [ ] Drive: `cd launchkit-src/frontend && node drive.brand.mjs` (real pipelines, about 8 minutes) → BRAND_DONE with CHOSEN chosen=true and CHOSEN_COMMERCIAL listingApproved=true.
- [ ] A draft card shows the real app URL, never `{APP_URL}`; Copy and Share carry the real URL.
- [ ] Targets: no repository file appears as a venue; awesome-lists and directories never sit in the top 5; ranks are 1..N.
- [ ] Signals: the scan report lists open-web and LinkedIn/dev.to queries first and says Reddit is not searchable; LinkedIn and dev.to posts by people living the problem appear as signals with a problem-first drafted reply (hack-judge: 2 signals, about 13 minutes).
- [ ] Drive: `cd launchkit-src/frontend && node drive.flow.mjs` (real pipelines, about 12 minutes) → FLOW_DONE with TARGETS listingsInTop5 = 0 and repoFiles = 0.
