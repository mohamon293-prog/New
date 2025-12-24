import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { featuredProducts, categories } from "../data/mockData";
import { ProductCard } from "../components/products/ProductCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet";
import { Skeleton } from "../components/ui/skeleton";
import { Search, SlidersHorizontal, X, ChevronLeft } from "lucide-react";
import { API_URL } from "../lib/utils";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const platform = searchParams.get("platform") || "";
  const category = searchParams.get("category") || "";
  const featured = searchParams.get("featured") === "true";
  const sortBy = searchParams.get("sort") || "popular";

  useEffect(() => {
    fetchProducts();
  }, [platform, category, featured, searchParams.get("search")]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (platform) params.append("platform", platform);
      if (category) params.append("category", category);
      if (featured) params.append("featured", "true");
      if (searchParams.get("search")) params.append("search", searchParams.get("search"));

      const response = await axios.get(`${API_URL}/products?${params.toString()}`);
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      let filtered = [...featuredProducts];
      
      if (platform) {
        filtered = filtered.filter((p) => p.platform === platform);
      }
      if (searchParams.get("search")) {
        const query = searchParams.get("search").toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.name_en.toLowerCase().includes(query)
        );
      }
      if (featured) {
        filtered = filtered.filter((p) => p.is_featured);
      }
      
      setProducts(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchParams.set("search", searchQuery);
    } else {
      searchParams.delete("search");
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (value) => {
    searchParams.set("sort", value);
    setSearchParams(searchParams);
    
    let sorted = [...products];
    switch (value) {
      case "price_low":
        sorted.sort((a, b) => a.price_jod - b.price_jod);
        break;
      case "price_high":
        sorted.sort((a, b) => b.price_jod - a.price_jod);
        break;
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        sorted.sort((a, b) => b.sold_count - a.sold_count);
    }
    setProducts(sorted);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchQuery("");
    setFiltersOpen(false);
  };

  const selectCategory = (slug) => {
    if (slug) {
      searchParams.set("platform", slug);
    } else {
      searchParams.delete("platform");
    }
    setSearchParams(searchParams);
    setFiltersOpen(false);
  };

  const activeCategory = categories.find((c) => c.slug === platform);
  const hasFilters = platform || searchParams.get("search") || featured;

  // Filters Component (shared between mobile sheet and desktop sidebar)
  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <h3 className="font-heading font-bold text-sm">البحث</h3>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-11"
            data-testid="products-search-input"
          />
        </form>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <h3 className="font-heading font-bold text-sm">الفئات</h3>
        <div className="space-y-1">
          <button
            onClick={() => selectCategory("")}
            className={`w-full text-right px-3 py-2.5 rounded-lg text-sm transition-colors ${
              !platform
                ? "bg-primary text-primary-foreground"
                : "hover:bg-secondary"
            }`}
            data-testid="filter-all"
          >
            جميع الفئات
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.slug)}
              className={`w-full text-right px-3 py-2.5 rounded-lg text-sm transition-colors ${
                platform === cat.slug
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
              data-testid={`filter-${cat.slug}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
          data-testid="clear-filters"
        >
          <X className="h-4 w-4 ml-2" />
          مسح الفلاتر
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="px-4 py-5 md:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
              <Link to="/" className="hover:text-foreground">الرئيسية</Link>
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-foreground">
                {activeCategory ? activeCategory.name : "المنتجات"}
              </span>
            </nav>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold">
                  {activeCategory ? activeCategory.name : "جميع المنتجات"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeCategory ? activeCategory.description : `${products.length} منتج متوفر`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-4 py-6 md:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Mobile: Search & Filter Bar */}
          <div className="flex gap-2 mb-4 lg:hidden">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-11"
              />
            </form>
            
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 flex-shrink-0">
                  <SlidersHorizontal className="h-5 w-5" />
                  {hasFilters && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                      !
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>الفلاتر</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FiltersContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex gap-6 lg:gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <FiltersContent />
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
                <p className="text-sm text-muted-foreground">
                  {loading ? "جاري التحميل..." : `${products.length} منتج`}
                </p>
                
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[140px] sm:w-[160px] h-10" data-testid="sort-select">
                    <SelectValue placeholder="ترتيب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">الأكثر مبيعاً</SelectItem>
                    <SelectItem value="rating">التقييم</SelectItem>
                    <SelectItem value="price_low">السعر: الأقل</SelectItem>
                    <SelectItem value="price_high">السعر: الأعلى</SelectItem>
                    <SelectItem value="newest">الأحدث</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Products */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="text-5xl md:text-6xl mb-4">🎮</div>
                  <h3 className="font-heading text-lg md:text-xl font-bold mb-2">
                    لا توجد منتجات
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-6">
                    جرب تغيير معايير البحث أو الفلاتر
                  </p>
                  <Button onClick={clearFilters}>مسح الفلاتر</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
