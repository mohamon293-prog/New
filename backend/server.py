"""
Gamelo API - Digital Game Codes Marketplace
Main Server Entry Point
"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import aiofiles
import shutil

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="Gamelo API", description="Digital Game Codes Marketplace API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)
(UPLOAD_DIR / "banners").mkdir(exist_ok=True)
(UPLOAD_DIR / "products").mkdir(exist_ok=True)

# Import routes
from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router
from routes.disputes import router as disputes_router
from routes.discounts import router as discounts_router
from routes.cms import router as cms_router

# Import models and utils
from models.schemas import (
    BannerCreate, BannerResponse, HomepageSectionCreate,
    WalletTransactionResponse, ReviewCreate, ReviewResponse,
    TicketCreate, TicketResponse, NotificationResponse
)
from models.constants import PLATFORMS
from utils.database import (
    get_current_user, get_admin_user, fernet
)

# Include routers
api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(orders_router)
api_router.include_router(admin_router)
api_router.include_router(disputes_router)
api_router.include_router(discounts_router)
api_router.include_router(cms_router)


# ==================== WALLET ENDPOINTS ====================

@api_router.get("/wallet/balance")
async def get_wallet_balance(user: dict = Depends(get_current_user)):
    """Get current wallet balance"""
    return {"balance": user.get("wallet_balance", 0)}


@api_router.get("/wallet/transactions", response_model=List[WalletTransactionResponse])
async def get_wallet_transactions(user: dict = Depends(get_current_user)):
    """Get wallet transaction history"""
    transactions = await db.wallet_transactions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return transactions


# ==================== REVIEW ENDPOINTS ====================

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, user: dict = Depends(get_current_user)):
    """Create a product review"""
    order = await db.orders.find_one({
        "id": review.order_id,
        "user_id": user["id"],
        "status": {"$in": ["completed", "delivered"]}
    })
    
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود أو غير مكتمل")
    
    product_id = order["items"][0]["product_id"]
    
    existing = await db.reviews.find_one({
        "user_id": user["id"],
        "order_id": review.order_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="لقد قمت بتقييم هذا الطلب مسبقاً")
    
    review_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    review_doc = {
        "id": review_id,
        "user_id": user["id"],
        "user_name": user.get("name", "مستخدم"),
        "product_id": product_id,
        "order_id": review.order_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": now
    }
    
    await db.reviews.insert_one(review_doc)
    
    # Update product rating
    reviews = await db.reviews.find({"product_id": product_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"rating": avg_rating, "review_count": len(reviews)}}
    )
    
    return review_doc


@api_router.get("/products/{product_id}/reviews", response_model=List[ReviewResponse])
async def get_product_reviews(product_id: str):
    """Get reviews for a product"""
    reviews = await db.reviews.find(
        {"product_id": product_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return reviews


# ==================== SUPPORT TICKET ENDPOINTS ====================

@api_router.post("/tickets", response_model=TicketResponse)
async def create_ticket(ticket: TicketCreate, user: dict = Depends(get_current_user)):
    """Create a support ticket"""
    ticket_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    ticket_doc = {
        "id": ticket_id,
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "subject": ticket.subject,
        "order_id": ticket.order_id,
        "status": "open",
        "priority": "normal",
        "messages": [{
            "id": str(uuid.uuid4()),
            "from": "user",
            "user_id": user["id"],
            "user_name": user.get("name"),
            "message": ticket.message,
            "created_at": now
        }],
        "created_at": now,
        "updated_at": now
    }
    
    await db.tickets.insert_one(ticket_doc)
    return ticket_doc


@api_router.get("/tickets", response_model=List[TicketResponse])
async def get_user_tickets(user: dict = Depends(get_current_user)):
    """Get current user's support tickets"""
    tickets = await db.tickets.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return tickets


# Admin Tickets
@api_router.get("/admin/tickets")
async def get_all_tickets(admin: dict = Depends(get_admin_user)):
    """Get all support tickets for admin"""
    tickets = await db.tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tickets


@api_router.patch("/admin/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    updates: Dict[str, Any],
    admin: dict = Depends(get_admin_user)
):
    """Update ticket status/priority"""
    allowed = {"status", "priority"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="لا توجد تحديثات صالحة")
    
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tickets.update_one({"id": ticket_id}, {"$set": filtered})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="التذكرة غير موجودة")
    
    return {"message": "تم تحديث التذكرة"}


@api_router.post("/admin/tickets/{ticket_id}/reply")
async def reply_to_ticket(
    ticket_id: str,
    message: str,
    admin: dict = Depends(get_admin_user)
):
    """Reply to a support ticket"""
    ticket = await db.tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="التذكرة غير موجودة")
    
    now = datetime.now(timezone.utc).isoformat()
    
    reply = {
        "id": str(uuid.uuid4()),
        "from": "admin",
        "user_id": admin["id"],
        "user_name": admin.get("name", "Admin"),
        "message": message,
        "created_at": now
    }
    
    await db.tickets.update_one(
        {"id": ticket_id},
        {
            "$push": {"messages": reply},
            "$set": {"status": "answered", "updated_at": now}
        }
    )
    
    # Notify user
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": ticket["user_id"],
        "title": "رد على تذكرتك",
        "message": f"تم الرد على تذكرتك: {ticket['subject']}",
        "type": "ticket",
        "is_read": False,
        "reference_id": ticket_id,
        "created_at": now
    })
    
    return {"message": "تم إرسال الرد"}


# ==================== STATIC DATA ====================

@api_router.get("/platforms")
async def get_platforms():
    """Get available platforms"""
    return PLATFORMS


# ==================== FILE SERVING ENDPOINT ====================

from fastapi.responses import FileResponse

@api_router.get("/uploads/{folder}/{filename}")
async def serve_upload(folder: str, filename: str):
    """Serve uploaded files with proper CORS headers"""
    if folder not in ["images", "banners", "products"]:
        raise HTTPException(status_code=400, detail="Invalid folder")
    
    filepath = UPLOAD_DIR / folder / filename
    
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine media type
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    media_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg", 
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        path=str(filepath),
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=31536000",
            "Access-Control-Allow-Origin": "*"
        }
    )


# ==================== FILE UPLOAD ENDPOINTS ====================

@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "images",
    admin: dict = Depends(get_admin_user)
):
    """Upload an image file"""
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="نوع الملف غير مدعوم")
    
    if file.size and file.size > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="حجم الملف كبير جداً (الحد الأقصى 5MB)")
    
    if folder not in ["images", "banners", "products"]:
        folder = "images"
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / folder / filename
    
    async with aiofiles.open(filepath, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    return {
        "url": f"/uploads/{folder}/{filename}",
        "filename": filename
    }


@api_router.delete("/upload/image")
async def delete_image(url: str, admin: dict = Depends(get_admin_user)):
    """Delete an uploaded image"""
    if not url.startswith("/uploads/"):
        raise HTTPException(status_code=400, detail="رابط غير صالح")
    
    filepath = ROOT_DIR / url.lstrip("/")
    
    if filepath.exists():
        filepath.unlink()
        return {"message": "تم حذف الصورة"}
    
    raise HTTPException(status_code=404, detail="الصورة غير موجودة")


# ==================== BANNER/SLIDER ENDPOINTS ====================

@api_router.get("/banners")
async def get_public_banners(position: Optional[str] = None):
    """Get active banners for public display"""
    now = datetime.now(timezone.utc).isoformat()
    
    query = {
        "is_active": True,
        "$or": [
            {"starts_at": None},
            {"starts_at": {"$lte": now}}
        ]
    }
    
    if position:
        query["position"] = position
    
    banners = await db.banners.find(query, {"_id": 0}).sort("priority", -1).to_list(20)
    
    # Filter out expired banners
    active_banners = []
    for banner in banners:
        if banner.get("ends_at") and banner["ends_at"] < now:
            continue
        active_banners.append(banner)
        # Increment view count
        await db.banners.update_one({"id": banner["id"]}, {"$inc": {"views": 1}})
    
    return active_banners


@api_router.post("/banners/{banner_id}/click")
async def track_banner_click(banner_id: str):
    """Track banner click"""
    await db.banners.update_one({"id": banner_id}, {"$inc": {"clicks": 1}})
    return {"message": "ok"}


@api_router.get("/admin/banners")
async def get_all_banners(admin: dict = Depends(get_admin_user)):
    """Get all banners for admin"""
    banners = await db.banners.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return banners


@api_router.post("/admin/banners", response_model=BannerResponse)
async def create_banner(banner: BannerCreate, admin: dict = Depends(get_admin_user)):
    """Create a new banner"""
    banner_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    banner_doc = {
        "id": banner_id,
        **banner.model_dump(),
        "clicks": 0,
        "views": 0,
        "created_at": now,
        "created_by": admin["id"]
    }
    
    await db.banners.insert_one(banner_doc)
    return banner_doc


@api_router.put("/admin/banners/{banner_id}")
async def update_banner(banner_id: str, banner: BannerCreate, admin: dict = Depends(get_admin_user)):
    """Update a banner"""
    result = await db.banners.update_one(
        {"id": banner_id},
        {"$set": {**banner.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="البانر غير موجود")
    
    return {"message": "تم تحديث البانر"}


@api_router.delete("/admin/banners/{banner_id}")
async def delete_banner(banner_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a banner"""
    result = await db.banners.delete_one({"id": banner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="البانر غير موجود")
    
    return {"message": "تم حذف البانر"}


# ==================== HOMEPAGE SECTIONS ENDPOINTS ====================

@api_router.get("/homepage/sections")
async def get_homepage_sections():
    """Get homepage sections with products"""
    sections = await db.homepage_sections.find(
        {"is_active": True}, {"_id": 0}
    ).sort("order", 1).to_list(20)
    
    for section in sections:
        products = []
        
        if section["section_type"] == "new_products":
            products = await db.products.find(
                {"is_active": True}, {"_id": 0}
            ).sort("created_at", -1).limit(section.get("max_items", 8)).to_list(10)
            
        elif section["section_type"] == "best_sellers":
            products = await db.products.find(
                {"is_active": True}, {"_id": 0}
            ).sort("sold_count", -1).limit(section.get("max_items", 8)).to_list(10)
            
        elif section["section_type"] == "featured":
            products = await db.products.find(
                {"is_active": True, "is_featured": True}, {"_id": 0}
            ).limit(section.get("max_items", 8)).to_list(10)
            
        elif section["section_type"] == "custom" and section.get("product_ids"):
            products = await db.products.find(
                {"id": {"$in": section["product_ids"]}, "is_active": True}, {"_id": 0}
            ).to_list(20)
        
        # Get stock counts
        for p in products:
            stock = await db.codes.count_documents({"product_id": p["id"], "is_sold": False})
            p["stock_count"] = stock
        
        section["products"] = products
    
    return sections


@api_router.get("/admin/homepage/sections")
async def get_admin_homepage_sections(admin: dict = Depends(get_admin_user)):
    """Get all homepage sections for admin"""
    sections = await db.homepage_sections.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    return sections


@api_router.post("/admin/homepage/sections")
async def create_homepage_section(section: HomepageSectionCreate, admin: dict = Depends(get_admin_user)):
    """Create a new homepage section"""
    section_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    section_doc = {
        "id": section_id,
        **section.model_dump(),
        "created_at": now
    }
    
    await db.homepage_sections.insert_one(section_doc)
    return section_doc


@api_router.put("/admin/homepage/sections/{section_id}")
async def update_homepage_section(section_id: str, section: HomepageSectionCreate, admin: dict = Depends(get_admin_user)):
    """Update a homepage section"""
    await db.homepage_sections.update_one({"id": section_id}, {"$set": section.model_dump()})
    return {"message": "تم تحديث القسم"}


@api_router.delete("/admin/homepage/sections/{section_id}")
async def delete_homepage_section(section_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a homepage section"""
    await db.homepage_sections.delete_one({"id": section_id})
    return {"message": "تم حذف القسم"}


@api_router.put("/admin/homepage/sections/reorder")
async def reorder_homepage_sections(order: List[str], admin: dict = Depends(get_admin_user)):
    """Reorder homepage sections"""
    for i, section_id in enumerate(order):
        await db.homepage_sections.update_one({"id": section_id}, {"$set": {"order": i}})
    return {"message": "تم إعادة ترتيب الأقسام"}


# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user: dict = Depends(get_current_user)):
    """Get user notifications"""
    notifications = await db.notifications.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    return notifications


@api_router.get("/notifications/count")
async def get_unread_notification_count(user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    count = await db.notifications.count_documents({"user_id": user["id"], "is_read": False})
    return {"count": count}


@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark notification as read"""
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"is_read": True}}
    )
    return {"message": "ok"}


@api_router.post("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "ok"}


@api_router.post("/admin/notifications/broadcast")
async def broadcast_notification(
    title: str,
    message: str,
    admin: dict = Depends(get_admin_user)
):
    """Send notification to all users"""
    users = await db.users.find({"is_active": True}, {"id": 1}).to_list(10000)
    now = datetime.now(timezone.utc).isoformat()
    
    notifications = []
    for user in users:
        notifications.append({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": title,
            "message": message,
            "type": "broadcast",
            "is_read": False,
            "created_at": now
        })
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return {"message": f"تم إرسال الإشعار لـ {len(notifications)} مستخدم"}


# ==================== SITE SETTINGS ====================

@api_router.get("/admin/settings")
async def get_site_settings(admin: dict = Depends(get_admin_user)):
    """Get site settings"""
    settings = await db.site_settings.find_one({"type": "general"}, {"_id": 0})
    
    if not settings:
        settings = {
            "type": "general",
            "site_name": "Gamelo",
            "site_name_en": "Gamelo",
            "site_description": "متجر الألعاب الرقمية",
            "site_description_en": "Digital Games Store",
            "contact_email": "",
            "contact_phone": "",
            "contact_whatsapp": "",
            "social_facebook": "",
            "social_twitter": "",
            "social_instagram": "",
            "logo_url": "",
            "favicon_url": "",
            "hero_image_url": "",
            "currency_jod": "د.أ",
            "currency_usd": "$"
        }
    
    return settings


@api_router.put("/admin/settings")
async def update_site_settings(settings: Dict[str, Any], admin: dict = Depends(get_admin_user)):
    """Update site settings"""
    settings["type"] = "general"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {"type": "general"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "تم تحديث الإعدادات"}


@api_router.get("/settings/public")
async def get_public_settings():
    """Get public site settings"""
    settings = await db.site_settings.find_one({"type": "general"}, {"_id": 0})
    
    if not settings:
        return {
            "site_name": "Gamelo",
            "site_name_en": "Gamelo",
            "site_description": "متجر الألعاب الرقمية",
            "logo_url": "",
            "hero_image_url": ""
        }
    
    public_fields = [
        "site_name", "site_name_en", "site_description", "site_description_en",
        "logo_url", "favicon_url", "hero_image_url",
        "contact_email", "contact_phone", "contact_whatsapp",
        "social_facebook", "social_twitter", "social_instagram"
    ]
    
    return {k: settings.get(k, "") for k in public_fields}


# ==================== USER ACTIVITY TRACKING ====================

@api_router.post("/activity/heartbeat")
async def activity_heartbeat(user: dict = Depends(get_current_user)):
    """Update user's last activity timestamp"""
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_activity": datetime.now(timezone.utc).isoformat()}}
    )
    return {"status": "ok"}


# ==================== ROOT ====================

@api_router.get("/")
async def root():
    """API root endpoint"""
    return {"message": "مرحباً بك في Gamelo API", "version": "2.0"}


@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Gamelo API is running"}


# Add CORS middleware (must be before static files mount)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router in app
app.include_router(api_router)

# Mount uploads directory
if UPLOAD_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database indexes on startup"""
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.products.create_index("id", unique=True)
        await db.categories.create_index("id", unique=True)
        await db.orders.create_index("id", unique=True)
        await db.orders.create_index("user_id")
        await db.codes.create_index("product_id")
        logger.info("Database indexes created")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
