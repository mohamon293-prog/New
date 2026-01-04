"""
Phase 2 Features Testing for Gamelo Digital Marketplace
Tests: Orders Management, Disputes, Analytics, Audit Logs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@gamelo.com"
ADMIN_PASSWORD = "Test123!"


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin login with provided credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["role"] in ["admin", "employee"], f"User role is not admin: {data['user']['role']}"
        print(f"✅ Admin login successful - Role: {data['user']['role']}")
        return data["access_token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Invalid credentials correctly rejected")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Admin authentication failed: {response.text}")


@pytest.fixture
def auth_headers(admin_token):
    """Get authorization headers"""
    return {"Authorization": f"Bearer {admin_token}"}


class TestAdvancedOrdersManagement:
    """Tests for /api/admin/orders/advanced endpoint"""
    
    def test_get_advanced_orders(self, auth_headers):
        """Test GET /api/admin/orders/advanced - basic request"""
        response = requests.get(f"{BASE_URL}/api/admin/orders/advanced", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "orders" in data, "Missing 'orders' in response"
        assert "total" in data, "Missing 'total' in response"
        assert "page" in data, "Missing 'page' in response"
        assert "pages" in data, "Missing 'pages' in response"
        
        assert isinstance(data["orders"], list), "orders should be a list"
        assert isinstance(data["total"], int), "total should be an integer"
        print(f"✅ Advanced orders endpoint works - Total: {data['total']}, Page: {data['page']}")
    
    def test_get_advanced_orders_with_status_filter(self, auth_headers):
        """Test orders filtering by status"""
        response = requests.get(f"{BASE_URL}/api/admin/orders/advanced?status=completed", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # All returned orders should have status=completed
        for order in data["orders"]:
            assert order.get("status") == "completed", f"Order has wrong status: {order.get('status')}"
        print(f"✅ Status filter works - Found {len(data['orders'])} completed orders")
    
    def test_get_advanced_orders_pagination(self, auth_headers):
        """Test orders pagination"""
        response = requests.get(f"{BASE_URL}/api/admin/orders/advanced?page=1&limit=5", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert len(data["orders"]) <= 5, "Pagination limit not respected"
        assert data["page"] == 1, "Page number incorrect"
        print(f"✅ Pagination works - Returned {len(data['orders'])} orders")
    
    def test_get_advanced_orders_unauthorized(self):
        """Test orders endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/orders/advanced")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Unauthorized access correctly rejected")


class TestBasicOrdersEndpoint:
    """Tests for /api/admin/orders endpoint (fallback)"""
    
    def test_get_basic_orders(self, auth_headers):
        """Test GET /api/admin/orders"""
        response = requests.get(f"{BASE_URL}/api/admin/orders", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✅ Basic orders endpoint works - Found {len(data)} orders")


class TestAnalyticsDashboard:
    """Tests for /api/admin/analytics/overview endpoint"""
    
    def test_get_analytics_overview(self, auth_headers):
        """Test GET /api/admin/analytics/overview"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/overview", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "today" in data, "Missing 'today' stats"
        assert "week" in data, "Missing 'week' stats"
        assert "month" in data, "Missing 'month' stats"
        assert "totals" in data, "Missing 'totals' stats"
        assert "top_products" in data, "Missing 'top_products'"
        
        # Validate today stats
        assert "orders" in data["today"], "Missing today.orders"
        assert "revenue" in data["today"], "Missing today.revenue"
        
        # Validate totals
        assert "users" in data["totals"], "Missing totals.users"
        assert "orders" in data["totals"], "Missing totals.orders"
        assert "products" in data["totals"], "Missing totals.products"
        assert "pending_orders" in data["totals"], "Missing totals.pending_orders"
        assert "open_disputes" in data["totals"], "Missing totals.open_disputes"
        
        print(f"✅ Analytics overview works:")
        print(f"   - Today: {data['today']['orders']} orders, {data['today']['revenue']} JOD")
        print(f"   - Week: {data['week']['orders']} orders, {data['week']['revenue']} JOD")
        print(f"   - Month: {data['month']['orders']} orders, {data['month']['revenue']} JOD")
        print(f"   - Total users: {data['totals']['users']}")
        print(f"   - Total products: {data['totals']['products']}")
    
    def test_get_analytics_chart(self, auth_headers):
        """Test GET /api/admin/analytics/chart"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/chart?period=week", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Chart data should be a list"
        print(f"✅ Analytics chart endpoint works - {len(data)} data points")
    
    def test_analytics_unauthorized(self):
        """Test analytics endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/overview")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Unauthorized access correctly rejected")


class TestDisputesManagement:
    """Tests for /api/admin/disputes endpoint"""
    
    def test_get_disputes(self, auth_headers):
        """Test GET /api/admin/disputes"""
        response = requests.get(f"{BASE_URL}/api/admin/disputes", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        
        # If there are disputes, validate structure
        if len(data) > 0:
            dispute = data[0]
            assert "id" in dispute, "Missing dispute id"
            assert "status" in dispute, "Missing dispute status"
            print(f"✅ Disputes endpoint works - Found {len(data)} disputes")
        else:
            print("✅ Disputes endpoint works - No disputes found (empty state)")
    
    def test_get_disputes_with_status_filter(self, auth_headers):
        """Test disputes filtering by status"""
        response = requests.get(f"{BASE_URL}/api/admin/disputes?status=open", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # All returned disputes should have status=open
        for dispute in data:
            assert dispute.get("status") == "open", f"Dispute has wrong status: {dispute.get('status')}"
        print(f"✅ Disputes status filter works - Found {len(data)} open disputes")
    
    def test_disputes_unauthorized(self):
        """Test disputes endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/disputes")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Unauthorized access correctly rejected")


class TestAuditLogs:
    """Tests for /api/admin/audit-logs endpoint"""
    
    def test_get_audit_logs(self, auth_headers):
        """Test GET /api/admin/audit-logs"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "logs" in data, "Missing 'logs' in response"
        assert "total" in data, "Missing 'total' in response"
        assert "page" in data, "Missing 'page' in response"
        assert "pages" in data, "Missing 'pages' in response"
        
        assert isinstance(data["logs"], list), "logs should be a list"
        
        # If there are logs, validate structure
        if len(data["logs"]) > 0:
            log = data["logs"][0]
            assert "id" in log, "Missing log id"
            assert "action" in log, "Missing log action"
            print(f"✅ Audit logs endpoint works - Found {data['total']} logs")
        else:
            print("✅ Audit logs endpoint works - No logs found (empty state)")
    
    def test_get_audit_logs_pagination(self, auth_headers):
        """Test audit logs pagination"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs?page=1&limit=10", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert len(data["logs"]) <= 10, "Pagination limit not respected"
        assert data["page"] == 1, "Page number incorrect"
        print(f"✅ Audit logs pagination works - Returned {len(data['logs'])} logs")
    
    def test_audit_logs_unauthorized(self):
        """Test audit logs endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Unauthorized access correctly rejected")


class TestAdminStats:
    """Tests for /api/admin/stats endpoint"""
    
    def test_get_admin_stats(self, auth_headers):
        """Test GET /api/admin/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "total_users" in data, "Missing total_users"
        assert "total_orders" in data, "Missing total_orders"
        assert "total_products" in data, "Missing total_products"
        assert "available_codes" in data, "Missing available_codes"
        assert "revenue_jod" in data, "Missing revenue_jod"
        
        print(f"✅ Admin stats endpoint works:")
        print(f"   - Users: {data['total_users']}")
        print(f"   - Orders: {data['total_orders']}")
        print(f"   - Products: {data['total_products']}")
        print(f"   - Revenue: {data['revenue_jod']} JOD")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
