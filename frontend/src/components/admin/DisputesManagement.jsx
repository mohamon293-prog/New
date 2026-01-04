/**
 * Disputes Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Label, Badge, Skeleton, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Eye, CheckCircle
} from "./shared";

const DisputesManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [reply, setReply] = useState("");
  const [resolveDialog, setResolveDialog] = useState(null);
  const [decision, setDecision] = useState("refund");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/disputes`, { headers: getAuthHeader() });
      setDisputes(response.data);
    } catch (error) {
      toast.error("فشل في تحميل النزاعات");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedDispute) return;
    try {
      await axios.post(`${API_URL}/admin/disputes/${selectedDispute.id}/reply`, { message: reply }, { headers: getAuthHeader() });
      toast.success("تم إرسال الرد");
      setReply("");
      fetchDisputes();
    } catch (error) {
      toast.error("فشل في إرسال الرد");
    }
  };

  const handleResolve = async () => {
    if (!resolveDialog) return;
    try {
      await axios.post(`${API_URL}/admin/disputes/${resolveDialog.id}/resolve`, { decision, admin_notes: adminNotes }, { headers: getAuthHeader() });
      toast.success("تم حل النزاع");
      setResolveDialog(null);
      setDecision("refund");
      setAdminNotes("");
      fetchDisputes();
    } catch (error) {
      toast.error("فشل في حل النزاع");
    }
  };

  const statusColors = { open: "bg-yellow-500", in_progress: "bg-blue-500", resolved: "bg-green-500" };
  const statusLabels = { open: "مفتوح", in_progress: "قيد المعالجة", resolved: "تم الحل" };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة النزاعات</h2>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : disputes.length > 0 ? (
        <div className="space-y-3">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={statusColors[dispute.status]}>{statusLabels[dispute.status]}</Badge>
                    <span className="text-xs text-muted-foreground">#{dispute.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="font-bold">{dispute.reason}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{dispute.description?.slice(0, 100)}...</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>من: {dispute.user_name}</span>
                    <span>طلب: #{dispute.order_id?.slice(0, 8)}</span>
                    <span>{new Date(dispute.created_at).toLocaleDateString('ar-JO')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDispute(dispute)}>
                    <Eye className="h-4 w-4 ml-1" /> عرض
                  </Button>
                  {dispute.status !== "resolved" && (
                    <Button size="sm" onClick={() => setResolveDialog(dispute)}>حل</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
          <p>لا توجد نزاعات مفتوحة</p>
        </div>
      )}

      {/* View Dispute Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل النزاع</DialogTitle>
            <DialogDescription>#{selectedDispute?.id?.slice(0, 8)} - {selectedDispute?.reason}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span>العميل: {selectedDispute?.user_name}</span>
                <span>البريد: {selectedDispute?.user_email}</span>
              </div>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {selectedDispute?.messages?.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg ${msg.from === "admin" ? "bg-primary/10 mr-8" : "bg-secondary ml-8"}`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold">{msg.name}</span>
                    <span className="text-muted-foreground">{new Date(msg.at).toLocaleString('ar-JO')}</span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
            {selectedDispute?.status !== "resolved" && (
              <div className="flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="اكتب ردك..." className="flex-1" />
                <Button onClick={handleReply}>إرسال</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حل النزاع</DialogTitle>
            <DialogDescription>اختر القرار المناسب لهذا النزاع</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>القرار</Label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund">✅ استرداد للمحفظة</SelectItem>
                  <SelectItem value="redeliver">🔄 إعادة التسليم</SelectItem>
                  <SelectItem value="reject">❌ رفض النزاع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات للعميل</Label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="سبب القرار..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(null)}>إلغاء</Button>
            <Button onClick={handleResolve}>تأكيد القرار</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisputesManagement;
