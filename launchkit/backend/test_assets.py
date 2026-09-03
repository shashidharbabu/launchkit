"""E2E test for lk_assets.pipe — Feature 4b (platform-native launch assets).

Usage (from launchkit/):
    .venv/bin/python backend/test_assets.py [asset_type ...]
Defaults to testing: reddit_post, show_hn, producthunt, video_script.
"""

import asyncio
import json
import sys

from lk_common import latest_profile, report, run_pipe

REQUIRED = {
    "x_post": ["post", "alt_variants", "warnings"],
    "linkedin_post": ["post", "alt_hook", "warnings"],
    "reddit_post": ["title", "body", "warnings"],
    "producthunt": ["name", "tagline", "description", "first_comment", "topics", "warnings"],
    "show_hn": ["title", "body", "warnings"],
    "newsletter_pitch": ["subject", "pitch", "warnings"],
    "video_script": ["duration_seconds", "hook", "scenes", "cta", "production_notes", "warnings"],
}

DEFAULT_SET = ["reddit_post", "show_hn", "producthunt", "video_script"]

TARGET_CONTEXT = {
    "reddit_post": {
        "name": "r/SideProject",
        "rules": "Self-promo allowed for original projects. Be transparent that "
                 "you are the creator. No repost spam. Feedback-seeking framing "
                 "is encouraged.",
    },
}


async def main() -> int:
    types = sys.argv[1:] or DEFAULT_SET
    profile = latest_profile()
    print(f"input profile: {profile.get('one_liner', '?')[:80]}")
    rc = 0
    for asset_type in types:
        if asset_type not in REQUIRED:
            print(f"SKIP unknown asset type {asset_type}")
            continue
        parts = [f"ASSET_TYPE: {asset_type}", f"APP_PROFILE: {json.dumps(profile)}"]
        if asset_type in TARGET_CONTEXT:
            parts.append(f"TARGET: {json.dumps(TARGET_CONTEXT[asset_type])}")
        parsed, elapsed = await run_pipe(
            "lk_assets.pipe", "\n".join(parts), f"asset_{asset_type}")
        rc |= report(f"ASSET {asset_type}", parsed, elapsed, REQUIRED[asset_type])
        # per-type sanity checks
        if asset_type == "x_post" and len(parsed.get("post", "")) > 280:
            print("WARN x_post over 280 chars")
            rc |= 2
        if asset_type == "producthunt" and len(parsed.get("tagline", "")) > 60:
            print("WARN PH tagline over 60 chars")
            rc |= 2
        if asset_type == "show_hn" and not parsed.get("title", "").startswith("Show HN:"):
            print("WARN show_hn title missing prefix")
            rc |= 2
        if asset_type == "reddit_post" and parsed.get("title", "").startswith("Show HN"):
            print("WARN reddit title uses HN convention")
            rc |= 2
    return rc


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
