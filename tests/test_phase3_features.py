"""
Phase 3 Features Test Suite - Gamelo Arabic RTL Marketplace
Tests for:
1. Roles & Permissions System (RBAC)
2. Enhanced Discount/Coupon System
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@gamelo.com"
ADMIN_PASSWORD = "Test123!"


class TestAdminAuthentication:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful - Token received")
    
    def test_admin_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print(f"✓ Invalid credentials correctly rejected")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Get authorization headers"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestRolesAPI:
    """Test Roles & Permissions API endpoints"""
    
    def test_get_roles(self, auth_headers):
        """GET /api/admin/roles - Returns list of roles with permissions"""
        response = requests.get(f"{BASE_URL}/api/admin/roles", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        roles = response.json()
        assert isinstance(roles, list)
        assert len(roles) >= 4  # admin, support, moderator, readonly, buyer
        
        # Verify role structure
        role_ids = [r["id"] for r in roles]
        assert "admin" in role_ids
        assert "support" in role_ids
        assert "moderator" in role_ids
        assert "readonly" in role_ids
        
        # Verify admin role has all permissions
        admin_role = next(r for r in roles if r["id"] == "admin")
        assert "name" in admin_role
        assert "level" in admin_role
        assert "permissions" in admin_role
        assert len(admin_role["permissions"]) >= 10  # Admin should have many permissions
        
        print(f"✓ GET /api/admin/roles - Found {len(roles)} roles")
        for role in roles:
            print(f"  - {role['id']}: {role['name']} (level {role['level']}, {len(role['permissions'])} permissions)")
    
    def test_get_permissions(self, auth_headers):
        """GET /api/admin/permissions - Returns list of permission labels"""
        response = requests.get(f"{BASE_URL}/api/admin/permissions", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        permissions = response.json()
        assert isinstance(permissions, list)
        assert len(permissions) >= 10  # Should have at least 10 permissions
        
        # Verify permission structure
        for perm in permissions:
            assert "id" in perm
            assert "name" in perm
        
        # Check for expected permissions
        perm_ids = [p["id"] for p in permissions]
        expected_perms = ["manage_products", "manage_orders", "manage_users", "manage_wallets", 
                         "manage_discounts", "view_analytics", "manage_disputes"]
        for expected in expected_perms:
            assert expected in perm_ids, f"Missing permission: {expected}"
        
        print(f"✓ GET /api/admin/permissions - Found {len(permissions)} permissions")
        for perm in permissions[:5]:
            print(f"  - {perm['id']}: {perm['name']}")
    
    def test_get_user_permissions(self, auth_headers):
        """GET /api/admin/users/{user_id}/permissions - Returns user's effective permissions"""
        # First get users list
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert users_response.status_code == 200
        users = users_response.json()
        
        # Get admin user
        admin_user = next((u for u in users if u["role"] == "admin"), None)
        assert admin_user is not None, "No admin user found"
        
        # Get admin's permissions
        response = requests.get(f"{BASE_URL}/api/admin/users/{admin_user['id']}/permissions", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "user_id" in data
        assert "role" in data
        assert "role_name" in data
        assert "role_permissions" in data
        assert "effective_permissions" in data
        
        assert data["role"] == "admin"
        assert len(data["effective_permissions"]) >= 10
        
        print(f"✓ GET /api/admin/users/{admin_user['id']}/permissions")
        print(f"  - Role: {data['role_name']}")
        print(f"  - Effective permissions: {len(data['effective_permissions'])}")
    
    def test_update_user_role(self, auth_headers):
        """PUT /api/admin/users/{user_id}/role - Update user role"""
        # Get a non-admin user to test with
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        users = users_response.json()
        
        # Find a buyer user to test role change
        buyer_user = next((u for u in users if u["role"] == "buyer"), None)
        
        if buyer_user:
            # Change to moderator
            response = requests.put(
                f"{BASE_URL}/api/admin/users/{buyer_user['id']}/role",
                json={"role": "moderator"},
                headers=auth_headers
            )
            assert response.status_code == 200, f"Failed: {response.text}"
            
            # Verify change
            verify_response = requests.get(f"{BASE_URL}/api/admin/users/{buyer_user['id']}/permissions", headers=auth_headers)
            assert verify_response.json()["role"] == "moderator"
            
            # Change back to buyer
            requests.put(
                f"{BASE_URL}/api/admin/users/{buyer_user['id']}/role",
                json={"role": "buyer"},
                headers=auth_headers
            )
            
            print(f"✓ PUT /api/admin/users/{buyer_user['id']}/role - Role updated successfully")
        else:
            print("⚠ No buyer user found to test role update - skipping")
    
    def test_update_role_invalid(self, auth_headers):
        """Test updating to invalid role"""
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        users = users_response.json()
        
        if users:
            response = requests.put(
                f"{BASE_URL}/api/admin/users/{users[0]['id']}/role",
                json={"role": "invalid_role"},
                headers=auth_headers
            )
            assert response.status_code == 400
            print(f"✓ Invalid role correctly rejected")
    
    def test_roles_unauthorized(self):
        """Test roles endpoint without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/roles")
        assert response.status_code == 401
        print(f"✓ Unauthorized access to roles endpoint correctly rejected")


class TestDiscountsAPI:
    """Test Enhanced Discount/Coupon System API endpoints"""
    
    def test_get_discounts(self, auth_headers):
        """GET /api/admin/discounts - Returns discounts with enhanced fields"""
        response = requests.get(f"{BASE_URL}/api/admin/discounts", headers=auth_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        discounts = response.json()
        assert isinstance(discounts, list)
        
        print(f"✓ GET /api/admin/discounts - Found {len(discounts)} discounts")
        
        # If discounts exist, verify structure
        if discounts:
            discount = discounts[0]
            # Check for enhanced fields
            expected_fields = ["id", "code", "discount_type", "discount_value", "is_active"]
            for field in expected_fields:
                assert field in discount, f"Missing field: {field}"
            
            # Check for new Phase 3 fields (with defaults)
            assert "name" in discount or discount.get("name") is not None
            assert "max_uses_per_user" in discount
            assert "first_purchase_only" in discount
            assert "requires_min_items" in discount
            
            print(f"  - First discount: {discount['code']} ({discount['discount_type']})")
    
    def test_create_discount_with_enhanced_fields(self, auth_headers):
        """POST /api/admin/discounts - Create discount with new fields"""
        unique_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        
        discount_data = {
            "code": unique_code,
            "name": "Test Discount",
            "description": "Test discount for Phase 3",
            "discount_type": "percentage",
            "discount_value": 15,
            "min_purchase": 10,
            "max_discount": 50,  # Max discount cap
            "max_uses": 100,
            "max_uses_per_user": 2,  # Per-user limit
            "first_purchase_only": False,
            "requires_min_items": 1
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/discounts",
            json=discount_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        created = response.json()
        assert created["code"] == unique_code
        assert created["name"] == "Test Discount"
        assert created["max_uses_per_user"] == 2
        assert created["first_purchase_only"] == False
        assert created["requires_min_items"] == 1
        assert created["max_discount"] == 50
        
        print(f"✓ POST /api/admin/discounts - Created discount: {unique_code}")
        print(f"  - max_uses_per_user: {created['max_uses_per_user']}")
        print(f"  - first_purchase_only: {created['first_purchase_only']}")
        print(f"  - requires_min_items: {created['requires_min_items']}")
        print(f"  - max_discount: {created['max_discount']}")
        
        return created["id"]
    
    def test_create_first_purchase_only_discount(self, auth_headers):
        """Create a first-purchase-only discount"""
        unique_code = f"FIRST{uuid.uuid4().hex[:6].upper()}"
        
        discount_data = {
            "code": unique_code,
            "name": "First Purchase Discount",
            "description": "Only for new customers",
            "discount_type": "percentage",
            "discount_value": 20,
            "min_purchase": 0,
            "first_purchase_only": True,
            "max_uses_per_user": 1
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/discounts",
            json=discount_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        created = response.json()
        assert created["first_purchase_only"] == True
        
        print(f"✓ Created first-purchase-only discount: {unique_code}")
        return created["id"]
    
    def test_create_min_items_discount(self, auth_headers):
        """Create a discount requiring minimum items"""
        unique_code = f"BULK{uuid.uuid4().hex[:6].upper()}"
        
        discount_data = {
            "code": unique_code,
            "name": "Bulk Purchase Discount",
            "description": "Requires 3+ items",
            "discount_type": "fixed",
            "discount_value": 5,
            "min_purchase": 0,
            "requires_min_items": 3
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/discounts",
            json=discount_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        created = response.json()
        assert created["requires_min_items"] == 3
        
        print(f"✓ Created min-items discount: {unique_code} (requires {created['requires_min_items']} items)")
        return created["id"]


class TestApplyDiscount:
    """Test discount application with enhanced validations"""
    
    @pytest.fixture
    def user_token(self):
        """Create a test user and get token"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register new user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Test User"
        })
        
        if response.status_code == 200:
            return response.json()["access_token"]
        elif response.status_code == 400:
            # User might exist, try login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": unique_email,
                "password": "TestPass123!"
            })
            if login_response.status_code == 200:
                return login_response.json()["access_token"]
        
        pytest.skip("Could not create test user")
    
    def test_apply_valid_discount(self, auth_headers, user_token):
        """Test applying a valid discount code"""
        # First create a discount
        unique_code = f"APPLY{uuid.uuid4().hex[:6].upper()}"
        
        requests.post(
            f"{BASE_URL}/api/admin/discounts",
            json={
                "code": unique_code,
                "discount_type": "percentage",
                "discount_value": 10,
                "min_purchase": 0,
                "max_uses_per_user": 5
            },
            headers=auth_headers
        )
        
        # Apply the discount
        user_headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(
            f"{BASE_URL}/api/discounts/apply",
            json={
                "code": unique_code,
                "subtotal": 100,
                "product_ids": [],
                "item_count": 1
            },
            headers=user_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["valid"] == True
        assert data["discount_amount"] == 10  # 10% of 100
        assert data["final_total"] == 90
        
        print(f"✓ POST /api/discounts/apply - Discount applied successfully")
        print(f"  - Subtotal: 100, Discount: {data['discount_amount']}, Final: {data['final_total']}")
    
    def test_apply_discount_max_cap(self, auth_headers, user_token):
        """Test discount with max discount cap"""
        unique_code = f"CAP{uuid.uuid4().hex[:6].upper()}"
        
        # Create discount with max cap
        requests.post(
            f"{BASE_URL}/api/admin/discounts",
            json={
                "code": unique_code,
                "discount_type": "percentage",
                "discount_value": 50,  # 50%
                "max_discount": 20,  # Max 20 JOD
                "min_purchase": 0
            },
            headers=auth_headers
        )
        
        # Apply to 100 JOD order (50% would be 50, but capped at 20)
        user_headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(
            f"{BASE_URL}/api/discounts/apply",
            json={
                "code": unique_code,
                "subtotal": 100,
                "product_ids": [],
                "item_count": 1
            },
            headers=user_headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["discount_amount"] == 20  # Capped at max_discount
        assert data["final_total"] == 80
        
        print(f"✓ Max discount cap working - 50% capped to 20 JOD")
    
    def test_apply_discount_min_items_fail(self, auth_headers, user_token):
        """Test discount fails when min items not met"""
        unique_code = f"MINF{uuid.uuid4().hex[:6].upper()}"
        
        # Create discount requiring 3 items
        requests.post(
            f"{BASE_URL}/api/admin/discounts",
            json={
                "code": unique_code,
                "discount_type": "fixed",
                "discount_value": 10,
                "min_purchase": 0,
                "requires_min_items": 3
            },
            headers=auth_headers
        )
        
        # Try to apply with only 1 item
        user_headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(
            f"{BASE_URL}/api/discounts/apply",
            json={
                "code": unique_code,
                "subtotal": 100,
                "product_ids": [],
                "item_count": 1  # Less than required 3
            },
            headers=user_headers
        )
        
        assert response.status_code == 400
        assert "3" in response.json().get("detail", "")  # Should mention required items
        
        print(f"✓ Min items validation working - rejected with 1 item (requires 3)")
    
    def test_apply_invalid_discount(self, user_token):
        """Test applying invalid discount code"""
        user_headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(
            f"{BASE_URL}/api/discounts/apply",
            json={
                "code": "INVALID_CODE_12345",
                "subtotal": 100,
                "product_ids": [],
                "item_count": 1
            },
            headers=user_headers
        )
        
        assert response.status_code == 404
        print(f"✓ Invalid discount code correctly rejected")


class TestTelegramSettings:
    """Test Telegram settings page API"""
    
    def test_get_telegram_settings(self, auth_headers):
        """GET /api/admin/telegram/settings - Returns telegram settings"""
        response = requests.get(f"{BASE_URL}/api/admin/telegram/settings", headers=auth_headers)
        
        # May return 200 with settings or 404 if not configured
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ GET /api/admin/telegram/settings - Settings found")
            print(f"  - Configured: {data.get('is_configured', False)}")
        else:
            print(f"✓ GET /api/admin/telegram/settings - Not configured (404)")
    
    def test_telegram_unauthorized(self):
        """Test telegram endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/telegram/settings")
        assert response.status_code == 401
        print(f"✓ Telegram endpoint requires authentication")


class TestRolesPageIntegration:
    """Test that roles page data is correctly structured for frontend"""
    
    def test_roles_page_data_structure(self, auth_headers):
        """Verify all data needed for roles page is available"""
        # Get roles
        roles_response = requests.get(f"{BASE_URL}/api/admin/roles", headers=auth_headers)
        assert roles_response.status_code == 200
        roles = roles_response.json()
        
        # Get permissions
        perms_response = requests.get(f"{BASE_URL}/api/admin/permissions", headers=auth_headers)
        assert perms_response.status_code == 200
        permissions = perms_response.json()
        
        # Get users (for staff members)
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=auth_headers)
        assert users_response.status_code == 200
        users = users_response.json()
        
        # Verify data structure matches frontend expectations
        assert len(roles) >= 4
        assert len(permissions) >= 10
        
        # Check role structure for frontend
        for role in roles:
            assert "id" in role
            assert "name" in role
            assert "level" in role
            assert "permissions" in role
            assert isinstance(role["permissions"], list)
        
        # Check permission structure for frontend
        for perm in permissions:
            assert "id" in perm
            assert "name" in perm
        
        # Check user structure for frontend
        staff_users = [u for u in users if u.get("role") != "buyer"]
        
        print(f"✓ Roles page data structure verified")
        print(f"  - Roles: {len(roles)}")
        print(f"  - Permissions: {len(permissions)}")
        print(f"  - Staff members: {len(staff_users)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
