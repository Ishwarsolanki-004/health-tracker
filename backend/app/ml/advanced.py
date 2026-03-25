"""
ml/advanced.py — Advanced ML models
- K-Means Clustering (user activity patterns)
- Correlation Analysis (sleep vs steps vs mood)
- Fatigue Index
- Weekly pattern detection
"""
import numpy as np
from typing import List, Dict
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings("ignore")


class ActivityClusterer:
    """
    K-Means clustering to group activity days into patterns:
    High-Active, Moderate, Low-Active, Rest days
    """
    def cluster(self, daily_data: List[Dict]) -> dict:
        if len(daily_data) < 4:
            return {"clusters": [], "message": "Need at least 4 days of data"}

        X = np.array([[d.get("steps",0), d.get("calories",0), d.get("duration",0)] for d in daily_data])
        scaler = StandardScaler()
        Xs = scaler.fit_transform(X)

        n_clusters = min(4, len(daily_data))
        km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = km.fit_predict(Xs)

        centers = scaler.inverse_transform(km.cluster_centers_)
        sorted_idx = np.argsort(centers[:, 0])[::-1]

        cluster_names = ["High Active", "Moderate Active", "Low Active", "Rest Day"]
        cluster_colors = ["22D3A5", "38BDF8", "FB923C", "6B7280"]

        result = []
        for rank, orig_idx in enumerate(sorted_idx):
            days_in_cluster = [daily_data[i] for i, l in enumerate(labels) if l == orig_idx]
            result.append({
                "cluster": cluster_names[rank],
                "color": cluster_colors[rank],
                "avg_steps": int(centers[orig_idx][0]),
                "avg_calories": int(centers[orig_idx][1]),
                "day_count": len(days_in_cluster),
                "days": [d.get("date","") for d in days_in_cluster]
            })

        return {"clusters": result, "total_days": len(daily_data)}


class CorrelationAnalyzer:
    """
    Pearson correlation between health metrics.
    Finds relationships like: more sleep → more steps, etc.
    """
    def analyze(self, data: List[Dict]) -> List[Dict]:
        if len(data) < 5:
            return []

        metrics = {
            "steps":    [d.get("steps", 0)    for d in data],
            "sleep":    [d.get("sleep", 0)     for d in data],
            "calories": [d.get("calories", 0)  for d in data],
            "water":    [d.get("water", 0)     for d in data],
        }

        pairs = [
            ("sleep",    "steps",    "Sleep → Steps",          "More sleep correlates with more steps"),
            ("water",    "steps",    "Hydration → Steps",      "Hydration level vs activity"),
            ("calories", "steps",    "Calories → Steps",       "Calories burned vs steps taken"),
            ("sleep",    "calories", "Sleep → Calories Burned","Sleep quality vs workout intensity"),
        ]

        results = []
        for m1, m2, label, desc in pairs:
            a, b = np.array(metrics[m1]), np.array(metrics[m2])
            if np.std(a) == 0 or np.std(b) == 0:
                continue
            corr = float(np.corrcoef(a, b)[0, 1])
            results.append({
                "label":       label,
                "description": desc,
                "correlation": round(corr, 3),
                "strength":    "strong" if abs(corr) > 0.6 else "moderate" if abs(corr) > 0.3 else "weak",
                "direction":   "positive" if corr > 0 else "negative",
                "insight":     _correlation_insight(m1, m2, corr)
            })

        return sorted(results, key=lambda x: abs(x["correlation"]), reverse=True)


def _correlation_insight(m1: str, m2: str, corr: float) -> str:
    if abs(corr) < 0.2:
        return f"No significant relationship found between {m1} and {m2}."
    direction = "increases" if corr > 0 else "decreases"
    strength  = "strongly" if abs(corr) > 0.6 else "moderately"
    return f"When {m1} goes up, {m2} {strength} {direction} (r={corr:.2f})."


class FatigueCalculator:
    """
    Calculates training load and fatigue index from recent activities.
    """
    def calculate(self, recent_activities: List[Dict], sleep_avg: float) -> Dict:
        if not recent_activities:
            return {"index": 0, "level": "Low", "color": "22D3A5", "advice": "No recent activity — start with light exercise!"}

        load = sum((a.get("duration", 0) * (a.get("calories", 0) or 50)) / 100 for a in recent_activities[:6])
        sleep_debt = max(0, 8 - sleep_avg) * 10
        index = min(100, round(load / 10 + sleep_debt))

        level  = "High"     if index > 70 else "Moderate" if index > 40 else "Low"
        color  = "ef4444"   if index > 70 else "FB923C"   if index > 40 else "22D3A5"
        advice = "Rest day strongly recommended — your body needs recovery" if index > 70 \
            else "Light exercise only — yoga or walking suggested" if index > 40 \
            else "You are well-rested and ready to train hard!"

        return {"index": index, "level": level, "color": color, "advice": advice}
