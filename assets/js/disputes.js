/*
 * RockyX Disputes
 *
 * Local prototype for marketplace dispute management.
 *
 * IMPORTANT:
 * This module does not issue refunds or enforce legal decisions.
 * Production disputes require secure backend authorization,
 * protected evidence storage, and an auditable review process.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_disputes";

  const STATUSES = [
    "open",
    "under_review",
    "awaiting_response",
    "awaiting_evidence",
    "resolved_for_buyer",
    "resolved_for_seller",
    "resolved_by_agreement",
    "escalated",
    "closed"
  ];

  const CATEGORIES = [
    "item_not_received",
    "item_damaged",
    "item_not_as_described",
    "wrong_item",
    "refund_problem",
    "payment_problem",
    "seller_problem",
    "buyer_problem",
    "delivery_problem",
    "other"
  ];

  function readDisputes() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
    } catch (error) {
      console.error("RockyX dispute storage error:", error);
      return [];
    }
  }

  function saveDisputes(disputes) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(disputes)
      );
      return true;
    } catch (error) {
      console.error("RockyX dispute save error:", error);
      return false;
    }
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  /*
   * Open a dispute.
   * The backend must verify order ownership and eligibility.
   */
  function createDispute(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Dispute details are required."
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
      typeof details.openedBy !== "string" ||
      !details.openedBy.trim()
    ) {
      return {
        success: false,
        message: "The user opening the dispute is required."
      };
    }

    if (
      !CATEGORIES.includes(details.category)
    ) {
      return {
        success: false,
        message: "Choose a valid dispute category."
      };
    }

    if (
      typeof details.description !== "string" ||
      !details.description.trim()
    ) {
      return {
        success: false,
        message: "Describe the problem."
      };
    }

    const disputes = readDisputes();

    const existing = disputes.find(function (dispute) {
      return dispute.orderId === details.orderId.trim() &&
        dispute.openedBy === details.openedBy.trim() &&
        ![
          "resolved_for_buyer",
          "resolved_for_seller",
          "resolved_by_agreement",
          "closed"
        ].includes(dispute.status);
    });

    if (existing) {
      return {
        success: false,
        message: "An unresolved dispute already exists for this user and order.",
        dispute: existing
      };
    }

    const dispute = {
      id: createId("dispute"),
      orderId: details.orderId.trim(),
      returnRequestId: details.returnRequestId || null,
      openedBy: details.openedBy.trim(),
      buyerId: details.buyerId || null,
      sellerId: details.sellerId || null,
      category: details.category,
      description: details.description.trim(),
      requestedResolution: details.requestedResolution || "",
      requestedAmountMinor:
        Number.isSafeInteger(details.requestedAmountMinor) &&
        details.requestedAmountMinor >= 0
          ? details.requestedAmountMinor
          : null,
      currency: details.currency || "GHS",
      status: "open",
      responses: [],
      evidenceReferences: [],
      resolution: null,
      adminNotes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      note: "Local prototype. Order ownership and dispute claims are not verified."
    };

    disputes.push(dispute);

    if (!saveDisputes(disputes)) {
      return {
        success: false,
        message: "Could not save the dispute."
      };
    }

    return {
      success: true,
      dispute: dispute,
      message: "Dispute recorded locally."
    };
  }

  function getDispute(disputeId) {
    return readDisputes().find(function (dispute) {
      return dispute.id === disputeId;
    }) || null;
  }

  function getUserDisputes(userId) {
    return readDisputes().filter(function (dispute) {
      return dispute.openedBy === userId ||
        dispute.buyerId === userId ||
        dispute.sellerId === userId;
    });
  }

  function getOrderDisputes(orderId) {
    return readDisputes().filter(function (dispute) {
      return dispute.orderId === orderId;
    });
  }

  function getAllDisputes(filters) {
    const options = filters || {};

    return readDisputes().filter(function (dispute) {
      if (
        options.status &&
        dispute.status !== options.status
      ) {
        return false;
      }

      if (
        options.category &&
        dispute.category !== options.category
      ) {
        return false;
      }

      if (
        options.orderId &&
        dispute.orderId !== options.orderId
      ) {
        return false;
      }

      return true;
    });
  }

  /*
   * Add a response to a dispute.
   * Production code must confirm that the responder is
   * authorized to participate in the case.
   */
  function addResponse(disputeId, userId, message) {
    if (
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      return {
        success: false,
        message: "A responder ID is required."
      };
    }

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return {
        success: false,
        message: "A response message is required."
      };
    }

    const disputes = readDisputes();

    const dispute = disputes.find(function (item) {
      return item.id === disputeId;
    });

    if (!dispute) {
      return {
        success: false,
        message: "Dispute not found."
      };
    }

    if (
      [
        "resolved_for_buyer",
        "resolved_for_seller",
        "resolved_by_agreement",
        "closed"
      ].includes(dispute.status)
    ) {
      return {
        success: false,
        message: "This dispute is closed."
      };
    }

    dispute.responses.push({
      id: createId("response"),
      userId: userId.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString()
    });

    dispute.status = "under_review";
    dispute.updatedAt = new Date().toISOString();

    if (!saveDisputes(disputes)) {
      return {
        success: false,
        message: "Could not save the response."
      };
    }

    return {
      success: true,
      dispute: dispute,
      message: "Response recorded locally."
    };
  }

  /*
   * Store a reference to evidence.
   * Do not put private documents or sensitive files
   * directly into localStorage.
   */
  function addEvidenceReference(
    disputeId,
    userId,
    reference,
    description
  ) {
    if (
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      return {
        success: false,
        message: "A user ID is required."
      };
    }

    if (
      typeof reference !== "string" ||
      !reference.trim()
    ) {
      return {
        success: false,
        message: "An evidence reference is required."
      };
    }

    const disputes = readDisputes();

    const dispute = disputes.find(function (item) {
      return item.id === disputeId;
    });

    if (!dispute) {
      return {
        success: false,
        message: "Dispute not found."
      };
    }

    if (
      [
        "resolved_for_buyer",
        "resolved_for_seller",
        "resolved_by_agreement",
        "closed"
      ].includes(dispute.status)
    ) {
      return {
        success: false,
        message: "Evidence cannot be added to a closed dispute."
      };
    }

    dispute.evidenceReferences.push({
      id: createId("evidence"),
      submittedBy: userId.trim(),
      reference: reference.trim(),
      description: description || "",
      submittedAt: new Date().toISOString()
    });

    dispute.status = "under_review";
    dispute.updatedAt = new Date().toISOString();

    if (!saveDisputes(disputes)) {
      return {
        success: false,
        message: "Could not save the evidence reference."
      };
    }

    return {
      success: true,
      dispute: dispute,
      message: "Evidence reference recorded locally."
    };
  }

  /*
   * Prototype-only administrative resolution.
   * Real resolutions require secure admin authorization.
   */
  function resolveDispute(disputeId, outcome, notes) {
    const outcomes = [
      "resolved_for_buyer",
      "resolved_for_seller",
      "resolved_by_agreement",
      "escalated"
    ];

    if (!outcomes.includes(outcome)) {
      return {
        success: false,
        message: "Invalid dispute outcome."
      };
    }

    const disputes = readDisputes();

    const dispute = disputes.find(function (item) {
      return item.id === disputeId;
    });

    if (!dispute) {
      return {
        success: false,
        message: "Dispute not found."
      };
    }

    if (
      [
        "resolved_for_buyer",
        "resolved_for_seller",
        "resolved_by_agreement",
        "closed"
      ].includes(dispute.status)
    ) {
      return {
        success: false,
        message: "This dispute is already closed."
      };
    }

    dispute.status = outcome;
    dispute.adminNotes = notes || "";
    dispute.resolution = {
      outcome: outcome,
      notes: notes || "",
      recordedAt: new Date().toISOString(),
      note: "Prototype resolution only; no refund or payment action was performed."
    };
    dispute.updatedAt = new Date().toISOString();

    if (outcome !== "escalated") {
      dispute.resolvedAt = new Date().toISOString();
    }

    if (!saveDisputes(disputes)) {
      return {
        success: false,
        message: "Could not save the resolution."
      };
    }

    return {
      success: true,
      dispute: dispute,
      message: "Dispute outcome recorded locally."
    };
  }

  function closeDispute(disputeId, notes) {
    const disputes = readDisputes();

    const dispute = disputes.find(function (item) {
      return item.id === disputeId;
    });

    if (!dispute) {
      return {
        success: false,
        message: "Dispute not found."
      };
    }

    dispute.status = "closed";
    dispute.adminNotes = notes || dispute.adminNotes;
    dispute.updatedAt = new Date().toISOString();
    dispute.resolvedAt = dispute.resolvedAt ||
      new Date().toISOString();

    if (!saveDisputes(disputes)) {
      return {
        success: false,
        message: "Could not close the dispute."
      };
    }

    return {
      success: true,
      dispute: dispute,
      message: "Dispute closed in the local prototype."
    };
  }

  window.RockyXDisputes = {
    createDispute: createDispute,
    getDispute: getDispute,
    getUserDisputes: getUserDisputes,
    getOrderDisputes: getOrderDisputes,
    getAllDisputes: getAllDisputes,
    addResponse: addResponse,
    addEvidenceReference: addEvidenceReference,
    resolveDispute: resolveDispute,
    closeDispute: closeDispute,
    getStatuses: function () {
      return STATUSES.slice();
    },
    getCategories: function () {
      return CATEGORIES.slice();
    }
  };
})();