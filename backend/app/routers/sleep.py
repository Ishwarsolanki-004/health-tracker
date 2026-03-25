# routers/sleep.py — Sleep log with device_id

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.db import get_db
from app.models.models import SleepLog

router = APIRouter(prefix="/sleep", tags=["Sleep"])


def calc_duration(bedtime: str, wakeup: str) -> float:
    bh, bm = map(int, bedtime.split(":"))
    wh, wm = map(int, wakeup.split(":"))
    diff = (wh*60+wm) - (bh*60+bm)
    if diff < 0: diff += 1440
    return round(diff/60, 1)


class SleepCreate(BaseModel):
    bedtime:   str
    wakeup:    str
    quality:   Optional[str] = "Good"
    date:      str
    device_id: Optional[str] = "default"


class SleepOut(SleepCreate):
    id:       int
    duration: float
    class Config:
        from_attributes = True


@router.get("/", response_model=List[SleepOut])
def get_all(device_id: str = "default", db: Session = Depends(get_db)):
    return db.query(SleepLog).filter(SleepLog.device_id == device_id).order_by(SleepLog.date.desc()).all()


@router.post("/", response_model=SleepOut)
def log_sleep(payload: SleepCreate, db: Session = Depends(get_db)):
    duration = calc_duration(payload.bedtime, payload.wakeup)
    existing = db.query(SleepLog).filter(SleepLog.date == payload.date, SleepLog.device_id == payload.device_id).first()
    if existing: db.delete(existing); db.commit()
    sleep = SleepLog(**payload.model_dump(), duration=duration)
    db.add(sleep); db.commit(); db.refresh(sleep)
    return sleep


@router.delete("/{sleep_id}")
def delete_sleep(sleep_id: int, db: Session = Depends(get_db)):
    s = db.query(SleepLog).filter(SleepLog.id == sleep_id).first()
    if not s: raise HTTPException(404, "Not found")
    db.delete(s); db.commit()
    return {"message": "Deleted"}
