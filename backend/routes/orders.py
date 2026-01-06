"""
Orders Routes for Gamelo API
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

from models.schemas import OrderCreate, OrderResponse
from models.constants import ORDER_STATUSES
from utils.database import db, fernet, get_current_user, get_admin_user, logger

router = APIRouter(tags=["Orders"])


async def notify_new_order(order: dict, user: dict):
    """Send Telegram notification for new order"""
    import httpx
    
    try:
        # Get telegram settings from database
        telegram_settings = await db.site_settings.find_one({"type": "telegram"})
        
        if not telegram_settings:
            return
            
        bot_token = telegram_settings.get("bot_token")
        chat_id = telegram_settings.get("chat_id")
        notify_orders = telegram_settings.get("notify_new_orders", True)
        
        if not bot_token or not chat_id or not notify_orders:
            return
        
        products = ", ".join([item.get("product_name", "منتج") for item in order.get("items", [])])
        
        # Add product type info
        product_type = order.get("product_type", "digital_code")
        type_labels = {"digital_code": "🔑 كود رقمي", "existing_account": "👤 حساب جاهز", "new_account": "📱 حساب جديد"}
        type_label = type_labels.get(product_type, "🔑 كود رقمي")
        
        message = f"""<b>🛒 طلب جديد!</b>

<b>رقم الطلب:</b> #{order.get('order_number', order['id'][:8])}
<b>العميل:</b> {user.get('name', 'غير معروف')}
<b>البريد:</b> {user.get('email', '-')}
<b>المبلغ:</b> {order.get('total_jod', 0):.2f} د.أ
<b>المنتجات:</b> {products}
<b>النوع:</b> {type_label}
<b>الحالة:</b> {order.get('status', '-')}
<b>التاريخ:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}"""

        # Add customer details for account products
        if product_type != "digital_code" and order.get("customer_details"):
            details = order.get("customer_details", {})
            message += f"\n\n<b>📋 بيانات العميل:</b>"
            if details.get("email"):
                message += f"\n• البريد: {details['email']}"
            if details.get("phone"):
                message += f"\n• الهاتف: {details['phone']}"
        
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json={
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "HTML"
            })
            if response.status_code != 200:
                logger.error(f"Telegram API error: {response.text}")
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")


@router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate, user: dict = Depends(get_current_user)):
    """Create a new order"""
    # Try to find by ID first, then by slug
    product = await db.products.find_one({"id": order.product_id, "is_active": True})
    if not product:
        product = await db.products.find_one({"slug": order.product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    
    # Use the actual product ID for further operations
    actual_product_id = product["id"]
    
    # Determine price based on variant
    if order.variant_id and product.get("variants"):
        variant = next((v for v in product["variants"] if v["id"] == order.variant_id), None)
        if not variant:
            raise HTTPException(status_code=400, detail="الباقة غير موجودة")
        price_jod = variant["price_jod"]
        price_usd = variant["price_usd"]
        variant_name = variant.get("name", "")
    else:
        price_jod = product["price_jod"]
        price_usd = product["price_usd"]
        variant_name = None
    
    total_jod = price_jod * order.quantity
    total_usd = price_usd * order.quantity
    
    # Check wallet balance
    if user.get("wallet_balance", 0) < total_jod:
        raise HTTPException(status_code=400, detail="رصيد المحفظة غير كافٍ")
    
    # For digital codes, check stock
    codes = []
    if product.get("product_type", "digital_code") == "digital_code":
        available_codes = await db.codes.find({
            "product_id": order.product_id,
            "is_sold": False
        }).limit(order.quantity).to_list(order.quantity)
        
        if len(available_codes) < order.quantity:
            raise HTTPException(status_code=400, detail="لا يوجد مخزون كافٍ")
        
        codes = [c["id"] for c in available_codes]
    
    # Create order
    order_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    order_doc = {
        "id": order_id,
        "order_number": order_id[:8].upper(),
        "user_id": user["id"],
        "items": [{
            "product_id": order.product_id,
            "product_name": product["name"],
            "quantity": order.quantity,
            "price_jod": price_jod,
            "price_usd": price_usd,
            "variant_id": order.variant_id,
            "variant_name": variant_name,
            "codes": codes
        }],
        "total_jod": total_jod,
        "total_usd": total_usd,
        "status": "completed",
        "payment_method": "wallet",
        "product_type": product.get("product_type", "digital_code"),
        "created_at": now,
        "updated_at": now
    }
    
    # For account type products, save customer details
    if product.get("product_type") in ["existing_account", "new_account"]:
        order_doc["status"] = "awaiting_admin"
        order_doc["customer_details"] = {
            "email": order.customer_email,
            "password": order.customer_password,
            "phone": order.customer_phone
        }
    
    await db.orders.insert_one(order_doc)
    
    # Deduct from wallet
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"wallet_balance": -total_jod}}
    )
    
    # Mark codes as sold
    if codes:
        await db.codes.update_many(
            {"id": {"$in": codes}},
            {"$set": {"is_sold": True, "sold_at": now, "order_id": order_id}}
        )
    
    # Create wallet transaction
    await db.wallet_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "amount": -total_jod,
        "type": "purchase",
        "description": f"شراء {product['name']}",
        "reference_id": order_id,
        "created_at": now
    })
    
    # Create notification
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": "طلب جديد",
        "message": f"تم إنشاء طلبك #{order_id[:8]} بنجاح",
        "type": "order",
        "is_read": False,
        "reference_id": order_id,
        "created_at": now
    })
    
    # Send Telegram notification
    telegram_settings = await db.site_settings.find_one({"type": "telegram"})
    if telegram_settings and telegram_settings.get("notify_new_orders", True):
        await notify_new_order(order_doc, user)
    
    return OrderResponse(
        id=order_id,
        user_id=user["id"],
        items=order_doc["items"],
        total_jod=total_jod,
        total_usd=total_usd,
        status=order_doc["status"],
        payment_method="wallet",
        created_at=now
    )


@router.get("/orders", response_model=List[OrderResponse])
async def get_user_orders(user: dict = Depends(get_current_user)):
    """Get current user's orders"""
    orders = await db.orders.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders


@router.post("/orders/{order_id}/reveal")
async def reveal_order_codes(order_id: str, user: dict = Depends(get_current_user)):
    """Reveal the codes for an order"""
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]})
    
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    if order["status"] not in ["completed", "delivered"]:
        raise HTTPException(status_code=400, detail="لا يمكن عرض الأكواد")
    
    revealed_codes = []
    for item in order.get("items", []):
        # Support both 'codes' and 'code_ids' fields
        code_ids = item.get("codes", []) or item.get("code_ids", [])
        if code_ids:
            codes = await db.codes.find({"id": {"$in": code_ids}}).to_list(100)
            for code in codes:
                try:
                    decrypted = fernet.decrypt(code["code_value"].encode()).decode()
                    revealed_codes.append({
                        "product_name": item["product_name"],
                        "code": decrypted
                    })
                except:
                    revealed_codes.append({
                        "product_name": item["product_name"],
                        "code": code.get("code_value", "خطأ في فك التشفير")
                    })
    
    # Mark as revealed
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"revealed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"codes": revealed_codes}


# Admin Orders
@router.get("/admin/orders")
async def get_all_orders(admin: dict = Depends(get_admin_user)):
    """Get all orders for admin"""
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders


@router.get("/admin/orders/advanced")
async def get_orders_advanced(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    admin: dict = Depends(get_admin_user)
):
    """Get orders with advanced filtering"""
    query = {}
    
    if status:
        query["status"] = status
    
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}}
        ]
    
    total = await db.orders.count_documents(query)
    skip = (page - 1) * limit
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    for order in orders:
        user = await db.users.find_one({"id": order["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        if user:
            order["user_name"] = user.get("name")
            order["user_email"] = user.get("email")
    
    return {
        "orders": orders,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    admin_notes: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Update order status"""
    if status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="حالة غير صالحة")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    old_status = order.get("status")
    
    update_data = {
        "status": status,
        "updated_at": now
    }
    
    if admin_notes:
        update_data["admin_notes"] = admin_notes
    
    # Add to status history
    history_entry = {
        "from": old_status,
        "to": status,
        "by": admin["id"],
        "by_name": admin.get("name", "Admin"),
        "at": now,
        "notes": admin_notes
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": update_data,
            "$push": {"status_history": history_entry}
        }
    )
    
    # Handle refund
    if status == "refunded" and old_status != "refunded":
        await db.users.update_one(
            {"id": order["user_id"]},
            {"$inc": {"wallet_balance": order["total_jod"]}}
        )
        
        await db.wallet_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": order["user_id"],
            "amount": order["total_jod"],
            "type": "refund",
            "description": f"استرداد الطلب #{order.get('order_number', order_id[:8])}",
            "reference_id": order_id,
            "created_at": now
        })
    
    # Log audit
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": admin["id"],
        "user_name": admin.get("name"),
        "action": "update_order_status",
        "entity_type": "order",
        "entity_id": order_id,
        "changes": {"old_status": old_status, "new_status": status},
        "timestamp": now
    })
    
    return {"message": f"تم تحديث الطلب إلى: {ORDER_STATUSES[status]}"}


@router.post("/admin/orders/{order_id}/deliver")
async def deliver_order(
    order_id: str,
    delivery_data: Dict[str, Any],
    admin: dict = Depends(get_admin_user)
):
    """Manually deliver an order (for account type products)"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "delivered",
            "delivery_data": delivery_data,
            "delivered_at": now,
            "delivered_by": admin["id"],
            "updated_at": now
        }}
    )
    
    # Notify user
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": order["user_id"],
        "title": "تم تسليم طلبك",
        "message": f"تم تسليم طلبك #{order.get('order_number', order_id[:8])}. تحقق من تفاصيل الطلب.",
        "type": "order",
        "is_read": False,
        "reference_id": order_id,
        "created_at": now
    })
    
    return {"message": "تم تسليم الطلب"}
