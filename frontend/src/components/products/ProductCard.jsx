import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatPrice, API_URL } from "../../lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingCart, Star, Zap } from "lucide-react";
import { toast } from "sonner";

// Helper to get the correct image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return "/placeholder-product.png";
  if (imageUrl.startsWith("/uploads/")) {
    // Use API endpoint for uploaded files
    return `${API_URL}${imageUrl}`;
  }
  if (imageUrl.startsWith("/")) {
    return `${API_URL.replace("/api", "")}${imageUrl}`;
  }
  return imageUrl;
};

export const ProductCard = ({ product }) => {
  const { addItem, currency } = useCart();

  const price = currency === "JOD" ? product.price_jod : product.price_usd;
  const originalPrice =
    currency === "JOD" ? product.original_price_jod : product.original_price_usd;

  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success("تمت الإضافة للسلة", {
      description: product.name,
    });
  };

  const productType = product.product_type || "digital_code";
  const isLowStock = product.stock_count > 0 && product.stock_count <= 10;
  // For account types, stock doesn't matter - they are fulfilled manually
  const isOutOfStock = productType === "digital_code" && product.stock_count === 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98]"
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.target.src = "/placeholder-product.png"; }}
        />
        
        {/* Badges - Top */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5">
              -{discount}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="bg-accent text-accent-foreground text-xs px-2 py-0.5">
              <Zap className="h-3 w-3 ml-0.5" />
              مميز
            </Badge>
          )}
        </div>

        {/* Stock Badge - Bottom */}
        {isLowStock && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm text-orange-500 border-orange-500/50 text-xs">
              متبقي {product.stock_count}
            </Badge>
          </div>
        )}
        
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Badge className="bg-destructive text-sm px-3 py-1.5">نفذت الكمية</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Category */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{product.category_name}</span>
          <span>•</span>
          <span className="truncate">{product.region}</span>
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-sm sm:text-base text-foreground line-clamp-2 min-h-[2.25rem] sm:min-h-[2.5rem] leading-tight">
          {product.name}
        </h3>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs sm:text-sm font-medium ltr-nums">{product.rating}</span>
            <span className="text-xs text-muted-foreground">
              ({product.review_count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-base sm:text-lg font-bold text-primary ltr-nums">
            {formatPrice(price, currency)}
          </span>
          {originalPrice && (
            <span className="text-xs sm:text-sm text-muted-foreground line-through ltr-nums">
              {formatPrice(originalPrice, currency)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full gap-2 h-9 sm:h-10 text-sm"
          size="sm"
          data-testid={`add-to-cart-${product.id}`}
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? "نفذت الكمية" : "أضف للسلة"}
        </Button>
      </div>
    </Link>
  );
};

export default ProductCard;
