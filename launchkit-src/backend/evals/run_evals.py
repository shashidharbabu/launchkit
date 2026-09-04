"""Launch Kit pipeline eval runner.

One lane per pipeline; lanes are separate processes so pipes run in parallel
without sharing a client. Resumable: a (case_id, variant) already present in
the results JSONL is skipped, so a killed lane just gets re-launched.

Usage (from launchkit/):
  .venv/bin/python backend/evals/run_evals.py --pipe understand
  .venv/bin/python backend/evals/run_evals.py --pipe assets --variant v2prompt
  .venv/bin/python backend/evals/run_evals.py --pipe understand --variant site_only --ids u01,u02
Flags: --limit N  --ids a,b  --no-judge  --no-url-checks
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
import traceback
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from app import rr                     # noqa: E402
from evals import graders              # noqa: E402
from evals import judge as judge_mod   # noqa: E402

EVALS = BACKEND / "evals"
CASES = EVALS / "cases"
FIXTURES = EVALS / "fixtures"
RESULTS = EVALS / "results"
RAW = RESULTS / "raw"

PIPE_FILE = {
    "understand": "lk_understand.pipe",
    "brand": "lk_brand.pipe",
    "commercial": "lk_commercial.pipe",
    "targets": "lk_targets.pipe",
    "assets": "lk_assets.pipe",
    "signals": "lk_signals.pipe",
    "rescore": "lk_rescore.pipe",
}


def load_json(p: Path):
    return json.loads(p.read_text())


def load_profile(ref: str) -> dict:
    return load_json(FIXTURES / "profiles" / f"{ref}.json")


def load_dna(ref: str) -> dict:
    return load_json(FIXTURES / "brand_dna" / f"{ref}.json")


def curated_venues() -> list[dict]:
    """Same pool main.py hands to run_targets, sourced from seed_venues.V."""
    sys.path.insert(0, str(BACKEND))
    import importlib
    sv = importlib.import_module("seed_venues")
    return [{"name": n, "kind": k, "url": u, "submission_url": su, "tags": tags}
            for (n, k, u, su, _notes, _size, tags) in sv.V]


def done_ids(results_file: Path) -> set[str]:
    if not results_file.exists():
        return set()
    ids = set()
    for line in results_file.read_text().splitlines():
        try:
            rec = json.loads(line)
            if rec.get("ok") is True:   # errored cases re-run on the next launch
                ids.add(rec["case_id"])
        except json.JSONDecodeError:
            continue
    return ids


# ------------------------------------------------------------ variant: assets v2 prompt

def swap_assets_instructions(new_instructions: list[str]) -> list[str]:
    """Patch lk_assets.pipe agent instructions in place; returns the old ones."""
    pipe_path = rr.PIPELINES_DIR / "lk_assets.pipe"
    doc = json.loads(pipe_path.read_text())
    agent = next(c for c in doc["components"] if c["provider"] == "agent_rocketride")
    old = agent["config"]["instructions"]
    agent["config"]["instructions"] = new_instructions
    pipe_path.write_text(json.dumps(doc, indent=2))
    return old


# ------------------------------------------------------------ per-pipe execution

async def execute(pipe: str, case: dict, variant: str) -> tuple[dict | list, dict]:
    """Run the pipeline for one case. Returns (output, extras)."""
    if pipe == "understand":
        repo = "" if variant == "site_only" else (case.get("repo_url") or "")
        if not repo:
            # no repo supplied → degraded IS the correct pipeline behavior
            case.setdefault("expect", {})["degraded_expected"] = True
        out = await rr.run_understand(repo, case["site_url"])
        return out, {}

    if pipe == "brand":
        profile = load_profile(case["profile_ref"])
        case["_profile"] = profile
        if case["task"] == "dna":
            out = await rr.run_brand("dna", profile, site_url=case["site_url"])
            return out, {}
        dna_ref = case.get("dna_ref") or ""
        if dna_ref.startswith("from:"):
            # chain: use the dna produced earlier this lane if present
            src = RAW / f"brand.{variant}.{dna_ref[5:]}.json"
            dna = load_json(src).get("output") if src.exists() else load_dna(default_dna_ref())
            dna = dna or load_dna(default_dna_ref())
        else:
            dna = load_dna(dna_ref) if dna_ref else load_dna(default_dna_ref())
        case["_dna"] = dna
        out = await rr.run_brand("campaigns", profile, dna=dna)
        return out, {}

    if pipe == "commercial":
        profile = load_profile(case["profile_ref"])
        case["_profile"] = profile
        out = await rr.run_commercial(case["task"], profile,
                                      current_listing=case.get("current_listing", ""))
        return out, {}

    if pipe == "targets":
        profile = load_profile(case["profile_ref"])
        case["_profile"] = profile
        out = await rr.run_targets(profile, curated_venues())
        return out, {}

    if pipe == "assets":
        profile = load_profile(case["profile_ref"])
        case["_profile"] = profile
        dna = load_dna(case["dna_ref"]) if case.get("dna_ref") else None
        case["_dna"] = dna
        out = await rr.run_asset(case["asset_type"], profile,
                                 target=case.get("target"), brand_dna=dna)
        return out, {}

    if pipe == "signals":
        profile = load_profile(case["profile_ref"])
        case["_profile"] = profile
        out = await rr.run_signals(profile, case.get("communities"))
        kept0, _dropped = rr.gate_signals(out.get("signals", []), [])
        kept, rejected = await rr.rescore_signals(profile, kept0)
        return out, {"kept": kept, "rejected": rejected}

    if pipe == "rescore":
        profile = load_profile(case["profile_ref"])
        case["_profile"] = profile
        # The HN 14-day replyability lock would auto-reject every archival HN
        # case before the relevance judge runs. The lock is a separate, already
        # deterministic rule — here we are measuring the JUDGE, so lift it.
        saved = rr.HN_LOCK_SECONDS
        rr.HN_LOCK_SECONDS = 10 ** 10
        try:
            kept, rejected = await rr.rescore_signals(profile, [dict(case["signal"])])
        finally:
            rr.HN_LOCK_SECONDS = saved
        return {"kept": kept, "rejected": rejected}, {"kept": kept, "rejected": rejected}

    raise ValueError(f"unknown pipe {pipe}")


_DEFAULT_DNA: str | None = None


def default_dna_ref() -> str:
    global _DEFAULT_DNA
    if _DEFAULT_DNA is None:
        _DEFAULT_DNA = sorted(p.stem for p in (FIXTURES / "brand_dna").glob("*.json"))[0]
    return _DEFAULT_DNA


def grade(pipe: str, case: dict, out, extras: dict, url_checks: bool) -> dict:
    if pipe == "understand":
        return graders.grade_understand(case, out)
    if pipe == "brand":
        return (graders.grade_brand_dna(case, out) if case["task"] == "dna"
                else graders.grade_brand_campaigns(case, out))
    if pipe == "commercial":
        return (graders.grade_pricing(case, out) if case["task"] == "pricing"
                else graders.grade_listing(case, out))
    if pipe == "targets":
        return graders.grade_targets(case, out, check_urls=url_checks)
    if pipe == "assets":
        gate = rr.gate_asset(case["asset_type"], dict(out)) if isinstance(out, dict) else None
        return graders.grade_asset(case, out, gate_result=gate)
    if pipe == "signals":
        return graders.grade_signals(case, out, extras["kept"], extras["rejected"])
    if pipe == "rescore":
        return graders.grade_rescore(case, extras["kept"], extras["rejected"])
    raise ValueError(pipe)


def judge_pipe_key(pipe: str, case: dict) -> str | None:
    """Which judge rubric applies (None = deterministic only)."""
    if pipe == "rescore":
        return None
    if pipe == "brand":
        return "brand_dna" if case["task"] == "dna" else "brand_campaigns"
    if pipe == "commercial":
        return case["task"]  # pricing | listing
    return pipe


async def run_lane(pipe: str, variant: str, limit: int | None, only_ids: set[str] | None,
                   use_judge: bool, url_checks: bool) -> None:
    cases = load_json(CASES / f"{pipe}.json")
    results_file = RESULTS / f"{pipe}.{variant}.jsonl"
    RAW.mkdir(parents=True, exist_ok=True)
    skip = done_ids(results_file)

    todo = [c for c in cases if c["id"] not in skip and (not only_ids or c["id"] in only_ids)]
    if limit:
        todo = todo[:limit]
    print(f"[{pipe}.{variant}] {len(todo)} to run ({len(skip)} already done)", flush=True)

    for i, case in enumerate(todo):
        t0 = time.time()
        rec = {"case_id": case["id"], "pipe": pipe, "variant": variant,
               "ts": time.strftime("%Y-%m-%dT%H:%M:%S")}
        out, extras, err, retried = None, {}, None, False
        case_ctx = dict(case)   # execute() attaches _profile/_dna here for grading
        try:
            try:
                out, extras = await execute(pipe, case_ctx, variant)
            except Exception as e:                          # noqa: BLE001
                # one restart-then-retry per case: clears the engine's
                # poisoned no-tools state after an abnormal agent death
                retried = True
                print(f"[{pipe}.{variant}] {case['id']} failed ({e}); restarting pipe + retrying",
                      flush=True)
                await rr.restart_pipe(PIPE_FILE[pipe])
                out, extras = await execute(pipe, case_ctx, variant)
        except Exception as e:                              # noqa: BLE001
            err = f"{type(e).__name__}: {e}"
            traceback.print_exc()

        rec["elapsed_s"] = round(time.time() - t0, 1)
        rec["retried"] = retried
        if err:
            rec.update(ok=False, error=err)
        else:
            det = grade(pipe, case_ctx, out, extras, url_checks)
            rec.update(ok=True, det=det)
            jk = judge_pipe_key(pipe, case) if use_judge else None
            judge_out = out
            if jk == "signals" and isinstance(out, dict):
                # judge what the builder actually sees: the post-rescore queue
                # (with rescore-rewritten replies), not the finder's raw list
                if extras.get("kept"):
                    judge_out = {**out, "signals": extras["kept"]}
                elif not out.get("signals"):
                    jk = None   # honest-empty: judging intent_match on nothing is unfair
            if jk:
                try:
                    system, payload, fields = graders.judge_spec(jk, case_ctx, judge_out)
                    rec["judge"] = await asyncio.to_thread(judge_mod.judge, system, payload, fields)
                except Exception as e:                      # noqa: BLE001
                    rec["judge_error"] = f"{type(e).__name__}: {e}"
            raw_path = RAW / f"{pipe}.{variant}.{case['id']}.json"
            raw_path.write_text(json.dumps(
                {"output": out, **{k: v for k, v in extras.items()}},
                indent=2, ensure_ascii=False, default=str))

        with results_file.open("a") as f:
            f.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
        status = "OK " if rec.get("ok") else "ERR"
        det_s = rec.get("det", {}).get("score")
        jud_s = rec.get("judge", {}).get("overall") if isinstance(rec.get("judge"), dict) else None
        print(f"[{pipe}.{variant}] {i+1}/{len(todo)} {case['id']} {status} "
              f"det={det_s} judge={jud_s} {rec['elapsed_s']}s", flush=True)

    print(f"[{pipe}.{variant}] lane complete", flush=True)


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pipe", required=True, choices=list(PIPE_FILE))
    ap.add_argument("--variant", default="baseline")
    ap.add_argument("--limit", type=int)
    ap.add_argument("--ids")
    ap.add_argument("--no-judge", action="store_true")
    ap.add_argument("--no-url-checks", action="store_true")
    args = ap.parse_args()

    only = set(args.ids.split(",")) if args.ids else None
    old_instructions = None
    try:
        if args.pipe == "assets" and args.variant == "v2prompt":
            v2 = load_json(EVALS / "variants" / "lk_assets_v2_instructions.json")
            old_instructions = swap_assets_instructions(v2)
            await rr.restart_pipe("lk_assets.pipe")
            print("[assets.v2prompt] pipe patched to v2 instructions + restarted", flush=True)
        await run_lane(args.pipe, args.variant, args.limit, only,
                       use_judge=not args.no_judge, url_checks=not args.no_url_checks)
    finally:
        if old_instructions is not None:
            swap_assets_instructions(old_instructions)
            try:
                await rr.restart_pipe("lk_assets.pipe")
            except Exception:                               # noqa: BLE001
                pass
            print("[assets.v2prompt] pipe restored to baseline instructions", flush=True)
        await rr.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
