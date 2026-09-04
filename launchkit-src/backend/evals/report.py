"""Aggregate eval results into the ablation report.

Reads every evals/results/<pipe>.<variant>.jsonl, computes per-lane aggregates,
applies the up-to-the-mark thresholds, and writes evals/REPORT.md.

Run: .venv/bin/python backend/evals/report.py
"""
from __future__ import annotations

import json
import statistics
from collections import defaultdict
from pathlib import Path

EVALS = Path(__file__).resolve().parent
RESULTS = EVALS / "results"

# a lane is "up to the mark" only if it clears ALL of these
THRESHOLDS = {"success": 0.90, "det": 0.80, "judge": 0.70}


def load_lane(path: Path) -> list[dict]:
    recs = []
    for line in path.read_text().splitlines():
        try:
            recs.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    # resume runs can append a case twice (e.g. rerun after a fix): keep last
    latest: dict[str, dict] = {}
    for r in recs:
        latest[r["case_id"]] = r
    return list(latest.values())


def agg(recs: list[dict]) -> dict:
    n = len(recs)
    ok = [r for r in recs if r.get("ok")]
    det = [r["det"]["score"] for r in ok if r.get("det")]
    judged = [r["judge"]["overall"] for r in ok
              if isinstance(r.get("judge"), dict) and "overall" in r["judge"]]
    lat = [r["elapsed_s"] for r in recs if "elapsed_s" in r]
    retried = sum(1 for r in recs if r.get("retried"))
    flags: dict[str, int] = defaultdict(int)
    for r in ok:
        for f in (r.get("judge") or {}).get("flags", []) if isinstance(r.get("judge"), dict) else []:
            flags[f] += 1
    fails: dict[str, int] = defaultdict(int)
    for r in ok:
        for f in (r.get("det") or {}).get("failures", []):
            fails[f.split(":")[0]] += 1
    return {
        "n": n,
        "success": round(len(ok) / n, 3) if n else 0,
        "det": round(statistics.mean(det), 3) if det else None,
        "judge": round(statistics.mean(judged), 3) if judged else None,
        "p50_s": round(statistics.median(lat), 1) if lat else None,
        "retried": retried,
        "errors": [r.get("error") for r in recs if not r.get("ok")],
        "top_flags": sorted(flags.items(), key=lambda x: -x[1])[:5],
        "top_failures": sorted(fails.items(), key=lambda x: -x[1])[:5],
    }


def rescore_confusion(recs: list[dict]) -> dict:
    tp = fp = tn = fn = unverified = 0
    for r in recs:
        if not r.get("ok"):
            continue
        c = r["det"]["checks"]
        pred, label = c.get("_predicted"), c.get("_label")
        if not c.get("_scored"):
            unverified += 1
            continue
        if label == "relevant":
            tp += pred == "relevant"
            fn += pred != "relevant"
        elif label == "irrelevant":
            fp += pred == "relevant"
            tn += pred != "relevant"
    prec = tp / (tp + fp) if tp + fp else None
    rec_ = tp / (tp + fn) if tp + fn else None
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn, "unverified": unverified,
            "precision": round(prec, 3) if prec is not None else None,
            "recall": round(rec_, 3) if rec_ is not None else None}


def verdict(a: dict) -> str:
    checks = [a["success"] >= THRESHOLDS["success"],
              a["det"] is not None and a["det"] >= THRESHOLDS["det"]]
    if a["judge"] is not None:
        checks.append(a["judge"] >= THRESHOLDS["judge"])
    return "UP TO THE MARK" if all(checks) else "NEEDS WORK"


def main() -> None:
    lanes = sorted(RESULTS.glob("*.jsonl"))
    if not lanes:
        print("no results yet")
        return

    lines = ["# Launch Kit pipeline ablation report", "",
             f"Thresholds: success ≥ {THRESHOLDS['success']:.0%}, deterministic ≥ "
             f"{THRESHOLDS['det']}, judge ≥ {THRESHOLDS['judge']} → otherwise NEEDS WORK.",
             "",
             "| Pipeline · variant | n | success | det score | judge score | p50 latency | retries | verdict |",
             "|---|---|---|---|---|---|---|---|"]
    details = []
    for path in lanes:
        pipe_variant = path.stem
        recs = load_lane(path)
        a = agg(recs)
        v = verdict(a)
        lines.append(
            f"| {pipe_variant.replace('.', ' · ')} | {a['n']} | {a['success']:.0%} "
            f"| {a['det'] if a['det'] is not None else '—'} "
            f"| {a['judge'] if a['judge'] is not None else '—'} "
            f"| {a['p50_s']}s | {a['retried']} | **{v}** |")

        d = [f"## {pipe_variant}", ""]
        if pipe_variant.startswith("rescore"):
            c = rescore_confusion(recs)
            d.append(f"Judge vs ground truth (fetchable threads): TP {c['tp']} · FP {c['fp']} "
                     f"· TN {c['tn']} · FN {c['fn']} → precision {c['precision']}, "
                     f"recall {c['recall']}; {c['unverified']} threads unfetchable "
                     f"(kept as 'unverified' — fetch-coverage gap, not judge error)")
            d.append("")
        if a["top_failures"]:
            d.append("Most common deterministic failures: " +
                     "; ".join(f"{k} ×{n}" for k, n in a["top_failures"]))
        if a["top_flags"]:
            d.append("Most common judge flags: " +
                     "; ".join(f"{k} ×{n}" for k, n in a["top_flags"]))
        if a["errors"]:
            d.append(f"Errors ({len(a['errors'])}): " + " | ".join(str(e)[:140] for e in a["errors"][:5]))
        d.append("")
        d.append("Worst cases (by det score):")
        worst = sorted((r for r in recs if r.get("ok")),
                       key=lambda r: r["det"]["score"])[:5]
        for r in worst:
            jflags = ",".join((r.get("judge") or {}).get("flags", [])[:4]) \
                if isinstance(r.get("judge"), dict) else ""
            d.append(f"- `{r['case_id']}` det={r['det']['score']} "
                     f"judge={(r.get('judge') or {}).get('overall', '—') if isinstance(r.get('judge'), dict) else '—'} "
                     f"{('flags: ' + jflags) if jflags else ''}")
        d.append("")
        details.extend(d)

    out = "\n".join(lines) + "\n\n" + "\n".join(details)
    (EVALS / "REPORT.md").write_text(out)
    print(out)


if __name__ == "__main__":
    main()
