import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice, API_URL, getAuthHeader } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
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
  Mail,
  Lock,
  Phone,
  AlertCircle,
  User,
} from "lucide-react";

export default function CartPage() {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    updateAccountInfo,
    clearCart, 
    getTotal, 
    currency,
    validateCart 
  } = useCart();
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

    // Validate cart items
    const validation = validateCart();
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setLoading(true);
    try {
      // Create orders for each item
      for (const item of items) {
        const orderData = {
          product_id: item.id,
          quantity: item.quantity,
          variant_id: item.selectedVariant?.id || null,
        };

        // Add account info for non-digital products
        if (item.product_type && item.product_type !== "digital_code" && item.accountInfo) {
          orderData.customer_email = item.accountInfo.email || null;
          orderData.customer_password = item.accountInfo.password || null;
          orderData.customer_phone = item.accountInfo.phone || null;
        }

        await axios.post(
          `${API_URL}/orders`,
          orderData,
          { headers: getAuthHeader() }
        );
      }
      
      clearCart();
      toast.success("تم إنشاء الطلب بنجاح! 🎉");
      navigate("/orders");
    } catch (error) {
      console.error("Checkout failed:", error);
      const message = error.response?.data?.detail || "فشل في إتمام الطلب";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (item) => {
    if (item.selectedVariant) {
      return currency === "JOD" ? item.selectedVariant.price_jod : item.selectedVariant.price_usd;
    }
    return currency === "JOD" ? item.price_jod : item.price_usd;
  };

  const productTypeLabels = {
    digital_code: { label: "كود رقمي", icon: "🔑", color: "bg-blue-500" },
    existing_account: { label: "حساب جاهز", icon: "👤", color: "bg-purple-500" },
    new_account: { label: "حساب جديد", icon: "📱", color: "bg-orange-500" },
  };

  if (items.length === 0) {
    return (
      <div className="px-4 py-12 md:py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <ShoppingBag className="h-20 w-20 mx-auto text-muted-foreground opacity-50" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            سلة التسوق فارغة
          </h1>
          <p className="text-muted-foreground mb-6">
            لم تقم بإضافة أي منتجات للسلة بعد
          </p>
          <Link to="/products">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              تصفح المنتجات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = getTotal();
  const discountAmount = appliedDiscount ? appliedDiscount.discount_amount : 0;
  const total = subtotal - discountAmount;

  return (
    <div className="section-container py-8 md:py-12">
      <h1 className="font-heading text-2xl md:text-3xl font-bold mb-8">
        سلة التسوق
        <span className="text-muted-foreground text-lg font-normal mr-2">
          ({items.length} منتج)
        </span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const itemKey = item.cartId || item.id;
            const productType = item.product_type || "digital_code";
            const typeInfo = productTypeLabels[productType];
            const price = getItemPrice(item);
            const isAccountProduct = productType !== "digital_code";
            const accountInfo = item.accountInfo || {};

            return (
              <div
                key={itemKey}
                className="p-4 md:p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link to={`/products/${item.id}`}>
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover flex-shrink-0"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/products/${item.id}`}
                          className="font-bold text-sm md:text-base hover:text-primary line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={typeInfo.color + " text-xs"}>
                            {typeInfo.icon} {typeInfo.label}
                          </Badge>
                          {item.selectedVariant && (
                            <Badge variant="outline" className="text-xs">
                              {item.selectedVariant.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(itemKey)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Price & Quantity */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-lg font-bold text-primary ltr-nums">
                        {formatPrice(price, currency)}
                      </div>
                      
                      {productType === "digital_code" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
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
                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary">قطعة واحدة</Badge>
                      )}
                    </div>

                    {/* Account Info Input for non-digital products */}
                    {isAccountProduct && (
                      <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-accent">
                          <AlertCircle className="h-4 w-4" />
                          {productType === "existing_account" 
                            ? "أدخل بيانات حسابك الحالي:" 
                            : "أدخل بياناتك لإنشاء الحساب:"}
                        </div>

                        {item.delivery_instructions && (
                          <p className="text-xs text-muted-foreground">{item.delivery_instructions}</p>
                        )}

                        <div className="grid gap-3">
                          {(productType === "existing_account" || item.requires_email) && (
                            <div>
                              <Label className="text-xs flex items-center gap-1 mb-1">
                                <Mail className="h-3 w-3" /> البريد الإلكتروني *
                              </Label>
                              <Input
                                type="email"
                                value={accountInfo.email || ""}
                                onChange={(e) => updateAccountInfo(itemKey, { 
                                  ...accountInfo, 
                                  email: e.target.value 
                                })}
                                placeholder="example@email.com"
                                className="h-9 text-sm"
                                dir="ltr"
                              />
                            </div>
                          )}

                          {(productType === "existing_account" || item.requires_password) && (
                            <div>
                              <Label className="text-xs flex items-center gap-1 mb-1">
                                <Lock className="h-3 w-3" /> كلمة المرور *
                              </Label>
                              <Input
                                type="text"
                                value={accountInfo.password || ""}
                                onChange={(e) => updateAccountInfo(itemKey, { 
                                  ...accountInfo, 
                                  password: e.target.value 
                                })}
                                placeholder="كلمة مرور الحساب"
                                className="h-9 text-sm"
                                dir="ltr"
                              />
                            </div>
                          )}

                          {(productType === "new_account" || item.requires_phone) && (
                            <div>
                              <Label className="text-xs flex items-center gap-1 mb-1">
                                <Phone className="h-3 w-3" /> رقم الهاتف *
                              </Label>
                              <Input
                                type="tel"
                                value={accountInfo.phone || ""}
                                onChange={(e) => updateAccountInfo(itemKey, { 
                                  ...accountInfo, 
                                  phone: e.target.value 
                                })}
                                placeholder="+962 7X XXX XXXX"
                                className="h-9 text-sm"
                                dir="ltr"
                              />
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          ⚠️ سيتم استخدام هذه البيانات لشحن حسابك. تأكد من صحتها.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 rounded-2xl bg-card border border-border space-y-6">
            <h2 className="font-heading text-xl font-bold">ملخص الطلب</h2>

            {/* Discount Code */}
            <div className="space-y-2">
              <Label className="text-sm">كود الخصم</Label>
              {appliedDiscount ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">
                      {appliedDiscount.code}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={removeDiscount}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="أدخل الكود"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyDiscount}
                    disabled={applyingDiscount || !discountCode.trim()}
                  >
                    {applyingDiscount ? "..." : "تطبيق"}
                  </Button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span className="ltr-nums">{formatPrice(subtotal, currency)}</span>
              </div>
              
              {appliedDiscount && (
                <div className="flex justify-between text-sm text-green-500">
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" /> خصم
                  </span>
                  <span className="ltr-nums">-{formatPrice(discountAmount, currency)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                <span>الإجمالي</span>
                <span className="text-primary ltr-nums">{formatPrice(total, currency)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleCheckout}
              disabled={loading}
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

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-border text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-green-500" />
                <span>دفع آمن</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-accent" />
                <span>توصيل فوري</span>
              </div>
            </div>

            {/* Login Prompt */}
            {!isAuthenticated && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm mb-3">سجل دخولك لإتمام الشراء</p>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    تسجيل الدخول
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
