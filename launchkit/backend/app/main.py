"""Launch Kit backend — FastAPI orchestration over RocketRide pipelines.

The pipelines do the intelligence; this service does state, versioning, jobs,
and the three human gates:
  Gate 1: profile approval  (blocks all downstream stages)
  Gate 2: per-asset approval
  Gate 3: target selection
Run (from launchkit/):
    .venv/bin/uvicorn app.main:app --app-dir backend --port 8090
"""

import asyncio
import time

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import rr
from .db import (Asset, CommercialResult, Job, Profile, Project, Signal,
                 SessionLocal, StoreSignup, Target, Venue, dumps, init_db,
                 loads, utcnow)
from .mockstore import router as mockstore_router

app = FastAPI(title="Launch Kit API", version="0.1.0")
app.include_router(mockstore_router)
app.add_middleware(
    CORSMiddleware,
    # dev machine runs several Next apps; allow any localhost port
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()
    # Jobs only live in this process, so anything still queued/running at boot
    # died with the previous one. Left alone they poll forever in the UI.
    db = SessionLocal()
    try:
        stale = (db.query(Job)
                 .filter(Job.status.in_(("queued", "running"))).all())
        for job in stale:
            job.status = "error"
            job.error = "interrupted — backend restarted while this run was in flight"
            job.finished_at = utcnow()
        if stale:
            db.commit()
    finally:
        db.close()


@app.on_event("shutdown")
async def _shutdown() -> None:
    await rr.shutdown()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- schemas ----------------

class ProjectIn(BaseModel):
    name: str
    site_url: str
    repo_url: str = ""     # optional: public repos only; site-only analysis is supported
    app_url: str = ""
    autorun: bool = True   # kick off understand immediately — step 1 flows into step 2


class RunAssetIn(BaseModel):
    asset_type: str
    target_id: str | None = None
    tone: str = ""
    feedback: str = ""      # builder's notes when regenerating


class RunUnderstandIn(BaseModel):
    feedback: str = ""      # builder's notes when regenerating


class ProfileEditIn(BaseModel):
    data: dict


class AssetEditIn(BaseModel):
    data: dict


# ---------------- helpers ----------------

def _norm_url(raw: str, *, kind: str, required: bool) -> str:
    """Accept what builders actually type ('github.com/me/app', trailing spaces,
    a bare domain) and hand the pipelines something fetchable. Rejecting a
    typo'd URL here costs a second; letting it through costs a 2-minute run."""
    import re as _re
    url = str(raw or "").strip().strip("<>").rstrip("/")
    if not url:
        if required:
            raise HTTPException(422, f"{kind} URL is required")
        return ""
    if not _re.match(r"^https?://", url, _re.I):
        url = "https://" + url
    m = _re.match(r"^https?://([^/\s]+)", url, _re.I)
    if not m or "." not in m.group(1) or " " in url:
        raise HTTPException(422, f"{kind} URL doesn't look like a URL: {raw!r}")
    if kind == "repo":
        if not _re.match(r"^https://(www\.)?github\.com/[^/]+/[^/]+", url, _re.I):
            raise HTTPException(
                422, "repo URL must be a public GitHub repo "
                     "(https://github.com/owner/name) — or leave it blank for site-only analysis")
    return url


def _project(db: Session, project_id: str) -> Project:
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(404, "project not found")
    return p


def _approved_profile(db: Session, project_id: str) -> Profile:
    prof = (db.query(Profile).filter_by(project_id=project_id, status="approved")
            .order_by(Profile.version.desc()).first())
    if not prof:
        raise HTTPException(409, "Gate 1 not passed: no approved profile yet")
    return prof


def _job_row(db: Session, project_id: str, kind: str) -> Job:
    job = Job(project_id=project_id, kind=kind, status="queued")
    db.add(job)
    db.commit()
    return job


async def _run_job(job_id: str, coro_factory, on_done):
    """Generic pipeline job wrapper: run, time, persist result or error."""
    db = SessionLocal()
    job = db.get(Job, job_id)
    try:
        job.status = "running"
        db.commit()
        t0 = time.time()
        result = await coro_factory()
        job.elapsed_seconds = int(time.time() - t0)
        on_done(db, result)
        job.status = "done"
    except Exception as e:  # noqa: BLE001
        job.status = "error"
        job.error = str(e)[:2000]
    finally:
        job.finished_at = utcnow()
        db.commit()
        db.close()


# ---------------- projects ----------------

@app.post("/projects")
async def create_project(body: ProjectIn, db: Session = Depends(get_db)):
    # async: _start_understand needs a running event loop for create_task
    site = _norm_url(body.site_url, kind="site", required=True)
    repo = _norm_url(body.repo_url, kind="repo", required=False)
    name = str(body.name or "").strip()
    if not name:
        raise HTTPException(422, "app name is required")

    existing = (db.query(Project).filter(Project.site_url == site)
                .order_by(Project.created_at.desc()).first())
    p = Project(name=name, repo_url=repo, site_url=site,
                app_url=_norm_url(body.app_url, kind="app", required=False))
    db.add(p)
    db.commit()

    # step 1 flows straight into step 2: the builder lands on a working analysis
    job_id = _start_understand(db, p) if body.autorun else None
    return {"id": p.id, "name": p.name, "repo_url": p.repo_url,
            "site_url": p.site_url, "job_id": job_id,
            "duplicate_of": {"id": existing.id, "name": existing.name} if existing else None}


@app.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    out = []
    for p in db.query(Project).order_by(Project.created_at.desc()).all():
        prof = (db.query(Profile).filter_by(project_id=p.id)
                .order_by(Profile.version.desc()).first())
        out.append({
            "id": p.id, "name": p.name, "repo_url": p.repo_url,
            "site_url": p.site_url,
            "profile_status": prof.status if prof else "none",
        })
    return out


@app.get("/projects/{project_id}")
def get_project(project_id: str, db: Session = Depends(get_db)):
    p = _project(db, project_id)
    prof = (db.query(Profile).filter_by(project_id=p.id)
            .order_by(Profile.version.desc()).first())
    return {
        "id": p.id, "name": p.name, "repo_url": p.repo_url,
        "site_url": p.site_url, "app_url": p.app_url,
        "profile": {"id": prof.id, "version": prof.version,
                    "status": prof.status, "data": loads(prof.data),
                    "created_at": prof.created_at.isoformat() if prof.created_at else None} if prof else None,
        "counts": {
            "assets": db.query(Asset).filter_by(project_id=p.id).count(),
            "targets": db.query(Target).filter_by(project_id=p.id).count(),
            "targets_selected": db.query(Target).filter_by(project_id=p.id, selected=True).count(),
            "signals": db.query(Signal).filter_by(project_id=p.id).count(),
        },
    }


# ---------------- jobs ----------------

@app.get("/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "job not found")
    return {"id": job.id, "project_id": job.project_id, "kind": job.kind,
            "status": job.status, "error": job.error,
            "elapsed_seconds": job.elapsed_seconds}


@app.get("/projects/{project_id}/jobs")
def project_jobs(project_id: str, db: Session = Depends(get_db)):
    rows = (db.query(Job).filter_by(project_id=project_id)
            .order_by(Job.created_at.desc()).limit(30).all())
    return [{"id": j.id, "kind": j.kind, "status": j.status,
             "error": j.error, "elapsed_seconds": j.elapsed_seconds} for j in rows]


@app.get("/jobs")
def list_all_jobs(limit: int = 100, db: Session = Depends(get_db)):
    """Global run history across all projects (the app's Runs page)."""
    rows = (db.query(Job, Project.name).join(Project, Job.project_id == Project.id)
            .order_by(Job.created_at.desc()).limit(min(limit, 200)).all())
    return [{"id": j.id, "project_id": j.project_id, "project_name": name,
             "kind": j.kind, "status": j.status, "error": j.error,
             "elapsed_seconds": j.elapsed_seconds,
             "created_at": j.created_at.isoformat() if j.created_at else None}
            for j, name in rows]


# ---------------- stage: understand (produces Gate 1 draft) ----------------

def _start_understand(db: Session, p: Project, feedback: str = "") -> str:
    """Queue an understand run for this project; returns the job id."""
    job = _job_row(db, p.id, "understand")
    pid, jid = p.id, job.id
    repo, site = p.repo_url, p.site_url

    def on_done(s: Session, result: dict):
        version = 1 + (s.query(Profile).filter_by(project_id=pid).count())
        s.add(Profile(project_id=pid, version=version, data=dumps(result),
                      status="draft", job_id=jid))

    asyncio.create_task(_run_job(
        jid, lambda: rr.run_understand(repo, site, feedback), on_done))
    return jid


@app.post("/projects/{project_id}/run/understand")
async def run_understand(project_id: str, body: RunUnderstandIn | None = None,
                         db: Session = Depends(get_db)):
    p = _project(db, project_id)
    return {"job_id": _start_understand(db, p, body.feedback if body else "")}


@app.put("/projects/{project_id}/profile")
def edit_profile(project_id: str, body: ProfileEditIn, db: Session = Depends(get_db)):
    p = _project(db, project_id)
    version = 1 + db.query(Profile).filter_by(project_id=p.id).count()
    prof = Profile(project_id=p.id, version=version, data=dumps(body.data),
                   status="draft", job_id="manual-edit")
    db.add(prof)
    db.commit()
    return {"id": prof.id, "version": prof.version, "status": prof.status}


@app.post("/projects/{project_id}/profile/approve")
def approve_profile(project_id: str, db: Session = Depends(get_db)):
    p = _project(db, project_id)
    prof = (db.query(Profile).filter_by(project_id=p.id)
            .order_by(Profile.version.desc()).first())
    if not prof:
        raise HTTPException(404, "no profile to approve — run understand first")
    prof.status = "approved"
    db.commit()
    return {"id": prof.id, "version": prof.version, "status": "approved"}


# ---------------- stage: assets (Gate 2) ----------------
# NOTE: declared BEFORE /run/{kind} — FastAPI matches routes in declaration
# order, and "asset" must not be swallowed by the generic {kind} route.

def _latest_commercial(db: Session, project_id: str, kind: str) -> dict | None:
    row = (db.query(CommercialResult).filter_by(project_id=project_id, kind=kind)
           .order_by(CommercialResult.created_at.desc()).first())
    return loads(row.data) if row else None


@app.post("/projects/{project_id}/run/asset")
async def run_asset(project_id: str, body: RunAssetIn, db: Session = Depends(get_db)):
    p = _project(db, project_id)
    profile = loads(_approved_profile(db, p.id).data)   # Gate 1 enforced
    target = None
    if body.target_id:
        t = db.get(Target, body.target_id)
        if t:
            target = loads(t.data)
    # Brand DNA (if extracted) rides along so assets come out in brand voice.
    brand_dna = _latest_commercial(db, p.id, "brand_dna")
    job = _job_row(db, p.id, f"asset:{body.asset_type}")

    def on_done(s: Session, result: dict):
        result = rr.gate_asset(body.asset_type, result)
        version = 1 + s.query(Asset).filter_by(
            project_id=p.id, asset_type=body.asset_type).count()
        s.add(Asset(project_id=p.id, asset_type=body.asset_type,
                    version=version, data=dumps(result), job_id=job.id))

    asyncio.create_task(_run_job(
        job.id, lambda: rr.run_asset(body.asset_type, profile, target,
                                     body.tone, body.feedback, brand_dna),
        on_done))
    return {"job_id": job.id}


# ---------------- stage: commercial ----------------

@app.post("/projects/{project_id}/run/{kind}")
async def run_stage(project_id: str, kind: str, db: Session = Depends(get_db)):
    if kind not in ("pricing", "listing", "targets", "signals",
                    "brand_dna", "brand_campaigns"):
        raise HTTPException(400, f"unknown stage {kind}")
    p = _project(db, project_id)
    profile = loads(_approved_profile(db, p.id).data)   # Gate 1 enforced
    # Campaigns build ON the DNA — check before creating a job row so a
    # missing prerequisite is a 409, not a failed job in the history.
    dna = None
    if kind == "brand_campaigns":
        dna = _latest_commercial(db, p.id, "brand_dna")
        if not dna:
            raise HTTPException(409, "extract Brand DNA first — campaigns are "
                                     "generated from it")
    job = _job_row(db, p.id, kind)

    if kind in ("pricing", "listing"):
        def on_done(s: Session, result: dict):
            s.add(CommercialResult(project_id=p.id, kind=kind,
                                   data=dumps(result), job_id=job.id))
        coro = lambda: rr.run_commercial(kind, profile)  # noqa: E731

    elif kind == "brand_dna":
        def on_done(s: Session, result: dict):
            s.add(CommercialResult(project_id=p.id, kind="brand_dna",
                                   data=dumps(result), job_id=job.id))
        coro = lambda: rr.run_brand("dna", profile, site_url=p.site_url)  # noqa: E731

    elif kind == "brand_campaigns":
        def on_done(s: Session, result: dict):
            s.add(CommercialResult(project_id=p.id, kind="brand_campaigns",
                                   data=dumps(result), job_id=job.id))
        coro = lambda: rr.run_brand("campaigns", profile, dna=dna)  # noqa: E731

    elif kind == "targets":
        # curated venue pool goes INTO the run; discoveries are written back
        curated = [{"name": v.name, "kind": v.kind, "url": v.url,
                    "submission_url": v.submission_url, "tags": v.tags}
                   for v in db.query(Venue).limit(80).all()]

        def on_done(s: Session, result: dict):
            # Gate 3 is an approval. Re-running the stage must not silently
            # revoke it: carry the builder's picks across the rebuild by URL
            # (stable identity — ids and ranks both change between runs).
            kept_selected = {
                str(loads(t.data).get("url", ""))
                for t in s.query(Target).filter_by(project_id=p.id, selected=True).all()
            }
            kept_selected.discard("")
            s.query(Target).filter_by(project_id=p.id).delete()
            known = {v.url for v in s.query(Venue).all()}
            discovered = 0
            for t in result.get("targets", []):
                url = str(t.get("url", ""))
                s.add(Target(project_id=p.id, rank=t.get("rank", 0),
                             data=dumps(t), job_id=job.id,
                             selected=url in kept_selected))
                if url.startswith("http") and url not in known:
                    s.add(Venue(name=str(t.get("name", url))[:120],
                                kind=str(t.get("kind", "community")),
                                url=url,
                                submission_url=str(t.get("submission_url", "")),
                                rules_summary=str(t.get("rules_summary", ""))[:500],
                                audience_signal=str(t.get("audience_signal", ""))[:200],
                                source="discovered"))
                    known.add(url)
                    discovered += 1
            meta = {k: v for k, v in result.items() if k != "targets"}
            meta["venues_learned"] = discovered
            s.add(CommercialResult(project_id=p.id, kind="targets_meta",
                                   data=dumps(meta), job_id=job.id))
        coro = lambda: rr.run_targets(profile, curated)  # noqa: E731

    else:  # signals — finder pipeline, deterministic gate, then re-score pass
        # community-scoped recall: subreddits from this app's ranked venues
        # (targets stage), falling back to rr.SIGNAL_FALLBACK_COMMUNITIES
        import re as _re
        subs: list[str] = []
        for t in (db.query(Target).filter_by(project_id=p.id)
                  .order_by(Target.rank).all()):
            m = _re.search(r"reddit\.com/r/([A-Za-z0-9_]+)",
                           str(loads(t.data).get("url", "")))
            if m and m.group(1) not in subs:
                subs.append(m.group(1))
            if len(subs) >= 5:
                break

        async def signals_flow():
            result = await rr.run_signals(profile, subs or None)
            own = [p.repo_url, p.site_url, p.app_url]
            kept, dropped = rr.gate_signals(result.get("signals", []), own)
            kept, rejected = await rr.rescore_signals(profile, kept)
            return {"signals": kept,
                    "meta": {"dropped_by_gate": dropped,
                             "rejected_by_rescore": [
                                 {"url": r.get("url"), "why": (r.get("rescore") or {}).get("why")}
                                 for r in rejected],
                             "coverage_notes": result.get("coverage_notes"),
                             "queries": result.get("search_queries_used")}}

        def on_done(s: Session, result: dict):
            # Same contract as targets: a re-scan must not resurrect threads the
            # builder already replied to or dismissed. Carry status across by
            # URL, since ids are regenerated on every run.
            prior = {}
            for row in s.query(Signal).filter_by(project_id=p.id).all():
                url = str(loads(row.data).get("url", ""))
                if url and row.status != "new":
                    prior[url] = row.status
            s.query(Signal).filter_by(project_id=p.id).delete()
            for sig in result["signals"]:
                s.add(Signal(project_id=p.id, rank=sig.get("rank", 0),
                             data=dumps(sig), job_id=job.id,
                             status=prior.get(str(sig.get("url", "")), "new")))
            s.add(CommercialResult(project_id=p.id, kind="signals_meta",
                                   data=dumps(result["meta"]), job_id=job.id))
        coro = signals_flow

    asyncio.create_task(_run_job(job.id, coro, on_done))
    return {"job_id": job.id}


@app.get("/projects/{project_id}/commercial/{kind}")
def get_commercial(project_id: str, kind: str, db: Session = Depends(get_db)):
    row = (db.query(CommercialResult).filter_by(project_id=project_id, kind=kind)
           .order_by(CommercialResult.created_at.desc()).first())
    if not row:
        raise HTTPException(404, f"no {kind} result yet")
    return {"id": row.id, "kind": kind, "data": loads(row.data)}


@app.get("/projects/{project_id}/assets")
def list_assets(project_id: str, db: Session = Depends(get_db)):
    rows = (db.query(Asset).filter_by(project_id=project_id)
            .order_by(Asset.created_at.desc()).all())
    return [{"id": a.id, "asset_type": a.asset_type, "version": a.version,
             "status": a.status, "data": loads(a.data)} for a in rows]


@app.put("/assets/{asset_id}")
def edit_asset(asset_id: str, body: AssetEditIn, db: Session = Depends(get_db)):
    a = db.get(Asset, asset_id)
    if not a:
        raise HTTPException(404, "asset not found")
    a.data = dumps(rr.gate_asset(a.asset_type, body.data))
    a.status = "edited"
    db.commit()
    return {"id": a.id, "status": a.status}


@app.post("/assets/{asset_id}/approve")
def approve_asset(asset_id: str, db: Session = Depends(get_db)):
    a = db.get(Asset, asset_id)
    if not a:
        raise HTTPException(404, "asset not found")
    a.status = "approved"
    db.commit()
    return {"id": a.id, "status": "approved"}


# ---------------- stage: targets (Gate 3) ----------------

@app.get("/projects/{project_id}/targets")
def list_targets(project_id: str, db: Session = Depends(get_db)):
    rows = (db.query(Target).filter_by(project_id=project_id)
            .order_by(Target.rank).all())
    return [{"id": t.id, "rank": t.rank, "selected": t.selected,
             "data": loads(t.data)} for t in rows]


@app.post("/targets/{target_id}/select")
def select_target(target_id: str, selected: bool = True, db: Session = Depends(get_db)):
    t = db.get(Target, target_id)
    if not t:
        raise HTTPException(404, "target not found")
    t.selected = selected
    db.commit()
    return {"id": t.id, "selected": t.selected}


# ---------------- signals ----------------

@app.get("/projects/{project_id}/signals")
def list_signals(project_id: str, db: Session = Depends(get_db)):
    rows = (db.query(Signal).filter_by(project_id=project_id)
            .order_by(Signal.rank).all())
    return [{"id": s.id, "rank": s.rank, "status": s.status,
             "data": loads(s.data)} for s in rows]


@app.post("/signals/{signal_id}/status")
def set_signal_status(signal_id: str, status: str, db: Session = Depends(get_db)):
    if status not in ("new", "dismissed", "replied"):
        raise HTTPException(400, "bad status")
    s = db.get(Signal, signal_id)
    if not s:
        raise HTTPException(404, "signal not found")
    s.status = status
    db.commit()
    return {"id": s.id, "status": s.status}


# ---------------- launch plan + attribution ----------------

def _ref_code(target_data: dict) -> str:
    """Deterministic per-venue ref code: the attribution key. The store
    records this at signup; the rollup joins back to the venue."""
    import re as _re
    slug = _re.sub(r"[^a-z0-9]+", "_", str(target_data.get("name", "venue")).lower()).strip("_")[:32]
    return f"lk_{target_data.get('kind', 'x')}_{slug}"


def _ref_url(p: Project, ref: str) -> str:
    base = p.app_url or p.site_url
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}ref={ref}"


@app.get("/projects/{project_id}/plan")
def get_plan(project_id: str, fmt: str = "json", db: Session = Depends(get_db)):
    p = _project(db, project_id)
    assets = (db.query(Asset).filter_by(project_id=p.id, status="approved")
              .order_by(Asset.asset_type, Asset.version.desc()).all())
    # newest approved version per type
    latest: dict = {}
    for a in assets:
        latest.setdefault(a.asset_type, a)
    targets = (db.query(Target).filter_by(project_id=p.id, selected=True)
               .order_by(Target.rank).all())
    meta = (db.query(CommercialResult)
            .filter_by(project_id=p.id, kind="targets_meta")
            .order_by(CommercialResult.created_at.desc()).first())
    sequencing = (loads(meta.data).get("sequencing_advice") if meta else []) or []

    target_dicts = []
    for t in targets:
        d = loads(t.data)
        d["ref"] = _ref_code(d)
        d["ref_url"] = _ref_url(p, d["ref"])
        target_dicts.append(d)

    plan = {
        "project": {"id": p.id, "name": p.name, "app_url": p.app_url},
        "sequencing": sequencing,
        "targets": target_dicts,
        "assets": {k: loads(a.data) for k, a in latest.items()},
        "ready": bool(latest) and bool(target_dicts),
    }
    if fmt == "markdown":
        return {"markdown": _plan_markdown(plan)}
    return plan


@app.get("/projects/{project_id}/attribution")
def get_attribution(project_id: str, db: Session = Depends(get_db)):
    """Which venue produced which subscriber — the loop this product exists
    to close. Reads the (mock) store's signup rollup and joins it to the
    selected targets by ref code."""
    from sqlalchemy import func
    p = _project(db, project_id)
    rows = (db.query(StoreSignup.ref, func.count(StoreSignup.id))
            .filter_by(app_id=p.id).group_by(StoreSignup.ref).all())
    counts = {ref or "(direct)": n for ref, n in rows}
    out = []
    for t in db.query(Target).filter_by(project_id=p.id, selected=True).order_by(Target.rank).all():
        d = loads(t.data)
        ref = _ref_code(d)
        out.append({"target": d.get("name"), "kind": d.get("kind"),
                    "ref": ref, "signups": counts.pop(ref, 0)})
    for ref, n in counts.items():
        out.append({"target": None, "kind": None, "ref": ref, "signups": n})
    return {"project_id": p.id, "total": sum(r["signups"] for r in out),
            "by_target": sorted(out, key=lambda r: -r["signups"])}


def _plan_markdown(plan: dict) -> str:
    lines = [f"# Launch Plan — {plan['project']['name']}", ""]
    if plan["sequencing"]:
        lines += ["## Sequence"] + [f"{i}. {s}" for i, s in
                                    enumerate(plan["sequencing"], 1)] + [""]
    lines.append("## Targets")
    for t in plan["targets"]:
        lines.append(f"- **{t.get('name')}** ({t.get('kind')}) — "
                     f"{t.get('submission_url') or t.get('url')}\n"
                     f"  - why: {t.get('why_fit')}\n"
                     f"  - rules: {t.get('rules_summary')}\n"
                     f"  - link to use here (attribution): {t.get('ref_url')}")
    lines.append("")
    for atype, a in plan["assets"].items():
        lines.append(f"## Asset — {atype}")
        for k, v in a.items():
            if k == "warnings":
                continue
            lines.append(f"**{k}:**\n\n{v if isinstance(v, str) else dumps(v)}\n")
    return "\n".join(lines)


# ---------------- admin ----------------

@app.post("/admin/restart-pipe/{pipe_name}")
async def admin_restart_pipe(pipe_name: str):
    token = await rr.restart_pipe(pipe_name)
    return {"pipe": pipe_name, "token": token}
