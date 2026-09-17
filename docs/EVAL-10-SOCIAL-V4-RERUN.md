# Social Launch v4, second run: what the follow-up rules actually cost

2026-09-16. Sixty drafts, ten apps, six platforms, re-drafted against the
rulebook as it stands after the v4 follow-ups, then judged by ten independent
judges, one per app.

The first report, [EVAL-10-SOCIAL-V4.md](EVAL-10-SOCIAL-V4.md), measured the
rulebook before the precedence rule and eleven new checks were added. Its own
Next list opened with: "Re-run the sixty drafts against the rulebook as it now
stands. The precedence rule and the eleven new checks have unit evidence but not
a full run behind them." This is that run. The earlier record is preserved as
`judged-social-v4.measured.json`, `matrix.v4measured.json` and, per app,
`appstate.v4measured.json`.

## The four acceptance criteria still pass

| Criterion | Result |
|---|---|
| 1. Zero hard-rule blockers on every draft | PASS |
| 2. Zero dashes, zero banned verb, zero invented names | PASS, invented names 0 |
| 3. No platform below its v1 baseline | PASS |
| 4. Every draft names its rulebook version | PASS, 60 of 60 at version 4 |

The repair pass fired on 11 drafts.

## And the follow-ups cost quality

Against the v1 baseline every platform is still up. Against the **v4 run that
was actually measured**, three platforms went down.

| Platform | v1 baseline | v4 measured | v4 now | vs measured |
|---|---|---|---|---|
| x_post | 3.6 | 4.00 | 3.80 | -0.20 |
| linkedin_post | 3.3 | 3.60 | 3.60 | 0.00 |
| reddit_post | 2.7 | 3.20 | 2.70 | **-0.50** |
| producthunt | 3.0 | 3.50 | 3.50 | 0.00 |
| show_hn | 2.8 | 3.00 | 2.90 | -0.10 |
| newsletter_pitch | 3.5 | 3.80 | 4.00 | +0.20 |
| **overall** | | **3.52** | **3.42** | **-0.10** |

Reddit landed exactly on its baseline. One more tenth and criterion 3 fails.

The loss is concentrated, not spread:

| App | v4 measured | v4 now | Change |
|---|---|---|---|
| hack-judge | 3.50 | 2.67 | -0.83 |
| excalidraw | 4.17 | 3.67 | -0.50 |
| formbricks | 3.50 | 3.17 | -0.33 |
| continue | 3.50 | 3.33 | -0.17 |
| cal-com, documenso, hoppscotch, khoj, plausible | | | unchanged |
| dub | 3.17 | 4.00 | +0.83 |

hack-judge has the thinnest profile in the set: alpha stage, confidence 0.1,
`analysis_degraded` true. It lost the most. That is the thin-profile rule working
as designed and being too blunt: the drafts became honest and stopped being
postable. Its Show HN body is 105 words carrying four placeholders, including
the entire how-it-works paragraph and the limitation. A judge called it "honest,
but there is almost no post left around them".

## The number that matters most

**Judge-reported blockers went from 3 to 9, while machine blockers stayed at 0.**

Every one of the nine is the same shape: a mechanism or a limitation invented
about the product or about a named competitor.

- cal-com reddit: two Calendly limitations the profile does not record.
- khoj reddit: a mechanism asserted about a named competitor, unsourced.
- khoj show_hn: a limitation contradicted by the profile's own client list.
- plausible reddit: a fabricated script-size figure, in a sentence comparing the
  number to itself.
- hoppscotch reddit: the required limitation is one of Launch Kit's own scrape
  failures, a 404, presented as a product gap. It is false.
- continue show_hn: an invented feature-parity gap, surviving from the first run.
- hack-judge producthunt: a shared-rubric mechanism stated as fact in the one
  field Product Hunt does not let a founder rewrite.

Reddit rule 7 requires naming the existing alternative and giving one real
limitation. When the profile holds neither, the model supplies them. The
precedence rule was meant to stop exactly this, and on Reddit it does not fire.

## Why the gate does not catch them

`thin_profile_no_mechanism` is registered on all six platforms. It failed on
hack-judge's Reddit body because its pattern assumes one word order:

    verb ... (and then produces | into a | to a sheet | so each)

The body says "a shared rubric-driven flow **so each person scores** against the
same criteria". The connective comes before the verb, so the pattern misses it.
Verified directly: the sentence is a MISS, while "it scans the repo and then
produces a report" is a MATCH.

That ordering gap is a half-hour fix. It is also the wrong lesson to take. Nine
blockers are semantic claims, not lexical patterns: whether a limitation is true
of Calendly, whether a 404 is a product gap, whether a number exists anywhere in
the profile. No regex decides those. **The gate has reached the limit of what
regular expressions can verify**, and the next real gain is the semantic claims
pass, not more patterns.

## One blocker outside the six posts

hoppscotch's studio assets still carry the banned launch verb, on screen three
times and spoken once in the reel. The social gate never sees the reel.

## Two harness faults found during this run, both fixed

**Two concurrent lanes silently destroy drafts.** Running two apps at once, both
came back `RERUN_OK` with 6 of 6 steps. Both had actually lost their Reddit
draft: the runs errored with "Connection closed normally" 25 seconds apart, and
the store quietly kept the previous version. A click that fails still leaves the
page idle in about five seconds, so the driver cannot tell. Every app was re-run
on a single lane, and this is very likely the same fault behind the Signals stage
failures in [SIGNALS-DIAGNOSIS.md](SIGNALS-DIAGNOSIS.md).

**`RERUN_OK` is not evidence.** Freshness is now checked by comparing each
draft's `created_at` against the run cutoff. All sixty drafts in this report are
confirmed fresh that way. The earlier acceptance numbers were briefly wrong
because the script was reading the previous run's judge file.

## What to do next, in order

1. **Fix the Reddit conflict.** Rule 7 demands an alternative and a limitation;
   the precedence rule says the thin-profile rule wins. On Reddit the demand
   wins and the model invents. Reddit is at its baseline because of this.
2. **The semantic claims pass.** Nine blockers need it. More regexes will not
   reach them.
3. **Soften the thin-profile rule** so a draft is not four placeholders in a
   hundred words. Honest and unpostable is still a failure.
4. Widen `thin_profile_no_mechanism` to the connective-first word order.
5. Bring the studio assets under the same verb sweep as the posts.
6. Joe's two flags, brand rulebook 4.3, remain unresolved and are the blocker on
   any provider comparison reaching a published draft.
