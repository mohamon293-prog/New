"""
CMS (Content Management System) Routes for Gamelo API
Manages static pages, FAQ, and knowledge base
"""

from fastapi import APIRouter, HTTPException, Depends, Body
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import re

from utils.database import db, get_admin_user

router = APIRouter(tags=["CMS"])


# ==================== PAGE MODELS ====================

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text


# ==================== STATIC PAGES ====================

@router.get("/pages")
async def get_public_pages():
    """Get all published pages for public"""
    pages = await db.cms_pages.find(
        {"is_published": True},
        {"_id": 0, "id": 1, "title": 1, "title_en": 1, "slug": 1, "icon": 1, "order": 1}
    ).sort("order", 1).to_list(50)
    return pages


@router.get("/pages/{slug}")
async def get_page_by_slug(slug: str):
    """Get a single page by slug"""
    page = await db.cms_pages.find_one(
        {"slug": slug, "is_published": True},
        {"_id": 0}
    )
    
    if not page:
        raise HTTPException(status_code=404, detail="الصفحة غير موجودة")
    
    # Increment view count
    await db.cms_pages.update_one({"slug": slug}, {"$inc": {"views": 1}})
    
    return page


# Admin Pages
@router.get("/admin/pages")
async def get_all_pages(admin: dict = Depends(get_admin_user)):
    """Get all pages for admin"""
    pages = await db.cms_pages.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return pages


@router.post("/admin/pages")
async def create_page(
    title: str = Body(...),
    title_en: str = Body(""),
    slug: str = Body(None),
    content: str = Body(...),
    content_en: str = Body(""),
    meta_description: str = Body(""),
    icon: str = Body(""),
    is_published: bool = Body(True),
    show_in_footer: bool = Body(True),
    show_in_menu: bool = Body(False),
    admin: dict = Depends(get_admin_user)
):
    """Create a new page"""
    page_slug = slug or slugify(title_en or title)
    
    # Check if slug exists
    existing = await db.cms_pages.find_one({"slug": page_slug})
    if existing:
        raise HTTPException(status_code=400, detail="هذا الرابط موجود مسبقاً")
    
    page_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get max order
    max_order = await db.cms_pages.find_one({}, sort=[("order", -1)])
    order = (max_order.get("order", 0) + 1) if max_order else 1
    
    page_doc = {
        "id": page_id,
        "title": title,
        "title_en": title_en,
        "slug": page_slug,
        "content": content,
        "content_en": content_en,
        "meta_description": meta_description,
        "icon": icon,
        "is_published": is_published,
        "show_in_footer": show_in_footer,
        "show_in_menu": show_in_menu,
        "order": order,
        "views": 0,
        "created_by": admin["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_pages.insert_one(page_doc)
    return page_doc


@router.put("/admin/pages/{page_id}")
async def update_page(
    page_id: str,
    updates: Dict[str, Any] = Body(...),
    admin: dict = Depends(get_admin_user)
):
    """Update a page"""
    allowed = {
        "title", "title_en", "slug", "content", "content_en",
        "meta_description", "icon", "is_published", "show_in_footer",
        "show_in_menu", "order"
    }
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="لا توجد تحديثات صالحة")
    
    # If slug is being updated, check uniqueness
    if "slug" in filtered:
        existing = await db.cms_pages.find_one({
            "slug": filtered["slug"],
            "id": {"$ne": page_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="هذا الرابط موجود مسبقاً")
    
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    filtered["updated_by"] = admin["id"]
    
    result = await db.cms_pages.update_one({"id": page_id}, {"$set": filtered})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="الصفحة غير موجودة")
    
    return {"message": "تم تحديث الصفحة"}


@router.delete("/admin/pages/{page_id}")
async def delete_page(page_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a page"""
    result = await db.cms_pages.delete_one({"id": page_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="الصفحة غير موجودة")
    
    return {"message": "تم حذف الصفحة"}


@router.put("/admin/pages/reorder")
async def reorder_pages(order: List[str] = Body(...), admin: dict = Depends(get_admin_user)):
    """Reorder pages"""
    for i, page_id in enumerate(order):
        await db.cms_pages.update_one({"id": page_id}, {"$set": {"order": i}})
    return {"message": "تم إعادة ترتيب الصفحات"}


# ==================== FAQ ====================

@router.get("/faq")
async def get_public_faq():
    """Get all published FAQ items"""
    faqs = await db.cms_faq.find(
        {"is_published": True},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return faqs


@router.get("/faq/categories")
async def get_faq_categories():
    """Get FAQ categories"""
    categories = await db.cms_faq.distinct("category")
    return categories


@router.get("/admin/faq")
async def get_all_faq(admin: dict = Depends(get_admin_user)):
    """Get all FAQ items for admin"""
    faqs = await db.cms_faq.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return faqs


@router.post("/admin/faq")
async def create_faq(
    question: str = Body(...),
    question_en: str = Body(""),
    answer: str = Body(...),
    answer_en: str = Body(""),
    category: str = Body("عام"),
    is_published: bool = Body(True),
    admin: dict = Depends(get_admin_user)
):
    """Create a new FAQ item"""
    faq_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    max_order = await db.cms_faq.find_one({}, sort=[("order", -1)])
    order = (max_order.get("order", 0) + 1) if max_order else 1
    
    faq_doc = {
        "id": faq_id,
        "question": question,
        "question_en": question_en,
        "answer": answer,
        "answer_en": answer_en,
        "category": category,
        "is_published": is_published,
        "order": order,
        "views": 0,
        "helpful_count": 0,
        "created_by": admin["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.cms_faq.insert_one(faq_doc)
    return faq_doc


@router.put("/admin/faq/{faq_id}")
async def update_faq(
    faq_id: str,
    updates: Dict[str, Any] = Body(...),
    admin: dict = Depends(get_admin_user)
):
    """Update a FAQ item"""
    allowed = {
        "question", "question_en", "answer", "answer_en",
        "category", "is_published", "order"
    }
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="لا توجد تحديثات صالحة")
    
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cms_faq.update_one({"id": faq_id}, {"$set": filtered})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    
    return {"message": "تم تحديث السؤال"}


@router.delete("/admin/faq/{faq_id}")
async def delete_faq(faq_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a FAQ item"""
    result = await db.cms_faq.delete_one({"id": faq_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="السؤال غير موجود")
    
    return {"message": "تم حذف السؤال"}


@router.post("/faq/{faq_id}/helpful")
async def mark_faq_helpful(faq_id: str):
    """Mark FAQ as helpful"""
    await db.cms_faq.update_one({"id": faq_id}, {"$inc": {"helpful_count": 1}})
    return {"message": "شكراً لتقييمك"}


# ==================== ANNOUNCEMENTS ====================

@router.get("/announcements")
async def get_active_announcements():
    """Get active announcements"""
    now = datetime.now(timezone.utc).isoformat()
    
    announcements = await db.cms_announcements.find({
        "is_active": True,
        "$or": [
            {"starts_at": None},
            {"starts_at": {"$lte": now}}
        ],
        "$or": [
            {"ends_at": None},
            {"ends_at": {"$gte": now}}
        ]
    }, {"_id": 0}).sort("priority", -1).to_list(10)
    
    return announcements


@router.get("/admin/announcements")
async def get_all_announcements(admin: dict = Depends(get_admin_user)):
    """Get all announcements for admin"""
    announcements = await db.cms_announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return announcements


@router.post("/admin/announcements")
async def create_announcement(
    title: str = Body(...),
    message: str = Body(...),
    type: str = Body("info"),  # info, warning, success, error
    link: str = Body(""),
    is_active: bool = Body(True),
    is_dismissible: bool = Body(True),
    starts_at: str = Body(None),
    ends_at: str = Body(None),
    priority: int = Body(0),
    admin: dict = Depends(get_admin_user)
):
    """Create a new announcement"""
    announcement_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    announcement_doc = {
        "id": announcement_id,
        "title": title,
        "message": message,
        "type": type,
        "link": link,
        "is_active": is_active,
        "is_dismissible": is_dismissible,
        "starts_at": starts_at,
        "ends_at": ends_at,
        "priority": priority,
        "created_by": admin["id"],
        "created_at": now
    }
    
    await db.cms_announcements.insert_one(announcement_doc)
    return announcement_doc


@router.put("/admin/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    updates: Dict[str, Any] = Body(...),
    admin: dict = Depends(get_admin_user)
):
    """Update an announcement"""
    allowed = {
        "title", "message", "type", "link", "is_active",
        "is_dismissible", "starts_at", "ends_at", "priority"
    }
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="لا توجد تحديثات صالحة")
    
    result = await db.cms_announcements.update_one({"id": announcement_id}, {"$set": filtered})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")
    
    return {"message": "تم تحديث الإعلان"}


@router.delete("/admin/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, admin: dict = Depends(get_admin_user)):
    """Delete an announcement"""
    result = await db.cms_announcements.delete_one({"id": announcement_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="الإعلان غير موجود")
    
    return {"message": "تم حذف الإعلان"}
