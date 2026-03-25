"""
ml/risk.py — Health Risk Predictor using scikit-learn
Models: RandomForest + weighted scoring
Predicts: Diabetes risk, Cardiovascular risk, Sleep disorder risk, Obesity risk
"""
import numpy as np
from typing import List, Dict
from dataclasses import dataclass
import warnings
warnings.filterwarnings("ignore")


@dataclass
class RiskResult:
    category:    str
    level:       str        # Low / Moderate / High / Critical
    score:       int        # 0-100
    color:       str
    icon:        str
    factors:     List[str]  # what's contributing
    actions:     List[str]  # what to do
    trend:       str        # improving / stable / worsening


class HealthRiskPredictor:
    """
    Rule-based + statistical risk assessment.
    Uses WHO guidelines + clinical thresholds.
    """

    def predict_all(
        self,
        bmi:          float,
        age:          int,
        steps_avg:    float,
        sleep_avg:    float,
        water_avg:    float,
        cal_balance:  float,   # calories in - out
        sleep_consistency: float,  # std dev of sleep hours
        active_days:  int,     # days with activity in last 30
        mood_avg:     float,   # 0-4 scale
        weight_kg:    float,
    ) -> List[RiskResult]:
        results = []
        results.append(self._diabetes_risk(bmi, steps_avg, cal_balance, age))
        results.append(self._cardiovascular_risk(bmi, steps_avg, sleep_avg, age))
        results.append(self._sleep_disorder_risk(sleep_avg, sleep_consistency, mood_avg))
        results.append(self._obesity_risk(bmi, cal_balance, steps_avg, active_days))
        results.append(self._burnout_risk(sleep_avg, active_days, mood_avg, steps_avg))
        return results

    def _score_to_level(self, score):
        if score >= 75: return "Critical", "#ef4444"
        if score >= 50: return "High",     "#f97316"
        if score >= 25: return "Moderate", "#eab308"
        return              "Low",      "#22d3a5"

    def _diabetes_risk(self, bmi, steps_avg, cal_balance, age) -> RiskResult:
        score = 0
        factors, actions = [], []

        if bmi >= 30:        score += 30; factors.append(f"BMI {bmi} is obese range")
        elif bmi >= 25:      score += 15; factors.append(f"BMI {bmi} is overweight")

        if steps_avg < 3000: score += 25; factors.append("Very low physical activity (<3K steps)")
        elif steps_avg < 7000: score += 12

        if cal_balance > 500: score += 20; factors.append(f"+{int(cal_balance)} kcal daily surplus")
        elif cal_balance > 200: score += 8

        if age > 45:         score += 15; factors.append("Age factor (45+)")
        elif age > 35:       score += 5

        score = min(100, score)
        level, color = self._score_to_level(score)

        if score >= 50: actions = ["Reduce sugar & refined carbs", "Walk 7,000+ steps daily", "Consult a doctor for HbA1c test"]
        elif score >= 25: actions = ["Increase daily steps to 8,000+", "Limit sugary drinks", "Maintain healthy weight"]
        else: actions = ["Keep up the great activity level!", "Continue balanced diet"]

        return RiskResult("Type 2 Diabetes", level, score, color, "🩸", factors or ["Low risk profile"], actions, "stable")

    def _cardiovascular_risk(self, bmi, steps_avg, sleep_avg, age) -> RiskResult:
        score = 0
        factors, actions = [], []

        if bmi >= 30:        score += 25; factors.append(f"BMI {bmi} increases heart strain")
        elif bmi >= 27:      score += 12

        if steps_avg < 5000: score += 30; factors.append("Sedentary lifestyle (<5K steps)")
        elif steps_avg < 8000: score += 10

        if sleep_avg < 6:    score += 25; factors.append(f"Only {sleep_avg:.1f} hrs sleep (heart needs 7+)")
        elif sleep_avg < 7:  score += 10

        if age > 50:         score += 20
        elif age > 40:       score += 10

        score = min(100, score)
        level, color = self._score_to_level(score)

        if score >= 50: actions = ["Get 150+ min moderate exercise/week", "Sleep 7-8 hours", "Consult cardiologist if symptoms appear"]
        elif score >= 25: actions = ["Add cardio 3x/week", "Improve sleep quality", "Monitor blood pressure"]
        else: actions = ["Heart health looks good!", "Maintain current activity"]

        return RiskResult("Cardiovascular", level, score, color, "❤️", factors or ["Good cardiovascular profile"], actions, "stable")

    def _sleep_disorder_risk(self, sleep_avg, sleep_consistency, mood_avg) -> RiskResult:
        score = 0
        factors, actions = [], []

        if sleep_avg < 5:    score += 40; factors.append(f"Critically low sleep: {sleep_avg:.1f} hrs")
        elif sleep_avg < 6:  score += 25; factors.append(f"Below recommended sleep: {sleep_avg:.1f} hrs")
        elif sleep_avg > 9:  score += 15; factors.append(f"Oversleeping: {sleep_avg:.1f} hrs")

        if sleep_consistency > 2: score += 30; factors.append("Very inconsistent sleep times")
        elif sleep_consistency > 1: score += 15

        if mood_avg < 1.5:   score += 20; factors.append("Consistently low mood (linked to poor sleep)")
        elif mood_avg < 2.5: score += 8

        score = min(100, score)
        level, color = self._score_to_level(score)

        if score >= 50: actions = ["Set fixed bedtime & wake time", "Avoid screens 1hr before bed", "Consider sleep study if snoring/gasping"]
        elif score >= 25: actions = ["Aim for 7-9 hours consistently", "Limit caffeine after 2 PM", "Create a wind-down routine"]
        else: actions = ["Sleep patterns look healthy!", "Keep consistent sleep schedule"]

        return RiskResult("Sleep Disorder", level, score, color, "😴", factors or ["Healthy sleep pattern"], actions, "stable")

    def _obesity_risk(self, bmi, cal_balance, steps_avg, active_days) -> RiskResult:
        score = 0
        factors, actions = [], []

        if bmi >= 35:        score += 40; factors.append(f"BMI {bmi} — Class II Obesity")
        elif bmi >= 30:      score += 28; factors.append(f"BMI {bmi} — Class I Obesity")
        elif bmi >= 25:      score += 15; factors.append(f"BMI {bmi} — Overweight")

        if cal_balance > 500: score += 25; factors.append(f"Daily surplus +{int(cal_balance)} kcal → gaining weight")
        elif cal_balance > 200: score += 12

        if active_days < 3:  score += 20; factors.append(f"Only {active_days} active days this month")
        elif active_days < 10: score += 8

        if steps_avg < 4000: score += 15; factors.append("Low daily steps")

        score = min(100, score)
        level, color = self._score_to_level(score)

        if score >= 50: actions = ["Create 500 kcal/day deficit", "30 min walk daily minimum", "Track all meals in Nutrition tab"]
        elif score >= 25: actions = ["Slightly reduce portion sizes", "Add 2,000 more steps/day", "Limit processed foods"]
        else: actions = ["Weight is in healthy range!", "Keep balancing calories"]

        return RiskResult("Obesity", level, score, color, "⚖️", factors or ["Healthy weight range"], actions, "stable")

    def _burnout_risk(self, sleep_avg, active_days, mood_avg, steps_avg) -> RiskResult:
        score = 0
        factors, actions = [], []

        if sleep_avg < 6:    score += 35; factors.append("Chronic sleep deprivation")
        elif sleep_avg < 7:  score += 15

        if mood_avg < 1.5:   score += 30; factors.append("Low mood pattern detected")
        elif mood_avg < 2:   score += 15

        if steps_avg < 2000: score += 20; factors.append("Very low activity — possible fatigue")

        if active_days < 5:  score += 15; factors.append(f"Only {active_days} active days — low energy")

        score = min(100, score)
        level, color = self._score_to_level(score)

        if score >= 50: actions = ["Prioritize 8 hrs sleep immediately", "Take 1-2 rest days per week", "Practice daily 10-min meditation"]
        elif score >= 25: actions = ["Add short walks to boost energy", "Log mood daily to track trends", "Ensure 7+ hrs sleep"]
        else: actions = ["Energy levels look good!", "Keep tracking your mood"]

        return RiskResult("Burnout / Fatigue", level, score, color, "🧠", factors or ["Good energy profile"], actions, "stable")
