import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../lib/utils";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ShoppingCart, Star, Zap } from "lucide-react";
import { toast } from "sonner";

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

  const isLowStock = product.stock_count > 0 && product.stock_count <= 10;
  const isOutOfStock = product.stock_count === 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="product-card block"
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              -{discount}%
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="bg-accent text-accent-foreground">
              <Zap className="h-3 w-3 ml-1" />
              مميز
            </Badge>
          )}
        </div>

        {/* Stock Badge */}
        {isLowStock && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-orange-500 border-orange-500">
              متبقي {product.stock_count} فقط
            </Badge>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Badge className="bg-destructive text-lg px-4 py-2">نفذت الكمية</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category & Platform */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{product.category_name}</span>
          <span>•</span>
          <span>{product.region}</span>
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-foreground line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium ltr-nums">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.review_count} تقييم)
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary ltr-nums">
              {formatPrice(price, currency)}
            </span>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through ltr-nums">
                {formatPrice(originalPrice, currency)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart */}
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full gap-2"
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
