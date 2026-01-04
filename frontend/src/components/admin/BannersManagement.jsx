/**
 * Banners Management Component
 */
import React, { useState, useEffect, useRef } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Label, Badge, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  Plus, Edit, Trash2, Upload, Image
} from "./shared";

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

export default BannersManagement;
