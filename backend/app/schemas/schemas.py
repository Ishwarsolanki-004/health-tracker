# schemas/schemas.py — Pydantic schemas for request/response validation

from pydantic import BaseModel
from typing import Optional


# ─── Activity ───────────────────────────────────────────────
class ActivityCreate(BaseModel):
    type: str
    duration: int
    calories: Optional[int] = 0
    steps: Optional[int] = 0
    notes: Optional[str] = ""
    date: str  # YYYY-MM-DD

class ActivityOut(ActivityCreate):
    id: int
    class Config:
        from_attributes = True


# ─── Nutrition ──────────────────────────────────────────────
class NutritionCreate(BaseModel):
    meal: str
    item: str
    calories: int
    protein: Optional[float] = 0
    carbs: Optional[float] = 0
    fat: Optional[float] = 0
    date: str

class NutritionOut(NutritionCreate):
    id: int
    class Config:
        from_attributes = True


# ─── Sleep ──────────────────────────────────────────────────
class SleepCreate(BaseModel):
    bedtime: str   # HH:MM
    wakeup: str    # HH:MM
    quality: Optional[str] = "Good"
    date: str

class SleepOut(SleepCreate):
    id: int
    duration: float
    class Config:
        from_attributes = True


# ─── Water ──────────────────────────────────────────────────
class WaterUpdate(BaseModel):
    amount: float  # total liters for the day
    date: str

class WaterOut(WaterUpdate):
    id: int
    class Config:
        from_attributes = True


# ─── Goals ──────────────────────────────────────────────────
class GoalUpdate(BaseModel):
    steps: Optional[int] = 10000
    calories: Optional[int] = 2000
    water: Optional[float] = 8.0
    sleep: Optional[float] = 8.0
    exercise: Optional[int] = 45

class GoalOut(GoalUpdate):
    id: int
    class Config:
        from_attributes = True


# ─── Profile ────────────────────────────────────────────────
class ProfileUpdate(BaseModel):
    name: Optional[str] = "User"
    age: Optional[int] = 25
    weight: Optional[float] = 70.0
    height: Optional[float] = 170.0

class ProfileOut(ProfileUpdate):
    id: int
    bmi: Optional[float] = None
    class Config:
        from_attributes = True
