# routers/profile.py — User profile endpoints

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import Profile
from app.schemas.schemas import ProfileUpdate, ProfileOut

router = APIRouter(prefix="/profile", tags=["Profile"])


def get_or_create_profile(db: Session) -> Profile:
    profile = db.query(Profile).first()
    if not profile:
        profile = Profile()
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("/", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db)):
    profile = get_or_create_profile(db)
    out = ProfileOut.model_validate(profile)
    if profile.weight and profile.height:
        out.bmi = round(profile.weight / ((profile.height / 100) ** 2), 1)
    return out


@router.put("/", response_model=ProfileOut)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db)):
    profile = get_or_create_profile(db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    out = ProfileOut.model_validate(profile)
    if profile.weight and profile.height:
        out.bmi = round(profile.weight / ((profile.height / 100) ** 2), 1)
    return out
