"""Full regression: run every Launch Kit pipeline e2e, in dependency order.

Usage (from launchkit/):
    .venv/bin/python backend/test_all.py
"""

import subprocess
import sys
import time
from pathlib import Path

LAUNCHKIT = Path(__file__).resolve().parent.parent
PY = str(LAUNCHKIT / ".venv" / "bin" / "python")

SUITE = [
    ("understand", [PY, "backend/test_understand.py"]),
    ("commercial", [PY, "backend/test_commercial.py", "both"]),
    ("targets", [PY, "backend/test_targets.py"]),
    ("assets", [PY, "backend/test_assets.py"]),
    ("signals", [PY, "backend/test_signals.py"]),
]


def main() -> int:
    results = {}
    for name, cmd in SUITE:
        t0 = time.time()
        print(f"\n{'=' * 20} {name} {'=' * 20}", flush=True)
        proc = subprocess.run(cmd, cwd=LAUNCHKIT)
        results[name] = (proc.returncode, time.time() - t0)
    print(f"\n{'=' * 20} SUMMARY {'=' * 20}")
    worst = 0
    for name, (rc, secs) in results.items():
        status = "PASS" if rc == 0 else ("WARN" if rc == 2 else "FAIL")
        print(f"{status:5} {name:12} rc={rc} {secs:.0f}s")
        worst = max(worst, rc)
    return worst


if __name__ == "__main__":
    sys.exit(main())
