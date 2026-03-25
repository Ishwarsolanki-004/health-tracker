# routers/water.py — Water log with device_id

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.db import get_db
from app.models.models import WaterLog

router = APIRouter(prefix="/water", tags=["Water"])


class WaterUpdate(BaseModel):
    amount:    float
    date:      str
    device_id: Optional[str] = "default"


class WaterOut(WaterUpdate):
    id: int
    class Config:
        from_attributes = True


@router.get("/", response_model=List[WaterOut])
def get_all(device_id: str = "default", db: Session = Depends(get_db)):
    return db.query(WaterLog).filter(WaterLog.device_id == device_id).order_by(WaterLog.date.desc()).all()


@router.get("/{date}")
def get_by_date(date: str, device_id: str = "default", db: Session = Depends(get_db)):
    r = db.query(WaterLog).filter(WaterLog.date == date, WaterLog.device_id == device_id).first()
    return {"id": r.id if r else 0, "amount": r.amount if r else 0.0, "date": date, "device_id": device_id}


@router.post("/", response_model=WaterOut)
def upsert_water(payload: WaterUpdate, db: Session = Depends(get_db)):
    r = db.query(WaterLog).filter(WaterLog.date == payload.date, WaterLog.device_id == payload.device_id).first()
    if r:
        r.amount = payload.amount
    else:
        r = WaterLog(**payload.model_dump()); db.add(r)
    db.commit(); db.refresh(r)
    return r


@router.post("/add")
def add_water(date: str, amount: float, device_id: str = "default", db: Session = Depends(get_db)):
    r = db.query(WaterLog).filter(WaterLog.date == date, WaterLog.device_id == device_id).first()
    if r:
        r.amount = round(r.amount + amount, 2)
    else:
        r = WaterLog(date=date, amount=round(amount,2), device_id=device_id); db.add(r)
    db.commit(); db.refresh(r)
    return r
