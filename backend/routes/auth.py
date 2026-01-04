"""
Authentication Routes for Gamelo API
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
import uuid
import bcrypt
import jwt

from models.schemas import UserCreate, UserLogin, UserResponse, UserProfile, AuthResponse
from utils.database import db, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate, request: Request):
    """Register a new user"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    password_hash = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": password_hash,
        "name": user_data.name,
        "phone": user_data.phone,
        "role": "buyer",
        "is_active": True,
        "is_approved": True,
        "wallet_balance": 0.0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = jwt.encode({
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return AuthResponse(
        access_token=token,
        user=UserResponse(**user_doc)
    )


@router.post("/login", response_model=AuthResponse)
async def login(login_data: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": login_data.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    if not bcrypt.checkpw(login_data.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="الحساب معطل")
    
    token = jwt.encode({
        "sub": user["id"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return AuthResponse(
        access_token=token,
        user=UserResponse(**user)
    )


@router.get("/me", response_model=UserProfile)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(**user)
