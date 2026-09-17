# Brand rulebook 4.3: what is now handled, and the one thing Joe still decides

2026-09-17.

## The question

Brand rulebook 4.3 covers naming OpenAI, Anthropic, Google or Meta. It says, in
its own words, that there is "no formal written policy distinguishing foundation
model providers from tooling competitors" and that "Joe must confirm the exact
rule before this becomes autonomous". The checker is told to flag, not decide.

Every one of the eight items the brand check raised for Joe traces back to that
single sentence.

## Why it was not academic

Two of our own rules actively instruct the model to name these companies:

- **Reddit rule 7** requires the draft to name the obvious existing alternative
  and state a present-tense fact about it, inside the first 120 words. For an
  analytics product that alternative is Google Analytics.
- **Show HN rule 16** asks for the model provider once, as a stack fact. khoj's
  draft accordingly listed OpenAI, Anthropic, Google Gemini and DeepSeek.

So the rulebook was producing the exact mentions 4.3 reserves to Joe, and the
check meant to catch them did not.

**Five of the six examples the brand check quoted passed straight through
`provider_comparison_needs_review`.** It matched only an obvious adversarial
phrasing, so all of these were invisible to it:

- "the tracking script is 54 times smaller than Google Analytics"
- "GA4 means cookie banners, complex reports, and data sent to Google servers"
- "about 135KB less per visitor than the Google Analytics script"
- "45KB versus Google Analytics" (live today in plausible's Reddit draft)
- "configurable providers include OpenAI, Anthropic, Google Gemini and DeepSeek"

## What is handled now

Two tiers, so no provider name reaches a published draft unreviewed, without
anyone pretending to have settled the policy.

| Tier | Check | Behaviour |
|---|---|---|
| Comparison or adversarial claim | `provider_comparison_needs_review` | **Hard.** The draft cannot be approved. |
| Any other mention | `provider_named_route_for_review` | **Warning.** A person reviews before posting. |

Both are on all six platforms. Proven through the real gate on every example
above, including that "meta description" and "metadata" stay silent, which is
the obvious way a guard like this goes wrong.

Measured on the sixty drafts from today's run: **6 of 60 name a provider**, so
the routing tier is a real signal rather than noise. plausible's Show HN and
Reddit drafts are now blocked rather than quietly publishable.

## What Joe still decides

Only this: **is a neutral mention acceptable?**

A stack fact ("runs against OpenAI or a local model") and a customer list
("used by teams at Meta") are not comparisons and are arguably just true. 4.3
does not say, and the brand-check skill forbids the checker from deciding.

His answer changes one thing and nothing else:

- **Neutral mentions are fine**: drop the second tier, or leave it as a quiet
  note. Comparisons stay blocked.
- **Neutral mentions also need review**: leave it exactly as it is.
- **No provider may be named at all**: promote the second tier to hard, and
  Reddit rule 7 and Show HN rule 16 both need rewording, because they currently
  ask for the thing the policy would forbid.

Until he answers, the safe reading is in force: nothing is blocked that is
merely factual, and nothing factual goes out unseen.

## Two smaller items from the same set

- **The App Builder name (rulebook 5.2)** has no mechanical check on any
  channel. All six rulebooks correctly decline to name bucket 3, but that rests
  entirely on a human pass. Worth a check once the name exists; pointless
  before.
- **Acquisitions as neutral facts.** continue's pitch names Cursor as the
  acquirer, and no rule anywhere says whether an acquisition may be stated. It
  is a listed competitor (4.2), so it sits next to the same question.
