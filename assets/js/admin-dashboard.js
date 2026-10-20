/* =========================================
   ROCKYX ADMIN DASHBOARD
   Local prototype — NOT production security
   ========================================= */

(function () {
  "use strict";

  const REPORTS_KEY = "rockyx_admin_reports";
  const MODERATION_KEY = "rockyx_admin_moderation_log";

  function readStorage(key, fallback) {
    try {
      return JSON.parse(
        localStorage.getItem(key) || JSON.stringify(fallback)
      );
    } catch (error) {
      return fallback;
    }
  }

  function readReports() {
    const data = readStorage(REPORTS_KEY, []);
    return Array.isArray(data) ? data : [];
  }

  function readModerationLog() {
    const data = readStorage(MODERATION_KEY, []);
    return Array.isArray(data) ? data : [];
  }

  function saveReports(reports) {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));

    window.dispatchEvent(
      new CustomEvent("rockyx:admin-reports-updated", {
        detail: { count: reports.length }
      })
    );

    return reports;
  }

  function saveModerationLog(entries) {
    localStorage.setItem(
      MODERATION_KEY,
      JSON.stringify(entries.slice(0, 500))
    );
  }

  function countLocalRecords(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data) ? data.length : 0;
    } catch (error) {
      return 0;
    }
  }

  function getPlatformOverview() {
    return {
      marketplaceProducts: countLocalRecords(
        "rockyx_marketplace_products"
      ),
      sellerProfiles: countLocalRecords(
        "rockyx_marketplace_sellers"
      ),
      marketplaceOrders: countLocalRecords(
        "rockyx_marketplace_orders"
      ),
      marketplacePayments: countLocalRecords(
        "rockyx_marketplace_payments"
      ),
      marketplaceReviews: countLocalRecords(
        "rockyx_marketplace_reviews"
      ),
      reports: readReports().length,
      pendingReports: readReports().filter(
        report => report.status === "pending"
      ).length,
      generatedAt: new Date().toISOString(),

      dataScope: "Current browser only",
      productionReady: false
    };
  }

  function createReport(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        message: "Report information is required."
      };
    }

    const reporterId = String(data.reporterId || "").trim();
    const targetType = String(data.targetType || "").trim();
    const targetId = String(data.targetId || "").trim();
    const reason = String(data.reason || "").trim();

    if (!reporterId || !targetType || !targetId || !reason) {
      return {
        success: false,
        message: "Reporter, target type, target ID, and reason are required."
      };
    }

    const report = {
      id: "rxreport_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      reporterId,
      targetType,
      targetId,
      reason,
      description: String(data.description || "").trim(),

      status: "pending",
      resolutionNote: "",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const reports = readReports();
    reports.unshift(report);
    saveReports(reports);

    return {
      success: true,
      report
    };
  }

  function getReports(options) {
    options = options || {};

    let reports = readReports();

    if (options.status) {
      reports = reports.filter(
        report => report.status === String(options.status)
      );
    }

    if (options.targetType) {
      reports = reports.filter(
        report => report.targetType === String(options.targetType)
      );
    }

    return reports;
  }

  /*
   * Prototype only.
   * This function does not establish admin identity.
   * Production authorization must be enforced by a backend.
   */
  function resolveReport(reportId, decision, note) {
    const allowedDecisions = [
      "reviewed",
      "action_taken",
      "dismissed"
    ];

    if (!allowedDecisions.includes(decision)) {
      return {
        success: false,
        message: "Choose a valid report resolution."
      };
    }

    const reports = readReports();
    const report = reports.find(item =>
      item.id === String(reportId)
    );

    if (!report) {
      return {
        success: false,
        message: "Report not found."
      };
    }

    report.status = decision;
    report.resolutionNote = String(note || "");
    report.updatedAt = new Date().toISOString();

    saveReports(reports);

    const log = readModerationLog();

    log.unshift({
      id: "rxmod_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 8),

      action: "resolve_report",
      reportId: report.id,
      decision,
      note: String(note || ""),
      createdAt: new Date().toISOString()
    });

    saveModerationLog(log);

    return {
      success: true,
      report
    };
  }

  function getModerationLog(limit) {
    const maxResults = Math.max(1, Number(limit) || 50);

    return readModerationLog().slice(0, maxResults);
  }

  function getModuleStatus() {
    return {
      marketplace: Boolean(window.RockyXMarketplace),
      sellerProfiles: Boolean(window.RockyXSellerProfiles),
      orders: Boolean(window.RockyXOrders),
      payments: Boolean(window.RockyXPayments),
      reviews: Boolean(window.RockyXReviews),
      inventory: Boolean(window.RockyXInventory),
      sellerDashboard: Boolean(window.RockyXSellerDashboard),
      productionAuthentication: false,
      serverSideAuthorization: false
    };
  }

  window.RockyXAdminDashboard = {
    getPlatformOverview,
    createReport,
    getReports,
    resolveReport,
    getModerationLog,
    getModuleStatus
  };

  console.log("RockyX Admin Dashboard module loaded.");
})();