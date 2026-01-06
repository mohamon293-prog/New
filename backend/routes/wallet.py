"""
Wallet Routes for Gamelo API
"""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import uuid
from typing import Optional
from pydantic import BaseModel

from utils.database import db, get_current_user, get_admin_user

router = APIRouter(prefix="/wallet", tags=["Wallet"])


class WalletCreditRequest(BaseModel):
    user_id: str
    amount: float
    notes: Optional[str] = None


@router.get("/balance")
async def get_wallet_balance(user: dict = Depends(get_current_user)):
    """Get current user's wallet balance"""
    return {
        "balance_jod": user.get("wallet_balance_jod", user.get("wallet_balance", 0)),
        "balance_usd": user.get("wallet_balance_usd", 0),
        "balance": user.get("wallet_balance", 0)
    }


@router.get("/transactions")
async def get_wallet_transactions(
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get user's wallet transactions"""
    transactions = await db.wallet_transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return transactions


@router.post("/admin/credit")
async def admin_credit_wallet(
    request: WalletCreditRequest,
    admin: dict = Depends(get_admin_user)
):
    """Admin: Add credit to user wallet"""
    # Find user
    user = await db.users.find_one({"id": request.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update wallet balance
    await db.users.update_one(
        {"id": request.user_id},
        {"$inc": {
            "wallet_balance": request.amount,
            "wallet_balance_jod": request.amount,
            "wallet_balance_usd": request.amount * 1.41
        }}
    )
    
    # Create transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": request.user_id,
        "type": "credit",
        "amount": request.amount,
        "balance_after": user.get("wallet_balance", 0) + request.amount,
        "description": f"شحن المحفظة بواسطة الإدارة",
        "notes": request.notes,
        "admin_id": admin["id"],
        "admin_name": admin.get("name", "Admin"),
        "created_at": now
    }
    await db.wallet_transactions.insert_one(transaction)
    
    # Get updated user
    updated_user = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    
    return {
        "success": True,
        "message": f"تم شحن {request.amount} د.أ للمستخدم",
        "new_balance": updated_user.get("wallet_balance_jod", updated_user.get("wallet_balance", 0))
    }


@router.post("/admin/deduct")
async def admin_deduct_wallet(
    request: WalletCreditRequest,
    admin: dict = Depends(get_admin_user)
):
    """Admin: Deduct from user wallet"""
    user = await db.users.find_one({"id": request.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    current_balance = user.get("wallet_balance", 0)
    if current_balance < request.amount:
        raise HTTPException(status_code=400, detail="الرصيد غير كافٍ")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update wallet balance
    await db.users.update_one(
        {"id": request.user_id},
        {"$inc": {
            "wallet_balance": -request.amount,
            "wallet_balance_jod": -request.amount,
            "wallet_balance_usd": -request.amount * 1.41
        }}
    )
    
    # Create transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": request.user_id,
        "type": "debit",
        "amount": -request.amount,
        "balance_after": current_balance - request.amount,
        "description": f"خصم من المحفظة بواسطة الإدارة",
        "notes": request.notes,
        "admin_id": admin["id"],
        "admin_name": admin.get("name", "Admin"),
        "created_at": now
    }
    await db.wallet_transactions.insert_one(transaction)
    
    return {
        "success": True,
        "message": f"تم خصم {request.amount} د.أ من المستخدم",
        "new_balance": current_balance - request.amount
    }


@router.get("/admin/user/{user_id}")
async def admin_get_user_wallet(
    user_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Admin: Get specific user's wallet info"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    transactions = await db.wallet_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        "user_id": user_id,
        "user_name": user.get("name", ""),
        "user_email": user.get("email", ""),
        "balance_jod": user.get("wallet_balance_jod", user.get("wallet_balance", 0)),
        "balance_usd": user.get("wallet_balance_usd", 0),
        "transactions": transactions
    }
