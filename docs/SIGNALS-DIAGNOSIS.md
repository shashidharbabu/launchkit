# Signals stage: why it scores 1.7 out of 5

Written 2026-09-16 from the ten saved stores in `docs/eval-10/<slug>/appstate.json`.
Read before changing `apps/launchkit/pipelines/lk_signals.pipe`.

## 2026-09-19: three of the four passes had been dead for two days

The recall story in the section above blames the sources and then the gate. Both
were wrong about the main cause. Counting `tool_http_request_1` results in every
stored trace:

| run | HTTP attempted | succeeded | blocked |
|---|---|---|---|
| khoj, 09-11, three runs | 4, 7, 5 | all | 0 |
| cal-com, 09-11 | 10 | all | 0 |
| every run, 09-17 onward, every app | 1 to 32 | **0** | **all** |

So from 2026-09-17 Signals ran on Exa alone. PASS A (Hacker News), PASS C
(GitHub and StackExchange) and every verification fetch returned nothing, in
every run, for two days. The counts this section had been trying to explain, khoj
6 to 2 and cal-com 5 to 4 and then 0, are mostly that.

### The cause was the allowlist fix, and it was self-inflicted

The 09-17 entry above records changing `urlWhitelist` from strings to objects as
the fix that made Signals run again. What actually happened is narrower and
worse. As strings the rows were discarded, and the server's own comment says an
empty pattern list means allow all, so the guardrail had simply been **off** and
every fetch worked. Making the rows well formed turned the guardrail **on**, and
the deployed server then refused every URL, including the three hosts the pattern
names.

That the pattern is correct was checked three ways, not assumed:

- the committed pattern is byte identical to the one in the file
- `^https://(hn\.algolia\.com|api\.github\.com|api\.stackexchange\.com)/` matched
  all three intended API URLs when compiled and run locally
- the server source on this machine matches with `p.search(url)`, which succeeds
  on a prefix

and staging refused `https://hn.algolia.com/api/v1/search?query=calendly&tags=story&hitsPerPage=2`
anyway, raising from `IInstance.py:502` where the source here has that check at
line 196. The deployed build is not the source in this workspace.

### Proof that emptying the list fixes it

With `urlWhitelist: []` the agent was asked for one HTTP call and returned three
Hacker News hits:

    42027187  Show HN: Someday, Open-Source Calendly Alternative for Gmail / Google App Script
    26817795  Calendso: An open source Calendly alternative
    36785707  NeetoCal, a calendly alternative, is a commodity and is priced accordingly

An independent fetch of the same URL from this machine returned the same three
ids and titles, byte for byte, so this is not the model reporting success it did
not have. The next app run through the UI recorded `HTTP attempted=2, ok=1,
blocked=0`, the first successful HTTP call the app has made since 09-17.

`urlWhitelist` is therefore empty until the server is fixed. Host discipline
lives in the instructions, which name the three API hosts and tell the agent not
to fetch a site's own search page. That is the state the app was in for its first
weeks, when every fetch worked.

### What is still not fixed

Recall is unstable run to run, and that is now the open question rather than a
solved one. Six Signals runs on the same cal-com store on 09-18 and 09-19
returned 3, 1, 0, 0, 3 and 1 signals. The last of those is a real buyer ("I
canceled Calendly last month. Not because of the price, because of the
principle."), found through LinkedIn via Exa, and the run before it found three
pricing-pain posts. The agent also used only 2 of its HTTP calls in the run where
they finally worked, so the four passes are still not all being run.

Measure the next change against several runs per app, not one. A single count
from this stage does not mean anything.

## 2026-09-18: the pipeline is healthy, so the question moved to who the signals are

Four apps were re-run once the transport fixes landed (a 12 minute deadline on
the pipe call so silence fails fast and the runner's restart-and-retry fires,
the allowlist as one alternation, titles-only in the ledger so URLs stop being
cut at 80 characters, the own-content filter no longer banning a repo's last
path segment). Every run finished, and the count was no longer the problem:

| App | Signals | Status |
|---|---|---|
| khoj | 6 | done |
| cal-com | 5 | done |
| formbricks | 3 | done |
| plausible | 5 | done |

The problem was who they were. `classifyIntent` in `domain/gates.ts` sorts a
signal's title into buyer, builder, vendor or unclear, and over those 19:

| App | Signals | Buyer | Builder | Vendor | Unclear |
|---|---|---|---|---|---|
| khoj | 6 | 0 | 5 | 0 | 1 |
| cal-com | 5 | 2 | 1 | 1 | 1 |
| formbricks | 3 | 2 | 0 | 0 | 1 |
| plausible | 5 | 1 | 0 | 0 | 4 |
| **total** | **19** | **5 (26%)** | **6** | **1** | **7** |

Five of nineteen were a person who needs the app. Six were a person announcing
the rival they had just built ("[ANN] Sonar: Offline semantic search for
Obsidian", "I Built an Encrypted Second Brain"). One was a vendor. A reply to any
of those is a reply to a competitor's launch post, which is worse than no reply.

### The buyer-or-builder rule

The rule now lives in three places: the finder's instructions in
`lk_signals.pipe` (a BUYER OR BUILDER block before the KEEP list), the rescore
judge's prompt in `domain/questions.ts`, and the gate in `domain/gates.ts`,
which drops a builder ("a builder announcing their own tool, not a person who
needs one") and a vendor ("vendor marketing, not a person") before anything is
stored. The gate is the one that is verified: `tests/intent.test.ts` runs the
40 row fixture that the rule was written against and every row lands where it
was labelled.

The judge's copy of the rule is not verified at runtime and cannot be from the
preview: the rescore judge fetches each URL from the browser thread, those
fetches are CORS-blocked, a failed fetch is scored `unverified` and kept, so
every survivor carries `unverified: fetch failed` and the judge's buyer test
never runs. That layer only does work in the deployed app.

### Measured on khoj, before and after

khoj was re-run with the rule in place, same pipe, same seed:

| | Signals | Buyer | Builder | Unclear |
|---|---|---|---|---|
| before the rule | 6 | 0 | 5 | 1 |
| after the rule | 2 | 0 | 2 | 0 |

Three builders were dropped at the gate. The two that got through were builder
shapes the first rule missed ("Spent the last few evenings building myself a
memory for LLMs", "AetherOS, a local-first, private AI second brain"), and
those two shapes were added in the following commit, so a run today would
store zero. That is the honest result for khoj: the sources it searches hold
people building private AI second brains, not people asking for one, and the
finder was reporting the builders as demand. Zero is correct there.

### Measured on cal-com, before and after

cal-com had buyers in the before run (2 of 5), so it is the app that shows
whether the rule keeps buyers while dropping the rest:

| | Signals | Buyer | Builder | Vendor | Unclear |
|---|---|---|---|---|---|
| before the rule | 5 | 2 | 1 | 1 | 1 |
| after the rule, 488 s, `done` | 4 | 0 | 0 | 0 | 4 |

The gate dropped nothing this time: the store holds no builder or vendor drop
reason, so the four that came back are what the finder returned, and they show
the next gap rather than the rule at work. Two are the same dev.to author
writing about Cal.com itself ("Cal.com Has a Free API, Here's How to Build
Scheduling Into Any App", "Cal.com Has a Free API: Open-Source Scheduling That
Replaces Calendly"). That is coverage of the app, not a person who needs it,
and the own-content filter only knows the app's own URLs, so a title that
names the product on someone else's domain walks through. The other two are
support questions on rival forums (a Zoom developer who cannot read booking
details after a booking, a Nylas user asking how to customise the cancel
form): people inside a competitor's product hitting friction, which is closer
to a lead than anything in the khoj run but not a request for a new tool, and
the classifier's unclear is fair. The cal-com number is not a regression
caused by the rule; it is one more run from a finder whose results vary this
much between runs, which is why the doc keeps saying a single count should
not be trusted.

Next gate to add, with a fixture first: drop a signal whose title names the
app itself unless the title is a question. It would have removed both dev.to
rows here and costs no buyer, since a buyer asks for the category, not the
brand.

### What to read into the numbers

The rule is a precision change. A run that returns fewer signals with a higher
buyer share is the intended outcome, and the score to watch from here is the
buyer share, not the count. Recall is a separate problem with a separate fix:
the sources. Exa returns nothing for reddit.com, reddit.com's search endpoint
is a 403, the GitHub issue search is the strongest source measured (851
results for one product's pain, real asks at the top), HN wants two-word
queries (619 results against 10), and Lemmy's open API returned real buyers in
a manual probe and is the next source to add, as its own pass, measured on its
own.

### A note on the evidence

The stores for these runs live in `docs/eval-10/<slug>/appstate.rerun.json`,
which is a tracked file that the driver overwrites in place. A `git checkout`
run on 2026-09-18 to undo a bad text sweep took its file list from the whole
modified set and reset cal-com, formbricks and plausible to HEAD, so the row
level detail of those three verification runs is gone; the counts above are
from the classifier's output at the time. khoj's before and after are intact
as `appstate.preintent.json` and `appstate.postintent.json`, which are
untracked snapshots, and that is now the rule: snapshot before any revert.

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
