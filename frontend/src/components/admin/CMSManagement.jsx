/**
 * CMS Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Label, Badge, Skeleton, Textarea,
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
  Plus, Edit, Trash2
} from "./shared";

const CMSManagement = () => {
  const [activeTab, setActiveTab] = useState("pages");
  const [pages, setPages] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pagesRes, faqsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/pages`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/admin/faq`, { headers: getAuthHeader() })
      ]);
      setPages(pagesRes.data || []);
      setFaqs(faqsRes.data || []);
    } catch (error) {
      console.error("Failed to load CMS data");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async () => {
    setSaving(true);
    try {
      if (editingPage.id) {
        await axios.put(`${API_URL}/admin/pages/${editingPage.id}`, editingPage, { headers: getAuthHeader() });
        toast.success("تم تحديث الصفحة");
      } else {
        await axios.post(`${API_URL}/admin/pages`, editingPage, { headers: getAuthHeader() });
        toast.success("تم إنشاء الصفحة");
      }
      setEditingPage(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في حفظ الصفحة");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الصفحة؟")) return;
    try {
      await axios.delete(`${API_URL}/admin/pages/${pageId}`, { headers: getAuthHeader() });
      toast.success("تم حذف الصفحة");
      fetchData();
    } catch (error) {
      toast.error("فشل في حذف الصفحة");
    }
  };

  const handleSaveFaq = async () => {
    setSaving(true);
    try {
      if (editingFaq.id) {
        await axios.put(`${API_URL}/admin/faq/${editingFaq.id}`, editingFaq, { headers: getAuthHeader() });
        toast.success("تم تحديث السؤال");
      } else {
        await axios.post(`${API_URL}/admin/faq`, editingFaq, { headers: getAuthHeader() });
        toast.success("تم إنشاء السؤال");
      }
      setEditingFaq(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في حفظ السؤال");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;
    try {
      await axios.delete(`${API_URL}/admin/faq/${faqId}`, { headers: getAuthHeader() });
      toast.success("تم حذف السؤال");
      fetchData();
    } catch (error) {
      toast.error("فشل في حذف السؤال");
    }
  };

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة المحتوى</h2>

      <div className="flex gap-2 border-b border-border pb-2">
        <button onClick={() => setActiveTab("pages")} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === "pages" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
          📄 الصفحات ({pages.length})
        </button>
        <button onClick={() => setActiveTab("faq")} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === "faq" ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
          ❓ الأسئلة الشائعة ({faqs.length})
        </button>
      </div>

      {activeTab === "pages" && (
        <div className="space-y-4">
          <Button onClick={() => setEditingPage({ title: "", title_en: "", slug: "", content: "", content_en: "", meta_description: "", icon: "", is_published: true, show_in_footer: true })}>
            <Plus className="h-4 w-4 ml-2" /> صفحة جديدة
          </Button>
          <div className="space-y-2">
            {pages.map(page => (
              <div key={page.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{page.icon || "📄"}</span>
                    <span className="font-bold">{page.title}</span>
                    <Badge variant={page.is_published ? "default" : "secondary"}>{page.is_published ? "منشور" : "مسودة"}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">/{page.slug} • {page.views || 0} مشاهدة</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingPage(page)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePage(page.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {pages.length === 0 && <div className="text-center py-8 text-muted-foreground">لا توجد صفحات بعد.</div>}
          </div>
        </div>
      )}

      {activeTab === "faq" && (
        <div className="space-y-4">
          <Button onClick={() => setEditingFaq({ question: "", question_en: "", answer: "", answer_en: "", category: "عام", is_published: true })}>
            <Plus className="h-4 w-4 ml-2" /> سؤال جديد
          </Button>
          <div className="space-y-2">
            {faqs.map(faq => (
              <div key={faq.id} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{faq.category}</Badge>
                      <Badge variant={faq.is_published ? "default" : "secondary"}>{faq.is_published ? "منشور" : "مسودة"}</Badge>
                    </div>
                    <h4 className="font-bold">{faq.question}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 mr-4">
                    <Button variant="outline" size="sm" onClick={() => setEditingFaq(faq)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteFaq(faq.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))}
            {faqs.length === 0 && <div className="text-center py-8 text-muted-foreground">لا توجد أسئلة بعد.</div>}
          </div>
        </div>
      )}

      {/* Page Dialog */}
      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingPage?.id ? "تعديل الصفحة" : "صفحة جديدة"}</DialogTitle></DialogHeader>
          {editingPage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>العنوان (عربي) *</Label><Input value={editingPage.title} onChange={(e) => setEditingPage({...editingPage, title: e.target.value})} /></div>
                <div><Label>العنوان (إنجليزي)</Label><Input value={editingPage.title_en} onChange={(e) => setEditingPage({...editingPage, title_en: e.target.value})} dir="ltr" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>الرابط (slug) *</Label><Input value={editingPage.slug} onChange={(e) => setEditingPage({...editingPage, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} dir="ltr" /></div>
                <div><Label>الأيقونة</Label><Input value={editingPage.icon} onChange={(e) => setEditingPage({...editingPage, icon: e.target.value})} placeholder="📄" /></div>
              </div>
              <div><Label>المحتوى (عربي) *</Label><Textarea value={editingPage.content} onChange={(e) => setEditingPage({...editingPage, content: e.target.value})} rows={6} /></div>
              <div><Label>المحتوى (إنجليزي)</Label><Textarea value={editingPage.content_en} onChange={(e) => setEditingPage({...editingPage, content_en: e.target.value})} rows={6} dir="ltr" /></div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editingPage.is_published} onChange={(e) => setEditingPage({...editingPage, is_published: e.target.checked})} className="rounded" /> منشور</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editingPage.show_in_footer} onChange={(e) => setEditingPage({...editingPage, show_in_footer: e.target.checked})} className="rounded" /> في الفوتر</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>إلغاء</Button>
            <Button onClick={handleSavePage} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={!!editingFaq} onOpenChange={() => setEditingFaq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingFaq?.id ? "تعديل السؤال" : "سؤال جديد"}</DialogTitle></DialogHeader>
          {editingFaq && (
            <div className="space-y-4">
              <div><Label>السؤال (عربي) *</Label><Input value={editingFaq.question} onChange={(e) => setEditingFaq({...editingFaq, question: e.target.value})} /></div>
              <div><Label>السؤال (إنجليزي)</Label><Input value={editingFaq.question_en} onChange={(e) => setEditingFaq({...editingFaq, question_en: e.target.value})} dir="ltr" /></div>
              <div><Label>الإجابة (عربي) *</Label><Textarea value={editingFaq.answer} onChange={(e) => setEditingFaq({...editingFaq, answer: e.target.value})} rows={4} /></div>
              <div><Label>الإجابة (إنجليزي)</Label><Textarea value={editingFaq.answer_en} onChange={(e) => setEditingFaq({...editingFaq, answer_en: e.target.value})} rows={4} dir="ltr" /></div>
              <div className="flex items-center gap-4">
                <div><Label>التصنيف</Label><Input value={editingFaq.category} onChange={(e) => setEditingFaq({...editingFaq, category: e.target.value})} placeholder="عام" /></div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editingFaq.is_published} onChange={(e) => setEditingFaq({...editingFaq, is_published: e.target.checked})} /> منشور</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFaq(null)}>إلغاء</Button>
            <Button onClick={handleSaveFaq} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CMSManagement;
