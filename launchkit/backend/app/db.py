"""Database layer. SQLite for dev; set LAUNCHKIT_DATABASE_URL to move to
Postgres/Supabase without code changes (the data model matches the plan's
sketch: project, app_profile, asset, target, signal, job)."""

import json
import os
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_URL = os.environ.get(
    "LAUNCHKIT_DATABASE_URL",
    f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'launchkit.db')}",
)

engine = create_engine(DB_URL, connect_args={"check_same_thread": False}
                       if DB_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base = declarative_base()


def new_id() -> str:
    return uuid.uuid4().hex[:12]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)
    repo_url = Column(String, nullable=False)
    site_url = Column(String, nullable=False)
    app_url = Column(String, default="")          # store listing / public app url
    created_at = Column(DateTime, default=utcnow)


class Profile(Base):
    __tablename__ = "app_profiles"
    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    version = Column(Integer, default=1)
    data = Column(Text, nullable=False)           # JSON app profile
    status = Column(String, default="draft")      # draft | approved   (Gate 1)
    job_id = Column(String, default="")           # pipeline run provenance
    created_at = Column(DateTime, default=utcnow)


class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    asset_type = Column(String, nullable=False)   # reddit_post | show_hn | ...
    version = Column(Integer, default=1)
    data = Column(Text, nullable=False)           # JSON asset content
    status = Column(String, default="draft")      # draft | edited | approved  (Gate 2)
    job_id = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)


class Target(Base):
    __tablename__ = "targets"
    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    rank = Column(Integer, default=0)
    data = Column(Text, nullable=False)           # JSON venue record
    selected = Column(Boolean, default=False)     # Gate 3
    job_id = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)


class Signal(Base):
    __tablename__ = "signals"
    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    rank = Column(Integer, default=0)
    data = Column(Text, nullable=False)           # JSON signal record
    status = Column(String, default="new")        # new | dismissed | replied
    job_id = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)


class CommercialResult(Base):
    __tablename__ = "commercial_results"
    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    kind = Column(String, nullable=False)         # pricing | listing
    data = Column(Text, nullable=False)
    job_id = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)


class Venue(Base):
    """Curated + discovered launch-venue knowledge base. Every targets run can
    enrich it — this is the cross-app learning flywheel's substrate."""
    __tablename__ = "venues"
    id = Column(String, primary_key=True, default=new_id)
    name = Column(String, nullable=False)
    kind = Column(String, nullable=False)         # launch_platform | directory | subreddit | community | newsletter | awesome_list
    url = Column(String, nullable=False, unique=True)
    submission_url = Column(String, default="")
    rules_summary = Column(String, default="")
    audience_signal = Column(String, default="")
    tags = Column(String, default="")             # comma-separated fit tags
    source = Column(String, default="curated")    # curated | discovered
    created_at = Column(DateTime, default=utcnow)


class StoreSignup(Base):
    """Mock App Store signup events — the attribution placeholder until real
    store integration. One row per signup, keyed by ref code."""
    __tablename__ = "store_signups"
    id = Column(String, primary_key=True, default=new_id)
    app_id = Column(String, nullable=False)       # project id doubles as app id
    ref = Column(String, default="")
    created_at = Column(DateTime, default=utcnow)


class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    kind = Column(String, nullable=False)         # understand | pricing | listing | targets | signals | asset:<type>
    status = Column(String, default="queued")     # queued | running | done | error
    error = Column(Text, default="")
    elapsed_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)
    finished_at = Column(DateTime, nullable=True)


def init_db() -> None:
    Base.metadata.create_all(engine)


def dumps(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def loads(text: str):
    return json.loads(text) if text else None
