# 🏃 VitalTrack Pro — Full Stack Health Tracker

## Folder Structure
```
health-tracker/
├── backend/                  ← Python FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── database/db.py
│   │   ├── models/models.py
│   │   ├── schemas/schemas.py
│   │   └── routers/
│   │       ├── activities.py
│   │       ├── nutrition.py
│   │       ├── sleep.py
│   │       ├── water.py
│   │       ├── goals.py
│   │       └── profile.py
│   └── requirements.txt
├── frontend/                 ← React + Vite
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/api.js
│   │   ├── hooks/useHealth.js
│   │   ├── components/
│   │   │   ├── CircleProgress.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── WeekBar.jsx
│   │   │   └── Toast.jsx
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Activity.jsx
│   │       ├── Nutrition.jsx
│   │       ├── Sleep.jsx
│   │       ├── Progress.jsx
│   │       └── Goals.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Docs: http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173
