import React from "react";
import { Link } from "react-router-dom";
import { categories, featuredProducts, trustFeatures, stats } from "../data/mockData";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/utils";
import { ProductCard } from "../components/products/ProductCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ShieldCheck,
  Zap,
  Headphones,
  Tag,
  ChevronLeft,
  Star,
  ArrowLeft,
  Gamepad2,
  Gift,
  Monitor,
  Smartphone,
} from "lucide-react";

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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden mesh-gradient">
        <div className="section-container py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-6 animate-fade-in">
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                <Zap className="h-3 w-3 ml-1" />
                توصيل فوري خلال ثوانٍ
              </Badge>
              
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                أكواد ألعاب رقمية
                <span className="block bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                  بأفضل الأسعار
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                متجرك الموثوق لبطاقات PlayStation، Xbox، Steam، Nintendo وأكثر.
                آلاف العملاء السعداء في الأردن والشرق الأوسط.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <Button size="lg" className="gap-2 btn-primary">
                    تصفح المنتجات
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/how-to-buy">
                  <Button size="lg" variant="outline" className="gap-2">
                    كيفية الشراء
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary ltr-nums">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-square max-w-lg mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
                <img
                  src="https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&q=80"
                  alt="Gaming Setup"
                  className="relative rounded-3xl object-cover w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="border-y border-border bg-card/50">
        <div className="section-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustFeatures.map((feature, index) => {
              const Icon = iconMap[feature.icon];
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50"
                  data-testid={`trust-feature-${index}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
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
      </section>

      {/* Categories */}
      <section className="section-container section-padding">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold">تصفح حسب الفئة</h2>
            <p className="text-muted-foreground mt-1">اختر منصتك المفضلة</p>
          </div>
          <Link to="/products">
            <Button variant="ghost" className="gap-1">
              عرض الكل
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = platformIconMap[category.slug] || Gamepad2;
            return (
              <Link
                key={category.id}
                to={`/products?platform=${category.slug}`}
                className="group relative flex flex-col items-center p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-card/80 transition-all duration-300"
                data-testid={`category-${category.slug}`}
              >
                <div className="relative w-16 h-16 mb-4 rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
                  <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-heading font-bold text-sm text-center">{category.name}</h3>
                <p className="text-xs text-muted-foreground">{category.name_en}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-container section-padding">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold">منتجات مميزة</h2>
            <p className="text-muted-foreground mt-1">أكثر المنتجات مبيعاً</p>
          </div>
          <Link to="/products?featured=true">
            <Button variant="ghost" className="gap-1">
              عرض الكل
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {featuredProducts.slice(0, 5).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Why Gamelo */}
      <section className="bg-card border-y border-border">
        <div className="section-container section-padding">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading text-2xl md:text-3xl font-bold">لماذا قيملو؟</h2>
            <p className="text-muted-foreground mt-2">
              نلتزم بتوفير أفضل تجربة شراء لأكواد الألعاب الرقمية
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-2xl bg-secondary/30">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-bold">أمان مضمون</h3>
              <p className="text-muted-foreground">
                جميع الأكواد أصلية ومضمونة 100%. نحمي بياناتك ومعاملاتك بأعلى معايير الأمان.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-2xl bg-secondary/30">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-accent/10">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-heading text-xl font-bold">توصيل فوري</h3>
              <p className="text-muted-foreground">
                احصل على الكود فور إتمام الدفع. لا انتظار، لا تأخير - ابدأ اللعب فوراً.
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-2xl bg-secondary/30">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-green-500/10">
                <Headphones className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-heading text-xl font-bold">دعم متواصل</h3>
              <p className="text-muted-foreground">
                فريق دعم متخصص متواجد 24/7 للإجابة على استفساراتك ومساعدتك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-container section-padding">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-primary to-accent p-8 md:p-12 text-center">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="font-heading text-2xl md:text-4xl font-black text-white">
              جاهز للبدء؟
            </h2>
            <p className="text-white/80 text-lg">
              أنشئ حسابك الآن واحصل على خصم 10% على أول عملية شراء
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  إنشاء حساب مجاني
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
        </div>
      </section>
    </div>
  );
}
