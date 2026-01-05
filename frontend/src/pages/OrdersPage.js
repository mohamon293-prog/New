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
      // Already revealed, just show the codes
      setSelectedOrder(order);
      setRevealedCodes(order.items.flatMap((item) => item.codes));
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
      
      // Handle both formats: array of strings or array of objects
      const codes = response.data.codes || [];
      const formattedCodes = codes.map(c => typeof c === 'string' ? c : c.code);
      setRevealedCodes(formattedCodes);
      setRevealDialog(false);
      
      // Update order in list
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

  const getStatusBadge = (order) => {
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
          <Clock className="h-3 w-3 ml-1" />
          جاهز للكشف
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
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <span className="font-mono text-sm text-muted-foreground ltr-nums">
                      #{order.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(order)}
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
                          ? item.unit_price_jod * item.quantity
                          : item.unit_price_usd * item.quantity,
                        currency
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  variant={order.revealed_at ? "outline" : "default"}
                  className="gap-2"
                  onClick={() => handleRevealCodes(order)}
                  data-testid={`reveal-codes-${order.id}`}
                >
                  <Eye className="h-4 w-4" />
                  {order.revealed_at ? "عرض الأكواد" : "كشف الأكواد"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reveal Confirmation Dialog */}
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

      {/* Codes Display Dialog */}
      <Dialog
        open={revealedCodes.length > 0}
        onOpenChange={() => setRevealedCodes([])}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              أكواد الطلب
            </DialogTitle>
            <DialogDescription className="text-right">
              انسخ الأكواد واحفظها في مكان آمن
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {revealedCodes.map((code, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-secondary"
              >
                <code className="font-mono text-sm ltr-nums break-all">
                  {code}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyCode(code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">
              <strong>تنبيه:</strong> احفظ هذه الأكواد في مكان آمن.
              لا يمكن استرداد المبلغ بعد كشف الأكواد.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
