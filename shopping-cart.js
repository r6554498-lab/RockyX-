/* =========================================
   ROCKYX SHOPPING CART
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_cart";
  const DEFAULT_CURRENCY = "GHS";

  function readCart() {
    try {
      const cart = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));

    window.dispatchEvent(
      new CustomEvent("rockyx:cart-updated", {
        detail: {
          itemCount: getItemCount(),
          subtotal: getSubtotal()
        }
      })
    );

    return cart;
  }

  function getProduct(productId) {
    if (
      !window.RockyXMarketplace ||
      typeof window.RockyXMarketplace.getProduct !== "function"
    ) {
      return null;
    }

    return window.RockyXMarketplace.getProduct(productId);
  }

  function addItem(productId, quantity) {
    const product = getProduct(productId);
    const amount = Number(quantity ?? 1);

    if (!product) {
      return {
        success: false,
        message: "Product not found."
      };
    }

    if (!Number.isInteger(amount) || amount < 1) {
      return {
        success: false,
        message: "Quantity must be a positive whole number."
      };
    }

    if (product.status !== "active") {
      return {
        success: false,
        message: "This product is not available."
      };
    }

    if (Number(product.stock) < 1) {
      return {
        success: false,
        message: "This product is out of stock."
      };
    }

    const cart = readCart();
    const existing = cart.find(
      item => item.productId === String(productId)
    );

    const currentQuantity = existing ? existing.quantity : 0;
    const newQuantity = currentQuantity + amount;

    if (newQuantity > Number(product.stock)) {
      return {
        success: false,
        message: "The requested quantity exceeds available stock."
      };
    }

    if (existing) {
      existing.quantity = newQuantity;
    } else {
      cart.push({
        productId: String(product.id),
        quantity: amount,
        addedAt: new Date().toISOString()
      });
    }

    saveCart(cart);

    return {
      success: true,
      cart: getCart()
    };
  }

  function updateQuantity(productId, quantity) {
    const amount = Number(quantity);

    if (!Number.isInteger(amount) || amount < 0) {
      return {
        success: false,
        message: "Quantity must be zero or a positive whole number."
      };
    }

    const cart = readCart();
    const item = cart.find(
      entry => entry.productId === String(productId)
    );

    if (!item) {
      return {
        success: false,
        message: "Item not found in cart."
      };
    }

    if (amount === 0) {
      return removeItem(productId);
    }

    const product = getProduct(productId);

    if (!product || amount > Number(product.stock)) {
      return {
        success: false,
        message: "The requested quantity is unavailable."
      };
    }

    item.quantity = amount;
    saveCart(cart);

    return {
      success: true,
      cart: getCart()
    };
  }

  function removeItem(productId) {
    const cart = readCart();
    const updated = cart.filter(
      item => item.productId !== String(productId)
    );

    if (updated.length === cart.length) {
      return {
        success: false,
        message: "Item not found in cart."
      };
    }

    saveCart(updated);

    return {
      success: true,
      cart: getCart()
    };
  }

  function getCart() {
    const cart = readCart();

    return cart.map(item => {
      const product = getProduct(item.productId);

      return {
        productId: item.productId,
        quantity: item.quantity,
        addedAt: item.addedAt,
        product: product,
        available: Boolean(
          product &&
          product.status === "active" &&
          Number(product.stock) >= item.quantity
        ),
        lineTotal: product
          ? Number(product.price) * item.quantity
          : 0,
        currency: product
          ? product.currency || DEFAULT_CURRENCY
          : DEFAULT_CURRENCY
      };
    });
  }

  function getItemCount() {
    return readCart().reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  function getSubtotal() {
    return getCart().reduce(
      (total, item) => total + item.lineTotal,
      0
    );
  }

  function getSummary() {
    const items = getCart();

    const currencies = [
      ...new Set(items.map(item => item.currency))
    ];

    return {
      items: items,
      itemCount: getItemCount(),
      subtotal: getSubtotal(),
      currencies: currencies,
      requiresAttention: items.some(item => !item.available)
    };
  }

  function clearCart() {
    saveCart([]);
    return true;
  }

  function prepareCheckout() {
    const summary = getSummary();

    if (summary.items.length === 0) {
      return {
        success: false,
        message: "Your shopping cart is empty."
      };
    }

    if (summary.requiresAttention) {
      return {
        success: false,
        message: "Please review unavailable or out-of-stock items."
      };
    }

    if (summary.currencies.length > 1) {
      return {
        success: false,
        message: "Separate items by currency before checkout."
      };
    }

    return {
      success: true,
      currency: summary.currencies[0] || DEFAULT_CURRENCY,
      items: summary.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      subtotal: summary.subtotal,
      message: "Cart prepared. Secure checkout is not connected yet."
    };
  }

  window.RockyXShoppingCart = {
    addItem,
    updateQuantity,
    removeItem,
    getCart,
    getItemCount,
    getSubtotal,
    getSummary,
    clearCart,
    prepareCheckout
  };

  console.log("RockyX Shopping Cart loaded.");
})();