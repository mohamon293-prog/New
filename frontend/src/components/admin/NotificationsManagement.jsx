/**
 * Notifications Management Component
 */
import React, { useState } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Label, Textarea, Send
} from "./shared";

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

export default NotificationsManagement;
