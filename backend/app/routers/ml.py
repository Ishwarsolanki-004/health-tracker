# routers/ml.py — ML API endpoints

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.database.db import get_db
from app.models.models import Activity, Nutrition, SleepLog, WaterLog, Goal, UserProfile
from app.schemas.ml_schemas import MLRequest, MLResponse
from app.ml.engine import (
    StepPredictor,
    AnomalyDetector,
    HealthScorer,
    CalorieModel,
    RecommendationEngine,
)

router = APIRouter(prefix="/ml", tags=["ML Insights"])

# ── Helper: build last-N-days series from DB ─────────────────
def get_last_n_days(n: int):
    """Returns list of date strings for last N days (oldest first)."""
    today = datetime.utcnow().date()
    return [(today - timedelta(days=n - 1 - i)).isoformat() for i in range(n)]


# ── Main ML endpoint ─────────────────────────────────────────
@router.get("/insights", response_model=MLResponse)
def get_ml_insights(
    days: int = 14,       # how many days of history to use
    db: Session = Depends(get_db)
):
    """
    Pulls all health data from DB, runs ML models,
    returns full analysis in one response.
    """
    date_range = get_last_n_days(days)

    # ── Fetch data from DB ───────────────────────────────────
    activities = db.query(Activity).filter(Activity.date.in_(date_range)).all()
    nutrition  = db.query(Nutrition).filter(Nutrition.date.in_(date_range)).all()
    sleep_logs = db.query(SleepLog).filter(SleepLog.date.in_(date_range)).all()
    water_logs = db.query(WaterLog).filter(WaterLog.date.in_(date_range)).all()
    goals      = db.query(Goal).first()
    profile    = db.query(UserProfile).first()

    # Defaults if not configured
    g_steps    = goals.steps    if goals else 10000
    g_sleep    = goals.sleep    if goals else 8.0
    g_water    = goals.water    if goals else 8.0
    g_calories = goals.calories if goals else 2000
    weight_kg  = profile.weight if profile else 70.0
    height_cm  = profile.height if profile else 170.0
    age        = profile.age    if profile else 25

    # ── Build daily series (indexed by date) ────────────────
    step_map   = {}
    cal_map    = {}
    for act in activities:
        step_map[act.date]  = step_map.get(act.date, 0)  + (act.steps    or 0)
        cal_map[act.date]   = cal_map.get(act.date, 0)   + (act.calories or 0)

    calIn_map = {}
    for nut in nutrition:
        calIn_map[nut.date] = calIn_map.get(nut.date, 0) + (nut.calories or 0)

    sleep_map = {s.date: s.duration or 0 for s in sleep_logs}
    water_map = {w.date: w.amount   or 0 for w in water_logs}

    # Convert to ordered lists (oldest → newest)
    step_series   = [float(step_map.get(d, 0))   for d in date_range]
    cal_series    = [float(cal_map.get(d, 0))     for d in date_range]
    calIn_series  = [float(calIn_map.get(d, 0))   for d in date_range]
    sleep_series  = [float(sleep_map.get(d, 0))   for d in date_range]
    water_today   = float(water_map.get(date_range[-1], 0))

    # ── Compute averages ─────────────────────────────────────
    active_step_days  = [v for v in step_series  if v > 0]
    active_sleep_days = [v for v in sleep_series if v > 0]
    active_calin_days = [v for v in calIn_series if v > 0]

    steps_avg    = sum(active_step_days)  / len(active_step_days)  if active_step_days  else 0.0
    sleep_avg    = sum(active_sleep_days) / len(active_sleep_days) if active_sleep_days else 0.0
    cal_burn_avg = sum(cal_series) / days
    cal_in_avg   = sum(active_calin_days) / len(active_calin_days) if active_calin_days else 0.0

    # BMI
    bmi = round(weight_kg / ((height_cm / 100) ** 2), 1) if height_cm else 22.0

    # ── Run ML models ────────────────────────────────────────

    # 1. Linear Regression — step predictions
    predictor = StepPredictor()
    predictor.train(step_series)
    prediction_result = predictor.predict_next(n_days=3)

    # 2. Anomaly Detection — last 7 days
    detector      = AnomalyDetector()
    last7_steps   = step_series[-7:]
    anomaly_list  = detector.detect(last7_steps)

    # 3. Health Score
    scorer = HealthScorer()
    health_score = scorer.calculate(
        steps_avg   = steps_avg,
        goal_steps  = g_steps,
        sleep_avg   = sleep_avg,
        goal_sleep  = g_sleep,
        water_avg   = water_today,
        goal_water  = g_water,
        cal_balance = cal_in_avg - cal_burn_avg,
        bmi         = bmi,
    )

    # 4. Calorie Balance Model
    cal_model_result = CalorieModel().calculate(
        cal_in    = cal_in_avg,
        cal_out   = cal_burn_avg,
        weight_kg = weight_kg,
        height_cm = height_cm,
        age       = age,
    )

    # 5. Recommendations
    activity_types = [a.type for a in activities]
    recs = RecommendationEngine().generate(
        steps_avg     = steps_avg,
        sleep_avg     = sleep_avg,
        water_avg     = water_today,
        cal_balance   = cal_model_result["balance"],
        bmi           = bmi,
        health_score  = health_score["score"],
        activity_types = activity_types,
    )

    # ── Build response ───────────────────────────────────────
    return MLResponse(
        health_score    = health_score,
        predictions     = prediction_result,
        anomalies       = anomaly_list,
        calorie_model   = cal_model_result,
        recommendations = recs,
        data_points     = len(activities),
        generated_at    = datetime.utcnow().isoformat() + "Z",
    )


# ── Individual endpoints (optional granular access) ──────────
@router.get("/health-score")
def health_score_only(db: Session = Depends(get_db)):
    """Returns only the health score — fast endpoint for header widget."""
    date_range = get_last_n_days(7)
    activities = db.query(Activity).filter(Activity.date.in_(date_range)).all()
    sleep_logs = db.query(SleepLog).filter(SleepLog.date.in_(date_range)).all()
    water_logs = db.query(WaterLog).filter(WaterLog.date.in_(date_range)).all()
    goals      = db.query(Goal).first()
    profile    = db.query(UserProfile).first()

    steps_avg  = sum(a.steps or 0 for a in activities) / 7
    sleep_avg  = sum(s.duration or 0 for s in sleep_logs) / max(len(sleep_logs), 1)
    water_today= sum(w.amount or 0 for w in water_logs if w.date == date_range[-1])
    bmi = round((profile.weight / ((profile.height / 100) ** 2)), 1) if profile and profile.height else 22.0

    result = HealthScorer().calculate(
        steps_avg   = steps_avg,
        goal_steps  = goals.steps    if goals else 10000,
        sleep_avg   = sleep_avg,
        goal_sleep  = goals.sleep    if goals else 8.0,
        water_avg   = water_today,
        goal_water  = goals.water    if goals else 8.0,
        cal_balance = 0.0,
        bmi         = bmi,
    )
    return result


@router.get("/predictions")
def predictions_only(days: int = 14, db: Session = Depends(get_db)):
    """Returns only step predictions."""
    date_range = get_last_n_days(days)
    activities = db.query(Activity).filter(Activity.date.in_(date_range)).all()
    step_map   = {}
    for a in activities:
        step_map[a.date] = step_map.get(a.date, 0) + (a.steps or 0)
    series = [float(step_map.get(d, 0)) for d in date_range]
    p = StepPredictor()
    p.train(series)
    return p.predict_next(3)


@router.get("/anomalies")
def anomalies_only(db: Session = Depends(get_db)):
    """Returns anomaly detection on last 7 days."""
    date_range = get_last_n_days(7)
    activities = db.query(Activity).filter(Activity.date.in_(date_range)).all()
    step_map   = {}
    for a in activities:
        step_map[a.date] = step_map.get(a.date, 0) + (a.steps or 0)
    series = [float(step_map.get(d, 0)) for d in date_range]
    result = AnomalyDetector().detect(series)
    return {
        "days":     date_range,
        "values":   series,
        "analysis": result,
        "anomaly_days": [date_range[i] for i, r in enumerate(result) if r["is_anomaly"]]
    }
