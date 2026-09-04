"""End-to-end test for lk_understand.pipe (Feature 1: repo + site -> app profile).

Usage (from launchkit/):
    python backend/test_understand.py [repo_url] [site_url]

Defaults to a small, well-known public app so results are easy to eyeball.
Saves the raw response and parsed profile under backend/test_output/.
"""

import asyncio
import json
import os
import sys
import time
from pathlib import Path

LAUNCHKIT_DIR = Path(__file__).resolve().parent.parent
PIPE = str(LAUNCHKIT_DIR / "pipelines" / "lk_understand.pipe")
OUT_DIR = LAUNCHKIT_DIR / "backend" / "test_output"

DEFAULT_REPO = "https://github.com/ibelick/motion-primitives"
DEFAULT_SITE = "https://motion-primitives.com"

PROFILE_KEYS = [
    "one_liner", "description", "category", "target_user", "icp",
    "differentiators", "proof_points", "tech_stack", "pricing_current",
    "voice", "maturity", "gaps", "confidence",
]


def extract_answer(response: dict):
    """Pull the first answers-lane payload out of a pipeline response."""
    result_types = response.get("result_types", {}) or {}
    keys = [k for k, lane in result_types.items() if lane == "answers"]
    keys.append("answers")  # fallback default key
    for key in keys:
        answers = response.get(key)
        if answers:
            return answers[0]
    return None


def parse_profile(raw):
    """Agent should return pure JSON; tolerate fenced/prefixed output."""
    if isinstance(raw, dict):
        return raw
    text = str(raw).strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text[text.find("{"):]
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"no JSON object found in answer: {text[:200]!r}")
    blob = text[start:end + 1]
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        # Some models emit Python-dict style (single quotes); accept it safely.
        import ast
        return ast.literal_eval(blob)


async def main() -> int:
    repo = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_REPO
    site = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_SITE

    os.chdir(LAUNCHKIT_DIR)  # SDK reads launchkit/.env
    from rocketride import RocketRideClient
    from rocketride.schema import Question

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")

    print(f"repo: {repo}\nsite: {site}\npipe: {PIPE}\n")

    pipe_doc = json.loads(Path(PIPE).read_text())
    project_id = pipe_doc["project_id"]
    source_id = next(c["id"] for c in pipe_doc["components"]
                     if c["provider"] in ("chat", "webhook", "dropper"))

    async with RocketRideClient() as client:
        print("connected — restarting pipeline fresh (avoid stale config) ...")
        try:
            old = await client.get_task_token(project_id, source_id)
            if old:
                await client.terminate(old)
        except Exception:  # noqa: BLE001 — no running task, nothing to stop
            pass
        result = await client.use(filepath=PIPE)
        token = result["token"]
        print(f"pipeline token: {token}\nrunning agent (this takes minutes) ...")

        question = Question(expectJson=True)
        question.addQuestion(
            f"Produce the app profile for this app.\n"
            f"Repository URL: {repo}\n"
            f"Live product URL: {site}"
        )

        t0 = time.time()
        response = await client.chat(token=token, question=question)
        elapsed = time.time() - t0
        print(f"agent finished in {elapsed:.0f}s")

        (OUT_DIR / f"raw_{stamp}.json").write_text(
            json.dumps(response, indent=2, default=str))

        raw_answer = extract_answer(response)
        if raw_answer is None:
            print("FAIL: no answers in response — see raw output file")
            return 1

        try:
            profile = parse_profile(raw_answer)
        except Exception as e:  # noqa: BLE001
            print(f"FAIL: answer is not valid JSON ({e}) — see raw output file")
            return 1

        (OUT_DIR / f"profile_{stamp}.json").write_text(
            json.dumps(profile, indent=2))

        missing = [k for k in PROFILE_KEYS if k not in profile]
        print("\n--- PROFILE ---")
        print(json.dumps(profile, indent=2)[:3000])
        print("---------------")
        if missing:
            print(f"WARN: missing keys: {missing}")
        else:
            print("all required profile keys present")
        print(f"saved: {OUT_DIR}/profile_{stamp}.json")
        return 0 if not missing else 2


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
