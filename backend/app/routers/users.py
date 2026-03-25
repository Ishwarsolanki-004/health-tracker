# routers/users.py — Multi-user management (no login, device-based)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database.db import get_db
from app.models.models import UserProfile, Goal

router = APIRouter(prefix="/users", tags=["Users"])

AVATARS = ["👤","🧑","👩","🧔","👨‍💻","👩‍💻","🧑‍🎓","👨‍⚕️","👩‍⚕️","🦸","🧙","🏋️"]

class UserCreate(BaseModel):
    device_id: str
    name: str = "User"
    age: int = 25
    weight: float = 70.0
    height: float = 170.0
    language: str = "en"
    avatar: str = "👤"

class UserUpdate(BaseModel):
    name: str = None
    age: int = None
    weight: float = None
    height: float = None
    language: str = None
    avatar: str = None

class UserOut(BaseModel):
    id: int
    device_id: str
    name: str
    age: int
    weight: float
    height: float
    language: str
    avatar: str
    points: int
    bmi: float = None
    class Config:
        from_attributes = True


def calc_bmi(weight, height):
    if weight and height:
        return round(weight / ((height / 100) ** 2), 1)
    return None


@router.get("/", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db)):
    """Get all device profiles — for user switcher."""
    users = db.query(UserProfile).order_by(UserProfile.created_at.desc()).all()
    result = []
    for u in users:
        out = UserOut.model_validate(u)
        out.bmi = calc_bmi(u.weight, u.height)
        result.append(out)
    return result


@router.post("/", response_model=UserOut)
def create_or_get_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Create new user profile OR return existing one by device_id."""
    existing = db.query(UserProfile).filter(UserProfile.device_id == payload.device_id).first()
    if existing:
        out = UserOut.model_validate(existing)
        out.bmi = calc_bmi(existing.weight, existing.height)
        return out
    user = UserProfile(**payload.model_dump())
    db.add(user)
    db.commit()
    # Auto-create default goals
    goal = Goal(device_id=payload.device_id)
    db.add(goal)
    db.commit()
    db.refresh(user)
    out = UserOut.model_validate(user)
    out.bmi = calc_bmi(user.weight, user.height)
    return out


@router.get("/{device_id}", response_model=UserOut)
def get_user(device_id: str, db: Session = Depends(get_db)):
    user = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    out = UserOut.model_validate(user)
    out.bmi = calc_bmi(user.weight, user.height)
    return out


@router.put("/{device_id}", response_model=UserOut)
def update_user(device_id: str, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    out = UserOut.model_validate(user)
    out.bmi = calc_bmi(user.weight, user.height)
    return out


@router.delete("/{device_id}")
def delete_user(device_id: str, db: Session = Depends(get_db)):
    user = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User and all data deleted"}


@router.get("/avatars/list")
def get_avatars():
    return {"avatars": AVATARS}
