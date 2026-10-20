/*
 * RockyX Admin Disputes
 *
 * Local prototype for reviewing marketplace disputes.
 *
 * IMPORTANT:
 * This module does not provide secure admin access.
 * Real dispute decisions must be authorized and recorded
 * by a trusted backend.
 */

(function () {
  "use strict";

  const AUDIT_KEY = "rockyx_admin_disputes_audit";

  function getDisputesModule() {
    return window.RockyXDisputes || null;
  }

  function readAudit() {
    try {
      return JSON.parse(
        localStorage.getItem(AUDIT_KEY) || "[]"
      );
    } catch (error) {
      console.error("RockyX dispute audit error:", error);
      return [];
    }
  }

  function saveAudit(records) {
    try {
      localStorage.setItem(
        AUDIT_KEY,
        JSON.stringify(records)
      );
      return true;
    } catch (error) {
      console.error("RockyX dispute audit save error:", error);
      return false;
    }
  }

  function recordAction(action, details) {
    const records = readAudit();

    records.push({
      id: "admin_dispute_audit_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local prototype audit record; not tamper-proof."
    });

    return saveAudit(records);
  }

  /*
   * Retrieve disputes from the existing dispute module.
   */
  function getDisputes(filters) {
    const module = getDisputesModule();

    if (!module) {
      return {
        success: false,
        message: "The disputes module is not loaded."
      };
    }

    return {
      success: true,
      disputes: module.getAllDisputes(filters || {})
    };
  }

  function getDisputeDetails(disputeId) {
    const module = getDisputesModule();

    if (!module) {
      return {
        success: false,
        message: "The disputes module is not loaded."
      };
    }

    const dispute = module.getDispute(disputeId);

    if (!dispute) {
      return {
        success: false,
        message: "Dispute not found."
      };
    }

    return {
      success: true,
      dispute: dispute
    };
  }

  /*
   * Prototype-only review action.
   * Production use requires authenticated admin permissions.
   */
  function resolveDispute(disputeId, outcome, notes) {
    const module = getDisputesModule();

    if (!module) {
      return {
        success: false,
        message: "The disputes module is not loaded."
      };
    }

    const result = module.resolveDispute(
      disputeId,
      outcome,
      notes || ""
    );

    if (result.success) {
      recordAction("dispute_resolution_recorded", {
        disputeId: disputeId,
        outcome: outcome,
        notes: notes || ""
      });
    }

    return result;
  }

  function closeDispute(disputeId, notes) {
    const module = getDisputesModule();

    if (!module) {
      return {
        success: false,
        message: "The disputes module is not loaded."
      };
    }

    const result = module.closeDispute(
      disputeId,
      notes || ""
    );

    if (result.success) {
      recordAction("dispute_closed", {
        disputeId: disputeId,
        notes: notes || ""
      });
    }

    return result;
  }

  /*
   * Calculate summary counts from locally stored disputes.
   */
  function getDisputeSummary() {
    const module = getDisputesModule();

    if (!module) {
      return {
        success: false,
        message: "The disputes module is not loaded."
      };
    }

    const disputes = module.getAllDisputes();

    const summary = {
      total: disputes.length,
      open: 0,
      underReview: 0,
      awaitingResponse: 0,
      awaitingEvidence: 0,
      escalated: 0,
      resolvedForBuyer: 0,
      resolvedForSeller: 0,
      resolvedByAgreement: 0,
      closed: 0
    };

    disputes.forEach(function (dispute) {
      switch (dispute.status) {
        case "open":
          summary.open++;
          break;

        case "under_review":
          summary.underReview++;
          break;

        case "awaiting_response":
          summary.awaitingResponse++;
          break;

        case "awaiting_evidence":
          summary.awaitingEvidence++;
          break;

        case "escalated":
          summary.escalated++;
          break;

        case "resolved_for_buyer":
          summary.resolvedForBuyer++;
          break;

        case "resolved_for_seller":
          summary.resolvedForSeller++;
          break;

        case "resolved_by_agreement":
          summary.resolvedByAgreement++;
          break;

        case "closed":
          summary.closed++;
          break;
      }
    });

    return {
      success: true,
      summary: summary,
      generatedAt: new Date().toISOString(),
      note: "Counts reflect local prototype records only."
    };
  }

  function getAuditLog() {
    return readAudit().slice().reverse();
  }

  window.RockyXAdminDisputes = {
    getDisputes: getDisputes,
    getDisputeDetails: getDisputeDetails,
    resolveDispute: resolveDispute,
    closeDispute: closeDispute,
    getDisputeSummary: getDisputeSummary,
    getAuditLog: getAuditLog
  };
})();