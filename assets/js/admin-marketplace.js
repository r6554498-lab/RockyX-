/*
 * RockyX Admin Marketplace
 *
 * Local prototype for marketplace administration.
 *
 * IMPORTANT:
 * This module stores administrative records in the browser.
 * It does not connect to real orders, sellers, products,
 * payments, or shipping providers.
 *
 * Production actions must be authenticated and enforced
 * through secure backend services and database policies.
 */

(function () {
  "use strict";

  const REPORTS_KEY = "rockyx_admin_marketplace_reports";
  const AUDIT_KEY = "rockyx_admin_marketplace_audit";
  const SETTINGS_KEY = "rockyx_admin_marketplace_settings";
  const ACTIONS_KEY = "rockyx_admin_marketplace_actions";

  const REPORT_TYPES = [
    "product",
    "seller",
    "order",
    "return",
    "shipping",
    "coupon"
  ];

  const REPORT_STATUSES = [
    "open",
    "reviewing",
    "resolved",
    "dismissed"
  ];

  const ACTION_TYPES = [
    "product_review",
    "seller_review",
    "order_review",
    "return_review",
    "shipping_review",
    "coupon_review"
  ];

  const DEFAULT_SETTINGS = {
    marketplaceEnabled: true,
    productListingsEnabled: true,
    sellerApplicationsEnabled: true,
    reviewsEnabled: true,
    returnsEnabled: true,
    couponsEnabled: true,
    defaultCommissionPercent: 10,
    requireProductReview: true,
    requireSellerReview: true
  };

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "null"
      );

      return value === null ? fallback : value;
    } catch (error) {
      console.error(
        "RockyX Admin Marketplace: storage read failed.",
        error
      );

      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(
        "RockyX Admin Marketplace: storage save failed.",
        error
      );

      return false;
    }
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function cleanText(value, limit) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim().slice(0, limit);
  }

  function recordAudit(action, details) {
    const audit = readStorage(AUDIT_KEY, []);

    if (!Array.isArray(audit)) {
      return false;
    }

    audit.push({
      id: createId("marketplace_audit"),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local prototype log; not tamper-proof."
    });

    return saveStorage(AUDIT_KEY, audit);
  }

  function getSettings() {
    const saved = readStorage(SETTINGS_KEY, {});

    return Object.assign(
      {},
      DEFAULT_SETTINGS,
      saved
    );
  }

  /*
   * Record a marketplace report for administrative review.
   * This does not automatically remove or suspend anything.
   */
  function createReport(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Report details are required."
      };
    }

    if (!REPORT_TYPES.includes(details.type)) {
      return {
        success: false,
        message: "Choose a supported report type."
      };
    }

    const targetId = cleanText(details.targetId, 150);

    if (!targetId) {
      return {
        success: false,
        message: "A product, seller, order, or record ID is required."
      };
    }

    const reports = readStorage(REPORTS_KEY, []);

    if (!Array.isArray(reports)) {
      return {
        success: false,
        message: "Report storage is invalid."
      };
    }

    const report = {
      id: createId("marketplace_report"),
      type: details.type,
      targetId: targetId,
      reporterId: cleanText(details.reporterId || "", 150) || null,
      reason: cleanText(details.reason || "Other", 150),
      description: cleanText(details.description || "", 3000),
      status: "open",
      reviewedBy: null,
      resolution: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Local report only; no real account or listing action taken."
    };

    reports.push(report);

    if (!saveStorage(REPORTS_KEY, reports)) {
      return {
        success: false,
        message: "Could not save the report."
      };
    }

    recordAudit("marketplace_report_created", {
      reportId: report.id,
      type: report.type,
      targetId: report.targetId
    });

    return {
      success: true,
      report: report,
      message: "Marketplace report saved locally."
    };
  }

  function getReport(reportId) {
    return readStorage(REPORTS_KEY, []).find(
      function (report) {
        return report.id === reportId;
      }
    ) || null;
  }

  function getReports(filters) {
    const options = filters || {};

    return readStorage(REPORTS_KEY, []).filter(
      function (report) {
        if (
          options.type &&
          report.type !== options.type
        ) {
          return false;
        }

        if (
          options.status &&
          report.status !== options.status
        ) {
          return false;
        }

        if (
          options.targetId &&
          report.targetId !== options.targetId
        ) {
          return false;
        }

        return true;
      }
    );
  }

  function updateReportStatus(
    reportId,
    status,
    reviewerId,
    resolution
  ) {
    if (!REPORT_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid report status."
      };
    }

    const reports = readStorage(REPORTS_KEY, []);

    const report = reports.find(function (item) {
      return item.id === reportId;
    });

    if (!report) {
      return {
        success: false,
        message: "Report not found."
      };
    }

    report.status = status;
    report.reviewedBy =
      cleanText(reviewerId || "", 150) || null;
    report.resolution = cleanText(resolution || "", 2000);
    report.updatedAt = new Date().toISOString();

    if (!saveStorage(REPORTS_KEY, reports)) {
      return {
        success: false,
        message: "Could not update the report."
      };
    }

    recordAudit("marketplace_report_status_changed", {
      reportId: reportId,
      status: status,
      reviewerId: report.reviewedBy
    });

    return {
      success: true,
      report: report,
      message: "Report status updated locally."
    };
  }

  /*
   * Record a proposed review of a product or seller.
   * This does not update the real marketplace listing or profile.
   */
  function recordReview(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Review details are required."
      };
    }

    if (
      !["product_review", "seller_review"].includes(details.type)
    ) {
      return {
        success: false,
        message: "Choose a product or seller review."
      };
    }

    const targetId = cleanText(details.targetId, 150);

    if (!targetId) {
      return {
        success: false,
        message: "A product or seller ID is required."
      };
    }

    const action = {
      id: createId("marketplace_action"),
      type: details.type,
      targetId: targetId,
      decision: cleanText(details.decision || "reviewed", 80),
      reason: cleanText(details.reason || "", 2000),
      reviewerId: cleanText(details.reviewerId || "", 150) || null,
      createdAt: new Date().toISOString(),
      note: "Administrative review record only."
    };

    const actions = readStorage(ACTIONS_KEY, []);
    actions.push(action);

    if (!saveStorage(ACTIONS_KEY, actions)) {
      return {
        success: false,
        message: "Could not save the review record."
      };
    }

    recordAudit("marketplace_review_recorded", {
      reviewId: action.id,
      type: action.type,
      targetId: action.targetId,
      decision: action.decision
    });

    return {
      success: true,
      action: action,
      message: "Review record saved locally."
    };
  }

  /*
   * Update local marketplace configuration.
   * These settings do not control the live marketplace.
   */
  function updateSettings(changes) {
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return {
        success: false,
        message: "Settings changes are required."
      };
    }

    const current = getSettings();
    const updated = Object.assign({}, current);
    const allowed = Object.keys(DEFAULT_SETTINGS);

    for (const key of Object.keys(changes)) {
      if (!allowed.includes(key)) {
        return {
          success: false,
          message: "Unsupported setting: " + key
        };
      }

      const value = changes[key];

      if (key === "defaultCommissionPercent") {
        if (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value < 0 ||
          value > 50
        ) {
          return {
            success: false,
            message: "Commission must be between 0 and 50 percent."
          };
        }
      } else if (typeof value !== "boolean") {
        return {
          success: false,
          message: key + " must be true or false."
        };
      }

      updated[key] = value;
    }

    if (!saveStorage(SETTINGS_KEY, updated)) {
      return {
        success: false,
        message: "Could not save marketplace settings."
      };
    }

    recordAudit("marketplace_settings_updated", {
      fields: Object.keys(changes)
    });

    return {
      success: true,
      settings: updated,
      message: "Marketplace settings saved locally.",
      note: "No live marketplace settings were changed."
    };
  }

  /*
   * Create an illustrative commission preview.
   * This does not calculate or allocate real seller payments.
   */
  function calculateCommissionPreview(amountMinor, categoryRate) {
    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor < 0
    ) {
      return {
        success: false,
        message: "Amount must be a non-negative integer in minor currency units."
      };
    }

    const rate = categoryRate === undefined
      ? getSettings().defaultCommissionPercent
      : categoryRate;

    if (
      typeof rate !== "number" ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 50
    ) {
      return {
        success: false,
        message: "Commission rate must be between 0 and 50 percent."
      };
    }

    const commissionMinor = Math.round(
      amountMinor * rate / 100
    );

    return {
      success: true,
      grossAmountMinor: amountMinor,
      commissionRatePercent: rate,
      platformCommissionMinor: commissionMinor,
      sellerAmountBeforeOtherFeesMinor:
        amountMinor - commissionMinor,
      note: "Illustrative preview only; not a financial allocation."
    };
  }

  /*
   * Record an administrative action related to an order,
   * return, shipping record, or coupon.
   */
  function recordOperationalAction(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Action details are required."
      };
    }

    if (
      !ACTION_TYPES.includes(details.type) ||
      ["product_review", "seller_review"].includes(details.type)
    ) {
      return {
        success: false,
        message: "Choose a supported operational action."
      };
    }

    const targetId = cleanText(details.targetId, 150);

    if (!targetId) {
      return {
        success: false,
        message: "A target record ID is required."
      };
    }

    const action = {
      id: createId("marketplace_action"),
      type: details.type,
      targetId: targetId,
      decision: cleanText(details.decision || "reviewed", 80),
      reason: cleanText(details.reason || "", 2000),
      reviewerId: cleanText(details.reviewerId || "", 150) || null,
      createdAt: new Date().toISOString(),
      note: "Local administrative record; no real transaction changed."
    };

    const actions = readStorage(ACTIONS_KEY, []);
    actions.push(action);

    if (!saveStorage(ACTIONS_KEY, actions)) {
      return {
        success: false,
        message: "Could not save the action record."
      };
    }

    recordAudit("marketplace_operational_action_recorded", {
      actionId: action.id,
      type: action.type,
      targetId: action.targetId
    });

    return {
      success: true,
      action: action,
      message: "Operational review record saved locally."
    };
  }

  function getActionRecords(filters) {
    const options = filters || {};

    return readStorage(ACTIONS_KEY, []).filter(
      function (action) {
        if (
          options.type &&
          action.type !== options.type
        ) {
          return false;
        }

        if (
          options.targetId &&
          action.targetId !== options.targetId
        ) {
          return false;
        }

        return true;
      }
    );
  }

  function getSummary() {
    const reports = readStorage(REPORTS_KEY, []);
    const actions = readStorage(ACTIONS_KEY, []);

    const reportSummary = {
      total: reports.length,
      open: 0,
      reviewing: 0,
      resolved: 0,
      dismissed: 0
    };

    reports.forEach(function (report) {
      if (
        Object.prototype.hasOwnProperty.call(
          reportSummary,
          report.status
        )
      ) {
        reportSummary[report.status]++;
      }
    });

    const actionCounts = {};

    actions.forEach(function (action) {
      actionCounts[action.type] =
        (actionCounts[action.type] || 0) + 1;
    });

    return {
      reports: reportSummary,
      administrativeActions: {
        total: actions.length,
        byType: actionCounts
      },
      settings: getSettings(),
      generatedAt: new Date().toISOString(),
      note: "Local prototype statistics only."
    };
  }

  function getAuditLog() {
    return readStorage(AUDIT_KEY, []).slice().reverse();
  }

  window.RockyXAdminMarketplace = {
    createReport: createReport,
    getReport: getReport,
    getReports: getReports,
    updateReportStatus: updateReportStatus,
    recordReview: recordReview,
    recordOperationalAction: recordOperationalAction,
    getActionRecords: getActionRecords,
    getSettings: getSettings,
    updateSettings: updateSettings,
    calculateCommissionPreview: calculateCommissionPreview,
    getSummary: getSummary,
    getAuditLog: getAuditLog,

    getReportTypes: function () {
      return REPORT_TYPES.slice();
    },

    getReportStatuses: function () {
      return REPORT_STATUSES.slice();
    },

    getActionTypes: function () {
      return ACTION_TYPES.slice();
    }
  };
})();