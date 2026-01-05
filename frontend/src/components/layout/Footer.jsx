import React from "react";
import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { href: "/products?platform=playstation", label: "بلايستيشن" },
      { href: "/products?platform=xbox", label: "إكس بوكس" },
      { href: "/products?platform=steam", label: "ستيم" },
      { href: "/products?platform=nintendo", label: "نينتندو" },
      { href: "/products?platform=giftcards", label: "بطاقات الهدايا" },
    ],
    support: [
      { href: "/how-to-buy", label: "كيفية الشراء" },
      { href: "/faq", label: "الأسئلة الشائعة" },
      { href: "/support", label: "الدعم الفني" },
      { href: "/contact", label: "تواصل معنا" },
    ],
    legal: [
      { href: "/terms", label: "الشروط والأحكام" },
      { href: "/privacy", label: "سياسة الخصوصية" },
      { href: "/refund", label: "سياسة الاسترداد" },
      { href: "/disclaimer", label: "إخلاء المسؤولية" },
    ],
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Gamepad2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-heading text-2xl font-black">قيملو</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              متجرك الموثوق لأكواد الألعاب الرقمية في الأردن والشرق الأوسط.
              توصيل فوري، أسعار تنافسية، ودعم 24/7.
            </p>
            <div className="flex gap-4">
              <span className="text-sm text-muted-foreground">تابعنا:</span>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-heading font-bold mb-4">تسوق</h4>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-heading font-bold mb-4">المساعدة</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-heading font-bold mb-4">قانوني</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} قيملو. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              العملات المقبولة:
            </span>
            <span className="text-sm font-medium">JOD</span>
            <span className="text-sm font-medium">USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
