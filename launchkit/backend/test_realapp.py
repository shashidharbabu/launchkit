"""Real-app onboarding test: runs a complete Launch Kit flow through the
BACKEND API against a real RocketRide app (dashboard.rocketride.ai).

Exercises every stage + both gates the way the UI would, and reports quality
per stage. Run (from launchkit/):
    .venv/bin/python backend/test_realapp.py [repo_url] [site_url] [name]
"""

import json
import sys
import time
import urllib.request

BASE = "http://localhost:8090"
REPO = sys.argv[1] if len(sys.argv) > 1 else "https://github.com/rocketride-ai/dashboard"
SITE = sys.argv[2] if len(sys.argv) > 2 else "https://dashboard.rocketride.ai"
NAME = sys.argv[3] if len(sys.argv) > 3 else "RocketRide Dashboard"


def call(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def wait(job_id, limit=150):
    for _ in range(limit):
        time.sleep(4)
        _, j = call("GET", f"/jobs/{job_id}")
        if j["status"] in ("done", "error"):
            return j
    return j


def run(kind, start_path, body=None):
    s, r = call("POST", start_path, body)
    if "job_id" not in r:
        print(f"[{kind}] FAILED TO START: {r}")
        return None
    j = wait(r["job_id"])
    print(f"[{kind}] {j['status']} {j.get('elapsed_seconds')}s "
          f"{(j.get('error') or '')[:150]}", flush=True)
    return j


def main() -> int:
    print(f"REAL-APP TEST: {NAME}\n  repo: {REPO}\n  site: {SITE}", flush=True)
    s, proj = call("POST", "/projects",
                   {"name": NAME, "repo_url": REPO, "site_url": SITE,
                    "app_url": SITE})
    pid = proj["id"]
    print("project:", pid, flush=True)

    # Stage 1 — understand (repo likely unreadable: graceful-degradation test)
    j = run("understand", f"/projects/{pid}/run/understand")
    if not j or j["status"] != "done":
        return 1
    s, detail = call("GET", f"/projects/{pid}")
    prof = detail["profile"]["data"]
    print("  one_liner:", prof.get("one_liner"))
    print("  confidence:", json.dumps(prof.get("confidence")))
    print("  gaps:", prof.get("gaps"))
    call("POST", f"/projects/{pid}/profile/approve")
    print("Gate 1 approved (test auto-approve)", flush=True)

    # Stage 2+3 — commercial
    run("pricing", f"/projects/{pid}/run/pricing")
    run("listing", f"/projects/{pid}/run/listing")
    s, pr = call("GET", f"/projects/{pid}/commercial/pricing")
    if s == 200:
        rec = pr["data"].get("recommendation", {})
        print("  pricing model:", rec.get("model"),
              "| tiers:", [(t.get("name"), t.get("price_usd_month")) for t in rec.get("tiers", [])])
    s, li = call("GET", f"/projects/{pid}/commercial/listing")
    if s == 200:
        print("  listing tagline:", li["data"].get("tagline"))

    # Stage 4a — targets (curated pool + discovery)
    run("targets", f"/projects/{pid}/run/targets")
    s, targets = call("GET", f"/projects/{pid}/targets")
    kinds = {}
    for t in targets:
        kinds[t["data"].get("kind", "?")] = kinds.get(t["data"].get("kind", "?"), 0) + 1
    print(f"  targets: {len(targets)} | kinds: {kinds}")
    for t in targets[:3]:
        call("POST", f"/targets/{t['id']}/select?selected=true")

    # Stage 4b — two assets
    run("asset:reddit_post", f"/projects/{pid}/run/asset", {"asset_type": "reddit_post"})
    run("asset:show_hn", f"/projects/{pid}/run/asset", {"asset_type": "show_hn"})
    s, assets = call("GET", f"/projects/{pid}/assets")
    for a in assets:
        call("POST", f"/assets/{a['id']}/approve")
        print(f"  asset {a['asset_type']}: title/tagline =",
              str(a["data"].get("title") or a["data"].get("post"))[:90])

    # Stage 5 — signals (finder + gate + re-scorer)
    run("signals", f"/projects/{pid}/run/signals")
    s, signals = call("GET", f"/projects/{pid}/signals")
    print(f"  signals in queue after rescore: {len(signals)}")
    s, meta = call("GET", f"/projects/{pid}/commercial/signals_meta")
    if s == 200:
        print("  rejected by rescore:", len(meta["data"].get("rejected_by_rescore", [])))

    # Plan + attribution smoke
    s, plan = call("GET", f"/projects/{pid}/plan")
    print("plan ready:", plan["ready"], "| targets:", len(plan["targets"]),
          "| assets:", list(plan["assets"].keys()))
    if plan["targets"]:
        call("POST", "/mockstore/events", {"app_id": pid, "ref": plan["targets"][0]["ref"]})
        s, attr = call("GET", f"/projects/{pid}/attribution")
        print("attribution total:", attr["total"])

    print("\nREAL-APP FLOW COMPLETE — project", pid)
    return 0


if __name__ == "__main__":
    sys.exit(main())
