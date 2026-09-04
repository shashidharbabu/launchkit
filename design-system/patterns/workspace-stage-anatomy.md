# Pattern: the workspace and its seven stages

Files: `components/launchkit/workspace-shell.tsx`, `stage-rail.tsx`,
`stages/*.tsx`, `stage-common.tsx`, `lib/stages.ts`, `project-provider.tsx`.

## The workspace header

```
Launches / Pingdeck  pingdeck.app ↗                 <- breadcrumb, 14px muted
[Profile] [Brand] [Commercial] ...                  <- stage strip, below lg only
Targets                                             <- text-display
Where this app should launch, ranked, with each     <- stage summary, 16px muted
venue's rules. You choose the few that count.
                       [⟳ Ranking launch venues 42s] [Run history]
────────────── error banner, when there is one ──────────────
stage body
```

The launch itself lives in the rail (name, host, the gantry). The header is about the
stage: its name and its one-sentence summary from `lib/stages.ts`. On the right: the
running indicator when a job runs, and Run history. Errors land in a `nogo` banner with a
Retry when the failed job is retryable.

## A stage body, in order

1. `LockedGate` if Gate 1 is not passed (every stage but Profile).
2. `StageIntro`: one lead sentence saying what Launch Kit did and what the person should
   do, with the ask in medium weight; one muted detail sentence. Only when there is data.
3. An actions row when the stage has a top-level verb: `primary` Re-rank / Re-run, and a
   14px muted count ("5 selected of 18 ranked").
4. The content: cards, a table, a stack.
5. Provenance under the content it describes; `RawData` folded at the bottom of a card.
6. `HonestEmpty` when there is nothing yet, with the run verb as its action.

Blocks are 20px apart (`grid gap-5`). Two-column stages use `lg:grid-cols-2`.

## The seven stages

| Stage | Gate | Shape of the body |
| --- | --- | --- |
| Profile | 1 | One Gate panel. Four review rows ("What your app is", "Who it is for", "The pain it solves", "Why you are different"), each a claim in reading type with a ghost Edit that turns it into a textarea; a collapsed "More detail" section; a collapsed "Where this came from" section with a confidence progress and the sources read, each stamped Read or Failed. Partial analyses show a hold banner. |
| Brand | | Two cards: Business DNA (voice as badges, vocabulary, key messages, observed color swatches, typography, do and don't, sources) and Campaigns (each a card with a hook quote, sample copy in a well with Copy). |
| Commercial | | Two cards: Pricing (tiers as wells, rationale, model badge, anchors, risks, competitors table with standing badges, rejected list) and Listing (title, tagline, description rows, keyword badges, FAQ, changes). |
| Assets | 2 | A row of secondary "Draft X" buttons, a count line, then one card per asset: header with platform mark and stamp, warnings banner, the draft in a well that opens to a reading dialog, provenance, footer with Approve (flare on the first pending), Copy, Regenerate with feedback. |
| Targets | 3 | An actions row, then a framed sortable table: checkbox, rank, venue, kind, impact badge, effort, link, details. Expanded rows show why it fits, the rules, and the audience signal. |
| Signals | | An actions row with counts, then a stack of signal cards: source line with a Verified or Unverified stamp, the ask as a quote, the drafted reply in a well, provenance, footer with Copy reply, Mark replied, Dismiss (confirm dialog). Handled cards exit with height. |
| Plan | | Copy launch plan as the primary, tracked links table with ref chips, telemetry (a stat tile and the attribution card with the bar chart and table), the markdown export card. |

## State in the rail

`project-provider.tsx` derives `stageDots` from real data (profile status, drafts,
approvals, selections, queue) and the gantry paints them. A stage's node is filled only
when the stage is actually done; the rail never guesses.

## Copy on stages

Intros name what happened and what to check: "Launch Kit ranked where this app should
launch. Tick the venues you will actually do; five right venues beat fifty." Buttons are
verbs the person would say: "Find launch venues", "Re-run signal search", "Draft pricing
and listing", "Read my app again". Nothing says "pipeline", "job", or "model" on a stage.
