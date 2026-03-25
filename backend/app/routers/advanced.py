# routers/advanced.py — Health Risk + Body Composition endpoints

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import math

from app.database.db import get_db
from app.models.models import Activity, Nutrition, SleepLog, WaterLog, UserProfile, Goal
from app.ml.risk import HealthRiskPredictor

router = APIRouter(prefix="/advanced", tags=["Advanced"])


# ── Health Risk Predictor ────────────────────────────────────
class RiskOut(BaseModel):
    category: str
    level:    str
    score:    int
    color:    str
    icon:     str
    factors:  List[str]
    actions:  List[str]
    trend:    str

class RiskResponse(BaseModel):
    risks:           List[RiskOut]
    overall_score:   int
    overall_label:   str
    overall_color:   str
    generated_at:    str


@router.get("/risk/{device_id}", response_model=RiskResponse)
def get_health_risks(device_id: str, db: Session = Depends(get_db)):
    today   = datetime.utcnow().date().isoformat()
    last30  = [(datetime.utcnow().date() - timedelta(days=i)).isoformat() for i in range(30)]
    last7   = last30[:7]

    acts    = db.query(Activity).filter(Activity.device_id == device_id).all()
    nuts    = db.query(Nutrition).filter(Nutrition.device_id == device_id).all()
    sleeps  = db.query(SleepLog).filter(SleepLog.device_id == device_id).all()
    waters  = db.query(WaterLog).filter(WaterLog.device_id == device_id).all()
    profile = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()

    weight = profile.weight if profile else 70.0
    height = profile.height if profile else 170.0
    age    = profile.age    if profile else 25
    bmi    = round(weight / ((height/100)**2), 1) if height else 22.0

    # 7-day averages
    step_map = {}
    for a in acts:
        step_map[a.date] = step_map.get(a.date, 0) + (a.steps or 0)
    cal_burn_map = {}
    for a in acts:
        cal_burn_map[a.date] = cal_burn_map.get(a.date, 0) + (a.calories or 0)
    cal_in_map = {}
    for n in nuts:
        cal_in_map[n.date] = cal_in_map.get(n.date, 0) + (n.calories or 0)

    steps_avg    = sum(step_map.get(d, 0) for d in last7) / 7
    sleep_vals   = [next((s.duration for s in sleeps if s.date == d), 0) for d in last7]
    sleep_avg    = sum(v for v in sleep_vals if v > 0) / max(sum(1 for v in sleep_vals if v > 0), 1)
    sleep_std    = math.sqrt(sum((v - sleep_avg)**2 for v in sleep_vals) / 7) if sleep_avg > 0 else 0
    cal_burn_avg = sum(cal_burn_map.get(d, 0) for d in last7) / 7
    cal_in_avg   = sum(cal_in_map.get(d, 0) for d in last7) / 7
    cal_balance  = cal_in_avg - cal_burn_avg
    water_today  = next((w.amount for w in waters if w.date == today), 0)
    active_days  = len({a.date for a in acts if a.date in last30})

    # Mood average (simplified — 2.5 default if no mood data)
    mood_avg = 2.5

    predictor = HealthRiskPredictor()
    raw_risks = predictor.predict_all(
        bmi=bmi, age=age, steps_avg=steps_avg, sleep_avg=sleep_avg,
        water_avg=water_today, cal_balance=cal_balance,
        sleep_consistency=sleep_std, active_days=active_days,
        mood_avg=mood_avg, weight_kg=weight
    )

    overall = round(sum(r.score for r in raw_risks) / len(raw_risks))
    overall_label = "Critical" if overall >= 75 else "High Risk" if overall >= 50 else "Moderate" if overall >= 25 else "Healthy"
    overall_color = "#ef4444" if overall >= 75 else "#f97316" if overall >= 50 else "#eab308" if overall >= 25 else "#22d3a5"

    return RiskResponse(
        risks=[RiskOut(category=r.category, level=r.level, score=r.score, color=r.color,
                       icon=r.icon, factors=r.factors, actions=r.actions, trend=r.trend)
               for r in raw_risks],
        overall_score=overall,
        overall_label=overall_label,
        overall_color=overall_color,
        generated_at=datetime.utcnow().isoformat() + "Z"
    )


# ── Body Composition Tracker ─────────────────────────────────
class BodyEntry(BaseModel):
    device_id:    str
    weight:       float
    neck:         Optional[float] = None   # cm
    waist:        Optional[float] = None   # cm
    hip:          Optional[float] = None   # cm (women)
    wrist:        Optional[float] = None   # cm
    date:         Optional[str]   = None
    gender:       Optional[str]   = "male"

class BodyOut(BaseModel):
    bmi:              float
    bmi_category:     str
    body_fat_pct:     Optional[float]
    body_fat_kg:      Optional[float]
    lean_mass_kg:     Optional[float]
    fat_category:     str
    ideal_weight_low: float
    ideal_weight_high:float
    bmr:              float
    tdee:             float
    to_lose_500:      float    # kcal/day to lose 0.5kg/week
    to_gain_500:      float    # kcal/day to gain 0.5kg/week
    water_weight_pct: float
    visceral_estimate:str
    tips:             List[str]


@router.post("/body-composition", response_model=BodyOut)
def analyze_body(payload: BodyEntry, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.device_id == payload.device_id).first()
    height  = profile.height if profile else 170.0
    age     = profile.age    if profile else 25
    weight  = payload.weight
    gender  = payload.gender or "male"
    h_m     = height / 100

    # ── BMI ──────────────────────────────────────────────────
    bmi = round(weight / (h_m ** 2), 1)
    bmi_cat = ("Underweight" if bmi < 18.5 else "Normal weight" if bmi < 25
               else "Overweight" if bmi < 30 else "Obese Class I" if bmi < 35
               else "Obese Class II" if bmi < 40 else "Obese Class III")

    # ── Body Fat % — US Navy formula ─────────────────────────
    body_fat_pct = None
    if payload.waist and payload.neck:
        try:
            if gender == "male":
                body_fat_pct = round(
                    495 / (1.0324 - 0.19077 * math.log10(payload.waist - payload.neck)
                           + 0.15456 * math.log10(height)) - 450, 1)
            else:
                hip = payload.hip or payload.waist * 1.1
                body_fat_pct = round(
                    495 / (1.29579 - 0.35004 * math.log10(payload.waist + hip - payload.neck)
                           + 0.22100 * math.log10(height)) - 450, 1)
            body_fat_pct = max(3.0, min(60.0, body_fat_pct))
        except Exception:
            body_fat_pct = None

    # Fallback BMI-based estimation
    if body_fat_pct is None:
        if gender == "male":
            body_fat_pct = round(1.20 * bmi + 0.23 * age - 16.2, 1)
        else:
            body_fat_pct = round(1.20 * bmi + 0.23 * age - 5.4, 1)
        body_fat_pct = max(5.0, min(55.0, body_fat_pct))

    body_fat_kg  = round(weight * body_fat_pct / 100, 1)
    lean_mass_kg = round(weight - body_fat_kg, 1)

    # Fat category
    if gender == "male":
        fat_cat = ("Essential Fat" if body_fat_pct < 6 else "Athletic" if body_fat_pct < 14
                   else "Fitness" if body_fat_pct < 18 else "Acceptable" if body_fat_pct < 25
                   else "Obese")
    else:
        fat_cat = ("Essential Fat" if body_fat_pct < 14 else "Athletic" if body_fat_pct < 21
                   else "Fitness" if body_fat_pct < 25 else "Acceptable" if body_fat_pct < 32
                   else "Obese")

    # ── Ideal weight — Devine formula ────────────────────────
    if gender == "male":
        base = 50 + 2.3 * ((height / 2.54) - 60)
    else:
        base = 45.5 + 2.3 * ((height / 2.54) - 60)
    ideal_low  = round(max(40, base * 0.9), 1)
    ideal_high = round(base * 1.1, 1)

    # ── BMR — Mifflin-StJeor ─────────────────────────────────
    if gender == "male":
        bmr = round(10 * weight + 6.25 * height - 5 * age + 5)
    else:
        bmr = round(10 * weight + 6.25 * height - 5 * age - 161)
    tdee = round(bmr * 1.55)

    # Calorie targets
    to_lose = round(tdee - 500)   # lose 0.5 kg/week
    to_gain = round(tdee + 500)   # gain 0.5 kg/week

    # Water weight estimate
    water_pct = round(73 * (1 - body_fat_pct/100), 1)

    # Visceral fat estimate (simplified)
    if bmi < 25: visceral = "Low (Healthy)"
    elif bmi < 30: visceral = "Moderate — watch diet"
    else: visceral = "High — action needed"

    # Tips
    tips = []
    if body_fat_pct > (25 if gender=="male" else 32):
        tips.append("Aim for 150+ min cardio per week to reduce fat")
    if lean_mass_kg < weight * 0.7:
        tips.append("Add resistance training 2-3x/week to preserve muscle")
    if bmi < 18.5:
        tips.append("Increase calorie intake with protein-rich foods")
    if weight > ideal_high:
        tips.append(f"Target: lose {round(weight - ideal_high, 1)} kg to reach ideal range")
    if not tips:
        tips = ["Body composition is in a healthy range!", "Maintain with consistent exercise & balanced diet"]

    # Update profile weight
    if profile:
        profile.weight = weight
        db.commit()

    return BodyOut(
        bmi=bmi, bmi_category=bmi_cat,
        body_fat_pct=body_fat_pct, body_fat_kg=body_fat_kg, lean_mass_kg=lean_mass_kg,
        fat_category=fat_cat, ideal_weight_low=ideal_low, ideal_weight_high=ideal_high,
        bmr=bmr, tdee=tdee, to_lose_500=to_lose, to_gain_500=to_gain,
        water_weight_pct=water_pct, visceral_estimate=visceral, tips=tips
    )
