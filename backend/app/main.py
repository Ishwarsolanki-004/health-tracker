from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import engine, Base
from app.routers import activities, nutrition, sleep, water, goals, profile
from app.routers import ml, users, gamification, medications, export, websocket, advanced

Base.metadata.create_all(bind=engine)

app = FastAPI(title="VitalTrack Pro API v4.0", version="4.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:3000","*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

for r in [users, activities, nutrition, sleep, water, goals, profile,
          ml, gamification, medications, export, websocket, advanced]:
    app.include_router(r.router)

@app.get("/")
def root():
    return {"app":"VitalTrack Pro v4.0","docs":"/docs"}
