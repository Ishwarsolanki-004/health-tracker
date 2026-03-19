# main.py — FastAPI application entry point

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import nutrition

from app.database.db import engine, Base
from app.routers import activities, nutrition, sleep, water, goals, profile

# Create all DB tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VitalTrack Pro API",
    description="Full-stack Health & Activity Tracker Backend",
    version="1.0.0"
)

# ── CORS: allow React frontend to call this API ──────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────────────
app.include_router(activities.router)
app.include_router(nutrition.router)
app.include_router(sleep.router)
app.include_router(water.router)
app.include_router(goals.router)
app.include_router(profile.router)


@app.get("/")
def root():
    return {
        "message": "VitalTrack Pro API is running 🏃",
        "docs": "/docs",
        "endpoints": [
            "/activities", "/nutrition", "/sleep",
            "/water", "/goals", "/profile"
        ]
    }
