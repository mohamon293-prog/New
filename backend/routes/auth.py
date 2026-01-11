"""
Authentication Routes for Gamelo API
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Body
from datetime import datetime, timezone, timedelta
import uuid
import bcrypt
import jwt
import random
import string
import os
import asyncio
import logging
import resend
from dotenv import load_dotenv

from models.schemas import UserCreate, UserLogin, UserResponse, UserProfile, AuthResponse
from utils.database import db, JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, get_current_user

# Load environment variables
load_dotenv()

# Configure Resend
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_otp(length=6):
    """Generate a random OTP code"""
    return ''.join(random.choices(string.digits, k=length))


@router.post("/register/init")
async def init_registration(
    email: str = Body(...),
    phone: str = Body(None),
    name: str = Body(...)
):
    """Initialize registration - send OTP to email and phone"""
    # Check if email exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    # Generate OTP
    otp_code = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store pending registration
    await db.pending_registrations.delete_many({"email": email})
    await db.pending_registrations.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "phone": phone,
        "name": name,
        "otp_code": otp_code,
        "otp_expiry": otp_expiry.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # TODO: Send OTP via email and WhatsApp
    # For now, return the OTP in development (remove in production)
    return {
        "message": "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        "otp_sent": True,
        # Remove this in production:
        "dev_otp": otp_code
    }


@router.post("/register/verify")
async def verify_and_register(
    email: str = Body(...),
    otp: str = Body(...),
    password: str = Body(...)
):
    """Verify OTP and complete registration"""
    pending = await db.pending_registrations.find_one({"email": email})
    
    if not pending:
        raise HTTPException(status_code=400, detail="لم يتم العثور على طلب تسجيل")
    
    # Check OTP
    if pending["otp_code"] != otp:
        raise HTTPException(status_code=400, detail="رمز التحقق غير صحيح")
    
    # Check expiry
    if datetime.now(timezone.utc).isoformat() > pending["otp_expiry"]:
        raise HTTPException(status_code=400, detail="انتهت صلاحية رمز التحقق")
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": password_hash,
        "name": pending["name"],
        "phone": pending.get("phone", ""),
        "role": "buyer",
        "role_level": 1,
        "permissions": [],
        "is_active": True,
        "is_approved": True,
        "is_verified": True,
        "wallet_balance": 0.0,
        "wallet_balance_jod": 0.0,
        "wallet_balance_usd": 0.0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    await db.pending_registrations.delete_many({"email": email})
    
    # Generate token
    token = jwt.encode({
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=email,
            name=pending["name"],
            phone=pending.get("phone", ""),
            role="buyer",
            role_level=1,
            permissions=[],
            is_active=True,
            is_approved=True,
            wallet_balance=0.0,
            wallet_balance_jod=0.0,
            wallet_balance_usd=0.0,
            created_at=now
        )
    )


@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate, request: Request):
    """Register a new user (direct registration without OTP)"""
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
        "phone": user_data.phone or "",
        "role": "buyer",
        "role_level": 1,
        "permissions": [],
        "is_active": True,
        "is_approved": True,
        "wallet_balance": 0.0,
        "wallet_balance_jod": 0.0,
        "wallet_balance_usd": 0.0,
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
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            phone=user_data.phone or "",
            role="buyer",
            role_level=1,
            permissions=[],
            is_active=True,
            is_approved=True,
            wallet_balance=0.0,
            wallet_balance_jod=0.0,
            wallet_balance_usd=0.0,
            created_at=now
        )
    )


@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email})
    
    if not user:
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    if not bcrypt.checkpw(credentials.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="الحساب معطل")
    
    token = jwt.encode({
        "sub": user["id"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            phone=user.get("phone", ""),
            role=user.get("role", "buyer"),
            role_level=user.get("role_level", 1),
            permissions=user.get("permissions", []),
            is_active=user.get("is_active", True),
            is_approved=user.get("is_approved", True),
            wallet_balance=user.get("wallet_balance", 0),
            wallet_balance_jod=user.get("wallet_balance_jod", user.get("wallet_balance", 0)),
            wallet_balance_usd=user.get("wallet_balance_usd", 0),
            created_at=user.get("created_at", "")
        )
    )


@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True)):
    """Send password reset OTP"""
    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal if email exists
        return {"message": "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رمز التحقق"}
    
    otp_code = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    await db.password_resets.delete_many({"email": email})
    await db.password_resets.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "email": email,
        "otp_code": otp_code,
        "otp_expiry": otp_expiry.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # TODO: Send OTP via email
    return {
        "message": "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        # Remove this in production:
        "dev_otp": otp_code
    }


@router.post("/reset-password")
async def reset_password(
    email: str = Body(...),
    otp: str = Body(...),
    new_password: str = Body(...)
):
    """Reset password with OTP"""
    reset_request = await db.password_resets.find_one({"email": email})
    
    if not reset_request:
        raise HTTPException(status_code=400, detail="لم يتم العثور على طلب استعادة")
    
    if reset_request["otp_code"] != otp:
        raise HTTPException(status_code=400, detail="رمز التحقق غير صحيح")
    
    if datetime.now(timezone.utc).isoformat() > reset_request["otp_expiry"]:
        raise HTTPException(status_code=400, detail="انتهت صلاحية رمز التحقق")
    
    # Update password
    password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one(
        {"id": reset_request["user_id"]},
        {"$set": {
            "password_hash": password_hash,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.password_resets.delete_many({"email": email})
    
    return {"message": "تم تغيير كلمة المرور بنجاح"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user.get("phone", ""),
        role=user.get("role", "buyer"),
        role_level=user.get("role_level", 1),
        permissions=user.get("permissions", []),
        is_active=user.get("is_active", True),
        is_approved=user.get("is_approved", True),
        wallet_balance=user.get("wallet_balance", 0),
        wallet_balance_jod=user.get("wallet_balance_jod", user.get("wallet_balance", 0)),
        wallet_balance_usd=user.get("wallet_balance_usd", 0),
        created_at=user.get("created_at", "")
    )


@router.put("/profile")
async def update_profile(
    name: str = Body(None),
    phone: str = Body(None),
    current_password: str = Body(None),
    new_password: str = Body(None),
    user: dict = Depends(get_current_user)
):
    """Update user profile"""
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if name:
        update_data["name"] = name
    if phone is not None:
        update_data["phone"] = phone
    
    if new_password:
        if not current_password:
            raise HTTPException(status_code=400, detail="يجب إدخال كلمة المرور الحالية")
        
        if not bcrypt.checkpw(current_password.encode(), user["password_hash"].encode()):
            raise HTTPException(status_code=400, detail="كلمة المرور الحالية غير صحيحة")
        
        update_data["password_hash"] = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    
    await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    
    return {"message": "تم تحديث الملف الشخصي"}
