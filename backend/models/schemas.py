"""
Pydantic Models for Gamelo API
"""

from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any


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
    role_level: int = 1
    permissions: List[str] = []
    is_active: bool
    is_approved: bool
    wallet_balance: float = 0.0
    wallet_balance_jod: float = 0.0
    wallet_balance_usd: float = 0.0
    created_at: str


class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    role_level: int = 1
    permissions: List[str] = []
    wallet_balance: float = 0.0
    wallet_balance_jod: float = 0.0
    wallet_balance_usd: float = 0.0
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
class ProductVariant(BaseModel):
    """Product variant (e.g., 1 month, 3 months, 12 months)"""
    id: str = ""
    name: str
    name_en: str = ""
    duration_days: int = 0
    price_jod: float
    price_usd: float
    original_price_jod: Optional[float] = None
    original_price_usd: Optional[float] = None
    stock_count: int = 0
    sku: Optional[str] = None
    is_active: bool = True


class ProductCreate(BaseModel):
    name: str
    name_en: str = ""
    slug: str = ""
    description: str = ""
    description_en: Optional[str] = None
    category_id: str
    price_jod: float
    price_usd: float
    original_price_jod: Optional[float] = None
    original_price_usd: Optional[float] = None
    image_url: str = ""
    platform: str = ""
    region: str = "عالمي"
    is_featured: bool = False
    product_type: str = "digital_code"
    has_variants: bool = False
    variants: Optional[List[ProductVariant]] = None
    requires_email: bool = False
    requires_password: bool = False
    requires_phone: bool = False
    delivery_instructions: Optional[str] = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    name_en: str = ""
    slug: str = ""
    description: str = ""
    description_en: Optional[str] = None
    category_id: str = ""
    category_name: Optional[str] = None
    price_jod: float = 0.0
    price_usd: float = 0.0
    original_price_jod: Optional[float] = None
    original_price_usd: Optional[float] = None
    image_url: str = ""
    platform: str = ""
    region: str = "عالمي"
    stock_count: int = 0
    available_codes: int = 0
    is_active: bool = True
    is_featured: bool = False
    rating: float = 0.0
    review_count: int = 0
    sold_count: int = 0
    product_type: str = "digital_code"
    has_variants: bool = False
    variants: Optional[List[Dict]] = None
    requires_email: bool = False
    requires_password: bool = False
    requires_phone: bool = False
    delivery_instructions: Optional[str] = None
    created_at: Optional[str] = None


# Banner/Slider Models
class BannerCreate(BaseModel):
    title: str = ""
    title_en: str = ""
    subtitle: str = ""
    image_url: str
    link_type: str = "none"
    link_value: str = ""
    button_text: str = ""
    position: str = "hero"
    priority: int = 0
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    is_active: bool = True


class BannerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    title_en: str
    subtitle: str
    image_url: str
    link_type: str
    link_value: str
    button_text: str
    position: str
    priority: int
    starts_at: Optional[str]
    ends_at: Optional[str]
    is_active: bool
    created_at: str
    clicks: int = 0
    views: int = 0


# Homepage Section Models
class HomepageSectionCreate(BaseModel):
    name: str
    name_en: str
    section_type: str
    is_active: bool = True
    order: int = 0
    max_items: int = 8
    product_ids: Optional[List[str]] = None


# Order Models
class OrderCreate(BaseModel):
    product_id: str
    quantity: int = 1
    variant_id: Optional[str] = None
    customer_email: Optional[str] = None
    customer_password: Optional[str] = None
    customer_phone: Optional[str] = None


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price_jod: float
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None


class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    items: List[Dict]
    total_jod: float
    total_usd: float
    status: str
    payment_method: Optional[str] = "wallet"
    created_at: str
    codes: Optional[List[str]] = None
    revealed_at: Optional[str] = None
    order_number: Optional[str] = None


# Wallet Models
class WalletCreditRequest(BaseModel):
    user_id: str
    amount: float
    reason: str


class WalletTransactionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    amount: float
    type: str
    description: str
    reference_id: Optional[str] = None
    created_at: str


# Review Models
class ReviewCreate(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    product_id: str
    order_id: str
    rating: int
    comment: Optional[str] = None
    created_at: str


# Ticket Models
class TicketCreate(BaseModel):
    subject: str
    message: str
    order_id: Optional[str] = None


class TicketResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    subject: str
    status: str
    priority: str
    messages: List[Dict]
    created_at: str
    updated_at: str


# Auth Response
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Discount Models
class DiscountCodeCreate(BaseModel):
    code: str
    name: str = ""
    description: str = ""
    discount_type: str = "percentage"
    discount_value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    max_uses: Optional[int] = None
    max_uses_per_user: int = 1
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    applicable_products: Optional[List[str]] = None
    applicable_categories: Optional[List[str]] = None
    first_purchase_only: bool = False
    requires_min_items: int = 0


class DiscountCodeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    code: str
    name: str
    description: str
    discount_type: str
    discount_value: float
    min_purchase: float
    max_discount: Optional[float]
    max_uses: Optional[int]
    max_uses_per_user: int
    used_count: int
    valid_from: Optional[str]
    valid_until: Optional[str]
    is_active: bool
    first_purchase_only: bool
    requires_min_items: int
    created_at: str


class ApplyDiscountRequest(BaseModel):
    code: str
    subtotal: float
    product_ids: List[str] = []
    item_count: int = 1


# Dispute Models
class DisputeCreate(BaseModel):
    order_id: str
    reason: str
    description: str
    evidence_urls: Optional[List[str]] = None


class DisputeResolve(BaseModel):
    decision: str  # refund, reject, redeliver
    admin_notes: str


# Notification Models
class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    message: str
    type: str
    is_read: bool
    reference_id: Optional[str] = None
    created_at: str


# Code Upload Models
class CodeUpload(BaseModel):
    product_id: str
    codes: List[str]


# Telegram Settings
class TelegramSettings(BaseModel):
    bot_token: str
    chat_id: str
    notify_new_orders: bool = True
    notify_disputes: bool = True
    notify_low_stock: bool = True
    low_stock_threshold: int = 5
