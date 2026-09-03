"""Launch Kit environment check.

Verifies .env configuration, RocketRide server connectivity, and that the
pipelines this project ships are loadable. Run from launchkit/:

    python backend/check.py
"""

import asyncio
import json
import os
import sys
from pathlib import Path

LAUNCHKIT_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = LAUNCHKIT_DIR / ".env"
PIPELINES_DIR = LAUNCHKIT_DIR / "pipelines"

REQUIRED_VARS = [
    ("ROCKETRIDE_URI", "RocketRide server URI"),
    ("ROCKETRIDE_FIRECRAWL_KEY", "FireCrawl API key (site scraping)"),
    ("ROCKETRIDE_EXA_KEY", "Exa API key (web search)"),
]

# At least ONE of these must be set for the agent LLM
LLM_VARS = [
    ("ROCKETRIDE_OPENAI_KEY", "OpenAI"),
    ("ROCKETRIDE_ANTHROPIC_KEY", "Anthropic"),
    ("ROCKETRIDE_GMI_KEY", "GMI Cloud"),
]

OPTIONAL_VARS = [
    ("ROCKETRIDE_GITHUB_TOKEN", "GitHub PAT (repo reading — needed by lk_understand)"),
    ("ROCKETRIDE_REDDIT_CLIENT_ID", "Reddit API (lk_signals, later)"),
]


def load_env(path: Path) -> dict:
    env = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def check_env() -> bool:
    print(f"\n[1/3] Checking {ENV_FILE} ...")
    if not ENV_FILE.exists():
        print("  FAIL: .env not found")
        return False
    env = load_env(ENV_FILE)
    ok = True
    for var, label in REQUIRED_VARS:
        if env.get(var):
            print(f"  OK   {var} ({label})")
        else:
            print(f"  FAIL {var} missing — {label}")
            ok = False
    if any(env.get(v) for v, _ in LLM_VARS):
        have = [name for v, name in LLM_VARS if env.get(v)]
        print(f"  OK   LLM key present: {', '.join(have)}")
    else:
        print("  FAIL no LLM key — set one of: "
              + ", ".join(v for v, _ in LLM_VARS))
        ok = False
    for var, label in OPTIONAL_VARS:
        mark = "OK  " if env.get(var) else "WARN"
        print(f"  {mark} {var} ({label})")
    return ok


def check_pipelines() -> bool:
    print(f"\n[2/3] Validating .pipe files in {PIPELINES_DIR} ...")
    ok = True
    for pipe in sorted(PIPELINES_DIR.glob("*.pipe")):
        try:
            doc = json.loads(pipe.read_text())
            assert list(doc.keys())[0] == "components", "components must be first key"
            assert doc.get("project_id"), "missing project_id"
            assert doc.get("version") == 1, "version must be 1"
            ids = [c["id"] for c in doc["components"]]
            assert len(ids) == len(set(ids)), "duplicate component ids"
            for c in doc["components"]:
                for inp in c.get("input", []):
                    assert inp["from"] in ids, f"{c['id']} input from unknown {inp['from']}"
                for ctl in c.get("control", []):
                    assert ctl["from"] in ids, f"{c['id']} control from unknown {ctl['from']}"
            print(f"  OK   {pipe.name} ({len(ids)} components)")
        except Exception as e:  # noqa: BLE001
            print(f"  FAIL {pipe.name}: {e}")
            ok = False
    return ok


async def check_server() -> bool:
    print("\n[3/3] Connecting to RocketRide server ...")
    try:
        from rocketride import RocketRideClient
    except ImportError:
        print("  FAIL rocketride package not installed (pip install rocketride)")
        return False
    os.chdir(LAUNCHKIT_DIR)  # so the SDK picks up launchkit/.env
    try:
        async with RocketRideClient() as client:
            await client.ping()
            print("  OK   connected + ping")
            return True
    except Exception as e:  # noqa: BLE001
        print(f"  FAIL {e}")
        print("       → Is the RocketRide engine running? Open the RocketRide")
        print("         extension in VS Code (autoConnect starts the local engine).")
        return False


async def main() -> int:
    results = [check_env(), check_pipelines(), await check_server()]
    print("\n" + ("ALL CHECKS PASSED" if all(results) else "CHECKS FAILED — see above"))
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
