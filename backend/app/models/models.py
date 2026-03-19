# models/models.py — SQLAlchemy ORM models (DB Tables)

from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from app.database.db import Base


class Activity(Base):
    __tablename__ = "activities"

    id         = Column(Integer, primary_key=True, index=True)
    type       = Column(String, nullable=False)         # Running, Yoga, etc.
    duration   = Column(Integer, nullable=False)        # minutes
    calories   = Column(Integer, default=0)             # kcal burned
    steps      = Column(Integer, default=0)
    notes      = Column(String, default="")
    date       = Column(String, nullable=False)         # YYYY-MM-DD
    created_at = Column(DateTime, server_default=func.now())


class Nutrition(Base):
    __tablename__ = "nutrition"

    id         = Column(Integer, primary_key=True, index=True)
    meal       = Column(String, nullable=False)         # Breakfast, Lunch, etc.
    item       = Column(String, nullable=False)         # Food name
    calories   = Column(Integer, default=0)
    protein    = Column(Float, default=0)               # grams
    carbs      = Column(Float, default=0)
    fat        = Column(Float, default=0)
    date       = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id         = Column(Integer, primary_key=True, index=True)
    bedtime    = Column(String, nullable=False)         # HH:MM
    wakeup     = Column(String, nullable=False)         # HH:MM
    duration   = Column(Float, default=0)               # calculated hours
    quality    = Column(String, default="Good")         # Excellent/Good/Fair/Poor
    date       = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, server_default=func.now())


class WaterLog(Base):
    __tablename__ = "water_logs"

    id         = Column(Integer, primary_key=True, index=True)
    amount     = Column(Float, nullable=False)          # liters
    date       = Column(String, nullable=False, unique=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Goal(Base):
    __tablename__ = "goals"

    id       = Column(Integer, primary_key=True, index=True)
    steps    = Column(Integer, default=10000)
    calories = Column(Integer, default=2000)
    water    = Column(Float, default=8.0)
    sleep    = Column(Float, default=8.0)
    exercise = Column(Integer, default=45)              # minutes


class Profile(Base):
    __tablename__ = "profile"

    id     = Column(Integer, primary_key=True, index=True)
    name   = Column(String, default="User")
    age    = Column(Integer, default=25)
    weight = Column(Float, default=70.0)                # kg
    height = Column(Float, default=170.0)               # cm
