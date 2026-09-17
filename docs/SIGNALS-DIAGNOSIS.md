# Signals stage: why it scores 1.7 out of 5

Written 2026-09-16 from the ten saved stores in `docs/eval-10/<slug>/appstate.json`.
Read before changing `apps/launchkit/pipelines/lk_signals.pipe`.

## Resolved 2026-09-17, later the same day

The format was not a guess in the end: the server repo is on this machine, and
`nodes/src/nodes/tool_http_request/IGlobal.py` line 90 reads
`row.get('whitelistPattern')`. Each entry is an object:

    "urlWhitelist": [{ "whitelistPattern": "^https://(hn\\.algolia\\.com|...)/" }]

**Signals runs again.** cal-com went from a nine second crash to a completed 269
second scan, status `done`, one signal stored. formbricks went from `error` to
`done` in 225 seconds with an honest empty result. Both had previously died on
the prose-preamble failure, so the instruction fix is proven alongside.

Three things worth keeping from this:

1. **The whitelist was never enforcing.** `IGlobal.py` line 88 skips any row
   without `.get`, and strings have none, so every entry was discarded, the
   pattern list came out empty, and an empty list means allow all URLs. For as
   long as the config held strings, the guardrail was off. It is on now: it
   admits the three API hosts and blocks `news.ycombinator.com`, which the agent
   is told to reach through Algolia anyway.
2. **The key name is confirmed by behaviour, not just by reading.** A wrong key
   would yield an empty pattern list and therefore allow everything. Blocking
   was observed, so the pattern compiled and is enforcing.
3. ~~The scan report is not fully trustworthy.~~ **Corrected below: the blocks
   were real.** The first two traces looked clean because a summary-level trace
   records the error without its URL, so the string being searched for was not
   there to find.

## The allowlist was too narrow, 2026-09-17 afternoon

Five more apps were run to check that the fix repaired the failures without
breaking what already worked. It had broken it:

| App | Before, original | Narrow allowlist | Per-host allowlist |
|---|---|---|---|
| khoj | 0, `error` (crash) | 0, `done` | **1, `done`** |
| plausible | 0, `error` (zombie) | **1, `done`** | not retested |
| hack-judge | 6, `done` | **0** | **8, `done`** |
| dub | 7, `done` | **0** | **8, `done`** |
| hoppscotch | 8, `done` | 8, `done` | not retested |

hack-judge and dub, both previously working, dropped to zero the moment the
allowlist actually started enforcing. Their traces carry the proof the first two
runs seemed to lack: nine `tool_http_request` failures in dub's run alone, each
reading "URL does not match any allowed URL pattern."

The single combined pattern pinned GitHub to `/search`. Replacing it with one
row per host fixed both, and above their original numbers:

    [{"whitelistPattern": "^https://hn\\.algolia\\.com/"},
     {"whitelistPattern": "^https://api\\.github\\.com/"},
     {"whitelistPattern": "^https://api\\.stackexchange\\.com/"}]

The wide list is a strict superset of the narrow one, so hoppscotch cannot
regress and was not re-run.

Blocks still appear, four to nine per run, because the agent also tries to fetch
forum and LinkedIn pages through the HTTP tool. Those are not API hosts and
refusing them is the guardrail working. The finding is done by Exa, not by the
HTTP passes, which is why recall survives losing them.

**What this run actually establishes:** all five apps complete without error, two
improved on their original counts, and total signals across the five went from
21 to 26. Recall is still the weak part, and it varies enough between runs that
a single number should not be trusted.

## Original diagnosis, 2026-09-17 morning: Signals is currently broken for everyone

Every attempt to run it now fails in about nine seconds, before any search:

    urlWhitelist entry 1 must be an object

The platform's `tool_http_request` node has changed the contract for
`urlWhitelist`. The pipe passes an array of regex **strings**, which is exactly
what `.rocketride/docs/ROCKETRIDE_INTEGRATIONS.md` documents:

> `"config": { "type": "tool_http_request", "urlWhitelist": ["^https://api\\.example\\.com/"] }`

The server now wants objects. This is **not** caused by the instruction fix
below: reverting `lk_signals.pipe` to its committed state and running again
produces the identical error, on cal-com and on formbricks. Nor is it task
reuse: the task TTL is 3600 seconds and the last successful run was days ago, so
every run today registers afresh and fails validation.

Neither `.rocketride/services-catalog.json`, `.rocketride/schema/tool_http_request.json`
nor the vendored client records the new shape, so the correct object form cannot
be verified locally and has deliberately not been guessed. **This is the blocker
to clear first.** Removing `urlWhitelist` would let the pipe run, since an empty
whitelist is documented as valid, but it allows every URL and that is an owner's
decision, not a workaround to apply quietly.

Everything below was measured before this surfaced, and still holds for what
happens once a run can start.

## The headline

The finder is not weak. **Four of the ten runs never finished.** Every one of the
six that did finish returned between four and eight usable signals. The score is
mostly measuring crashes, not recall.

| App | Signals | Run status | Why |
|---|---|---|---|
| continue | 6 | done | |
| documenso | 7 | done | |
| dub | 7 | done | |
| hoppscotch | 8 | done | |
| hack-judge | 6 | done | |
| excalidraw | 4 | done | |
| cal-com | 0 | **error** | no JSON object in answer |
| formbricks | 0 | **error** | no JSON object in answer |
| khoj | 0 | **error** | Connection closed unexpectedly |
| plausible | 0 | **running** | zombie, never settled |

## Failure 1: the agent answers in prose instead of calling a tool

cal-com and formbricks died the same way:

    Failed to get valid JSON response after 4 attempts.
    Last response: I'll work through all four passes systematically,
    building a candidates ledger as I go.

That text is the model *starting* the task, not finishing it. The instructions
ask for four search passes, a running ledger, and a large JSON result. The model
opens with a planning preamble rather than a tool call, the harness takes that
first message as the final answer, tries to parse JSON, and fails four times.

Both failures begin with the same sentence shape, so this is reproducible
behaviour and not a one-off.

Fix to try: state that the first action must be a tool call and that no prose
preamble is allowed, and make the final JSON contract unambiguous and separate
from the reasoning. `.pipe` edits need an explicit pipeline restart.

## Failure 2: transport

khoj returned "Connection closed unexpectedly". plausible is still `running` in
its saved store, so nothing ever settled it. `settleZombie` in `data/api.ts` now
closes an interrupted run after 30 minutes, which stops the stage being wedged,
but the run itself is still lost.

## The recall ceiling is deliberate, not a bug

Every successful scan reports "Reddit not searchable from this pipeline". That
sentence is written into `lk_signals.pipe` on purpose:

> REDDIT: this pipeline cannot search Reddit (the search index has no Reddit
> coverage and reddit.com refuses unauthenticated JSON requests); do NOT spend
> budget on site:reddit.com queries; state 'Reddit not searchable from this
> pipeline' in coverage_notes.

So the finder is working with one hand. Two further limits show in the same
coverage notes:

- a 14 day freshness window excluded every Hacker News hit in five of the six
  successful runs;
- hoppscotch exhausted its budget at 12 calls and skipped StackOverflow.

Reddit is where the intended audience actually describes this class of problem,
so both claims behind the exclusion are worth re-testing before accepting the
ceiling. Neither has been verified recently.

## Order to fix in

1. The prose-preamble JSON failure. It is the largest single cause and it is a
   prompt contract, not infrastructure.
2. Re-test the Reddit claim. If either half is now false, the recall ceiling
   lifts on its own.
3. Retry on transport failure, so one closed connection does not cost the run.
4. Only then look at the freshness window and the call budget.
