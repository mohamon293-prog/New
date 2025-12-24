import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  UserPlus,
  Wallet,
  Search,
  ShoppingCart,
  CreditCard,
  Eye,
  Copy,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

export default function HowToBuyPage() {
  const steps = [
    {
      icon: UserPlus,
      title: "1. إنشاء حساب",
      description:
        "أنشئ حسابك مجاناً باستخدام بريدك الإلكتروني. العملية تستغرق أقل من دقيقة.",
    },
    {
      icon: Wallet,
      title: "2. شحن المحفظة",
      description:
        "تواصل معنا عبر واتساب لشحن محفظتك. نقبل الكاش، الحوالات البنكية، و CliQ.",
    },
    {
      icon: Search,
      title: "3. اختر المنتج",
      description:
        "تصفح الأقسام واختر المنتج المناسب. تأكد من المنطقة (Region) قبل الشراء.",
    },
    {
      icon: ShoppingCart,
      title: "4. أضف للسلة",
      description:
        "أضف المنتج لسلة التسوق. يمكنك شراء عدة منتجات في طلب واحد.",
    },
    {
      icon: CreditCard,
      title: "5. أتمم الشراء",
      description:
        "راجع طلبك واضغط 'إتمام الشراء'. سيتم خصم المبلغ من رصيد محفظتك.",
    },
    {
      icon: Eye,
      title: "6. اكشف الكود",
      description:
        "اذهب لصفحة 'طلباتي' واضغط 'كشف الكود'. تأكد من جاهزيتك قبل الكشف!",
    },
    {
      icon: Copy,
      title: "7. انسخ الكود",
      description:
        "انسخ الكود واحفظه في مكان آمن. لا تشاركه مع أي شخص.",
    },
    {
      icon: CheckCircle,
      title: "8. استمتع!",
      description:
        "أدخل الكود في منصتك (PlayStation, Xbox, Steam...) واستمتع بمشترياتك!",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-card border-b border-border">
        <div className="section-container py-8">
          <h1 className="font-heading text-3xl font-bold">كيفية الشراء</h1>
          <p className="text-muted-foreground mt-2">
            دليل خطوة بخطوة للشراء من قيملو
          </p>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Important Notes */}
          <div className="mt-12 p-6 rounded-2xl bg-secondary/50 border border-border">
            <h3 className="font-heading text-lg font-bold mb-4">
              ملاحظات هامة
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive">•</span>
                <span>
                  بعد كشف الكود، لا يمكن استرداد المبلغ. تأكد من جاهزيتك!
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>
                  تأكد من اختيار المنطقة (Region) الصحيحة لحسابك.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>
                  احفظ الكود في مكان آمن فور كشفه.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span>
                  في حالة أي مشكلة، تواصل معنا فوراً عبر واتساب.
                </span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <h3 className="font-heading text-xl font-bold mb-4">
              جاهز للبدء؟
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  إنشاء حساب
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="outline">
                  تصفح المنتجات
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
