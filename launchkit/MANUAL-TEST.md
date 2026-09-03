# Launch Kit — manual test walkthrough

Run this yourself to confirm what I found. ~25 minutes including pipeline waits.

**Start both servers** (see `.claude/skills/run-launchkit`), then confirm:
- `http://localhost:8090/openapi.json` → title `Launch Kit API`
- `http://localhost:3200` → contains "Launch Kit"

A finished reference launch already exists: **`/p/81791287ac5a/profile`** (Umami,
all six stages complete). Use it to inspect output without waiting on runs.

---

## The walkthrough

| # | Do this | Expect | Watch for |
|---|---|---|---|
| 1 | Click the logo, top-left | Goes to `/dashboard` from anywhere in the app; on the landing page it goes to `/` | — |
| 2 | **Launches → Start a launch.** Type a name, then a URL, then a repo — *fast*, or use browser autofill | All three fields keep their values | This silently wiped the App name before today. If it comes back, the stale-closure bug regressed |
| 3 | Submit | Lands on `/p/<id>/profile` with a RUNNING badge, no extra click needed | Analysis auto-starts on create |
| 4 | Wait 1–3 min | Four numbered checks: what it is / who it's for / the pain / why different | `Who it's for` is the weakest field — for Umami it said "product managers and growth marketers" where the real audience is developers |
| 5 | Open **Where this came from** | Every source listed with read/failed + confidence | If `analysis_degraded` is true, the site or repo could not be read |
| 6 | Click **This is right — approve** | GO stamp; every stage in the rail unlocks | Try approving with unsaved edits — the button should say "Save your edits first" |
| 7 | **Commercial → Draft pricing & listing** | ~2–5 min. Competitors table with a **Standing** column | **This is the accuracy test.** Names must be ones you recognise. For Umami: Plausible, Fathom, GoatCounter |
| 8 | Read **Not counted as competitors** | Junk correctly excluded — bare GitHub repos, directory pages, unrelated BI tools | If you see a `niche` row anchoring the price, that's a regression |
| 9 | **Targets → Find launch venues** | ~2–4 min, 15–20 venues, mixed kinds | Product Hunt should NOT be #1 — niche fit outranks size. **Check `rules_summary`: most say "not verified"** |
| 10 | **Signals → Scan for live demand** | ~2–4 min. Often 0–2 results | Low recall is expected until Reddit creds exist (see below). 0 kept is honest, not broken |
| 11 | **Assets → Draft SHOW HN** | ~1 min | Title starts `Show HN:`, states real limitations, no hype, `{APP_URL}` placeholder |
| 12 | Click **Approve** on the asset | Gate 2 stamped | — |
| 13 | **Targets** → tick 3 venues | Gate 3; selections persist on reload | — |
| 14 | **Plan** | The 3 venues with tracked ref codes + attribution table | You'll see a **"Simulate signup (dev)"** button — dev-only, should not ship |

---

## What I verified

All six pipelines trigger correctly from their own feature button, and all three
gates work through the UI. End-to-end on a fresh launch (Umami, real repo + site):

- **understand** → 4 sources read, confidence 0.95, `degraded=false`
- **commercial/pricing** → Plausible · Fathom · GoatCounter, all `established`; rejected a
  bare GitHub repo, Tableau, Power BI; recommended Free/$20/$200 (matches Umami's real pricing)
- **commercial/listing** → done
- **targets** → 20 venues (5 subreddit · 5 launch platform · 4 directory · 3 community · 2 awesome-list · 1 newsletter)
- **signals** → 1 kept (a real StackOverflow thread about suppressing GA cookies)
- **assets** → Show HN draft holding HN conventions
- **plan** → assembled with per-venue ref codes

This closes **TEST-MATRIX row 2** (`A vs Plausible/Fathom`), which was blank.

## Fixed during this pass

1. **New-launch form silently discarded a field** — all three inputs used
   `setForm({ ...form, x })`, a stale closure. Two changes in one tick (autofill,
   a password manager, fast typing, paste) dropped the earlier one. Now uses the
   functional updater.
2. **"Your pipeline is not running" needed a manual admin restart.** The engine
   can reap a pipeline task; `_tokens` kept the dead token, so every later run
   failed forever. `_ask_once` now terminates and re-registers on that error.
3. **Dead-transport errors weren't recovered.** `transportish` matched
   `is_connected` but not `disconnect` — the same failure, re-raised with no
   retry. Now covers both.
4. **Signals returned nothing on false confidence.** The finder skipped PASS D
   (GitHub/StackOverflow — the only sources that never lock) saying "sufficient
   HN signals", then the freshness gate deleted every stale HN hit. All four
   passes are now mandatory and staleness counts as zero toward sufficiency.
   Measured 0 → 1 kept.

## Second pass — items 3–5

**Fix 4 (venue rules) — done, and it caught a worse bug on the way.** Making rule
verification mandatory first made things *dangerous*: the model started emitting
confident summaries instead of admitting it couldn't read the page. r/privacy went
from the accurate "No self-promotion allowed · immediate ban possible" to a
fabricated "Self-promotion allowed if relevant and not spammy" — advice that gets a
builder banned. Fixed properly by requiring a `rules_url` for every claim: if you
cannot name the page you read it on, you did not read it, so write 'not verified'.
Now every verified venue carries a real scraped URL and r/privacy reads correctly
again. Subreddit/community coverage went 3-of-8 unverified → 0; the remaining
'not verified' rows are directories and newsletters, which don't need rules.

**Fix 5 (dev tooling) — done.** "Simulate signup" is behind
`NEXT_PUBLIC_ENABLE_DEV_TOOLS=1`, inlined at build time so it is absent from a
production bundle rather than merely hidden. Documented in `env.example`. Verified
0 buttons render with the flag unset.

**Fix 3 (app listed as its own competitor) — implemented, NOT verified.** The
prompt now requires a pre-emit check that the APP_PROFILE product name is absent
from `competitors[]`. It could not be confirmed: every `pricing` run since has
failed engine-side, ~10 consecutively. `Umami` still appears in the stored result
from the last successful run. **Re-run pricing and re-check before trusting this.**

**Bonus bug found and fixed: Gate 3 approvals were silently destroyed.**
Re-running Targets did `query(Target).delete()`, wiping every `selected` flag — so
re-running the stage revoked the builder's venue approvals with no warning and
emptied the Plan. Signals had the same defect (wiping replied/dismissed statuses).
Both now carry state across a re-run by URL. Verified: 3 venues selected, targets
re-run, same 3 still selected.

## A caution about pricing right now

`pricing` is failing repeatedly (~10 in a row) with
`LLM error: An error occurred with the API`. What is established:
- It reproduces in `backend/test_commercial.py pricing`, which bypasses the app
  entirely — so this is engine/pipeline-side, not the backend or the UI.
- `listing` (same pipeline), `targets`, `understand` and `assets` all succeed.
- The Exa and Firecrawl keys were tested directly and both return 200.
- Shortening the pricing prompt did not help, so the prompt edit is not the cause.

Not established: why. The most likely explanation is provider rate-limiting after a
very heavy day of runs, but I could not confirm it. Try again after a pause; if it
persists while other stages work, it is worth reporting to the engine team
alongside HANDOFF §8.6.

## Outstanding — ranked

1. **Signals recall is blocked on Reddit.** Exa returns zero for `site:reddit.com`
   and the Reddit API needs OAuth. **Your action:** create a Reddit script app and
   fill `ROCKETRIDE_REDDIT_CLIENT_ID` / `_SECRET` in `.env` (HANDOFF §8.1). Reddit
   is the biggest pool of "is there a tool that…" posts; until then this feature
   under-delivers.
2. **Engine flakiness ~1 in 3 on tool-heavy runs.** Documented in TEST-MATRIX and
   independently measured. Retries take pricing from 33% → 67% per job, but a run
   can still burn all three attempts. Users will see failures.
3. **Pricing listed the app itself as a competitor** (Umami appeared in its own
   competitor table). The prompt forbids this. Not in anchors, so it doesn't
   corrupt the price — but it looks wrong.
4. **18 of 20 targets have `rules_summary: "not verified"`.** Posting to a venue
   without verified self-promo rules risks a ban. The pipeline is told to scrape
   rules pages and mostly doesn't.
5. **"Simulate signup (dev)"** ships in the Plan UI. Gate it behind a dev flag.
6. **Two 404s on every workspace load** — the UI requests `commercial/pricing`
   and `commercial/listing` before they exist. Harmless, but it fills the console
   with errors. Return 200 + null, or don't request until they exist.
7. **Backend latency under load.** A create request hung ~60s while a pipeline job
   was running; not reproducible once idle. Single-process event loop — worth a
   look before real concurrent users.
