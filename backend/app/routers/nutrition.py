# routers/nutrition.py — Nutrition/Meal CRUD endpoints

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database.db import get_db
from app.models.models import Nutrition
from app.schemas.schemas import NutritionCreate, NutritionOut

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


@router.get("/", response_model=List[NutritionOut])
def get_all(date: str = None, db: Session = Depends(get_db)):
    """Get all meals. Optionally filter by date."""
    query = db.query(Nutrition)
    if date:
        query = query.filter(Nutrition.date == date)
    return query.order_by(Nutrition.created_at.desc()).all()


@router.post("/", response_model=NutritionOut)
def log_meal(payload: NutritionCreate, db: Session = Depends(get_db)):
    """Log a new meal."""
    meal = Nutrition(**payload.model_dump())
    db.add(meal)
    db.commit()
    db.refresh(meal)
    return meal


@router.delete("/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Nutrition).filter(Nutrition.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    return {"message": "Deleted successfully"}
