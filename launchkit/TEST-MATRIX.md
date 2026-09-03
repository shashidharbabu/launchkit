# Launch Kit — Pipeline Test Matrix

Test apps: **A** Umami (umami.is + public repo) · **B** Granola (site only) · **C** motion-primitives (baseline).
Projects: A=`b79f57db8464` B=`dc35c8c21299` C=`8e7c7914a1c6`

| # | Pipeline | Test cases | Looking for | Result |
|---|---|---|---|---|
| 1 | `lk_understand` | A repo+site · B site-only · C baseline | real proof points, sources listed, degraded flag on B | **PASS** — 50s each, all claims verified real. Finding: B degraded but confidence 0.95 > C's 0.85 |
| 2 | `lk_commercial` pricing | A vs Plausible/Fathom · B vs Otter/Fireflies | competitor prices match their live pages | |
| 3 | `lk_commercial` listing | A · C | uses profile facts, no invented features | |
| 4 | `lk_targets` | A | ≥15 ranked venues, real submission links, new venues saved | |
| 5 | `lk_assets` | A: show_hn, reddit_post, producthunt, video_script | platform conventions held, not salesy | |
| 6 | `lk_signals` | A (rich pool) · C (baseline ~4) · B (thin) | real thread URLs, no product pages, honest empty ok | |
| 7 | `lk_rescore` | rerun on row 6 + 2 planted imposters | imposters rejected, HN >14d rejected | |

Reruns from cloud-engine flakiness (~1 in 3 long runs) are expected — note them, not failures.

## Commands

```bash
cd /Users/shashidharbabu/rocketride-apps-gtm/launchkit
PY=.venv/bin/python
$PY backend/test_understand.py <repo> <site>
$PY backend/test_commercial.py both
$PY backend/test_targets.py
$PY backend/test_assets.py show_hn reddit_post producthunt video_script
$PY backend/test_signals.py backend/test_output/profile_<ts>.json
```
