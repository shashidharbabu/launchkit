"""LLM judge for the Launch Kit pipeline evals.

Uses the Anthropic API directly (NOT a RocketRide pipeline) so the judge is
independent of the engine being evaluated — a flaky agent loop must not grade
itself. Structured output via output_config json_schema guarantees parseable
verdicts.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import anthropic

LAUNCHKIT_DIR = Path(__file__).resolve().parent.parent.parent
JUDGE_MODEL = "claude-opus-5"

_client: anthropic.Anthropic | None = None


def _env(name: str) -> str:
    for line in (LAUNCHKIT_DIR / ".env").read_text().splitlines():
        line = line.strip()
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        key = _env("ROCKETRIDE_ANTHROPIC_KEY")
        if not key:
            raise RuntimeError("ROCKETRIDE_ANTHROPIC_KEY missing from launchkit/.env")
        _client = anthropic.Anthropic(api_key=key)
    return _client


def score_schema(fields: dict[str, str]) -> dict:
    """0..1 score per rubric dimension + free-text notes + failure flags."""
    # NB: the API's json_schema support rejects minimum/maximum on numbers —
    # the 0..1 range lives in the description and is clamped after parsing.
    props: dict = {
        k: {"type": "number", "description": f"{d} (score 0.0-1.0)"}
        for k, d in fields.items()
    }
    props["notes"] = {"type": "string", "description": "2-4 sentences: the decisive evidence for the scores"}
    props["flags"] = {
        "type": "array",
        "items": {"type": "string"},
        "description": "short slugs for concrete defects found, e.g. invented-metric, generic-hook",
    }
    return {
        "type": "object",
        "properties": props,
        "required": list(props),
        "additionalProperties": False,
    }


def judge(system: str, payload: dict, fields: dict[str, str], max_tokens: int = 2048) -> dict:
    """One judged verdict. Retries transient API failures; raises after 3."""
    last: Exception | None = None
    for attempt in range(3):
        try:
            resp = client().messages.create(
                model=JUDGE_MODEL,
                max_tokens=max_tokens,
                system=system,
                messages=[{
                    "role": "user",
                    "content": json.dumps(payload, ensure_ascii=False, default=str),
                }],
                output_config={"format": {"type": "json_schema", "schema": score_schema(fields)}},
            )
            if resp.stop_reason == "refusal":
                raise RuntimeError("judge refused")
            text = next(b.text for b in resp.content if b.type == "text")
            out = json.loads(text)
            for k, v in list(out.items()):
                if isinstance(v, (int, float)):
                    out[k] = min(1.0, max(0.0, float(v)))
            scores = [v for k, v in out.items() if isinstance(v, (int, float))]
            out["overall"] = round(sum(scores) / len(scores), 3) if scores else 0.0
            return out
        except (anthropic.RateLimitError, anthropic.APIStatusError,
                anthropic.APIConnectionError) as e:
            last = e
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"judge failed after 3 attempts: {last}")
