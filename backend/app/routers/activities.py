# routers/activities.py — Activity CRUD with device_id support

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.db import get_db
from app.models.models import Activity

router = APIRouter(prefix="/activities", tags=["Activities"])


class ActivityCreate(BaseModel):
    type:      str
    duration:  int
    calories:  Optional[int]   = 0
    steps:     Optional[int]   = 0
    notes:     Optional[str]   = ""
    date:      str
    device_id: Optional[str]   = "default"


class ActivityOut(ActivityCreate):
    id: int
    class Config:
        from_attributes = True


@router.get("/", response_model=List[ActivityOut])
def get_all(date: str = None, device_id: str = "default", db: Session = Depends(get_db)):
    q = db.query(Activity).filter(Activity.device_id == device_id)
    if date:
        q = q.filter(Activity.date == date)
    return q.order_by(Activity.created_at.desc()).all()


@router.post("/", response_model=ActivityOut)
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    activity = Activity(**payload.model_dump())
    db.add(activity); db.commit(); db.refresh(activity)
    return activity


@router.get("/{activity_id}", response_model=ActivityOut)
def get_one(activity_id: int, db: Session = Depends(get_db)):
    a = db.query(Activity).filter(Activity.id == activity_id).first()
    if not a: raise HTTPException(404, "Not found")
    return a


@router.delete("/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    a = db.query(Activity).filter(Activity.id == activity_id).first()
    if not a: raise HTTPException(404, "Not found")
    db.delete(a); db.commit()
    return {"message": "Deleted"}
