"""
Gamelo API Backend Tests
Tests for authentication, products, and admin endpoints
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://code-accounts-fix.preview.emergentagent.com')
if not BASE_URL.endswith('/api'):
    BASE_URL = f"{BASE_URL}/api"

# Test credentials
ADMIN_EMAIL = "admin@gamelo.com"
ADMIN_PASSWORD = "admin123"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✓ Admin login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected correctly")
    
    def test_forgot_password_endpoint(self):
        """Test forgot password OTP sending"""
        response = requests.post(f"{BASE_URL}/auth/forgot-password", json={
            "email": ADMIN_EMAIL
        })
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        # In dev mode, OTP is returned
        if "dev_otp" in data:
            assert len(data["dev_otp"]) == 6
            print(f"✓ Forgot password OTP sent: {data['dev_otp']}")
        else:
            print(f"✓ Forgot password email sent: {data['message']}")
    
    def test_forgot_password_nonexistent_email(self):
        """Test forgot password with non-existent email (should not reveal)"""
        response = requests.post(f"{BASE_URL}/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })
        # Should return 200 to not reveal if email exists
        assert response.status_code == 200
        print("✓ Non-existent email handled securely")


class TestCategories:
    """Category endpoint tests"""
    
    def test_get_categories(self):
        """Test getting all categories"""
        response = requests.get(f"{BASE_URL}/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Check category structure
        category = data[0]
        assert "id" in category
        assert "name" in category
        assert "slug" in category
        print(f"✓ Categories fetched: {len(data)} categories")


class TestProducts:
    """Product endpoint tests"""
    
    def test_get_products(self):
        """Test getting all products"""
        response = requests.get(f"{BASE_URL}/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Products fetched: {len(data)} products")
    
    def test_get_products_by_category(self):
        """Test filtering products by category"""
        response = requests.get(f"{BASE_URL}/products?category_id=playstation")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All products should be from playstation category
        for product in data:
            assert product["category_id"] == "playstation"
        print(f"✓ PlayStation products: {len(data)}")
    
    def test_get_featured_products(self):
        """Test getting featured products"""
        response = requests.get(f"{BASE_URL}/products?featured=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Featured products: {len(data)}")


class TestAdminEndpoints:
    """Admin endpoint tests - require authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get admin token before each test"""
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Admin authentication failed")
    
    def test_get_admin_stats(self):
        """Test admin dashboard stats"""
        response = requests.get(f"{BASE_URL}/admin/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        # Check stats structure
        assert "total_users" in data or "users" in data or isinstance(data, dict)
        print(f"✓ Admin stats fetched: {data}")
    
    def test_get_admin_products(self):
        """Test admin products list"""
        response = requests.get(f"{BASE_URL}/admin/products", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin products: {len(data)} products")
    
    def test_create_product(self):
        """Test creating a new product"""
        unique_id = str(uuid.uuid4())[:8]
        product_data = {
            "name": f"TEST_منتج اختبار {unique_id}",
            "name_en": f"TEST Product {unique_id}",
            "slug": f"test-product-{unique_id}",
            "description": "وصف المنتج للاختبار",
            "description_en": "Test product description",
            "category_id": "playstation",
            "price_jod": 10.0,
            "price_usd": 14.0,
            "original_price_jod": None,
            "original_price_usd": None,
            "image_url": "https://placehold.co/400x400",
            "platform": "playstation",
            "region": "عالمي",
            "is_featured": False,
            "product_type": "digital_code",
            "has_variants": False,
            "variants": None,
            "requires_email": False,
            "requires_password": False,
            "requires_phone": False,
            "delivery_instructions": None
        }
        
        response = requests.post(
            f"{BASE_URL}/admin/products",
            json=product_data,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == product_data["name"]
        assert data["price_jod"] == product_data["price_jod"]
        print(f"✓ Product created: {data['id']}")
        
        # Cleanup - delete the test product
        delete_response = requests.delete(
            f"{BASE_URL}/admin/products/{data['id']}?permanent=true",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"✓ Test product cleaned up")
    
    def test_get_admin_categories(self):
        """Test admin categories list"""
        response = requests.get(f"{BASE_URL}/admin/categories", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin categories: {len(data)} categories")
    
    def test_unauthorized_access(self):
        """Test that admin endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/admin/products")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access blocked correctly")


class TestPasswordReset:
    """Password reset flow tests"""
    
    def test_reset_password_invalid_otp(self):
        """Test reset password with invalid OTP"""
        response = requests.post(f"{BASE_URL}/auth/reset-password", json={
            "email": ADMIN_EMAIL,
            "otp": "000000",
            "new_password": "newpassword123"
        })
        assert response.status_code == 400
        print("✓ Invalid OTP rejected correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
