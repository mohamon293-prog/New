import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "../ui/sheet";
import {
  Menu,
  ShoppingCart,
  User,
  Wallet,
  Package,
  Settings,
  LogOut,
  Moon,
  Sun,
  Search,
  Gamepad2,
  Bell,
  Home,
  ChevronLeft,
  X,
} from "lucide-react";
import { API_URL, getAuthHeader } from "../../lib/utils";

export const Header = () => {
  const { user, logout, isAdmin, token } = useAuth();
  const { getItemCount, currency, toggleCurrency } = useCart();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (token) {
      fetchUnreadCount();
    }
  }, [token]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/count`, {
        headers: getAuthHeader(),
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications?unread_only=false`, {
        headers: getAuthHeader(),
      });
      setNotifications(response.data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API_URL}/notifications/read-all`, {}, {
        headers: getAuthHeader(),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
    }
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove("dark");
      html.classList.add("light");
    } else {
      html.classList.remove("light");
      html.classList.add("dark");
    }
    setIsDark(!isDark);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: "/products", label: "المنتجات" },
    { href: "/products?platform=playstation", label: "بلايستيشن" },
    { href: "/products?platform=xbox", label: "إكس بوكس" },
    { href: "/products?platform=steam", label: "ستيم" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex h-14 md:h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 font-heading text-xl md:text-2xl font-black flex-shrink-0"
              data-testid="logo-link"
            >
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary">
                <Gamepad2 className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
              <span className="bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
                قيملو
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Search Bar */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex items-center flex-1 max-w-md mx-6"
            >
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pr-10 pl-4 rounded-lg border border-input bg-secondary/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="search-input"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Mobile Search Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Currency Toggle - Desktop */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCurrency}
                className="hidden sm:flex text-xs font-bold h-9 px-3"
                data-testid="currency-toggle"
              >
                {currency === "JOD" ? "د.أ" : "$"}
              </Button>

              {/* Theme Toggle - Desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hidden sm:flex h-9 w-9"
                data-testid="theme-toggle"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Notifications */}
              {user && (
                <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-9 w-9"
                      data-testid="notifications-button"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 md:w-80">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium text-sm">الإشعارات</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-primary hover:underline"
                        >
                          تحديد الكل كمقروء
                        </button>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <DropdownMenuItem key={notif.id} className="flex-col items-start py-2.5 px-3">
                            <span className={`text-sm ${notif.is_read ? "text-muted-foreground" : "font-medium"}`}>
                              {notif.title}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notif.message}
                            </span>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          لا توجد إشعارات
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Cart */}
              <Link to="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  data-testid="cart-button"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {getItemCount() > 0 && (
                    <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {getItemCount()}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu - Desktop */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden sm:flex h-9 w-9"
                      data-testid="user-menu-trigger"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/wallet" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        المحفظة
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        طلباتي
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        الإعدادات
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2 text-primary">
                            <Settings className="h-4 w-4" />
                            لوحة التحكم
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="h-4 w-4 ml-2" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="h-9" data-testid="login-button">
                      دخول
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="h-9" data-testid="register-button">
                      حساب جديد
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden h-9 w-9"
                    data-testid="mobile-menu-trigger"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-border">
                      <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                          <Gamepad2 className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-heading text-xl font-black">قيملو</span>
                      </Link>
                    </div>

                    {/* User Info (if logged in) */}
                    {user && (
                      <div className="p-4 border-b border-border bg-secondary/30">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    )}

                    {/* Nav Links */}
                    <nav className="flex-1 overflow-y-auto p-2">
                      <div className="space-y-1">
                        <Link
                          to="/"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Home className="h-5 w-5 text-muted-foreground" />
                          الرئيسية
                        </Link>
                        {navLinks.map((link) => (
                          <Link
                            key={link.href}
                            to={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <span>{link.label}</span>
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>

                      {user && (
                        <>
                          <div className="h-px bg-border my-3" />
                          <div className="space-y-1">
                            <Link
                              to="/wallet"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                            >
                              <Wallet className="h-5 w-5 text-muted-foreground" />
                              المحفظة
                            </Link>
                            <Link
                              to="/orders"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                            >
                              <Package className="h-5 w-5 text-muted-foreground" />
                              طلباتي
                            </Link>
                            <Link
                              to="/profile"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                            >
                              <User className="h-5 w-5 text-muted-foreground" />
                              حسابي
                            </Link>
                            {isAdmin && (
                              <Link
                                to="/admin"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors text-primary"
                              >
                                <Settings className="h-5 w-5" />
                                لوحة التحكم
                              </Link>
                            )}
                          </div>
                        </>
                      )}
                    </nav>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-border space-y-3">
                      {/* Settings Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button variant="outline" size="sm" onClick={toggleCurrency} className="h-9 px-3">
                            {currency === "JOD" ? "د.أ" : "$"}
                          </Button>
                          <Button variant="outline" size="icon" onClick={toggleTheme} className="h-9 w-9">
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Auth Buttons */}
                      {!user ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full h-11">
                              تسجيل الدخول
                            </Button>
                          </Link>
                          <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full h-11">إنشاء حساب</Button>
                          </Link>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 ml-2" />
                          تسجيل الخروج
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile Search Bar (expandable) */}
          {searchOpen && (
            <div className="lg:hidden pb-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pr-10 pl-10 rounded-lg border border-input bg-secondary/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
