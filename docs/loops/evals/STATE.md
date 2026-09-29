# Staging evals: state

Vision: [VISION.md](VISION.md). Judge: [JUDGE.md](JUDGE.md). Cap: 3 turns. Evidence: `docs/eval-10-0929/`.

## Scores per turn (stage means over ten apps, 1 to 5)

| Turn | profile | brand | commercial | social | assets | targets | signals | plan | overall | posts (X, LI, Reddit, PH, HN, NL) |
|---|---|---|---|---|---|---|---|---|---|---|
| baseline 09-11 | 3.8 | 3.6 | 2.6 | 2.9 | 2.9 | 3.1 | 1.7 | 3.1 | 3.0 | 3.2, 3.3, 2.4, 3.0, 2.8, 3.5 (v4 rerun mean 3.52) |

## Turns

| Turn | Date | What | Gate result | Verifier | Next |
|---|---|---|---|---|---|
| 1 | 09-29 | Pre-flight: 76/76 domain tests, typecheck, walk 16/16, staging tasks in rocketride_sb with all four org secrets. Ten apps, all eight stages, two lanes: `EVAL_OUT=docs/eval-10-0929 node run-eval.mjs` | running | | judge all ten |

## Fixes

## System improvements

- The harness (`run-eval.mjs`, `drive.rerun.mjs`, `eval-extract.py`, `eval-sheets.py`) takes `EVAL_OUT`, so a new measurement never overwrites earlier evidence.
- The judge brief is a file (`JUDGE.md`), fixed for the loop, so turn scores are comparable.
