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
import { Skeleton } from "../components/ui/skeleton";
import { Search, Filter, Grid, List, SlidersHorizontal } from "lucide-react";
import { API_URL } from "../lib/utils";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [viewMode, setViewMode] = useState("grid");

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
      // Use mock data as fallback
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
    
    // Sort products locally
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
  };

  const activeCategory = categories.find((c) => c.slug === platform);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="section-container py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">
                {activeCategory ? activeCategory.name : "جميع المنتجات"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeCategory
                  ? activeCategory.description
                  : "تصفح مجموعتنا الكاملة من أكواد الألعاب"}
              </p>
            </div>
            
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                الرئيسية
              </Link>
              <span>/</span>
              <span className="text-foreground">
                {activeCategory ? activeCategory.name : "المنتجات"}
              </span>
            </nav>
          </div>
        </div>
      </section>

      <div className="section-container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
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
                    className="pr-10"
                    data-testid="products-search-input"
                  />
                </form>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-sm">الفئات</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      searchParams.delete("platform");
                      setSearchParams(searchParams);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
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
                      onClick={() => {
                        searchParams.set("platform", cat.slug);
                        setSearchParams(searchParams);
                      }}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
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
              {(platform || searchParams.get("search") || featured) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                  data-testid="clear-filters"
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-sm text-muted-foreground">
                عرض {products.length} منتج
              </p>
              
              <div className="flex items-center gap-3">
                {/* Sort */}
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-40" data-testid="sort-select">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">الأكثر مبيعاً</SelectItem>
                    <SelectItem value="rating">التقييم</SelectItem>
                    <SelectItem value="price_low">السعر: الأقل</SelectItem>
                    <SelectItem value="price_high">السعر: الأعلى</SelectItem>
                    <SelectItem value="newest">الأحدث</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="hidden sm:flex items-center border border-border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[4/3] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                    : "space-y-4"
                }
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎮</div>
                <h3 className="font-heading text-xl font-bold mb-2">
                  لا توجد منتجات
                </h3>
                <p className="text-muted-foreground mb-6">
                  جرب تغيير معايير البحث أو الفلاتر
                </p>
                <Button onClick={clearFilters}>مسح الفلاتر</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
