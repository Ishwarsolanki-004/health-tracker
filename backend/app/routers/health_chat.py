# routers/health_chat.py — Natural Language Health Chat using Claude AI

import httpx, json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from app.database.db import get_db
from app.models.models import Activity, Nutrition, SleepLog, WaterLog, Goal, UserProfile

router = APIRouter(prefix="/chat", tags=["Health Chat"])

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
CLAUDE_MODEL   = "claude-opus-4-5"


class ChatMessage(BaseModel):
    role:    str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    device_id: str
    message:   str
    history:   List[ChatMessage] = []


class ChatResponse(BaseModel):
    reply:   str
    suggestions: List[str] = []


def get_user_context(device_id: str, db: Session) -> str:
    """Build a health summary string for Claude to use as context."""
    today     = datetime.utcnow().date().isoformat()
    last7     = [(datetime.utcnow().date() - timedelta(days=i)).isoformat() for i in range(7)]

    acts      = db.query(Activity).filter(Activity.device_id == device_id).all()
    nuts      = db.query(Nutrition).filter(Nutrition.device_id == device_id).all()
    sleeps    = db.query(SleepLog).filter(SleepLog.device_id == device_id).all()
    waters    = db.query(WaterLog).filter(WaterLog.device_id == device_id).all()
    goals     = db.query(Goal).filter(Goal.device_id == device_id).first()
    profile   = db.query(UserProfile).filter(UserProfile.device_id == device_id).first()

    # Today's stats
    today_steps = sum(a.steps or 0    for a in acts  if a.date == today)
    today_cals  = sum(a.calories or 0 for a in acts  if a.date == today)
    today_calIn = sum(n.calories or 0 for n in nuts  if n.date == today)
    today_water = next((w.amount for w in waters if w.date == today), 0)
    today_sleep = next((s.duration for s in sleeps if s.date == today), 0)

    # 7-day averages
    avg_steps = sum(sum(a.steps or 0 for a in acts if a.date == d) for d in last7) / 7
    avg_sleep = sum(next((s.duration for s in sleeps if s.date == d), 0) for d in last7) / 7

    bmi = round(profile.weight / ((profile.height/100)**2), 1) if profile and profile.weight and profile.height else "N/A"

    return f"""
USER HEALTH DATA SUMMARY:
Profile: {profile.name if profile else 'User'}, Age: {profile.age if profile else '?'}, Weight: {profile.weight if profile else '?'}kg, Height: {profile.height if profile else '?'}cm, BMI: {bmi}

TODAY ({today}):
- Steps: {today_steps:,} (goal: {goals.steps if goals else 10000:,})
- Calories burned: {today_cals} kcal
- Calories intake: {today_calIn} kcal
- Water: {today_water}L (goal: {goals.water if goals else 8}L)
- Sleep last night: {today_sleep} hrs

7-DAY AVERAGES:
- Avg steps/day: {avg_steps:.0f}
- Avg sleep/night: {avg_sleep:.1f} hrs
- Total activities logged: {len(acts)}
- Total meals logged: {len(nuts)}

GOALS: Steps={goals.steps if goals else 10000}, Calories={goals.calories if goals else 2000}, Water={goals.water if goals else 8}L, Sleep={goals.sleep if goals else 8}hrs
"""


@router.post("/message", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    user_context = get_user_context(payload.device_id, db)

    system_prompt = f"""You are VitalTrack AI — a friendly, expert personal health coach and nutritionist.
You have access to the user's real health data shown below. Use it to give personalized, accurate advice.

{user_context}

Rules:
- Be conversational, warm, and encouraging
- Give specific advice based on THEIR actual data (mention their real numbers)
- Keep responses concise (3-5 sentences max unless asked for detail)
- Use emojis occasionally to make it friendly
- If asked about medical diagnoses, recommend consulting a doctor
- Suggest specific actionable steps
- Respond in the same language the user writes in (English or Hindi)"""

    messages = [{"role": m.role, "content": m.content} for m in payload.history]
    messages.append({"role": "user", "content": payload.message})

    headers = {"anthropic-version": "2023-06-01", "content-type": "application/json"}
    body = {"model": CLAUDE_MODEL, "max_tokens": 400, "system": system_prompt, "messages": messages}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(CLAUDE_API_URL, headers=headers, json=body)

    if resp.status_code != 200:
        return ChatResponse(reply="Sorry, I'm having trouble connecting. Please try again.", suggestions=[])

    reply = resp.json()["content"][0]["text"]

    # Generate quick reply suggestions based on context
    suggestions = [
        "How am I doing this week?",
        "What should I eat today?",
        "Am I getting enough sleep?",
        "Give me a workout tip",
    ]

    return ChatResponse(reply=reply, suggestions=suggestions)
