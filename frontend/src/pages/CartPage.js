import React, { useState, useEffect } from "react";
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
  const { isAuthenticated } = useAuth();
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
      <div className="px-4 py-12 md:py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-xl md:text-2xl font-bold mb-2">السلة فارغة</h1>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            لم تقم بإضافة أي منتجات للسلة بعد
          </p>
          <Link to="/products">
            <Button className="gap-2 h-11 px-6">
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
        <div className="px-4 py-5 md:py-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold">
              سلة التسوق
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length} منتج في السلة
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              {items.map((item) => {
                const price = currency === "JOD" ? item.price_jod : item.price_usd;
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-card border border-border"
                    data-testid={`cart-item-${item.id}`}
                  >
                    {/* Image */}
                    <Link
                      to={`/products/${item.id}`}
                      className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-secondary"
                    >
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link
                        to={`/products/${item.id}`}
                        className="font-heading font-bold text-sm md:text-base hover:text-primary transition-colors line-clamp-2"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                        {item.category_name} • {item.region}
                      </p>
                      
                      {/* Mobile: Price under name */}
                      <div className="mt-auto pt-2 flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 md:w-8 text-center font-bold text-sm ltr-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (item.stock_count || 10)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Price & Delete */}
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="text-left">
                            <div className="font-bold text-sm md:text-base text-primary ltr-nums">
                              {formatPrice(price * item.quantity, currency)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.id)}
                            data-testid={`remove-item-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Clear Cart - Desktop */}
              <div className="hidden md:flex justify-end pt-2">
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
              <div className="sticky top-20 space-y-4 md:space-y-6">
                <div className="p-4 md:p-6 rounded-xl bg-card border border-border">
                  <h3 className="font-heading text-base md:text-lg font-bold mb-4">
                    ملخص الطلب
                  </h3>

                  {/* Discount Code Input */}
                  <div className="mb-4">
                    {appliedDiscount ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-500">
                            {appliedDiscount.code}
                          </span>
                        </div>
                        <button onClick={removeDiscount} className="text-muted-foreground hover:text-destructive p-1">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            placeholder="كود الخصم"
                            className="pr-10 h-10 md:h-11"
                          />
                        </div>
                        <Button
                          variant="outline"
                          onClick={handleApplyDiscount}
                          disabled={applyingDiscount || !discountCode}
                          className="h-10 md:h-11 px-4"
                        >
                          {applyingDiscount ? "..." : "تطبيق"}
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2.5 pb-4 border-b border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">المجموع الفرعي</span>
                      <span className="ltr-nums">{formatPrice(getTotal(), currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الخصم</span>
                      <span className="text-green-500 ltr-nums">
                        -{appliedDiscount ? formatPrice(appliedDiscount.discount_amount, currency) : "0.00"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between py-4 text-base md:text-lg font-bold">
                    <span>الإجمالي</span>
                    <span className="text-primary ltr-nums">
                      {formatPrice(appliedDiscount ? appliedDiscount.final_total : getTotal(), currency)}
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full gap-2 h-11 md:h-12"
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
                    <p className="text-xs md:text-sm text-muted-foreground text-center mt-3">
                      <Link to="/login" className="text-primary hover:underline">
                        سجل دخول
                      </Link>{" "}
                      للمتابعة
                    </p>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="p-4 rounded-xl bg-secondary/50 space-y-2.5">
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>أكواد أصلية ومضمونة 100%</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Zap className="h-5 w-5 text-accent flex-shrink-0" />
                    <span>توصيل فوري بعد الدفع</span>
                  </div>
                </div>

                {/* Mobile Clear Cart */}
                <Button
                  variant="outline"
                  className="w-full md:hidden text-destructive hover:text-destructive hover:bg-destructive/10"
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
          </div>
        </div>
      </div>
    </div>
  );
}
