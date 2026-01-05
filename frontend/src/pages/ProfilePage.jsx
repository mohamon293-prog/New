import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Wallet,
  Package,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { formatDate } from "../lib/utils";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const menuItems = [
    {
      icon: Wallet,
      label: "المحفظة",
      href: "/wallet",
      description: "إدارة رصيدك",
    },
    {
      icon: Package,
      label: "طلباتي",
      href: "/orders",
      description: "عرض الطلبات السابقة",
    },
    {
      icon: Settings,
      label: "الإعدادات",
      href: "/settings",
      description: "إعدادات الحساب",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="section-container py-6">
          <h1 className="font-heading text-2xl md:text-3xl font-bold">
            حسابي
          </h1>
        </div>
      </div>

      <div className="section-container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              {/* Avatar */}
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {user.name.charAt(0)}
                </span>
              </div>

              {/* Name & Role */}
              <h2 className="font-heading text-xl font-bold">{user.name}</h2>
              <Badge variant="outline" className="mt-2">
                {user.role === "admin"
                  ? "مدير"
                  : user.role === "employee"
                  ? "موظف"
                  : "مشتري"}
              </Badge>

              {/* Info */}
              <div className="mt-6 space-y-3 text-right">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground ltr-nums">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground ltr-nums">{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    عضو منذ {formatDate(user.created_at)}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <Button
                variant="outline"
                className="w-full mt-6 text-destructive hover:text-destructive"
                onClick={logout}
              >
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* Menu & Content */}
          <div className="lg:col-span-2 space-y-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}

            {/* Security Notice */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">حسابك آمن</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    نحمي بياناتك بأحدث تقنيات التشفير
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
