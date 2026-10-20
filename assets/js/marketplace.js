/* =========================================
   ROCKYX MARKETPLACE
   Product listings and search prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_products";

  const DEFAULT_CATEGORIES = [
    "Electronics",
    "Fashion",
    "Home & Living",
    "Beauty",
    "Health",
    "Food & Groceries",
    "Sports",
    "Automotive",
    "Books",
    "Other"
  ];

  function readProducts() {
    try {
      const products = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(products) ? products : [];
    } catch (error) {
      return [];
    }
  }

  function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

    window.dispatchEvent(
      new CustomEvent("rockyx:marketplace-updated", {
        detail: { count: products.length }
      })
    );

    return products;
  }

  function createProduct(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        message: "Product information is required."
      };
    }

    const name = String(data.name || "").trim();
    const price = Number(data.price);

    if (!name) {
      return {
        success: false,
        message: "Enter a product name."
      };
    }

    if (!Number.isFinite(price) || price < 0) {
      return {
        success: false,
        message: "Enter a valid product price."
      };
    }

    const product = {
      id: "rxp_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      name: name,
      description: String(data.description || "").trim(),
      price: price,
      currency: String(data.currency || "GHS").toUpperCase(),
      category: String(data.category || "Other").trim(),
      imageUrl: String(data.imageUrl || "").trim(),
      sellerId: String(data.sellerId || "local-seller"),
      sellerName: String(data.sellerName || "RockyX Seller").trim(),
      stock: Math.max(0, Number(data.stock) || 0),
      status: "active",
      createdAt: new Date().toISOString()
    };

    const products = readProducts();
    products.unshift(product);
    saveProducts(products);

    return {
      success: true,
      product: product
    };
  }

  function getProducts(options) {
    options = options || {};

    let products = readProducts();

    if (options.category) {
      products = products.filter(product =>
        product.category.toLowerCase() ===
        String(options.category).toLowerCase()
      );
    }

    if (options.sellerId) {
      products = products.filter(product =>
        product.sellerId === String(options.sellerId)
      );
    }

    if (options.status) {
      products = products.filter(product =>
        product.status === String(options.status)
      );
    }

    if (options.minPrice !== undefined) {
      products = products.filter(product =>
        product.price >= Number(options.minPrice)
      );
    }

    if (options.maxPrice !== undefined) {
      products = products.filter(product =>
        product.price <= Number(options.maxPrice)
      );
    }

    if (options.inStock === true) {
      products = products.filter(product => product.stock > 0);
    }

    return products;
  }

  function getProduct(productId) {
    return readProducts().find(product =>
      product.id === String(productId)
    ) || null;
  }

  function searchProducts(query, options) {
    const term = String(query || "").trim().toLowerCase();

    let products = getProducts(options);

    if (!term) {
      return products;
    }

    return products.filter(product => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.sellerName
      ].join(" ").toLowerCase();

      return searchableText.includes(term);
    });
  }

  function updateProduct(productId, changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        message: "Product changes are required."
      };
    }

    const products = readProducts();
    const index = products.findIndex(product =>
      product.id === String(productId)
    );

    if (index === -1) {
      return {
        success: false,
        message: "Product not found."
      };
    }

    const allowedFields = [
      "name",
      "description",
      "price",
      "currency",
      "category",
      "imageUrl",
      "stock"
    ];

    const updated = { ...products[index] };

    allowedFields.forEach(field => {
      if (changes[field] !== undefined) {
        updated[field] = changes[field];
      }
    });

    if (changes.name !== undefined) {
      updated.name = String(changes.name).trim();
    }

    if (changes.price !== undefined) {
      const price = Number(changes.price);

      if (!Number.isFinite(price) || price < 0) {
        return {
          success: false,
          message: "Enter a valid product price."
        };
      }

      updated.price = price;
    }

    if (changes.stock !== undefined) {
      const stock = Number(changes.stock);

      if (!Number.isFinite(stock) || stock < 0) {
        return {
          success: false,
          message: "Enter a valid stock quantity."
        };
      }

      updated.stock = stock;
    }

    products[index] = updated;
    saveProducts(products);

    return {
      success: true,
      product: updated
    };
  }

  function deleteProduct(productId) {
    const products = readProducts();
    const updated = products.filter(product =>
      product.id !== String(productId)
    );

    if (updated.length === products.length) {
      return false;
    }

    saveProducts(updated);
    return true;
  }

  function getCategories() {
    const categories = new Set(DEFAULT_CATEGORIES);

    readProducts().forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });

    return Array.from(categories).sort();
  }

  function getFeaturedProducts(limit) {
    const maxResults = Math.max(1, Number(limit) || 10);

    return getProducts({ status: "active" })
      .filter(product => product.stock > 0)
      .slice(0, maxResults);
  }

  window.RockyXMarketplace = {
    createProduct,
    getProducts,
    getProduct,
    searchProducts,
    updateProduct,
    deleteProduct,
    getCategories,
    getFeaturedProducts
  };

  console.log("RockyX Marketplace loaded.");
})();