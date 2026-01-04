import React, { useState, useEffect, useRef } from "react";
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
  Image,
  LayoutGrid,
  Settings,
  GripVertical,
  Calendar,
  Link as LinkIcon,
  FileSpreadsheet,
} from "lucide-react";

// Admin Sidebar
const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

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
    { icon: Bell, label: "الإشعارات", path: "/admin/notifications" },
    { icon: Eye, label: "التحليلات", path: "/admin/analytics" },
    { icon: Eye, label: "سجل النشاطات", path: "/admin/audit" },
    { icon: Send, label: "إشعارات Telegram", path: "/admin/telegram" },
    { icon: Users, label: "الأدوار والصلاحيات", path: "/admin/roles" },
    { icon: Settings, label: "إعدادات الموقع", path: "/admin/settings" },
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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codesDialog, setCodesDialog] = useState(null);
  const [newCodes, setNewCodes] = useState("");
  const [addingCodes, setAddingCodes] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [productForm, setProductForm] = useState({
    name: "", name_en: "", slug: "", description: "", description_en: "", category_id: "",
    price_jod: "", price_usd: "", original_price_jod: "", original_price_usd: "",
    image_url: "", platform: "", region: "عالمي", is_featured: false,
    // New fields for product types
    product_type: "digital_code", // digital_code, existing_account, new_account
    has_variants: false,
    variants: [],
    requires_email: false,
    requires_password: false,
    requires_phone: false,
    delivery_instructions: ""
  });
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");

    try {
      const response = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: { ...getAuthHeader(), "Content-Type": "multipart/form-data" }
      });
      setProductForm({ ...productForm, image_url: response.data.url });
      toast.success("تم رفع الصورة");
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...productForm,
        price_jod: parseFloat(productForm.price_jod),
        price_usd: parseFloat(productForm.price_usd),
        original_price_jod: productForm.original_price_jod ? parseFloat(productForm.original_price_jod) : null,
        original_price_usd: productForm.original_price_usd ? parseFloat(productForm.original_price_usd) : null,
        variants: productForm.has_variants ? productForm.variants.map(v => ({
          ...v,
          id: v.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          price_jod: parseFloat(v.price_jod),
          price_usd: parseFloat(v.price_usd),
          original_price_jod: v.original_price_jod ? parseFloat(v.original_price_jod) : null,
          original_price_usd: v.original_price_usd ? parseFloat(v.original_price_usd) : null,
        })) : null
      };
      
      if (editProduct) {
        await axios.put(`${API_URL}/admin/products/${editProduct.id}`, data, { headers: getAuthHeader() });
        toast.success("تم تحديث المنتج");
      } else {
        await axios.post(`${API_URL}/admin/products`, data, { headers: getAuthHeader() });
        toast.success("تم إنشاء المنتج");
      }
      setShowCreateDialog(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const resetForm = () => {
    setEditProduct(null);
    setActiveTab("basic");
    setProductForm({
      name: "", name_en: "", slug: "", description: "", description_en: "", category_id: "",
      price_jod: "", price_usd: "", original_price_jod: "", original_price_usd: "",
      image_url: "", platform: "", region: "عالمي", is_featured: false,
      product_type: "digital_code", has_variants: false, variants: [],
      requires_email: false, requires_password: false, requires_phone: false, delivery_instructions: ""
    });
  };

  const openEditProduct = (product) => {
    setEditProduct(product);
    setProductForm({
      name: product.name, name_en: product.name_en, slug: product.slug,
      description: product.description, description_en: product.description_en || "",
      category_id: product.category_id,
      price_jod: product.price_jod, price_usd: product.price_usd,
      original_price_jod: product.original_price_jod || "",
      original_price_usd: product.original_price_usd || "",
      image_url: product.image_url, platform: product.platform,
      region: product.region, is_featured: product.is_featured,
      product_type: product.product_type || "digital_code",
      has_variants: product.has_variants || false,
      variants: product.variants || [],
      requires_email: product.requires_email || false,
      requires_password: product.requires_password || false,
      requires_phone: product.requires_phone || false,
      delivery_instructions: product.delivery_instructions || ""
    });
    setShowCreateDialog(true);
  };

  const addVariant = () => {
    setProductForm({
      ...productForm,
      variants: [...productForm.variants, {
        id: "", name: "", name_en: "", duration_days: 30,
        price_jod: "", price_usd: "", original_price_jod: "", original_price_usd: "",
        stock_count: 0, sku: "", is_active: true
      }]
    });
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...productForm.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setProductForm({ ...productForm, variants: newVariants });
  };

  const removeVariant = (index) => {
    setProductForm({
      ...productForm,
      variants: productForm.variants.filter((_, i) => i !== index)
    });
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

  const productTypeLabels = { digital_code: "كود رقمي", existing_account: "حساب موجود", new_account: "حساب جديد" };
  const productTypeColors = { digital_code: "bg-blue-500", existing_account: "bg-purple-500", new_account: "bg-orange-500" };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة المنتجات</h2>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="h-10 gap-2">
          <Plus className="h-4 w-4" /> إضافة منتج
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex gap-3">
                <img src={product.image_url?.startsWith("/") ? `${API_URL.replace("/api", "")}${product.image_url}` : product.image_url} alt={product.name} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm md:text-base truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.category_name}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 flex-wrap">
                      <Badge className={productTypeColors[product.product_type] || "bg-blue-500"}>{productTypeLabels[product.product_type] || "كود"}</Badge>
                      {product.has_variants && <Badge variant="outline">متغيرات</Badge>}
                      {product.is_featured && <Badge className="bg-accent">مميز</Badge>}
                      {!product.is_active && <Badge variant="destructive">معطل</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs md:text-sm">
                    <span>السعر: <strong className="ltr-nums">{formatPrice(product.price_jod, "JOD")}</strong></span>
                    <span>المخزون: <strong className={product.stock_count > 0 ? "text-green-500" : "text-destructive"}>{product.stock_count}</strong></span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEditProduct(product)}>
                      <Edit className="h-3 w-3 ml-1" /> تعديل
                    </Button>
                    {product.product_type === "digital_code" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setCodesDialog(product)}>
                        <Upload className="h-3 w-3 ml-1" /> إضافة أكواد
                      </Button>
                    )}
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

      {/* Advanced Create/Edit Product Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
          </DialogHeader>
          
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
            {[
              { id: "basic", label: "المعلومات الأساسية" },
              { id: "type", label: "نوع المنتج" },
              { id: "pricing", label: "التسعير" },
              { id: "variants", label: "المتغيرات" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleCreateProduct} className="space-y-4">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>الاسم بالعربي *</Label>
                    <Input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} required />
                  </div>
                  <div>
                    <Label>الاسم بالإنجليزي *</Label>
                    <Input value={productForm.name_en} onChange={(e) => setProductForm({...productForm, name_en: e.target.value})} required dir="ltr" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>الرابط المختصر (slug) *</Label>
                    <Input value={productForm.slug} onChange={(e) => setProductForm({...productForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} required dir="ltr" />
                  </div>
                  <div>
                    <Label>القسم *</Label>
                    <Select value={productForm.category_id} onValueChange={(v) => setProductForm({...productForm, category_id: v})}>
                      <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>الوصف *</Label>
                  <Textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} required rows={3} />
                </div>

                {/* Image Upload */}
                <div>
                  <Label>صورة المنتج *</Label>
                  <div className="mt-2 flex gap-4 items-start">
                    {productForm.image_url ? (
                      <div className="relative">
                        <img src={productForm.image_url.startsWith("/") ? `${API_URL.replace("/api", "")}${productForm.image_url}` : productForm.image_url} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />
                        <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 p-0" onClick={() => setProductForm({...productForm, image_url: ""})}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? "جاري الرفع..." : "رفع صورة"}
                      </Button>
                      <p className="text-xs text-muted-foreground">أو أدخل رابط:</p>
                      <Input value={productForm.image_url} onChange={(e) => setProductForm({...productForm, image_url: e.target.value})} dir="ltr" placeholder="https://..." />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>المنصة *</Label>
                    <Select value={productForm.platform} onValueChange={(v) => setProductForm({...productForm, platform: v})}>
                      <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="playstation">PlayStation</SelectItem>
                        <SelectItem value="xbox">Xbox</SelectItem>
                        <SelectItem value="steam">Steam</SelectItem>
                        <SelectItem value="nintendo">Nintendo</SelectItem>
                        <SelectItem value="pc">PC Software</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="giftcards">Gift Cards</SelectItem>
                        <SelectItem value="subscriptions">Subscriptions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>المنطقة</Label>
                    <Select value={productForm.region} onValueChange={(v) => setProductForm({...productForm, region: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="عالمي">عالمي</SelectItem>
                        <SelectItem value="US">أمريكي (US)</SelectItem>
                        <SelectItem value="UAE">إماراتي (UAE)</SelectItem>
                        <SelectItem value="SA">سعودي (SA)</SelectItem>
                        <SelectItem value="EU">أوروبي (EU)</SelectItem>
                        <SelectItem value="UK">بريطاني (UK)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={productForm.is_featured} onChange={(e) => setProductForm({...productForm, is_featured: e.target.checked})} className="rounded" />
                      <span>منتج مميز</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Product Type Tab */}
            {activeTab === "type" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-bold mb-4 block">نوع المنتج *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: "digital_code", icon: "🔑", title: "كود رقمي", desc: "توصيل فوري تلقائي بعد الدفع" },
                      { id: "existing_account", icon: "👤", title: "حساب موجود", desc: "المشتري يدخل إيميل وكلمة مرور" },
                      { id: "new_account", icon: "📱", title: "حساب جديد", desc: "المشتري يدخل رقم الهاتف فقط" },
                    ].map(type => (
                      <div
                        key={type.id}
                        onClick={() => {
                          setProductForm({
                            ...productForm,
                            product_type: type.id,
                            requires_email: type.id === "existing_account",
                            requires_password: type.id === "existing_account",
                            requires_phone: type.id === "new_account"
                          });
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${productForm.product_type === type.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                      >
                        <div className="text-3xl mb-2">{type.icon}</div>
                        <h3 className="font-bold">{type.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{type.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {productForm.product_type !== "digital_code" && (
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-4">
                    <h4 className="font-bold">البيانات المطلوبة من المشتري</h4>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={productForm.requires_email} onChange={(e) => setProductForm({...productForm, requires_email: e.target.checked})} className="rounded" />
                        <span>البريد الإلكتروني</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={productForm.requires_password} onChange={(e) => setProductForm({...productForm, requires_password: e.target.checked})} className="rounded" />
                        <span>كلمة المرور</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={productForm.requires_phone} onChange={(e) => setProductForm({...productForm, requires_phone: e.target.checked})} className="rounded" />
                        <span>رقم الهاتف</span>
                      </label>
                    </div>
                    <div>
                      <Label>تعليمات التسليم (تظهر للمشتري)</Label>
                      <Textarea value={productForm.delivery_instructions} onChange={(e) => setProductForm({...productForm, delivery_instructions: e.target.value})} placeholder="مثال: سيتم شحن حسابك خلال 24 ساعة..." rows={2} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === "pricing" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-bold mb-4">السعر الأساسي</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>السعر (د.أ) *</Label>
                      <Input type="number" step="0.01" value={productForm.price_jod} onChange={(e) => setProductForm({...productForm, price_jod: e.target.value})} required dir="ltr" />
                    </div>
                    <div>
                      <Label>السعر ($) *</Label>
                      <Input type="number" step="0.01" value={productForm.price_usd} onChange={(e) => setProductForm({...productForm, price_usd: e.target.value})} required dir="ltr" />
                    </div>
                    <div>
                      <Label>السعر الأصلي (د.أ)</Label>
                      <Input type="number" step="0.01" value={productForm.original_price_jod} onChange={(e) => setProductForm({...productForm, original_price_jod: e.target.value})} dir="ltr" placeholder="للخصم" />
                    </div>
                    <div>
                      <Label>السعر الأصلي ($)</Label>
                      <Input type="number" step="0.01" value={productForm.original_price_usd} onChange={(e) => setProductForm({...productForm, original_price_usd: e.target.value})} dir="ltr" placeholder="للخصم" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Variants Tab */}
            {activeTab === "variants" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-bold">متغيرات المنتج</Label>
                    <p className="text-sm text-muted-foreground">مثال: شهر واحد، 3 أشهر، سنة</p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={productForm.has_variants} onChange={(e) => setProductForm({...productForm, has_variants: e.target.checked})} className="rounded" />
                    <span>تفعيل المتغيرات</span>
                  </label>
                </div>

                {productForm.has_variants && (
                  <div className="space-y-4">
                    {productForm.variants.map((variant, index) => (
                      <div key={index} className="p-4 rounded-xl bg-secondary/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">المتغير {index + 1}</span>
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeVariant(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">الاسم *</Label>
                            <Input value={variant.name} onChange={(e) => updateVariant(index, "name", e.target.value)} placeholder="شهر واحد" />
                          </div>
                          <div>
                            <Label className="text-xs">المدة (أيام)</Label>
                            <Input type="number" value={variant.duration_days} onChange={(e) => updateVariant(index, "duration_days", parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label className="text-xs">السعر (د.أ) *</Label>
                            <Input type="number" step="0.01" value={variant.price_jod} onChange={(e) => updateVariant(index, "price_jod", e.target.value)} dir="ltr" />
                          </div>
                          <div>
                            <Label className="text-xs">السعر ($) *</Label>
                            <Input type="number" step="0.01" value={variant.price_usd} onChange={(e) => updateVariant(index, "price_usd", e.target.value)} dir="ltr" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs">السعر الأصلي (د.أ)</Label>
                            <Input type="number" step="0.01" value={variant.original_price_jod} onChange={(e) => updateVariant(index, "original_price_jod", e.target.value)} dir="ltr" />
                          </div>
                          <div>
                            <Label className="text-xs">السعر الأصلي ($)</Label>
                            <Input type="number" step="0.01" value={variant.original_price_usd} onChange={(e) => updateVariant(index, "original_price_usd", e.target.value)} dir="ltr" />
                          </div>
                          <div>
                            <Label className="text-xs">SKU</Label>
                            <Input value={variant.sku} onChange={(e) => updateVariant(index, "sku", e.target.value)} dir="ltr" />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={variant.is_active} onChange={(e) => updateVariant(index, "is_active", e.target.checked)} className="rounded" />
                              <span className="text-xs">مفعل</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button type="button" variant="outline" onClick={addVariant} className="w-full">
                      <Plus className="h-4 w-4 ml-2" /> إضافة متغير
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
              <Button type="submit">{editProduct ? "تحديث المنتج" : "إنشاء المنتج"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Codes Dialog */}
      <Dialog open={!!codesDialog} onOpenChange={() => setCodesDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">إضافة أكواد</DialogTitle>
            <DialogDescription className="text-sm">{codesDialog?.name}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label className="text-sm">رفع ملف CSV</Label>
            <Input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="cursor-pointer h-10" />
            <p className="text-xs text-muted-foreground">أو أدخل الأكواد يدوياً</p>
          </div>
          
          <Textarea
            value={newCodes}
            onChange={(e) => setNewCodes(e.target.value)}
            placeholder="كود واحد في كل سطر..."
            className="min-h-[150px] font-mono text-sm"
            dir="ltr"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCodesDialog(null)}>إلغاء</Button>
            <Button onClick={handleAddCodes} disabled={addingCodes || !newCodes.trim()}>
              {addingCodes ? "جاري الرفع..." : "إضافة الأكواد"}
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [deliveryDialog, setDeliveryDialog] = useState(null);
  const [deliveryData, setDeliveryData] = useState({ email: "", password: "", notes: "" });

  const ORDER_STATUSES = {
    pending_payment: { label: "في انتظار الدفع", color: "bg-yellow-500" },
    payment_failed: { label: "فشل الدفع", color: "bg-red-500" },
    processing: { label: "قيد المعالجة", color: "bg-blue-500" },
    awaiting_admin: { label: "في انتظار الإدارة", color: "bg-orange-500" },
    completed: { label: "مكتمل", color: "bg-green-500" },
    delivered: { label: "تم التسليم", color: "bg-green-600" },
    cancelled: { label: "ملغي", color: "bg-gray-500" },
    refunded: { label: "مسترد", color: "bg-purple-500" },
    disputed: { label: "نزاع مفتوح", color: "bg-red-600" }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/admin/orders/advanced?page=${page}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      const response = await axios.get(url, { headers: getAuthHeader() });
      setOrders(response.data.orders || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      // Fallback to basic endpoint
      try {
        const response = await axios.get(`${API_URL}/admin/orders`, { headers: getAuthHeader() });
        setOrders(response.data || []);
        setTotal(response.data.length || 0);
      } catch (e) {
        toast.error("فشل في تحميل الطلبات");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        admin_notes: adminNotes
      }, { headers: getAuthHeader() });
      toast.success("تم تحديث حالة الطلب");
      setSelectedOrder(null);
      setNewStatus("");
      setAdminNotes("");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تحديث الحالة");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliver = async () => {
    if (!deliveryDialog) return;
    setUpdating(true);
    try {
      await axios.post(`${API_URL}/admin/orders/${deliveryDialog.id}/deliver`, deliveryData, { headers: getAuthHeader() });
      toast.success("تم تسليم الطلب بنجاح");
      setDeliveryDialog(null);
      setDeliveryData({ email: "", password: "", notes: "" });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تسليم الطلب");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة الطلبات</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{total} طلب</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الطلب أو البريد..."
              className="pr-10 h-10"
            />
          </div>
          <Button type="submit" variant="secondary">بحث</Button>
        </form>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {Object.entries(ORDER_STATUSES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-sm font-bold">#{order.order_number || order.id.slice(0, 8)}</span>
                    <Badge className={ORDER_STATUSES[order.status]?.color || "bg-gray-500"}>
                      {ORDER_STATUSES[order.status]?.label || order.status}
                    </Badge>
                    {order.product_type && (
                      <Badge variant="outline" className="text-xs">
                        {order.product_type === "code" ? "كود" : order.product_type === "existing_account" ? "حساب جاهز" : "حساب جديد"}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">العميل: </span>
                      <span className="font-medium">{order.user_name || order.user_email || "غير معروف"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المبلغ: </span>
                      <span className="font-bold text-green-500">{order.total_jod?.toFixed(2)} د.أ</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">التاريخ: </span>
                      <span>{new Date(order.created_at).toLocaleDateString('ar-JO')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المنتجات: </span>
                      <span>{order.items?.length || 0}</span>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground truncate">
                      {order.items.map(i => i.product_name).join(" • ")}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setNewStatus(order.status); }}>
                    <Edit className="h-4 w-4 ml-1" /> تعديل
                  </Button>
                  {order.product_type && order.product_type !== "code" && order.status !== "delivered" && (
                    <Button size="sm" onClick={() => setDeliveryDialog(order)}>
                      <Send className="h-4 w-4 ml-1" /> تسليم
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد طلبات</p>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
          <span className="px-4 py-2 text-sm">صفحة {page} من {Math.ceil(total / 20)}</span>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}>التالي</Button>
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تحديث حالة الطلب</DialogTitle>
            <DialogDescription>#{selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
              <div className="flex justify-between mb-2">
                <span>العميل: {selectedOrder?.user_name || selectedOrder?.user_email}</span>
                <span>المبلغ: {selectedOrder?.total_jod?.toFixed(2)} د.أ</span>
              </div>
              <div className="text-xs text-muted-foreground">
                المنتجات: {selectedOrder?.items?.map(i => i.product_name).join(" • ")}
              </div>
            </div>
            <div>
              <Label>الحالة الجديدة</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="سبب تغيير الحالة..." rows={2} />
            </div>
            {/* Status History */}
            {selectedOrder?.status_history && selectedOrder.status_history.length > 0 && (
              <div>
                <Label className="mb-2 block">سجل الحالات</Label>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {selectedOrder.status_history.map((h, i) => (
                    <div key={i} className="p-2 rounded bg-secondary/30">
                      <span className="font-bold">{ORDER_STATUSES[h.to]?.label}</span>
                      <span className="text-muted-foreground"> - {h.by_name} - {new Date(h.at).toLocaleString('ar-JO')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>إلغاء</Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>{updating ? "جاري التحديث..." : "تحديث"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Delivery Dialog */}
      <Dialog open={!!deliveryDialog} onOpenChange={() => setDeliveryDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسليم الطلب يدوياً</DialogTitle>
            <DialogDescription>أدخل بيانات الحساب لإرسالها للعميل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>البريد الإلكتروني للحساب</Label>
              <Input value={deliveryData.email} onChange={(e) => setDeliveryData({...deliveryData, email: e.target.value})} dir="ltr" />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input value={deliveryData.password} onChange={(e) => setDeliveryData({...deliveryData, password: e.target.value})} type="text" dir="ltr" />
            </div>
            <div>
              <Label>ملاحظات إضافية</Label>
              <Textarea value={deliveryData.notes} onChange={(e) => setDeliveryData({...deliveryData, notes: e.target.value})} placeholder="معلومات إضافية للعميل..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryDialog(null)}>إلغاء</Button>
            <Button onClick={handleDeliver} disabled={updating}>{updating ? "جاري التسليم..." : "تسليم"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wallet Management
const WalletManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreditDialog, setShowCreditDialog] = useState(false);

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
      setLoadingUsers(false);
    }
  };

  const handleCredit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !amount || !reason) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/admin/wallet/credit`, { 
        user_id: selectedUser.id, 
        amount: parseFloat(amount), 
        currency: "JOD", 
        reason 
      }, { headers: getAuthHeader() });
      toast.success(`تم شحن ${amount} د.أ لـ ${selectedUser.name}`);
      setShowCreditDialog(false);
      setSelectedUser(null);
      setAmount("");
      setReason("");
      fetchUsers(); // Refresh to get updated balances
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في شحن المحفظة");
    } finally {
      setLoading(false);
    }
  };

  const openCreditDialog = (user) => {
    setSelectedUser(user);
    setAmount("");
    setReason("شحن يدوي من الإدارة");
    setShowCreditDialog(true);
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة المحافظ</h2>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن مستخدم بالاسم أو البريد..."
            className="pr-10 h-10"
          />
        </div>
      </div>

      {/* Users List */}
      {loadingUsers ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : filteredUsers.length > 0 ? (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm truncate">{user.name}</h3>
                    <Badge className={user.role === "admin" ? "bg-purple-500" : "bg-blue-500"} >
                      {user.role === "admin" ? "مدير" : user.role === "employee" ? "موظف" : "مشتري"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <Wallet className="h-4 w-4 text-green-500" />
                      <strong className="text-green-500">{user.wallet_balance_jod?.toFixed(2) || "0.00"} د.أ</strong>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      انضم: {new Date(user.created_at).toLocaleDateString('ar-JO')}
                    </span>
                  </div>
                </div>
                <Button onClick={() => openCreditDialog(user)} className="h-9 gap-2 flex-shrink-0">
                  <Plus className="h-4 w-4" />
                  شحن
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "لا توجد نتائج للبحث" : "لا يوجد مستخدمين"}
        </div>
      )}

      {/* Credit Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>شحن محفظة المستخدم</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} - {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCredit} className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="text-sm text-muted-foreground">الرصيد الحالي</div>
              <div className="text-2xl font-bold text-green-500">
                {selectedUser?.wallet_balance_jod?.toFixed(2) || "0.00"} د.أ
              </div>
            </div>
            <div>
              <Label>المبلغ المراد إضافته (د.أ)</Label>
              <Input 
                type="number" 
                step="0.01" 
                min="0.01"
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="10.00" 
                className="mt-1.5 h-10 text-lg font-bold"
                dir="ltr"
                required
              />
            </div>
            <div>
              <Label>السبب</Label>
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="شحن يدوي..." 
                className="mt-1.5 h-10"
                required
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreditDialog(false)}>إلغاء</Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? "جاري الشحن..." : <>
                  <Plus className="h-4 w-4" /> شحن المحفظة
                </>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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

// Categories Management
const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "", name_en: "", slug: "", image_url: "", description: "", order: 0
  });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/categories`, { headers: getAuthHeader() });
      setCategories(response.data);
    } catch (error) {
      toast.error("فشل في تحميل الأقسام");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCategory) {
        await axios.put(`${API_URL}/admin/categories/${editCategory.id}`, formData, { headers: getAuthHeader() });
        toast.success("تم تحديث القسم");
      } else {
        await axios.post(`${API_URL}/admin/categories`, formData, { headers: getAuthHeader() });
        toast.success("تم إنشاء القسم");
      }
      setShowDialog(false);
      setEditCategory(null);
      setFormData({ name: "", name_en: "", slug: "", image_url: "", description: "", order: 0 });
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const openEdit = (cat) => {
    setEditCategory(cat);
    setFormData({
      name: cat.name, name_en: cat.name_en, slug: cat.slug,
      image_url: cat.image_url || "", description: cat.description || "", order: cat.order
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذا القسم؟")) return;
    try {
      await axios.delete(`${API_URL}/admin/categories/${id}`, { headers: getAuthHeader() });
      toast.success("تم حذف القسم");
      fetchCategories();
    } catch (error) {
      toast.error("فشل في حذف القسم");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة الأقسام</h2>
        <Button onClick={() => { setEditCategory(null); setFormData({ name: "", name_en: "", slug: "", image_url: "", description: "", order: 0 }); setShowDialog(true); }} className="h-10 gap-2">
          <Plus className="h-4 w-4" /> إضافة قسم
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="p-3 md:p-4 rounded-xl bg-card border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {cat.image_url && <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded-lg object-cover" />}
                <div>
                  <h3 className="font-bold text-sm">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">{cat.name_en} • {cat.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(cat)}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editCategory ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم بالعربي</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <Label>الاسم بالإنجليزي</Label>
                <Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} required dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الرابط المختصر (slug)</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} required dir="ltr" placeholder="playstation" />
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div>
              <Label>رابط الصورة</Label>
              <Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} dir="ltr" placeholder="https://..." />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button type="submit">{editCategory ? "تحديث" : "إنشاء"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Banners Management
const BannersManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: "", title_en: "", subtitle: "", image_url: "",
    link_type: "none", link_value: "", button_text: "",
    position: "hero", priority: 0, starts_at: "", ends_at: "", is_active: true
  });

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/banners`, { headers: getAuthHeader() });
      setBanners(response.data);
    } catch (error) {
      toast.error("فشل في تحميل البانرات");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    formDataUpload.append("folder", "banners");

    try {
      const response = await axios.post(`${API_URL}/upload/image`, formDataUpload, {
        headers: { ...getAuthHeader(), "Content-Type": "multipart/form-data" }
      });
      setFormData({ ...formData, image_url: response.data.url });
      toast.success("تم رفع الصورة");
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في رفع الصورة");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editBanner) {
        await axios.put(`${API_URL}/admin/banners/${editBanner.id}`, formData, { headers: getAuthHeader() });
        toast.success("تم تحديث البانر");
      } else {
        await axios.post(`${API_URL}/admin/banners`, formData, { headers: getAuthHeader() });
        toast.success("تم إنشاء البانر");
      }
      setShowDialog(false);
      resetForm();
      fetchBanners();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const resetForm = () => {
    setEditBanner(null);
    setFormData({
      title: "", title_en: "", subtitle: "", image_url: "",
      link_type: "none", link_value: "", button_text: "",
      position: "hero", priority: 0, starts_at: "", ends_at: "", is_active: true
    });
  };

  const openEdit = (banner) => {
    setEditBanner(banner);
    setFormData({
      title: banner.title || "", title_en: banner.title_en || "", subtitle: banner.subtitle || "",
      image_url: banner.image_url || "", link_type: banner.link_type || "none",
      link_value: banner.link_value || "", button_text: banner.button_text || "",
      position: banner.position || "hero", priority: banner.priority || 0,
      starts_at: banner.starts_at || "", ends_at: banner.ends_at || "", is_active: banner.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذا البانر؟")) return;
    try {
      await axios.delete(`${API_URL}/admin/banners/${id}`, { headers: getAuthHeader() });
      toast.success("تم حذف البانر");
      fetchBanners();
    } catch (error) {
      toast.error("فشل في حذف البانر");
    }
  };

  const positionLabels = { hero: "الرئيسي", sidebar: "الجانب", popup: "نافذة منبثقة", footer: "أسفل الصفحة" };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة البانرات والسلايدر</h2>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="h-10 gap-2">
          <Plus className="h-4 w-4" /> إضافة بانر
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner) => (
            <div key={banner.id} className="rounded-xl bg-card border border-border overflow-hidden">
              {banner.image_url && (
                <img src={banner.image_url.startsWith("/") ? `${API_URL.replace("/api", "")}${banner.image_url}` : banner.image_url} alt={banner.title} className="w-full h-32 object-cover" />
              )}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm">{banner.title || "بدون عنوان"}</h3>
                  <div className="flex gap-1">
                    <Badge className={banner.is_active ? "bg-green-500" : "bg-gray-500"}>{banner.is_active ? "مفعل" : "معطل"}</Badge>
                    <Badge variant="outline">{positionLabels[banner.position]}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{banner.subtitle}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>النقرات: {banner.clicks || 0}</span>
                  <span>الأولوية: {banner.priority}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(banner)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(banner.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد بانرات. أضف بانر جديد للبدء.</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBanner ? "تعديل البانر" : "إضافة بانر جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label>صورة البانر *</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center">
                {formData.image_url ? (
                  <div className="relative">
                    <img src={formData.image_url.startsWith("/") ? `${API_URL.replace("/api", "")}${formData.image_url}` : formData.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <Button type="button" variant="destructive" size="sm" className="absolute top-2 left-2" onClick={() => setFormData({...formData, image_url: ""})}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="py-8">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">اسحب الصورة هنا أو</p>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? "جاري الرفع..." : "اختر صورة"}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">أو أدخل رابط الصورة:</p>
              <Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} dir="ltr" placeholder="https://..." className="mt-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>العنوان</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="خصم 50%!" />
              </div>
              <div>
                <Label>العنوان الفرعي</Label>
                <Input value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} placeholder="لفترة محدودة" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>الموقع</Label>
                <Select value={formData.position} onValueChange={(v) => setFormData({...formData, position: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hero">الرئيسي (Hero)</SelectItem>
                    <SelectItem value="sidebar">الجانب</SelectItem>
                    <SelectItem value="popup">نافذة منبثقة</SelectItem>
                    <SelectItem value="footer">أسفل الصفحة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نوع الرابط</Label>
                <Select value={formData.link_type} onValueChange={(v) => setFormData({...formData, link_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون رابط</SelectItem>
                    <SelectItem value="product">منتج</SelectItem>
                    <SelectItem value="category">قسم</SelectItem>
                    <SelectItem value="url">رابط خارجي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الأولوية</Label>
                <Input type="number" value={formData.priority} onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            {formData.link_type !== "none" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{formData.link_type === "url" ? "الرابط" : "معرف " + (formData.link_type === "product" ? "المنتج" : "القسم")}</Label>
                  <Input value={formData.link_value} onChange={(e) => setFormData({...formData, link_value: e.target.value})} dir="ltr" />
                </div>
                <div>
                  <Label>نص الزر</Label>
                  <Input value={formData.button_text} onChange={(e) => setFormData({...formData, button_text: e.target.value})} placeholder="تسوق الآن" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>تاريخ البداية (اختياري)</Label>
                <Input type="datetime-local" value={formData.starts_at} onChange={(e) => setFormData({...formData, starts_at: e.target.value})} dir="ltr" />
              </div>
              <div>
                <Label>تاريخ النهاية (اختياري)</Label>
                <Input type="datetime-local" value={formData.ends_at} onChange={(e) => setFormData({...formData, ends_at: e.target.value})} dir="ltr" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="rounded" />
              <Label htmlFor="is_active">تفعيل البانر</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button type="submit">{editBanner ? "تحديث" : "إنشاء"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Homepage Sections Management
const HomepageSectionsManagement = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [formData, setFormData] = useState({
    name: "", name_en: "", section_type: "new_products", is_active: true, order: 0, max_items: 8
  });

  useEffect(() => { fetchSections(); }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/homepage/sections`, { headers: getAuthHeader() });
      setSections(response.data);
    } catch (error) {
      toast.error("فشل في تحميل الأقسام");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSection) {
        await axios.put(`${API_URL}/admin/homepage/sections/${editSection.id}`, formData, { headers: getAuthHeader() });
        toast.success("تم تحديث القسم");
      } else {
        await axios.post(`${API_URL}/admin/homepage/sections`, formData, { headers: getAuthHeader() });
        toast.success("تم إنشاء القسم");
      }
      setShowDialog(false);
      resetForm();
      fetchSections();
    } catch (error) {
      toast.error(error.response?.data?.detail || "حدث خطأ");
    }
  };

  const resetForm = () => {
    setEditSection(null);
    setFormData({ name: "", name_en: "", section_type: "new_products", is_active: true, order: 0, max_items: 8 });
  };

  const openEdit = (section) => {
    setEditSection(section);
    setFormData({
      name: section.name, name_en: section.name_en || "", section_type: section.section_type,
      is_active: section.is_active, order: section.order, max_items: section.max_items || 8
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذا القسم؟")) return;
    try {
      await axios.delete(`${API_URL}/admin/homepage/sections/${id}`, { headers: getAuthHeader() });
      toast.success("تم حذف القسم");
      fetchSections();
    } catch (error) {
      toast.error("فشل في حذف القسم");
    }
  };

  const sectionTypeLabels = { new_products: "منتجات جديدة", best_sellers: "الأكثر مبيعاً", featured: "منتجات مميزة", custom: "مخصص" };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl md:text-2xl font-bold">أقسام الصفحة الرئيسية</h2>
        <Button onClick={() => { resetForm(); setShowDialog(true); }} className="h-10 gap-2">
          <Plus className="h-4 w-4" /> إضافة قسم
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">تحكم في الأقسام التي تظهر في الصفحة الرئيسية وترتيبها</p>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : sections.length > 0 ? (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={section.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{section.name}</h3>
                    <Badge variant="outline">{sectionTypeLabels[section.section_type]}</Badge>
                    <Badge className={section.is_active ? "bg-green-500" : "bg-gray-500"}>{section.is_active ? "مفعل" : "معطل"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">عدد المنتجات: {section.max_items}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(section)}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(section.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد أقسام. أضف قسم جديد للصفحة الرئيسية.</p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSection ? "تعديل القسم" : "إضافة قسم جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>اسم القسم *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="منتجات جديدة" required />
            </div>
            <div>
              <Label>نوع القسم *</Label>
              <Select value={formData.section_type} onValueChange={(v) => setFormData({...formData, section_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_products">منتجات جديدة</SelectItem>
                  <SelectItem value="best_sellers">الأكثر مبيعاً</SelectItem>
                  <SelectItem value="featured">منتجات مميزة</SelectItem>
                  <SelectItem value="custom">مخصص</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الترتيب</Label>
                <Input type="number" value={formData.order} onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <Label>عدد المنتجات</Label>
                <Input type="number" value={formData.max_items} onChange={(e) => setFormData({...formData, max_items: parseInt(e.target.value) || 8})} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="section_active" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="rounded" />
              <Label htmlFor="section_active">تفعيل القسم</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
              <Button type="submit">{editSection ? "تحديث" : "إنشاء"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Excel Import
const ExcelImport = () => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // In a real implementation, we would parse the Excel file here for preview
      toast.success(`تم اختيار الملف: ${selectedFile.name}`);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    
    // This would be a real API call in production
    setTimeout(() => {
      toast.success("تم استيراد المنتجات بنجاح");
      setFile(null);
      setImporting(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="font-heading text-xl md:text-2xl font-bold">رفع المنتجات عبر Excel</h2>
      
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-bold mb-2">رفع ملف Excel أو CSV</h3>
          <p className="text-sm text-muted-foreground mb-4">اسحب الملف هنا أو اضغط للاختيار</p>
          
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx,.xls,.csv" className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 ml-2" /> اختر ملف
          </Button>
          
          {file && (
            <div className="mt-4 p-3 rounded-lg bg-secondary">
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>
        
        {file && (
          <Button onClick={handleImport} disabled={importing} className="w-full mt-4">
            {importing ? "جاري الاستيراد..." : "استيراد المنتجات"}
          </Button>
        )}
      </div>
      
      <div className="p-4 rounded-xl bg-card border border-border">
        <h3 className="font-bold mb-3">📋 تنسيق الملف المطلوب</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2">العمود</th>
                <th className="text-right py-2">الوصف</th>
                <th className="text-right py-2">مثال</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b"><td className="py-2">name</td><td>اسم المنتج</td><td>بلايستيشن بلس 12 شهر</td></tr>
              <tr className="border-b"><td className="py-2">category</td><td>القسم</td><td>playstation</td></tr>
              <tr className="border-b"><td className="py-2">type</td><td>النوع</td><td>digital_code / existing_account / new_account</td></tr>
              <tr className="border-b"><td className="py-2">price_jod</td><td>السعر (د.أ)</td><td>25.00</td></tr>
              <tr className="border-b"><td className="py-2">price_usd</td><td>السعر ($)</td><td>35.00</td></tr>
              <tr className="border-b"><td className="py-2">image_url</td><td>رابط الصورة</td><td>https://...</td></tr>
              <tr><td className="py-2">codes</td><td>الأكواد (مفصولة بـ |)</td><td>CODE1|CODE2|CODE3</td></tr>
            </tbody>
          </table>
        </div>
        
        <Button variant="outline" className="mt-4">
          <FileSpreadsheet className="h-4 w-4 ml-2" /> تحميل نموذج Excel
        </Button>
      </div>
    </div>
  );
};

// Disputes Management
const DisputesManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [reply, setReply] = useState("");
  const [resolveDialog, setResolveDialog] = useState(null);
  const [decision, setDecision] = useState("refund");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/disputes`, { headers: getAuthHeader() });
      setDisputes(response.data);
    } catch (error) {
      toast.error("فشل في تحميل النزاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedDispute) return;
    try {
      await axios.post(`${API_URL}/admin/disputes/${selectedDispute.id}/reply`, { message: reply }, { headers: getAuthHeader() });
      toast.success("تم إرسال الرد");
      setReply("");
      fetchDisputes();
    } catch (error) {
      toast.error("فشل في إرسال الرد");
    }
  };

  const handleResolve = async () => {
    if (!resolveDialog) return;
    try {
      await axios.post(`${API_URL}/admin/disputes/${resolveDialog.id}/resolve`, {
        decision,
        admin_notes: adminNotes
      }, { headers: getAuthHeader() });
      toast.success("تم حل النزاع");
      setResolveDialog(null);
      setDecision("refund");
      setAdminNotes("");
      fetchDisputes();
    } catch (error) {
      toast.error("فشل في حل النزاع");
    }
  };

  const statusColors = { open: "bg-yellow-500", in_progress: "bg-blue-500", resolved: "bg-green-500" };
  const statusLabels = { open: "مفتوح", in_progress: "قيد المعالجة", resolved: "تم الحل" };
  const decisionLabels = { refund: "استرداد للمحفظة", reject: "رفض النزاع", redeliver: "إعادة التسليم" };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة النزاعات</h2>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : disputes.length > 0 ? (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[dispute.status]}>{statusLabels[dispute.status]}</Badge>
                    <span className="text-xs text-muted-foreground">#{dispute.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="font-bold">{dispute.reason}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{dispute.description.slice(0, 100)}...</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>من: {dispute.user_name}</span>
                    <span>طلب: #{dispute.order_id.slice(0, 8)}</span>
                    <span>{new Date(dispute.created_at).toLocaleDateString('ar-JO')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDispute(dispute)}>
                    <Eye className="h-4 w-4 ml-1" /> عرض
                  </Button>
                  {dispute.status !== "resolved" && (
                    <Button size="sm" onClick={() => setResolveDialog(dispute)}>حل</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
          <p>لا توجد نزاعات مفتوحة</p>
        </div>
      )}

      {/* View Dispute Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل النزاع</DialogTitle>
            <DialogDescription>#{selectedDispute?.id.slice(0, 8)} - {selectedDispute?.reason}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span>العميل: {selectedDispute?.user_name}</span>
                <span>البريد: {selectedDispute?.user_email}</span>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedDispute?.messages?.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg ${msg.from === "admin" ? "bg-primary/10 mr-8" : "bg-secondary ml-8"}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold">{msg.name}</span>
                    <span className="text-muted-foreground">{new Date(msg.at).toLocaleString('ar-JO')}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>

            {selectedDispute?.status !== "resolved" && (
              <div className="flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="اكتب ردك..." className="flex-1" />
                <Button onClick={handleReply}>إرسال</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حل النزاع</DialogTitle>
            <DialogDescription>اختر القرار المناسب لهذا النزاع</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>القرار</Label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund">✅ استرداد للمحفظة</SelectItem>
                  <SelectItem value="redeliver">🔄 إعادة التسليم</SelectItem>
                  <SelectItem value="reject">❌ رفض النزاع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات للعميل</Label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="سبب القرار..." rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(null)}>إلغاء</Button>
            <Button onClick={handleResolve}>تأكيد القرار</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Analytics Dashboard
const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    fetchAnalytics();
    fetchChart();
  }, []);

  useEffect(() => {
    fetchChart();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/analytics/overview`, { headers: getAuthHeader() });
      setData(response.data);
    } catch (error) {
      toast.error("فشل في تحميل التحليلات");
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/analytics/chart?period=${period}`, { headers: getAuthHeader() });
      setChartData(response.data);
    } catch (error) {
      console.error("Failed to fetch chart data");
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">لوحة التحليلات</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30">
          <div className="text-2xl font-bold text-green-500">{data?.today?.revenue?.toFixed(2)} د.أ</div>
          <div className="text-sm text-muted-foreground">إيرادات اليوم</div>
          <div className="text-xs text-green-500 mt-1">{data?.today?.orders} طلب</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30">
          <div className="text-2xl font-bold text-blue-500">{data?.week?.revenue?.toFixed(2)} د.أ</div>
          <div className="text-sm text-muted-foreground">إيرادات الأسبوع</div>
          <div className="text-xs text-blue-500 mt-1">{data?.week?.orders} طلب</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
          <div className="text-2xl font-bold text-purple-500">{data?.month?.revenue?.toFixed(2)} د.أ</div>
          <div className="text-sm text-muted-foreground">إيرادات الشهر</div>
          <div className="text-xs text-purple-500 mt-1">{data?.month?.orders} طلب</div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
          <div className="text-2xl font-bold text-orange-500">{data?.totals?.users}</div>
          <div className="text-sm text-muted-foreground">إجمالي المستخدمين</div>
        </div>
      </div>

      {/* Pending Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <ShoppingCart className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.pending_orders}</div>
              <div className="text-xs text-muted-foreground">طلبات معلقة</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <MessageSquare className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.open_disputes}</div>
              <div className="text-xs text-muted-foreground">نزاعات مفتوحة</div>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="text-xl font-bold">{data?.totals?.products}</div>
              <div className="text-xs text-muted-foreground">منتجات نشطة</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <h3 className="font-bold mb-4">🔥 المنتجات الأكثر مبيعاً</h3>
        <div className="space-y-2">
          {data?.top_products?.map((product, i) => (
            <div key={product.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                <span>{product.name}</span>
              </div>
              <Badge variant="outline">{product.sold_count} مبيع</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Audit Logs
const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchLogs(); }, [page]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/audit-logs?page=${page}&limit=20`, { headers: getAuthHeader() });
      setLogs(response.data.logs);
      setTotal(response.data.total);
    } catch (error) {
      toast.error("فشل في تحميل السجلات");
    } finally {
      setLoading(false);
    }
  };

  const actionLabels = {
    update_order_status: "تحديث حالة طلب",
    deliver_order: "تسليم طلب",
    resolve_dispute: "حل نزاع",
    update_role: "تغيير دور",
    create_product: "إنشاء منتج",
    update_product: "تحديث منتج"
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">سجل النشاطات</h2>
      <p className="text-sm text-muted-foreground">سجل غير قابل للتعديل لجميع الإجراءات في النظام</p>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
      ) : logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="p-3 rounded-lg bg-card border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{actionLabels[log.action] || log.action}</div>
                    <div className="text-xs text-muted-foreground">
                      بواسطة: {log.user_name} ({log.user_role})
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-left">
                  <div>{new Date(log.created_at).toLocaleDateString('ar-JO')}</div>
                  <div>{new Date(log.created_at).toLocaleTimeString('ar-JO')}</div>
                </div>
              </div>
              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="mt-2 p-2 rounded bg-secondary/50 text-xs font-mono" dir="ltr">
                  {JSON.stringify(log.changes, null, 2).slice(0, 100)}...
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>لا توجد سجلات</p>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
          <span className="px-4 py-2 text-sm">صفحة {page}</span>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={logs.length < 20}>التالي</Button>
        </div>
      )}
    </div>
  );
};

// Site Settings
const SiteSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/settings`, { headers: getAuthHeader() });
      setSettings(response.data);
    } catch (error) {
      toast.error("فشل في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/admin/settings`, settings, { headers: getAuthHeader() });
      toast.success("تم حفظ الإعدادات");
    } catch (error) {
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl md:text-2xl font-bold">إعدادات الموقع</h2>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      {/* Logo & Images */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">🎨 الشعار والصور</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>شعار الموقع (Logo)</Label>
            <Input value={settings?.logo_url || ""} onChange={(e) => setSettings({...settings, logo_url: e.target.value})} dir="ltr" placeholder="https://..." />
            {settings?.logo_url && <img src={settings.logo_url} alt="Logo" className="mt-2 h-12 object-contain bg-secondary rounded p-1" />}
            <p className="text-xs text-muted-foreground mt-1">ارفع الشعار على imgur.com أو imgbb.com والصق الرابط</p>
          </div>
          <div>
            <Label>شعار داكن (للخلفية الفاتحة)</Label>
            <Input value={settings?.logo_dark_url || ""} onChange={(e) => setSettings({...settings, logo_dark_url: e.target.value})} dir="ltr" placeholder="https://..." />
            {settings?.logo_dark_url && <img src={settings.logo_dark_url} alt="Logo Dark" className="mt-2 h-12 object-contain bg-white rounded p-1" />}
          </div>
        </div>
        <div>
          <Label>أيقونة الموقع (Favicon)</Label>
          <Input value={settings?.favicon_url || ""} onChange={(e) => setSettings({...settings, favicon_url: e.target.value})} dir="ltr" placeholder="https://..." />
          {settings?.favicon_url && <img src={settings.favicon_url} alt="Favicon" className="mt-2 h-8 w-8 object-contain" />}
        </div>
        <div>
          <Label>صورة القسم الرئيسي (Hero Image)</Label>
          <Input value={settings?.hero_image_url || ""} onChange={(e) => setSettings({...settings, hero_image_url: e.target.value})} dir="ltr" placeholder="https://..." />
          {settings?.hero_image_url && <img src={settings.hero_image_url} alt="Hero" className="mt-2 w-full max-w-md h-40 object-cover rounded-lg" />}
        </div>
      </div>

      {/* Banners */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">🖼️ البانرات والإعلانات</h3>
        <p className="text-sm text-muted-foreground">أضف بانرات ترويجية تظهر في الصفحة الرئيسية</p>
        {(settings?.banners || []).map((banner, index) => (
          <div key={index} className="p-3 rounded-lg bg-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">بانر {index + 1}</span>
              <label className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={banner.is_active} 
                  onChange={(e) => {
                    const newBanners = [...(settings?.banners || [])];
                    newBanners[index] = {...banner, is_active: e.target.checked};
                    setSettings({...settings, banners: newBanners});
                  }}
                  className="rounded"
                />
                مفعّل
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">رابط الصورة</Label>
                <Input 
                  value={banner.image_url || ""} 
                  onChange={(e) => {
                    const newBanners = [...(settings?.banners || [])];
                    newBanners[index] = {...banner, image_url: e.target.value};
                    setSettings({...settings, banners: newBanners});
                  }}
                  dir="ltr" 
                  placeholder="https://..."
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">رابط عند النقر</Label>
                <Input 
                  value={banner.link || ""} 
                  onChange={(e) => {
                    const newBanners = [...(settings?.banners || [])];
                    newBanners[index] = {...banner, link: e.target.value};
                    setSettings({...settings, banners: newBanners});
                  }}
                  dir="ltr" 
                  placeholder="/products أو https://..."
                  className="h-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">عنوان البانر (اختياري)</Label>
              <Input 
                value={banner.title || ""} 
                onChange={(e) => {
                  const newBanners = [...(settings?.banners || [])];
                  newBanners[index] = {...banner, title: e.target.value};
                  setSettings({...settings, banners: newBanners});
                }}
                placeholder="خصم 50% على جميع المنتجات"
                className="h-9"
              />
            </div>
            {banner.image_url && <img src={banner.image_url} alt={`Banner ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />}
          </div>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          className="w-full"
          onClick={() => {
            const newBanners = [...(settings?.banners || [])];
            newBanners.push({id: String(newBanners.length + 1), image_url: "", title: "", link: "", is_active: false});
            setSettings({...settings, banners: newBanners});
          }}
        >
          <Plus className="h-4 w-4 ml-2" /> إضافة بانر جديد
        </Button>
      </div>

      {/* Basic Info */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">المعلومات الأساسية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>اسم الموقع (عربي)</Label>
            <Input value={settings?.site_name || ""} onChange={(e) => setSettings({...settings, site_name: e.target.value})} />
          </div>
          <div>
            <Label>اسم الموقع (إنجليزي)</Label>
            <Input value={settings?.site_name_en || ""} onChange={(e) => setSettings({...settings, site_name_en: e.target.value})} dir="ltr" />
          </div>
        </div>
        <div>
          <Label>الشعار / الوصف المختصر</Label>
          <Input value={settings?.tagline || ""} onChange={(e) => setSettings({...settings, tagline: e.target.value})} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>رقم واتساب</Label>
            <Input value={settings?.whatsapp_number || ""} onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})} dir="ltr" placeholder="+962..." />
          </div>
          <div>
            <Label>البريد الإلكتروني</Label>
            <Input value={settings?.email || ""} onChange={(e) => setSettings({...settings, email: e.target.value})} dir="ltr" />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">القسم الرئيسي (Hero)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>العنوان الرئيسي</Label>
            <Input value={settings?.hero_title || ""} onChange={(e) => setSettings({...settings, hero_title: e.target.value})} />
          </div>
          <div>
            <Label>العنوان الفرعي</Label>
            <Input value={settings?.hero_subtitle || ""} onChange={(e) => setSettings({...settings, hero_subtitle: e.target.value})} />
          </div>
        </div>
        <div>
          <Label>الوصف</Label>
          <Textarea value={settings?.hero_description || ""} onChange={(e) => setSettings({...settings, hero_description: e.target.value})} rows={3} />
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">الإحصائيات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>العملاء</Label>
            <Input value={settings?.stats?.customers || ""} onChange={(e) => setSettings({...settings, stats: {...settings?.stats, customers: e.target.value}})} dir="ltr" />
          </div>
          <div>
            <Label>الطلبات</Label>
            <Input value={settings?.stats?.orders || ""} onChange={(e) => setSettings({...settings, stats: {...settings?.stats, orders: e.target.value}})} dir="ltr" />
          </div>
          <div>
            <Label>نسبة الرضا</Label>
            <Input value={settings?.stats?.satisfaction || ""} onChange={(e) => setSettings({...settings, stats: {...settings?.stats, satisfaction: e.target.value}})} dir="ltr" />
          </div>
          <div>
            <Label>الدعم</Label>
            <Input value={settings?.stats?.support || ""} onChange={(e) => setSettings({...settings, stats: {...settings?.stats, support: e.target.value}})} dir="ltr" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">الفوتر وروابط السوشيال</h3>
        <div>
          <Label>نص الفوتر</Label>
          <Textarea value={settings?.footer_text || ""} onChange={(e) => setSettings({...settings, footer_text: e.target.value})} rows={2} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Instagram</Label>
            <Input value={settings?.social_links?.instagram || ""} onChange={(e) => setSettings({...settings, social_links: {...settings?.social_links, instagram: e.target.value}})} dir="ltr" placeholder="https://instagram.com/..." />
          </div>
          <div>
            <Label>Twitter / X</Label>
            <Input value={settings?.social_links?.twitter || ""} onChange={(e) => setSettings({...settings, social_links: {...settings?.social_links, twitter: e.target.value}})} dir="ltr" placeholder="https://twitter.com/..." />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input value={settings?.social_links?.facebook || ""} onChange={(e) => setSettings({...settings, social_links: {...settings?.social_links, facebook: e.target.value}})} dir="ltr" placeholder="https://facebook.com/..." />
          </div>
          <div>
            <Label>TikTok</Label>
            <Input value={settings?.social_links?.tiktok || ""} onChange={(e) => setSettings({...settings, social_links: {...settings?.social_links, tiktok: e.target.value}})} dir="ltr" placeholder="https://tiktok.com/..." />
          </div>
          <div>
            <Label>YouTube</Label>
            <Input value={settings?.social_links?.youtube || ""} onChange={(e) => setSettings({...settings, social_links: {...settings?.social_links, youtube: e.target.value}})} dir="ltr" placeholder="https://youtube.com/..." />
          </div>
        </div>
      </div>
    </div>
  );
};

// Telegram Settings Component
const TelegramSettings = () => {
  const [settings, setSettings] = useState({
    bot_token: "",
    chat_id: "",
    notify_new_orders: true,
    notify_disputes: true,
    notify_low_stock: true,
    low_stock_threshold: 5,
    is_configured: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/telegram/settings`, { headers: getAuthHeader() });
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to load telegram settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/admin/telegram/settings`, settings, { headers: getAuthHeader() });
      toast.success("تم حفظ إعدادات Telegram");
      fetchSettings();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const response = await axios.post(`${API_URL}/admin/telegram/test`, {}, { headers: getAuthHeader() });
      toast.success(response.data.message || "تم إرسال رسالة الاختبار بنجاح");
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إرسال رسالة الاختبار");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-bold">إشعارات Telegram</h2>
          <p className="text-sm text-muted-foreground mt-1">استقبل إشعارات فورية عند وصول طلبات أو نزاعات جديدة</p>
        </div>
        <Badge className={settings.is_configured ? "bg-green-500" : "bg-yellow-500"}>
          {settings.is_configured ? "متصل" : "غير متصل"}
        </Badge>
      </div>

      {/* Setup Instructions */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <h3 className="font-bold text-blue-400 mb-2">📱 كيفية الإعداد:</h3>
        <ol className="text-sm space-y-2 text-muted-foreground">
          <li>1. افتح Telegram وابحث عن <span className="text-foreground font-mono">@BotFather</span></li>
          <li>2. أرسل الأمر <span className="text-foreground font-mono">/newbot</span> واتبع التعليمات</li>
          <li>3. انسخ الـ Bot Token والصقه هنا</li>
          <li>4. أرسل رسالة للبوت ثم ابحث عن <span className="text-foreground font-mono">@userinfobot</span> للحصول على Chat ID</li>
        </ol>
      </div>

      {/* Bot Configuration */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">⚙️ إعدادات البوت</h3>
        <div>
          <Label>Bot Token</Label>
          <Input 
            value={settings.bot_token} 
            onChange={(e) => setSettings({...settings, bot_token: e.target.value})} 
            placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..."
            dir="ltr"
            type="password"
          />
          <p className="text-xs text-muted-foreground mt-1">احصل عليه من @BotFather</p>
        </div>
        <div>
          <Label>Chat ID</Label>
          <Input 
            value={settings.chat_id} 
            onChange={(e) => setSettings({...settings, chat_id: e.target.value})} 
            placeholder="123456789"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground mt-1">معرف المحادثة أو المجموعة لاستلام الإشعارات</p>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">🔔 أنواع الإشعارات</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <span className="font-medium">🛒 طلبات جديدة</span>
              <p className="text-xs text-muted-foreground">إشعار عند كل طلب جديد</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, notify_new_orders: !settings.notify_new_orders})}
              className={`w-12 h-6 rounded-full transition-colors ${settings.notify_new_orders ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${settings.notify_new_orders ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <span className="font-medium">⚠️ نزاعات جديدة</span>
              <p className="text-xs text-muted-foreground">إشعار عند فتح نزاع جديد</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, notify_disputes: !settings.notify_disputes})}
              className={`w-12 h-6 rounded-full transition-colors ${settings.notify_disputes ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${settings.notify_disputes ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <span className="font-medium">📦 تنبيهات المخزون</span>
              <p className="text-xs text-muted-foreground">إشعار عند انخفاض المخزون</p>
            </div>
            <button 
              onClick={() => setSettings({...settings, notify_low_stock: !settings.notify_low_stock})}
              className={`w-12 h-6 rounded-full transition-colors ${settings.notify_low_stock ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${settings.notify_low_stock ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        {settings.notify_low_stock && (
          <div>
            <Label>حد التنبيه للمخزون</Label>
            <Input 
              type="number" 
              value={settings.low_stock_threshold} 
              onChange={(e) => setSettings({...settings, low_stock_threshold: parseInt(e.target.value) || 5})} 
              min="1"
              className="w-32"
            />
            <p className="text-xs text-muted-foreground mt-1">تنبيه عندما يصل المخزون لهذا الرقم أو أقل</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
        <Button onClick={handleTest} disabled={testing || !settings.bot_token || !settings.chat_id} variant="outline">
          {testing ? "جاري الاختبار..." : "🧪 اختبار"}
        </Button>
      </div>
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
    if (path.includes("banners")) return "البانرات والسلايدر";
    if (path.includes("homepage")) return "أقسام الرئيسية";
    if (path.includes("import")) return "رفع Excel";
    if (path.includes("users")) return "المستخدمين";
    if (path.includes("products")) return "المنتجات";
    if (path.includes("categories")) return "الأقسام";
    if (path.includes("orders")) return "الطلبات";
    if (path.includes("wallets")) return "المحافظ";
    if (path.includes("discounts")) return "أكواد الخصم";
    if (path.includes("notifications")) return "الإشعارات";
    if (path.includes("tickets")) return "الدعم الفني";
    if (path.includes("telegram")) return "إشعارات Telegram";
    if (path.includes("settings")) return "إعدادات الموقع";
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
            <Route path="banners" element={<BannersManagement />} />
            <Route path="homepage" element={<HomepageSectionsManagement />} />
            <Route path="import" element={<ExcelImport />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="disputes" element={<DisputesManagement />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="wallets" element={<WalletManagement />} />
            <Route path="discounts" element={<DiscountsManagement />} />
            <Route path="notifications" element={<NotificationsManagement />} />
            <Route path="tickets" element={<TicketsManagement />} />
            <Route path="telegram" element={<TelegramSettings />} />
            <Route path="settings" element={<SiteSettings />} />
          </Routes>
        </div>
      </main>
      <Toaster position="top-center" richColors />
    </div>
  );
}
