# Launch Kit pipeline ablation report

Thresholds: success ≥ 90%, deterministic ≥ 0.8, judge ≥ 0.7 → otherwise NEEDS WORK.

| Pipeline · variant | n | success | det score | judge score | p50 latency | retries | verdict |
|---|---|---|---|---|---|---|---|
| assets · baseline | 21 | 100% | 0.962 | 0.646 | 17.3s | 0 | **NEEDS WORK** |
| assets · v2prompt | 21 | 100% | 0.964 | 0.65 | 14.9s | 0 | **NEEDS WORK** |
| brand · baseline | 20 | 100% | 0.946 | 0.476 | 64.5s | 0 | **NEEDS WORK** |
| brand · v2_claude | 20 | 100% | 0.969 | 0.716 | 64.5s | 0 | **UP TO THE MARK** |
| commercial · baseline | 20 | 70% | 0.926 | 0.671 | 93.4s | 8 | **NEEDS WORK** |
| rescore · baseline | 20 | 100% | 0.55 | — | 4.2s | 0 | **NEEDS WORK** |
| rescore · v2_helpfirst | 20 | 100% | 0.85 | — | 4.9s | 0 | **UP TO THE MARK** |
| signals · baseline | 20 | 100% | 0.94 | 0.236 | 292.0s | 0 | **NEEDS WORK** |
| signals · v2_helpfirst | 20 | 100% | 0.955 | 0.336 | 174.6s | 0 | **NEEDS WORK** |
| signals · v3_claudefinder | 3 | 100% | 0.984 | 0.332 | 154.9s | 0 | **NEEDS WORK** |
| targets · baseline | 20 | 100% | 0.924 | 0.365 | 384.5s | 2 | **NEEDS WORK** |
| targets · v2_claude | 20 | 100% | 0.935 | 0.532 | 105.8s | 0 | **NEEDS WORK** |
| understand · baseline | 20 | 100% | 0.857 | 0.744 | 86.4s | 1 | **UP TO THE MARK** |
| understand · site_only | 6 | 100% | 0.881 | 0.674 | 100.5s | 0 | **NEEDS WORK** |

## assets.baseline

Most common judge flags: generic-hook ×6; unresolved-placeholder ×4; invented-metric ×3; unsupported-comparative-claim ×2; tagline-as-hook ×2

Worst cases (by det score):
- `as-12` det=0.714 judge=0.736 flags: overstuffed-tagline,unqualified-vendor-metric,competitors-unnamed,stronger-hook-left-on-table
- `as-16` det=0.8 judge=0.69 flags: unsupported-claim,missing-license-and-stack,redundant-phrasing,omits-star-traction
- `as-14` det=0.833 judge=0.586 flags: title-too-long-for-hn,tagline-as-title,no-technical-depth,pricing-pitch-in-body
- `as-11` det=0.857 judge=0.728 flags: tagline-over-char-limit,absolute-claim-never-hallucinates,generic-hook-first-line,unresolved-placeholder
- `as-01` det=1.0 judge=0.714 flags: repeated-metric,unsupported-comparative-claim,vague-adoption-claim,voice-violation-surgical-precision

## assets.v2prompt

Most common judge flags: generic-hook ×4; generic-feedback-ask ×3; unused-brand-phrase ×3; hashtag-spam ×2; unsubstantiated-comparative-claim ×2

Worst cases (by det score):
- `as-12` det=0.714 judge=0.768 flags: generic-opening-line,metric-context-dropped,unused-brand-phrase,missing-maker-story
- `as-14` det=0.833 judge=0.454 flags: marketing-tone,missing-limitations,no-link,title-too-long
- `as-15` det=0.833 judge=0.744 flags: landing-page-voice,no-first-person,omits-known-limitation,no-competitor-comparison
- `as-11` det=0.857 judge=0.74 flags: unfilled-placeholder,overclaim-no-hallucinations,generic-maker-comment-opener,filler-sentence-proud-of-balance
- `as-01` det=1.0 judge=0.708 flags: hashtag-spam,stars-restated-as-users,unsubstantiated-comparative-claim,no-demo-visual

## brand.baseline

Most common deterministic failures: cliches ×2; unparseable color values ×1
Most common judge flags: generic-tone-words ×9; invented-metric ×6; favicon-as-logo ×5; cliche-copy ×5; duplicate-campaigns ×4

Worst cases (by det score):
- `bc-11` det=0.75 judge=0.495 flags: duplicate-campaigns,stars-as-users-claim,off-icp-channel-linkedin,off-icp-channel-r-selfhosted
- `bc-13` det=0.75 judge=0.417 flags: invented-claim-independently-verified,invented-feature-audit-trail,false-exclusivity-soc2,p95-misstated-as-every-time
- `bd-06` det=0.767 judge=0.557 flags: single-source-scrape,paraphrase-as-observed-quote,unusable-color-token,favicon-as-logo
- `bd-08` det=0.917 judge=0.513 flags: generic-tone-words,missing-visual-tokens,unsourced-dos-and-donts,boilerplate-audience-line
- `bd-01` det=0.967 judge=0.497 flags: invented-metric,stale-stat,unverified-accent-color,tailwind-defaults-passed-as-evidence

## brand.v2_claude

Most common judge flags: generic-tone-words ×6; thin-source-coverage ×4; reddit-selfpromo-risk ×3; missing-visual-tokens ×2; empty-visual-identity ×2

Worst cases (by det score):
- `bd-01` det=0.917 judge=0.74 flags: unverified-metric,unattributed-proof-points,possible-invented-slogan,missing-visual-tokens
- `bd-05` det=0.917 judge=0.85 flags: thin-source-coverage,audience-language-vague,possible-logo-list-padding,no-visual-identity-captured
- `bd-06` det=0.917 judge=0.81 flags: tagline-unquoted,unsupported-vocab-terms,empty-visual-tokens,no-typography-evidence
- `bd-07` det=0.917 judge=0.79 flags: generic-tone-words,missing-visual-tokens,thin-source-coverage,unquoted-extension-count
- `bd-08` det=0.917 judge=0.66 flags: generic-tone-words,empty-visual-identity,thin-quote-fragment,filler-proof-point

## commercial.baseline

Most common judge flags: generic-title ×3; beta-status-omitted ×2; generic-tagline ×2; empty-changes-from-current ×2; chatwoot-mischaracterized ×1
Errors (6): RuntimeError: LLM error: Exception: An error occurred with the API. at (/opt/rocketride/ai/common/chat.py:430) | RuntimeError: LLM error: Exception: An error occurred with the API. at (/opt/rocketride/ai/common/chat.py:430) | RuntimeError: LLM error: Exception: An error occurred with the API. at (/opt/rocketride/ai/common/chat.py:430) | RuntimeError: LLM error: Exception: An error occurred with the API. at (/opt/rocketride/ai/common/chat.py:430) | RuntimeError: LLM error: Exception: An error occurred with the API. at (/opt/rocketride/ai/common/chat.py:430)

Worst cases (by det score):
- `cp-10` det=0.719 judge=— 
- `cp-04` det=0.75 judge=— 
- `cp-05` det=0.75 judge=0.755 flags: chatwoot-mischaracterized,intercom-tier-price-inaccurate,front-tier-name-unverified,helpscout-stale-pricing-model
- `cp-08` det=0.75 judge=0.703 flags: fabricated-competitor-tiers,off-icp-competitor,trial-mislabeled-as-freemium-tier,tier-priced-on-unbuilt-feature
- `cl-11` det=1.0 judge=0.67 flags: redundant-faq,missing-competitor-differentiation,unaddressed-jetbrains-objection,trained-on-overclaim

## rescore.baseline

Judge vs ground truth (fetchable threads): TP 6 · FP 1 · TN 5 · FN 2 → precision 0.857, recall 0.75; 6 threads unfetchable (kept as 'unverified' — fetch-coverage gap, not judge error)

Most common deterministic failures: thread unfetchable → outcome unverified; judge never ran ×6; label=relevant but judge said rejected ×2; label=irrelevant but judge said relevant ×1

Worst cases (by det score):
- `rs-01` det=0.0 judge=— 
- `rs-05` det=0.0 judge=— 
- `rs-06` det=0.0 judge=— 
- `rs-09` det=0.0 judge=— 
- `rs-14` det=0.0 judge=— 

## rescore.v2_helpfirst

Judge vs ground truth (fetchable threads): TP 7 · FP 0 · TN 10 · FN 3 → precision 1.0, recall 0.7; 0 threads unfetchable (kept as 'unverified' — fetch-coverage gap, not judge error)

Most common deterministic failures: label=relevant but judge said rejected ×3

Worst cases (by det score):
- `rs-01` det=0.0 judge=— 
- `rs-05` det=0.0 judge=— 
- `rs-06` det=0.0 judge=— 
- `rs-02` det=1.0 judge=— 
- `rs-03` det=1.0 judge=— 

## signals.baseline

Most common deterministic failures: only 3 search queries used (finder budget is 14) ×2; only 0 search queries used (finder budget is 14) ×1
Most common judge flags: no-help-first ×12; template-reply ×9; duplicate-queries ×6; generic-queries ×5; duplicate-rank ×3

Worst cases (by det score):
- `sg-01` det=0.333 judge=— 
- `sg-06` det=0.857 judge=— 
- `sg-18` det=0.857 judge=0.123 flags: off-topic-thread,pitch-only-reply,non-sequitur-value-prop,no-help-first
- `sg-20` det=0.857 judge=0.11 flags: keyword-collision,fabricated-relevance,wrong-icp-hobby-repo,self-rejected-signal-shipped
- `sg-12` det=0.952 judge=0.203 flags: irrelevant-thread,self-rejected-signal,off-topic-pitch,template-reply

## signals.v2_helpfirst

Most common deterministic failures: only 0 search queries used (finder budget is 14) ×1
Most common judge flags: duplicate-queries ×9; pitch-first-reply ×4; generic-keyword-queries ×4; all-signals-rejected ×4; locked-thread ×4

Worst cases (by det score):
- `sg-01` det=0.333 judge=— 
- `sg-20` det=0.929 judge=0.183 flags: off-topic-thread,stale-thread,pitch-first-reply,no-help-offered
- `sg-04` det=0.939 judge=0.257 flags: fabricated-quote,quote-contradicts-thread,empty-thread-content,unverified-intent-labels
- `sg-02` det=0.952 judge=0.59 flags: stale-thread-necropost,private-roadmap-issue-as-signal,future-dated-signal,no-alpha-disclosure
- `sg-14` det=0.971 judge=0.183 flags: all-signals-rejected,keyword-match-not-intent,wrong-venue-bugtracker,template-reply-boilerplate

## signals.v3_claudefinder

Most common judge flags: all-signals-rejected ×2; off-topic-thread-rank3 ×1; stale-thread-2022 ×1; locked-threads-unactionable ×1; template-reply-boilerplate ×1

Worst cases (by det score):
- `sg-02` det=0.952 judge=0.4 flags: all-signals-rejected,off-topic-thread-rank3,stale-thread-2022,locked-threads-unactionable
- `sg-07` det=1.0 judge=0.23 flags: all-signals-rejected,off-topic-threads,self-admitted-low-signal-ranked,shoehorned-pitch
- `sg-11` det=1.0 judge=0.367 flags: low-intent-signal,verdict-inflation,task-issue-not-pain,unsolicited-pitch-on-issue-tracker

## targets.baseline

Most common deterministic failures: expected venues absent ×18
Most common judge flags: unverified-rules-majority ×9; show-hn-underranked ×7; generic-why-fit ×7; sequencing-references-unlisted-venues ×4; unverified-rules ×4

Worst cases (by det score):
- `tg-12` det=0.858 judge=0.35 flags: likely-fabricated-venue,invented-metric,unverified-rules,blank-rules-fields
- `tg-18` det=0.865 judge=0.282 flags: missing-hacker-news,sequencing-references-unlisted-venue,unverified-rules-majority,questionable-venue-existence
- `tg-01` det=0.875 judge=0.357 flags: language-not-audience-targeting,missing-obvious-venue-r/commandline,missing-lobsters,show-hn-underranked
- `tg-19` det=0.875 judge=— 
- `tg-02` det=0.906 judge=0.37 flags: boilerplate-why-fit,unverified-rules-majority,ranking-contradicts-effort-impact,show-hn-underranked

## targets.v2_claude

Most common deterministic failures: expected venues absent ×18
Most common judge flags: unverified-rules-majority ×12; audience-signal-all-unknown ×6; empty-rules-urls ×3; audience-signal-unknown-everywhere ×2; generic-why-fit-peerlist ×2

Worst cases (by det score):
- `tg-15` det=0.875 judge=— 
- `tg-18` det=0.875 judge=— 
- `tg-01` det=0.906 judge=0.618 flags: unverified-rules-majority,likely-fabricated-venue,suspect-awesome-list-url,saas-directory-padding
- `tg-12` det=0.906 judge=0.637 flags: unverified-rules-majority,possibly-fabricated-awesome-list,missing-lobsters,filler-directories-betalist-stackshare
- `tg-14` det=0.906 judge=0.482 flags: unverified-rules-majority,risky-selfpromo-claim,overstated-impact-vs-unknown-audience,offlist-venues-in-sequencing

## understand.baseline

Most common deterministic failures: missing evidence strings ×14; missing/empty keys ×13
Most common judge flags: empty-gaps-despite-degraded-analysis ×6; broad-icp ×5; icp-too-broad ×4; invented-metric ×3; overconfident-confidence-score ×3

Worst cases (by det score):
- `und-17` det=0.712 judge=0.837 flags: stat-conflation-4.9-of-28479,unvetted-marketing-metrics,icp-too-broad,icp-scope-conflict-indie-vs-enterprise
- `und-20` det=0.712 judge=0.75 flags: invented-tech-stack,unverified-metric,suspicious-source-attribution,empty-gaps-despite-degraded-analysis
- `und-06` det=0.792 judge=0.785 flags: generic-icp,unverified-logo-claim,pain-restates-pitch,differentiator-overlaps-description
- `und-02` det=0.801 judge=0.718 flags: inflated-metric,unverified-proof-point,feature-overclaim,generic-icp
- `und-11` det=0.801 judge=0.725 flags: inflated-metric,unverified-compliance-claims,icp-target-user-mismatch,icp-too-broad

## understand.site_only

Most common deterministic failures: missing evidence strings ×4; missing/empty keys ×3
Most common judge flags: invented-metric ×2; broad-icp ×2; overconfident-confidence ×2; generic-icp ×2; empty-gaps-despite-degraded-analysis ×2

Worst cases (by det score):
- `und-05` det=0.805 judge=0.685 flags: broad-icp,dead-product-as-alternative,category-as-alternative,missing-obvious-competitor
- `und-06` det=0.815 judge=0.65 flags: self-listed-as-alternative,category-not-product-alternative,icp-too-broad,weakly-sourced-metric
- `und-02` det=0.823 judge=0.65 flags: metric-conflict,invented-tech-stack,overconfident-confidence,empty-gaps-despite-degraded
- `und-03` det=0.889 judge=0.7 flags: invented-metric,hedged-proof-point,unverified-logo-claim,inferred-tech-stack-without-repo
- `und-01` det=0.963 judge=0.755 flags: invented-metric,misattributed-source,fabricated-press-mention,speculative-tech-stack
