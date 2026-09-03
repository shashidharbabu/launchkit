"""E2E test for lk_signals.pipe — Feature 5 (intent-signal reply queue).

Usage (from launchkit/):
    .venv/bin/python backend/test_signals.py [path/to/profile.json]
"""

import asyncio
import json
import sys
from pathlib import Path

from app.rr import build_signals_question
from lk_common import latest_profile, report, run_pipe

KEYS = ["signals", "search_queries_used", "coverage_notes", "confidence"]


async def main() -> int:
    if len(sys.argv) > 1:
        profile = json.loads(Path(sys.argv[1]).read_text())
    else:
        profile = latest_profile()
    print(f"input profile: {profile.get('one_liner', '?')[:80]}")
    q = build_signals_question(profile)
    parsed, elapsed = await run_pipe("lk_signals.pipe", q, "signals")
    rc = report("SIGNALS", parsed, elapsed, KEYS)

    from lk_common import filter_signals
    raw_signals = parsed.get("signals", [])
    # own domains derived from the profile inputs used in test_understand
    own = ["motion-primitives", "excalidraw"]
    kept, dropped = filter_signals(raw_signals, own)
    print(f"signals: {len(raw_signals)} raw -> {len(kept)} kept after quality gate")
    for url, why in dropped:
        print(f"  dropped: {why}: {url[:80]}")
    if len(kept) < 2:
        print("WARN fewer than 2 clean thread signals survived the gate")
        rc |= 2
    signals = kept
    no_reply = [s for s in signals if len(str(s.get("drafted_reply", ""))) < 30]
    if no_reply:
        print(f"WARN {len(no_reply)} signals with missing/short drafted replies")
        rc |= 2
    platforms = {}
    for s in signals:
        platforms[s.get("platform", "?")] = platforms.get(s.get("platform", "?"), 0) + 1
    print(f"platforms: {platforms}")
    return rc


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
