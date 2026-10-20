/* =========================================
   ROCKYX SELLER DASHBOARD
   Local prototype
   ========================================= */

(function () {
  "use strict";

  function unavailable() {
    return [];
  }

  function getSellerProducts(sellerId) {
    if (
      !window.RockyXMarketplace ||
      typeof window.RockyXMarketplace.getProducts !== "function"
    ) {
      return unavailable();
    }

    return window.RockyXMarketplace.getProducts({
      sellerId: String(sellerId)
    });
  }

  function getSellerProfile(sellerId) {
    if (
      !window.RockyXSellerProfiles ||
      typeof window.RockyXSellerProfiles.getByOwner !== "function"
    ) {
      return null;
    }

    return window.RockyXSellerProfiles.getByOwner(sellerId);
  }

  function getSellerOrders(sellerId) {
    if (
      !window.RockyXOrders ||
      typeof window.RockyXOrders.getOrders !== "function"
    ) {
      return [];
    }

    // Orders are retrieved by customer ID in the current prototype.
    // Do not treat buyer order history as a seller's incoming orders.
    // A seller-specific order query will be added in the backend.
    return [];
  }

  function getInventorySummary(sellerId) {
    if (
      !window.RockyXInventory ||
      typeof window.RockyXInventory.getSummary !== "function"
    ) {
      return {
        productCount: 0,
        totalUnits: 0,
        lowStockCount: 0,
        outOfStockCount: 0
      };
    }

    return window.RockyXInventory.getSummary(sellerId);
  }

  function getSellerReviews(sellerId) {
    if (
      !window.RockyXReviews ||
      typeof window.RockyXReviews.getSellerRatingSummary !== "function"
    ) {
      return {
        sellerId: String(sellerId),
        reviewCount: 0,
        averageRating: 0
      };
    }

    return window.RockyXReviews.getSellerRatingSummary(sellerId);
  }

  function getSalesSummary(sellerId) {
    // There is no verified seller-sales ledger yet.
    // Never calculate real earnings from unverified browser data.
    return {
      sellerId: String(sellerId),
      totalSales: 0,
      completedOrders: 0,
      currency: "GHS",
      available: false,
      message: "Seller sales reporting requires a verified backend."
    };
  }

  function getDashboard(sellerId) {
    const id = String(sellerId || "").trim();

    if (!id) {
      return {
        success: false,
        message: "A seller account ID is required."
      };
    }

    const profile = getSellerProfile(id);
    const products = getSellerProducts(id);
    const inventory = getInventorySummary(id);
    const reviews = getSellerReviews(id);
    const sales = getSalesSummary(id);
    const orders = getSellerOrders(id);

    return {
      success: true,
      sellerId: id,
      profile: profile,
      overview: {
        productCount: products.length,
        activeProducts: products.filter(
          product => product.status === "active"
        ).length,
        outOfStockProducts: products.filter(
          product => Number(product.stock) <= 0
        ).length,
        lowStockCount: inventory.lowStockCount,
        totalInventoryUnits: inventory.totalUnits,
        reviewCount: reviews.reviewCount,
        averageRating: reviews.averageRating,
        incomingOrderCount: orders.length
      },
      products: products,
      inventory: inventory,
      reviews: reviews,
      sales: sales,
      orders: orders,
      generatedAt: new Date().toISOString()
    };
  }

  function getProductReport(sellerId) {
    const products = getSellerProducts(sellerId);

    return products.map(product => {
      const stock = window.RockyXInventory &&
        typeof window.RockyXInventory.getStock === "function"
        ? window.RockyXInventory.getStock(product.id)
        : null;

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        currency: product.currency,
        productStock: product.stock,
        inventoryStock: stock ? stock.quantity : null,
        status: product.status
      };
    });
  }

  function getAlerts(sellerId) {
    const dashboard = getDashboard(sellerId);

    if (!dashboard.success) {
      return [];
    }

    const alerts = [];

    dashboard.products.forEach(product => {
      if (Number(product.stock) <= 0) {
        alerts.push({
          type: "out_of_stock",
          productId: product.id,
          message: product.name + " is out of stock."
        });
      }
    });

    if (dashboard.inventory.lowStockCount > 0) {
      alerts.push({
        type: "low_inventory",
        message: "Some inventory items are running low."
      });
    }

    if (!dashboard.sales.available) {
      alerts.push({
        type: "sales_unavailable",
        message: "Verified sales reporting is not connected yet."
      });
    }

    return alerts;
  }

  window.RockyXSellerDashboard = {
    getDashboard,
    getProductReport,
    getAlerts
  };

  console.log("RockyX Seller Dashboard loaded.");
})();