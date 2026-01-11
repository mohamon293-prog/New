"""
Affiliates/Marketers Routes for Gamelo API
نظام المسوقين والمعلنين
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from models.schemas import AffiliateCreate, AffiliateResponse, AffiliateStats
from utils.database import db, get_admin_user

router = APIRouter(prefix="/admin/affiliates", tags=["Affiliates"])


# ============ Affiliate Management ============

@router.post("", response_model=AffiliateResponse)
async def create_affiliate(affiliate: AffiliateCreate, admin: dict = Depends(get_admin_user)):
    """Create a new affiliate/marketer"""
    # Check if email already exists
    existing = await db.affiliates.find_one({"email": affiliate.email})
    if existing:
        raise HTTPException(status_code=400, detail="البريد الإلكتروني مسجل مسبقاً")
    
    affiliate_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    affiliate_doc = {
        "id": affiliate_id,
        "name": affiliate.name,
        "email": affiliate.email,
        "phone": affiliate.phone,
        "company": affiliate.company,
        "notes": affiliate.notes,
        "is_active": True,
        "total_sales": 0,
        "total_commission": 0,
        "total_orders": 0,
        "created_by": admin["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.affiliates.insert_one(affiliate_doc)
    return affiliate_doc


@router.get("")
async def get_all_affiliates(admin: dict = Depends(get_admin_user)):
    """Get all affiliates with their stats"""
    affiliates = await db.affiliates.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get updated stats for each affiliate
    for aff in affiliates:
        # Get coupons for this affiliate
        coupons = await db.discount_codes.find(
            {"affiliate_id": aff["id"], "is_affiliate_coupon": True},
            {"_id": 0, "id": 1, "code": 1}
        ).to_list(100)
        
        coupon_ids = [c["id"] for c in coupons]
        
        # Get usage stats
        if coupon_ids:
            usage_stats = await db.discount_usage.aggregate([
                {"$match": {"discount_id": {"$in": coupon_ids}}},
                {"$group": {
                    "_id": None,
                    "total_orders": {"$sum": 1},
                    "total_sales": {"$sum": "$order_total"},
                    "total_commission": {"$sum": "$affiliate_commission"}
                }}
            ]).to_list(1)
            
            if usage_stats:
                aff["total_orders"] = usage_stats[0].get("total_orders", 0)
                aff["total_sales"] = usage_stats[0].get("total_sales", 0)
                aff["total_commission"] = usage_stats[0].get("total_commission", 0)
        
        aff["coupons_count"] = len(coupons)
    
    return affiliates


@router.get("/{affiliate_id}")
async def get_affiliate_details(affiliate_id: str, admin: dict = Depends(get_admin_user)):
    """Get affiliate details with full stats and order history"""
    affiliate = await db.affiliates.find_one({"id": affiliate_id}, {"_id": 0})
    if not affiliate:
        raise HTTPException(status_code=404, detail="المسوق غير موجود")
    
    # Get all coupons for this affiliate
    coupons = await db.discount_codes.find(
        {"affiliate_id": affiliate_id, "is_affiliate_coupon": True},
        {"_id": 0}
    ).to_list(100)
    
    coupon_ids = [c["id"] for c in coupons]
    affiliate["coupons"] = coupons
    
    # Get detailed usage history
    if coupon_ids:
        usage_history = await db.discount_usage.find(
            {"discount_id": {"$in": coupon_ids}},
            {"_id": 0}
        ).sort("used_at", -1).limit(100).to_list(100)
        
        # Enrich with order and product details
        for usage in usage_history:
            order = await db.orders.find_one({"id": usage.get("order_id")}, {"_id": 0, "items": 1, "total_jod": 1, "created_at": 1})
            if order:
                usage["order_details"] = order
        
        affiliate["usage_history"] = usage_history
        
        # Calculate totals
        total_sales = sum(u.get("order_total", 0) for u in usage_history)
        total_commission = sum(u.get("affiliate_commission", 0) for u in usage_history)
        store_profit = total_sales - total_commission
        
        affiliate["stats"] = {
            "total_usage": len(usage_history),
            "total_sales": round(total_sales, 2),
            "total_commission": round(total_commission, 2),
            "store_profit": round(store_profit, 2)
        }
    else:
        affiliate["usage_history"] = []
        affiliate["stats"] = {
            "total_usage": 0,
            "total_sales": 0,
            "total_commission": 0,
            "store_profit": 0
        }
    
    return affiliate


@router.put("/{affiliate_id}")
async def update_affiliate(
    affiliate_id: str,
    updates: Dict[str, Any],
    admin: dict = Depends(get_admin_user)
):
    """Update affiliate details"""
    allowed = {"name", "email", "phone", "company", "notes", "is_active"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="لا توجد تحديثات صالحة")
    
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.affiliates.update_one({"id": affiliate_id}, {"$set": filtered})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="المسوق غير موجود")
    
    return {"message": "تم تحديث بيانات المسوق"}


@router.delete("/{affiliate_id}")
async def delete_affiliate(affiliate_id: str, admin: dict = Depends(get_admin_user)):
    """Deactivate affiliate"""
    result = await db.affiliates.update_one(
        {"id": affiliate_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="المسوق غير موجود")
    
    # Also deactivate their coupons
    await db.discount_codes.update_many(
        {"affiliate_id": affiliate_id},
        {"$set": {"is_active": False}}
    )
    
    return {"message": "تم حذف المسوق"}


# ============ Affiliate Coupons ============

@router.post("/{affiliate_id}/coupons")
async def create_affiliate_coupon(
    affiliate_id: str,
    coupon_data: Dict[str, Any],
    admin: dict = Depends(get_admin_user)
):
    """Create a coupon for an affiliate"""
    # Check affiliate exists
    affiliate = await db.affiliates.find_one({"id": affiliate_id})
    if not affiliate:
        raise HTTPException(status_code=404, detail="المسوق غير موجود")
    
    # Check code doesn't exist
    code = coupon_data.get("code", "").upper()
    if not code:
        raise HTTPException(status_code=400, detail="كود الخصم مطلوب")
    
    existing = await db.discount_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=400, detail="كود الخصم موجود مسبقاً")
    
    discount_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    discount_doc = {
        "id": discount_id,
        "code": code,
        "name": coupon_data.get("name", code),
        "description": coupon_data.get("description", f"كوبون المسوق {affiliate['name']}"),
        "discount_type": coupon_data.get("discount_type", "percentage"),
        "discount_value": coupon_data.get("discount_value", 10),
        "min_purchase": coupon_data.get("min_purchase", 0),
        "max_discount": coupon_data.get("max_discount"),
        "max_uses": coupon_data.get("max_uses"),
        "max_uses_per_user": coupon_data.get("max_uses_per_user", 1),
        "used_count": 0,
        "valid_from": coupon_data.get("valid_from"),
        "valid_until": coupon_data.get("valid_until"),
        "applicable_products": coupon_data.get("applicable_products"),
        "applicable_categories": coupon_data.get("applicable_categories"),
        "first_purchase_only": coupon_data.get("first_purchase_only", False),
        "requires_min_items": coupon_data.get("requires_min_items", 0),
        # Affiliate specific
        "is_affiliate_coupon": True,
        "affiliate_id": affiliate_id,
        "affiliate_name": affiliate["name"],
        "commission_type": coupon_data.get("commission_type", "percentage"),
        "commission_value": coupon_data.get("commission_value", 5),  # Default 5%
        "is_active": True,
        "created_by": admin["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.discount_codes.insert_one(discount_doc)
    return discount_doc


@router.get("/{affiliate_id}/stats")
async def get_affiliate_stats(
    affiliate_id: str,
    period: str = "all",  # all, today, week, month
    admin: dict = Depends(get_admin_user)
):
    """Get detailed stats for an affiliate"""
    affiliate = await db.affiliates.find_one({"id": affiliate_id}, {"_id": 0})
    if not affiliate:
        raise HTTPException(status_code=404, detail="المسوق غير موجود")
    
    # Get coupons
    coupons = await db.discount_codes.find(
        {"affiliate_id": affiliate_id, "is_affiliate_coupon": True},
        {"_id": 0, "id": 1, "code": 1}
    ).to_list(100)
    
    coupon_ids = [c["id"] for c in coupons]
    
    # Date filter
    match_filter = {"discount_id": {"$in": coupon_ids}}
    now = datetime.now(timezone.utc)
    
    if period == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        match_filter["used_at"] = {"$gte": start_of_day.isoformat()}
    elif period == "week":
        from datetime import timedelta
        start_of_week = now - timedelta(days=7)
        match_filter["used_at"] = {"$gte": start_of_week.isoformat()}
    elif period == "month":
        from datetime import timedelta
        start_of_month = now - timedelta(days=30)
        match_filter["used_at"] = {"$gte": start_of_month.isoformat()}
    
    # Get usage
    usage = await db.discount_usage.find(match_filter, {"_id": 0}).sort("used_at", -1).to_list(500)
    
    # Calculate stats
    total_sales = sum(u.get("order_total", 0) for u in usage)
    total_commission = sum(u.get("affiliate_commission", 0) for u in usage)
    total_discount = sum(u.get("discount_amount", 0) for u in usage)
    store_profit = total_sales - total_commission - total_discount
    
    # Group by product
    products_sold = {}
    for u in usage:
        for item in u.get("products", []):
            pid = item.get("product_id")
            if pid:
                if pid not in products_sold:
                    products_sold[pid] = {
                        "product_id": pid,
                        "product_name": item.get("product_name", "غير معروف"),
                        "quantity": 0,
                        "revenue": 0
                    }
                products_sold[pid]["quantity"] += item.get("quantity", 1)
                products_sold[pid]["revenue"] += item.get("total", 0)
    
    return {
        "affiliate": affiliate,
        "period": period,
        "stats": {
            "total_usage": len(usage),
            "total_sales": round(total_sales, 2),
            "total_commission": round(total_commission, 2),
            "total_discount_given": round(total_discount, 2),
            "store_profit": round(store_profit, 2)
        },
        "products_sold": list(products_sold.values()),
        "recent_orders": usage[:20]
    }


# ============ Affiliate Dashboard (for affiliate users) ============

@router.get("/my/dashboard")
async def get_my_affiliate_dashboard(user: dict = Depends(get_admin_user)):
    """Get dashboard for logged-in affiliate user"""
    # Find affiliate by user email
    affiliate = await db.affiliates.find_one({"email": user["email"]}, {"_id": 0})
    if not affiliate:
        raise HTTPException(status_code=404, detail="لا يوجد حساب مسوق مرتبط بهذا البريد")
    
    return await get_affiliate_stats(affiliate["id"], "all", user)
