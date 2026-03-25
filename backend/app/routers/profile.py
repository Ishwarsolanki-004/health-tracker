# routers/profile.py — Profile router updated for multi-user models

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database.db import get_db
from app.models.models import UserProfile

router = APIRouter(prefix="/profile", tags=["Profile"])


class ProfileUpdate(BaseModel):
    name:     Optional[str]   = None
    age:      Optional[int]   = None
    weight:   Optional[float] = None
    height:   Optional[float] = None
    language: Optional[str]   = None
    avatar:   Optional[str]   = None


class ProfileOut(BaseModel):
    id:     int
    name:   str
    age:    int
    weight: float
    height: float
    bmi:    Optional[float] = None
    class Config:
        from_attributes = True


def _get_or_create(db: Session, device_id: str = "default"):
    user = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()
    if not user:
        from app.models.models import Goal
        user = UserProfile(device_id=device_id)
        db.add(user)
        db.commit()
        goal = Goal(device_id=device_id)
        db.add(goal)
        db.commit()
        db.refresh(user)
    return user


@router.get("/", response_model=ProfileOut)
def get_profile(device_id: str = "default", db: Session = Depends(get_db)):
    user = _get_or_create(db, device_id)
    bmi  = round(user.weight / ((user.height / 100) ** 2), 1) if user.weight and user.height else None
    out  = ProfileOut.model_validate(user)
    out.bmi = bmi
    return out


@router.put("/", response_model=ProfileOut)
def update_profile(payload: ProfileUpdate, device_id: str = "default", db: Session = Depends(get_db)):
    user = _get_or_create(db, device_id)
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    bmi = round(user.weight / ((user.height / 100) ** 2), 1) if user.weight and user.height else None
    out = ProfileOut.model_validate(user)
    out.bmi = bmi
    return out
