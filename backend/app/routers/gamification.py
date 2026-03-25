# routers/gamification.py — Badges, points, achievements

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
from app.database.db import get_db
from app.models.models import Badge, UserProfile, Activity, WaterLog, SleepLog

router = APIRouter(prefix="/gamification", tags=["Gamification"])

# All possible badges
ALL_BADGES = [
    {"id":"first_step",     "icon":"👟", "title":"First Step",        "desc":"Log your first activity",          "color":"22D3A5", "points":10},
    {"id":"step_1k",        "icon":"🦶", "title":"1K Steps",          "desc":"Walk 1,000 steps in a day",         "color":"00E5CC", "points":15},
    {"id":"step_10k",       "icon":"🏃", "title":"10K Hero",          "desc":"Reach 10,000 steps in a day",       "color":"00E5CC", "points":50},
    {"id":"step_streak_7",  "icon":"🔥", "title":"Week Warrior",      "desc":"7-day step streak",                 "color":"FB923C", "points":100},
    {"id":"step_streak_30", "icon":"⚡", "title":"Month Champion",    "desc":"30-day step streak",                "color":"F72585", "points":300},
    {"id":"hydration_hero", "icon":"💧", "title":"Hydration Hero",    "desc":"Hit water goal 7 days in a row",    "color":"38BDF8", "points":75},
    {"id":"sleep_master",   "icon":"😴", "title":"Sleep Master",      "desc":"Log 8+ hrs sleep for 5 days",       "color":"A78BFA", "points":60},
    {"id":"nutrition_pro",  "icon":"🥗", "title":"Nutrition Pro",     "desc":"Log all 3 meals for 7 days",        "color":"FB923C", "points":80},
    {"id":"variety_king",   "icon":"🎯", "title":"Variety King",      "desc":"Log 5 different activity types",    "color":"F72585", "points":50},
    {"id":"early_bird",     "icon":"🌅", "title":"Early Bird",        "desc":"Log activity before 8 AM",          "color":"FCD34D", "points":30},
    {"id":"century",        "icon":"💯", "title":"Century Club",      "desc":"Log 100 total activities",           "color":"22D3A5", "points":200},
    {"id":"health_score_a", "icon":"🏆", "title":"Health Score A",   "desc":"Achieve health score of 85+",        "color":"FCD34D", "points":150},
]

class BadgeOut(BaseModel):
    id: str
    icon: str
    title: str
    desc: str
    color: str
    points: int
    earned: bool = False
    earned_at: str = None


@router.get("/{device_id}/badges", response_model=List[BadgeOut])
def get_badges(device_id: str, db: Session = Depends(get_db)):
    earned = {b.badge_id: b.earned_at for b in db.query(Badge).filter(Badge.device_id == device_id).all()}
    result = []
    for b in ALL_BADGES:
        out = BadgeOut(**b)
        out.earned = b["id"] in earned
        if out.earned:
            out.earned_at = str(earned[b["id"]])
        result.append(out)
    return result


@router.post("/{device_id}/check-badges")
def check_and_award_badges(device_id: str, db: Session = Depends(get_db)):
    """Run badge check logic — call this after any activity is logged."""
    activities = db.query(Activity).filter(Activity.device_id == device_id).all()
    water_logs = db.query(WaterLog).filter(WaterLog.device_id == device_id).all()
    sleep_logs = db.query(SleepLog).filter(SleepLog.device_id == device_id).all()
    earned_ids = {b.badge_id for b in db.query(Badge).filter(Badge.device_id == device_id).all()}
    user       = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()

    new_badges = []
    points_earned = 0

    def award(badge_id):
        nonlocal points_earned
        if badge_id not in earned_ids:
            badge_def = next((b for b in ALL_BADGES if b["id"] == badge_id), None)
            if badge_def:
                db.add(Badge(device_id=device_id, badge_id=badge_id))
                earned_ids.add(badge_id)
                new_badges.append(badge_def["title"])
                points_earned += badge_def["points"]

    # Check first activity
    if activities:
        award("first_step")

    # Total activities
    if len(activities) >= 100:
        award("century")

    # 10K steps in a day
    step_days = {}
    for a in activities:
        step_days[a.date] = step_days.get(a.date, 0) + (a.steps or 0)
    if any(v >= 10000 for v in step_days.values()):
        award("step_10k")
    if any(v >= 1000 for v in step_days.values()):
        award("step_1k")

    # Variety — 5 different types
    types = {a.type for a in activities}
    if len(types) >= 5:
        award("variety_king")

    # Sleep 8+ hrs x5 days
    good_sleep = sum(1 for s in sleep_logs if (s.duration or 0) >= 8)
    if good_sleep >= 5:
        award("sleep_master")

    # Commit and update points
    if user and points_earned > 0:
        user.points = (user.points or 0) + points_earned
    db.commit()

    return {"new_badges": new_badges, "points_earned": points_earned}


@router.get("/{device_id}/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Global leaderboard across all device profiles."""
    users = db.query(UserProfile).order_by(UserProfile.points.desc()).limit(10).all()
    return [{"rank": i+1, "name": u.name, "avatar": u.avatar, "points": u.points or 0} for i, u in enumerate(users)]
