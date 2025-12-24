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
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
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
  Send,
  ChevronLeft,
  Home,
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

  const SidebarContent = () => (
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
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 bg-card border-l border-border flex-shrink-0">
        <SidebarContent />
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
      const response = await axios.get(`${API_URL}/admin/stats`, { headers: getAuthHeader() });
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 md:h-28 rounded-xl" />)}
      </div>
    );
  }

  const statCards = [
    { icon: Users, label: "المستخدمين", value: stats?.total_users || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: ShoppingBag, label: "الطلبات", value: stats?.total_orders || 0, color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Package, label: "المنتجات", value: stats?.total_products || 0, color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: DollarSign, label: "الإيرادات", value: formatPrice(stats?.revenue_jod || 0, "JOD"), color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {statCards.map((stat, index) => (
        <div key={index} className="p-3 md:p-4 rounded-xl bg-card border border-border">
          <div className={`h-9 w-9 md:h-10 md:w-10 rounded-lg ${stat.bg} flex items-center justify-center mb-2 md:mb-3`}>
            <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
          </div>
          <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
          <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
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
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة المستخدمين</h2>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-10" />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base truncate">{user.name}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {user.role === "admin" ? "مدير" : user.role === "employee" ? "موظف" : "مشتري"}
                    </Badge>
                    {user.is_active ? (
                      <Badge className="bg-green-500 text-xs">نشط</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">معطل</Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => toggleUserStatus(user.id, user.is_active)}>
                  {user.is_active ? <XCircle className="h-5 w-5 text-destructive" /> : <CheckCircle className="h-5 w-5 text-green-500" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Products Management
const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
    
    const codesText = newCodes.trim();
    if (!codesText) {
      toast.error("أدخل الأكواد");
      return;
    }

    setAddingCodes(true);
    try {
      // Use the CSV upload endpoint with text content
      const response = await axios.post(
        `${API_URL}/admin/products/${codesDialog.id}/codes/upload`,
        codesText,
        { 
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'text/plain'
          }
        }
      );
      toast.success(`تم إضافة ${response.data.codes_added} كود`);
      if (response.data.duplicates_skipped > 0) {
        toast.info(`تم تخطي ${response.data.duplicates_skipped} كود مكرر`);
      }
      setCodesDialog(null);
      setNewCodes("");
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إضافة الأكواد");
    } finally {
      setAddingCodes(false);
    }
  };
  
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !codesDialog) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result;
      if (content) {
        setNewCodes(content);
      }
    };
    reader.readAsText(file);
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
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة المنتجات</h2>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex gap-3">
                <img src={product.image_url} alt={product.name} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm md:text-base truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.category_name}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {product.is_featured && <Badge className="bg-accent text-xs">مميز</Badge>}
                      {!product.is_active && <Badge variant="destructive" className="text-xs">معطل</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs md:text-sm">
                    <span>السعر: <strong className="ltr-nums">{formatPrice(product.price_jod, "JOD")}</strong></span>
                    <span>المخزون: <strong className={product.stock_count > 0 ? "text-green-500" : "text-destructive"}>{product.stock_count}</strong></span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCodesDialog(product)}>
                      <Upload className="h-3 w-3 ml-1" />
                      إضافة أكواد
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => toggleProductStatus(product.id, product.is_active)}>
                      {product.is_active ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!codesDialog} onOpenChange={() => setCodesDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">إضافة أكواد</DialogTitle>
            <DialogDescription className="text-sm">{codesDialog?.name}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={newCodes}
            onChange={(e) => setNewCodes(e.target.value)}
            placeholder="كود واحد في كل سطر..."
            className="min-h-[150px] font-mono text-sm"
            dir="ltr"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCodesDialog(null)} className="h-10">إلغاء</Button>
            <Button onClick={handleAddCodes} disabled={addingCodes} className="h-10">
              {addingCodes ? "جاري..." : "إضافة"}
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
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة الطلبات</h2>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : orders.length > 0 ? (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs md:text-sm">#{order.id.slice(0, 8)}</span>
                <Badge className={order.revealed_at ? "bg-green-500" : "bg-accent"} >
                  {order.revealed_at ? "مكشوف" : "جاهز"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs md:text-sm text-muted-foreground truncate max-w-[200px]">
                  {order.items?.map(i => i.product_name).join(", ")}
                </span>
                <span className="font-bold text-sm ltr-nums">{formatPrice(order.total_jod, "JOD")}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">لا توجد طلبات</div>
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
      toast.success("تم شحن المحفظة");
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
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">شحن المحافظ</h2>

      <form onSubmit={handleCredit} className="max-w-md">
        <div className="p-4 md:p-6 rounded-xl bg-card border border-border space-y-4">
          <div>
            <Label className="text-sm">معرف المستخدم</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="UUID" className="mt-1.5 h-10" />
          </div>
          <div>
            <Label className="text-sm">المبلغ (JOD)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1.5 h-10" />
          </div>
          <div>
            <Label className="text-sm">السبب</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="شحن يدوي..." className="mt-1.5 h-10" />
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading}>
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
  const [form, setForm] = useState({ code: "", discount_type: "percentage", discount_value: "", min_purchase: "0", max_uses: "", valid_until: "" });

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
      toast.error(error.response?.data?.detail || "فشل في إنشاء الكود");
    }
  };

  const toggleDiscountStatus = async (discountId, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/admin/discounts/${discountId}`, { is_active: !currentStatus }, { headers: getAuthHeader() });
      setDiscounts((prev) => prev.map((d) => d.id === discountId ? { ...d, is_active: !currentStatus } : d));
      toast.success("تم تحديث الكود");
    } catch (error) {
      toast.error("فشل في تحديث الكود");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl md:text-2xl font-bold">أكواد الخصم</h2>
        <Button onClick={() => setShowCreate(true)} size="sm" className="h-9">
          <Plus className="h-4 w-4 ml-1" />
          إضافة
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : discounts.length > 0 ? (
        <div className="space-y-2">
          {discounts.map((discount) => (
            <div key={discount.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <code className="font-mono text-sm bg-secondary px-2 py-1 rounded">{discount.code}</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    {discount.discount_type === "percentage" ? `${discount.discount_value}%` : formatPrice(discount.discount_value, "JOD")}
                    {" • "}استخدام: {discount.used_count}{discount.max_uses ? `/${discount.max_uses}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {discount.is_active ? <Badge className="bg-green-500 text-xs">فعال</Badge> : <Badge variant="destructive" className="text-xs">معطل</Badge>}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleDiscountStatus(discount.id, discount.is_active)}>
                    {discount.is_active ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">لا توجد أكواد خصم</div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">إنشاء كود خصم</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-sm">كود الخصم</Label>
              <Input value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="SUMMER2025" className="mt-1.5 h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">نوع الخصم</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({...form, discount_type: v})}>
                  <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة %</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">القيمة</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm({...form, discount_value: e.target.value})} className="mt-1.5 h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">الحد الأدنى</Label>
                <Input type="number" value={form.min_purchase} onChange={(e) => setForm({...form, min_purchase: e.target.value})} className="mt-1.5 h-10" />
              </div>
              <div>
                <Label className="text-sm">الحد الأقصى</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({...form, max_uses: e.target.value})} placeholder="∞" className="mt-1.5 h-10" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="h-10">إلغاء</Button>
              <Button type="submit" className="h-10">إنشاء</Button>
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
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إرسال إشعار عام</h2>

      <form onSubmit={handleBroadcast} className="max-w-md">
        <div className="p-4 md:p-6 rounded-xl bg-card border border-border space-y-4">
          <div>
            <Label className="text-sm">عنوان الإشعار</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عروض خاصة!" className="mt-1.5 h-10" />
          </div>
          <div>
            <Label className="text-sm">نص الإشعار</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="احصل على خصم..." className="mt-1.5" rows={3} />
          </div>
          <Button type="submit" className="w-full h-11 gap-2" disabled={sending}>
            <Send className="h-4 w-4" />
            {sending ? "جاري الإرسال..." : "إرسال للجميع"}
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

  const statusColors = { open: "bg-yellow-500", in_progress: "bg-blue-500", resolved: "bg-green-500", closed: "bg-gray-500" };
  const statusLabels = { open: "مفتوحة", in_progress: "قيد المعالجة", resolved: "تم الحل", closed: "مغلقة" };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">الدعم الفني</h2>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm truncate">{ticket.subject}</h3>
                    <Badge className={`${statusColors[ticket.status]} text-xs`}>{statusLabels[ticket.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">من: {ticket.user_name}</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs flex-shrink-0" onClick={() => setSelectedTicket(ticket)}>
                  رد
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">لا توجد تذاكر</div>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">الرد على التذكرة</DialogTitle>
            <DialogDescription className="text-sm">{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="اكتب ردك..." rows={3} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedTicket(null)} className="h-10">إلغاء</Button>
            <Button onClick={handleReply} className="h-10">إرسال</Button>
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
  const location = useLocation();

  // Get page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin") return "لوحة التحكم";
    if (path.includes("users")) return "المستخدمين";
    if (path.includes("products")) return "المنتجات";
    if (path.includes("orders")) return "الطلبات";
    if (path.includes("wallets")) return "المحافظ";
    if (path.includes("discounts")) return "أكواد الخصم";
    if (path.includes("notifications")) return "الإشعارات";
    if (path.includes("tickets")) return "الدعم الفني";
    return "لوحة التحكم";
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1">
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="font-heading font-bold text-lg md:text-xl">{getPageTitle()}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm text-muted-foreground hidden sm:block">مرحباً،</span>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
          <Routes>
            <Route index element={<div className="space-y-6"><DashboardStats /></div>} />
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
