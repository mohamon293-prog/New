import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice, API_URL, getAuthHeader } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Shield,
  Zap,
  Tag,
  Check,
  X,
} from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal, currency } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    if (!isAuthenticated) {
      toast.error("يجب تسجيل الدخول لاستخدام كود الخصم");
      return;
    }

    setApplyingDiscount(true);
    try {
      const response = await axios.post(
        `${API_URL}/discounts/apply`,
        {
          code: discountCode,
          subtotal: getTotal(),
          product_ids: items.map(i => i.id)
        },
        { headers: getAuthHeader() }
      );
      
      setAppliedDiscount(response.data);
      toast.success("تم تطبيق كود الخصم!");
    } catch (error) {
      const message = error.response?.data?.detail || "كود الخصم غير صالح";
      toast.error(message);
      setAppliedDiscount(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error("يجب تسجيل الدخول للمتابعة");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // Process each item as separate order
      for (const item of items) {
        await axios.post(
          `${API_URL}/orders`,
          { product_id: item.id, quantity: item.quantity },
          { headers: getAuthHeader() }
        );
      }
      
      clearCart();
      toast.success("تم إنشاء الطلب بنجاح!");
      navigate("/orders");
    } catch (error) {
      console.error("Checkout failed:", error);
      const message = error.response?.data?.detail || "فشل في إتمام الطلب";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="section-container py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">السلة فارغة</h1>
          <p className="text-muted-foreground mb-6">
            لم تقم بإضافة أي منتجات للسلة بعد
          </p>
          <Link to="/products">
            <Button className="gap-2">
              تصفح المنتجات
              <ArrowLeft className="h-4 w-4" />
            </Button>
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
          <h1 className="font-heading text-2xl md:text-3xl font-bold">
            سلة التسوق
          </h1>
          <p className="text-muted-foreground mt-1">
            {items.length} منتج في السلة
          </p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const price = currency === "JOD" ? item.price_jod : item.price_usd;
              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-xl bg-card border border-border"
                  data-testid={`cart-item-${item.id}`}
                >
                  {/* Image */}
                  <Link
                    to={`/products/${item.id}`}
                    className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-secondary"
                  >
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.id}`}
                      className="font-heading font-bold hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.category_name} • {item.region}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold ltr-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock_count || 10)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Remove */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        data-testid={`remove-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-left">
                    <div className="font-bold text-primary ltr-nums">
                      {formatPrice(price * item.quantity, currency)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-muted-foreground ltr-nums">
                        {formatPrice(price, currency)} × {item.quantity}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Clear Cart */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  clearCart();
                  toast.success("تم إفراغ السلة");
                }}
              >
                <Trash2 className="h-4 w-4 ml-2" />
                إفراغ السلة
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="font-heading text-lg font-bold mb-4">
                  ملخص الطلب
                </h3>
                
                <div className="space-y-3 pb-4 border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span className="ltr-nums">{formatPrice(getTotal(), currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الخصم</span>
                    <span className="text-green-500">-0.00</span>
                  </div>
                </div>
                
                <div className="flex justify-between py-4 text-lg font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary ltr-nums">
                    {formatPrice(getTotal(), currency)}
                  </span>
                </div>

                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleCheckout}
                  disabled={loading}
                  data-testid="checkout-button"
                >
                  {loading ? (
                    "جاري المعالجة..."
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      إتمام الشراء
                    </>
                  )}
                </Button>

                {!isAuthenticated && (
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    <Link to="/login" className="text-primary hover:underline">
                      سجل دخول
                    </Link>{" "}
                    للمتابعة
                  </p>
                )}
              </div>

              {/* Trust Badges */}
              <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span>أكواد أصلية ومضمونة 100%</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="h-5 w-5 text-accent" />
                  <span>توصيل فوري بعد الدفع</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
