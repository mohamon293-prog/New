"""
Products Routes for Gamelo API
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import csv
import io

from models.schemas import ProductCreate, ProductResponse, CategoryCreate, CategoryResponse
from utils.database import db, fernet, get_current_user, get_admin_user

router = APIRouter(tags=["Products"])


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """Get all active categories"""
    categories = await db.categories.find(
        {"is_active": True}, {"_id": 0}
    ).sort("order", 1).to_list(100)
    return categories


@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[str] = None,
    platform: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get products with optional filters"""
    query = {"is_active": True}
    
    if category_id:
        query["category_id"] = category_id
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
        stock = await db.codes.count_documents({
            "product_id": product["id"],
            "is_sold": False
        })
        product["stock_count"] = stock
        
        # Get category name
        category = await db.categories.find_one({"id": product.get("category_id")})
        product["category_name"] = category.get("name") if category else None
    
    return products


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    """Get single product by ID"""
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    
    # Get stock count
    stock = await db.codes.count_documents({
        "product_id": product_id,
        "is_sold": False
    })
    product["stock_count"] = stock
    
    # Get category name
    category = await db.categories.find_one({"id": product.get("category_id")})
    product["category_name"] = category.get("name") if category else None
    
    return product


# Admin Products Endpoints
@router.get("/admin/products")
async def get_admin_products(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get all products with stock counts for admin"""
    products = await db.products.find({}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        stock = await db.codes.count_documents({
            "product_id": product["id"],
            "is_sold": False
        })
        product["stock_count"] = stock
        
        category = await db.categories.find_one({"id": product.get("category_id")})
        product["category_name"] = category.get("name") if category else None
    
    return products


@router.post("/admin/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, admin: dict = Depends(get_admin_user)):
    """Create a new product"""
    product_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Process variants
    variants_data = None
    if product.has_variants and product.variants:
        variants_data = []
        for v in product.variants:
            variant_dict = v.model_dump() if hasattr(v, 'model_dump') else v.dict()
            if not variant_dict.get("id"):
                variant_dict["id"] = str(uuid.uuid4())
            variants_data.append(variant_dict)
    
    product_doc = {
        "id": product_id,
        **product.model_dump(),
        "variants": variants_data,
        "stock_count": 0,
        "is_active": True,
        "rating": 0.0,
        "review_count": 0,
        "sold_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    await db.products.insert_one(product_doc)
    
    category = await db.categories.find_one({"id": product.category_id})
    product_doc["category_name"] = category.get("name") if category else None
    
    return product_doc


@router.put("/admin/products/{product_id}")
async def update_product(
    product_id: str,
    product: ProductCreate,
    admin: dict = Depends(get_admin_user)
):
    """Update a product"""
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Process variants
    variants_data = None
    if product.has_variants and product.variants:
        variants_data = []
        for v in product.variants:
            variant_dict = v.model_dump() if hasattr(v, 'model_dump') else v.dict()
            if not variant_dict.get("id"):
                variant_dict["id"] = str(uuid.uuid4())
            variants_data.append(variant_dict)
    
    update_data = {
        **product.model_dump(),
        "variants": variants_data,
        "updated_at": now
    }
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    return {"message": "تم تحديث المنتج"}


@router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    """Soft delete a product"""
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    
    return {"message": "تم حذف المنتج"}


@router.get("/admin/products/{product_id}/codes")
async def get_product_codes(
    product_id: str,
    status: Optional[str] = None,
    admin: dict = Depends(get_admin_user)
):
    """Get product codes for admin"""
    query = {"product_id": product_id}
    if status == "available":
        query["is_sold"] = False
    elif status == "sold":
        query["is_sold"] = True
    
    codes = await db.codes.find(query, {"_id": 0}).to_list(500)
    
    # Decrypt codes for display
    for code in codes:
        try:
            code["code_value"] = fernet.decrypt(code["code_value"].encode()).decode()
        except:
            pass
    
    return {
        "codes": codes,
        "total": len(codes),
        "available": sum(1 for c in codes if not c.get("is_sold")),
        "sold": sum(1 for c in codes if c.get("is_sold"))
    }


@router.post("/admin/products/{product_id}/codes/upload")
async def upload_product_codes(
    product_id: str,
    file: UploadFile = File(...),
    admin: dict = Depends(get_admin_user)
):
    """Upload product codes from CSV file"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    
    content = await file.read()
    try:
        text = content.decode('utf-8')
    except:
        text = content.decode('utf-8-sig')
    
    reader = csv.reader(io.StringIO(text))
    codes_added = 0
    now = datetime.now(timezone.utc).isoformat()
    
    for row in reader:
        if not row:
            continue
        
        code_value = row[0].strip()
        if not code_value:
            continue
        
        # Check for duplicate
        existing = await db.codes.find_one({
            "product_id": product_id,
            "code_value": fernet.encrypt(code_value.encode()).decode()
        })
        
        if existing:
            continue
        
        code_doc = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "code_value": fernet.encrypt(code_value.encode()).decode(),
            "is_sold": False,
            "created_at": now
        }
        
        await db.codes.insert_one(code_doc)
        codes_added += 1
    
    return {"message": f"تم إضافة {codes_added} كود"}


@router.post("/admin/products/{product_id}/codes/add")
async def add_product_codes(
    product_id: str,
    codes: List[str],
    admin: dict = Depends(get_admin_user)
):
    """Add product codes manually"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="المنتج غير موجود")
    
    now = datetime.now(timezone.utc).isoformat()
    codes_added = 0
    
    for code_value in codes:
        code_value = code_value.strip()
        if not code_value:
            continue
        
        encrypted = fernet.encrypt(code_value.encode()).decode()
        existing = await db.codes.find_one({
            "product_id": product_id,
            "code_value": encrypted
        })
        
        if existing:
            continue
        
        code_doc = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "code_value": encrypted,
            "is_sold": False,
            "created_at": now
        }
        
        await db.codes.insert_one(code_doc)
        codes_added += 1
    
    return {"message": f"تم إضافة {codes_added} كود"}


# Admin Categories
@router.get("/admin/categories")
async def get_admin_categories(admin: dict = Depends(get_admin_user)):
    """Get all categories for admin"""
    categories = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return categories


@router.post("/admin/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate, admin: dict = Depends(get_admin_user)):
    """Create a new category"""
    existing = await db.categories.find_one({"slug": category.slug})
    if existing:
        raise HTTPException(status_code=400, detail="القسم موجود مسبقاً")
    
    category_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    category_doc = {
        "id": category_id,
        **category.model_dump(),
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.categories.insert_one(category_doc)
    return category_doc


@router.put("/admin/categories/{category_id}")
async def update_category(
    category_id: str,
    category: CategoryCreate,
    admin: dict = Depends(get_admin_user)
):
    """Update a category"""
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": {**category.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    
    return {"message": "تم تحديث القسم"}


@router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str, admin: dict = Depends(get_admin_user)):
    """Soft delete a category"""
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="القسم غير موجود")
    
    return {"message": "تم حذف القسم"}
