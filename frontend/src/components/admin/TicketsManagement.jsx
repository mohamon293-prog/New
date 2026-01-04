/**
 * Tickets Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Badge, Skeleton, Textarea,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "./shared";

const TicketsManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/tickets`, { headers: getAuthHeader() });
      setTickets(response.data);
    } catch (error) {
      toast.error("فشل في تحميل التذاكر");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;

    try {
      await axios.post(`${API_URL}/admin/tickets/${selectedTicket.id}/reply`, { message: reply }, { headers: getAuthHeader() });
      toast.success("تم إرسال الرد");
      setSelectedTicket(null);
      setReply("");
      fetchTickets();
    } catch (error) {
      toast.error("فشل في إرسال الرد");
    }
  };

  const statusColors = { open: "bg-yellow-500", in_progress: "bg-blue-500", resolved: "bg-green-500", closed: "bg-gray-500" };
  const statusLabels = { open: "مفتوحة", in_progress: "قيد المعالجة", resolved: "تم الحل", closed: "مغلقة" };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-heading text-xl md:text-2xl font-bold">الدعم الفني</h2>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : tickets.length > 0 ? (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-3 md:p-4 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm truncate">{ticket.subject}</h3>
                    <Badge className={`${statusColors[ticket.status]} text-xs`}>{statusLabels[ticket.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">من: {ticket.user_name}</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs flex-shrink-0" onClick={() => setSelectedTicket(ticket)}>
                  رد
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">لا توجد تذاكر</div>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">الرد على التذكرة</DialogTitle>
            <DialogDescription className="text-sm">{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="اكتب ردك..." rows={3} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedTicket(null)} className="h-10">إلغاء</Button>
            <Button onClick={handleReply} className="h-10">إرسال</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketsManagement;
