"""
Discounts Routes for Gamelo API
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from models.schemas import DiscountCodeCreate, DiscountCodeResponse, ApplyDiscountRequest
from utils.database import db, get_current_user, get_admin_user

router = APIRouter(tags=["Discounts"])


@router.post("/admin/discounts", response_model=DiscountCodeResponse)
async def create_discount_code(discount: DiscountCodeCreate, admin: dict = Depends(get_admin_user)):
    """Create a new discount code"""
    existing = await db.discount_codes.find_one({"code": discount.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="كود الخصم موجود مسبقاً")
    
    discount_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    discount_doc = {
        "id": discount_id,
        "code": discount.code.upper(),
        "name": discount.name or discount.code.upper(),
        "description": discount.description,
        "discount_type": discount.discount_type,
        "discount_value": discount.discount_value,
        "min_purchase": discount.min_purchase,
        "max_discount": discount.max_discount,
        "max_uses": discount.max_uses,
        "max_uses_per_user": discount.max_uses_per_user,
        "used_count": 0,
        "valid_from": discount.valid_from,
        "valid_until": discount.valid_until,
        "applicable_products": discount.applicable_products,
        "applicable_categories": discount.applicable_categories,
        "first_purchase_only": discount.first_purchase_only,
        "requires_min_items": discount.requires_min_items,
        # Affiliate fields
        "is_affiliate_coupon": discount.is_affiliate_coupon,
        "affiliate_id": discount.affiliate_id,
        "affiliate_name": discount.affiliate_name,
        "commission_type": discount.commission_type,
        "commission_value": discount.commission_value,
        "is_active": True,
        "created_by": admin["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.discount_codes.insert_one(discount_doc)
    return discount_doc


@router.get("/admin/discounts")
async def get_all_discounts(
    affiliate_only: bool = False,
    admin: dict = Depends(get_admin_user)
):
    """Get all discount codes with usage stats"""
    query = {}
    if affiliate_only:
        query["is_affiliate_coupon"] = True
    
    discounts = await db.discount_codes.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    for d in discounts:
        d.setdefault("name", d.get("code", ""))
        d.setdefault("description", "")
        d.setdefault("max_discount", None)
        d.setdefault("max_uses_per_user", 1)
        d.setdefault("first_purchase_only", False)
        d.setdefault("requires_min_items", 0)
        d.setdefault("is_affiliate_coupon", False)
        d.setdefault("affiliate_id", None)
        d.setdefault("affiliate_name", None)
        d.setdefault("commission_type", "percentage")
        d.setdefault("commission_value", 0)
        
        # Get affiliate stats if applicable
        if d.get("is_affiliate_coupon"):
            usage_stats = await db.discount_usage.aggregate([
                {"$match": {"discount_id": d["id"]}},
                {"$group": {
                    "_id": None,
                    "total_sales": {"$sum": "$order_total"},
                    "total_commission": {"$sum": "$affiliate_commission"}
                }}
            ]).to_list(1)
            
            if usage_stats:
                d["total_sales"] = usage_stats[0].get("total_sales", 0)
                d["total_commission"] = usage_stats[0].get("total_commission", 0)
            else:
                d["total_sales"] = 0
                d["total_commission"] = 0
    
    return discounts


@router.get("/admin/discounts/{discount_id}")
async def get_discount_details(discount_id: str, admin: dict = Depends(get_admin_user)):
    """Get discount code details with usage history"""
    discount = await db.discount_codes.find_one({"id": discount_id}, {"_id": 0})
    if not discount:
        raise HTTPException(status_code=404, detail="كود الخصم غير موجود")
    
    usage = await db.discount_usage.find({"discount_id": discount_id}, {"_id": 0}).sort("used_at", -1).limit(50).to_list(50)
    discount["usage_history"] = usage
    return discount


@router.put("/admin/discounts/{discount_id}")
async def update_discount(discount_id: str, updates: Dict[str, Any], admin: dict = Depends(get_admin_user)):
    """Update discount code"""
    allowed = {
        "is_active", "max_uses", "max_uses_per_user", "valid_until", "valid_from",
        "discount_value", "min_purchase", "max_discount", "name", "description",
        "applicable_products", "applicable_categories", "first_purchase_only", "requires_min_items"
    }
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="لا توجد تحديثات صالحة")
    
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.discount_codes.update_one({"id": discount_id}, {"$set": filtered})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="كود الخصم غير موجود")
    
    return {"message": "تم تحديث كود الخصم"}


@router.delete("/admin/discounts/{discount_id}")
async def delete_discount(discount_id: str, admin: dict = Depends(get_admin_user)):
    """Deactivate discount code"""
    result = await db.discount_codes.update_one(
        {"id": discount_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="كود الخصم غير موجود")
    
    return {"message": "تم حذف كود الخصم"}


@router.post("/discounts/apply")
async def apply_discount_code(request: ApplyDiscountRequest, user: dict = Depends(get_current_user)):
    """Validate and apply discount code"""
    code = request.code.upper()
    
    discount = await db.discount_codes.find_one({"code": code, "is_active": True}, {"_id": 0})
    
    if not discount:
        raise HTTPException(status_code=404, detail="كود الخصم غير صالح")
    
    now = datetime.now(timezone.utc)
    
    # Check validity period
    if discount.get("valid_from"):
        valid_from = datetime.fromisoformat(discount["valid_from"].replace("Z", "+00:00"))
        if now < valid_from:
            raise HTTPException(status_code=400, detail="كود الخصم غير فعال بعد")
    
    if discount.get("valid_until"):
        valid_until = datetime.fromisoformat(discount["valid_until"].replace("Z", "+00:00"))
        if now > valid_until:
            raise HTTPException(status_code=400, detail="انتهت صلاحية كود الخصم")
    
    # Check max uses
    if discount.get("max_uses") and discount["used_count"] >= discount["max_uses"]:
        raise HTTPException(status_code=400, detail="تم استخدام كود الخصم الحد الأقصى من المرات")
    
    # Check per-user usage limit
    max_per_user = discount.get("max_uses_per_user", 1)
    user_usage = await db.discount_usage.count_documents({
        "discount_id": discount["id"],
        "user_id": user["id"]
    })
    if user_usage >= max_per_user:
        raise HTTPException(status_code=400, detail="لقد استخدمت هذا الكود من قبل")
    
    # Check first purchase only
    if discount.get("first_purchase_only", False):
        user_orders = await db.orders.count_documents({"user_id": user["id"]})
        if user_orders > 0:
            raise HTTPException(status_code=400, detail="هذا الكود للمشترين الجدد فقط")
    
    # Check minimum items
    min_items = discount.get("requires_min_items", 0)
    if request.item_count < min_items:
        raise HTTPException(status_code=400, detail=f"يتطلب هذا الكود {min_items} منتجات على الأقل")
    
    # Check minimum purchase
    if request.subtotal < discount["min_purchase"]:
        raise HTTPException(
            status_code=400, 
            detail=f"الحد الأدنى للشراء {discount['min_purchase']} د.أ"
        )
    
    # Calculate discount
    if discount["discount_type"] == "percentage":
        discount_amount = request.subtotal * (discount["discount_value"] / 100)
        if discount.get("max_discount"):
            discount_amount = min(discount_amount, discount["max_discount"])
    else:
        discount_amount = min(discount["discount_value"], request.subtotal)
    
    return {
        "valid": True,
        "code": code,
        "name": discount.get("name", code),
        "discount_type": discount["discount_type"],
        "discount_value": discount["discount_value"],
        "discount_amount": round(discount_amount, 2),
        "final_total": round(request.subtotal - discount_amount, 2)
    }
