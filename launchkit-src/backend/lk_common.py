"""Shared helpers for Launch Kit pipeline test harnesses."""

import json
import os
import time
from pathlib import Path

LAUNCHKIT_DIR = Path(__file__).resolve().parent.parent
PIPELINES_DIR = LAUNCHKIT_DIR / "pipelines"
OUT_DIR = LAUNCHKIT_DIR / "backend" / "test_output"


def latest_profile() -> dict:
    """Load the most recent app profile produced by test_understand.py."""
    profiles = sorted(OUT_DIR.glob("profile_*.json"))
    if not profiles:
        raise SystemExit("No profile in test_output/ — run test_understand.py first")
    return json.loads(profiles[-1].read_text())


def extract_answer(response: dict):
    result_types = response.get("result_types", {}) or {}
    keys = [k for k, lane in result_types.items() if lane == "answers"]
    keys.append("answers")
    for key in keys:
        answers = response.get(key)
        if answers:
            return answers[0]
    return None


def parse_json_loose(raw):
    """Parse agent output: strict JSON preferred, tolerate fences/Python-dict."""
    if isinstance(raw, (dict, list)):
        return raw
    text = str(raw).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"no JSON object in answer: {text[:300]!r}")
    blob = text[start:end + 1]
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        import ast
        return ast.literal_eval(blob)


async def run_pipe(pipe_name: str, question_text: str, label: str):
    """Restart pipe fresh (avoids stale-config reuse), ask one question,
    return (parsed_json, elapsed_seconds). Saves raw + parsed to OUT_DIR."""
    os.chdir(LAUNCHKIT_DIR)  # SDK reads launchkit/.env
    from rocketride import RocketRideClient
    from rocketride.schema import Question

    pipe_path = str(PIPELINES_DIR / pipe_name)
    doc = json.loads(Path(pipe_path).read_text())
    project_id = doc["project_id"]
    source_id = next(c["id"] for c in doc["components"]
                     if c["provider"] in ("chat", "webhook", "dropper"))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")

    async with RocketRideClient() as client:
        try:
            old = await client.get_task_token(project_id, source_id)
            if old:
                await client.terminate(old)
        except Exception:  # noqa: BLE001 — nothing running
            pass
        result = await client.use(filepath=pipe_path)
        token = result["token"]

        q = Question(expectJson=True)
        q.addQuestion(question_text)

        t0 = time.time()
        response = await client.chat(token=token, question=q)
        elapsed = time.time() - t0

        (OUT_DIR / f"raw_{label}_{stamp}.json").write_text(
            json.dumps(response, indent=2, default=str))

        raw_answer = extract_answer(response)
        if raw_answer is None:
            raise RuntimeError("no answers in response — see raw file")
        parsed = parse_json_loose(raw_answer)
        (OUT_DIR / f"{label}_{stamp}.json").write_text(json.dumps(parsed, indent=2))
        return parsed, elapsed


import re

THREAD_PAT = re.compile(
    r"(reddit\.com/r/.+/comments/|news\.ycombinator\.com/item|"
    r"github\.com/.+/(discussions|issues)/|stackoverflow\.com/questions/|"
    r"/t/|/thread|forum)")


def filter_signals(signals: list, own_domains: list) -> tuple:
    """Deterministic quality gate for the intent-signal queue.

    Keeps only real discussion threads; drops repo/product homepages and
    anything on the app's own domains. Returns (kept, dropped_with_reason).
    """
    kept, dropped = [], []
    for s in signals:
        url = str(s.get("url", ""))
        if not url.startswith("http"):
            dropped.append((url, "not a url"))
        elif any(d and d in url for d in own_domains):
            dropped.append((url, "app's own content"))
        elif not THREAD_PAT.search(url):
            dropped.append((url, "not a thread (repo/homepage/article)"))
        else:
            kept.append(s)
    for i, s in enumerate(kept, 1):
        s["rank"] = i
    return kept, dropped


def report(label: str, parsed: dict, elapsed: float, required_keys: list) -> int:
    missing = [k for k in required_keys if k not in parsed]
    print(f"\n=== {label} ({elapsed:.0f}s) ===")
    print(json.dumps(parsed, indent=2)[:2500])
    print("=" * 40)
    if missing:
        print(f"WARN missing keys: {missing}")
        return 2
    print("all required keys present")
    return 0
