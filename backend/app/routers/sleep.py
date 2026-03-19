# routers/sleep.py — Sleep log endpoints

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import SleepLog
from app.schemas.schemas import SleepCreate, SleepOut

router = APIRouter(prefix="/sleep", tags=["Sleep"])


def calc_duration(bedtime: str, wakeup: str) -> float:
    """Calculate sleep hours from HH:MM strings."""
    bh, bm = map(int, bedtime.split(":"))
    wh, wm = map(int, wakeup.split(":"))
    diff = (wh * 60 + wm) - (bh * 60 + bm)
    if diff < 0:
        diff += 24 * 60
    return round(diff / 60, 1)


@router.get("/", response_model=List[SleepOut])
def get_all(db: Session = Depends(get_db)):
    return db.query(SleepLog).order_by(SleepLog.date.desc()).all()


@router.post("/", response_model=SleepOut)
def log_sleep(payload: SleepCreate, db: Session = Depends(get_db)):
    """Log or update sleep for a date (one entry per day)."""
    duration = calc_duration(payload.bedtime, payload.wakeup)

    # Upsert: delete existing entry for same date
    existing = db.query(SleepLog).filter(SleepLog.date == payload.date).first()
    if existing:
        db.delete(existing)
        db.commit()

    sleep = SleepLog(**payload.model_dump(), duration=duration)
    db.add(sleep)
    db.commit()
    db.refresh(sleep)
    return sleep


@router.delete("/{sleep_id}")
def delete_sleep(sleep_id: int, db: Session = Depends(get_db)):
    sleep = db.query(SleepLog).filter(SleepLog.id == sleep_id).first()
    if not sleep:
        raise HTTPException(status_code=404, detail="Sleep log not found")
    db.delete(sleep)
    db.commit()
    return {"message": "Deleted successfully"}
