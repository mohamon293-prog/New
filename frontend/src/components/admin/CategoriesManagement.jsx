/**
 * Categories Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Label, Skeleton, Textarea,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  Plus, Edit, Trash2
} from "./shared";

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

export default CategoriesManagement;
