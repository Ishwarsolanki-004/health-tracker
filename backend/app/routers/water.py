# routers/water.py — Water intake endpoints

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import WaterLog
from app.schemas.schemas import WaterUpdate, WaterOut

router = APIRouter(prefix="/water", tags=["Water"])


@router.get("/", response_model=List[WaterOut])
def get_all(db: Session = Depends(get_db)):
    return db.query(WaterLog).order_by(WaterLog.date.desc()).all()


@router.get("/{date}", response_model=WaterOut)
def get_by_date(date: str, db: Session = Depends(get_db)):
    record = db.query(WaterLog).filter(WaterLog.date == date).first()
    if not record:
        return {"id": 0, "amount": 0.0, "date": date}
    return record


@router.post("/", response_model=WaterOut)
def upsert_water(payload: WaterUpdate, db: Session = Depends(get_db)):
    """Set total water amount for a date (upsert)."""
    record = db.query(WaterLog).filter(WaterLog.date == payload.date).first()
    if record:
        record.amount = payload.amount
    else:
        record = WaterLog(**payload.model_dump())
        db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/add", response_model=WaterOut)
def add_water(date: str, amount: float, db: Session = Depends(get_db)):
    """Add water on top of existing amount for the day."""
    record = db.query(WaterLog).filter(WaterLog.date == date).first()
    if record:
        record.amount = round(record.amount + amount, 2)
    else:
        record = WaterLog(date=date, amount=round(amount, 2))
        db.add(record)
    db.commit()
    db.refresh(record)
    return record
