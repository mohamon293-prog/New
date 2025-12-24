import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { API_URL, getAuthHeader, formatPrice, formatDate } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import { Toaster } from "../../components/ui/sonner";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Wallet,
  Tag,
  Bell,
  MessageSquare,
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
  DollarSign,
  ShoppingBag,
  Gamepad2,
  Upload,
  Copy,
  Send,
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
    { icon: Tag, label: "أكواد الخصم", path: "/admin/discounts" },
    { icon: Bell, label: "الإشعارات", path: "/admin/notifications" },
    { icon: MessageSquare, label: "الدعم الفني", path: "/admin/tickets" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-card border-l border-border transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } lg:static`}
      >
        <div className="flex flex-col h-full p-4">
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
    { icon: Users, label: "المستخدمين", value: stats?.total_users || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: ShoppingBag, label: "الطلبات", value: stats?.total_orders || 0, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Package, label: "المنتجات", value: stats?.total_products || 0, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: DollarSign, label: "الإيرادات (JOD)", value: formatPrice(stats?.revenue_jod || 0, "JOD"), color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="p-4 rounded-xl bg-card border border-border">
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
      const response = await axios.get(`${API_URL}/admin/users`, { headers: getAuthHeader() });
      setUsers(response.data);
    } catch (error) {
      toast.error("فشل في تحميل المستخدمين");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/admin/users/${userId}`, { is_active: !currentStatus }, { headers: getAuthHeader() });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      toast.success("تم تحديث حالة المستخدم");
    } catch (error) {
      toast.error("فشل في تحديث المستخدم");
    }
  };

  const filteredUsers = users.filter(
    (user) => user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">إدارة المستخدمين</h2>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
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
                    {user.is_active ? <Badge className="bg-green-500">نشط</Badge> : <Badge variant="destructive">معطل</Badge>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => toggleUserStatus(user.id, user.is_active)}>
                      {user.is_active ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
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

// Products Management
const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [codesDialog, setCodesDialog] = useState(null);
  const [newCodes, setNewCodes] = useState("");
  const [addingCodes, setAddingCodes] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/products`, { headers: getAuthHeader() });
      setProducts(response.data);
    } catch (error) {
      toast.error("فشل في تحميل المنتجات");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCodes = async () => {
    if (!newCodes.trim() || !codesDialog) return;
    
    const codes = newCodes.split("\n").map(c => c.trim()).filter(c => c);
    if (codes.length === 0) {
      toast.error("أدخل الأكواد (كود واحد في كل سطر)");
      return;
    }

    setAddingCodes(true);
    try {
      await axios.post(`${API_URL}/admin/codes/bulk`, {
        product_id: codesDialog.id,
        codes: codes
      }, { headers: getAuthHeader() });
      
      toast.success(`تم إضافة ${codes.length} كود بنجاح`);
      setCodesDialog(null);
      setNewCodes("");
      fetchProducts();
    } catch (error) {
      toast.error("فشل في إضافة الأكواد");
    } finally {
      setAddingCodes(false);
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await axios.put(`${API_URL}/admin/products/${productId}`, { is_active: !currentStatus }, { headers: getAuthHeader() });
      setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_active: !currentStatus } : p));
      toast.success("تم تحديث المنتج");
    } catch (error) {
      toast.error("فشل في تحديث المنتج");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">إدارة المنتجات</h2>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start gap-4">
                <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{product.name}</h3>
                    {product.is_featured && <Badge className="bg-accent">مميز</Badge>}
                    {!product.is_active && <Badge variant="destructive">غير نشط</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{product.category_name} • {product.platform}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>السعر: <strong className="ltr-nums">{formatPrice(product.price_jod, "JOD")}</strong></span>
                    <span>المخزون: <strong className={product.stock_count > 0 ? "text-green-500" : "text-destructive"}>{product.stock_count}</strong></span>
                    <span>المبيعات: <strong>{product.sold_count}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCodesDialog(product)}>
                    <Upload className="h-4 w-4 ml-1" />
                    إضافة أكواد
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleProductStatus(product.id, product.is_active)}>
                    {product.is_active ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Codes Dialog */}
      <Dialog open={!!codesDialog} onOpenChange={() => setCodesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة أكواد - {codesDialog?.name}</DialogTitle>
            <DialogDescription>أدخل الأكواد، كود واحد في كل سطر</DialogDescription>
          </DialogHeader>
          <Textarea
            value={newCodes}
            onChange={(e) => setNewCodes(e.target.value)}
            placeholder="XXXX-XXXX-XXXX&#10;YYYY-YYYY-YYYY&#10;ZZZZ-ZZZZ-ZZZZ"
            className="min-h-[200px] font-mono"
            dir="ltr"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodesDialog(null)}>إلغاء</Button>
            <Button onClick={handleAddCodes} disabled={addingCodes}>
              {addingCodes ? "جاري الإضافة..." : "إضافة الأكواد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      const response = await axios.get(`${API_URL}/admin/orders`, { headers: getAuthHeader() });
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
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
                  <Badge className={order.revealed_at ? "bg-green-500" : "bg-accent"}>
                    {order.revealed_at ? "مكشوف" : "جاهز"}
                  </Badge>
                </div>
                <span className="font-bold">{formatPrice(order.total_jod, "JOD")}</span>
              </div>
              <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
              <div className="mt-2 text-sm">{order.items?.map(i => i.product_name).join(", ")}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">لا توجد طلبات</div>
      )}
    </div>
  );
};

// Wallet Management
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
      await axios.post(`${API_URL}/admin/wallet/credit`, { user_id: userId, amount: parseFloat(amount), currency: "JOD", reason }, { headers: getAuthHeader() });
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
            <Label>معرف المستخدم</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="أدخل معرف المستخدم (UUID)" className="mt-1" />
          </div>
          <div>
            <Label>المبلغ (JOD)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
          </div>
          <div>
            <Label>السبب</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="شحن يدوي، هدية، تعويض..." className="mt-1" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "جاري الشحن..." : "شحن المحفظة"}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Discounts Management
const DiscountsManagement = () => {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "0",
    max_uses: "",
    valid_until: ""
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/discounts`, { headers: getAuthHeader() });
      setDiscounts(response.data);
    } catch (error) {
      toast.error("فشل في تحميل أكواد الخصم");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    try {
      await axios.post(`${API_URL}/admin/discounts`, {
        code: form.code,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_purchase: parseFloat(form.min_purchase) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        valid_until: form.valid_until || null
      }, { headers: getAuthHeader() });
      
      toast.success("تم إنشاء كود الخصم");
      setShowCreate(false);
      setForm({ code: "", discount_type: "percentage", discount_value: "", min_purchase: "0", max_uses: "", valid_until: "" });
      fetchDiscounts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إنشاء كود الخصم");
    }
  };

  const toggleDiscountStatus = async (discountId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/admin/discounts/${discountId}`, { is_active: !currentStatus }, { headers: getAuthHeader() });
      setDiscounts((prev) => prev.map((d) => d.id === discountId ? { ...d, is_active: !currentStatus } : d));
      toast.success("تم تحديث كود الخصم");
    } catch (error) {
      toast.error("فشل في تحديث كود الخصم");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">أكواد الخصم</h2>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 ml-2" />
          إضافة كود
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : discounts.length > 0 ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-medium">الكود</th>
                <th className="px-4 py-3 text-right text-sm font-medium">الخصم</th>
                <th className="px-4 py-3 text-right text-sm font-medium">الحد الأدنى</th>
                <th className="px-4 py-3 text-right text-sm font-medium">الاستخدام</th>
                <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <code className="font-mono bg-secondary px-2 py-1 rounded">{discount.code}</code>
                  </td>
                  <td className="px-4 py-3">
                    {discount.discount_type === "percentage" 
                      ? `${discount.discount_value}%` 
                      : formatPrice(discount.discount_value, "JOD")}
                  </td>
                  <td className="px-4 py-3">{formatPrice(discount.min_purchase, "JOD")}</td>
                  <td className="px-4 py-3">
                    {discount.used_count}{discount.max_uses ? `/${discount.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {discount.is_active ? <Badge className="bg-green-500">فعال</Badge> : <Badge variant="destructive">معطل</Badge>}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => toggleDiscountStatus(discount.id, discount.is_active)}>
                      {discount.is_active ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">لا توجد أكواد خصم</div>
      )}

      {/* Create Discount Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء كود خصم جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>كود الخصم</Label>
              <Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SUMMER2025" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع الخصم</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({...form, discount_type: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (JOD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>قيمة الخصم</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm({...form, discount_value: e.target.value})} placeholder={form.discount_type === "percentage" ? "10" : "5"} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الحد الأدنى للشراء</Label>
                <Input type="number" value={form.min_purchase} onChange={(e) => setForm({...form, min_purchase: e.target.value})} placeholder="0" className="mt-1" />
              </div>
              <div>
                <Label>الحد الأقصى للاستخدام</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({...form, max_uses: e.target.value})} placeholder="غير محدود" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>تاريخ الانتهاء (اختياري)</Label>
              <Input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({...form, valid_until: e.target.value})} className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
              <Button type="submit">إنشاء</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Notifications Management
const NotificationsManagement = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("يرجى ملء العنوان والرسالة");
      return;
    }

    setSending(true);
    try {
      const response = await axios.post(`${API_URL}/admin/notifications/broadcast`, { title, message }, { headers: getAuthHeader() });
      toast.success(response.data.message);
      setTitle("");
      setMessage("");
    } catch (error) {
      toast.error("فشل في إرسال الإشعار");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">إرسال إشعار عام</h2>

      <form onSubmit={handleBroadcast} className="max-w-xl">
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div>
            <Label>عنوان الإشعار</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عروض خاصة!" className="mt-1" />
          </div>
          <div>
            <Label>نص الإشعار</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="احصل على خصم 20% على جميع المنتجات..." className="mt-1" rows={4} />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={sending}>
            <Send className="h-4 w-4" />
            {sending ? "جاري الإرسال..." : "إرسال لجميع المستخدمين"}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Tickets Management
const TicketsManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/tickets`, { headers: getAuthHeader() });
      setTickets(response.data);
    } catch (error) {
      toast.error("فشل في تحميل التذاكر");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;

    try {
      await axios.post(`${API_URL}/admin/tickets/${selectedTicket.id}/reply`, { message: reply }, { headers: getAuthHeader() });
      toast.success("تم إرسال الرد");
      setSelectedTicket(null);
      setReply("");
      fetchTickets();
    } catch (error) {
      toast.error("فشل في إرسال الرد");
    }
  };

  const updateStatus = async (ticketId, status) => {
    try {
      await axios.patch(`${API_URL}/admin/tickets/${ticketId}`, { status }, { headers: getAuthHeader() });
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status } : t));
      toast.success("تم تحديث الحالة");
    } catch (error) {
      toast.error("فشل في تحديث الحالة");
    }
  };

  const statusColors = {
    open: "bg-yellow-500",
    in_progress: "bg-blue-500",
    resolved: "bg-green-500",
    closed: "bg-gray-500"
  };

  const statusLabels = {
    open: "مفتوحة",
    in_progress: "قيد المعالجة",
    resolved: "تم الحل",
    closed: "مغلقة"
  };

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl font-bold">الدعم الفني</h2>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{ticket.subject}</h3>
                    <Badge className={statusColors[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">من: {ticket.user_name} • {formatDate(ticket.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Select value={ticket.status} onValueChange={(v) => updateStatus(ticket.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">مفتوحة</SelectItem>
                      <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                      <SelectItem value="resolved">تم الحل</SelectItem>
                      <SelectItem value="closed">مغلقة</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                    رد
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">لا توجد تذاكر</div>
      )}

      {/* Reply Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>الرد على التذكرة</DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="اكتب ردك هنا..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>إلغاء</Button>
            <Button onClick={handleReply}>إرسال الرد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Main Dashboard Component
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">مرحباً،</span>
              <span className="font-medium">{user?.name}</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <Routes>
            <Route index element={<div className="space-y-6"><h1 className="font-heading text-2xl font-bold">لوحة التحكم</h1><DashboardStats /></div>} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="wallets" element={<WalletManagement />} />
            <Route path="discounts" element={<DiscountsManagement />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="tickets" element={<TicketsManagement />} />
          </Routes>
        </div>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
