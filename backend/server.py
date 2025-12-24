from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from cryptography.fernet import Fernet
import hashlib
import secrets

ROOT_DIR = Path(__file__).parent
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

# Create the main app
app = FastAPI(title="Gamelo API", description="Digital Game Codes Marketplace API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== PYDANTIC MODELS ====================

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_approved: bool
    created_at: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    wallet_balance: float
    created_at: str

# Category Models
class CategoryCreate(BaseModel):
    name: str
    name_en: str
    slug: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    order: int = 0

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    name_en: str
    slug: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    order: int
    is_active: bool

# Product Models
class ProductCreate(BaseModel):
    name: str
    name_en: str
    slug: str
    description: str
    description_en: Optional[str] = None
    category_id: str
    price_jod: float
    price_usd: float
    original_price_jod: Optional[float] = None
    original_price_usd: Optional[float] = None
    image_url: str
    platform: str  # playstation, xbox, steam, nintendo, etc.
    region: str = "عالمي"
    is_featured: bool = False

class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    name_en: str
    slug: str
    description: str
    description_en: Optional[str] = None
    category_id: str
    category_name: Optional[str] = None
    price_jod: float
    price_usd: float
    original_price_jod: Optional[float] = None
    original_price_usd: Optional[float] = None
    image_url: str
    platform: str
    region: str
    stock_count: int
    is_active: bool
    is_featured: bool
    rating: float
    review_count: int
    sold_count: int

# Product Code Models (Admin)
class ProductCodeCreate(BaseModel):
    product_id: str
    code: str

class ProductCodeBulkCreate(BaseModel):
    product_id: str
    codes: List[str]

# Order Models
class OrderCreate(BaseModel):
    product_id: str
    quantity: int = 1

class OrderItemResponse(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price_jod: float
    unit_price_usd: float
    codes: List[str] = []  # Revealed codes

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    items: List[OrderItemResponse]
    total_jod: float
    total_usd: float
    status: str
    created_at: str
    revealed_at: Optional[str] = None

# Wallet Models
class WalletTransactionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    amount: float
    currency: str
    type: str  # credit, debit
    reason: str
    reference_id: Optional[str] = None
    balance_after: float
    created_at: str

class AdminWalletCredit(BaseModel):
    user_id: str
    amount: float
    currency: str = "JOD"
    reason: str

# Review Models
class ReviewCreate(BaseModel):
    product_id: str
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

class ReviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    product_id: str
    order_id: str
    rating: int
    comment: str
    is_verified: bool
    created_at: str

# Support Ticket Models
class TicketCreate(BaseModel):
    subject: str
    message: str
    order_id: Optional[str] = None

class TicketResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    subject: str
    status: str
    created_at: str
    updated_at: str

# Auth Response
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="انتهت صلاحية الجلسة")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="رمز غير صالح")

def encrypt_code(code: str) -> str:
    return fernet.encrypt(code.encode()).decode()

def decrypt_code(encrypted_code: str) -> str:
    return fernet.decrypt(encrypted_code.encode()).decode()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="يجب تسجيل الدخول")
    
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="المستخدم غير موجود")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="الحساب معطل")
    
    return user

async def get_admin_user(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["admin", "employee"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك")
    return user

async def get_wallet_balance(user_id: str, currency: str = "JOD") -> float:
    """Calculate wallet balance from ledger transactions"""
    pipeline = [
        {"$match": {"user_id": user_id, "currency": currency}},
        {"$group": {"_id": None, "balance": {"$sum": "$amount"}}}
    ]
    result = await db.wallet_transactions.aggregate(pipeline).to_list(1)
    return result[0]["balance"] if result else 0.0

async def log_activity(user_id: str, action: str, details: dict, request: Request = None):
    """Log user activity"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "details": details,
        "ip_address": request.client.host if request else None,
        "user_agent": request.headers.get("user-agent") if request else None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.activity_logs.insert_one(log_entry)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=AuthResponse)
async def register(user_data: UserCreate, request: Request):
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": "buyer",
        "is_active": True,
        "is_approved": True,  # Auto-approve buyers
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user_doc)
    await log_activity(user_id, "register", {"email": user_data.email}, request)
    
    token = create_token(user_id, "buyer")
    
    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email.lower(),
            name=user_data.name,
            phone=user_data.phone,
            role="buyer",
            is_active=True,
            is_approved=True,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin, request: Request):
    user = await db.users.find_one({"email": credentials.email.lower()}, {"_id": 0})
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="بيانات الدخول غير صحيحة")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="الحساب معطل")
    
    await log_activity(user["id"], "login", {"email": credentials.email}, request)
    
    token = create_token(user["id"], user["role"])
    
    return AuthResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            phone=user.get("phone"),
            role=user["role"],
            is_active=user["is_active"],
            is_approved=user.get("is_approved", True),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(user: dict = Depends(get_current_user)):
    balance = await get_wallet_balance(user["id"])
    
    return UserProfile(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        phone=user.get("phone"),
        role=user["role"],
        wallet_balance=balance,
        created_at=user["created_at"]
    )

# ==================== CATEGORY ENDPOINTS ====================

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    categories = await db.categories.find(
        {"is_active": True}, 
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return categories

@api_router.post("/admin/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, user: dict = Depends(get_admin_user)):
    category_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    cat_doc = {
        "id": category_id,
        **category.model_dump(),
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.categories.insert_one(cat_doc)
    if "_id" in cat_doc:
        del cat_doc["_id"]
    return cat_doc

# ==================== PRODUCT ENDPOINTS ====================

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    platform: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {"is_active": True}
    
    if category:
        query["category_id"] = category
    if platform:
        query["platform"] = platform
    if featured:
        query["is_featured"] = True
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"name_en": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Get stock counts
    for product in products:
        stock = await db.product_codes.count_documents({
            "product_id": product["id"],
            "status": "unused"
        })
        product["stock_count"] = stock
        
        # Get category name
        if product.get("category_id"):
            cat = await db.categories.find_one({"id": product["category_id"]}, {"_id": 0, "name": 1})
            product["category_name"] = cat["name"] if cat else None
    
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "is_active": True}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    
    stock = await db.product_codes.count_documents({
        "product_id": product_id,
        "status": "unused"
    })
    product["stock_count"] = stock
    
    if product.get("category_id"):
        cat = await db.categories.find_one({"id": product["category_id"]}, {"_id": 0, "name": 1})
        product["category_name"] = cat["name"] if cat else None
    
    return product

@api_router.post("/admin/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, user: dict = Depends(get_admin_user)):
    product_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    prod_doc = {
        "id": product_id,
        **product.model_dump(),
        "is_active": True,
        "rating": 0.0,
        "review_count": 0,
        "sold_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.products.insert_one(prod_doc)
    prod_doc["stock_count"] = 0
    
    if prod_doc.get("category_id"):
        cat = await db.categories.find_one({"id": prod_doc["category_id"]}, {"_id": 0, "name": 1})
        prod_doc["category_name"] = cat["name"] if cat else None
    
    return prod_doc

# ==================== PRODUCT CODES (ADMIN) ====================

@api_router.post("/admin/codes")
async def add_product_code(code_data: ProductCodeCreate, user: dict = Depends(get_admin_user)):
    code_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    code_doc = {
        "id": code_id,
        "product_id": code_data.product_id,
        "encrypted_code": encrypt_code(code_data.code),
        "status": "unused",
        "added_by": user["id"],
        "created_at": now
    }
    
    await db.product_codes.insert_one(code_doc)
    return {"message": "تم إضافة الكود بنجاح", "id": code_id}

@api_router.post("/admin/codes/bulk")
async def add_product_codes_bulk(bulk_data: ProductCodeBulkCreate, user: dict = Depends(get_admin_user)):
    now = datetime.now(timezone.utc).isoformat()
    codes_to_insert = []
    
    for code in bulk_data.codes:
        code_id = str(uuid.uuid4())
        codes_to_insert.append({
            "id": code_id,
            "product_id": bulk_data.product_id,
            "encrypted_code": encrypt_code(code),
            "status": "unused",
            "added_by": user["id"],
            "created_at": now
        })
    
    if codes_to_insert:
        await db.product_codes.insert_many(codes_to_insert)
    
    return {"message": f"تم إضافة {len(codes_to_insert)} كود بنجاح"}

# ==================== ORDER ENDPOINTS ====================

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, request: Request, user: dict = Depends(get_current_user)):
    """Create order with atomic transaction"""
    user_id = user["id"]
    
    # Get product
    product = await db.products.find_one({"id": order_data.product_id, "is_active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    
    quantity = order_data.quantity
    total_jod = product["price_jod"] * quantity
    total_usd = product["price_usd"] * quantity
    
    # Check wallet balance
    balance = await get_wallet_balance(user_id, "JOD")
    if balance < total_jod:
        raise HTTPException(status_code=400, detail="رصيد المحفظة غير كافي")
    
    # Check and reserve codes atomically
    available_codes = await db.product_codes.find({
        "product_id": order_data.product_id,
        "status": "unused"
    }, {"_id": 0}).limit(quantity).to_list(quantity)
    
    if len(available_codes) < quantity:
        raise HTTPException(status_code=400, detail="الكمية المطلوبة غير متوفرة")
    
    order_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Reserve codes
    code_ids = [c["id"] for c in available_codes]
    await db.product_codes.update_many(
        {"id": {"$in": code_ids}},
        {"$set": {"status": "reserved", "order_id": order_id, "reserved_at": now}}
    )
    
    # Create wallet debit transaction
    tx_id = str(uuid.uuid4())
    new_balance = balance - total_jod
    
    wallet_tx = {
        "id": tx_id,
        "user_id": user_id,
        "amount": -total_jod,
        "currency": "JOD",
        "type": "debit",
        "reason": f"شراء {product['name']}",
        "reference_id": order_id,
        "balance_after": new_balance,
        "created_at": now
    }
    await db.wallet_transactions.insert_one(wallet_tx)
    
    # Create order
    order_doc = {
        "id": order_id,
        "user_id": user_id,
        "items": [{
            "product_id": product["id"],
            "product_name": product["name"],
            "quantity": quantity,
            "unit_price_jod": product["price_jod"],
            "unit_price_usd": product["price_usd"],
            "code_ids": code_ids
        }],
        "total_jod": total_jod,
        "total_usd": total_usd,
        "status": "completed",
        "created_at": now,
        "revealed_at": None
    }
    await db.orders.insert_one(order_doc)
    
    # Update codes to assigned
    await db.product_codes.update_many(
        {"id": {"$in": code_ids}},
        {"$set": {"status": "assigned", "user_id": user_id, "assigned_at": now}}
    )
    
    # Update product sold count
    await db.products.update_one(
        {"id": product["id"]},
        {"$inc": {"sold_count": quantity}}
    )
    
    await log_activity(user_id, "purchase", {"order_id": order_id, "product": product["name"]}, request)
    
    return OrderResponse(
        id=order_id,
        user_id=user_id,
        items=[OrderItemResponse(
            product_id=product["id"],
            product_name=product["name"],
            quantity=quantity,
            unit_price_jod=product["price_jod"],
            unit_price_usd=product["price_usd"],
            codes=[]  # Not revealed yet
        )],
        total_jod=total_jod,
        total_usd=total_usd,
        status="completed",
        created_at=now,
        revealed_at=None
    )

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_user_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    result = []
    for order in orders:
        items = []
        for item in order.get("items", []):
            # Get revealed codes if any
            codes = []
            if order.get("revealed_at"):
                code_docs = await db.product_codes.find(
                    {"id": {"$in": item.get("code_ids", [])}},
                    {"_id": 0, "encrypted_code": 1}
                ).to_list(100)
                codes = [decrypt_code(c["encrypted_code"]) for c in code_docs]
            
            items.append(OrderItemResponse(
                product_id=item["product_id"],
                product_name=item["product_name"],
                quantity=item["quantity"],
                unit_price_jod=item["unit_price_jod"],
                unit_price_usd=item["unit_price_usd"],
                codes=codes
            ))
        
        result.append(OrderResponse(
            id=order["id"],
            user_id=order["user_id"],
            items=items,
            total_jod=order["total_jod"],
            total_usd=order["total_usd"],
            status=order["status"],
            created_at=order["created_at"],
            revealed_at=order.get("revealed_at")
        ))
    
    return result

@api_router.post("/orders/{order_id}/reveal")
async def reveal_order_codes(order_id: str, request: Request, user: dict = Depends(get_current_user)):
    """One-time reveal of order codes"""
    order = await db.orders.find_one(
        {"id": order_id, "user_id": user["id"]},
        {"_id": 0}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    if order.get("revealed_at"):
        raise HTTPException(status_code=400, detail="تم كشف الأكواد مسبقاً")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Log reveal action with device info
    await db.reveal_logs.insert_one({
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "user_id": user["id"],
        "ip_address": request.client.host,
        "user_agent": request.headers.get("user-agent"),
        "revealed_at": now
    })
    
    # Update order
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"revealed_at": now}}
    )
    
    # Update codes to revealed
    for item in order.get("items", []):
        await db.product_codes.update_many(
            {"id": {"$in": item.get("code_ids", [])}},
            {"$set": {"status": "revealed", "revealed_at": now}}
        )
    
    # Get revealed codes
    revealed_codes = []
    for item in order.get("items", []):
        code_docs = await db.product_codes.find(
            {"id": {"$in": item.get("code_ids", [])}},
            {"_id": 0, "encrypted_code": 1}
        ).to_list(100)
        revealed_codes.extend([decrypt_code(c["encrypted_code"]) for c in code_docs])
    
    await log_activity(user["id"], "reveal_codes", {"order_id": order_id}, request)
    
    return {"codes": revealed_codes, "revealed_at": now}

# ==================== WALLET ENDPOINTS ====================

@api_router.get("/wallet/balance")
async def get_balance(user: dict = Depends(get_current_user)):
    balance_jod = await get_wallet_balance(user["id"], "JOD")
    balance_usd = await get_wallet_balance(user["id"], "USD")
    return {"jod": balance_jod, "usd": balance_usd}

@api_router.get("/wallet/transactions", response_model=List[WalletTransactionResponse])
async def get_wallet_transactions(user: dict = Depends(get_current_user)):
    transactions = await db.wallet_transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return transactions

@api_router.post("/admin/wallet/credit")
async def admin_credit_wallet(credit: AdminWalletCredit, request: Request, admin: dict = Depends(get_admin_user)):
    """Admin credits user wallet"""
    # Verify user exists
    target_user = await db.users.find_one({"id": credit.user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    current_balance = await get_wallet_balance(credit.user_id, credit.currency)
    new_balance = current_balance + credit.amount
    
    tx_id = str(uuid.uuid4())
    wallet_tx = {
        "id": tx_id,
        "user_id": credit.user_id,
        "amount": credit.amount,
        "currency": credit.currency,
        "type": "credit",
        "reason": credit.reason,
        "reference_id": None,
        "balance_after": new_balance,
        "created_at": now,
        "credited_by": admin["id"]
    }
    await db.wallet_transactions.insert_one(wallet_tx)
    
    # Log admin action
    await db.admin_actions.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin["id"],
        "action": "wallet_credit",
        "target_user_id": credit.user_id,
        "details": {"amount": credit.amount, "currency": credit.currency, "reason": credit.reason},
        "created_at": now
    })
    
    await log_activity(admin["id"], "admin_credit_wallet", {"target": credit.user_id, "amount": credit.amount}, request)
    
    return {"message": "تم شحن المحفظة بنجاح", "new_balance": new_balance}

# ==================== REVIEW ENDPOINTS ====================

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, user: dict = Depends(get_current_user)):
    # Verify user purchased this product
    order = await db.orders.find_one({
        "id": review.order_id,
        "user_id": user["id"],
        "items.product_id": review.product_id
    }, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=400, detail="يجب شراء المنتج أولاً لتقييمه")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({
        "user_id": user["id"],
        "order_id": review.order_id,
        "product_id": review.product_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="لقد قمت بتقييم هذا المنتج مسبقاً")
    
    review_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    review_doc = {
        "id": review_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "product_id": review.product_id,
        "order_id": review.order_id,
        "rating": review.rating,
        "comment": review.comment,
        "is_verified": True,
        "created_at": now
    }
    await db.reviews.insert_one(review_doc)
    
    # Update product rating
    pipeline = [
        {"$match": {"product_id": review.product_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    if result:
        await db.products.update_one(
            {"id": review.product_id},
            {"$set": {"rating": round(result[0]["avg"], 1), "review_count": result[0]["count"]}}
        )
    
    return review_doc

@api_router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find(
        {"product_id": product_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return reviews

# ==================== SUPPORT TICKET ENDPOINTS ====================

@api_router.post("/tickets", response_model=TicketResponse)
async def create_ticket(ticket: TicketCreate, user: dict = Depends(get_current_user)):
    ticket_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    ticket_doc = {
        "id": ticket_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "subject": ticket.subject,
        "status": "open",
        "messages": [{
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "message": ticket.message,
            "created_at": now
        }],
        "order_id": ticket.order_id,
        "created_at": now,
        "updated_at": now
    }
    await db.support_tickets.insert_one(ticket_doc)
    
    return TicketResponse(
        id=ticket_id,
        user_id=user["id"],
        user_name=user["name"],
        subject=ticket.subject,
        status="open",
        created_at=now,
        updated_at=now
    )

@api_router.get("/tickets", response_model=List[TicketResponse])
async def get_user_tickets(user: dict = Depends(get_current_user)):
    tickets = await db.support_tickets.find(
        {"user_id": user["id"]},
        {"_id": 0, "messages": 0}
    ).sort("created_at", -1).to_list(50)
    return tickets

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.patch("/admin/users/{user_id}")
async def update_user(user_id: str, updates: Dict[str, Any], admin: dict = Depends(get_admin_user)):
    # Only allow certain fields
    allowed = {"is_active", "is_approved", "role"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="لا توجد تحديثات صالحة")
    
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one({"id": user_id}, {"$set": filtered})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    # Log admin action
    await db.admin_actions.insert_one({
        "id": str(uuid.uuid4()),
        "admin_id": admin["id"],
        "action": "update_user",
        "target_user_id": user_id,
        "details": filtered,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "تم تحديث المستخدم"}

@api_router.get("/admin/orders")
async def get_all_orders(admin: dict = Depends(get_admin_user), skip: int = 0, limit: int = 50):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return orders

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({"is_active": True})
    total_codes = await db.product_codes.count_documents({"status": "unused"})
    
    # Revenue calculation
    pipeline = [
        {"$group": {"_id": None, "total_jod": {"$sum": "$total_jod"}, "total_usd": {"$sum": "$total_usd"}}}
    ]
    revenue = await db.orders.aggregate(pipeline).to_list(1)
    
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_products": total_products,
        "available_codes": total_codes,
        "revenue_jod": revenue[0]["total_jod"] if revenue else 0,
        "revenue_usd": revenue[0]["total_usd"] if revenue else 0
    }

# ==================== STATIC DATA ====================

@api_router.get("/platforms")
async def get_platforms():
    return [
        {"id": "playstation", "name": "بلايستيشن", "name_en": "PlayStation", "icon": "gamepad-2"},
        {"id": "xbox", "name": "إكس بوكس", "name_en": "Xbox", "icon": "gamepad"},
        {"id": "steam", "name": "ستيم", "name_en": "Steam", "icon": "monitor"},
        {"id": "nintendo", "name": "نينتندو", "name_en": "Nintendo", "icon": "gamepad-2"},
        {"id": "pc", "name": "ألعاب PC", "name_en": "PC Games", "icon": "monitor"},
        {"id": "mobile", "name": "ألعاب الجوال", "name_en": "Mobile", "icon": "smartphone"},
        {"id": "giftcards", "name": "بطاقات الهدايا", "name_en": "Gift Cards", "icon": "gift"}
    ]

@api_router.get("/")
async def root():
    return {"message": "مرحباً بك في Gamelo API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("id", unique=True)
    await db.products.create_index("slug")
    await db.products.create_index("category_id")
    await db.product_codes.create_index("id", unique=True)
    await db.product_codes.create_index([("product_id", 1), ("status", 1)])
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("user_id")
    await db.categories.create_index("id", unique=True)
    await db.categories.create_index("slug", unique=True)
    await db.wallet_transactions.create_index("user_id")
    await db.reviews.create_index([("product_id", 1), ("user_id", 1)])
    
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
