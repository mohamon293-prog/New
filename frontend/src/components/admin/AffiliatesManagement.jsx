/**
 * Affiliates Management Component
 * إدارة المسوقين والمعلنين
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, getAuthHeader, formatPrice, formatDate } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Tag,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Percent,
  Search,
  X,
  Copy,
  BarChart3,
  Package,
} from "lucide-react";

export default function AffiliatesManagement() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(null);
  const [showCouponDialog, setShowCouponDialog] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: ""
  });
  
  const [couponFormData, setCouponFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    commission_type: "percentage",
    commission_value: 5,
    min_purchase: 0,
    max_uses: null,
    valid_until: "",
    applicable_products: []
  });
  
  const [products, setProducts] = useState([]);
  const [affiliateDetails, setAffiliateDetails] = useState(null);

  useEffect(() => {
    fetchAffiliates();
    fetchProducts();
  }, []);

  const fetchAffiliates = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/affiliates`, {
        headers: getAuthHeader()
      });
      setAffiliates(response.data);
    } catch (error) {
      console.error("Failed to fetch affiliates:", error);
      toast.error("فشل في تحميل المسوقين");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/products`, {
        headers: getAuthHeader()
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const fetchAffiliateDetails = async (affiliateId) => {
    try {
      const response = await axios.get(`${API_URL}/admin/affiliates/${affiliateId}`, {
        headers: getAuthHeader()
      });
      setAffiliateDetails(response.data);
    } catch (error) {
      toast.error("فشل في تحميل بيانات المسوق");
    }
  };

  const handleCreateAffiliate = async () => {
    if (!formData.name || !formData.email) {
      toast.error("الاسم والبريد الإلكتروني مطلوبان");
      return;
    }

    try {
      await axios.post(`${API_URL}/admin/affiliates`, formData, {
        headers: getAuthHeader()
      });
      toast.success("تم إضافة المسوق بنجاح");
      setShowAddDialog(false);
      setFormData({ name: "", email: "", phone: "", company: "", notes: "" });
      fetchAffiliates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إضافة المسوق");
    }
  };

  const handleCreateCoupon = async () => {
    if (!couponFormData.code || !showCouponDialog) {
      toast.error("كود الخصم مطلوب");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/affiliates/${showCouponDialog.id}/coupons`,
        couponFormData,
        { headers: getAuthHeader() }
      );
      toast.success("تم إنشاء الكوبون بنجاح");
      setShowCouponDialog(null);
      setCouponFormData({
        code: "",
        name: "",
        description: "",
        discount_type: "percentage",
        discount_value: 10,
        commission_type: "percentage",
        commission_value: 5,
        min_purchase: 0,
        max_uses: null,
        valid_until: "",
        applicable_products: []
      });
      fetchAffiliates();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إنشاء الكوبون");
    }
  };

  const handleDeleteAffiliate = async (affiliateId) => {
    if (!confirm("هل أنت متأكد من حذف هذا المسوق؟")) return;

    try {
      await axios.delete(`${API_URL}/admin/affiliates/${affiliateId}`, {
        headers: getAuthHeader()
      });
      toast.success("تم حذف المسوق");
      fetchAffiliates();
    } catch (error) {
      toast.error("فشل في حذف المسوق");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  const filteredAffiliates = affiliates.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            المسوقون والمعلنون
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة كوبونات المسوقين وتتبع المبيعات والعمولات
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة مسوق
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" />
            المسوقون
          </div>
          <div className="text-2xl font-bold">{affiliates.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Tag className="h-4 w-4" />
            الكوبونات
          </div>
          <div className="text-2xl font-bold">
            {affiliates.reduce((sum, a) => sum + (a.coupons_count || 0), 0)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <DollarSign className="h-4 w-4" />
            إجمالي المبيعات
          </div>
          <div className="text-2xl font-bold text-green-500 ltr-nums">
            {formatPrice(affiliates.reduce((sum, a) => sum + (a.total_sales || 0), 0), "JOD")}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="h-4 w-4" />
            إجمالي العمولات
          </div>
          <div className="text-2xl font-bold text-primary ltr-nums">
            {formatPrice(affiliates.reduce((sum, a) => sum + (a.total_commission || 0), 0), "JOD")}
          </div>
        </div>
      </div>

      {/* Affiliates Table */}
      {filteredAffiliates.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-bold mb-2">لا يوجد مسوقون</h3>
          <p className="text-muted-foreground text-sm mb-4">
            أضف مسوقين لإنشاء كوبونات خاصة بهم وتتبع مبيعاتهم
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مسوق
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المسوق</TableHead>
                <TableHead className="text-right">الكوبونات</TableHead>
                <TableHead className="text-right">الطلبات</TableHead>
                <TableHead className="text-right">المبيعات</TableHead>
                <TableHead className="text-right">العمولة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAffiliates.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    <div>
                      <div className="font-bold">{affiliate.name}</div>
                      <div className="text-sm text-muted-foreground">{affiliate.email}</div>
                      {affiliate.company && (
                        <div className="text-xs text-muted-foreground">{affiliate.company}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{affiliate.coupons_count || 0}</Badge>
                  </TableCell>
                  <TableCell className="ltr-nums">{affiliate.total_orders || 0}</TableCell>
                  <TableCell className="ltr-nums text-green-500 font-bold">
                    {formatPrice(affiliate.total_sales || 0, "JOD")}
                  </TableCell>
                  <TableCell className="ltr-nums text-primary font-bold">
                    {formatPrice(affiliate.total_commission || 0, "JOD")}
                  </TableCell>
                  <TableCell>
                    <Badge className={affiliate.is_active ? "bg-green-500" : "bg-gray-500"}>
                      {affiliate.is_active ? "نشط" : "متوقف"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          fetchAffiliateDetails(affiliate.id);
                          setShowDetailsDialog(affiliate);
                        }}
                        title="التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCouponDialog(affiliate)}
                        title="إضافة كوبون"
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAffiliate(affiliate.id)}
                        className="text-destructive"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Affiliate Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              إضافة مسوق جديد
            </DialogTitle>
            <DialogDescription>
              أضف مسوق/معلن لإنشاء كوبونات خاصة به
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>الاسم *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="اسم المسوق"
              />
            </div>
            <div>
              <Label>البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+962 7X XXX XXXX"
                dir="ltr"
              />
            </div>
            <div>
              <Label>الشركة/القناة</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="اسم الشركة أو القناة"
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreateAffiliate}>إضافة المسوق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Coupon Dialog */}
      <Dialog open={!!showCouponDialog} onOpenChange={() => setShowCouponDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              إنشاء كوبون للمسوق
            </DialogTitle>
            <DialogDescription>
              {showCouponDialog?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Code */}
            <div>
              <Label>كود الخصم *</Label>
              <Input
                value={couponFormData.code}
                onChange={(e) => setCouponFormData({ ...couponFormData, code: e.target.value.toUpperCase() })}
                placeholder="AHMED10"
                dir="ltr"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                الكود الذي سيستخدمه العملاء
              </p>
            </div>

            {/* Discount Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع الخصم</Label>
                <Select
                  value={couponFormData.discount_type}
                  onValueChange={(v) => setCouponFormData({ ...couponFormData, discount_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة %</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>قيمة الخصم</Label>
                <Input
                  type="number"
                  value={couponFormData.discount_value}
                  onChange={(e) => setCouponFormData({ ...couponFormData, discount_value: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>

            {/* Commission Settings */}
            <div className="p-4 rounded-xl bg-secondary/50 space-y-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                عمولة المسوق
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نوع العمولة</Label>
                  <Select
                    value={couponFormData.commission_type}
                    onValueChange={(v) => setCouponFormData({ ...couponFormData, commission_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة من المبيعات %</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت لكل طلب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>قيمة العمولة</Label>
                  <Input
                    type="number"
                    value={couponFormData.commission_value}
                    onChange={(e) => setCouponFormData({ ...couponFormData, commission_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الحد الأدنى للشراء</Label>
                <Input
                  type="number"
                  value={couponFormData.min_purchase}
                  onChange={(e) => setCouponFormData({ ...couponFormData, min_purchase: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
              <div>
                <Label>الحد الأقصى للاستخدام</Label>
                <Input
                  type="number"
                  value={couponFormData.max_uses || ""}
                  onChange={(e) => setCouponFormData({ ...couponFormData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="غير محدود"
                />
              </div>
            </div>

            <div>
              <Label>تاريخ الانتهاء</Label>
              <Input
                type="date"
                value={couponFormData.valid_until}
                onChange={(e) => setCouponFormData({ ...couponFormData, valid_until: e.target.value })}
              />
            </div>

            {/* Product Selection */}
            <div>
              <Label>منتجات محددة (اختياري)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                اترك فارغاً لتطبيق الكوبون على جميع المنتجات
              </p>
              <Select
                onValueChange={(v) => {
                  if (!couponFormData.applicable_products.includes(v)) {
                    setCouponFormData({
                      ...couponFormData,
                      applicable_products: [...couponFormData.applicable_products, v]
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر منتجات..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {couponFormData.applicable_products.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {couponFormData.applicable_products.map((pid) => {
                    const product = products.find(p => p.id === pid);
                    return (
                      <Badge key={pid} variant="secondary" className="gap-1">
                        {product?.name || pid}
                        <button
                          onClick={() => setCouponFormData({
                            ...couponFormData,
                            applicable_products: couponFormData.applicable_products.filter(id => id !== pid)
                          })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCouponDialog(null)}>إلغاء</Button>
            <Button onClick={handleCreateCoupon}>إنشاء الكوبون</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Affiliate Details Dialog */}
      <Dialog open={!!showDetailsDialog} onOpenChange={() => { setShowDetailsDialog(null); setAffiliateDetails(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              تفاصيل المسوق
            </DialogTitle>
            <DialogDescription>
              {showDetailsDialog?.name} - {showDetailsDialog?.email}
            </DialogDescription>
          </DialogHeader>

          {affiliateDetails ? (
            <Tabs defaultValue="stats" className="mt-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
                <TabsTrigger value="coupons">الكوبونات</TabsTrigger>
                <TabsTrigger value="orders">الطلبات</TabsTrigger>
              </TabsList>

              {/* Stats Tab */}
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                    <div className="text-sm text-muted-foreground mb-1">إجمالي المبيعات</div>
                    <div className="text-2xl font-bold text-green-500 ltr-nums">
                      {formatPrice(affiliateDetails.stats?.total_sales || 0, "JOD")}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                    <div className="text-sm text-muted-foreground mb-1">عمولة المسوق</div>
                    <div className="text-2xl font-bold text-primary ltr-nums">
                      {formatPrice(affiliateDetails.stats?.total_commission || 0, "JOD")}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
                    <div className="text-sm text-muted-foreground mb-1">ربحك</div>
                    <div className="text-2xl font-bold text-blue-500 ltr-nums">
                      {formatPrice(affiliateDetails.stats?.store_profit || 0, "JOD")}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary text-center">
                    <div className="text-sm text-muted-foreground mb-1">عدد الاستخدام</div>
                    <div className="text-2xl font-bold">{affiliateDetails.stats?.total_usage || 0}</div>
                  </div>
                </div>
              </TabsContent>

              {/* Coupons Tab */}
              <TabsContent value="coupons" className="space-y-4">
                {affiliateDetails.coupons?.length > 0 ? (
                  <div className="space-y-3">
                    {affiliateDetails.coupons.map((coupon) => (
                      <div key={coupon.id} className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <code className="px-3 py-1 rounded-lg bg-primary/20 text-primary font-mono font-bold">
                              {coupon.code}
                            </code>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(coupon.code)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <Badge className={coupon.is_active ? "bg-green-500" : "bg-gray-500"}>
                            {coupon.is_active ? "نشط" : "متوقف"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">الخصم:</span>
                            <span className="mr-1 font-bold">
                              {coupon.discount_value}{coupon.discount_type === "percentage" ? "%" : " د.أ"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">العمولة:</span>
                            <span className="mr-1 font-bold text-primary">
                              {coupon.commission_value}{coupon.commission_type === "percentage" ? "%" : " د.أ"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">الاستخدام:</span>
                            <span className="mr-1 font-bold">{coupon.used_count || 0}</span>
                            {coupon.max_uses && <span className="text-muted-foreground">/{coupon.max_uses}</span>}
                          </div>
                          <div>
                            <span className="text-muted-foreground">الانتهاء:</span>
                            <span className="mr-1">{coupon.valid_until ? formatDate(coupon.valid_until) : "غير محدد"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد كوبونات</p>
                  </div>
                )}
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4">
                {affiliateDetails.usage_history?.length > 0 ? (
                  <div className="space-y-3">
                    {affiliateDetails.usage_history.map((usage, index) => (
                      <div key={index} className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">#{usage.order_id?.slice(0, 8)}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{formatDate(usage.used_at)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">المبلغ:</span>
                            <span className="mr-1 font-bold text-green-500 ltr-nums">
                              {formatPrice(usage.order_total || 0, "JOD")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">الخصم:</span>
                            <span className="mr-1 ltr-nums">
                              {formatPrice(usage.discount_amount || 0, "JOD")}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">العمولة:</span>
                            <span className="mr-1 font-bold text-primary ltr-nums">
                              {formatPrice(usage.affiliate_commission || 0, "JOD")}
                            </span>
                          </div>
                        </div>
                        {usage.products?.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <span className="text-sm text-muted-foreground">المنتجات: </span>
                            {usage.products.map((p, i) => (
                              <Badge key={i} variant="outline" className="mr-1 text-xs">
                                {p.product_name} x{p.quantity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد طلبات بعد</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => { setShowDetailsDialog(null); setAffiliateDetails(null); }}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
