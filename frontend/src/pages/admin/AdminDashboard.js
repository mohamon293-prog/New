import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL, getAuthHeader, formatPrice, formatDate } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";
import { Toaster } from "../../components/ui/sonner";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Gamepad2,
} from "lucide-react";

// Admin Sidebar
const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/admin" },
    { icon: Users, label: "المستخدمين", path: "/admin/users" },
    { icon: Package, label: "المنتجات", path: "/admin/products" },
    { icon: ShoppingCart, label: "الطلبات", path: "/admin/orders" },
    { icon: Wallet, label: "المحافظ", path: "/admin/wallets" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-card border-l border-border transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } lg:static`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-heading font-bold">قيملو</span>
                <span className="block text-xs text-muted-foreground">لوحة التحكم</span>
              </div>
            </Link>
            <button onClick={onClose} className="lg:hidden">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border pt-4 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Eye className="h-5 w-5" />
              عرض المتجر
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              تسجيل الخروج
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// Dashboard Stats Component
const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

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

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      icon: Users,
      label: "المستخدمين",
      value: stats?.total_users || 0,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: ShoppingBag,
      label: "الطلبات",
      value: stats?.total_orders || 0,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      icon: Package,
      label: "المنتجات",
      value: stats?.total_products || 0,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      icon: DollarSign,
      label: "الإيرادات (JOD)",
      value: formatPrice(stats?.revenue_jod || 0, "JOD"),
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="p-4 rounded-xl bg-card border border-border"
        >
          <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

// Users Management
const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: getAuthHeader(),
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("فشل في تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(
        `${API_URL}/admin/users/${userId}`,
        { is_active: !currentStatus },
        { headers: getAuthHeader() }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentStatus } : u
        )
      );
      toast.success("تم تحديث حالة المستخدم");
    } catch (error) {
      toast.error("فشل في تحديث المستخدم");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">إدارة المستخدمين</h2>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium">المستخدم</th>
                <th className="px-4 py-3 text-right text-sm font-medium">الدور</th>
                <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-medium">التاريخ</th>
                <th className="px-4 py-3 text-right text-sm font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {user.role === "admin" ? "مدير" : user.role === "employee" ? "موظف" : "مشتري"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <Badge className="bg-green-500">نشط</Badge>
                    ) : (
                      <Badge variant="destructive">معطل</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.is_active)}
                    >
                      {user.is_active ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Orders Management
const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/orders`, {
        headers: getAuthHeader(),
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">إدارة الطلبات</h2>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                <Badge className={order.revealed_at ? "bg-green-500" : "bg-accent"}>
                  {order.revealed_at ? "مكشوف" : "جاهز"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.created_at)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-muted-foreground">
                  {order.items.length} منتج
                </span>
                <span className="font-bold">{formatPrice(order.total_jod, "JOD")}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          لا توجد طلبات
        </div>
      )}
    </div>
  );
};

// Wallet Management (Credit users)
const WalletManagement = () => {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredit = async (e) => {
    e.preventDefault();
    if (!userId || !amount || !reason) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/admin/wallet/credit`,
        {
          user_id: userId,
          amount: parseFloat(amount),
          currency: "JOD",
          reason,
        },
        { headers: getAuthHeader() }
      );
      toast.success("تم شحن المحفظة بنجاح");
      setUserId("");
      setAmount("");
      setReason("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في شحن المحفظة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">شحن المحافظ</h2>

      <form onSubmit={handleCredit} className="max-w-md space-y-4">
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">معرف المستخدم</label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="أدخل معرف المستخدم (UUID)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">المبلغ (JOD)</label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">السبب</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="شحن يدوي، هدية، تعويض..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "جاري الشحن..." : "شحن المحفظة"}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Products placeholder
const ProductsManagement = () => (
  <div className="space-y-6">
    <h2 className="font-heading text-2xl font-bold">إدارة المنتجات</h2>
    <p className="text-muted-foreground">
      قريباً - إدارة المنتجات وإضافة الأكواد
    </p>
  </div>
);

// Main Dashboard Component
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">مرحباً،</span>
              <span className="font-medium">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
          <Routes>
            <Route
              index
              element={
                <div className="space-y-6">
                  <h1 className="font-heading text-2xl font-bold">لوحة التحكم</h1>
                  <DashboardStats />
                </div>
              }
            />
            <Route path="users" element={<UsersManagement />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="wallets" element={<WalletManagement />} />
          </Routes>
        </div>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
