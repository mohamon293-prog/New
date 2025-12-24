#!/usr/bin/env python3
"""
Gamelo Backend API Testing Suite
Tests all backend endpoints for the digital marketplace
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class GameloAPITester:
    def __init__(self, base_url="https://digital-souk-21.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.user_id = None
        self.admin_user_id = None

    def log_result(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"test": test_name, "details": details})

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    use_admin: bool = False, expected_status: int = 200) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth token if available
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status": response.status_code}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.make_request('GET', '/')
        if success and 'message' in response:
            self.log_result("Root API endpoint", True, f"Message: {response['message']}")
        else:
            self.log_result("Root API endpoint", False, f"Response: {response}")

    def test_platforms_endpoint(self):
        """Test platforms endpoint"""
        success, response = self.make_request('GET', '/platforms')
        if success and isinstance(response, list) and len(response) > 0:
            platforms = [p.get('name_en', 'Unknown') for p in response[:3]]
            self.log_result("Platforms endpoint", True, f"Found platforms: {', '.join(platforms)}")
        else:
            self.log_result("Platforms endpoint", False, f"Response: {response}")

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@example.com",
            "password": "TestPass123!",
            "phone": "0791234567"
        }
        
        success, response = self.make_request('POST', '/auth/register', user_data, expected_status=200)
        if success and 'access_token' in response and 'user' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log_result("User registration", True, f"User ID: {self.user_id}")
        else:
            self.log_result("User registration", False, f"Response: {response}")

    def test_user_login(self):
        """Test user login with admin credentials"""
        login_data = {
            "email": "admin@gamelo.com",
            "password": "Admin123!"
        }
        
        success, response = self.make_request('POST', '/auth/login', login_data, expected_status=200)
        if success and 'access_token' in response and 'user' in response:
            self.admin_token = response['access_token']
            self.admin_user_id = response['user']['id']
            user_role = response['user'].get('role', 'unknown')
            self.log_result("Admin login", True, f"Role: {user_role}, ID: {self.admin_user_id}")
        else:
            self.log_result("Admin login", False, f"Response: {response}")

    def test_auth_me_endpoint(self):
        """Test /auth/me endpoint"""
        if not self.token:
            self.log_result("Auth me endpoint", False, "No user token available")
            return
            
        success, response = self.make_request('GET', '/auth/me')
        if success and 'id' in response and 'wallet_balance' in response:
            balance = response.get('wallet_balance', 0)
            self.log_result("Auth me endpoint", True, f"Wallet balance: {balance} JOD")
        else:
            self.log_result("Auth me endpoint", False, f"Response: {response}")

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        success, response = self.make_request('GET', '/categories')
        if success and isinstance(response, list):
            count = len(response)
            self.log_result("Categories endpoint", True, f"Found {count} categories")
        else:
            self.log_result("Categories endpoint", False, f"Response: {response}")

    def test_products_endpoint(self):
        """Test products endpoint"""
        success, response = self.make_request('GET', '/products')
        if success and isinstance(response, list):
            count = len(response)
            self.log_result("Products endpoint", True, f"Found {count} products")
            
            # Test with platform filter
            success2, response2 = self.make_request('GET', '/products?platform=playstation')
            if success2:
                filtered_count = len(response2)
                self.log_result("Products with platform filter", True, f"PlayStation products: {filtered_count}")
            else:
                self.log_result("Products with platform filter", False, f"Response: {response2}")
        else:
            self.log_result("Products endpoint", False, f"Response: {response}")

    def test_wallet_balance(self):
        """Test wallet balance endpoint"""
        if not self.token:
            self.log_result("Wallet balance", False, "No user token available")
            return
            
        success, response = self.make_request('GET', '/wallet/balance')
        if success and 'jod' in response:
            jod_balance = response.get('jod', 0)
            usd_balance = response.get('usd', 0)
            self.log_result("Wallet balance", True, f"JOD: {jod_balance}, USD: {usd_balance}")
        else:
            self.log_result("Wallet balance", False, f"Response: {response}")

    def test_wallet_transactions(self):
        """Test wallet transactions endpoint"""
        if not self.token:
            self.log_result("Wallet transactions", False, "No user token available")
            return
            
        success, response = self.make_request('GET', '/wallet/transactions')
        if success and isinstance(response, list):
            count = len(response)
            self.log_result("Wallet transactions", True, f"Found {count} transactions")
        else:
            self.log_result("Wallet transactions", False, f"Response: {response}")

    def test_user_orders(self):
        """Test user orders endpoint"""
        if not self.token:
            self.log_result("User orders", False, "No user token available")
            return
            
        success, response = self.make_request('GET', '/orders')
        if success and isinstance(response, list):
            count = len(response)
            self.log_result("User orders", True, f"Found {count} orders")
        else:
            self.log_result("User orders", False, f"Response: {response}")

    def test_user_tickets(self):
        """Test support tickets endpoint"""
        if not self.token:
            self.log_result("Support tickets", False, "No user token available")
            return
            
        success, response = self.make_request('GET', '/tickets')
        if success and isinstance(response, list):
            count = len(response)
            self.log_result("Support tickets", True, f"Found {count} tickets")
        else:
            self.log_result("Support tickets", False, f"Response: {response}")

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        if not self.admin_token:
            self.log_result("Admin endpoints", False, "No admin token available")
            return

        # Test admin users endpoint
        success, response = self.make_request('GET', '/admin/users', use_admin=True)
        if success and isinstance(response, list):
            user_count = len(response)
            self.log_result("Admin users endpoint", True, f"Found {user_count} users")
        else:
            self.log_result("Admin users endpoint", False, f"Response: {response}")

        # Test admin stats endpoint
        success, response = self.make_request('GET', '/admin/stats', use_admin=True)
        if success and 'total_users' in response:
            stats = {k: v for k, v in response.items() if k.startswith('total_')}
            self.log_result("Admin stats endpoint", True, f"Stats: {stats}")
        else:
            self.log_result("Admin stats endpoint", False, f"Response: {response}")

        # Test admin orders endpoint
        success, response = self.make_request('GET', '/admin/orders', use_admin=True)
        if success and isinstance(response, list):
            order_count = len(response)
            self.log_result("Admin orders endpoint", True, f"Found {order_count} orders")
        else:
            self.log_result("Admin orders endpoint", False, f"Response: {response}")

        # Test admin products endpoint
        success, response = self.make_request('GET', '/admin/products', use_admin=True)
        if success and isinstance(response, list):
            product_count = len(response)
            self.log_result("Admin products endpoint", True, f"Found {product_count} products")
        else:
            self.log_result("Admin products endpoint", False, f"Response: {response}")

    def test_discount_codes(self):
        """Test discount code functionality"""
        if not self.admin_token:
            self.log_result("Discount codes", False, "No admin token available")
            return

        # Test get all discounts
        success, response = self.make_request('GET', '/admin/discounts', use_admin=True)
        if success and isinstance(response, list):
            discount_count = len(response)
            self.log_result("Get admin discounts", True, f"Found {discount_count} discount codes")
        else:
            self.log_result("Get admin discounts", False, f"Response: {response}")

        # Test create discount code
        discount_data = {
            "code": "TESTCODE10",
            "discount_type": "percentage",
            "discount_value": 10,
            "min_purchase": 5,
            "max_uses": 100
        }
        success, response = self.make_request('POST', '/admin/discounts', discount_data, use_admin=True)
        if success and 'id' in response:
            discount_id = response['id']
            self.log_result("Create discount code", True, f"Created discount: {response['code']}")
            
            # Test apply discount code (user endpoint)
            if self.token:
                apply_data = {
                    "code": "TESTCODE10",
                    "subtotal": 20.0,
                    "product_ids": []
                }
                success2, response2 = self.make_request('POST', '/discounts/apply', apply_data)
                if success2 and response2.get('valid'):
                    discount_amount = response2.get('discount_amount', 0)
                    self.log_result("Apply discount code", True, f"Discount applied: {discount_amount} JOD")
                else:
                    self.log_result("Apply discount code", False, f"Response: {response2}")
        else:
            self.log_result("Create discount code", False, f"Response: {response}")

    def test_notifications(self):
        """Test notifications functionality"""
        if not self.token:
            self.log_result("Notifications", False, "No user token available")
            return

        # Test get notifications
        success, response = self.make_request('GET', '/notifications')
        if success and isinstance(response, list):
            notif_count = len(response)
            self.log_result("Get notifications", True, f"Found {notif_count} notifications")
        else:
            self.log_result("Get notifications", False, f"Response: {response}")

        # Test get unread count
        success, response = self.make_request('GET', '/notifications/count')
        if success and 'unread_count' in response:
            unread_count = response['unread_count']
            self.log_result("Get unread count", True, f"Unread notifications: {unread_count}")
        else:
            self.log_result("Get unread count", False, f"Response: {response}")

        # Test admin broadcast (if admin token available)
        if self.admin_token:
            broadcast_data = {
                "title": "Test Notification",
                "message": "This is a test broadcast message"
            }
            success, response = self.make_request('POST', '/admin/notifications/broadcast', broadcast_data, use_admin=True)
            if success and 'message' in response:
                self.log_result("Admin broadcast notification", True, response['message'])
            else:
                self.log_result("Admin broadcast notification", False, f"Response: {response}")

    def test_support_tickets_admin(self):
        """Test admin support ticket functionality"""
        if not self.admin_token:
            self.log_result("Admin tickets", False, "No admin token available")
            return

        # Test get all tickets
        success, response = self.make_request('GET', '/admin/tickets', use_admin=True)
        if success and isinstance(response, list):
            ticket_count = len(response)
            self.log_result("Admin get tickets", True, f"Found {ticket_count} tickets")
        else:
            self.log_result("Admin get tickets", False, f"Response: {response}")

    def test_unauthorized_access(self):
        """Test that protected endpoints require authentication"""
        # Test without token
        success, response = self.make_request('GET', '/auth/me', expected_status=401)
        if not success:  # Should fail with 401
            self.log_result("Unauthorized access protection", True, "Correctly blocked unauthenticated request")
        else:
            self.log_result("Unauthorized access protection", False, "Should have blocked unauthenticated request")

    def run_all_tests(self):
        """Run all test cases"""
        print("🚀 Starting Gamelo Backend API Tests")
        print("=" * 50)
        
        # Basic API tests
        self.test_root_endpoint()
        self.test_platforms_endpoint()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        
        # Protected endpoint tests
        self.test_auth_me_endpoint()
        self.test_categories_endpoint()
        self.test_products_endpoint()
        self.test_wallet_balance()
        self.test_wallet_transactions()
        self.test_user_orders()
        self.test_user_tickets()
        
        # Admin tests
        self.test_admin_endpoints()
        
        # Phase 2 feature tests
        self.test_discount_codes()
        self.test_notifications()
        self.test_support_tickets_admin()
        
        # Security tests
        self.test_unauthorized_access()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = GameloAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except Exception as e:
        print(f"\n💥 Test suite crashed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())