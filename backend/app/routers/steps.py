# routers/steps.py — Auto step save endpoint

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.database.db import get_db
from app.models.models import Activity

router = APIRouter(prefix="/activities", tags=["Steps Auto"])

class StepsAutoSave(BaseModel):
    device_id: str
    steps:     int
    date:      str
    type:      str = "Walking"
    duration:  int = 0
    calories:  int = 0

@router.post("/steps-auto")
def auto_save_steps(payload: StepsAutoSave, db: Session = Depends(get_db)):
    """
    Upsert today's auto-counted steps.
    Called by Service Worker every 60s automatically.
    Creates or updates a 'Walking (Auto)' entry for today.
    """
    # Find existing auto-save for today
    existing = db.query(Activity).filter(
        Activity.device_id == payload.device_id,
        Activity.date      == payload.date,
        Activity.notes     == "auto-step-count"
    ).first()

    if existing:
        # Update if new count is higher
        if payload.steps > (existing.steps or 0):
            existing.steps    = payload.steps
            existing.calories = payload.calories or max(1, round(payload.steps * 0.04))
            existing.duration = max(1, round(payload.steps / 100))
            db.commit()
            return { "status":"updated", "steps": existing.steps }
        return { "status":"no_change", "steps": existing.steps }
    else:
        # Create new auto entry
        act = Activity(
            device_id = payload.device_id,
            type      = "Walking",
            duration  = max(1, round(payload.steps / 100)),
            calories  = payload.calories or max(1, round(payload.steps * 0.04)),
            steps     = payload.steps,
            notes     = "auto-step-count",
            date      = payload.date,
        )
        db.add(act)
        db.commit()
        db.refresh(act)
        return { "status":"created", "steps": act.steps }
