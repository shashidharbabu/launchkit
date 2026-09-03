"""E2E test for lk_commercial.pipe — Feature 2 (pricing) + Feature 3 (listing).

Usage (from launchkit/):
    .venv/bin/python backend/test_commercial.py [pricing|listing|both]
Uses the latest app profile from test_output/ as input.
"""

import asyncio
import json
import sys

from lk_common import latest_profile, report, run_pipe

PRICING_KEYS = ["competitors", "recommendation", "confidence"]
LISTING_KEYS = ["title", "tagline", "description_short", "description_long",
                "keywords", "screenshot_order", "faq", "cta", "confidence"]


async def main() -> int:
    which = sys.argv[1] if len(sys.argv) > 1 else "both"
    profile = latest_profile()
    print(f"input profile: {profile.get('one_liner', '?')[:80]}")
    rc = 0

    if which in ("pricing", "both"):
        q = ("TASK: pricing\n"
             f"APP_PROFILE: {json.dumps(profile)}")
        parsed, elapsed = await run_pipe("lk_commercial.pipe", q, "pricing")
        rc |= report("PRICING", parsed, elapsed, PRICING_KEYS)
        # sanity: competitors must have real source urls
        comps = parsed.get("competitors", [])
        sourced = [c for c in comps if str(c.get("source_url", "")).startswith("http")]
        print(f"competitors: {len(comps)}, with source urls: {len(sourced)}")

    if which in ("listing", "both"):
        q = ("TASK: listing\n"
             f"APP_PROFILE: {json.dumps(profile)}")
        parsed, elapsed = await run_pipe("lk_commercial.pipe", q, "listing")
        rc |= report("LISTING", parsed, elapsed, LISTING_KEYS)
        tagline = parsed.get("tagline", "")
        if len(tagline) > 60:
            print(f"WARN tagline over 60 chars ({len(tagline)})")
            rc |= 2

    return rc


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
