# routers/goals.py — Goals endpoints

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.models import Goal
from app.schemas.schemas import GoalUpdate, GoalOut

router = APIRouter(prefix="/goals", tags=["Goals"])


def get_or_create_goals(db: Session) -> Goal:
    goals = db.query(Goal).first()
    if not goals:
        goals = Goal()
        db.add(goals)
        db.commit()
        db.refresh(goals)
    return goals


@router.get("/", response_model=GoalOut)
def get_goals(db: Session = Depends(get_db)):
    return get_or_create_goals(db)


@router.put("/", response_model=GoalOut)
def update_goals(payload: GoalUpdate, db: Session = Depends(get_db)):
    goals = get_or_create_goals(db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(goals, field, value)
    db.commit()
    db.refresh(goals)
    return goals
