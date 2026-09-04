"""E2E test for lk_targets.pipe — Feature 4a (ranked launch venues).

Usage (from launchkit/):
    .venv/bin/python backend/test_targets.py
"""

import asyncio
import json
import sys

from lk_common import latest_profile, report, run_pipe

KEYS = ["targets", "sequencing_advice", "search_queries_used", "confidence"]


async def main() -> int:
    profile = latest_profile()
    print(f"input profile: {profile.get('one_liner', '?')[:80]}")
    q = f"APP_PROFILE: {json.dumps(profile)}"
    parsed, elapsed = await run_pipe("lk_targets.pipe", q, "targets")
    rc = report("TARGETS", parsed, elapsed, KEYS)

    targets = parsed.get("targets", [])
    print(f"target count: {len(targets)} (want 12-20)")
    if not 8 <= len(targets) <= 25:
        rc |= 2
    kinds = {}
    bad_urls = 0
    for t in targets:
        kinds[t.get("kind", "?")] = kinds.get(t.get("kind", "?"), 0) + 1
        if not str(t.get("url", "")).startswith("http"):
            bad_urls += 1
    print(f"kinds: {kinds}")
    if bad_urls:
        print(f"WARN {bad_urls} targets with non-http urls")
        rc |= 2
    return rc


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
