/*
 * RockyX Admin Commissions
 *
 * Foundation for managing marketplace commission settings.
 *
 * SECURITY:
 * This is a frontend prototype, NOT secure admin access.
 * Real commission changes must be authorized and saved
 * by a trusted backend.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_admin_commission_audit";

  function getEngine() {
    return window.RockyXCommissionEngine || null;
  }

  function readAudit() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
    } catch (error) {
      console.error("RockyX audit storage error:", error);
      return [];
    }
  }

  function saveAudit(records) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(records)
      );
      return true;
    } catch (error) {
      console.error("RockyX audit save error:", error);
      return false;
    }
  }

  function recordAction(action, details) {
    const records = readAudit();

    records.push({
      id: "commission_audit_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local prototype audit record; not tamper-proof."
    });

    return saveAudit(records);
  }

  function getSettings() {
    const engine = getEngine();

    if (!engine) {
      return {
        success: false,
        message: "Commission engine is not loaded."
      };
    }

    return {
      success: true,
      settings: engine.getSettings()
    };
  }

  /*
   * These methods are for development previews only.
   * Do not expose them as trusted production admin actions.
   */

  function previewDefaultRate(ratePercent) {
    const engine = getEngine();

    if (!engine) {
      return {
        success: false,
        message: "Commission engine is not loaded."
      };
    }

    const result = engine.setDefaultRate(ratePercent);

    if (result.success) {
      recordAction("preview_default_rate_changed", {
        ratePercent: ratePercent
      });
    }

    return result;
  }

  function previewCategoryRate(category, ratePercent) {
    const engine = getEngine();

    if (!engine) {
      return {
        success: false,
        message: "Commission engine is not loaded."
      };
    }

    const result = engine.setCategoryRate(
      category,
      ratePercent
    );

    if (result.success) {
      recordAction("preview_category_rate_changed", {
        category: category,
        ratePercent: ratePercent
      });
    }

    return result;
  }

  function previewRemoveCategoryRate(category) {
    const engine = getEngine();

    if (!engine) {
      return {
        success: false,
        message: "Commission engine is not loaded."
      };
    }

    const result = engine.removeCategoryRate(category);

    if (result.success) {
      recordAction("preview_category_rate_removed", {
        category: category
      });
    }

    return result;
  }

  function calculatePreview(amountMinor, category) {
    const engine = getEngine();

    if (!engine) {
      return {
        success: false,
        message: "Commission engine is not loaded."
      };
    }

    return engine.calculate(amountMinor, category);
  }

  function getAuditLog() {
    return readAudit().slice().reverse();
  }

  function clearLocalAuditLog() {
    const saved = saveAudit([]);

    return {
      success: saved,
      message: saved
        ? "Local prototype audit log cleared."
        : "Could not clear the audit log."
    };
  }

  window.RockyXAdminCommissions = {
    getSettings: getSettings,
    previewDefaultRate: previewDefaultRate,
    previewCategoryRate: previewCategoryRate,
    previewRemoveCategoryRate: previewRemoveCategoryRate,
    calculatePreview: calculatePreview,
    getAuditLog: getAuditLog,
    clearLocalAuditLog: clearLocalAuditLog
  };
})();