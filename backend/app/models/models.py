# models/models.py — All DB tables including multi-user support

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.db import Base


# ── User Profile (No Login — device-based UUID) ───────────────
class UserProfile(Base):
    __tablename__ = "user_profiles"
    id         = Column(Integer, primary_key=True, index=True)
    device_id  = Column(String, unique=True, index=True, nullable=False)  # UUID from browser
    name       = Column(String, default="User")
    age        = Column(Integer, default=25)
    weight     = Column(Float, default=70.0)
    height     = Column(Float, default=170.0)
    language   = Column(String, default="en")
    avatar     = Column(String, default="👤")
    points     = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    activities  = relationship("Activity",   back_populates="user", cascade="all, delete-orphan")
    nutrition   = relationship("Nutrition",  back_populates="user", cascade="all, delete-orphan")
    sleep_logs  = relationship("SleepLog",   back_populates="user", cascade="all, delete-orphan")
    water_logs  = relationship("WaterLog",   back_populates="user", cascade="all, delete-orphan")
    goals       = relationship("Goal",       back_populates="user", cascade="all, delete-orphan", uselist=False)
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    badges      = relationship("Badge",      back_populates="user", cascade="all, delete-orphan")
    med_logs    = relationship("MedLog",     back_populates="user", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"
    id         = Column(Integer, primary_key=True, index=True)
    device_id  = Column(String, ForeignKey("user_profiles.device_id"), nullable=False, index=True)
    type       = Column(String, nullable=False)
    duration   = Column(Integer, nullable=False)
    calories   = Column(Integer, default=0)
    steps      = Column(Integer, default=0)
    notes      = Column(String, default="")
    date       = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    user       = relationship("UserProfile", back_populates="activities")


class Nutrition(Base):
    __tablename__ = "nutrition"
    id         = Column(Integer, primary_key=True, index=True)
    device_id  = Column(String, ForeignKey("user_profiles.device_id"), nullable=False, index=True)
    meal       = Column(String, nullable=False)
    item       = Column(String, nullable=False)
    calories   = Column(Integer, default=0)
    protein    = Column(Float, default=0)
    carbs      = Column(Float, default=0)
    fat        = Column(Float, default=0)
    date       = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    user       = relationship("UserProfile", back_populates="nutrition")


class SleepLog(Base):
    __tablename__ = "sleep_logs"
    id         = Column(Integer, primary_key=True, index=True)
    device_id  = Column(String, ForeignKey("user_profiles.device_id"), nullable=False, index=True)
    bedtime    = Column(String, nullable=False)
    wakeup     = Column(String, nullable=False)
    duration   = Column(Float, default=0)
    quality    = Column(String, default="Good")
    date       = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    user       = relationship("UserProfile", back_populates="sleep_logs")


class WaterLog(Base):
    __tablename__ = "water_logs"
    id         = Column(Integer, primary_key=True, index=True)
    device_id  = Column(String, ForeignKey("user_profiles.device_id"), nullable=False, index=True)
    amount     = Column(Float, nullable=False)
    date       = Column(String, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    user       = relationship("UserProfile", back_populates="water_logs")


class Goal(Base):
    __tablename__ = "goals"
    id         = Column(Integer, primary_key=True, index=True)
    device_id  = Column(String, ForeignKey("user_profiles.device_id"), nullable=False, unique=True, index=True)
    steps      = Column(Integer, default=10000)
    calories   = Column(Integer, default=2000)
    water      = Column(Float, default=8.0)
    sleep      = Column(Float, default=8.0)
    exercise   = Column(Integer, default=45)
    user       = relationship("UserProfile", back_populates="goals")


class Medication(Base):
    __tablename__ = "medications"
    id           = Column(Integer, primary_key=True, index=True)
    device_id    = Column(String, ForeignKey("user_profiles.device_id"), nullable=False, index=True)
    name         = Column(String, nullable=False)
    dosage       = Column(String, default="")
    frequency    = Column(String, default="daily")
    time         = Column(String, default="08:00")
    notes        = Column(String, default="")
    active       = Column(Boolean, default=True)
    created_at   = Column(DateTime, server_default=func.now())
    user         = relationship("UserProfile", back_populates="medications")
    logs         = relationship("MedLog", back_populates="medication", cascade="all, delete-orphan")


class MedLog(Base):
    __tablename__ = "med_logs"
    id           = Column(Integer, primary_key=True, index=True)
    device_id    = Column(String, ForeignKey("user_profiles.device_id"), nullable=False, index=True)
    medication_id= Column(Integer, ForeignKey("medications.id"), nullable=False)
    taken        = Column(Boolean, default=True)
    date         = Column(String, nullable=False)
    time_taken   = Column(String, default="")
    notes        = Column(String, default="")
    created_at   = Column(DateTime, server_default=func.now())
    user         = relationship("UserProfile", back_populates="med_logs")
    medication   = relationship("Medication", back_populates="logs")


class Badge(Base):
    __tablename__ = "badges"
    id           = Column(Integer, primary_key=True, index=True)
    device_id    = Column(String, ForeignKey("user_profiles.device_id"), nullable=False, index=True)
    badge_id     = Column(String, nullable=False)
    earned_at    = Column(DateTime, server_default=func.now())
    user         = relationship("UserProfile", back_populates="badges")


class HealthRecord(Base):
    __tablename__ = "health_records"
    id           = Column(Integer, primary_key=True, index=True)
    device_id    = Column(String, nullable=False, index=True)
    type         = Column(String, nullable=False)   # bp, sugar, weight, etc.
    value        = Column(String, nullable=False)
    unit         = Column(String, default="")
    notes        = Column(String, default="")
    date         = Column(String, nullable=False)
    created_at   = Column(DateTime, server_default=func.now())
