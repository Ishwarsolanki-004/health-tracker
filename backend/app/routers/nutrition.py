# routers/nutrition.py — Nutrition CRUD with device_id

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.db import get_db
from app.models.models import Nutrition

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


class NutritionCreate(BaseModel):
    meal:      str
    item:      str
    calories:  int
    protein:   Optional[float] = 0
    carbs:     Optional[float] = 0
    fat:       Optional[float] = 0
    date:      str
    device_id: Optional[str]   = "default"


class NutritionOut(NutritionCreate):
    id: int
    class Config:
        from_attributes = True


@router.get("/", response_model=List[NutritionOut])
def get_all(date: str = None, device_id: str = "default", db: Session = Depends(get_db)):
    q = db.query(Nutrition).filter(Nutrition.device_id == device_id)
    if date: q = q.filter(Nutrition.date == date)
    return q.order_by(Nutrition.created_at.desc()).all()


@router.post("/", response_model=NutritionOut)
def log_meal(payload: NutritionCreate, db: Session = Depends(get_db)):
    meal = Nutrition(**payload.model_dump())
    db.add(meal); db.commit(); db.refresh(meal)
    return meal


@router.delete("/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Nutrition).filter(Nutrition.id == meal_id).first()
    if not meal: raise HTTPException(404, "Not found")
    db.delete(meal); db.commit()
    return {"message": "Deleted"}
