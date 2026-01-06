import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { formatPrice, formatDate, API_URL, getAuthHeader } from "../lib/utils";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import {
  Package,
  Eye,
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShoppingBag,
  User,
  Calendar,
  Info,
  Key,
  Mail,
  Lock,
  FileText,
} from "lucide-react";

export default function OrdersPage() {
  const { user } = useAuth();
  const { currency } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Digital codes dialog
  const [codesDialog, setCodesDialog] = useState(null);
  const [revealedCodes, setRevealedCodes] = useState([]);
  const [revealing, setRevealing] = useState(false);
  const [confirmRevealDialog, setConfirmRevealDialog] = useState(null);
  
  // Account status dialog
  const [accountStatusDialog, setAccountStatusDialog] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: getAuthHeader(),
      });
      console.log("Orders received:", response.data);
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  // Check if order is for account product
  const isAccountOrder = (order) => {
    const pType = order.product_type;
    return pType === "existing_account" || pType === "new_account";
  };

  // Handle reveal codes for digital products
  const handleRevealCodes = async (order) => {
    if (order.revealed_at) {
      // Already revealed, just fetch and show
      try {
        const response = await axios.post(
          `${API_URL}/orders/${order.id}/reveal`,
          {},
          { headers: getAuthHeader() }
        );
        const codes = response.data.codes || [];
        setRevealedCodes(codes.map(c => typeof c === 'string' ? c : c.code));
        setCodesDialog(order);
      } catch (error) {
        toast.error("فشل في تحميل الأكواد");
      }
      return;
    }
    // Show confirmation dialog
    setConfirmRevealDialog(order);
  };

  const confirmReveal = async () => {
    if (!confirmRevealDialog) return;
    setRevealing(true);
    try {
      const response = await axios.post(
        `${API_URL}/orders/${confirmRevealDialog.id}/reveal`,
        {},
        { headers: getAuthHeader() }
      );
      const codes = response.data.codes || [];
      setRevealedCodes(codes.map(c => typeof c === 'string' ? c : c.code));
      setConfirmRevealDialog(null);
      setCodesDialog(confirmRevealDialog);
      
      // Update order in list
      setOrders(prev => prev.map(o => 
        o.id === confirmRevealDialog.id 
          ? { ...o, revealed_at: new Date().toISOString() }
          : o
      ));
      
      toast.success("تم كشف الأكواد بنجاح");
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في كشف الأكواد");
    } finally {
      setRevealing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  // Status badge
  const getStatusBadge = (order) => {
    if (isAccountOrder(order)) {
      if (order.status === "delivered") {
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 ml-1" />تم التفعيل</Badge>;
      }
      return <Badge className="bg-orange-500"><Clock className="h-3 w-3 ml-1" />قيد التنفيذ</Badge>;
    }
    
    // Digital codes
    if (order.revealed_at) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 ml-1" />تم الكشف</Badge>;
    }
    if (order.status === "completed") {
      return <Badge className="bg-accent"><Key className="h-3 w-3 ml-1" />جاهز للكشف</Badge>;
    }
    if (order.status === "refunded") {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 ml-1" />مسترد</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />{order.status}</Badge>;
  };

  // Product type badge
  const getTypeBadge = (order) => {
    if (order.product_type === "existing_account") {
      return <Badge variant="outline" className="text-purple-500 border-purple-500/50">حساب جاهز</Badge>;
    }
    if (order.product_type === "new_account") {
      return <Badge variant="outline" className="text-orange-500 border-orange-500/50">حساب جديد</Badge>;
    }
    return <Badge variant="outline" className="text-blue-500 border-blue-500/50">كود رقمي</Badge>;
  };

  if (loading) {
    return (
      <div className="section-container py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="section-container py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">لا توجد طلبات</h1>
          <p className="text-muted-foreground mb-6">لم تقم بأي عملية شراء بعد</p>
          <Link to="/products"><Button>تصفح المنتجات</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="section-container py-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold">طلباتي</h1>
          <p className="text-muted-foreground mt-1">{orders.length} طلب</p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-4 md:p-6 rounded-xl bg-card border border-border">
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono text-sm font-bold">#{order.order_number || order.id.slice(0, 8)}</span>
                    {getStatusBadge(order)}
                    {getTypeBadge(order)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">
                    {formatPrice(currency === "JOD" ? order.total_jod : order.total_usd, currency)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 py-4 border-t border-border">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                    </div>
                    <div className="text-left">
                      {formatPrice(
                        currency === "JOD" ? (item.price_jod * item.quantity) : (item.price_usd * item.quantity),
                        currency
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                {isAccountOrder(order) ? (
                  // Account Product - Show Status Button
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setAccountStatusDialog(order)}
                  >
                    <FileText className="h-4 w-4" />
                    حالة الحساب
                  </Button>
                ) : (
                  // Digital Code - Show Reveal Button
                  <Button
                    variant={order.revealed_at ? "outline" : "default"}
                    className="gap-2"
                    onClick={() => handleRevealCodes(order)}
                  >
                    <Key className="h-4 w-4" />
                    {order.revealed_at ? "عرض الأكواد" : "كشف الأكواد"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========== ACCOUNT STATUS DIALOG ========== */}
      <Dialog open={!!accountStatusDialog} onOpenChange={() => setAccountStatusDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              حالة الحساب
            </DialogTitle>
            <DialogDescription>
              طلب #{accountStatusDialog?.order_number || accountStatusDialog?.id?.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {accountStatusDialog && (
            <div className="space-y-4">
              {/* Status Check */}
              {accountStatusDialog.status === "delivered" && accountStatusDialog.delivery_data ? (
                // COMPLETED - Show account details
                <>
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <h3 className="font-bold text-green-500 text-lg">تم تفعيل حسابك بنجاح!</h3>
                  </div>

                  {/* Account Credentials */}
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
                    <h4 className="font-bold mb-3">بيانات الحساب:</h4>
                    
                    {accountStatusDialog.delivery_data.email && (
                      <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">البريد:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm" dir="ltr">{accountStatusDialog.delivery_data.email}</code>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(accountStatusDialog.delivery_data.email)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {accountStatusDialog.delivery_data.password && (
                      <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">كلمة المرور:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm" dir="ltr">{accountStatusDialog.delivery_data.password}</code>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(accountStatusDialog.delivery_data.password)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {accountStatusDialog.delivery_data.subscription_end && (
                      <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">ينتهي الاشتراك:</span>
                        </div>
                        <span className="font-bold text-green-500">{accountStatusDialog.delivery_data.subscription_end}</span>
                      </div>
                    )}
                  </div>

                  {/* Admin Notes/Instructions */}
                  {accountStatusDialog.delivery_data.notes && (
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                      <h5 className="font-bold text-blue-500 mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        ملاحظات وتعليمات
                      </h5>
                      <p className="text-sm whitespace-pre-wrap">{accountStatusDialog.delivery_data.notes}</p>
                    </div>
                  )}

                  {/* Security Warning */}
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-center">
                    <p className="text-destructive">⚠️ لا تشارك بيانات حسابك مع أي شخص</p>
                  </div>
                </>
              ) : (
                // PENDING - Show waiting message
                <div className="text-center py-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-orange-500 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-orange-500 text-lg mb-2">جاري تفعيل حسابك</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    يتم الآن إعداد حسابك. سيتم تفعيله خلال ساعتين كحد أقصى.
                  </p>
                  <div className="p-3 rounded-lg bg-secondary text-sm">
                    <p>📱 ستصلك رسالة عند اكتمال التفعيل</p>
                    <p className="mt-1">يمكنك العودة لهذه الصفحة للتحقق من حالة حسابك</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setAccountStatusDialog(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== CONFIRM REVEAL CODES DIALOG ========== */}
      <Dialog open={!!confirmRevealDialog} onOpenChange={() => setConfirmRevealDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              تأكيد كشف الأكواد
            </DialogTitle>
            <DialogDescription className="text-right">
              <span className="block text-destructive font-bold mb-2">تحذير هام!</span>
              بعد كشف الأكواد، لن تتمكن من استرداد المبلغ. تأكد من أنك جاهز لاستخدام الكود.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setConfirmRevealDialog(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmReveal} disabled={revealing}>
              {revealing ? "جاري الكشف..." : "نعم، اكشف الأكواد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== REVEALED CODES DIALOG ========== */}
      <Dialog open={!!codesDialog} onOpenChange={() => { setCodesDialog(null); setRevealedCodes([]); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              أكواد طلبك
            </DialogTitle>
            <DialogDescription>انسخ الأكواد واحتفظ بها في مكان آمن</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {revealedCodes.map((code, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                <code className="font-mono text-sm" dir="ltr">{code}</code>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => { setCodesDialog(null); setRevealedCodes([]); }}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
