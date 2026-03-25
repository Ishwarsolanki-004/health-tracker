# schemas/ml_schemas.py — Pydantic schemas for ML API endpoints

from pydantic import BaseModel
from typing import List, Optional, Any


# ── Request schemas ──────────────────────────────────────────
class MLRequest(BaseModel):
    """Single request that carries all data needed for ML analysis."""
    # Activity data
    step_history:      List[float]       # last N days step counts
    calorie_burn_history: List[float]    # last N days calories burned

    # Nutrition data
    calorie_intake_history: List[float]  # last N days calorie intake

    # Sleep data
    sleep_history:     List[float]       # last N days sleep hours

    # Daily averages (for scoring)
    water_today:       float = 0.0
    goal_steps:        float = 10000
    goal_sleep:        float = 8.0
    goal_water:        float = 8.0
    goal_calories:     float = 2000

    # User profile
    weight_kg:         float = 70.0
    height_cm:         float = 170.0
    age:               int   = 25
    bmi:               Optional[float] = None

    # Activity types for recommendation variety check
    activity_types:    List[str] = []


# ── Response schemas ─────────────────────────────────────────
class PredictionResult(BaseModel):
    predictions: List[int]
    trend:       str
    slope:       float
    r2:          float
    confidence:  str


class AnomalyPoint(BaseModel):
    is_anomaly: bool
    score:      float
    method:     str
    direction:  str


class HealthScoreBreakdown(BaseModel):
    activity:  int
    sleep:     int
    hydration: int
    nutrition: int
    bmi:       int


class HealthScoreResult(BaseModel):
    score:     int
    grade:     str
    label:     str
    color:     str
    breakdown: HealthScoreBreakdown


class CalorieModelResult(BaseModel):
    balance:       int
    bmr:           int
    tdee:          int
    weight_change: float
    status:        str
    message:       str


class Recommendation(BaseModel):
    priority: str
    icon:     str
    color:    str
    title:    str
    body:     str
    action:   str


class MLResponse(BaseModel):
    """Full ML analysis response sent to the frontend."""
    health_score:    HealthScoreResult
    predictions:     PredictionResult
    anomalies:       List[AnomalyPoint]
    calorie_model:   CalorieModelResult
    recommendations: List[Recommendation]
    data_points:     int
    generated_at:    str
