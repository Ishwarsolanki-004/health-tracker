# routers/auth.py — JWT Authentication (Register / Login / Me)

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import hashlib, secrets, json

from app.database.db import get_db
from app.models.models import User, Goal, Profile

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET = "vitaltrack_secret_key_change_in_production"
ALGO   = "HS256"
EXPIRE = 60 * 24  # 24 hours in minutes


# ── Simple token without PyJWT dependency ────────────────────
def create_token(user_id: int) -> str:
    payload = json.dumps({"sub": user_id, "exp": (datetime.utcnow() + timedelta(minutes=EXPIRE)).isoformat()})
    sig = hashlib.sha256((payload + SECRET).encode()).hexdigest()
    import base64
    return base64.urlsafe_b64encode(f"{payload}||{sig}".encode()).decode()

def decode_token(token: str) -> Optional[int]:
    try:
        import base64
        raw = base64.urlsafe_b64decode(token.encode()).decode()
        payload_str, sig = raw.rsplit("||", 1)
        expected = hashlib.sha256((payload_str + SECRET).encode()).hexdigest()
        if sig != expected: return None
        payload = json.loads(payload_str)
        if datetime.fromisoformat(payload["exp"]) < datetime.utcnow(): return None
        return payload["sub"]
    except: return None

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def verify_password(plain: str, hashed: str) -> bool:
    return hash_password(plain) == hashed


# ── Dependency: get current user ─────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Schemas ──────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email:    str
    password: str
    name:     Optional[str] = "User"

class LoginResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    username:     str
    name:         str


# ── Endpoints ────────────────────────────────────────────────
@router.post("/register", response_model=LoginResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(400, "Username already taken")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")

    user = User(username=payload.username, email=payload.email, hashed_pw=hash_password(payload.password))
    db.add(user); db.flush()

    # Create default goal + profile
    db.add(Goal(user_id=user.id))
    db.add(Profile(user_id=user.id, name=payload.name or payload.username))
    db.commit(); db.refresh(user)

    token = create_token(user.id)
    name  = db.query(Profile).filter(Profile.user_id == user.id).first()
    return LoginResponse(access_token=token, user_id=user.id, username=user.username, name=name.name if name else user.username)


@router.post("/login", response_model=LoginResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_pw):
        raise HTTPException(400, "Incorrect username or password")

    token   = create_token(user.id)
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    return LoginResponse(access_token=token, user_id=user.id, username=user.username, name=profile.name if profile else user.username)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}
