/* =========================================
   ROCKYX COUPONS & DISCOUNTS
   Local prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_marketplace_coupons";
  const USAGE_KEY = "rockyx_marketplace_coupon_usage";

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || JSON.stringify(fallback)
      );

      return value;
    } catch (error) {
      return fallback;
    }
  }

  function readCoupons() {
    const coupons = readStorage(STORAGE_KEY, []);
    return Array.isArray(coupons) ? coupons : [];
  }

  function saveCoupons(coupons) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));

    window.dispatchEvent(
      new CustomEvent("rockyx:coupons-updated", {
        detail: { count: coupons.length }
      })
    );

    return coupons;
  }

  function readUsage() {
    const usage = readStorage(USAGE_KEY, {});
    return usage && typeof usage === "object" ? usage : {};
  }

  function saveUsage(usage) {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  }

  function normalizeCode(code) {
    return String(code || "").trim().toUpperCase();
  }

  function createCoupon(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        message: "Coupon information is required."
      };
    }

    const code = normalizeCode(data.code);
    const type = String(data.type || "");
    const value = Number(data.value);
    const minimumPurchase = Number(data.minimumPurchase || 0);
    const maximumDiscount =
      data.maximumDiscount === undefined ||
      data.maximumDiscount === null ||
      data.maximumDiscount === ""
        ? null
        : Number(data.maximumDiscount);

    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return {
        success: false,
        message: "Use a coupon code with 3–30 letters, numbers, hyphens, or underscores."
      };
    }

    if (!["percentage", "fixed"].includes(type)) {
      return {
        success: false,
        message: "Choose percentage or fixed discount."
      };
    }

    if (!Number.isFinite(value) || value <= 0) {
      return {
        success: false,
        message: "Discount value must be greater than zero."
      };
    }

    if (type === "percentage" && value > 100) {
      return {
        success: false,
        message: "Percentage discount cannot exceed 100%."
      };
    }

    if (
      !Number.isFinite(minimumPurchase) ||
      minimumPurchase < 0
    ) {
      return {
        success: false,
        message: "Minimum purchase must be a valid non-negative amount."
      };
    }

    if (
      maximumDiscount !== null &&
      (!Number.isFinite(maximumDiscount) || maximumDiscount < 0)
    ) {
      return {
        success: false,
        message: "Maximum discount must be a valid non-negative amount."
      };
    }

    const coupons = readCoupons();

    if (coupons.some(coupon => coupon.code === code)) {
      return {
        success: false,
        message: "This coupon code already exists."
      };
    }

    const now = new Date().toISOString();
    const startsAt = data.startsAt
      ? new Date(data.startsAt).toISOString()
      : now;

    const expiresAt = data.expiresAt
      ? new Date(data.expiresAt).toISOString()
      : null;

    if (
      startsAt === "Invalid Date" ||
      (expiresAt && expiresAt === "Invalid Date")
    ) {
      return {
        success: false,
        message: "Enter valid start and expiration dates."
      };
    }

    if (expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
      return {
        success: false,
        message: "Expiration must be later than the start date."
      };
    }

    const coupon = {
      id: "rxc_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      code,
      type,
      value,
      currency: String(data.currency || "GHS").toUpperCase(),
      minimumPurchase,
      maximumDiscount,
      usageLimit: data.usageLimit == null || data.usageLimit === ""
        ? null
        : Math.max(1, Math.floor(Number(data.usageLimit))),
      startsAt,
      expiresAt,
      active: data.active !== false,
      createdAt: now
    };

    if (
      coupon.usageLimit !== null &&
      !Number.isFinite(coupon.usageLimit)
    ) {
      return {
        success: false,
        message: "Usage limit must be a valid positive number."
      };
    }

    coupons.unshift(coupon);
    saveCoupons(coupons);

    return {
      success: true,
      coupon
    };
  }

  function getCoupons() {
    return readCoupons();
  }

  function getCoupon(code) {
    const normalized = normalizeCode(code);

    return readCoupons().find(
      coupon => coupon.code === normalized
    ) || null;
  }

  function calculateDiscount(coupon, subtotal) {
    const amount = Number(subtotal);

    if (!Number.isFinite(amount) || amount < 0) {
      return {
        success: false,
        message: "Enter a valid subtotal."
      };
    }

    let discount = coupon.type === "percentage"
      ? amount * coupon.value / 100
      : coupon.value;

    if (coupon.maximumDiscount !== null) {
      discount = Math.min(discount, coupon.maximumDiscount);
    }

    discount = Math.min(discount, amount);

    return {
      success: true,
      discount: Number(discount.toFixed(2)),
      total: Number((amount - discount).toFixed(2)),
      currency: coupon.currency
    };
  }

  function validateCoupon(code, subtotal, customerId) {
    const normalized = normalizeCode(code);
    const coupon = getCoupon(normalized);

    if (!coupon) {
      return {
        success: false,
        message: "Coupon not found."
      };
    }

    if (!coupon.active) {
      return {
        success: false,
        message: "This coupon is inactive."
      };
    }

    const now = Date.now();

    if (now < new Date(coupon.startsAt).getTime()) {
      return {
        success: false,
        message: "This coupon is not active yet."
      };
    }

    if (
      coupon.expiresAt &&
      now > new Date(coupon.expiresAt).getTime()
    ) {
      return {
        success: false,
        message: "This coupon has expired."
      };
    }

    const amount = Number(subtotal);

    if (!Number.isFinite(amount) || amount < 0) {
      return {
        success: false,
        message: "Enter a valid subtotal."
      };
    }

    if (amount < coupon.minimumPurchase) {
      return {
        success: false,
        message: "Your purchase does not meet the minimum amount."
      };
    }

    if (
      coupon.usageLimit !== null &&
      getUsageCount(coupon.code) >= coupon.usageLimit
    ) {
      return {
        success: false,
        message: "This coupon has reached its usage limit."
      };
    }

    if (
      customerId &&
      hasCustomerUsedCoupon(coupon.code, customerId)
    ) {
      return {
        success: false,
        message: "This customer has already used this coupon."
      };
    }

    return {
      success: true,
      coupon,
      ...calculateDiscount(coupon, amount)
    };
  }

  function getUsageCount(code) {
    const usage = readUsage();
    const entry = usage[normalizeCode(code)];

    return entry && Array.isArray(entry.redemptions)
      ? entry.redemptions.length
      : 0;
  }

  function hasCustomerUsedCoupon(code, customerId) {
    const usage = readUsage();
    const entry = usage[normalizeCode(code)];

    if (!entry || !Array.isArray(entry.redemptions)) {
      return false;
    }

    return entry.redemptions.some(
      redemption => redemption.customerId === String(customerId)
    );
  }

  /*
   * Prototype only. A live system must record coupon redemption
   * on the server after a verified order/payment.
   */
  function recordRedemption(code, customerId, orderId) {
    const validation = validateCoupon(
      code,
      0,
      customerId
    );

    // Recheck coupon existence and eligibility independently
    // because subtotal zero may not meet its minimum purchase.
    const coupon = getCoupon(code);

    if (!coupon || !coupon.active) {
      return {
        success: false,
        message: "Coupon is not available."
      };
    }

    if (!customerId || !orderId) {
      return {
        success: false,
        message: "Customer ID and order ID are required."
      };
    }

    if (hasCustomerUsedCoupon(code, customerId)) {
      return {
        success: false,
        message: "This customer has already used this coupon."
      };
    }

    if (
      coupon.usageLimit !== null &&
      getUsageCount(code) >= coupon.usageLimit
    ) {
      return {
        success: false,
        message: "This coupon has reached its usage limit."
      };
    }

    const usage = readUsage();
    const key = normalizeCode(code);

    if (!usage[key]) {
      usage[key] = { redemptions: [] };
    }

    usage[key].redemptions.push({
      customerId: String(customerId),
      orderId: String(orderId),
      redeemedAt: new Date().toISOString()
    });

    saveUsage(usage);

    return {
      success: true,
      message: "Local redemption recorded; no payment was processed."
    };
  }

  function setActive(code, active) {
    const coupons = readCoupons();
    const coupon = coupons.find(
      item => item.code === normalizeCode(code)
    );

    if (!coupon) {
      return {
        success: false,
        message: "Coupon not found."
      };
    }

    coupon.active = Boolean(active);
    saveCoupons(coupons);

    return {
      success: true,
      coupon
    };
  }

  window.RockyXCoupons = {
    createCoupon,
    getCoupons,
    getCoupon,
    validateCoupon,
    calculateDiscount,
    getUsageCount,
    recordRedemption,
    setActive
  };

  console.log("RockyX Coupons loaded.");
})();