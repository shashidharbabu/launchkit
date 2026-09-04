"""Deterministic graders + judge rubrics for the 7 Launch Kit pipelines.

Every grader returns {"checks": {name: value}, "score": float, "failures": [str]}.
Checks are booleans or 0..1 fractions; score is their mean (booleans as 0/1).
Deterministic checks never trust model discipline — they re-verify the output
contract, platform conventions, and (where possible) reality: URLs fetched,
thread ids resolved, expected facts literally present.
"""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from pathlib import Path

LAUNCHKIT_DIR = Path(__file__).resolve().parent.parent.parent

# Marketing clichés no platform-native post should contain. Lowercase substrings.
GENERIC_PHRASES = [
    "game-changer", "game changer", "revolutioniz", "revolutionis",
    "excited to announce", "thrilled to announce", "proud to announce",
    "take your * to the next level", "next level", "unleash", "supercharge",
    "seamlessly integrat", "cutting-edge", "cutting edge", "state-of-the-art",
    "in today's fast-paced", "look no further", "unlock the power",
    "empower your", "elevate your", "transform the way", "say goodbye to",
    "the ultimate", "effortlessly", "10x your",
]

THREAD_PAT = re.compile(
    r"(news\.ycombinator\.com/item\?id=\d+"
    r"|reddit\.com/r/[^/]+/comments/"
    r"|github\.com/[^/]+/[^/]+/(issues|discussions)/\d+"
    r"|stackoverflow\.com/questions/\d+)"
)


def _txt(v) -> str:
    return json.dumps(v, ensure_ascii=False, default=str).lower()


def _strings(v, out=None) -> list[str]:
    """All string leaves of a JSON value."""
    if out is None:
        out = []
    if isinstance(v, str):
        out.append(v)
    elif isinstance(v, dict):
        for x in v.values():
            _strings(x, out)
    elif isinstance(v, list):
        for x in v:
            _strings(x, out)
    return out


def _words(s: str) -> int:
    return len(s.split())


def _nonempty(d: dict, key: str) -> bool:
    v = d.get(key)
    if v is None:
        return False
    if isinstance(v, (list, dict, str)):
        return len(v) > 0
    return True


def _finish(checks: dict, failures: list[str]) -> dict:
    vals = [float(v) for v in checks.values() if isinstance(v, (bool, int, float))]
    score = round(sum(vals) / len(vals), 3) if vals else 0.0
    return {"checks": checks, "score": score, "failures": failures}


def generic_phrase_hits(data) -> list[str]:
    hay = " ".join(_strings(data)).lower()
    hits = []
    for p in GENERIC_PHRASES:
        if "*" in p:
            a, b = p.split("*")
            if re.search(re.escape(a.strip()) + r"\s+\w+(\s+\w+)?\s+" + re.escape(b.strip()), hay):
                hits.append(p)
        elif p in hay:
            hits.append(p)
    return hits


def fetch_status(url: str, timeout: int = 8) -> int | None:
    """HTTP status for a URL (GET, browser-ish UA). None on network failure."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) launchkit-eval/1.0",
        "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return None


def _github_token() -> str:
    try:
        for line in (LAUNCHKIT_DIR / ".env").read_text().splitlines():
            if line.strip().startswith("ROCKETRIDE_GITHUB_TOKEN="):
                return line.split("=", 1)[1].strip()
    except OSError:
        pass
    return ""


def verify_thread(url: str) -> str:
    """'verified' | 'fabricated' | 'unverified' for a claimed thread URL."""
    m = re.search(r"news\.ycombinator\.com/item\?id=(\d+)", url)
    if m:
        s = fetch_status(f"https://hn.algolia.com/api/v1/items/{m.group(1)}")
        return "verified" if s == 200 else "fabricated" if s == 404 else "unverified"
    m = re.search(r"github\.com/([^/]+)/([^/]+)/(?:issues|discussions)/(\d+)", url)
    if m:
        api = f"https://api.github.com/repos/{m.group(1)}/{m.group(2)}/issues/{m.group(3)}"
        req = urllib.request.Request(api, headers={"User-Agent": "launchkit-eval/1.0"})
        tok = _github_token()
        if tok:
            req.add_header("Authorization", f"Bearer {tok}")
        try:
            with urllib.request.urlopen(req, timeout=8) as r:
                return "verified" if r.status == 200 else "unverified"
        except urllib.error.HTTPError as e:
            return "fabricated" if e.code == 404 else "unverified"
        except Exception:
            return "unverified"
    s = fetch_status(url)
    return "verified" if s == 200 else "fabricated" if s == 404 else "unverified"


# ---------------------------------------------------------------- understand

UNDERSTAND_KEYS = ["one_liner", "description", "category", "icp", "target_user",
                   "differentiators", "proof_points", "voice", "gaps",
                   "confidence", "sources_read"]


def grade_understand(case: dict, out: dict) -> dict:
    checks, fails = {}, []
    missing = [k for k in UNDERSTAND_KEYS if not _nonempty(out, k)]
    checks["schema_complete"] = round(1 - len(missing) / len(UNDERSTAND_KEYS), 3)
    if missing:
        fails.append(f"missing/empty keys: {missing}")

    icp = out.get("icp") or {}
    checks["icp_has_pain"] = isinstance(icp, dict) and bool(str(icp.get("pain") or "").strip())
    # the live contract nests current_alternatives inside icp (top-level also accepted)
    alts = (icp.get("current_alternatives") if isinstance(icp, dict) else None) \
        or out.get("current_alternatives")
    checks["has_alternatives"] = bool(alts)

    exp = case.get("expect", {})
    hay = _txt(out)
    mm = exp.get("must_mention", [])
    hit = [m for m in mm if m.lower() in hay]
    checks["must_mention"] = round(len(hit) / len(mm), 3) if mm else 1.0
    if mm and len(hit) < len(mm):
        fails.append(f"missing evidence strings: {sorted(set(mm) - set(hit))}")

    if "category_hint" in exp:
        checks["category_match"] = exp["category_hint"].lower() in hay

    degraded = bool(out.get("analysis_degraded"))
    if "degraded_expected" in exp:
        checks["degraded_flag_correct"] = degraded == bool(exp["degraded_expected"])
        if not checks["degraded_flag_correct"]:
            fails.append(f"analysis_degraded={degraded}, expected {exp['degraded_expected']}")

    conf = (out.get("confidence") or {})
    overall = conf.get("overall") if isinstance(conf, dict) else None
    checks["confidence_sane"] = isinstance(overall, (int, float)) and 0 <= overall <= 1
    if degraded and isinstance(overall, (int, float)):
        checks["degraded_confidence_capped"] = overall <= 0.9

    srcs = out.get("sources_read") or []
    checks["sources_have_status"] = (
        isinstance(srcs, list) and len(srcs) > 0
        and all(isinstance(s, dict) and "ok" in s for s in srcs)
    )
    return _finish(checks, fails)


# ---------------------------------------------------------------- brand

DNA_KEYS = ["brand_name", "colors", "typography", "voice", "value_props", "sources_read"]
COLOR_PAT = re.compile(r"^(#[0-9a-fA-F]{3,8}|rgb|hsl|oklch)")


def grade_brand_dna(case: dict, out: dict) -> dict:
    checks, fails = {}, []
    # the pipe nests visual identity for the UI; accept both flat + nested
    visual = out.get("visual") if isinstance(out.get("visual"), dict) else {}
    colors = out.get("colors") or visual.get("colors") or []
    typography = out.get("typography") or visual.get("typography") or {}

    present = sum(1 for k in DNA_KEYS
                  if _nonempty(out, k) or (k == "colors" and colors) or (k == "typography" and typography))
    checks["schema_complete"] = round(present / len(DNA_KEYS), 3)

    if colors:
        vals = [c.get("value") if isinstance(c, dict) else c for c in colors]
        ok = [v for v in vals if isinstance(v, str) and COLOR_PAT.match(v.strip())]
        checks["colors_parseable"] = round(len(ok) / len(vals), 3)
        if len(ok) < len(vals):
            fails.append(f"unparseable color values: {[v for v in vals if v not in ok]}")

    exp = case.get("expect", {})
    if exp.get("brand_name"):
        checks["brand_name_match"] = exp["brand_name"].lower() in str(out.get("brand_name", "")).lower()
        if not checks["brand_name_match"]:
            fails.append(f"brand_name {out.get('brand_name')!r} != expected {exp['brand_name']!r}")
    checks["has_sources"] = _nonempty(out, "sources_read")

    voice = out.get("voice") or {}
    checks["voice_has_tone_words"] = isinstance(voice, dict) and _nonempty(voice, "tone_words")
    return _finish(checks, fails)


def grade_brand_campaigns(case: dict, out: dict) -> dict:
    checks, fails = {}, []
    camps = out.get("campaigns") or []
    n_min = case.get("expect", {}).get("min_campaigns", 4)
    checks["count_ok"] = len(camps) >= n_min
    if not checks["count_ok"]:
        fails.append(f"{len(camps)} campaigns < {n_min}")
    if camps:
        def complete(c):
            sc = c.get("sample_copy") or {}
            return all([c.get("name"), c.get("big_idea"), c.get("channels"),
                        sc.get("headline"), sc.get("body")])
        checks["campaigns_complete"] = round(sum(1 for c in camps if complete(c)) / len(camps), 3)
        names = [str(c.get("name", "")).lower() for c in camps]
        checks["names_distinct"] = len(set(names)) == len(names)
    hits = generic_phrase_hits(camps)
    checks["cliche_free"] = len(hits) == 0
    if hits:
        fails.append(f"cliches: {hits}")
    return _finish(checks, fails)


# ---------------------------------------------------------------- commercial

LISTING_KEYS = ["title", "tagline", "description_short", "description_long",
                "keywords", "screenshot_order", "faq", "cta", "confidence"]


def grade_pricing(case: dict, out: dict) -> dict:
    checks, fails = {}, []
    comps = out.get("competitors") or []
    established = [c for c in comps if c.get("notability") == "established"]
    n_min = case.get("expect", {}).get("min_established_competitors", 3)
    checks["min_established"] = len(established) >= n_min
    if not checks["min_established"]:
        fails.append(f"{len(established)} established competitors < {n_min}")

    if comps:
        with_tiers = [c for c in comps if isinstance(c.get("tiers"), list) and c["tiers"]]
        checks["competitors_have_tiers"] = round(len(with_tiers) / len(comps), 3)
        with_src = [c for c in comps if c.get("source_url") or c.get("url")]
        checks["competitors_have_source"] = round(len(with_src) / len(comps), 3)

    rec = out.get("recommendation") or {}
    checks["rec_has_tiers"] = isinstance(rec, dict) and _nonempty(rec, "tiers")
    checks["rec_has_rationale"] = isinstance(rec, dict) and bool(str(rec.get("rationale") or "").strip())
    checks["rejected_visible"] = isinstance(out.get("rejected"), list)

    plaus = case.get("expect", {}).get("plausible_competitors", [])
    if plaus:
        hay = _txt(comps)
        checks["plausible_recall"] = round(
            sum(1 for p in plaus if p.lower() in hay) / len(plaus), 3)
    conf = out.get("confidence")
    checks["confidence_sane"] = isinstance(conf, (int, float)) and 0 <= conf <= 1
    return _finish(checks, fails)


def grade_listing(case: dict, out: dict) -> dict:
    checks, fails = {}, []
    missing = [k for k in LISTING_KEYS if not _nonempty(out, k)]
    checks["schema_complete"] = round(1 - len(missing) / len(LISTING_KEYS), 3)
    if missing:
        fails.append(f"missing keys: {missing}")
    checks["tagline_len"] = len(str(out.get("tagline", ""))) <= 120
    kw = out.get("keywords") or []
    checks["keywords_count"] = 5 <= len(kw) <= 20
    faq = out.get("faq") or []
    checks["faq_shape"] = (
        len(faq) >= 3 and all(isinstance(f, dict) and f.get("q") and f.get("a") for f in faq)
    )
    hits = generic_phrase_hits(out)
    checks["cliche_free"] = len(hits) == 0
    if hits:
        fails.append(f"cliches: {hits}")
    return _finish(checks, fails)


# ---------------------------------------------------------------- targets

TARGET_ROW_KEYS = ["name", "kind", "url", "why_fit"]


def grade_targets(case: dict, out: dict, check_urls: bool = True) -> dict:
    checks, fails = {}, []
    targets = out.get("targets") or []
    exp = case.get("expect", {})
    checks["min_targets"] = len(targets) >= exp.get("min_targets", 8)
    if not checks["min_targets"]:
        fails.append(f"only {len(targets)} targets")

    if targets:
        complete = [t for t in targets if all(_nonempty(t, k) for k in TARGET_ROW_KEYS)]
        checks["rows_complete"] = round(len(complete) / len(targets), 3)
        urls = [str(t.get("url", "")).strip() for t in targets if t.get("url")]
        checks["urls_unique"] = len(set(urls)) == len(urls)
        kinds = {str(t.get("kind", "")).lower() for t in targets}
        checks["kind_diversity"] = len(kinds) >= 3
        with_rules = [t for t in targets if t.get("rules_summary")]
        checks["rules_coverage"] = round(len(with_rules) / len(targets), 3)

        if check_urls:
            sample = urls[:12]
            statuses = [fetch_status(u) for u in sample]
            dead = [u for u, s in zip(sample, statuses) if s == 404]
            reachable = [u for u, s in zip(sample, statuses) if s is not None and s != 404]
            checks["urls_alive"] = round(len(reachable) / len(sample), 3) if sample else 0.0
            if dead:
                fails.append(f"404 venue urls: {dead}")

    plaus = exp.get("plausible_venues", [])
    if plaus:
        hay = _txt(targets)
        got = [p for p in plaus if p.lower() in hay]
        checks["plausible_recall"] = round(len(got) / len(plaus), 3)
        if len(got) < len(plaus):
            fails.append(f"expected venues absent: {sorted(set(plaus) - set(got))}")
    checks["has_sequencing"] = _nonempty(out, "sequencing_advice")
    return _finish(checks, fails)


# ---------------------------------------------------------------- assets

def _hashtags(s: str) -> int:
    return len(re.findall(r"(?<!\S)#\w+", s))


def grade_asset(case: dict, out: dict, gate_result: dict | None = None) -> dict:
    """asset-type-specific convention checks, mirroring lk_assets.pipe contracts."""
    checks, fails = {}, []
    at = case["asset_type"]
    hits = generic_phrase_hits(out)
    checks["cliche_free"] = len(hits) == 0
    if hits:
        fails.append(f"cliches: {hits}")

    profile = case.get("_profile") or {}
    proofs = [str(p) for p in (profile.get("proof_points") or [])]
    diffs = [str(d) for d in (profile.get("differentiators") or [])]
    hay = " ".join(_strings(out)).lower()

    def any_fact_used(facts: list[str]) -> bool:
        for f in facts:
            sig = [w for w in re.findall(r"[a-z0-9][a-z0-9.,%+]{3,}", f.lower())
                   if w not in ("with", "that", "from", "this", "your", "have", "https")]
            if sig and sum(1 for w in sig if w in hay) >= max(1, len(sig) // 3):
                return True
        return False

    if proofs or diffs:
        checks["uses_concrete_fact"] = any_fact_used(proofs) or any_fact_used(diffs)
        if not checks["uses_concrete_fact"]:
            fails.append("no profile proof point / differentiator detectably used")

    if gate_result is not None:
        checks["gate_asset_pass"] = not gate_result.get("_gate_violations")

    if at == "x_post":
        post = str(out.get("post", ""))
        checks["len_280"] = 0 < len(post) <= 280
        checks["has_link_placeholder"] = "{APP_URL}" in post or "{app_url}" in post.lower()
        checks["hashtags_max2"] = _hashtags(post) <= 2
        checks["has_variants"] = len(out.get("alt_variants") or []) >= 2
    elif at == "linkedin_post":
        post = str(out.get("post", ""))
        w = _words(post)
        checks["word_range"] = 90 <= w <= 260
        checks["hashtags_max3"] = _hashtags(post) <= 3
        checks["has_alt_hook"] = bool(str(out.get("alt_hook") or "").strip())
    elif at == "reddit_post":
        title, body = str(out.get("title", "")), str(out.get("body", ""))
        checks["no_show_hn_title"] = not title.lower().startswith("show hn")
        checks["no_emoji_title"] = not re.search(r"[\U0001F300-\U0001FAFF]", title)
        w = _words(body)
        checks["body_word_range"] = 120 <= w <= 400
        checks["discloses_builder"] = bool(re.search(
            r"\bi built|\bi made|\bi'm the (builder|maker|dev|founder)|\bmy (app|tool|project)", body.lower()))
        checks["single_link"] = body.count("{APP_URL}") <= 1
    elif at == "producthunt":
        checks["tagline_60"] = 0 < len(str(out.get("tagline", ""))) <= 60
        checks["description_260"] = 0 < len(str(out.get("description", ""))) <= 260
        w = _words(str(out.get("first_comment", "")))
        checks["first_comment_range"] = 120 <= w <= 320
        checks["topics_count"] = 2 <= len(out.get("topics") or []) <= 5
    elif at == "show_hn":
        title, body = str(out.get("title", "")), str(out.get("body", ""))
        checks["title_prefix"] = title.startswith("Show HN:")
        w = _words(body)
        checks["body_word_range"] = 80 <= w <= 260
        checks["mentions_limitations"] = bool(re.search(
            r"limitation|doesn'?t (yet|support)|not (yet|support)|known issue|rough edge|caveat|only works|missing",
            body.lower()))
    elif at == "newsletter_pitch":
        checks["has_subject"] = bool(str(out.get("subject") or "").strip())
        w = _words(str(out.get("pitch", "")))
        checks["pitch_word_range"] = 70 <= w <= 220
    elif at == "video_script":
        dur = out.get("duration_seconds")
        checks["duration_range"] = isinstance(dur, (int, float)) and 20 <= dur <= 90
        scenes = out.get("scenes") or []
        checks["has_scenes"] = len(scenes) >= 3
        if scenes:
            checks["scenes_complete"] = round(sum(
                1 for s in scenes
                if isinstance(s, dict) and s.get("visual") and s.get("voiceover")) / len(scenes), 3)
        checks["has_cta"] = bool(str(out.get("cta") or "").strip())
        checks["has_production_notes"] = len(out.get("production_notes") or []) > 0
    return _finish(checks, fails)


# ---------------------------------------------------------------- signals

def grade_signals(case: dict, out: dict, kept: list, rejected: list) -> dict:
    checks, fails = {}, []
    signals = out.get("signals") or []
    queries = out.get("search_queries_used") or []
    checks["multi_pass_search"] = len(queries) >= 4
    if not checks["multi_pass_search"]:
        fails.append(f"only {len(queries)} search queries used (finder budget is 14)")
    checks["has_coverage_notes"] = _nonempty(out, "coverage_notes")

    if signals:
        threadlike = [s for s in signals if THREAD_PAT.search(str(s.get("url", "")))]
        checks["urls_are_threads"] = round(len(threadlike) / len(signals), 3)
        verdicts = {"verified": 0, "fabricated": 0, "unverified": 0}
        for s in signals[:10]:
            verdicts[verify_thread(str(s.get("url", "")))] += 1
        n = sum(verdicts.values())
        checks["fabrication_free"] = verdicts["fabricated"] == 0
        checks["thread_verified_frac"] = round(verdicts["verified"] / n, 3) if n else 0.0
        if verdicts["fabricated"]:
            fails.append(f"{verdicts['fabricated']} fabricated thread urls")
        with_reply = [s for s in signals if str(s.get("drafted_reply") or "").strip()]
        checks["replies_drafted"] = round(len(with_reply) / len(signals), 3)
        checks["rescore_annotated"] = all("rescore" in s for s in kept) if kept else True
    else:
        # honest-empty is a pass IF the finder demonstrably searched
        checks["honest_empty"] = len(queries) >= 4 and _nonempty(out, "coverage_notes")

    checks["kept_after_rescore"] = len(kept)      # informational, excluded from score
    checks["rejected_after_rescore"] = len(rejected)
    info = {k: checks.pop(k) for k in ("kept_after_rescore", "rejected_after_rescore")}
    res = _finish(checks, fails)
    res["checks"].update(info)
    return res


def grade_rescore(case: dict, kept: list, rejected: list) -> dict:
    """Ground-truth comparison for a single labeled signal.

    Three-way outcome: the judge said relevant, said rejected, or never got to
    judge (thread fetch failed → kept as 'unverified'). Unverified is scored
    separately — it is a fetch-coverage weakness, not a judgment error.
    """
    fails = []
    label = case["label"]  # relevant | irrelevant
    items = kept + rejected
    verdict = (items[0].get("rescore") or {}).get("verdict") if items else None
    outcome = verdict or ("relevant" if kept else "rejected")
    scored = outcome in ("relevant", "rejected")
    correct = (outcome == "relevant") == (label == "relevant") if scored else False
    if scored and not correct:
        fails.append(f"label={label} but judge said {outcome}")
    if not scored:
        fails.append(f"thread unfetchable → outcome {outcome}; judge never ran")
    res = _finish({"correct": correct} if scored else {"fetchable": False}, fails)
    res["checks"].update(_predicted=outcome, _label=label, _scored=scored)
    return res


# ---------------------------------------------------------------- judge rubrics

def judge_spec(pipe: str, case: dict, out, extra: dict | None = None):
    """(system, payload, fields) for the LLM judge, per pipeline."""
    profile = case.get("_profile")
    base = ("You are a rigorous evaluator for a go-to-market tool that drafts launch "
            "materials for software builders. Score strictly: 1.0 is rare, reserve "
            ">0.8 for genuinely excellent output. Judge ONLY what is in front of you; "
            "penalize vagueness, invented facts, and anything a real community "
            "moderator or buyer would smell as marketing filler.")
    if pipe == "understand":
        return (
            base + " You are judging an app PROFILE extracted from a repo/site.",
            {"known_facts_from_site": case.get("expect", {}).get("must_mention", []),
             "site_url": case.get("site_url"), "profile": out},
            {"specificity": "concrete, checkable claims vs vague filler",
             "internal_consistency": "one_liner/icp/differentiators/alternatives tell one coherent story",
             "icp_quality": "ICP is a specific person with a real pain, not 'everyone'",
             "alternatives_real": "current_alternatives name real, relevant products (not categories or inventions)"},
        )
    if pipe == "brand_dna":
        return (
            base + " You are judging a brand-DNA extraction that must be evidence-only.",
            {"site_url": case.get("site_url"), "brand_dna": out},
            {"evidence_grounded": "claims read as observed (quotes, named pages) rather than invented",
             "voice_specificity": "tone/vocabulary is distinctive to THIS brand, not generic-startup",
             "usability": "a copywriter could write on-brand copy from this alone"},
        )
    if pipe == "brand_campaigns":
        return (
            base + " You are judging launch campaign concepts for a solo builder.",
            {"profile": profile, "campaigns": out},
            {"on_icp": "each campaign targets the profile's ICP and pain",
             "concreteness": "a builder could execute each next week without a strategist",
             "diversity": "campaigns are genuinely different plays, not one idea re-worded",
             "sample_copy_quality": "sample copy is publishable, specific, cliche-free"},
        )
    if pipe == "pricing":
        return (
            base + " You are judging competitor research + a pricing recommendation.",
            {"profile": profile, "pricing": out},
            {"competitor_relevance": "named competitors genuinely compete with this app for this ICP",
             "competitor_real": "these are real, known products (name any you believe are not real in notes)",
             "tier_sanity": "recommended tiers/prices are sane vs the competitor evidence shown",
             "rationale_quality": "rationale reasons from the evidence, states risks honestly"},
        )
    if pipe == "listing":
        return (
            base + " You are judging an app-store listing rewrite.",
            {"profile": profile, "listing": out},
            {"specificity": "uses the profile's real differentiators/proof, not filler",
             "honesty": "no claims beyond what the profile supports",
             "conversion_craft": "title/tagline/short description would make the ICP click",
             "faq_usefulness": "FAQ answers real objections for this product"},
        )
    if pipe == "targets":
        return (
            base + " You are judging a ranked list of launch venues.",
            {"profile": profile, "targets": out.get("targets", [])[:12],
             "sequencing_advice": out.get("sequencing_advice")},
            {"relevance": "top venues are where THIS app's ICP actually is",
             "why_fit_quality": "why_fit is specific to app+venue, not boilerplate",
             "rules_accuracy": "rules summaries are plausible and actionable",
             "ranking_sanity": "ordering reflects impact-for-effort for a solo builder"},
        )
    if pipe == "assets":
        return (
            base + f" You are judging a {case['asset_type']} launch post. Judge as the most "
                   "cynical member of that platform: would this get engagement, or get flagged "
                   "as self-promo slop?",
            {"asset_type": case["asset_type"], "profile": profile,
             "brand_dna": case.get("_dna"), "target": case.get("target"), "asset": out},
            {"platform_native": "reads like the platform's own culture wrote it",
             "specificity": "concrete facts from the profile, zero filler sentences",
             "voice_match": "matches the profile/brand voice (or plausible builder voice)",
             "hook_strength": "first line would stop the ICP mid-scroll",
             "survives_moderation": "a moderator would leave it up"},
        )
    if pipe == "signals":
        return (
            base + " You are judging intent signals: threads claimed to show people asking "
                   "for what this app does.",
            {"profile": profile, "signals": (out.get("signals") or [])[:8],
             "queries": out.get("search_queries_used")},
            {"intent_match": "each thread's quote genuinely expresses the pain this app solves",
             "reply_quality": "drafted replies help first, mention the tool honestly, no spam",
             "query_quality": "search queries mine the ICP's own phrasings from multiple angles"},
        )
    raise ValueError(f"no judge spec for {pipe}")
