/*
 * RockyX Seller Discounts
 *
 * Local prototype for seller-managed product promotions.
 *
 * IMPORTANT:
 * This module does not process payments.
 * Real discounts must be validated by a trusted backend
 * before they affect orders or payments.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_seller_discounts";

  const DISCOUNT_TYPES = [
    "percentage",
    "fixed"
  ];

  const DISCOUNT_STATUSES = [
    "draft",
    "scheduled",
    "active",
    "paused",
    "expired",
    "cancelled"
  ];

  function readDiscounts() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
    } catch (error) {
      console.error("RockyX discount storage error:", error);
      return [];
    }
  }

  function saveDiscounts(discounts) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(discounts)
      );
      return true;
    } catch (error) {
      console.error("RockyX discount save error:", error);
      return false;
    }
  }

  function createId() {
    return "seller_discount_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function parseDate(value) {
    if (!value) return null;

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function getCurrentStatus(discount) {
    if (discount.status === "cancelled") {
      return "cancelled";
    }

    if (discount.status === "paused") {
      return "paused";
    }

    if (discount.status === "draft") {
      return "draft";
    }

    const now = Date.now();
    const startsAt = parseDate(discount.startsAt);
    const endsAt = parseDate(discount.endsAt);

    if (endsAt && now >= endsAt.getTime()) {
      return "expired";
    }

    if (startsAt && now < startsAt.getTime()) {
      return "scheduled";
    }

    return "active";
  }

  function validateDiscount(details) {
    if (!details || typeof details !== "object") {
      return "Discount details are required.";
    }

    if (
      typeof details.sellerId !== "string" ||
      !details.sellerId.trim()
    ) {
      return "A seller ID is required.";
    }

    if (
      !DISCOUNT_TYPES.includes(details.type)
    ) {
      return "Choose percentage or fixed discount.";
    }

    if (
      typeof details.value !== "number" ||
      !Number.isFinite(details.value) ||
      details.value <= 0
    ) {
      return "Discount value must be greater than zero.";
    }

    if (
      details.type === "percentage" &&
      details.value > 100
    ) {
      return "Percentage discount cannot exceed 100%.";
    }

    if (
      details.type === "fixed" &&
      !Number.isSafeInteger(details.valueMinor)
    ) {
      return "Fixed discounts require valueMinor in integer minor units.";
    }

    if (
      details.type === "fixed" &&
      details.valueMinor <= 0
    ) {
      return "Fixed discount must be greater than zero.";
    }

    if (
      details.startsAt &&
      !parseDate(details.startsAt)
    ) {
      return "Start date is invalid.";
    }

    if (
      details.endsAt &&
      !parseDate(details.endsAt)
    ) {
      return "End date is invalid.";
    }

    const startsAt = parseDate(details.startsAt);
    const endsAt = parseDate(details.endsAt);

    if (
      startsAt &&
      endsAt &&
      endsAt.getTime() <= startsAt.getTime()
    ) {
      return "End date must be after the start date.";
    }

    return null;
  }

  /*
   * Create a seller discount.
   *
   * Percentage example:
   * { type: "percentage", value: 15 }
   * means 15% off.
   *
   * Fixed example:
   * { type: "fixed", value: 5, valueMinor: 500 }
   * means 500 minor units off. The value field is descriptive;
   * valueMinor is used for the calculation.
   */
  function createDiscount(details) {
    const validationError = validateDiscount(details);

    if (validationError) {
      return {
        success: false,
        message: validationError
      };
    }

    const discounts = readDiscounts();

    const discount = {
      id: createId(),
      sellerId: details.sellerId.trim(),
      name: details.name || "Seller promotion",
      description: details.description || "",
      type: details.type,
      value: details.value,
      valueMinor: details.type === "fixed"
        ? details.valueMinor
        : null,
      currency: details.currency || "GHS",
      productIds: Array.isArray(details.productIds)
        ? details.productIds
        : [],
      category: details.category || null,
      minimumOrderMinor: Number.isSafeInteger(
        details.minimumOrderMinor
      ) && details.minimumOrderMinor >= 0
        ? details.minimumOrderMinor
        : 0,
      maximumDiscountMinor: Number.isSafeInteger(
        details.maximumDiscountMinor
      ) && details.maximumDiscountMinor > 0
        ? details.maximumDiscountMinor
        : null,
      startsAt: details.startsAt || null,
      endsAt: details.endsAt || null,
      status: details.status === "draft"
        ? "draft"
        : "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Local prototype. Not verified or applied to real orders."
    };

    discounts.push(discount);

    if (!saveDiscounts(discounts)) {
      return {
        success: false,
        message: "Could not save the discount."
      };
    }

    return {
      success: true,
      discount: Object.assign({}, discount, {
        status: getCurrentStatus(discount)
      }),
      message: "Seller discount created locally."
    };
  }

  function getDiscount(discountId) {
    const discount = readDiscounts().find(function (item) {
      return item.id === discountId;
    });

    if (!discount) return null;

    return Object.assign({}, discount, {
      status: getCurrentStatus(discount)
    });
  }

  function getSellerDiscounts(sellerId) {
    return readDiscounts()
      .filter(function (discount) {
        return discount.sellerId === sellerId;
      })
      .map(function (discount) {
        return Object.assign({}, discount, {
          status: getCurrentStatus(discount)
        });
      });
  }

  function getActiveDiscounts(sellerId) {
    return getSellerDiscounts(sellerId).filter(
      function (discount) {
        return discount.status === "active";
      }
    );
  }

  function updateDiscount(discountId, sellerId, changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        message: "Discount changes are required."
      };
    }

    const discounts = readDiscounts();

    const index = discounts.findIndex(function (discount) {
      return discount.id === discountId &&
        discount.sellerId === sellerId;
    });

    if (index === -1) {
      return {
        success: false,
        message: "Discount not found for this seller."
      };
    }

    const updated = Object.assign(
      {},
      discounts[index],
      changes
    );

    // Do not allow the caller to change ownership or ID.
    updated.id = discounts[index].id;
    updated.sellerId = discounts[index].sellerId;
    updated.createdAt = discounts[index].createdAt;
    updated.updatedAt = new Date().toISOString();

    const validationError = validateDiscount(updated);

    if (validationError) {
      return {
        success: false,
        message: validationError
      };
    }

    if (
      changes.status &&
      !DISCOUNT_STATUSES.includes(changes.status)
    ) {
      return {
        success: false,
        message: "Invalid discount status."
      };
    }

    discounts[index] = updated;

    if (!saveDiscounts(discounts)) {
      return {
        success: false,
        message: "Could not update the discount."
      };
    }

    return {
      success: true,
      discount: Object.assign({}, updated, {
        status: getCurrentStatus(updated)
      }),
      message: "Discount updated locally."
    };
  }

  function calculateDiscount(discountId, sellerId, subtotalMinor) {
    if (
      !Number.isSafeInteger(subtotalMinor) ||
      subtotalMinor < 0
    ) {
      return {
        success: false,
        message: "Subtotal must be a non-negative integer in minor units."
      };
    }

    const discount = getDiscount(discountId);

    if (!discount || discount.sellerId !== sellerId) {
      return {
        success: false,
        message: "Discount not found for this seller."
      };
    }

    if (discount.status !== "active") {
      return {
        success: false,
        message: "This discount is not currently active."
      };
    }

    if (subtotalMinor < discount.minimumOrderMinor) {
      return {
        success: false,
        message: "Order does not meet the minimum subtotal."
      };
    }

    let amountOffMinor = 0;

    if (discount.type === "percentage") {
      amountOffMinor = Math.round(
        subtotalMinor * discount.value / 100
      );
    } else {
      amountOffMinor = discount.valueMinor;
    }

    if (discount.maximumDiscountMinor !== null) {
      amountOffMinor = Math.min(
        amountOffMinor,
        discount.maximumDiscountMinor
      );
    }

    amountOffMinor = Math.min(
      amountOffMinor,
      subtotalMinor
    );

    return {
      success: true,
      discountId: discount.id,
      currency: discount.currency,
      subtotalMinor: subtotalMinor,
      discountMinor: amountOffMinor,
      totalAfterDiscountMinor: subtotalMinor - amountOffMinor,
      note: "Preview only. The backend must recalculate before checkout."
    };
  }

  function deleteDiscount(discountId, sellerId) {
    const discounts = readDiscounts();

    const remaining = discounts.filter(function (discount) {
      return !(
        discount.id === discountId &&
        discount.sellerId === sellerId
      );
    });

    if (remaining.length === discounts.length) {
      return {
        success: false,
        message: "Discount not found for this seller."
      };
    }

    if (!saveDiscounts(remaining)) {
      return {
        success: false,
        message: "Could not delete the discount."
      };
    }

    return {
      success: true,
      message: "Discount deleted from local storage."
    };
  }

  window.RockyXSellerDiscounts = {
    createDiscount: createDiscount,
    getDiscount: getDiscount,
    getSellerDiscounts: getSellerDiscounts,
    getActiveDiscounts: getActiveDiscounts,
    updateDiscount: updateDiscount,
    calculateDiscount: calculateDiscount,
    deleteDiscount: deleteDiscount,
    getDiscountTypes: function () {
      return DISCOUNT_TYPES.slice();
    },
    getDiscountStatuses: function () {
      return DISCOUNT_STATUSES.slice();
    }
  };
})();