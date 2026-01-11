/**
 * Admin Dashboard - Main Entry Point (Refactored)
 * All components are now in separate files under /components/admin/
 */
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { Menu } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";
import { API_URL, getAuthHeader } from "../../lib/utils";

// Import all admin components from the index
import {
  AdminSidebar,
  DashboardStats,
  UsersManagement,
  ProductsManagement,
  CategoriesManagement,
  OrdersManagement,
  WalletManagement,
  DiscountsManagement,
  AffiliatesManagement,
  NotificationsManagement,
  TicketsManagement,
  DisputesManagement,
  BannersManagement,
  HomepageSectionsManagement,
  CMSManagement,
  AnalyticsDashboard,
  AuditLogs,
  SiteSettings,
  TelegramSettings,
  RolesManagement,
  ExcelImport,
} from "../../components/admin";

// Dashboard Overview Component
const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/stats`, {
          headers: getAuthHeader(),
        });
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl md:text-3xl font-bold">لوحة التحكم</h1>
      <DashboardStats stats={stats} loading={loading} />
    </div>
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect non-admin users
  if (!user || (user.role !== "admin" && user.role !== "employee")) {
    return <Navigate to="/" replace />;
  }

  const getPageTitle = () => {
    const path = window.location.pathname;
    const titles = {
      "/admin": "لوحة التحكم",
      "/admin/products": "إدارة المنتجات",
      "/admin/categories": "إدارة الأقسام",
      "/admin/orders": "إدارة الطلبات",
      "/admin/users": "إدارة المستخدمين",
      "/admin/wallets": "إدارة المحافظ",
      "/admin/discounts": "أكواد الخصم",
      "/admin/notifications": "الإشعارات",
      "/admin/tickets": "الدعم الفني",
      "/admin/disputes": "إدارة النزاعات",
      "/admin/banners": "البانرات والسلايدر",
      "/admin/homepage": "أقسام الرئيسية",
      "/admin/analytics": "التحليلات",
      "/admin/audit": "سجل النشاطات",
      "/admin/settings": "إعدادات الموقع",
      "/admin/telegram": "إشعارات Telegram",
      "/admin/roles": "الأدوار والصلاحيات",
      "/admin/cms": "إدارة المحتوى",
      "/admin/import": "رفع Excel",
    };
    return titles[path] || "لوحة التحكم";
  };

  return (
    <div className="min-h-screen bg-background flex flex-row-reverse" dir="rtl">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
          <span className="font-heading font-bold">{getPageTitle()}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-6 lg:p-8">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="wallets" element={<WalletManagement />} />
            <Route path="discounts" element={<DiscountsManagement />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="tickets" element={<TicketsManagement />} />
            <Route path="disputes" element={<DisputesManagement />} />
            <Route path="banners" element={<BannersManagement />} />
            <Route path="homepage" element={<HomepageSectionsManagement />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="settings" element={<SiteSettings />} />
            <Route path="telegram" element={<TelegramSettings />} />
            <Route path="roles" element={<RolesManagement />} />
            <Route path="cms" element={<CMSManagement />} />
            <Route path="import" element={<ExcelImport />} />
          </Routes>
        </div>
      </main>

      {/* Toast Container */}
      <Toaster position="top-center" richColors />
    </div>
  );
};

export default AdminDashboard;
