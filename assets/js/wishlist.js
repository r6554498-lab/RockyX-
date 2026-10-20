/* =========================================
   ROCKYX WISHLIST
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_wishlist";

  function readWishlists() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );

      return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
    } catch (error) {
      return {};
    }
  }

  function saveWishlists(wishlists) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(wishlists)
    );

    window.dispatchEvent(
      new CustomEvent("rockyx:wishlist-updated")
    );

    return wishlists;
  }

  function getUserId(userId) {
    const id = String(userId || "").trim();

    if (!id) {
      throw new Error("A user ID is required.");
    }

    return id;
  }

  function getUserWishlist(userId) {
    const id = getUserId(userId);
    const wishlists = readWishlists();

    return Array.isArray(wishlists[id])
      ? wishlists[id]
      : [];
  }

  function addItem(userId, productId) {
    const id = getUserId(userId);
    const productKey = String(productId || "").trim();

    if (!productKey) {
      return {
        success: false,
        message: "A product ID is required."
      };
    }

    if (
      !window.RockyXMarketplace ||
      typeof window.RockyXMarketplace.getProduct !== "function"
    ) {
      return {
        success: false,
        message: "Marketplace products are not available."
      };
    }

    const product =
      window.RockyXMarketplace.getProduct(productKey);

    if (!product) {
      return {
        success: false,
        message: "Product not found."
      };
    }

    const wishlists = readWishlists();
    const wishlist = Array.isArray(wishlists[id])
      ? wishlists[id]
      : [];

    if (wishlist.includes(productKey)) {
      return {
        success: false,
        message: "This product is already in your wishlist."
      };
    }

    wishlist.unshift(productKey);
    wishlists[id] = wishlist;

    saveWishlists(wishlists);

    return {
      success: true,
      productId: productKey,
      message: "Product added to your wishlist."
    };
  }

  function removeItem(userId, productId) {
    const id = getUserId(userId);
    const productKey = String(productId || "");

    const wishlists = readWishlists();
    const wishlist = Array.isArray(wishlists[id])
      ? wishlists[id]
      : [];

    if (!wishlist.includes(productKey)) {
      return {
        success: false,
        message: "Product not found in your wishlist."
      };
    }

    wishlists[id] = wishlist.filter(
      item => item !== productKey
    );

    saveWishlists(wishlists);

    return {
      success: true,
      message: "Product removed from your wishlist."
    };
  }

  function getItems(userId) {
    const productIds = getUserWishlist(userId);

    if (
      !window.RockyXMarketplace ||
      typeof window.RockyXMarketplace.getProduct !== "function"
    ) {
      return [];
    }

    return productIds
      .map(productId =>
        window.RockyXMarketplace.getProduct(productId)
      )
      .filter(Boolean);
  }

  function contains(userId, productId) {
    return getUserWishlist(userId).includes(
      String(productId)
    );
  }

  function clear(userId) {
    const id = getUserId(userId);
    const wishlists = readWishlists();

    wishlists[id] = [];
    saveWishlists(wishlists);

    return {
      success: true,
      message: "Wishlist cleared."
    };
  }

  function getCount(userId) {
    return getUserWishlist(userId).length;
  }

  function moveToCart(userId, productId, quantity) {
    const id = getUserId(userId);

    if (!contains(id, productId)) {
      return {
        success: false,
        message: "Product is not in your wishlist."
      };
    }

    if (
      !window.RockyXShoppingCart ||
      typeof window.RockyXShoppingCart.addItem !== "function"
    ) {
      return {
        success: false,
        message: "Shopping cart is not available."
      };
    }

    const result = window.RockyXShoppingCart.addItem(
      productId,
      quantity || 1
    );

    if (!result.success) {
      return result;
    }

    return {
      success: true,
      message: "Product added to your shopping cart."
    };
  }

  window.RockyXWishlist = {
    addItem,
    removeItem,
    getItems,
    getUserWishlist,
    contains,
    clear,
    getCount,
    moveToCart
  };

  console.log("RockyX Wishlist loaded.");
})();