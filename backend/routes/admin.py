"""
Admin Routes for Gamelo API
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Body
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from models.schemas import WalletCreditRequest, TelegramSettings
from models.constants import ROLES, ROLE_PERMISSIONS, PERMISSIONS, PERMISSION_LABELS, ORDER_STATUSES
from utils.database import db, get_admin_user, logger, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
import httpx

router = APIRouter(prefix="/admin", tags=["Admin"])


# Helper function for audit logging
async def log_audit(admin: dict, action: str, entity_type: str, entity_id: str, changes: Dict, request: Request = None):
    """Log admin action to audit log"""
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": admin["id"],
        "user_name": admin.get("name"),
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "changes": changes,
        "ip_address": request.client.host if request else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


# Users Management
@router.get("/users")
async def get_all_users(admin: dict = Depends(get_admin_user)):
    """Get all users"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return users


@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    updates: Dict[str, Any],
    admin: dict = Depends(get_admin_user)
):
    """Update user details"""
    allowed = {"is_active", "is_approved", "name", "phone"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    
    if not filtered:
        raise HTTPException(status_code=400, detail="لا توجد تحديثات صالحة")
    
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one({"id": user_id}, {"$set": filtered})
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    return {"message": "تم تحديث المستخدم"}


# Wallet Management
@router.post("/wallet/credit")
async def credit_wallet(
    request: WalletCreditRequest,
    req: Request,
    admin: dict = Depends(get_admin_user)
):
    """Add credit to user wallet"""
    user = await db.users.find_one({"id": request.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update both wallet_balance fields
    await db.users.update_one(
        {"id": request.user_id},
        {"$inc": {
            "wallet_balance": request.amount,
            "wallet_balance_jod": request.amount,
            "wallet_balance_usd": request.amount * 1.41  # Approximate conversion
        }}
    )
    
    transaction_id = str(uuid.uuid4())
    await db.wallet_transactions.insert_one({
        "id": transaction_id,
        "user_id": request.user_id,
        "amount": request.amount,
        "type": "credit",
        "description": request.reason,
        "credited_by": admin["id"],
        "created_at": now
    })
    
    # Log audit
    await log_audit(admin, "wallet_credit", "user", request.user_id, {
        "amount": request.amount,
        "reason": request.reason
    }, req)
    
    return {"message": f"تم إضافة {request.amount} د.أ للمستخدم"}


# Stats
@router.get("/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get admin dashboard stats"""
    total_users = await db.users.count_documents({})
    total_products = await db.products.count_documents({"is_active": True})
    total_orders = await db.orders.count_documents({})
    
    # Revenue
    pipeline = [
        {"$match": {"status": {"$in": ["completed", "delivered"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_jod"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue
    }


# Roles & Permissions
@router.get("/roles")
async def get_roles(admin: dict = Depends(get_admin_user)):
    """Get all available roles and their permissions"""
    roles_list = []
    for role_id, role_data in ROLES.items():
        roles_list.append({
            "id": role_id,
            "name": role_data["name"],
            "level": role_data["level"],
            "description": role_data.get("description", ""),
            "permissions": ROLE_PERMISSIONS.get(role_id, [])
        })
    return roles_list


@router.get("/permissions")
async def get_permissions(admin: dict = Depends(get_admin_user)):
    """Get all available permissions"""
    return [{"id": p, "name": PERMISSION_LABELS.get(p, p)} for p in PERMISSIONS]


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    request: Request,
    role: str = Body(..., embed=True),
    admin: dict = Depends(get_admin_user)
):
    """Update user role"""
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح لك بتغيير الأدوار")
    
    if role not in ROLES:
        raise HTTPException(status_code=400, detail="دور غير صالح")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    old_role = user.get("role")
    now = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": {"role": role, "updated_at": now}})
    
    await log_audit(admin, "update_role", "user", user_id, {"old_role": old_role, "new_role": role}, request)
    
    return {"message": "تم تحديث دور المستخدم"}


@router.get("/users/{user_id}/permissions")
async def get_user_permissions(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get user's effective permissions"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    role = user.get("role", "buyer")
    role_permissions = ROLE_PERMISSIONS.get(role, [])
    custom_permissions = user.get("permissions", [])
    all_permissions = list(set(role_permissions + custom_permissions))
    
    return {
        "user_id": user_id,
        "role": role,
        "role_name": ROLES.get(role, {}).get("name", role),
        "role_permissions": role_permissions,
        "custom_permissions": custom_permissions,
        "effective_permissions": all_permissions
    }


@router.put("/users/{user_id}/permissions")
async def update_user_permissions(
    user_id: str,
    request: Request,
    permissions: List[str] = Body(..., embed=True),
    admin: dict = Depends(get_admin_user)
):
    """Update user's custom permissions"""
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح لك بتغيير الصلاحيات")
    
    invalid = [p for p in permissions if p not in PERMISSIONS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"صلاحيات غير صالحة: {', '.join(invalid)}")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    old_permissions = user.get("permissions", [])
    now = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": {"permissions": permissions, "updated_at": now}})
    
    await log_audit(admin, "update_permissions", "user", user_id, {
        "old_permissions": old_permissions,
        "new_permissions": permissions
    }, request)
    
    return {"message": "تم تحديث صلاحيات المستخدم"}


# Audit Logs
@router.get("/audit-logs")
async def get_audit_logs(
    page: int = 1,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get audit logs"""
    skip = (page - 1) * limit
    total = await db.audit_logs.count_documents({})
    
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "logs": logs,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


# Telegram Settings
@router.get("/telegram/settings")
async def get_telegram_settings(admin: dict = Depends(get_admin_user)):
    """Get Telegram notification settings"""
    settings = await db.site_settings.find_one({"type": "telegram"}, {"_id": 0})
    
    if not settings:
        return {
            "bot_token": TELEGRAM_BOT_TOKEN[:10] + "..." if TELEGRAM_BOT_TOKEN else "",
            "chat_id": TELEGRAM_CHAT_ID,
            "notify_new_orders": True,
            "notify_disputes": True,
            "notify_low_stock": True,
            "low_stock_threshold": 5,
            "is_configured": bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)
        }
    
    if settings.get("bot_token"):
        settings["bot_token"] = settings["bot_token"][:10] + "..."
    settings["is_configured"] = bool(settings.get("bot_token") and settings.get("chat_id"))
    
    return settings


@router.put("/telegram/settings")
async def update_telegram_settings(settings: TelegramSettings, admin: dict = Depends(get_admin_user)):
    """Update Telegram notification settings"""
    now = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {"type": "telegram"},
        {"$set": {
            "type": "telegram",
            "bot_token": settings.bot_token,
            "chat_id": settings.chat_id,
            "notify_new_orders": settings.notify_new_orders,
            "notify_disputes": settings.notify_disputes,
            "notify_low_stock": settings.notify_low_stock,
            "low_stock_threshold": settings.low_stock_threshold,
            "updated_at": now,
            "updated_by": admin["id"]
        }},
        upsert=True
    )
    
    return {"message": "تم حفظ إعدادات Telegram"}


@router.post("/telegram/test")
async def test_telegram_notification(admin: dict = Depends(get_admin_user)):
    """Send a test notification to Telegram"""
    settings = await db.site_settings.find_one({"type": "telegram"}, {"_id": 0})
    
    token = settings.get("bot_token") if settings else TELEGRAM_BOT_TOKEN
    chat_id = settings.get("chat_id") if settings else TELEGRAM_CHAT_ID
    
    if not token or not chat_id:
        raise HTTPException(status_code=400, detail="لم يتم تكوين Telegram")
    
    try:
        message = f"""✅ <b>اختبار إشعارات Gamelo</b>

تم إرسال هذه الرسالة بنجاح!
<b>المرسل:</b> {admin.get('name', 'Admin')}
<b>الوقت:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"""

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            })
            
            if response.status_code == 200:
                return {"message": "تم إرسال رسالة الاختبار بنجاح", "success": True}
            else:
                error_data = response.json()
                raise HTTPException(status_code=400, detail=f"فشل في إرسال الرسالة: {error_data.get('description', 'خطأ غير معروف')}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"خطأ في الاتصال: {str(e)}")


# Analytics
@router.get("/analytics/overview")
async def get_analytics_overview(admin: dict = Depends(get_admin_user)):
    """Get analytics overview"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    async def get_period_stats(start_date):
        start_str = start_date.isoformat()
        
        orders = await db.orders.find({
            "created_at": {"$gte": start_str},
            "status": {"$in": ["completed", "delivered"]}
        }).to_list(1000)
        
        revenue = sum(o.get("total_jod", 0) for o in orders)
        return {"orders": len(orders), "revenue": revenue}
    
    today_stats = await get_period_stats(today_start)
    week_stats = await get_period_stats(week_start)
    month_stats = await get_period_stats(month_start)
    
    total_users = await db.users.count_documents({})
    total_products = await db.products.count_documents({"is_active": True})
    total_orders = await db.orders.count_documents({})
    
    pipeline = [
        {"$match": {"status": {"$in": ["completed", "delivered"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_jod"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Top products
    top_products_pipeline = [
        {"$match": {"status": {"$in": ["completed", "delivered"]}}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "count": {"$sum": "$items.quantity"}, "name": {"$first": "$items.product_name"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_products = await db.orders.aggregate(top_products_pipeline).to_list(5)
    
    return {
        "today": today_stats,
        "week": week_stats,
        "month": month_stats,
        "totals": {
            "users": total_users,
            "products": total_products,
            "orders": total_orders,
            "revenue": total_revenue
        },
        "top_products": top_products
    }


@router.get("/analytics/chart")
async def get_analytics_chart(
    period: str = "week",
    admin: dict = Depends(get_admin_user)
):
    """Get chart data for analytics"""
    now = datetime.now(timezone.utc)
    
    if period == "week":
        days = 7
    elif period == "month":
        days = 30
    else:
        days = 7
    
    data = []
    for i in range(days):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        orders = await db.orders.find({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()},
            "status": {"$in": ["completed", "delivered"]}
        }).to_list(1000)
        
        revenue = sum(o.get("total_jod", 0) for o in orders)
        
        data.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "orders": len(orders),
            "revenue": revenue
        })
    
    return list(reversed(data))


# Online Users
@router.get("/users/online")
async def get_online_users(admin: dict = Depends(get_admin_user)):
    """Get currently online users"""
    threshold = datetime.now(timezone.utc) - timedelta(minutes=5)
    threshold_str = threshold.isoformat()
    
    online_users = await db.users.find(
        {"last_activity": {"$gte": threshold_str}},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "role": 1, "last_activity": 1}
    ).to_list(100)
    
    return {"online_users": online_users, "count": len(online_users)}



# Reset Analytics
@router.delete("/analytics/reset")
async def reset_analytics(
    period: str = "all",
    admin: dict = Depends(get_admin_user)
):
    """Reset analytics data"""
    if admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="غير مصرح لك بهذه العملية")
    
    now = datetime.now(timezone.utc)
    
    if period == "today":
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        cutoff = now - timedelta(days=7)
    elif period == "month":
        cutoff = now - timedelta(days=30)
    else:
        cutoff = None
    
    deleted_count = 0
    
    if cutoff:
        # Delete orders from the period
        result = await db.orders.delete_many({"created_at": {"$gte": cutoff.isoformat()}})
        deleted_count += result.deleted_count
        
        # Delete wallet transactions from the period
        await db.wallet_transactions.delete_many({"created_at": {"$gte": cutoff.isoformat()}})
    else:
        # Delete all orders and reset
        result = await db.orders.delete_many({})
        deleted_count = result.deleted_count
        
        await db.wallet_transactions.delete_many({})
        await db.audit_logs.delete_many({})
    
    return {
        "message": f"تم مسح التحليلات بنجاح",
        "deleted_orders": deleted_count
    }
