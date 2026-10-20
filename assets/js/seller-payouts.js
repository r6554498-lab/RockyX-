/*
 * RockyX Seller Payouts
 *
 * Tracks seller earnings and payout requests.
 *
 * IMPORTANT:
 * This is a local prototype, not a real payment system.
 * Production payouts must be verified and processed
 * by a secure backend and an approved payment provider.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_seller_payouts";
  const CURRENCY_KEY = "rockyx_seller_payout_currency";

  const DEFAULT_CURRENCY = "GHS";

  const PAYOUT_STATUSES = [
    "pending",
    "processing",
    "completed",
    "rejected",
    "cancelled"
  ];

  function readRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("RockyX payout storage error:", error);
      return [];
    }
  }

  function saveRecords(records) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records)
      );
      return true;
    } catch (error) {
      console.error("RockyX payout save error:", error);
      return false;
    }
  }

  function getCurrency() {
    try {
      return localStorage.getItem(CURRENCY_KEY) ||
        DEFAULT_CURRENCY;
    } catch (error) {
      return DEFAULT_CURRENCY;
    }
  }

  function setCurrency(currency) {
    if (
      typeof currency !== "string" ||
      !/^[A-Z]{3}$/.test(currency)
    ) {
      return {
        success: false,
        message: "Enter a valid three-letter currency code."
      };
    }

    try {
      localStorage.setItem(CURRENCY_KEY, currency);

      return {
        success: true,
        currency: currency,
        message: "Payout display currency updated."
      };
    } catch (error) {
      return {
        success: false,
        message: "Could not save the currency."
      };
    }
  }

  function makeId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function isValidAmount(amountMinor) {
    return Number.isSafeInteger(amountMinor) &&
      amountMinor > 0;
  }

  /*
   * Record seller earnings in integer minor units.
   *
   * Example:
   * GHS 25.00 = 2500 minor units.
   *
   * This function only records a demonstration entry.
   * It does not prove that a sale or payment occurred.
   */
  function recordEarning(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Earning details are required."
      };
    }

    if (
      typeof details.sellerId !== "string" ||
      !details.sellerId.trim()
    ) {
      return {
        success: false,
        message: "A seller ID is required."
      };
    }

    if (!isValidAmount(details.amountMinor)) {
      return {
        success: false,
        message: "Earning must be a positive integer in minor units."
      };
    }

    const records = readRecords();

    const entry = {
      id: makeId("earning"),
      sellerId: details.sellerId.trim(),
      orderId: details.orderId || null,
      amountMinor: details.amountMinor,
      currency: details.currency || getCurrency(),
      source: details.source || "marketplace_sale",
      status: "available",
      description: details.description || "Seller earning",
      createdAt: new Date().toISOString()
    };

    records.push(entry);

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not save the earning record."
      };
    }

    return {
      success: true,
      earning: entry,
      message: "Prototype earning recorded."
    };
  }

  function getEntries(sellerId) {
    const records = readRecords();

    if (!sellerId) {
      return records;
    }

    return records.filter(function (entry) {
      return entry.sellerId === sellerId;
    });
  }

  /*
   * Calculate a seller's demonstration balance.
   * This is not a verified financial balance.
   */
  function getBalance(sellerId) {
    if (
      typeof sellerId !== "string" ||
      !sellerId.trim()
    ) {
      return {
        success: false,
        message: "A seller ID is required."
      };
    }

    const entries = getEntries(sellerId);
    let availableMinor = 0;
    let pendingMinor = 0;
    let paidMinor = 0;

    entries.forEach(function (entry) {
      if (entry.type === "payout") {
        if (entry.status === "completed") {
          paidMinor += entry.amountMinor;
        }

        return;
      }

      if (entry.status === "available") {
        availableMinor += entry.amountMinor;
      } else if (entry.status === "pending") {
        pendingMinor += entry.amountMinor;
      }
    });

    return {
      success: true,
      sellerId: sellerId,
      currency: getCurrency(),
      availableMinor: availableMinor,
      pendingMinor: pendingMinor,
      paidMinor: paidMinor,
      note: "Local demonstration totals; not verified funds."
    };
  }

  /*
   * Create a payout request.
   *
   * The request does not transfer money.
   * A trusted backend must verify the seller, balance,
   * destination, fees, and payment provider response.
   */
  function requestPayout(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Payout details are required."
      };
    }

    if (
      typeof details.sellerId !== "string" ||
      !details.sellerId.trim()
    ) {
      return {
        success: false,
        message: "A seller ID is required."
      };
    }

    if (!isValidAmount(details.amountMinor)) {
      return {
        success: false,
        message: "Enter a positive payout amount in minor units."
      };
    }

    if (
      typeof details.destinationType !== "string" ||
      !details.destinationType.trim()
    ) {
      return {
        success: false,
        message: "A payout destination type is required."
      };
    }

    const records = readRecords();

    const request = {
      id: makeId("payout"),
      type: "payout",
      sellerId: details.sellerId.trim(),
      amountMinor: details.amountMinor,
      currency: details.currency || getCurrency(),
      destinationType: details.destinationType,
      destinationReference: details.destinationReference || null,
      status: "pending",
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Demo request only. No money has been transferred."
    };

    records.push(request);

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not save the payout request."
      };
    }

    return {
      success: true,
      payout: request,
      message: "Payout request recorded for demonstration."
    };
  }

  function getPayouts(sellerId) {
    return readRecords().filter(function (entry) {
      return entry.type === "payout" &&
        (!sellerId || entry.sellerId === sellerId);
    });
  }

  /*
   * Prototype status update.
   *
   * Production status changes must be restricted
   * to authorized backend services and staff.
   */
  function updatePayoutStatus(payoutId, status, note) {
    if (!PAYOUT_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid payout status."
      };
    }

    const records = readRecords();

    const payout = records.find(function (entry) {
      return entry.type === "payout" &&
        entry.id === payoutId;
    });

    if (!payout) {
      return {
        success: false,
        message: "Payout request not found."
      };
    }

    payout.status = status;
    payout.updatedAt = new Date().toISOString();
    payout.statusNote = note || "";

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not update payout status."
      };
    }

    return {
      success: true,
      payout: payout,
      message: "Prototype payout status updated."
    };
  }

  function getPayoutStatuses() {
    return PAYOUT_STATUSES.slice();
  }

  window.RockyXSellerPayouts = {
    getCurrency: getCurrency,
    setCurrency: setCurrency,
    recordEarning: recordEarning,
    getEntries: getEntries,
    getBalance: getBalance,
    requestPayout: requestPayout,
    getPayouts: getPayouts,
    updatePayoutStatus: updatePayoutStatus,
    getPayoutStatuses: getPayoutStatuses
  };
})();