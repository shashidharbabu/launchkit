"""Cloud test: lk_brand.pipe — TASK=dna (scrape a live site into Business DNA),
then TASK=campaigns (DNA + profile → campaign concepts).

Run (from launchkit/):  .venv/bin/python backend/test_brand.py [site_url]
Defaults to motion-primitives.com to match the latest test_output profile.
"""

import asyncio
import json
import sys

from lk_common import latest_profile, report, run_pipe

SITE = sys.argv[1] if len(sys.argv) > 1 else "https://motion-primitives.com"

DNA_KEYS = ["brand_name", "voice", "messaging", "visual",
            "dos_and_donts", "sources_read", "confidence"]
CAMPAIGN_KEYS = ["campaigns", "confidence"]


async def main() -> int:
    profile = latest_profile()

    dna, t1 = await run_pipe(
        "lk_brand.pipe",
        f"TASK: dna\nAPP_PROFILE: {json.dumps(profile)}\nSITE_URL: {SITE}",
        "brand_dna")
    rc1 = report("brand_dna", dna, t1, DNA_KEYS)
    # evidence discipline: every color must carry where it was observed
    for c in (dna.get("visual") or {}).get("colors") or []:
        if not c.get("evidence"):
            print(f"WARN color without evidence: {c}")
            rc1 = max(rc1, 2)

    camp, t2 = await run_pipe(
        "lk_brand.pipe",
        f"TASK: campaigns\nAPP_PROFILE: {json.dumps(profile)}\n"
        f"BRAND_DNA: {json.dumps(dna)}",
        "brand_campaigns")
    rc2 = report("brand_campaigns", camp, t2, CAMPAIGN_KEYS)
    n = len(camp.get("campaigns") or [])
    print(f"campaigns generated: {n} (want 4-6)")
    if not 4 <= n <= 6:
        rc2 = max(rc2, 2)
    return max(rc1, rc2)


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
