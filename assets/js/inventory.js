/* =========================================
   ROCKYX INVENTORY MANAGEMENT
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_inventory";
  const MOVEMENTS_KEY = "rockyx_marketplace_inventory_movements";

  function readStorage(key, fallback) {
    try {
      const data = JSON.parse(
        localStorage.getItem(key) || JSON.stringify(fallback)
      );

      return data;
    } catch (error) {
      return fallback;
    }
  }

  function readInventory() {
    const data = readStorage(STORAGE_KEY, {});
    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : {};
  }

  function saveInventory(inventory) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));

    window.dispatchEvent(
      new CustomEvent("rockyx:inventory-updated")
    );

    return inventory;
  }

  function readMovements() {
    const data = readStorage(MOVEMENTS_KEY, []);
    return Array.isArray(data) ? data : [];
  }

  function saveMovements(movements) {
    localStorage.setItem(
      MOVEMENTS_KEY,
      JSON.stringify(movements)
    );

    return movements;
  }

  function recordMovement(productId, change, reason, sellerId) {
    const movements = readMovements();

    movements.unshift({
      id: "rxinv_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      productId: String(productId),
      sellerId: String(sellerId || ""),
      change: Number(change),
      reason: String(reason || "manual_adjustment"),
      createdAt: new Date().toISOString()
    });

    // Keep the most recent 500 movements.
    saveMovements(movements.slice(0, 500));
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

  function initializeProduct(productId, initialStock) {
    const id = String(productId || "").trim();
    const quantity = Number(initialStock);

    if (!id) {
      return {
        success: false,
        message: "A product ID is required."
      };
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return {
        success: false,
        message: "Stock must be a non-negative whole number."
      };
    }

    const product = getProduct(id);

    if (!product) {
      return {
        success: false,
        message: "Product not found in the marketplace catalog."
      };
    }

    const inventory = readInventory();

    if (inventory[id]) {
      return {
        success: false,
        message: "Inventory is already initialized for this product."
      };
    }

    inventory[id] = {
      productId: id,
      sellerId: String(product.sellerId || ""),
      quantity: quantity,
      lowStockThreshold: 5,
      updatedAt: new Date().toISOString()
    };

    saveInventory(inventory);
    recordMovement(id, quantity, "initial_stock", product.sellerId);

    return {
      success: true,
      inventory: inventory[id]
    };
  }

  function getStock(productId) {
    const id = String(productId || "");
    const inventory = readInventory();

    if (inventory[id]) {
      return { ...inventory[id] };
    }

    // Fall back to the stock currently stored on the product.
    const product = getProduct(id);

    if (!product) {
      return null;
    }

    return {
      productId: id,
      sellerId: String(product.sellerId || ""),
      quantity: Math.max(0, Number(product.stock) || 0),
      lowStockThreshold: 5,
      updatedAt: null,
      initialized: false
    };
  }

  function adjustStock(productId, change, reason, sellerId) {
    const id = String(productId || "");
    const amount = Number(change);

    if (!id) {
      return {
        success: false,
        message: "A product ID is required."
      };
    }

    if (!Number.isInteger(amount) || amount === 0) {
      return {
        success: false,
        message: "Stock change must be a non-zero whole number."
      };
    }

    const product = getProduct(id);

    if (!product) {
      return {
        success: false,
        message: "Product not found."
      };
    }

    const inventory = readInventory();

    if (!inventory[id]) {
      inventory[id] = {
        productId: id,
        sellerId: String(product.sellerId || ""),
        quantity: Math.max(0, Number(product.stock) || 0),
        lowStockThreshold: 5,
        updatedAt: new Date().toISOString()
      };
    }

    const current = inventory[id];

    // If a seller ID is supplied, it must match the stored seller ID.
    // This is a convenience check only, not real authentication.
    if (
      sellerId &&
      current.sellerId &&
      String(sellerId) !== current.sellerId
    ) {
      return {
        success: false,
        message: "Seller ID does not match this inventory record."
      };
    }

    const nextQuantity = current.quantity + amount;

    if (nextQuantity < 0) {
      return {
        success: false,
        message: "Stock cannot be reduced below zero."
      };
    }

    current.quantity = nextQuantity;
    current.updatedAt = new Date().toISOString();

    inventory[id] = current;
    saveInventory(inventory);

    recordMovement(
      id,
      amount,
      reason || "manual_adjustment",
      current.sellerId
    );

    return {
      success: true,
      inventory: { ...current }
    };
  }

  function setLowStockThreshold(productId, threshold, sellerId) {
    const id = String(productId || "");
    const amount = Number(threshold);

    if (!Number.isInteger(amount) || amount < 0) {
      return {
        success: false,
        message: "Threshold must be a non-negative whole number."
      };
    }

    const current = getStock(id);

    if (!current) {
      return {
        success: false,
        message: "Product not found."
      };
    }

    if (
      sellerId &&
      current.sellerId &&
      String(sellerId) !== current.sellerId
    ) {
      return {
        success: false,
        message: "Seller ID does not match this inventory record."
      };
    }

    const inventory = readInventory();

    inventory[id] = {
      ...current,
      lowStockThreshold: amount,
      updatedAt: new Date().toISOString()
    };

    saveInventory(inventory);

    return {
      success: true,
      inventory: { ...inventory[id] }
    };
  }

  function getLowStockProducts() {
    const inventory = readInventory();

    return Object.values(inventory).filter(item =>
      item.quantity <= item.lowStockThreshold
    );
  }

  function getMovements(productId) {
    const movements = readMovements();

    if (!productId) {
      return movements;
    }

    return movements.filter(movement =>
      movement.productId === String(productId)
    );
  }

  function getSummary(sellerId) {
    const inventory = Object.values(readInventory());

    const sellerInventory = sellerId
      ? inventory.filter(item =>
          item.sellerId === String(sellerId)
        )
      : inventory;

    return {
      productCount: sellerInventory.length,
      totalUnits: sellerInventory.reduce(
        (total, item) => total + item.quantity,
        0
      ),
      lowStockCount: sellerInventory.filter(
        item => item.quantity <= item.lowStockThreshold
      ).length,
      outOfStockCount: sellerInventory.filter(
        item => item.quantity === 0
      ).length
    };
  }

  window.RockyXInventory = {
    initializeProduct,
    getStock,
    adjustStock,
    setLowStockThreshold,
    getLowStockProducts,
    getMovements,
    getSummary
  };

  console.log("RockyX Inventory loaded.");
})();