"""
ml/engine.py — Python ML Engine for VitalTrack Pro
Uses: scikit-learn, numpy, pandas
Algorithms:
  - Linear Regression (step/sleep/calorie prediction)
  - IsolationForest (anomaly detection)
  - StandardScaler (feature normalization)
  - Health Score (weighted formula model)
  - Smart Recommendations (rule-based AI)
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional

# scikit-learn
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score

import warnings
warnings.filterwarnings("ignore")


# ── 1. Linear Regression Predictor ─────────────────────────────
class StepPredictor:
    """
    Trains a Linear Regression model on step history
    and predicts next N days.
    """
    def __init__(self):
        self.model   = LinearRegression()
        self.trained = False

    def train(self, step_values: List[float]):
        if len(step_values) < 2:
            self.trained = False
            return
        X = np.array(range(len(step_values))).reshape(-1, 1)
        y = np.array(step_values)
        self.model.fit(X, y)
        self.trained   = True
        self.n_points  = len(step_values)
        self._last_y   = y
        self._last_X   = X

    def predict_next(self, n_days: int = 3) -> dict:
        if not self.trained:
            return {"predictions": [], "trend": "stable", "slope": 0.0, "r2": 0.0}

        future_X = np.array(range(self.n_points, self.n_points + n_days)).reshape(-1, 1)
        preds    = self.model.predict(future_X)
        preds    = [max(0, int(p)) for p in preds]

        # R² score
        y_pred_train = self.model.predict(self._last_X)
        r2           = float(r2_score(self._last_y, y_pred_train))
        slope        = float(self.model.coef_[0])

        trend = "increasing" if slope > 100 else "decreasing" if slope < -100 else "stable"

        return {
            "predictions": preds,
            "trend":       trend,
            "slope":       round(slope, 2),
            "r2":          round(max(0.0, r2), 3),
            "confidence":  "high" if r2 > 0.7 else "medium" if r2 > 0.4 else "low"
        }


# ── 2. Anomaly Detector (IsolationForest) ──────────────────────
class AnomalyDetector:
    """
    Uses IsolationForest to detect anomalous days in step data.
    Falls back to Z-score when data is too small for IsolationForest.
    """
    def detect(self, values: List[float]) -> List[dict]:
        if len(values) < 2:
            return [{"is_anomaly": False, "score": 0.0, "method": "none"} for _ in values]

        arr = np.array(values).reshape(-1, 1)

        # Use IsolationForest when enough data, else Z-score
        if len(values) >= 5:
            clf = IsolationForest(contamination=0.2, random_state=42)
            clf.fit(arr)
            labels = clf.predict(arr)   # -1 = anomaly, 1 = normal
            scores = clf.decision_function(arr)
            return [
                {
                    "is_anomaly": bool(labels[i] == -1),
                    "score":      round(float(scores[i]), 3),
                    "method":     "isolation_forest",
                    "direction":  "high" if values[i] > np.mean(values) else "low"
                }
                for i in range(len(values))
            ]
        else:
            # Z-score fallback
            mean   = float(np.mean(arr))
            std    = float(np.std(arr)) or 1.0
            return [
                {
                    "is_anomaly": bool(abs((v - mean) / std) > 1.8),
                    "score":      round((v - mean) / std, 3),
                    "method":     "z_score",
                    "direction":  "high" if v > mean else "low"
                }
                for v in values
            ]


# ── 3. Health Score Calculator ─────────────────────────────────
class HealthScorer:
    """
    Weighted health score (0–100) based on:
      - Steps vs goal        (30 pts)
      - Sleep vs goal        (25 pts)
      - Hydration vs goal    (20 pts)
      - Calorie balance      (15 pts)
      - BMI                  (10 pts)
    """
    def calculate(
        self,
        steps_avg:   float,
        goal_steps:  float,
        sleep_avg:   float,
        goal_sleep:  float,
        water_avg:   float,
        goal_water:  float,
        cal_balance: float,
        bmi:         float,
    ) -> dict:
        s_activity  = min(30.0, (steps_avg  / max(goal_steps,  1)) * 30)
        s_sleep     = min(25.0, (sleep_avg  / max(goal_sleep,  1)) * 25)
        s_hydration = min(20.0, (water_avg  / max(goal_water,  1)) * 20)
        s_cal       = max(0.0, 15.0 - abs(cal_balance) / 100)
        s_bmi       = 10.0 if 18.5 <= bmi < 25 else 6.0 if 17 <= bmi < 30 else 2.0

        total = min(100, round(s_activity + s_sleep + s_hydration + s_cal + s_bmi))

        grade = "A" if total >= 85 else "B" if total >= 70 else "C" if total >= 55 else "D" if total >= 40 else "F"
        label = "Excellent" if total >= 85 else "Good" if total >= 70 else "Fair" if total >= 55 else "Needs Work"
        color = "#22d3a5" if total >= 85 else "#00ffe7" if total >= 70 else "#fb923c" if total >= 55 else "#ef4444"

        return {
            "score": total,
            "grade": grade,
            "label": label,
            "color": color,
            "breakdown": {
                "activity":   round(s_activity),
                "sleep":      round(s_sleep),
                "hydration":  round(s_hydration),
                "nutrition":  round(s_cal),
                "bmi":        round(s_bmi),
            }
        }


# ── 4. Calorie Balance Model ────────────────────────────────────
class CalorieModel:
    """
    Estimates BMR (Mifflin-StJeor), TDEE, calorie balance,
    and weekly weight change projection.
    """
    def calculate(
        self,
        cal_in:    float,
        cal_out:   float,
        weight_kg: float,
        height_cm: float = 170,
        age:       int   = 25,
    ) -> dict:
        # Mifflin-StJeor BMR (male formula as default)
        bmr  = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        tdee = bmr * 1.55  # moderate activity

        balance      = cal_in - cal_out
        weight_change = (balance * 7) / 7700   # kg per week

        status = "surplus" if balance > 300 else "deficit" if balance < -300 else "maintenance"

        return {
            "balance":       round(balance),
            "bmr":           round(bmr),
            "tdee":          round(tdee),
            "weight_change": round(weight_change, 2),
            "status":        status,
            "message": (
                f"Calorie surplus of {abs(round(balance))} kcal/day — "
                f"projected +{abs(round(weight_change,2))} kg/week"
                if status == "surplus" else
                f"Calorie deficit of {abs(round(balance))} kcal/day — "
                f"projected {round(weight_change,2)} kg/week"
                if status == "deficit" else
                "Calorie balance is near maintenance — great for weight stability!"
            )
        }


# ── 5. Smart Recommendation Engine ─────────────────────────────
class RecommendationEngine:
    """
    Rule-based AI that generates personalized recommendations
    from the user's health metrics.
    """
    def generate(
        self,
        steps_avg:    float,
        sleep_avg:    float,
        water_avg:    float,
        cal_balance:  float,
        bmi:          float,
        health_score: int,
        activity_types: List[str],
    ) -> List[dict]:
        recs = []

        # Steps
        if steps_avg < 5000:
            recs.append({"priority": "high",     "icon": "🦶", "color": "#ef4444",
                "title": "Increase Daily Steps",
                "body":  f"Your average is {int(steps_avg)} steps. Low activity increases health risks.",
                "action": "Add a 15-minute walk to your daily routine"})
        elif steps_avg < 8000:
            recs.append({"priority": "medium",   "icon": "🚶", "color": "#fb923c",
                "title": "Almost at Your Step Goal",
                "body":  f"{int(steps_avg)} steps/day — just a short walk away from 10K!",
                "action": "Add one extra 10-minute walk each day"})

        # Sleep
        if sleep_avg < 6:
            recs.append({"priority": "high",     "icon": "😴", "color": "#ef4444",
                "title": "Critical: Sleep Deficit",
                "body":  f"Only {sleep_avg:.1f} hrs/night — this seriously harms recovery and metabolism.",
                "action": "Set a consistent 10 PM bedtime alarm"})
        elif sleep_avg < 7:
            recs.append({"priority": "medium",   "icon": "🌙", "color": "#fb923c",
                "title": "Improve Sleep Duration",
                "body":  f"{sleep_avg:.1f} hrs/night. Optimal range is 7–9 hours.",
                "action": "Try going to bed 30 minutes earlier"})

        # Water
        if water_avg < 2:
            recs.append({"priority": "high",     "icon": "💧", "color": "#ef4444",
                "title": "Serious Dehydration Risk",
                "body":  f"Only {water_avg:.1f}L/day. Dehydration reduces performance by up to 20%.",
                "action": "Drink a glass of water every 2 hours"})
        elif water_avg < 5:
            recs.append({"priority": "medium",   "icon": "💧", "color": "#38bdf8",
                "title": "Increase Water Intake",
                "body":  f"{water_avg:.1f}L/day. Aim for your daily water goal consistently.",
                "action": "Keep a water bottle on your desk"})

        # Calorie balance
        if cal_balance > 500:
            recs.append({"priority": "medium",   "icon": "🔥", "color": "#fb923c",
                "title": "High Calorie Surplus",
                "body":  f"+{cal_balance} kcal/day → ~{cal_balance*7/7700:.1f} kg gain/week.",
                "action": "Reduce portion sizes or increase cardio activity"})
        elif cal_balance < -700:
            recs.append({"priority": "medium",   "icon": "⚠️", "color": "#fb923c",
                "title": "Large Calorie Deficit",
                "body":  f"{cal_balance} kcal deficit may cause muscle loss. Target –300 to –500 kcal.",
                "action": "Add a healthy protein-rich snack between meals"})

        # BMI
        if bmi > 27:
            recs.append({"priority": "medium",   "icon": "🏃", "color": "#38bdf8",
                "title": "Improve Body Composition",
                "body":  f"BMI {bmi} — combine HIIT cardio with strength training for best results.",
                "action": "Try HIIT 3× per week + 10K steps daily"})
        elif bmi < 18.5 and bmi > 0:
            recs.append({"priority": "medium",   "icon": "🥩", "color": "#22d3a5",
                "title": "Increase Calorie & Protein Intake",
                "body":  f"BMI {bmi} is below the healthy range. Focus on nutrient-dense foods.",
                "action": "Add protein to every meal — aim for 1.6g per kg body weight"})

        # Activity variety
        unique_types = list(set(activity_types))
        if len(unique_types) < 2 and len(activity_types) > 4:
            recs.append({"priority": "low",      "icon": "🎯", "color": "#a78bfa",
                "title": "Add Activity Variety",
                "body":  f"You mainly do {unique_types[0] if unique_types else 'one activity'}. Cross-training prevents plateaus.",
                "action": "Try yoga, swimming or cycling this week"})

        # Positive feedback
        if health_score >= 80:
            recs.append({"priority": "positive", "icon": "🏆", "color": "#22d3a5",
                "title": "Outstanding Health Habits!",
                "body":  f"Health score {health_score}/100 — you are in the top tier!",
                "action": "Keep up this excellent routine"})

        # Sort: high → medium → positive → low
        order = {"high": 0, "medium": 1, "positive": 2, "low": 3}
        recs.sort(key=lambda r: order.get(r["priority"], 2))
        return recs[:5]   # max 5 recommendations
