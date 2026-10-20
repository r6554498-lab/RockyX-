/*
 * RockyX Commission Engine
 * Marketplace commission calculation foundation.
 *
 * IMPORTANT:
 * This is a frontend prototype.
 * Production commissions must be calculated and enforced
 * by a trusted backend, never by browser code alone.
 *
 * All monetary amounts use integer minor units.
 * Example: GHS 100.00 = 10000 minor units.
 */

(function () {
  "use strict";

  const SETTINGS_KEY = "rockyx_commission_settings";
  const ALLOCATIONS_KEY = "rockyx_commission_allocations";

  const DEFAULT_SETTINGS = {
    currency: "GHS",

    // Example rate only. Change this when deciding
    // RockyX's actual marketplace commission.
    defaultRatePercent: 10,

    categoryRates: {
      electronics: 10,
      fashion: 10,
      food: 8,
      transport: 8,
      services: 10,
      beauty: 10,
      home: 10,
      other: 10
    }
  };

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("RockyX commission storage error:", error);
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("RockyX commission save error:", error);
      return false;
    }
  }

  function getSettings() {
    const saved = readStorage(SETTINGS_KEY, {});
    const defaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    return {
      ...defaults,
      ...saved,
      categoryRates: {
        ...defaults.categoryRates,
        ...(saved.categoryRates || {})
      }
    };
  }

  function validRate(rate) {
    return (
      typeof rate === "number" &&
      Number.isFinite(rate) &&
      rate >= 0 &&
      rate <= 100
    );
  }

  function setDefaultRate(rate) {
    if (!validRate(rate)) {
      return {
        success: false,
        message: "Commission rate must be between 0 and 100."
      };
    }

    const settings = getSettings();
    settings.defaultRatePercent = rate;

    const saved = writeStorage(SETTINGS_KEY, settings);

    return {
      success: saved,
      defaultRatePercent: settings.defaultRatePercent,
      message: saved
        ? "Default commission rate saved."
        : "Could not save the commission rate."
    };
  }

  function setCategoryRate(category, rate) {
    if (
      typeof category !== "string" ||
      !category.trim()
    ) {
      return {
        success: false,
        message: "Enter a valid category."
      };
    }

    if (!validRate(rate)) {
      return {
        success: false,
        message: "Commission rate must be between 0 and 100."
      };
    }

    const settings = getSettings();
    const categoryKey = category.trim().toLowerCase();

    settings.categoryRates[categoryKey] = rate;

    const saved = writeStorage(SETTINGS_KEY, settings);

    return {
      success: saved,
      category: categoryKey,
      ratePercent: rate,
      message: saved
        ? "Category commission rate saved."
        : "Could not save the category rate."
    };
  }

  function removeCategoryRate(category) {
    if (typeof category !== "string" || !category.trim()) {
      return {
        success: false,
        message: "Enter a valid category."
      };
    }

    const settings = getSettings();
    const categoryKey = category.trim().toLowerCase();

    if (
      !Object.prototype.hasOwnProperty.call(
        settings.categoryRates,
        categoryKey
      )
    ) {
      return {
        success: false,
        message: "No custom rate exists for this category."
      };
    }

    delete settings.categoryRates[categoryKey];

    const saved = writeStorage(SETTINGS_KEY, settings);

    return {
      success: saved,
      category: categoryKey,
      message: saved
        ? "Category rate removed. The default rate will apply."
        : "Could not remove the category rate."
    };
  }

  function getRateForCategory(category) {
    const settings = getSettings();
    const categoryKey =
      typeof category === "string"
        ? category.trim().toLowerCase()
        : "";

    if (
      categoryKey &&
      Object.prototype.hasOwnProperty.call(
        settings.categoryRates,
        categoryKey
      )
    ) {
      return settings.categoryRates[categoryKey];
    }

    return settings.defaultRatePercent;
  }

  function calculate(amountMinor, category) {
    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor < 0
    ) {
      return {
        success: false,
        message: "Amount must be a non-negative integer in minor units."
      };
    }

    const settings = getSettings();
    const ratePercent = getRateForCategory(category);

    // Round the commission to the nearest minor currency unit.
    const commissionMinor = Math.round(
      amountMinor * ratePercent / 100
    );

    const sellerProceedsMinor =
      amountMinor - commissionMinor;

    return {
      success: true,
      currency: settings.currency,
      category: category || "other",
      grossAmountMinor: amountMinor,
      commissionRatePercent: ratePercent,
      commissionMinor: commissionMinor,
      sellerProceedsMinor: sellerProceedsMinor,
      calculatedAt: new Date().toISOString(),
      note: "Prototype calculation only; not a verified payment."
    };
  }

  function recordOrderAllocation(orderId, amountMinor, category) {
    if (
      typeof orderId !== "string" ||
      !orderId.trim()
    ) {
      return {
        success: false,
        message: "A valid order ID is required."
      };
    }

    const result = calculate(amountMinor, category);

    if (!result.success) {
      return result;
    }

    const allocations = readStorage(ALLOCATIONS_KEY, []);

    const allocation = {
      id: "allocation_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8),
      orderId: orderId.trim(),
      ...result,
      recordedAt: new Date().toISOString()
    };

    allocations.push(allocation);

    const saved = writeStorage(ALLOCATIONS_KEY, allocations);

    return {
      success: saved,
      allocation: saved ? allocation : null,
      message: saved
        ? "Prototype allocation recorded."
        : "Could not record the allocation."
    };
  }

  function getOrderAllocation(orderId) {
    const allocations = readStorage(ALLOCATIONS_KEY, []);

    return allocations.filter(function (item) {
      return item.orderId === orderId;
    });
  }

  function getAllocations() {
    return readStorage(ALLOCATIONS_KEY, []);
  }

  function getCategories() {
    const settings = getSettings();
    return Object.keys(settings.categoryRates);
  }

  function resetSettings() {
    const saved = writeStorage(
      SETTINGS_KEY,
      JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
    );

    return {
      success: saved,
      message: saved
        ? "Commission settings reset to example defaults."
        : "Could not reset commission settings."
    };
  }

  window.RockyXCommissionEngine = {
    getSettings: getSettings,
    setDefaultRate: setDefaultRate,
    setCategoryRate: setCategoryRate,
    removeCategoryRate: removeCategoryRate,
    getRateForCategory: getRateForCategory,
    calculate: calculate,
    recordOrderAllocation: recordOrderAllocation,
    getOrderAllocation: getOrderAllocation,
    getAllocations: getAllocations,
    getCategories: getCategories,
    resetSettings: resetSettings
  };
})();