"""Mock RocketRide App Store API — the decided placeholder so Launch Kit can
build and test attribution without waiting on real store integration.

Contract (this doubles as the integration spec for the store team):
  GET  /mockstore/apps/{app_id}           → listing
  GET  /mockstore/apps/{app_id}/plans     → subscription plans
  POST /mockstore/events                  → signup event with ref code
  GET  /mockstore/apps/{app_id}/signups   → rollup by ref code

Swapping to the real store later = pointing these calls at the store's API.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from .db import Project, SessionLocal, StoreSignup

router = APIRouter(prefix="/mockstore", tags=["mockstore"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class SignupEvent(BaseModel):
    app_id: str
    ref: str = ""
    event: str = "signup"


@router.get("/apps/{app_id}")
def get_listing(app_id: str, db: Session = Depends(get_db)):
    p = db.get(Project, app_id)
    if not p:
        raise HTTPException(404, "app not found in store")
    return {
        "app_id": p.id,
        "name": p.name,
        "tagline": "",
        "description": "",
        "screenshots": [],
        "listing_url": p.app_url or p.site_url,
    }


@router.get("/apps/{app_id}/plans")
def get_plans(app_id: str):
    return {
        "app_id": app_id,
        "plans": [
            {"name": "Free", "price_usd_month": 0},
            {"name": "Pro", "price_usd_month": 12},
        ],
    }


@router.post("/events")
def post_event(body: SignupEvent, db: Session = Depends(get_db)):
    if body.event != "signup":
        raise HTTPException(400, "only 'signup' events supported")
    row = StoreSignup(app_id=body.app_id, ref=body.ref)
    db.add(row)
    db.commit()
    return {"id": row.id, "app_id": row.app_id, "ref": row.ref}


@router.get("/apps/{app_id}/signups")
def get_signups(app_id: str, db: Session = Depends(get_db)):
    rows = (db.query(StoreSignup.ref, func.count(StoreSignup.id))
            .filter_by(app_id=app_id).group_by(StoreSignup.ref).all())
    total = sum(n for _, n in rows)
    return {"app_id": app_id, "total": total,
            "by_ref": [{"ref": ref or "(direct)", "signups": n} for ref, n in rows]}
