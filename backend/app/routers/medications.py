# routers/medications.py — Medication tracker + health records

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database.db import get_db
from app.models.models import Medication, MedLog, HealthRecord

router = APIRouter(prefix="/medications", tags=["Medications"])

class MedCreate(BaseModel):
    device_id: str
    name: str
    dosage: str = ""
    frequency: str = "daily"
    time: str = "08:00"
    notes: str = ""

class MedOut(MedCreate):
    id: int
    active: bool
    class Config:
        from_attributes = True

class MedLogCreate(BaseModel):
    device_id: str
    medication_id: int
    taken: bool = True
    date: str
    time_taken: str = ""
    notes: str = ""

class MedLogOut(MedLogCreate):
    id: int
    class Config:
        from_attributes = True

class HealthRecordCreate(BaseModel):
    device_id: str
    type: str       # "blood_pressure","blood_sugar","weight","temperature"
    value: str
    unit: str = ""
    notes: str = ""
    date: str

class HealthRecordOut(HealthRecordCreate):
    id: int
    class Config:
        from_attributes = True


# ── Medications ──────────────────────────────────────────────
@router.get("/{device_id}", response_model=List[MedOut])
def get_medications(device_id: str, db: Session = Depends(get_db)):
    return db.query(Medication).filter(Medication.device_id == device_id, Medication.active == True).all()

@router.post("/", response_model=MedOut)
def add_medication(payload: MedCreate, db: Session = Depends(get_db)):
    med = Medication(**payload.model_dump())
    db.add(med); db.commit(); db.refresh(med)
    return med

@router.delete("/{med_id}")
def delete_medication(med_id: int, db: Session = Depends(get_db)):
    med = db.query(Medication).filter(Medication.id == med_id).first()
    if not med: raise HTTPException(404, "Not found")
    med.active = False
    db.commit()
    return {"message": "Medication archived"}


# ── Medication Logs ──────────────────────────────────────────
@router.get("/{device_id}/logs/{date}")
def get_med_logs(device_id: str, date: str, db: Session = Depends(get_db)):
    meds = db.query(Medication).filter(Medication.device_id == device_id, Medication.active == True).all()
    logs = {l.medication_id: l for l in db.query(MedLog).filter(MedLog.device_id == device_id, MedLog.date == date).all()}
    return [{"medication": m, "log": logs.get(m.id), "taken": m.id in logs} for m in meds]

@router.post("/logs", response_model=MedLogOut)
def log_medication(payload: MedLogCreate, db: Session = Depends(get_db)):
    existing = db.query(MedLog).filter(MedLog.medication_id == payload.medication_id, MedLog.date == payload.date, MedLog.device_id == payload.device_id).first()
    if existing:
        existing.taken = payload.taken; existing.time_taken = payload.time_taken
        db.commit(); db.refresh(existing); return existing
    log = MedLog(**payload.model_dump())
    db.add(log); db.commit(); db.refresh(log)
    return log


# ── Health Records ───────────────────────────────────────────
@router.get("/records/{device_id}", response_model=List[HealthRecordOut])
def get_health_records(device_id: str, type: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(HealthRecord).filter(HealthRecord.device_id == device_id)
    if type: q = q.filter(HealthRecord.type == type)
    return q.order_by(HealthRecord.date.desc()).limit(50).all()

@router.post("/records", response_model=HealthRecordOut)
def add_health_record(payload: HealthRecordCreate, db: Session = Depends(get_db)):
    record = HealthRecord(**payload.model_dump())
    db.add(record); db.commit(); db.refresh(record)
    return record
