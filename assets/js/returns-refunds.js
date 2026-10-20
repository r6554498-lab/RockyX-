/*
 * RockyX Returns & Refunds
 *
 * Local prototype for marketplace returns, refund requests,
 * seller responses, and dispute reviews.
 *
 * IMPORTANT:
 * This module does not issue real refunds or transfer money.
 * Production actions must be verified and authorized by
 * a secure backend and the payment provider.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_returns_refunds";

  const RETURN_STATUSES = [
    "requested",
    "seller_review",
    "approved",
    "rejected",
    "return_shipped",
    "item_received",
    "completed",
    "disputed",
    "cancelled"
  ];

  const REFUND_STATUSES = [
    "not_requested",
    "requested",
    "under_review",
    "approved",
    "processing",
    "completed",
    "rejected",
    "failed"
  ];

  const REASONS = [
    "damaged",
    "defective",
    "wrong_item",
    "missing_items",
    "not_as_described",
    "changed_mind",
    "other"
  ];

  function readRecords() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
    } catch (error) {
      console.error("RockyX returns storage error:", error);
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
      console.error("RockyX returns save error:", error);
      return false;
    }
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function isValidAmount(amountMinor) {
    return Number.isSafeInteger(amountMinor) &&
      amountMinor >= 0;
  }

  /*
   * Buyer creates a return request.
   * orderId and user IDs are references only in this prototype.
   * The backend must verify order ownership and eligibility.
   */
  function createReturnRequest(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Return details are required."
      };
    }

    if (
      typeof details.orderId !== "string" ||
      !details.orderId.trim()
    ) {
      return {
        success: false,
        message: "An order ID is required."
      };
    }

    if (
      typeof details.buyerId !== "string" ||
      !details.buyerId.trim()
    ) {
      return {
        success: false,
        message: "A buyer ID is required."
      };
    }

    if (
      typeof details.productId !== "string" ||
      !details.productId.trim()
    ) {
      return {
        success: false,
        message: "A product ID is required."
      };
    }

    if (
      typeof details.reason !== "string" ||
      !REASONS.includes(details.reason)
    ) {
      return {
        success: false,
        message: "Choose a valid return reason."
      };
    }

    if (
      !Number.isSafeInteger(details.quantity) ||
      details.quantity < 1
    ) {
      return {
        success: false,
        message: "Return quantity must be at least one."
      };
    }

    if (!isValidAmount(details.requestedRefundMinor)) {
      return {
        success: false,
        message: "Requested refund must be a non-negative integer in minor units."
      };
    }

    const records = readRecords();

    const request = {
      id: createId("return"),
      orderId: details.orderId.trim(),
      buyerId: details.buyerId.trim(),
      sellerId: details.sellerId || null,
      productId: details.productId.trim(),
      quantity: details.quantity,
      reason: details.reason,
      description: details.description || "",
      requestedRefundMinor: details.requestedRefundMinor,
      currency: details.currency || "GHS",
      returnStatus: "requested",
      refundStatus: "requested",
      sellerResponse: "",
      adminNotes: "",
      trackingReference: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Prototype request only. Order eligibility and refund amount are not verified."
    };

    records.push(request);

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not save the return request."
      };
    }

    return {
      success: true,
      request: request,
      message: "Return request recorded locally."
    };
  }

  function getReturnRequest(requestId) {
    return readRecords().find(function (request) {
      return request.id === requestId;
    }) || null;
  }

  function getBuyerRequests(buyerId) {
    return readRecords().filter(function (request) {
      return request.buyerId === buyerId;
    });
  }

  function getSellerRequests(sellerId) {
    return readRecords().filter(function (request) {
      return request.sellerId === sellerId;
    });
  }

  function getOrderRequests(orderId) {
    return readRecords().filter(function (request) {
      return request.orderId === orderId;
    });
  }

  function getAllRequests(filters) {
    const options = filters || {};

    return readRecords().filter(function (request) {
      if (
        options.returnStatus &&
        request.returnStatus !== options.returnStatus
      ) {
        return false;
      }

      if (
        options.refundStatus &&
        request.refundStatus !== options.refundStatus
      ) {
        return false;
      }

      if (
        options.orderId &&
        request.orderId !== options.orderId
      ) {
        return false;
      }

      return true;
    });
  }

  /*
   * Seller response prototype.
   * Production code must verify seller ownership server-side.
   */
  function respondAsSeller(requestId, sellerId, response, decision) {
    const allowedDecisions = [
      "approve",
      "reject",
      "request_information"
    ];

    if (!allowedDecisions.includes(decision)) {
      return {
        success: false,
        message: "Invalid seller decision."
      };
    }

    const records = readRecords();

    const request = records.find(function (item) {
      return item.id === requestId &&
        item.sellerId === sellerId;
    });

    if (!request) {
      return {
        success: false,
        message: "Return request not found for this seller."
      };
    }

    if (
      request.returnStatus === "completed" ||
      request.returnStatus === "cancelled"
    ) {
      return {
        success: false,
        message: "This return request is already closed."
      };
    }

    request.sellerResponse = response || "";
    request.updatedAt = new Date().toISOString();

    if (decision === "approve") {
      request.returnStatus = "approved";
      request.refundStatus = "under_review";
    } else if (decision === "reject") {
      request.returnStatus = "rejected";
      request.refundStatus = "rejected";
    } else {
      request.returnStatus = "seller_review";
    }

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not save the seller response."
      };
    }

    return {
      success: true,
      request: request,
      message: "Seller response recorded locally."
    };
  }

  /*
   * Record return shipment tracking information.
   */
  function recordReturnShipment(requestId, buyerId, trackingReference) {
    if (
      typeof trackingReference !== "string" ||
      !trackingReference.trim()
    ) {
      return {
        success: false,
        message: "A tracking reference is required."
      };
    }

    const records = readRecords();

    const request = records.find(function (item) {
      return item.id === requestId &&
        item.buyerId === buyerId;
    });

    if (!request) {
      return {
        success: false,
        message: "Return request not found for this buyer."
      };
    }

    if (request.returnStatus !== "approved") {
      return {
        success: false,
        message: "The return must be approved before shipping."
      };
    }

    request.trackingReference = trackingReference.trim();
    request.returnStatus = "return_shipped";
    request.updatedAt = new Date().toISOString();

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not save tracking information."
      };
    }

    return {
      success: true,
      request: request,
      message: "Return tracking recorded locally."
    };
  }

  /*
   * Prototype-only admin review.
   * Real review decisions must require backend authorization.
   */
  function reviewRequest(requestId, decision, notes) {
    const allowedDecisions = [
      "approve_refund",
      "reject_refund",
      "mark_item_received",
      "open_dispute",
      "close_dispute"
    ];

    if (!allowedDecisions.includes(decision)) {
      return {
        success: false,
        message: "Invalid review decision."
      };
    }

    const records = readRecords();

    const request = records.find(function (item) {
      return item.id === requestId;
    });

    if (!request) {
      return {
        success: false,
        message: "Return request not found."
      };
    }

    request.adminNotes = notes || "";
    request.updatedAt = new Date().toISOString();

    if (decision === "approve_refund") {
      request.refundStatus = "approved";
    }

    if (decision === "reject_refund") {
      request.refundStatus = "rejected";
    }

    if (decision === "mark_item_received") {
      request.returnStatus = "item_received";
    }

    if (decision === "open_dispute") {
      request.returnStatus = "disputed";
    }

    if (decision === "close_dispute") {
      request.returnStatus = "seller_review";
    }

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not save the review decision."
      };
    }

    return {
      success: true,
      request: request,
      message: "Review decision recorded locally."
    };
  }

  /*
   * Mark a refund as completed only for demo tracking.
   * This does not issue or verify an actual refund.
   */
  function recordRefundResult(requestId, status, reference) {
    const allowedStatuses = [
      "processing",
      "completed",
      "failed"
    ];

    if (!allowedStatuses.includes(status)) {
      return {
        success: false,
        message: "Invalid refund result status."
      };
    }

    const records = readRecords();

    const request = records.find(function (item) {
      return item.id === requestId;
    });

    if (!request) {
      return {
        success: false,
        message: "Return request not found."
      };
    }

    if (request.refundStatus !== "approved") {
      return {
        success: false,
        message: "The refund must be approved first."
      };
    }

    request.refundStatus = status;
    request.refundReference = reference || null;
    request.updatedAt = new Date().toISOString();

    if (status === "completed") {
      request.returnStatus = "completed";
    }

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not save the refund result."
      };
    }

    return {
      success: true,
      request: request,
      message: "Demo refund status updated. No money was transferred."
    };
  }

  function cancelRequest(requestId, buyerId) {
    const records = readRecords();

    const request = records.find(function (item) {
      return item.id === requestId &&
        item.buyerId === buyerId;
    });

    if (!request) {
      return {
        success: false,
        message: "Return request not found for this buyer."
      };
    }

    if (
      !["requested", "seller_review"].includes(
        request.returnStatus
      )
    ) {
      return {
        success: false,
        message: "This request can no longer be cancelled."
      };
    }

    request.returnStatus = "cancelled";
    request.refundStatus = "not_requested";
    request.updatedAt = new Date().toISOString();

    if (!saveRecords(records)) {
      return {
        success: false,
        message: "Could not cancel the request."
      };
    }

    return {
      success: true,
      request: request,
      message: "Return request cancelled locally."
    };
  }

  window.RockyXReturnsRefunds = {
    createReturnRequest: createReturnRequest,
    getReturnRequest: getReturnRequest,
    getBuyerRequests: getBuyerRequests,
    getSellerRequests: getSellerRequests,
    getOrderRequests: getOrderRequests,
    getAllRequests: getAllRequests,
    respondAsSeller: respondAsSeller,
    recordReturnShipment: recordReturnShipment,
    reviewRequest: reviewRequest,
    recordRefundResult: recordRefundResult,
    cancelRequest: cancelRequest,
    getReturnStatuses: function () {
      return RETURN_STATUSES.slice();
    },
    getRefundStatuses: function () {
      return REFUND_STATUSES.slice();
    },
    getReasons: function () {
      return REASONS.slice();
    }
  };
})();