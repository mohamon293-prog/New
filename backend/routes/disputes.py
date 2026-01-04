"""
Disputes Routes for Gamelo API
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from models.schemas import DisputeCreate
from utils.database import db, get_current_user, get_admin_user, logger, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
import httpx

router = APIRouter(tags=["Disputes"])


async def notify_new_dispute(dispute: dict):
    """Send notification for new dispute"""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    
    try:
        message = f"""<b>⚠️ نزاع جديد!</b>

<b>رقم النزاع:</b> #{dispute['id'][:8]}
<b>العميل:</b> {dispute.get('user_name', 'غير معروف')}
<b>السبب:</b> {dispute.get('reason', 'غير محدد')}
<b>الوصف:</b> {dispute.get('description', '')[:100]}...
<b>رقم الطلب:</b> #{dispute.get('order_id', '')[:8]}"""
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as client:
            await client.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            })
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")


@router.post("/disputes")
async def create_dispute(dispute: DisputeCreate, request: Request, user: dict = Depends(get_current_user)):
    """Create a new dispute"""
    order = await db.orders.find_one({"id": dispute.order_id, "user_id": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    existing = await db.disputes.find_one({"order_id": dispute.order_id, "status": {"$ne": "resolved"}})
    if existing:
        raise HTTPException(status_code=400, detail="يوجد نزاع مفتوح على هذا الطلب")
    
    dispute_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    dispute_doc = {
        "id": dispute_id,
        "order_id": dispute.order_id,
        "user_id": user["id"],
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "reason": dispute.reason,
        "description": dispute.description,
        "evidence_urls": dispute.evidence_urls or [],
        "status": "open",
        "messages": [{
            "id": str(uuid.uuid4()),
            "from": "user",
            "user_id": user["id"],
            "user_name": user.get("name"),
            "message": dispute.description,
            "created_at": now
        }],
        "created_at": now,
        "updated_at": now
    }
    
    await db.disputes.insert_one(dispute_doc)
    await db.orders.update_one({"id": dispute.order_id}, {"$set": {"status": "disputed"}})
    
    # Send Telegram notification
    telegram_settings = await db.site_settings.find_one({"type": "telegram"})
    if telegram_settings and telegram_settings.get("notify_disputes", True):
        await notify_new_dispute(dispute_doc)
    
    return {"message": "تم إنشاء النزاع", "id": dispute_id}


@router.get("/disputes")
async def get_user_disputes(user: dict = Depends(get_current_user)):
    """Get user's disputes"""
    disputes = await db.disputes.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return disputes


@router.get("/admin/disputes")
async def get_all_disputes(
    status: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Get all disputes for admin"""
    query = {}
    if status:
        query["status"] = status
    
    disputes = await db.disputes.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return disputes


@router.post("/admin/disputes/{dispute_id}/reply")
async def reply_to_dispute(
    dispute_id: str,
    message: str,
    admin: dict = Depends(get_admin_user)
):
    """Reply to a dispute"""
    dispute = await db.disputes.find_one({"id": dispute_id})
    if not dispute:
        raise HTTPException(status_code=404, detail="النزاع غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    
    reply = {
        "id": str(uuid.uuid4()),
        "from": "admin",
        "user_id": admin["id"],
        "user_name": admin.get("name", "Admin"),
        "message": message,
        "created_at": now
    }
    
    await db.disputes.update_one(
        {"id": dispute_id},
        {
            "$push": {"messages": reply},
            "$set": {"status": "in_progress", "updated_at": now}
        }
    )
    
    # Notify user
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": dispute["user_id"],
        "title": "رد على النزاع",
        "message": f"تم الرد على نزاعك #{dispute_id[:8]}",
        "type": "dispute",
        "is_read": False,
        "reference_id": dispute_id,
        "created_at": now
    })
    
    return {"message": "تم إرسال الرد"}


@router.post("/admin/disputes/{dispute_id}/resolve")
async def resolve_dispute(
    dispute_id: str,
    decision: str,
    admin_notes: str,
    admin: dict = Depends(get_admin_user)
):
    """Resolve a dispute"""
    if decision not in ["refund", "reject", "redeliver"]:
        raise HTTPException(status_code=400, detail="قرار غير صالح")
    
    dispute = await db.disputes.find_one({"id": dispute_id})
    if not dispute:
        raise HTTPException(status_code=404, detail="النزاع غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.disputes.update_one(
        {"id": dispute_id},
        {"$set": {
            "status": "resolved",
            "resolution": {
                "decision": decision,
                "admin_notes": admin_notes,
                "resolved_by": admin["id"],
                "resolved_at": now
            },
            "updated_at": now
        }}
    )
    
    order = await db.orders.find_one({"id": dispute["order_id"]})
    
    # Handle refund
    if decision == "refund" and order:
        await db.users.update_one(
            {"id": dispute["user_id"]},
            {"$inc": {"wallet_balance": order["total_jod"]}}
        )
        
        await db.wallet_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": dispute["user_id"],
            "amount": order["total_jod"],
            "type": "refund",
            "description": f"استرداد - نزاع #{dispute_id[:8]}",
            "reference_id": dispute_id,
            "created_at": now
        })
        
        await db.orders.update_one({"id": dispute["order_id"]}, {"$set": {"status": "refunded"}})
    elif decision == "reject":
        await db.orders.update_one({"id": dispute["order_id"]}, {"$set": {"status": "completed"}})
    
    # Notify user
    decision_text = {"refund": "استرداد المبلغ", "reject": "رفض الطلب", "redeliver": "إعادة التسليم"}
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": dispute["user_id"],
        "title": "تم حل النزاع",
        "message": f"تم حل نزاعك #{dispute_id[:8]} - القرار: {decision_text.get(decision, decision)}",
        "type": "dispute",
        "is_read": False,
        "reference_id": dispute_id,
        "created_at": now
    })
    
    return {"message": "تم حل النزاع"}
