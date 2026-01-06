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
} from "lucide-react";

export default function OrdersPage() {
  const { user } = useAuth();
  const { currency } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [revealDialog, setRevealDialog] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState([]);
  const [revealing, setRevealing] = useState(false);
  const [accountDetailsDialog, setAccountDetailsDialog] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: getAuthHeader(),
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const handleRevealCodes = async (order) => {
    if (order.revealed_at) {
      try {
        const response = await axios.post(
          `${API_URL}/orders/${order.id}/reveal`,
          {},
          { headers: getAuthHeader() }
        );
        const codes = response.data.codes || [];
        const formattedCodes = codes.map(c => typeof c === 'string' ? c : c.code);
        setRevealedCodes(formattedCodes);
        setSelectedOrder(order);
      } catch (error) {
        toast.error("فشل في تحميل الأكواد");
      }
      return;
    }

    setSelectedOrder(order);
    setRevealDialog(true);
  };

  const confirmReveal = async () => {
    if (!selectedOrder) return;

    setRevealing(true);
    try {
      const response = await axios.post(
        `${API_URL}/orders/${selectedOrder.id}/reveal`,
        {},
        { headers: getAuthHeader() }
      );
      
      const codes = response.data.codes || [];
      const formattedCodes = codes.map(c => typeof c === 'string' ? c : c.code);
      setRevealedCodes(formattedCodes);
      setRevealDialog(false);
      
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, revealed_at: response.data.revealed_at || new Date().toISOString() }
            : o
        )
      );
      
      toast.success("تم كشف الأكواد بنجاح");
    } catch (error) {
      console.error("Failed to reveal codes:", error);
      toast.error(error.response?.data?.detail || "فشل في كشف الأكواد");
    } finally {
      setRevealing(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ الكود");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  };

  // Determine if order is for account type product
  const isAccountProduct = (order) => {
    return order.product_type === "existing_account" || order.product_type === "new_account";
  };

  const getStatusBadge = (order) => {
    // For account products
    if (isAccountProduct(order)) {
      if (order.status === "delivered") {
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 ml-1" />
            تم الاشتراك
          </Badge>
        );
      }
      if (order.status === "awaiting_admin" || order.status === "pending") {
        return (
          <Badge className="bg-orange-500">
            <Clock className="h-3 w-3 ml-1" />
            قيد التنفيذ
          </Badge>
        );
      }
      if (order.status === "refunded") {
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 ml-1" />
            مسترد
          </Badge>
        );
      }
    }
    
    // For digital codes
    if (order.revealed_at) {
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="h-3 w-3 ml-1" />
          تم الكشف
        </Badge>
      );
    }
    if (order.status === "completed") {
      return (
        <Badge className="bg-accent">
          <Key className="h-3 w-3 ml-1" />
          جاهز للكشف
        </Badge>
      );
    }
    if (order.status === "refunded") {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 ml-1" />
          مسترد
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 ml-1" />
        {order.status}
      </Badge>
    );
  };

  const getProductTypeBadge = (order) => {
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
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
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
          <p className="text-muted-foreground mb-6">
            لم تقم بأي عملية شراء بعد
          </p>
          <Link to="/products">
            <Button>تصفح المنتجات</Button>
          </Link>
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
          <p className="text-muted-foreground mt-1">
            {orders.length} طلب
          </p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-4 md:p-6 rounded-xl bg-card border border-border"
              data-testid={`order-${order.id}`}
            >
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono text-sm font-bold ltr-nums">
                      #{order.order_number || order.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(order)}
                    {getProductTypeBadge(order)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg ltr-nums">
                    {formatPrice(
                      currency === "JOD" ? order.total_jod : order.total_usd,
                      currency
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 py-4 border-t border-border">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        الكمية: {item.quantity}
                      </p>
                    </div>
                    <div className="text-left ltr-nums">
                      {formatPrice(
                        currency === "JOD"
                          ? (item.unit_price_jod || item.price_jod) * item.quantity
                          : (item.unit_price_usd || item.price_usd) * item.quantity,
                        currency
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* === ACCOUNT PRODUCTS SECTION === */}
              {isAccountProduct(order) && (
                <>
                  {/* Delivered - Show Account Details */}
                  {order.status === "delivered" && order.delivery_data && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-green-500 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          تم الاشتراك بنجاح!
                        </h4>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setAccountDetailsDialog(order)}
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض التفاصيل
                        </Button>
                      </div>
                      
                      {/* Quick Info */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {order.delivery_data.subscription_end && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">ينتهي:</span>
                            <span className="font-bold text-green-500">{order.delivery_data.subscription_end}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Awaiting Admin */}
                  {(order.status === "awaiting_admin" || order.status === "pending") && (
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 mt-4">
                      <h4 className="font-bold text-orange-500 mb-2 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        جاري تفعيل حسابك
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        سيتم تفعيل حسابك وإرسال البيانات خلال ساعتين كحد أقصى. 
                        ستصلك إشعار فور اكتمال التفعيل.
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>يمكنك متابعة حالة طلبك من هذه الصفحة</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* === DIGITAL CODES SECTION === */}
              {!isAccountProduct(order) && (
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    variant={order.revealed_at ? "outline" : "default"}
                    className="gap-2"
                    onClick={() => handleRevealCodes(order)}
                    data-testid={`reveal-codes-${order.id}`}
                  >
                    <Key className="h-4 w-4" />
                    {order.revealed_at ? "عرض الأكواد" : "كشف الأكواد"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reveal Codes Confirmation Dialog */}
      <Dialog open={revealDialog} onOpenChange={setRevealDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              تأكيد كشف الأكواد
            </DialogTitle>
            <DialogDescription className="text-right">
              <span className="block text-destructive font-bold mb-2">
                تحذير هام!
              </span>
              بعد كشف الأكواد، لن تتمكن من استرداد المبلغ تحت أي ظرف.
              تأكد من أنك جاهز لاستخدام الكود الآن.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="outline"
              onClick={() => setRevealDialog(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReveal}
              disabled={revealing}
            >
              {revealing ? "جاري الكشف..." : "نعم، اكشف الأكواد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revealed Codes Dialog */}
      <Dialog open={!!selectedOrder && revealedCodes.length > 0} onOpenChange={() => { setSelectedOrder(null); setRevealedCodes([]); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              أكواد طلبك
            </DialogTitle>
            <DialogDescription>
              انسخ الأكواد واستخدمها. احتفظ بها في مكان آمن.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {revealedCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary"
              >
                <code className="font-mono text-sm" dir="ltr">{code}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCode(code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => { setSelectedOrder(null); setRevealedCodes([]); }}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Details Dialog */}
      <Dialog open={!!accountDetailsDialog} onOpenChange={() => setAccountDetailsDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              تفاصيل حسابك
            </DialogTitle>
            <DialogDescription>
              بيانات الحساب الخاص بك بعد الاشتراك
            </DialogDescription>
          </DialogHeader>
          
          {accountDetailsDialog?.delivery_data && (
            <div className="space-y-4">
              {/* Account Credentials */}
              <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
                {accountDetailsDialog.delivery_data.email && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">البريد الإلكتروني:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm" dir="ltr">{accountDetailsDialog.delivery_data.email}</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(accountDetailsDialog.delivery_data.email)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {accountDetailsDialog.delivery_data.password && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">كلمة المرور:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm" dir="ltr">{accountDetailsDialog.delivery_data.password}</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(accountDetailsDialog.delivery_data.password)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {accountDetailsDialog.delivery_data.subscription_end && (
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">ينتهي الاشتراك:</span>
                    </div>
                    <span className="font-bold text-green-500">{accountDetailsDialog.delivery_data.subscription_end}</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {accountDetailsDialog.delivery_data.notes && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <h5 className="font-bold text-blue-500 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    تعليمات مهمة
                  </h5>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {accountDetailsDialog.delivery_data.notes}
                  </p>
                </div>
              )}

              {/* Warning */}
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                <p className="text-destructive font-medium">
                  ⚠️ لا تشارك بيانات حسابك مع أي شخص. احتفظ بها في مكان آمن.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setAccountDetailsDialog(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
