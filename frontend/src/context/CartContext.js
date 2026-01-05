import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem("currency");
    return saved || "JOD";
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      // For account products, always add as new item (don't merge)
      const isAccountProduct = product.product_type && product.product_type !== "digital_code";
      
      if (!isAccountProduct) {
        const existing = prev.find((item) => 
          item.id === product.id && 
          (!product.selectedVariant || item.selectedVariant?.id === product.selectedVariant?.id)
        );
        if (existing) {
          return prev.map((item) =>
            item.id === product.id && 
            (!product.selectedVariant || item.selectedVariant?.id === product.selectedVariant?.id)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
      }
      
      // Add new item with unique cart ID
      const cartItem = {
        ...product,
        quantity,
        cartId: `${product.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      return [...prev, cartItem];
    });
  };

  const removeItem = (cartId) => {
    setItems((prev) => prev.filter((item) => (item.cartId || item.id) !== cartId));
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity <= 0) {
      removeItem(cartId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        (item.cartId || item.id) === cartId ? { ...item, quantity } : item
      )
    );
  };

  const updateAccountInfo = (cartId, accountInfo) => {
    setItems((prev) =>
      prev.map((item) =>
        (item.cartId || item.id) === cartId ? { ...item, accountInfo } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      // Use variant price if selected
      let price;
      if (item.selectedVariant) {
        price = currency === "JOD" ? item.selectedVariant.price_jod : item.selectedVariant.price_usd;
      } else {
        price = currency === "JOD" ? item.price_jod : item.price_usd;
      }
      return total + price * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === "JOD" ? "USD" : "JOD"));
  };

  // Validate cart items (check if account products have required info)
  const validateCart = () => {
    for (const item of items) {
      if (item.product_type && item.product_type !== "digital_code") {
        const info = item.accountInfo || {};
        if (item.product_type === "existing_account") {
          if (!info.email || !info.password) {
            return { valid: false, error: `يرجى إدخال بيانات الحساب لـ "${item.name}"` };
          }
        } else if (item.product_type === "new_account") {
          if (!info.phone && !info.email) {
            return { valid: false, error: `يرجى إدخال رقم الهاتف أو البريد لـ "${item.name}"` };
          }
        }
      }
    }
    return { valid: true };
  };

  const value = {
    items,
    currency,
    addItem,
    removeItem,
    updateQuantity,
    updateAccountInfo,
    clearCart,
    getTotal,
    getItemCount,
    toggleCurrency,
    setCurrency,
    validateCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
