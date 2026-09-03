"""RocketRide pipeline service: one persistent client, one runner per stage.

Wraps the patterns proven in the test harnesses:
- fresh Question per request via client.chat()
- loose JSON parsing (models sometimes emit Python-dict style)
- deterministic quality gates on agent output
"""

import asyncio
import json
import re
import time
from pathlib import Path

LAUNCHKIT_DIR = Path(__file__).resolve().parent.parent.parent
PIPELINES_DIR = LAUNCHKIT_DIR / "pipelines"

_client = None
_client_lock: asyncio.Lock | None = None
_tokens: dict = {}   # pipe filename -> running task token


async def get_client():
    """Lazily create and connect the shared RocketRide client. A long-idle
    backend can outlive its websocket — verify liveness and rebuild the
    client when the transport is gone (observed: dead client raises
    "'NoneType' object has no attribute 'is_connected'")."""
    global _client, _client_lock
    if _client_lock is None:
        _client_lock = asyncio.Lock()
    async with _client_lock:
        if _client is not None:
            try:
                if _client.is_connected():
                    return _client
                await _client.connect()          # try resurrecting transport
                return _client
            except Exception:  # noqa: BLE001 — rebuild from scratch below
                try:
                    await _client.disconnect()
                except Exception:  # noqa: BLE001
                    pass
                _client = None
                _tokens.clear()
        import os
        os.chdir(LAUNCHKIT_DIR)  # SDK reads launchkit/.env
        from rocketride import RocketRideClient
        client = RocketRideClient(persist=True)
        # SDK 1.3.0 bug: connection.py's reconnect path calls
        # self._debug_message, which is never set on the client (dap_base
        # keeps it as a local). One transport drop then raises AttributeError
        # and poisons every later call. Alias it so reconnect logs instead of
        # crashing. Report upstream; remove when fixed.
        if not hasattr(client, "_debug_message"):
            client._debug_message = client.debug_message
        await client.connect()
        _client = client
        return _client


async def _reset_client():
    """Drop the shared client so the next call rebuilds it."""
    global _client
    try:
        if _client is not None:
            await _client.disconnect()
    except Exception:  # noqa: BLE001
        pass
    _client = None
    _tokens.clear()


async def shutdown():
    global _client
    if _client is not None:
        try:
            await _client.disconnect()
        finally:
            _client = None


async def _pipe_token(client, pipe_name: str) -> str:
    """Start (or reuse) the pipeline and cache its token."""
    if pipe_name in _tokens:
        return _tokens[pipe_name]
    result = await client.use(filepath=str(PIPELINES_DIR / pipe_name),
                              use_existing=True)
    _tokens[pipe_name] = result["token"]
    return result["token"]


async def restart_pipe(pipe_name: str) -> str:
    """Force-restart a pipeline (picks up edited .pipe configs)."""
    client = await get_client()
    doc = json.loads((PIPELINES_DIR / pipe_name).read_text())
    source_id = next(c["id"] for c in doc["components"]
                     if c["provider"] in ("chat", "webhook", "dropper"))
    try:
        old = await client.get_task_token(doc["project_id"], source_id)
        if old:
            await client.terminate(old)
    except Exception:  # noqa: BLE001
        pass
    _tokens.pop(pipe_name, None)
    return await _pipe_token(client, pipe_name)


def extract_answer(response: dict):
    result_types = response.get("result_types", {}) or {}
    keys = [k for k, lane in result_types.items() if lane == "answers"]
    keys.append("answers")
    for key in keys:
        answers = response.get(key)
        if answers:
            return answers[0]
    return None


def parse_json_loose(raw):
    if isinstance(raw, (dict, list)):
        return raw
    text = str(raw).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"no JSON object in answer: {text[:300]!r}")
    blob = text[start:end + 1]
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        import ast
        return ast.literal_eval(blob)


async def _ask_once(pipe_name: str, question_text: str) -> dict:
    """Run one request through a pipeline, return parsed JSON.
    Retries once on transport-level failures (rebuild the client) and once on a
    stale pipe token (re-register the pipeline)."""
    from rocketride.schema import Question
    response = None
    for attempt in (1, 2):
        try:
            client = await get_client()
            token = await _pipe_token(client, pipe_name)
            q = Question(expectJson=True)
            q.addQuestion(question_text)
            response = await client.chat(token=token, question=q)
            break
        except Exception as e:  # noqa: BLE001
            msg = str(e).lower()
            # A dead websocket surfaces as an AttributeError on whichever
            # attribute the SDK reaches for first — observed as both
            # 'is_connected' and 'disconnect' on NoneType. Treat every
            # NoneType-attribute error as transport death: the recovery
            # (rebuild the client) is safe even when the guess is wrong.
            transportish = any(t in msg for t in
                               ("is_connected", "disconnect", "nonetype",
                                "connection", "websocket", "timed out",
                                "closed"))
            # The engine can terminate a pipeline task under us (idle reaping,
            # a redeploy, an admin restart). _tokens still holds the dead
            # token, so EVERY later run fails with "your pipeline is not
            # running" until someone hits /admin/restart-pipe by hand. Drop the
            # cached token and let _pipe_token re-register it instead.
            stale_pipe = any(t in msg for t in
                             ("pipeline is not running", "not running",
                              "close pipe with id", "invalid token",
                              "unknown token"))
            if attempt == 1 and stale_pipe:
                # Popping the cache alone is not enough: use_existing=True can
                # hand back the same dead task. Terminate it first, exactly as
                # /admin/restart-pipe does, then re-register.
                try:
                    await restart_pipe(pipe_name)
                except Exception:  # noqa: BLE001 — fall through to the raise below
                    pass
                continue
            if attempt == 1 and transportish:
                await _reset_client()
                continue
            raise
    raw = extract_answer(response)
    if raw is None:
        raise RuntimeError("pipeline returned no answers")
    # Engine-side failures come back as ANSWER TEXT, not as a raised error, and
    # that text carries no JSON — so this must be checked BEFORE parsing.
    # Parsing first made this branch dead code: parse_json_loose raised
    # ValueError("no JSON object in answer: 'LLM error: ...'"), which ask()'s
    # RuntimeError-only retry could not see, so nothing was ever retried.
    if isinstance(raw, str) and raw.strip().startswith("LLM error"):
        raise RuntimeError(raw)
    parsed = parse_json_loose(raw)
    if isinstance(parsed, dict) and any(
            str(v).startswith("LLM error") for v in parsed.values() if isinstance(v, str)):
        raise RuntimeError(f"LLM error in pipeline response: {parsed}")
    return parsed


async def ask(pipe_name: str, question_text: str) -> dict:
    """_ask_once plus bounded retries on agent-loop flakiness: long agent runs
    die engine-side with 'LLM error: ...' (observed 2026-08-11 on lk_signals,
    2026-08-13 on lk_commercial pricing).

    Failure probability scales with the number of LLM round-trips, and a single
    failed round-trip kills the whole job — measured on 2026-08-13, pricing
    (~15-20 round-trips: one per tool call) succeeded 1 run in 3, while listing
    (~2 round-trips, same pipeline) succeeded 3 in 3. One retry is therefore not
    enough for tool-heavy stages; three bounded attempts take pricing from ~33%
    to ~70% per job. ValueError is caught too in case the engine's error text
    ever arrives wrapped in braces and reaches the parser."""
    last: Exception | None = None
    for attempt in (1, 2, 3):
        try:
            return await _ask_once(pipe_name, question_text)
        except (RuntimeError, ValueError) as e:
            if "LLM error" not in str(e):
                raise
            last = e
            if attempt < 3:
                await asyncio.sleep(2 * attempt)
    raise last


# ---------------- stage runners ----------------

async def run_understand(repo_url: str, site_url: str, feedback: str = "") -> dict:
    """repo_url may be empty — site-only analysis is a supported path (public
    repos only; private/absent repos degrade gracefully rather than failing)."""
    repo_line = (f"Repository URL: {repo_url}" if repo_url else
                 "Repository URL: NONE SUPPLIED — analyse from the live site "
                 "alone and set analysis_degraded true.")
    q = (f"Produce the app profile for this app.\n{repo_line}\n"
         f"Live product URL: {site_url}")
    if feedback:
        q += ("\nBUILDER_FEEDBACK (the app's builder reviewed a previous draft "
              f"and asks you to incorporate this): {feedback}")
    return await ask("lk_understand.pipe", q)


async def run_commercial(task: str, profile: dict, current_listing: str = "") -> dict:
    parts = [f"TASK: {task}", f"APP_PROFILE: {json.dumps(profile)}"]
    if current_listing:
        parts.append(f"CURRENT_LISTING: {current_listing}")
    return await ask("lk_commercial.pipe", "\n".join(parts))


async def run_targets(profile: dict, curated_venues: list | None = None) -> dict:
    parts = [f"APP_PROFILE: {json.dumps(profile)}"]
    if curated_venues:
        parts.append(f"CURATED_VENUES: {json.dumps(curated_venues)}")
    return await ask("lk_targets.pipe", "\n".join(parts))


async def run_brand(task: str, profile: dict, site_url: str = "",
                    dna: dict | None = None, feedback: str = "") -> dict:
    """task: 'dna' (scrape SITE_URL → Business DNA) or 'campaigns' (DNA +
    profile → campaign concepts). Mirrors the Pomelli flow: extract brand
    identity once, then generate everything else on-brand."""
    parts = [f"TASK: {task}", f"APP_PROFILE: {json.dumps(profile)}"]
    if site_url:
        parts.append(f"SITE_URL: {site_url}")
    if dna:
        parts.append(f"BRAND_DNA: {json.dumps(dna)}")
    if feedback:
        parts.append("BUILDER_FEEDBACK (the builder reviewed a previous draft "
                     f"and asks for these changes): {feedback}")
    return await ask("lk_brand.pipe", "\n".join(parts))


async def run_asset(asset_type: str, profile: dict, target: dict | None = None,
                    tone: str = "", feedback: str = "",
                    brand_dna: dict | None = None) -> dict:
    parts = [f"ASSET_TYPE: {asset_type}", f"APP_PROFILE: {json.dumps(profile)}"]
    if brand_dna:
        parts.append(f"BRAND_DNA: {json.dumps(brand_dna)}")
    if target:
        parts.append(f"TARGET: {json.dumps(target)}")
    if tone:
        parts.append(f"TONE: {tone}")
    if feedback:
        parts.append("BUILDER_FEEDBACK (the builder reviewed a previous draft "
                     f"of this asset and asks for these changes): {feedback}")
    return await ask("lk_assets.pipe", "\n".join(parts))


# Generic dev communities used when a project has no ranked targets yet —
# recall fallback so community-scoped passes always have somewhere to look.
SIGNAL_FALLBACK_COMMUNITIES = ["opensource", "SideProject", "selfhosted",
                               "webdev", "devtools", "programming"]


def build_signals_question(profile: dict, communities: list | None = None) -> str:
    """Signals payload contract: APP_PROFILE + ICP_PAIN (surfaced so the finder
    mines problem phrasings from it) + COMMUNITIES (for site-scoped passes).
    Shared with the test harness so both exercise the same contract."""
    parts = [f"APP_PROFILE: {json.dumps(profile)}"]
    icp = profile.get("icp")
    pain = icp.get("pain") if isinstance(icp, dict) else None
    if pain:
        parts.append(f"ICP_PAIN: {pain}")
    parts.append(f"COMMUNITIES: {json.dumps(communities or SIGNAL_FALLBACK_COMMUNITIES)}")
    return "\n".join(parts)


async def run_signals(profile: dict, communities: list | None = None) -> dict:
    """One quirk beyond ask()'s retries: after an abnormal agent death the
    next run sometimes starts with NO tools bound (agent answers in seconds
    with empty search_queries_used). Detect that signature and retry once
    after a forced pipe restart (observed 2026-08-11, cloud engine)."""
    q = build_signals_question(profile, communities)
    result = await ask("lk_signals.pipe", q)
    if not result.get("search_queries_used") and not result.get("signals"):
        await restart_pipe("lk_signals.pipe")
        result = await ask("lk_signals.pipe", q)
    return result


# ---------------- signal re-scoring (quality gate 2: read the actual thread) ----------------

def _fetch_url_text(url: str) -> tuple[str, int | None]:
    """Blocking fetch of a thread's textual content. HN via Algolia items API
    (clean JSON); everything else a plain GET with tags crudely stripped.
    Returns (text, created_epoch) — created only known for HN items."""
    import re as _re
    import urllib.request

    m = _re.search(r"news\.ycombinator\.com/item\?id=(\d+)", url)
    so = _re.search(r"stackoverflow\.com/(?:questions|q)/(\d+)", url)
    created = None
    if m:
        api = f"https://hn.algolia.com/api/v1/items/{m.group(1)}"
        with urllib.request.urlopen(api, timeout=15) as r:
            item = json.load(r)
        created = item.get("created_at_i")
        parts = [item.get("title") or "", item.get("text") or ""]
        for child in (item.get("children") or [])[:10]:
            parts.append(child.get("text") or "")
        text = " ".join(parts)
    elif so:
        # raw stackoverflow.com GETs 403 from datacenter/residential IPs alike;
        # the StackExchange API serves the same content freely (300 req/day/IP)
        qid = so.group(1)
        base = "https://api.stackexchange.com/2.3"
        with urllib.request.urlopen(
                f"{base}/questions/{qid}?site=stackoverflow&filter=withbody", timeout=15) as r:
            q = json.load(r)
        items = q.get("items") or []
        parts = [items[0].get("title", ""), items[0].get("body", "")] if items else []
        try:
            with urllib.request.urlopen(
                    f"{base}/questions/{qid}/answers?site=stackoverflow&filter=withbody"
                    "&order=desc&sort=votes&pagesize=3", timeout=15) as r:
                for a in (json.load(r).get("items") or [])[:3]:
                    parts.append(a.get("body", ""))
        except Exception:  # noqa: BLE001 — answers are a bonus, the question suffices
            pass
        text = _re.sub(r"<[^>]+>", " ", " ".join(parts))
    else:
        req = urllib.request.Request(url, headers={"User-Agent": "LaunchKit/0.1 (+relevance-check)"})
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read(400_000).decode("utf-8", "ignore")
        raw = _re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", raw)
        text = _re.sub(r"<[^>]+>", " ", raw)
    return _re.sub(r"\s+", " ", text).strip()[:4000], created


HN_LOCK_SECONDS = 14 * 86400   # HN threads become read-only ~2 weeks after posting


async def rescore_signals(profile: dict, signals: list) -> tuple[list, list]:
    """Second-pass relevance check: fetch each candidate thread's REAL content
    and have a fast LLM-only pipeline judge whether this app answers this
    thread. Fixes the known finder-precision gap (~1/3 on niche apps).
    Fetch failures keep the signal, marked unverified — network flakiness must
    not silently empty the queue."""
    import asyncio

    kept, rejected = [], []
    summary = {k: profile.get(k)
               for k in ("one_liner", "description", "icp",
                         "differentiators", "proof_points", "voice") if k in profile}
    for s in signals:
        url = str(s.get("url", ""))
        try:
            text, created = await asyncio.to_thread(_fetch_url_text, url)
        except Exception as e:  # noqa: BLE001
            s["rescore"] = {"verdict": "unverified", "why": f"fetch failed: {e}"}
            kept.append(s)
            continue
        # replyability is the queue's whole point — enforce it in code, not
        # in the prompt: HN threads lock ~14 days after posting
        if created and "news.ycombinator.com" in url and \
                time.time() - created > HN_LOCK_SECONDS:
            s["rescore"] = {"verdict": "rejected",
                            "why": "HN thread locked (older than 14 days) — cannot reply"}
            rejected.append(s)
            continue
        try:
            verdict = await ask("lk_rescore.pipe", (
                "You are a strict relevance judge AND reply writer for launch outreach. "
                "Below is an APP and the ACTUAL CONTENT of a discussion thread. First "
                "decide if replying to this thread with this app is genuinely helpful "
                "to the thread's author — i.e. they are asking for, or struggling "
                "with, what this app does. Passing mentions of the topic do NOT count. "
                "IF AND ONLY IF relevant, also write the reply the builder should "
                "post. REPLY RULES: open by engaging the author's SPECIFIC situation — "
                "reference a concrete detail from the thread (their tool, error, "
                "constraint, or exact question); NEVER open with a canned phrase like "
                "'I built a tool for exactly this'. Genuinely help FIRST in 2-4 "
                "sentences — the reply must be worth upvoting even if they never "
                "click. Then, only if the app truly fits, one plain-words sentence "
                "disclosing you built it, mentioning it ONCE with {APP_URL}. Match "
                f"the norms of platform '{s.get('platform', 'forum')}' — Reddit and "
                "HN are hostile to marketing. Max 120 words. No emoji, no hype "
                "words, no bullet lists. Reply with ONLY RFC 8259 JSON: "
                "{\"relevant\": true|false, \"confidence\": number 0-1, "
                "\"why\": string (one sentence), \"reply\": string (\"\" when not relevant)}\n\n"
                f"APP: {json.dumps(summary)}\n\nTHREAD CONTENT: {text}"))
            s["rescore"] = {"verdict": "relevant" if verdict.get("relevant") else "rejected",
                            "confidence": verdict.get("confidence"),
                            "why": verdict.get("why")}
            if verdict.get("relevant") and str(verdict.get("reply") or "").strip():
                # the finder drafted from a search snippet; this reply read the thread
                s["drafted_reply"] = str(verdict["reply"]).strip()
            (kept if verdict.get("relevant") else rejected).append(s)
        except Exception as e:  # noqa: BLE001
            s["rescore"] = {"verdict": "unverified", "why": f"judge failed: {e}"}
            kept.append(s)
    for i, s in enumerate(kept, 1):
        s["rank"] = i
    return kept, rejected


# ---------------- quality gates (deterministic, code-enforced) ----------------

THREAD_PAT = re.compile(
    r"(reddit\.com/r/.+/comments/|news\.ycombinator\.com/item|"
    r"github\.com/.+/(discussions|issues)/|stackoverflow\.com/questions/|"
    r"/t/|/thread|forum)")


def gate_signals(signals: list, own_urls: list) -> tuple[list, list]:
    """Keep only real discussion threads; drop the app's own content."""
    domains = []
    for u in own_urls:
        m = re.search(r"https?://(?:www\.)?([^/]+)", str(u))
        if m:
            domains.append(m.group(1))
        seg = str(u).rstrip("/").rsplit("/", 1)[-1]
        if seg:
            domains.append(seg)
    kept, dropped = [], []
    for s in signals:
        url = str(s.get("url", ""))
        if not url.startswith("http"):
            dropped.append({"url": url, "reason": "not a url"})
        elif any(d and d in url for d in domains):
            dropped.append({"url": url, "reason": "app's own content"})
        elif not THREAD_PAT.search(url):
            dropped.append({"url": url, "reason": "not a discussion thread"})
        else:
            kept.append(s)
    for i, s in enumerate(kept, 1):
        s["rank"] = i
    return kept, dropped


ASSET_LIMITS = {"x_post": ("post", 280), "producthunt": ("tagline", 60)}


def gate_asset(asset_type: str, data: dict) -> dict:
    """Attach code-checked warnings the model can't be trusted to self-report."""
    warnings = list(data.get("warnings") or [])
    limit = ASSET_LIMITS.get(asset_type)
    if limit:
        field, max_len = limit
        if len(str(data.get(field, ""))) > max_len:
            warnings.append(f"{field} exceeds {max_len} chars — trim before publishing")
    if asset_type == "show_hn" and not str(data.get("title", "")).startswith("Show HN:"):
        warnings.append("title must start with 'Show HN:'")
    if asset_type == "reddit_post" and str(data.get("title", "")).startswith("Show HN"):
        warnings.append("title uses HN convention — rewrite for Reddit")
    data["warnings"] = warnings
    return data
