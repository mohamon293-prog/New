/**
 * Orders Management Component
 */
import React, { useState, useEffect } from "react";
import {
  axios, API_URL, getAuthHeader, toast,
  Button, Input, Label, Badge, Skeleton, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Search, Edit, Send, ShoppingCart, ORDER_STATUSES
} from "./shared";

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [deliveryDialog, setDeliveryDialog] = useState(null);
  const [deliveryData, setDeliveryData] = useState({ email: "", password: "", notes: "" });

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/admin/orders/advanced?page=${page}&limit=20`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      const response = await axios.get(url, { headers: getAuthHeader() });
      setOrders(response.data.orders || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      try {
        const response = await axios.get(`${API_URL}/admin/orders`, { headers: getAuthHeader() });
        setOrders(response.data || []);
        setTotal(response.data.length || 0);
      } catch (e) {
        toast.error("فشل في تحميل الطلبات");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdating(true);
    try {
      await axios.put(`${API_URL}/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        admin_notes: adminNotes
      }, { headers: getAuthHeader() });
      toast.success("تم تحديث حالة الطلب");
      setSelectedOrder(null);
      setNewStatus("");
      setAdminNotes("");
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تحديث الحالة");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliver = async () => {
    if (!deliveryDialog) return;
    setUpdating(true);
    try {
      await axios.post(`${API_URL}/admin/orders/${deliveryDialog.id}/deliver`, deliveryData, { headers: getAuthHeader() });
      toast.success("تم تسليم الطلب بنجاح");
      setDeliveryDialog(null);
      setDeliveryData({ email: "", password: "", notes: "" });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في تسليم الطلب");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="font-heading text-xl md:text-2xl font-bold">إدارة الطلبات</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{total} طلب</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الطلب أو البريد..."
              className="pr-10 h-10"
            />
          </div>
          <Button type="submit" variant="secondary">بحث</Button>
        </form>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {Object.entries(ORDER_STATUSES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-sm font-bold">#{order.order_number || order.id.slice(0, 8)}</span>
                    <Badge className={ORDER_STATUSES[order.status]?.color || "bg-gray-500"}>
                      {ORDER_STATUSES[order.status]?.label || order.status}
                    </Badge>
                    {order.product_type && (
                      <Badge variant="outline" className="text-xs">
                        {order.product_type === "code" ? "كود" : order.product_type === "existing_account" ? "حساب جاهز" : "حساب جديد"}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">العميل: </span>
                      <span className="font-medium">{order.user_name || order.user_email || "غير معروف"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المبلغ: </span>
                      <span className="font-bold text-green-500">{order.total_jod?.toFixed(2)} د.أ</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">التاريخ: </span>
                      <span>{new Date(order.created_at).toLocaleDateString('ar-JO')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المنتجات: </span>
                      <span>{order.items?.length || 0}</span>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground truncate">
                      {order.items.map(i => i.product_name).join(" • ")}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setNewStatus(order.status); }}>
                    <Edit className="h-4 w-4 ml-1" /> تعديل
                  </Button>
                  {order.product_type && order.product_type !== "code" && order.status !== "delivered" && (
                    <Button size="sm" onClick={() => setDeliveryDialog(order)}>
                      <Send className="h-4 w-4 ml-1" /> تسليم
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد طلبات</p>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
          <span className="px-4 py-2 text-sm">صفحة {page} من {Math.ceil(total / 20)}</span>
          <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}>التالي</Button>
        </div>
      )}

      {/* Update Status Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تحديث حالة الطلب</DialogTitle>
            <DialogDescription>#{selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 text-sm">
              <div className="flex justify-between mb-2">
                <span>العميل: {selectedOrder?.user_name || selectedOrder?.user_email}</span>
                <span>المبلغ: {selectedOrder?.total_jod?.toFixed(2)} د.أ</span>
              </div>
              <div className="text-xs text-muted-foreground">
                المنتجات: {selectedOrder?.items?.map(i => i.product_name).join(" • ")}
              </div>
            </div>
            <div>
              <Label>الحالة الجديدة</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_STATUSES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ملاحظات (اختياري)</Label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="سبب تغيير الحالة..." rows={2} />
            </div>
            {/* Status History */}
            {selectedOrder?.status_history && selectedOrder.status_history.length > 0 && (
              <div>
                <Label className="mb-2 block">سجل الحالات</Label>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {selectedOrder.status_history.map((h, i) => (
                    <div key={i} className="p-2 rounded bg-secondary/30">
                      <span className="font-bold">{ORDER_STATUSES[h.to]?.label}</span>
                      <span className="text-muted-foreground"> - {h.by_name} - {new Date(h.at).toLocaleString('ar-JO')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>إلغاء</Button>
            <Button onClick={handleUpdateStatus} disabled={updating}>{updating ? "جاري التحديث..." : "تحديث"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Delivery Dialog */}
      <Dialog open={!!deliveryDialog} onOpenChange={() => setDeliveryDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسليم الطلب يدوياً</DialogTitle>
            <DialogDescription>أدخل بيانات الحساب لإرسالها للعميل</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deliveryDialog?.customer_details && (
              <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                <p className="font-bold mb-2">بيانات العميل:</p>
                {deliveryDialog.customer_details.email && (
                  <div>البريد: <span dir="ltr">{deliveryDialog.customer_details.email}</span></div>
                )}
                {deliveryDialog.customer_details.password && (
                  <div>كلمة المرور: <span dir="ltr">{deliveryDialog.customer_details.password}</span></div>
                )}
                {deliveryDialog.customer_details.phone && (
                  <div>الهاتف: <span dir="ltr">{deliveryDialog.customer_details.phone}</span></div>
                )}
              </div>
            )}
            <div>
              <Label>البريد الإلكتروني للحساب الجديد</Label>
              <Input value={deliveryData.email} onChange={(e) => setDeliveryData({...deliveryData, email: e.target.value})} dir="ltr" placeholder="account@example.com" />
            </div>
            <div>
              <Label>كلمة المرور الجديدة</Label>
              <Input value={deliveryData.password} onChange={(e) => setDeliveryData({...deliveryData, password: e.target.value})} type="text" dir="ltr" placeholder="newPassword123" />
            </div>
            <div>
              <Label>تاريخ انتهاء الاشتراك</Label>
              <Input 
                type="date" 
                value={deliveryData.subscription_end || ""} 
                onChange={(e) => setDeliveryData({...deliveryData, subscription_end: e.target.value})} 
                dir="ltr" 
              />
            </div>
            <div>
              <Label>ملاحظات إضافية</Label>
              <Textarea value={deliveryData.notes} onChange={(e) => setDeliveryData({...deliveryData, notes: e.target.value})} placeholder="معلومات إضافية للعميل..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryDialog(null)}>إلغاء</Button>
            <Button onClick={handleDeliver} disabled={updating}>{updating ? "جاري التسليم..." : "تسليم وإشعار العميل"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
