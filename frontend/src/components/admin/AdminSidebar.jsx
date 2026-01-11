/**
 * Admin Sidebar Component
 */
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, Package, Tag, ShoppingCart, MessageSquare,
  Users, Wallet, Bell, Eye, Send, Settings, Home, LogOut,
  Gamepad2, Image, LayoutGrid, FileSpreadsheet, Megaphone
} from "./shared";

const menuItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/admin" },
  { icon: Image, label: "البانرات والسلايدر", path: "/admin/banners" },
  { icon: LayoutGrid, label: "أقسام الرئيسية", path: "/admin/homepage" },
  { icon: Package, label: "المنتجات", path: "/admin/products" },
  { icon: Tag, label: "الأقسام", path: "/admin/categories" },
  { icon: FileSpreadsheet, label: "رفع Excel", path: "/admin/import" },
  { icon: ShoppingCart, label: "الطلبات", path: "/admin/orders" },
  { icon: MessageSquare, label: "النزاعات", path: "/admin/disputes" },
  { icon: Users, label: "المستخدمين", path: "/admin/users" },
  { icon: Wallet, label: "المحافظ", path: "/admin/wallets" },
  { icon: Tag, label: "أكواد الخصم", path: "/admin/discounts" },
  { icon: Megaphone, label: "المسوقون", path: "/admin/affiliates" },
  { icon: Bell, label: "الإشعارات", path: "/admin/notifications" },
  { icon: Eye, label: "التحليلات", path: "/admin/analytics" },
  { icon: Eye, label: "سجل النشاطات", path: "/admin/audit" },
  { icon: Send, label: "إشعارات Telegram", path: "/admin/telegram" },
  { icon: Users, label: "الأدوار والصلاحيات", path: "/admin/roles" },
  { icon: FileSpreadsheet, label: "الصفحات والمحتوى", path: "/admin/cms" },
  { icon: Settings, label: "إعدادات الموقع", path: "/admin/settings" },
];

// Sidebar Content Component - defined outside to avoid recreating on each render
const SidebarContent = ({ location, onClose, handleLogout }) => (
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="p-4 border-b border-border">
      <Link to="/admin" onClick={onClose} className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
          <Gamepad2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <span className="font-heading font-bold text-lg">قيملو</span>
          <span className="block text-xs text-muted-foreground">لوحة التحكم</span>
        </div>
      </Link>
    </div>

    {/* Navigation */}
    <nav className="flex-1 p-2 overflow-y-auto">
      <div className="space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>

    {/* Footer */}
    <div className="p-3 border-t border-border space-y-2">
      <Link
        to="/"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        <Home className="h-5 w-5" />
        <span className="text-sm">عرض المتجر</span>
      </Link>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors w-full"
      >
        <LogOut className="h-5 w-5" />
        <span className="text-sm">تسجيل الخروج</span>
      </button>
    </div>
  </div>
);

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-card border-l border-border transition-transform duration-300 lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <SidebarContent location={location} onClose={onClose} handleLogout={handleLogout} />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 bg-card border-l border-border flex-shrink-0">
        <SidebarContent location={location} onClose={onClose} handleLogout={handleLogout} />
      </aside>
    </>
  );
};

export default AdminSidebar;
