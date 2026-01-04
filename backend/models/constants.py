"""
Constants and Configuration for Gamelo API
"""

# Order Status Enum
ORDER_STATUSES = {
    "pending_payment": "في انتظار الدفع",
    "payment_failed": "فشل الدفع",
    "processing": "قيد المعالجة",
    "awaiting_admin": "في انتظار إجراء الإدارة",
    "completed": "مكتمل",
    "delivered": "تم التسليم",
    "cancelled": "ملغي",
    "refunded": "مسترد",
    "disputed": "نزاع مفتوح"
}

# Role & Permission Models
ROLES = {
    "admin": {"name": "مدير النظام", "level": 100, "description": "صلاحيات كاملة على النظام"},
    "support": {"name": "دعم فني", "level": 50, "description": "إدارة الطلبات والنزاعات والمستخدمين"},
    "moderator": {"name": "مشرف", "level": 30, "description": "إدارة المنتجات والمحتوى"},
    "readonly": {"name": "قراءة فقط", "level": 10, "description": "عرض البيانات فقط بدون تعديل"},
    "buyer": {"name": "مشتري", "level": 1, "description": "مستخدم عادي"}
}

# Define permissions for each role
ROLE_PERMISSIONS = {
    "admin": [
        "manage_products", "manage_orders", "manage_users", "manage_wallets",
        "manage_discounts", "manage_banners", "manage_settings", "manage_roles",
        "view_analytics", "manage_disputes", "manage_tickets", "export_data",
        "manage_telegram", "view_audit_logs"
    ],
    "support": [
        "manage_orders", "manage_users", "manage_wallets", "manage_disputes",
        "manage_tickets", "view_analytics"
    ],
    "moderator": [
        "manage_products", "manage_banners", "manage_discounts", "view_analytics"
    ],
    "readonly": [
        "view_analytics"
    ],
    "buyer": []
}

PERMISSIONS = [
    "manage_products", "manage_orders", "manage_users", "manage_wallets",
    "manage_discounts", "manage_banners", "manage_settings", "manage_roles",
    "view_analytics", "manage_disputes", "manage_tickets", "export_data",
    "manage_telegram", "view_audit_logs"
]

PERMISSION_LABELS = {
    "manage_products": "إدارة المنتجات",
    "manage_orders": "إدارة الطلبات",
    "manage_users": "إدارة المستخدمين",
    "manage_wallets": "إدارة المحافظ",
    "manage_discounts": "إدارة الخصومات",
    "manage_banners": "إدارة البانرات",
    "manage_settings": "إدارة الإعدادات",
    "manage_roles": "إدارة الأدوار",
    "view_analytics": "عرض التحليلات",
    "manage_disputes": "إدارة النزاعات",
    "manage_tickets": "إدارة التذاكر",
    "export_data": "تصدير البيانات",
    "manage_telegram": "إدارة Telegram",
    "view_audit_logs": "عرض سجل النشاطات"
}

# Platforms
PLATFORMS = [
    {"id": "playstation", "name": "PlayStation", "icon": "🎮"},
    {"id": "xbox", "name": "Xbox", "icon": "🎮"},
    {"id": "steam", "name": "Steam", "icon": "🎮"},
    {"id": "nintendo", "name": "Nintendo", "icon": "🎮"},
    {"id": "pc", "name": "PC", "icon": "💻"},
    {"id": "mobile", "name": "Mobile", "icon": "📱"},
    {"id": "streaming", "name": "Streaming", "icon": "📺"},
    {"id": "software", "name": "Software", "icon": "💿"},
    {"id": "gift_cards", "name": "Gift Cards", "icon": "🎁"},
    {"id": "other", "name": "Other", "icon": "📦"}
]
