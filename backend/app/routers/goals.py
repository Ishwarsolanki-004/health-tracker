# routers/goals.py — Goals router updated for multi-user

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database.db import get_db
from app.models.models import Goal, UserProfile

router = APIRouter(prefix="/goals", tags=["Goals"])


class GoalUpdate(BaseModel):
    steps:    Optional[int]   = None
    calories: Optional[int]   = None
    water:    Optional[float] = None
    sleep:    Optional[float] = None
    exercise: Optional[int]   = None


class GoalOut(BaseModel):
    id:       int
    steps:    int
    calories: int
    water:    float
    sleep:    float
    exercise: int
    class Config:
        from_attributes = True


def _get_or_create(db: Session, device_id: str = "default"):
    # Ensure user exists
    user = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()
    if not user:
        user = UserProfile(device_id=device_id)
        db.add(user)
        db.commit()
    # Get or create goals
    goals = db.query(Goal).filter(Goal.device_id == device_id).first()
    if not goals:
        goals = Goal(device_id=device_id)
        db.add(goals)
        db.commit()
        db.refresh(goals)
    return goals


@router.get("/", response_model=GoalOut)
def get_goals(device_id: str = "default", db: Session = Depends(get_db)):
    return _get_or_create(db, device_id)


@router.put("/", response_model=GoalOut)
def update_goals(payload: GoalUpdate, device_id: str = "default", db: Session = Depends(get_db)):
    goals = _get_or_create(db, device_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(goals, k, v)
    db.commit()
    db.refresh(goals)
    return goals
