"""
Routes package for Gamelo API
"""

from .auth import router as auth_router
from .products import router as products_router
from .orders import router as orders_router
from .admin import router as admin_router
from .disputes import router as disputes_router
from .discounts import router as discounts_router
from .cms import router as cms_router
