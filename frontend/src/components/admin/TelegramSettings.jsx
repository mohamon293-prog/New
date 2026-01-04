/**
 * Telegram Settings Component
 */
import React, { useState, useEffect } from "react";
import { axios, API_URL, getAuthHeader, toast, Button, Input, Label, Badge, Skeleton } from "./shared";

const TelegramSettings = () => {
  const [settings, setSettings] = useState({
    bot_token: "", chat_id: "", notify_new_orders: true, notify_disputes: true,
    notify_low_stock: true, low_stock_threshold: 5, is_configured: false
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

      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <h3 className="font-bold text-blue-400 mb-2">📱 كيفية الإعداد:</h3>
        <ol className="text-sm space-y-2 text-muted-foreground">
          <li>1. افتح Telegram وابحث عن <span className="text-foreground font-mono">@BotFather</span></li>
          <li>2. أرسل الأمر <span className="text-foreground font-mono">/newbot</span> واتبع التعليمات</li>
          <li>3. انسخ الـ Bot Token والصقه هنا</li>
          <li>4. أرسل رسالة للبوت ثم ابحث عن <span className="text-foreground font-mono">@userinfobot</span> للحصول على Chat ID</li>
        </ol>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">⚙️ إعدادات البوت</h3>
        <div>
          <Label>Bot Token</Label>
          <Input value={settings.bot_token} onChange={(e) => setSettings({...settings, bot_token: e.target.value})} placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..." dir="ltr" type="password" />
        </div>
        <div>
          <Label>Chat ID</Label>
          <Input value={settings.chat_id} onChange={(e) => setSettings({...settings, chat_id: e.target.value})} placeholder="123456789" dir="ltr" />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <h3 className="font-bold text-lg border-b border-border pb-2">🔔 أنواع الإشعارات</h3>
        <div className="space-y-3">
          {[
            { key: "notify_new_orders", label: "🛒 طلبات جديدة", desc: "إشعار عند كل طلب جديد" },
            { key: "notify_disputes", label: "⚠️ نزاعات جديدة", desc: "إشعار عند فتح نزاع جديد" },
            { key: "notify_low_stock", label: "📦 تنبيهات المخزون", desc: "إشعار عند انخفاض المخزون" }
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <span className="font-medium">{item.label}</span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <button 
                onClick={() => setSettings({...settings, [item.key]: !settings[item.key]})}
                className={`w-12 h-6 rounded-full transition-colors ${settings[item.key] ? 'bg-green-500' : 'bg-gray-600'}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
        {settings.notify_low_stock && (
          <div>
            <Label>حد التنبيه للمخزون</Label>
            <Input type="number" value={settings.low_stock_threshold} onChange={(e) => setSettings({...settings, low_stock_threshold: parseInt(e.target.value) || 5})} min="1" className="w-32" />
          </div>
        )}
      </div>

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

export default TelegramSettings;
