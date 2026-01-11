import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { ProductCard } from "../components/products/ProductCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { API_URL } from "../lib/utils";
import {
  ShieldCheck,
  Zap,
  Headphones,
  Tag,
  ChevronLeft,
  ArrowLeft,
  Gamepad2,
  Gift,
  Monitor,
  Smartphone,
  Star,
} from "lucide-react";

const trustFeatures = [
  { icon: "shield-check", title: "دفع آمن", description: "معاملات مشفرة 100%" },
  { icon: "zap", title: "توصيل فوري", description: "احصل على الكود فوراً" },
  { icon: "headphones", title: "دعم 24/7", description: "فريق دعم متاح دائماً" },
  { icon: "tag", title: "أفضل الأسعار", description: "أسعار تنافسية مضمونة" },
];

const iconMap = {
  "shield-check": ShieldCheck,
  zap: Zap,
  headphones: Headphones,
  tag: Tag,
};

const platformIconMap = {
  playstation: Gamepad2,
  xbox: Gamepad2,
  steam: Monitor,
  nintendo: Gamepad2,
  giftcards: Gift,
  mobile: Smartphone,
};

export default function HomePage() {
  const { currency } = useCart();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [stats, setStats] = useState([
    { value: "10,000+", label: "عميل سعيد" },
    { value: "50,000+", label: "طلب مكتمل" },
    { value: "24/7", label: "دعم فني" },
    { value: "100%", label: "رضا العملاء" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const catResponse = await axios.get(`${API_URL}/categories`);
      setCategories(Array.isArray(catResponse.data) ? catResponse.data : []);

      // Fetch featured products
      const prodResponse = await axios.get(`${API_URL}/products?featured=true&limit=8`);
      setFeaturedProducts(Array.isArray(prodResponse.data) ? prodResponse.data : []);
      
      // Try to fetch stats
      try {
        const statsResponse = await axios.get(`${API_URL}/stats/public`);
        if (statsResponse.data) {
          setStats([
            { value: `${statsResponse.data.total_users || 100}+`, label: "عميل سعيد" },
            { value: `${statsResponse.data.total_orders || 50}+`, label: "طلب مكتمل" },
            { value: "24/7", label: "دعم فني" },
            { value: "100%", label: "رضا العملاء" },
          ]);
        }
      } catch (e) {
        // Use default stats
      }
    } catch (error) {
      console.error("Failed to fetch homepage data:", error);
      setCategories([]);
      setFeaturedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="px-4 py-10 md:py-16 lg:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Hero Content */}
              <div className="space-y-5 text-center lg:text-right animate-fade-in">
                <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 inline-flex">
                  <Zap className="h-3 w-3 ml-1" />
                  توصيل فوري خلال ثوانٍ
                </Badge>
                
                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                  أكواد ألعاب رقمية
                  <span className="block bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent mt-2">
                    بأفضل الأسعار
                  </span>
                </h1>
                
                <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  متجرك الموثوق لبطاقات PlayStation، Xbox، Steam، Nintendo وأكثر.
                  آلاف العملاء السعداء في الأردن والشرق الأوسط.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link to="/products" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto gap-2 h-12 px-8 text-base">
                      تصفح المنتجات
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/how-to-buy" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 h-12 px-8 text-base">
                      كيفية الشراء
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Stats - Mobile Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
                {stats.map((stat, index) => (
                  <div key={index} className="p-4 rounded-xl bg-card/50 backdrop-blur border border-border text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary ltr-nums">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Hero Image - Desktop Only */}
              <div className="relative hidden lg:block">
                <div className="relative aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
                  <img
                    src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80"
                    alt="Gaming Setup"
                    className="relative rounded-3xl object-cover w-full h-full"
                  />
                </div>
                
                {/* Desktop Stats */}
                <div className="absolute -bottom-8 left-0 right-0 grid grid-cols-4 gap-4 p-4 rounded-2xl bg-card/90 backdrop-blur border border-border">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg font-bold text-primary ltr-nums">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="border-y border-border bg-card/50">
        <div className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible">
              {trustFeatures.map((feature, index) => {
                const Icon = iconMap[feature.icon];
                return (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[200px] md:w-auto flex items-center gap-3 p-4 rounded-xl bg-secondary/50"
                    data-testid={`trust-feature-${index}`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="px-4 py-10 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold">تصفح حسب الفئة</h2>
              <p className="text-sm text-muted-foreground mt-1">اختر منصتك المفضلة</p>
            </div>
            <Link to="/products" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="gap-1">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
              {categories.map((category) => {
                const Icon = platformIconMap[category.slug || category.id] || Gamepad2;
                return (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className="group flex flex-col items-center p-3 sm:p-4 md:p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all duration-300"
                    data-testid={`category-${category.slug || category.id}`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mb-2 md:mb-4 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-center leading-tight">{category.name}</h3>
                  </Link>
                );
              })}
            </div>
          )}

          <Link to="/products" className="block sm:hidden mt-4">
            <Button variant="outline" className="w-full">عرض جميع الفئات</Button>
          </Link>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="px-4 py-10 md:py-16 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold">منتجات مميزة</h2>
              <p className="text-sm text-muted-foreground mt-1">أكثر المنتجات مبيعاً</p>
            </div>
            <Link to="/products" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="gap-1">
                عرض الكل
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible scrollbar-hide">
              {featuredProducts.slice(0, 10).map((product) => (
                <div key={product.id} className="flex-shrink-0 w-[180px] sm:w-[220px] md:w-auto">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>لا توجد منتجات مميزة حالياً</p>
              <Link to="/products" className="mt-4 inline-block">
                <Button>تصفح جميع المنتجات</Button>
              </Link>
            </div>
          )}

          <Link to="/products" className="block sm:hidden mt-4">
            <Button variant="outline" className="w-full">عرض جميع المنتجات</Button>
          </Link>
        </div>
      </section>

      {/* Why Gamelo Section */}
      <section className="bg-card border-y border-border">
        <div className="px-4 py-10 md:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
              <h2 className="font-heading text-xl md:text-2xl lg:text-3xl font-bold">لماذا قيملو؟</h2>
              <p className="text-sm md:text-base text-muted-foreground mt-2">
                نلتزم بتوفير أفضل تجربة شراء لأكواد الألعاب الرقمية
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
              <div className="text-center space-y-3 p-5 md:p-6 rounded-2xl bg-secondary/30">
                <div className="flex h-14 w-14 md:h-16 md:w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10">
                  <ShieldCheck className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg md:text-xl font-bold">أمان مضمون</h3>
                <p className="text-sm text-muted-foreground">
                  جميع الأكواد أصلية ومضمونة 100%. نحمي بياناتك بأعلى معايير الأمان.
                </p>
              </div>

              <div className="text-center space-y-3 p-5 md:p-6 rounded-2xl bg-secondary/30">
                <div className="flex h-14 w-14 md:h-16 md:w-16 mx-auto items-center justify-center rounded-2xl bg-accent/10">
                  <Zap className="h-7 w-7 md:h-8 md:w-8 text-accent" />
                </div>
                <h3 className="font-heading text-lg md:text-xl font-bold">توصيل فوري</h3>
                <p className="text-sm text-muted-foreground">
                  احصل على الكود فور إتمام الدفع. لا انتظار - ابدأ اللعب فوراً.
                </p>
              </div>

              <div className="text-center space-y-3 p-5 md:p-6 rounded-2xl bg-secondary/30 sm:col-span-2 md:col-span-1">
                <div className="flex h-14 w-14 md:h-16 md:w-16 mx-auto items-center justify-center rounded-2xl bg-green-500/10">
                  <Headphones className="h-7 w-7 md:h-8 md:w-8 text-green-500" />
                </div>
                <h3 className="font-heading text-lg md:text-xl font-bold">دعم متميز</h3>
                <p className="text-sm text-muted-foreground">
                  فريق دعم متاح على مدار الساعة لمساعدتك في أي استفسار.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
            انضم لآلاف العملاء السعداء
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            ابدأ التسوق الآن واستمتع بأفضل أسعار بطاقات الألعاب الرقمية مع توصيل فوري ودعم متميز
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="gap-2 h-12 px-8">
                تصفح المنتجات
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8">
                إنشاء حساب مجاني
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
