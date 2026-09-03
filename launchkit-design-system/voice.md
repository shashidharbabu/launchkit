# Voice

Words are design material here — Launch Kit's brand *is* honesty, and copy
is where it's most visible. Register: a candid engineer walking you through
your own launch paperwork. Plain verbs, sentence case, no filler, no hype,
no exclamation marks in system copy. Specific beats clever, always.

## Vocabulary (fixed — consistency is navigation)

| Concept | The word | Never |
| --- | --- | --- |
| Gate action | **Approve** → button says "Approve profile", toast says "Approved" | Submit, Confirm, Accept, ✓ |
| Redo with input | **Regenerate with notes** (gate) / **with feedback** (assets) | Retry, Try again (reserved for failures) |
| Signal actions | **Copy reply · Mark replied · Dismiss** | Archive, Skip, Delete |
| Stages | Profile · Commercial · Assets · Targets · Signals · Plan | Synonyms of any kind |
| Stamps | GO · HOLD · NO-GO · UNVERIFIED · RUNNING | Success/Pending/Error as user-facing words |
| The user's thing | your app, your launch | the project, the entity |

Name what people control, not how it's built: "Re-check this thread", not
"Re-run lk_rescore.pipe". (Dev-only surfaces like `/admin/restart-pipe` may
speak pipeline.)

## AI content is a draft until stamped

Drafts say so: "Drafted profile — edit anything, then approve." Provenance
lines (`components.md`) state source and verification. Never present
generated text as settled fact; never hide that a signal couldn't be
verified — `UNVERIFIED` is a stamp, not a shame.

## Honest-empty states (a signature — write them with care)

Fact → reason → next act. The product's credibility lives here:

> **No signals yet.** Nobody is publicly asking for what your app does
> right now — that's common before launch. Re-run after your first posts,
> or widen the pain phrasing in your profile. `[Re-run signal search]`

> **No venues selected.** Your plan exports only the venues you tick in
> Targets — five right ones beat fifty. `[Choose targets]`

> **No signups attributed yet.** Post with your tracked links and signups
> will appear here with their venue. `[Copy tracked links]`

Never: "Nothing to see here!", illustration-with-no-action, or a fake
loading state where emptiness is the truth.

## Locked gates say why

Downstream stages before Gate 1: "Locked until you approve the profile —
everything downstream is built from it. `[Review profile]`". A 409 is never
a dead end.

## Errors: what happened, then the fix — no apology, no vagueness

> "Couldn't reach the pipeline. It restarts automatically — retry in about
> a minute. `[Retry]`"

> "Couldn't fetch this thread, so we can't verify it. It stays marked
> UNVERIFIED — judge it yourself before replying."

Errors don't say "Oops", "Something went wrong", or "Sorry". Failures
surface the real state (the backend already retried once — say so when
true). Destructive confirmations name the object: "Dismiss this signal? It
won't return in future searches."

## Numbers are always attributed

Every count says what it counts: "7 verified · 2 unverified", "3 signups ·
via OSSInsight". A bare number is a spec violation — attribution is the
product.
