/**
 * Homepage Sections Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Label, Badge, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  Plus, Edit, Trash2, GripVertical, LayoutGrid
} from "./shared";

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
          {sections.map((section) => (
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

export default HomepageSectionsManagement;
