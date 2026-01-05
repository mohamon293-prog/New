"""
Gamelo API Backend Tests
Tests for Arabic Digital Marketplace - Authentication, Products, Orders, Admin functions
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://arabic-market-19.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@gamelo.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = f"test_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_NAME = "مستخدم اختبار"


class TestAuthEndpoints:
    """Authentication endpoint tests - Registration and Login"""
    
    def test_admin_login_success(self, api_client):
        """Test admin login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        
        data = response.json()
        assert "detail" in data
    
    def test_register_new_user(self, api_client):
        """Test user registration"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "phone": "+962791234567"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        assert data["user"]["name"] == TEST_USER_NAME
        assert data["user"]["role"] == "buyer"
    
    def test_register_duplicate_email(self, api_client):
        """Test registration with existing email"""
        # First register
        api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"dup_{uuid.uuid4().hex[:8]}@test.com",
            "password": "testpass",
            "name": "Test"
        })
        
        # Try to register with admin email (already exists)
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "testpass",
            "name": "Test"
        })
        assert response.status_code == 400
    
    def test_get_profile(self, authenticated_client):
        """Test getting user profile"""
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "wallet_balance" in data


class TestCategoriesEndpoints:
    """Categories endpoint tests"""
    
    def test_get_categories(self, api_client):
        """Test fetching all categories"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify category structure
        category = data[0]
        assert "id" in category
        assert "name" in category
        assert "name_en" in category
        assert "slug" in category
        assert "is_active" in category


class TestProductsEndpoints:
    """Products endpoint tests"""
    
    def test_get_products(self, api_client):
        """Test fetching all products"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify product structure
        product = data[0]
        assert "id" in product
        assert "name" in product
        assert "price_jod" in product
        assert "price_usd" in product
        assert "stock_count" in product
        assert "product_type" in product
    
    def test_get_products_by_category(self, api_client):
        """Test fetching products filtered by category"""
        response = api_client.get(f"{BASE_URL}/api/products?category_id=playstation")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        for product in data:
            assert product["category_id"] == "playstation"
    
    def test_get_products_by_platform(self, api_client):
        """Test fetching products filtered by platform"""
        response = api_client.get(f"{BASE_URL}/api/products?platform=steam")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        for product in data:
            assert product["platform"] == "steam"
    
    def test_get_single_product(self, api_client):
        """Test fetching a single product"""
        # First get products list
        products_response = api_client.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        
        if products:
            product_id = products[0]["id"]
            response = api_client.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert data["id"] == product_id
    
    def test_get_nonexistent_product(self, api_client):
        """Test fetching a non-existent product"""
        response = api_client.get(f"{BASE_URL}/api/products/nonexistent-id")
        assert response.status_code == 404


class TestAdminProductsEndpoints:
    """Admin products management tests"""
    
    def test_admin_get_products(self, admin_client):
        """Test admin fetching all products"""
        response = admin_client.get(f"{BASE_URL}/api/admin/products")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_create_product(self, admin_client):
        """Test admin creating a new product"""
        product_data = {
            "name": f"منتج اختبار {uuid.uuid4().hex[:8]}",
            "name_en": "Test Product",
            "slug": f"test-product-{uuid.uuid4().hex[:8]}",
            "description": "وصف المنتج للاختبار",
            "category_id": "playstation",
            "price_jod": 10.0,
            "price_usd": 14.0,
            "image_url": "https://placehold.co/400x400",
            "platform": "playstation",
            "region": "عالمي",
            "product_type": "digital_code"
        }
        
        response = admin_client.post(f"{BASE_URL}/api/admin/products", json=product_data)
        assert response.status_code == 200, f"Create product failed: {response.text}"
        
        data = response.json()
        assert data["name"] == product_data["name"]
        assert data["price_jod"] == product_data["price_jod"]
        assert "id" in data
        
        return data["id"]
    
    def test_admin_add_codes_to_product(self, admin_client):
        """Test admin adding codes to a product"""
        # First create a product
        product_data = {
            "name": f"منتج أكواد {uuid.uuid4().hex[:8]}",
            "name_en": "Codes Test Product",
            "slug": f"codes-test-{uuid.uuid4().hex[:8]}",
            "description": "منتج لاختبار الأكواد",
            "category_id": "steam",
            "price_jod": 5.0,
            "price_usd": 7.0,
            "image_url": "https://placehold.co/400x400",
            "platform": "steam",
            "region": "عالمي",
            "product_type": "digital_code"
        }
        
        create_response = admin_client.post(f"{BASE_URL}/api/admin/products", json=product_data)
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # Add codes
        codes = [f"TEST-CODE-{uuid.uuid4().hex[:8]}" for _ in range(3)]
        codes_response = admin_client.post(
            f"{BASE_URL}/api/admin/products/{product_id}/codes/add",
            json=codes
        )
        assert codes_response.status_code == 200, f"Add codes failed: {codes_response.text}"
        
        data = codes_response.json()
        assert "added" in data
        assert data["added"] == 3
    
    def test_admin_get_product_codes(self, admin_client):
        """Test admin fetching product codes"""
        # Get products with stock
        products_response = admin_client.get(f"{BASE_URL}/api/admin/products")
        products = products_response.json()
        
        # Find a product with codes
        product_with_codes = next((p for p in products if p.get("stock_count", 0) > 0), None)
        
        if product_with_codes:
            response = admin_client.get(f"{BASE_URL}/api/admin/products/{product_with_codes['id']}/codes")
            assert response.status_code == 200
            
            data = response.json()
            assert "codes" in data
            assert "total" in data


class TestAdminWalletEndpoints:
    """Admin wallet management tests"""
    
    def test_admin_credit_wallet(self, admin_client):
        """Test admin crediting user wallet"""
        # First get a user
        users_response = admin_client.get(f"{BASE_URL}/api/admin/users")
        assert users_response.status_code == 200
        
        users = users_response.json()
        if users:
            user_id = users[0]["id"]
            
            response = admin_client.post(f"{BASE_URL}/api/admin/wallet/credit", json={
                "user_id": user_id,
                "amount": 10.0,
                "reason": "اختبار شحن المحفظة"
            })
            assert response.status_code == 200, f"Wallet credit failed: {response.text}"
            
            data = response.json()
            assert "message" in data


class TestAdminStatsEndpoints:
    """Admin statistics tests"""
    
    def test_admin_get_stats(self, admin_client):
        """Test admin fetching dashboard stats"""
        response = admin_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_users" in data
        assert "total_products" in data
        assert "total_orders" in data
        assert "total_revenue" in data
    
    def test_admin_get_analytics_overview(self, admin_client):
        """Test admin fetching analytics overview"""
        response = admin_client.get(f"{BASE_URL}/api/admin/analytics/overview")
        assert response.status_code == 200
        
        data = response.json()
        assert "today" in data
        assert "week" in data
        assert "month" in data
        assert "totals" in data


class TestOrdersEndpoints:
    """Orders endpoint tests"""
    
    def test_create_order_insufficient_balance(self, authenticated_client):
        """Test creating order with insufficient wallet balance"""
        # Get a product
        products_response = authenticated_client.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        
        # Find a product with high price
        expensive_product = next((p for p in products if p.get("price_jod", 0) > 1000), None)
        
        if expensive_product:
            response = authenticated_client.post(f"{BASE_URL}/api/orders", json={
                "product_id": expensive_product["id"],
                "quantity": 1
            })
            # Should fail due to insufficient balance
            assert response.status_code == 400
    
    def test_get_user_orders(self, authenticated_client):
        """Test fetching user orders"""
        response = authenticated_client.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestPurchaseFlow:
    """Complete purchase flow tests"""
    
    def test_complete_purchase_flow(self, admin_client):
        """Test complete purchase flow: create product, add codes, credit wallet, purchase, reveal"""
        # 1. Create a test product
        product_data = {
            "name": f"منتج شراء {uuid.uuid4().hex[:8]}",
            "name_en": "Purchase Test Product",
            "slug": f"purchase-test-{uuid.uuid4().hex[:8]}",
            "description": "منتج لاختبار عملية الشراء",
            "category_id": "steam",
            "price_jod": 1.0,
            "price_usd": 1.5,
            "image_url": "https://placehold.co/400x400",
            "platform": "steam",
            "region": "عالمي",
            "product_type": "digital_code"
        }
        
        create_response = admin_client.post(f"{BASE_URL}/api/admin/products", json=product_data)
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # 2. Add codes to the product
        test_code = f"PURCHASE-TEST-{uuid.uuid4().hex[:8]}"
        codes_response = admin_client.post(
            f"{BASE_URL}/api/admin/products/{product_id}/codes/add",
            json=[test_code]
        )
        assert codes_response.status_code == 200
        
        # 3. Create a test user and get their token
        test_email = f"buyer_{uuid.uuid4().hex[:8]}@test.com"
        register_response = admin_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "مشتري اختبار"
        })
        assert register_response.status_code == 200
        buyer_token = register_response.json()["access_token"]
        buyer_id = register_response.json()["user"]["id"]
        
        # 4. Credit the buyer's wallet
        credit_response = admin_client.post(f"{BASE_URL}/api/admin/wallet/credit", json={
            "user_id": buyer_id,
            "amount": 10.0,
            "reason": "اختبار الشراء"
        })
        assert credit_response.status_code == 200
        
        # 5. Make purchase as buyer
        buyer_client = requests.Session()
        buyer_client.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {buyer_token}"
        })
        
        order_response = buyer_client.post(f"{BASE_URL}/api/orders", json={
            "product_id": product_id,
            "quantity": 1
        })
        assert order_response.status_code == 200, f"Order failed: {order_response.text}"
        
        order_data = order_response.json()
        assert order_data["status"] == "completed"
        order_id = order_data["id"]
        
        # 6. Reveal the code
        reveal_response = buyer_client.post(f"{BASE_URL}/api/orders/{order_id}/reveal")
        assert reveal_response.status_code == 200, f"Reveal failed: {reveal_response.text}"
        
        reveal_data = reveal_response.json()
        assert "codes" in reveal_data
        assert len(reveal_data["codes"]) > 0
        
        # Verify the code matches
        revealed_code = reveal_data["codes"][0]["code"]
        assert revealed_code == test_code


class TestAdminOrdersEndpoints:
    """Admin orders management tests"""
    
    def test_admin_get_all_orders(self, admin_client):
        """Test admin fetching all orders"""
        response = admin_client.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_get_orders_advanced(self, admin_client):
        """Test admin fetching orders with advanced filtering"""
        response = admin_client.get(f"{BASE_URL}/api/admin/orders/advanced?page=1&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        assert "total" in data
        assert "page" in data


class TestAdminCategoriesEndpoints:
    """Admin categories management tests"""
    
    def test_admin_get_categories(self, admin_client):
        """Test admin fetching all categories"""
        response = admin_client.get(f"{BASE_URL}/api/admin/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_create_category(self, admin_client):
        """Test admin creating a new category"""
        category_data = {
            "name": f"قسم اختبار {uuid.uuid4().hex[:8]}",
            "name_en": "Test Category",
            "slug": f"test-category-{uuid.uuid4().hex[:8]}",
            "description": "وصف القسم للاختبار",
            "order": 99
        }
        
        response = admin_client.post(f"{BASE_URL}/api/admin/categories", json=category_data)
        assert response.status_code == 200, f"Create category failed: {response.text}"
        
        data = response.json()
        assert data["name"] == category_data["name"]
        assert "id" in data


class TestAdminUsersEndpoints:
    """Admin users management tests"""
    
    def test_admin_get_users(self, admin_client):
        """Test admin fetching all users"""
        response = admin_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify user structure (no password_hash)
        user = data[0]
        assert "id" in user
        assert "email" in user
        assert "password_hash" not in user
    
    def test_admin_get_roles(self, admin_client):
        """Test admin fetching available roles"""
        response = admin_client.get(f"{BASE_URL}/api/admin/roles")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_admin_get_permissions(self, admin_client):
        """Test admin fetching available permissions"""
        response = admin_client.get(f"{BASE_URL}/api/admin/permissions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get authentication token for regular user"""
    # Register a new test user
    test_email = f"fixture_{uuid.uuid4().hex[:8]}@test.com"
    response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": test_email,
        "password": "testpass123",
        "name": "مستخدم اختبار"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    
    # If registration fails, try login with admin
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed")


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


@pytest.fixture
def admin_client(api_client, admin_token):
    """Session with admin auth header"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return api_client
