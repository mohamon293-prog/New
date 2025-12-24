import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { featuredProducts } from "../data/mockData";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice, API_URL, getAuthHeader } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import { toast } from "sonner";
import {
  ShoppingCart,
  Star,
  Shield,
  Zap,
  Globe,
  ChevronLeft,
  Plus,
  Minus,
  Check,
  Copy,
} from "lucide-react";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem, currency } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      // Fallback to mock data
      const mockProduct = featuredProducts.find((p) => p.id === productId);
      if (mockProduct) {
        setProduct(mockProduct);
      } else {
        navigate("/products");
        toast.error("المنتج غير موجود");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${productId}/reviews`);
      setReviews(response.data);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      // Mock reviews
      setReviews([
        {
          id: "1",
          user_name: "أحمد محمد",
          rating: 5,
          comment: "خدمة ممتازة وتوصيل فوري. الكود يعمل بشكل مثالي!",
          is_verified: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          user_name: "سارة العلي",
          rating: 4,
          comment: "سعر جيد وخدمة سريعة. أنصح بالتعامل معهم.",
          is_verified: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    toast.success("تمت الإضافة للسلة", {
      description: `${product.name} × ${quantity}`,
    });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error("يجب تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    handleAddToCart();
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="section-container py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const price = currency === "JOD" ? product.price_jod : product.price_usd;
  const originalPrice =
    currency === "JOD" ? product.original_price_jod : product.original_price_usd;
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const isLowStock = product.stock_count > 0 && product.stock_count <= 10;
  const isOutOfStock = product.stock_count === 0;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-card border-b border-border">
        <div className="section-container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">الرئيسية</Link>
            <ChevronLeft className="h-4 w-4" />
            <Link to="/products" className="hover:text-foreground">المنتجات</Link>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-card border border-border">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {discount > 0 && (
                  <Badge className="bg-destructive">-{discount}%</Badge>
                )}
                {product.is_featured && (
                  <Badge className="bg-accent">
                    <Zap className="h-3 w-3 ml-1" />
                    مميز
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">{product.category_name}</Badge>
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                {product.region}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="font-heading text-2xl md:text-3xl font-bold">
              {product.name}
            </h1>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="font-bold mr-2 ltr-nums">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">
                  ({product.review_count} تقييم)
                </span>
                <span className="text-muted-foreground">
                  • {product.sold_count} مبيع
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary ltr-nums">
                {formatPrice(price, currency)}
              </span>
              {originalPrice && (
                <span className="text-xl text-muted-foreground line-through ltr-nums">
                  {formatPrice(originalPrice, currency)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <Badge variant="destructive">نفذت الكمية</Badge>
              ) : isLowStock ? (
                <Badge className="bg-orange-500">متبقي {product.stock_count} فقط</Badge>
              ) : (
                <Badge className="bg-green-500">
                  <Check className="h-3 w-3 ml-1" />
                  متوفر ({product.stock_count})
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-4 py-4 border-y border-border">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-5 w-5 text-accent" />
                <span>توصيل فوري</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-5 w-5 text-green-500" />
                <span>مضمون 100%</span>
              </div>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">الكمية:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-bold ltr-nums">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock_count, quantity + 1))}
                    disabled={quantity >= product.stock_count}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  الإجمالي:{" "}
                  <span className="font-bold text-foreground ltr-nums">
                    {formatPrice(price * quantity, currency)}
                  </span>
                </span>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  data-testid="buy-now-button"
                >
                  اشتري الآن
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  data-testid="add-to-cart-button"
                >
                  <ShoppingCart className="h-5 w-5" />
                  أضف للسلة
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mt-12">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="description">الوصف</TabsTrigger>
            <TabsTrigger value="reviews">
              التقييمات ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="how-to-use">كيفية الاستخدام</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
              <h4 className="font-heading font-bold mt-6 mb-3">المميزات:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>• كود أصلي ومضمون 100%</li>
                <li>• توصيل فوري بعد الدفع</li>
                <li>• منطقة: {product.region}</li>
                <li>• منصة: {product.category_name}</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="font-bold text-primary">
                            {review.user_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.user_name}</span>
                            {review.is_verified && (
                              <Badge variant="outline" className="text-xs">
                                <Check className="h-3 w-3 ml-1" />
                                مشتري موثق
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد تقييمات بعد
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="how-to-use" className="mt-6">
            <div className="prose prose-invert max-w-none">
              <h4 className="font-heading font-bold mb-4">كيفية استخدام الكود:</h4>
              <ol className="space-y-3 text-muted-foreground">
                <li>1. قم بشراء الكود وإتمام عملية الدفع</li>
                <li>2. اذهب إلى صفحة "طلباتي" واضغط على "كشف الكود"</li>
                <li>3. انسخ الكود واحفظه في مكان آمن</li>
                <li>4. افتح متجر {product.category_name} على جهازك</li>
                <li>5. اذهب إلى "استرداد الكود" أو "Redeem Code"</li>
                <li>6. أدخل الكود واستمتع!</li>
              </ol>
              <div className="mt-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <p className="text-destructive text-sm">
                  <strong>تنبيه:</strong> بعد كشف الكود، لا يمكن استرداد المبلغ.
                  تأكد من المنطقة والمنصة قبل الشراء.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
