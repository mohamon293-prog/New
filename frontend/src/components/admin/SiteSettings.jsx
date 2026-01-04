/**
 * Site Settings Component
 */
import React, { useState, useEffect } from "react";
import { axios, API_URL, getAuthHeader, toast, Button, Input, Label, Skeleton, Textarea, Plus } from "./shared";

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

      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">🎨 الشعار والصور</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>شعار الموقع (Logo)</Label>
            <Input value={settings?.logo_url || ""} onChange={(e) => setSettings({...settings, logo_url: e.target.value})} dir="ltr" placeholder="https://..." />
            {settings?.logo_url && <img src={settings.logo_url} alt="Logo" className="mt-2 h-12 object-contain bg-secondary rounded p-1" />}
          </div>
          <div>
            <Label>أيقونة الموقع (Favicon)</Label>
            <Input value={settings?.favicon_url || ""} onChange={(e) => setSettings({...settings, favicon_url: e.target.value})} dir="ltr" placeholder="https://..." />
          </div>
        </div>
      </div>

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
          <Label>الوصف المختصر</Label>
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

      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">الفوتر وروابط السوشيال</h3>
        <div>
          <Label>نص الفوتر</Label>
          <Textarea value={settings?.footer_text || ""} onChange={(e) => setSettings({...settings, footer_text: e.target.value})} rows={2} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label>Instagram</Label>
            <Input value={settings?.social_links?.instagram || ""} onChange={(e) => setSettings({...settings, social_links: {...settings?.social_links, instagram: e.target.value}})} dir="ltr" />
          </div>
          <div>
            <Label>Twitter / X</Label>
            <Input value={settings?.social_links?.twitter || ""} onChange={(e) => setSettings({...settings, social_links: {...settings?.social_links, twitter: e.target.value}})} dir="ltr" />
          </div>
          <div>
            <Label>Facebook</Label>
            <Input value={settings?.social_links?.facebook || ""} onChange={(e) => setSettings({...settings, social_links: {...settings?.social_links, facebook: e.target.value}})} dir="ltr" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
