/**
 * Discounts Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, formatPrice, toast,
  Button, Input, Label, Badge, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  Plus, CheckCircle, XCircle
} from "./shared";

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

export default DiscountsManagement;
