# Phase 2: the manual test pass, driven

2026-09-17. Run by the builder against the hardened preview on port 3400, seeded
from `docs/eval-10/cal-com/appstate.rerun.json`, plus one live run on an empty
store. Machine-readable results in `PHASE2-RESULTS.json` and `LIVE-STAGE1.json`.

The checklist asks for two passes: one by the builder in the preview, one by the
owner in the real shell. **This is the first pass only.** The second still needs
doing, and the items marked below as needing a shell can only be done there.

## Result

**19 pass, 0 fail, 7 skipped, zero page errors.**

Plus the live path, run separately on an empty store: a launch created from
nothing and Stage 1 completed against the real pipeline in 103 seconds, with a
profile a person would accept.

## One real defect found and fixed

`{APP_URL}` was printed literally in the warning lines of a draft card, while
the draft body beside it showed the real address. The checklist asks for exactly
this ("a draft card shows the real app URL, never `{APP_URL}`").

Cause: in `assets-stage.tsx` the blockers and warnings were read from the raw
`asset.data` a few lines **before** `data = fillDeep(asset.data, appUrl)`
substituted the URL, so the body was filled and the warnings were not. A reader
saw "First comment: {APP_URL}" next to a post carrying `https://cal.com`. Fixed
by reading all three from the filled copy.

## Two apparent failures that were faults in the test, not the app

Worth recording, because both would have been easy to report as defects.

- **The theme toggle "did not change on click."** It did. `theme.tsx` puts
  `.dark` on `#lk-root`, never on `<html>`, and the test was reading `<html>`.
- **"Two em dashes in Settings."** Both are inside GLOBAL rule 18, the rule that
  quotes the two characters it forbids, rendered by the rulebook editor. That
  one line is the documented exception. The check now strips it and fails on
  anything else.

## What passed

Shell and navigation: the rail renders with no page errors, all four views open,
the theme toggle survives a reload, the command palette opens on Cmd+K, and
launches persist across a reload.

Social Launch: the stage is named Social Launch, six platform rows with no Short
video tile, a drafted platform offers Redraft rather than Draft for, no em or en
dash anywhere on the stage, no occurrence of the banned launch verb, and the
real app URL everywhere.

Targets: ranks run 1..N with no repository file posing as a venue.

Plan: the copy controls are present, and the PDF download is now genuinely gated
behind Pro, which it was not while the plan override was forced on.

Settings: the subscription card no longer claims billing is unwired, the
rulebook editor reports version 4, raw data is hidden by default, and nothing
outside rule 18 carries a banned character or word.

## What was skipped, and why

None of these are passes. Each needs something a preview does not have.

| Item | Why |
|---|---|
| A second account sees none of the first account's launches | Needs two signed-in accounts. Proven instead by the ownership unit test: user-2 sees none of user-1's rows inside one shared snapshot. |
| Team workspace switcher, a teammate seeing the same launch | Needs the deployed app and a second signed-in teammate. |
| Store round trip ("Check store" reports ok) | Needs a signed-in user identity; an API-key preview cannot reach the store. |
| Free limit, upgrade, checkout with a card, cancel | Needs the deployed app in the real shell. The preview has no account to charge. |
| External user on a fresh account completes the flow unaided | Phase 6. Needs a real external account. |
| A failed Signals search shows its error | This store holds no failed scan to render. Signals itself is blocked separately, see SIGNALS-DIAGNOSIS.md. |

## Live Stage 1, in full

Empty store, no seed. Created a launch for Excalidraw with its site and
repository, pressed "Analyze my app", and waited.

- Completed in 103 seconds, against the checklist's stated 1.5 to 2 minutes.
- One project, one profile, one `understand` run at status `done`.
- Zero page errors. No failure text on screen. The Approve control appeared.
- The profile: confidence 0.88 with its reasoning, `analysis_degraded` false,
  fourteen fields, and a one-liner that reads "Excalidraw is a free, open-source
  virtual whiteboard for hand-drawn-style collaborative diagrams, with a paid
  cloud tier for teams."
- `owner_id` on the new project is empty, which is correct: nobody is signed in
  to the preview, so ownership filtering stays inert rather than hiding the row.

## Next

1. The owner's pass in the real shell, which is the half of Phase 2 that cannot
   be driven from here.
2. The four shell-only items above, once the app is deployed.
3. Signals remains blocked on its own issue and was not exercised.
