# Launch Kit Pipeline Evals

Evaluation inputs and expectations for the 7 Launch Kit pipelines. Authored 2026-08-27.
Nothing here runs pipelines — these are fixtures (inputs) and cases (inputs + expectations).

## Inventory

| File | Cases | Pipeline under test |
| --- | --- | --- |
| `../fixtures/profiles/*.json` | 20 fixtures | Input profiles (match the real `understand` output shape from `test_output/profile_*.json`) |
| `../fixtures/brand_dna/*.json` | 3 fixtures | Brand DNA inputs: `termdiff` (technical-terse), `streakly` (friendly-consumer), `docparse` (enterprise-formal) |
| `understand.json` | 20 | Repo/site -> profile. 12 repo+site, 8 site-only (`repo_url: null`, `degraded_expected: true`) |
| `brand.json` | 20 | 10 `task:"dna"` (live site -> brand DNA) + 10 `task:"campaigns"` (profile + DNA -> campaign ideas) |
| `commercial.json` | 20 | 10 `task:"pricing"` (competitor/pricing research) + 10 `task:"listing"` (listing rewrite; 5 with an existing blurb, 5 from scratch) |
| `targets.json` | 20 | Profile -> launch venue targeting |
| `assets.json` | 21 | 7 asset types x 3 profiles each; `dna_ref` set on 9 cases, realistic `target` on reddit/newsletter cases |
| `signals.json` | 20 | Profile + subreddit list -> community signal scan |
| `rescore.json` | 20 | Signal relevance scoring: 10 `relevant`, 10 `irrelevant` imposters; 9 HN / 6 GitHub / 5 StackOverflow |

All `profile_ref` values are slugs of files in `../fixtures/profiles/`. All `dna_ref` values are either slugs in `../fixtures/brand_dna/` or `"from:<dna-case-id>"`, meaning: run that `brand.json` dna case first and chain its output.

## How `expect` blocks are graded

**Deterministic (script-checkable):**
- `understand.must_mention` — case-insensitive substring match against pipeline output. Every string was verified present in the live page's HTML (title/meta/H1/H2) at authoring time.
- `understand.degraded_expected` — output must acknowledge repo-less/degraded analysis (or set its confidence lower) when true.
- `brand.expect.brand_name` — exact-ish name match; `evidence_required` means every DNA claim must carry a quote/URL from the site.
- `campaigns.min_campaigns`, `targets.min_targets`, `pricing.min_established_competitors` — count thresholds.
- `pricing.plausible_competitors` — at least 2 of the listed real products should appear in output (allow name variants, e.g. "Kit (formerly ConvertKit)").
- `rescore.label` — binary match against the pipeline's relevant/irrelevant verdict. `label_why` is for the judge/debugging, not string matching.
- `signals.honest_empty_ok` — an empty result set is a PASS if the pipeline says so honestly; fabricated threads are an automatic FAIL (verify any returned URLs resolve).

**Judge-graded (LLM or human):**
- `understand.category_hint` — semantic match, not string match (e.g. "web analytics" vs "analytics platform").
- Empty `expect: {}` blocks (`listing`, all `assets` cases) — judge on: faithfulness to the profile (no invented numbers/customers), voice match when `dna_ref` is set (tone_words followed, `avoid` list respected), venue fit when `target` is set (e.g. r/selfhosted post must not read as an ad), and format correctness per asset type (Show HN conventions, PH tagline length, etc.).
- `targets.expected_venue_kinds` / `plausible_venues` — judge credit for kind coverage and for surfacing the named venues or equally good real ones; fabricated venues are a FAIL.

## Caveats

- **Live sites drift.** All URLs verified live 2026-08-27 (HTTP 200; HN via Algolia items API; GitHub via API; SO via StackExchange API). Marketing pages change copy: PostHog, Retool, and Linear homepages currently lead with AI positioning and change often — re-verify `must_mention` strings before blaming the pipeline for a miss.
- **posthog.com and linear.app are JS-heavy**; only title/meta are reliably in static HTML, which is why their `must_mention` lists are short.
- **maybe.co was dropped** (Maybe Finance shut down; DNS no longer resolves) even though the GitHub repo still exists.
- Old HN threads (e.g. `rs-02`, from 2009) are stable but their comment pages render fine; recency is not part of what these cases test.
- Profiles are fictional products but name **real** competitors and venues; graders should treat competitor/venue names as real-world entities.
- `commercial.json` listing blurbs are deliberately mediocre (vague claims, no numbers) so improvement is measurable against the profile's proof points.
