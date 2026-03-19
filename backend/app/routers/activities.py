# routers/activities.py — Activity CRUD endpoints

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import Activity
from app.schemas.schemas import ActivityCreate, ActivityOut

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("/", response_model=List[ActivityOut])
def get_all(date: str = None, db: Session = Depends(get_db)):
    """Get all activities. Optionally filter by date (YYYY-MM-DD)."""
    query = db.query(Activity)
    if date:
        query = query.filter(Activity.date == date)
    return query.order_by(Activity.created_at.desc()).all()


@router.post("/", response_model=ActivityOut)
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    """Log a new activity."""
    activity = Activity(**payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.get("/{activity_id}", response_model=ActivityOut)
def get_one(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.delete("/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    db.delete(activity)
    db.commit()
    return {"message": "Deleted successfully"}
