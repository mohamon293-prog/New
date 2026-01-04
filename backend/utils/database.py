"""
Database and shared utilities for Gamelo API
"""

from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from cryptography.fernet import Fernet
from pathlib import Path
from dotenv import load_dotenv
import os
import jwt
import secrets
import logging

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Encryption key for product codes
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY', Fernet.generate_key().decode())
fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

# Telegram Configuration
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.environ.get('TELEGRAM_CHAT_ID', '')

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)
(UPLOAD_DIR / "banners").mkdir(exist_ok=True)
(UPLOAD_DIR / "products").mkdir(exist_ok=True)

# Security
security = HTTPBearer(auto_error=False)

# Logger
logger = logging.getLogger(__name__)

# Import constants
from models.constants import ROLES, ROLE_PERMISSIONS, PERMISSIONS


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    if not credentials:
        raise HTTPException(status_code=401, detail="يجب تسجيل الدخول")
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="توكن غير صالح")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="المستخدم غير موجود")
        
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="الحساب معطل")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="انتهت صلاحية الجلسة")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="توكن غير صالح")


async def get_admin_user(user: dict = Depends(get_current_user)):
    """Get current admin user"""
    if user.get("role") not in ["admin", "support", "moderator", "readonly"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بالوصول")
    return user


def has_permission(user: dict, permission: str) -> bool:
    """Check if user has a specific permission"""
    role = user.get("role", "buyer")
    custom_permissions = user.get("permissions", [])
    if permission in custom_permissions:
        return True
    return permission in ROLE_PERMISSIONS.get(role, [])


def require_permission(permission: str):
    """Dependency to check permission"""
    async def check(user: dict = Depends(get_current_user)):
        if user.get("role") == "admin":
            return user
        if not has_permission(user, permission):
            raise HTTPException(status_code=403, detail=f"ليس لديك صلاحية: {permission}")
        return user
    return check
