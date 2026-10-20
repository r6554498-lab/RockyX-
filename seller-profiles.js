/* =========================================
   ROCKYX SELLER PROFILES
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_sellers";

  function readSellers() {
    try {
      const sellers = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(sellers) ? sellers : [];
    } catch (error) {
      return [];
    }
  }

  function saveSellers(sellers) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sellers)
    );

    window.dispatchEvent(
      new CustomEvent("rockyx:sellers-updated", {
        detail: { count: sellers.length }
      })
    );

    return sellers;
  }

  function createProfile(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        message: "Seller information is required."
      };
    }

    const storeName = String(data.storeName || "").trim();
    const ownerId = String(data.ownerId || "").trim();

    if (!storeName) {
      return {
        success: false,
        message: "Enter a store name."
      };
    }

    if (!ownerId) {
      return {
        success: false,
        message: "A seller account ID is required."
      };
    }

    const sellers = readSellers();

    if (sellers.some(seller => seller.ownerId === ownerId)) {
      return {
        success: false,
        message: "A seller profile already exists for this account."
      };
    }

    const profile = {
      id: "rxs_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      ownerId: ownerId,
      storeName: storeName,
      description: String(data.description || "").trim(),
      logoUrl: String(data.logoUrl || "").trim(),
      bannerUrl: String(data.bannerUrl || "").trim(),
      location: String(data.location || "").trim(),
      contactEmail: String(data.contactEmail || "").trim(),
      contactPhone: String(data.contactPhone || "").trim(),

      // Verification must be approved by a trusted backend/admin.
      verificationStatus: "unverified",

      status: "active",
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sellers.unshift(profile);
    saveSellers(sellers);

    return {
      success: true,
      seller: profile
    };
  }

  function getProfiles(options) {
    options = options || {};

    let sellers = readSellers();

    if (options.status) {
      sellers = sellers.filter(
        seller => seller.status === String(options.status)
      );
    }

    if (options.verified === true) {
      sellers = sellers.filter(
        seller => seller.verificationStatus === "verified"
      );
    }

    if (options.ownerId) {
      sellers = sellers.filter(
        seller => seller.ownerId === String(options.ownerId)
      );
    }

    return sellers;
  }

  function getProfile(sellerId) {
    return readSellers().find(
      seller => seller.id === String(sellerId)
    ) || null;
  }

  function getByOwner(ownerId) {
    return readSellers().find(
      seller => seller.ownerId === String(ownerId)
    ) || null;
  }

  function searchProfiles(query) {
    const term = String(query || "").trim().toLowerCase();

    if (!term) {
      return readSellers();
    }

    return readSellers().filter(seller => {
      const searchableText = [
        seller.storeName,
        seller.description,
        seller.location
      ].join(" ").toLowerCase();

      return searchableText.includes(term);
    });
  }

  function updateProfile(sellerId, changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        message: "Profile changes are required."
      };
    }

    const sellers = readSellers();
    const index = sellers.findIndex(
      seller => seller.id === String(sellerId)
    );

    if (index === -1) {
      return {
        success: false,
        message: "Seller profile not found."
      };
    }

    // Sensitive fields such as verificationStatus, rating,
    // reviewCount, ownerId, and status cannot be changed here.
    const allowedFields = [
      "storeName",
      "description",
      "logoUrl",
      "bannerUrl",
      "location",
      "contactEmail",
      "contactPhone"
    ];

    const updated = { ...sellers[index] };

    allowedFields.forEach(field => {
      if (changes[field] !== undefined) {
        updated[field] = String(changes[field]).trim();
      }
    });

    if (!updated.storeName) {
      return {
        success: false,
        message: "Store name cannot be empty."
      };
    }

    updated.updatedAt = new Date().toISOString();
    sellers[index] = updated;
    saveSellers(sellers);

    return {
      success: true,
      seller: updated
    };
  }

  function getSellerProducts(sellerId) {
    if (
      !window.RockyXMarketplace ||
      typeof window.RockyXMarketplace.getProducts !== "function"
    ) {
      return [];
    }

    return window.RockyXMarketplace.getProducts({
      sellerId: String(sellerId)
    });
  }

  function getStorefront(sellerId) {
    const seller = getProfile(sellerId);

    if (!seller) {
      return null;
    }

    return {
      seller: seller,
      products: getSellerProducts(seller.ownerId)
    };
  }

  window.RockyXSellerProfiles = {
    createProfile,
    getProfiles,
    getProfile,
    getByOwner,
    searchProfiles,
    updateProfile,
    getSellerProducts,
    getStorefront
  };

  console.log("RockyX Seller Profiles loaded.");
})();