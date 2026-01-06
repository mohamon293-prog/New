/**
 * Products Management Component
 */
import React, { useState, useEffect, useRef } from "react";
import {
  axios, API_URL, getAuthHeader, formatPrice, toast,
  Button, Input, Label, Badge, Skeleton, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Plus, Edit, Upload, X, CheckCircle, XCircle, Image,
  Trash2, PRODUCT_TYPE_LABELS, PRODUCT_TYPE_COLORS
} from "./shared";

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
    product_type: "digital_code",
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
      // Validate required fields
      if (!productForm.name || !productForm.category_id || !productForm.price_jod || !productForm.price_usd) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }
      
      const data = {
        name: productForm.name,
        name_en: productForm.name_en || productForm.name,
        slug: productForm.slug || productForm.name.toLowerCase().replace(/\s+/g, '-'),
        description: productForm.description || "",
        description_en: productForm.description_en || null,
        category_id: productForm.category_id,
        price_jod: parseFloat(productForm.price_jod) || 0,
        price_usd: parseFloat(productForm.price_usd) || 0,
        original_price_jod: productForm.original_price_jod ? parseFloat(productForm.original_price_jod) : null,
        original_price_usd: productForm.original_price_usd ? parseFloat(productForm.original_price_usd) : null,
        image_url: productForm.image_url || "https://placehold.co/400x400",
        platform: productForm.platform || productForm.category_id,
        region: productForm.region || "عالمي",
        is_featured: productForm.is_featured || false,
        product_type: productForm.product_type || "digital_code",
        has_variants: productForm.has_variants || false,
        variants: productForm.has_variants && productForm.variants?.length > 0 ? productForm.variants.map(v => ({
          ...v,
          id: v.id || `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          price_jod: parseFloat(v.price_jod) || 0,
          price_usd: parseFloat(v.price_usd) || 0,
          original_price_jod: v.original_price_jod ? parseFloat(v.original_price_jod) : null,
          original_price_usd: v.original_price_usd ? parseFloat(v.original_price_usd) : null,
        })) : null,
        requires_email: productForm.requires_email || false,
        requires_password: productForm.requires_password || false,
        requires_phone: productForm.requires_phone || false,
        delivery_instructions: productForm.delivery_instructions || null
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
      console.error("Create product error:", error.response?.data);
      const errorDetail = error.response?.data?.detail;
      let errorMessage = "حدث خطأ";
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) {
        errorMessage = errorDetail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
      } else if (errorDetail && typeof errorDetail === 'object') {
        errorMessage = errorDetail.msg || errorDetail.message || JSON.stringify(errorDetail);
      }
      toast.error(errorMessage);
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

    // Parse codes (one per line)
    const codesArray = codesText.split('\n').map(c => c.trim()).filter(c => c.length > 0);
    
    if (codesArray.length === 0) {
      toast.error("لم يتم العثور على أكواد صالحة");
      return;
    }

    setAddingCodes(true);
    try {
      const response = await axios.post(
        `${API_URL}/admin/products/${codesDialog.id}/codes/add`,
        codesArray,
        { headers: getAuthHeader() }
      );
      toast.success(response.data.message || `تم إضافة الأكواد بنجاح`);
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
                <img src={product.image_url?.startsWith("/uploads/") ? `${API_URL}${product.image_url}` : product.image_url?.startsWith("/") ? `${API_URL.replace("/api", "")}${product.image_url}` : product.image_url} alt={product.name} className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover flex-shrink-0" onError={(e) => { e.target.src = "/placeholder-product.png"; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm md:text-base truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.category_name}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 flex-wrap">
                      <Badge className={PRODUCT_TYPE_COLORS[product.product_type] || "bg-blue-500"}>{PRODUCT_TYPE_LABELS[product.product_type] || "كود"}</Badge>
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
                        <img src={productForm.image_url.startsWith("/uploads/") ? `${API_URL}${productForm.image_url}` : productForm.image_url.startsWith("/") ? `${API_URL.replace("/api", "")}${productForm.image_url}` : productForm.image_url} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />
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

export default ProductsManagement;
