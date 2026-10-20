/*
 * RockyX Admin Templates
 *
 * Local prototype for template moderation and management.
 *
 * IMPORTANT:
 * This module stores local demonstration records only.
 * It does not publish real templates, authorize creators,
 * process purchases, or grant Pro entitlements.
 *
 * Production permissions and decisions must be enforced
 * by a secure backend.
 */

(function () {
  "use strict";

  const TEMPLATES_KEY = "rockyx_admin_templates";
  const REPORTS_KEY = "rockyx_admin_template_reports";
  const AUDIT_KEY = "rockyx_admin_templates_audit";

  const STATUSES = [
    "pending",
    "approved",
    "rejected",
    "suspended",
    "removed"
  ];

  const ACCESS_TYPES = [
    "free",
    "pro"
  ];

  const REPORT_STATUSES = [
    "open",
    "reviewing",
    "resolved",
    "dismissed"
  ];

  function readStorage(key) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(
        "RockyX Admin Templates: storage read failed.",
        error
      );

      return [];
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(
        "RockyX Admin Templates: storage save failed.",
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
    const entries = readStorage(AUDIT_KEY);

    entries.push({
      id: createId("template_audit"),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local prototype log; not tamper-proof."
    });

    return saveStorage(AUDIT_KEY, entries);
  }

  function validateTemplate(details) {
    if (!details || typeof details !== "object") {
      return "Template details are required.";
    }

    if (
      typeof details.creatorId !== "string" ||
      !details.creatorId.trim()
    ) {
      return "A creator ID is required.";
    }

    if (
      typeof details.title !== "string" ||
      !details.title.trim()
    ) {
      return "A template title is required.";
    }

    if (details.title.trim().length > 150) {
      return "The title cannot exceed 150 characters.";
    }

    if (!ACCESS_TYPES.includes(details.access)) {
      return "Template access must be free or pro.";
    }

    return null;
  }

  /*
   * Creates a local template record for demonstration.
   * A real submission must verify the creator's eligibility
   * and upload template assets through a secure backend.
   */
  function createTemplate(details) {
    const error = validateTemplate(details);

    if (error) {
      return {
        success: false,
        message: error
      };
    }

    const templates = readStorage(TEMPLATES_KEY);

    const template = {
      id: createId("template"),
      creatorId: details.creatorId.trim(),
      title: cleanText(details.title, 150),
      description: cleanText(details.description || "", 3000),
      category: cleanText(details.category || "Other", 80),
      access: details.access,
      priceMinor: details.access === "pro"
        ? Math.max(0, Math.floor(Number(details.priceMinor) || 0))
        : 0,
      status: "pending",
      reportCount: 0,
      reviewReason: "",
      reviewedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Local demo record; not a published template."
    };

    templates.push(template);

    if (!saveStorage(TEMPLATES_KEY, templates)) {
      return {
        success: false,
        message: "Could not save the template record."
      };
    }

    recordAudit("template_created", {
      templateId: template.id,
      creatorId: template.creatorId,
      access: template.access
    });

    return {
      success: true,
      template: template,
      message: "Template record created locally."
    };
  }

  function getTemplate(templateId) {
    return readStorage(TEMPLATES_KEY).find(
      function (template) {
        return template.id === templateId;
      }
    ) || null;
  }

  function getTemplates(filters) {
    const options = filters || {};

    return readStorage(TEMPLATES_KEY).filter(
      function (template) {
        if (
          options.status &&
          template.status !== options.status
        ) {
          return false;
        }

        if (
          options.access &&
          template.access !== options.access
        ) {
          return false;
        }

        if (
          options.creatorId &&
          template.creatorId !== options.creatorId
        ) {
          return false;
        }

        if (
          options.category &&
          template.category.toLowerCase() !==
            String(options.category).toLowerCase()
        ) {
          return false;
        }

        if (options.search) {
          const query = String(options.search).toLowerCase();

          const searchable = [
            template.title,
            template.description,
            template.category,
            template.creatorId
          ].join(" ").toLowerCase();

          if (!searchable.includes(query)) {
            return false;
          }
        }

        return true;
      }
    );
  }

  /*
   * Records a moderation decision locally.
   * Approval here does not publish a real template.
   */
  function reviewTemplate(
    templateId,
    decision,
    reason,
    reviewerId
  ) {
    if (!["approved", "rejected"].includes(decision)) {
      return {
        success: false,
        message: "Choose approved or rejected."
      };
    }

    const templates = readStorage(TEMPLATES_KEY);

    const template = templates.find(function (item) {
      return item.id === templateId;
    });

    if (!template) {
      return {
        success: false,
        message: "Template not found."
      };
    }

    if (template.status !== "pending") {
      return {
        success: false,
        message: "Only pending templates can be reviewed."
      };
    }

    template.status = decision;
    template.reviewReason = cleanText(reason || "", 2000);
    template.reviewedBy = cleanText(reviewerId || "", 100) || null;
    template.updatedAt = new Date().toISOString();

    if (!saveStorage(TEMPLATES_KEY, templates)) {
      return {
        success: false,
        message: "Could not save the review decision."
      };
    }

    recordAudit("template_reviewed", {
      templateId: templateId,
      decision: decision,
      reviewerId: template.reviewedBy
    });

    return {
      success: true,
      template: template,
      message: "Moderation decision recorded locally.",
      note: "This does not publish or remove a real template."
    };
  }

  /*
   * Records an administrative status change.
   * Real visibility must be enforced by the backend.
   */
  function setTemplateStatus(
    templateId,
    status,
    reason,
    reviewerId
  ) {
    if (!STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid template status."
      };
    }

    const templates = readStorage(TEMPLATES_KEY);

    const template = templates.find(function (item) {
      return item.id === templateId;
    });

    if (!template) {
      return {
        success: false,
        message: "Template not found."
      };
    }

    template.status = status;
    template.reviewReason = cleanText(reason || "", 2000);
    template.reviewedBy = cleanText(reviewerId || "", 100) || null;
    template.updatedAt = new Date().toISOString();

    if (!saveStorage(TEMPLATES_KEY, templates)) {
      return {
        success: false,
        message: "Could not save the status change."
      };
    }

    recordAudit("template_status_changed", {
      templateId: templateId,
      status: status,
      reviewerId: template.reviewedBy
    });

    return {
      success: true,
      template: template,
      message: "Template status changed locally."
    };
  }

  /*
   * Change a template's free/Pro classification.
   * This does not charge users or enforce entitlements.
   */
  function setTemplateAccess(templateId, access, priceMinor) {
    if (!ACCESS_TYPES.includes(access)) {
      return {
        success: false,
        message: "Access must be free or pro."
      };
    }

    let price = 0;

    if (access === "pro") {
      price = Number(priceMinor);

      if (
        !Number.isSafeInteger(price) ||
        price < 0
      ) {
        return {
          success: false,
          message: "Pro template price must be a valid non-negative integer in minor currency units."
        };
      }
    }

    const templates = readStorage(TEMPLATES_KEY);

    const template = templates.find(function (item) {
      return item.id === templateId;
    });

    if (!template) {
      return {
        success: false,
        message: "Template not found."
      };
    }

    template.access = access;
    template.priceMinor = access === "pro" ? price : 0;
    template.updatedAt = new Date().toISOString();

    if (!saveStorage(TEMPLATES_KEY, templates)) {
      return {
        success: false,
        message: "Could not save access settings."
      };
    }

    recordAudit("template_access_changed", {
      templateId: templateId,
      access: access,
      priceMinor: template.priceMinor
    });

    return {
      success: true,
      template: template,
      message: "Template access updated locally.",
      note: "No payment or entitlement was created."
    };
  }

  /*
   * Create a local report for a template.
   */
  function reportTemplate(details) {
    if (
      !details ||
      typeof details.templateId !== "string" ||
      !details.templateId.trim()
    ) {
      return {
        success: false,
        message: "A template ID is required."
      };
    }

    const templates = readStorage(TEMPLATES_KEY);

    const template = templates.find(function (item) {
      return item.id === details.templateId;
    });

    if (!template) {
      return {
        success: false,
        message: "Template not found."
      };
    }

    const report = {
      id: createId("template_report"),
      templateId: details.templateId,
      reporterId: cleanText(details.reporterId || "", 100) || null,
      reason: cleanText(details.reason || "Other", 100),
      description: cleanText(details.description || "", 2000),
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Local report only; no real moderation action taken."
    };

    const reports = readStorage(REPORTS_KEY);
    reports.push(report);
    template.reportCount = (template.reportCount || 0) + 1;

    if (
      !saveStorage(REPORTS_KEY, reports) ||
      !saveStorage(TEMPLATES_KEY, templates)
    ) {
      return {
        success: false,
        message: "Could not save the report."
      };
    }

    recordAudit("template_report_created", {
      reportId: report.id,
      templateId: report.templateId
    });

    return {
      success: true,
      report: report,
      message: "Template report saved locally."
    };
  }

  function getReports(filters) {
    const options = filters || {};

    return readStorage(REPORTS_KEY).filter(
      function (report) {
        if (
          options.status &&
          report.status !== options.status
        ) {
          return false;
        }

        if (
          options.templateId &&
          report.templateId !== options.templateId
        ) {
          return false;
        }

        return true;
      }
    );
  }

  function updateReportStatus(reportId, status, reviewerId) {
    if (!REPORT_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid report status."
      };
    }

    const reports = readStorage(REPORTS_KEY);

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
    report.reviewedBy = cleanText(reviewerId || "", 100) || null;
    report.updatedAt = new Date().toISOString();

    if (!saveStorage(REPORTS_KEY, reports)) {
      return {
        success: false,
        message: "Could not update the report."
      };
    }

    recordAudit("template_report_status_changed", {
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

  function getSummary() {
    const templates = readStorage(TEMPLATES_KEY);
    const reports = readStorage(REPORTS_KEY);

    return {
      templates: {
        total: templates.length,
        pending: templates.filter(function (item) {
          return item.status === "pending";
        }).length,
        approved: templates.filter(function (item) {
          return item.status === "approved";
        }).length,
        rejected: templates.filter(function (item) {
          return item.status === "rejected";
        }).length,
        suspended: templates.filter(function (item) {
          return item.status === "suspended";
        }).length,
        free: templates.filter(function (item) {
          return item.access === "free";
        }).length,
        pro: templates.filter(function (item) {
          return item.access === "pro";
        }).length
      },

      reports: {
        total: reports.length,
        open: reports.filter(function (item) {
          return item.status === "open";
        }).length,
        reviewing: reports.filter(function (item) {
          return item.status === "reviewing";
        }).length,
        resolved: reports.filter(function (item) {
          return item.status === "resolved";
        }).length,
        dismissed: reports.filter(function (item) {
          return item.status === "dismissed";
        }).length
      },

      generatedAt: new Date().toISOString(),
      note: "Statistics include local prototype records only."
    };
  }

  function getAuditLog() {
    return readStorage(AUDIT_KEY).slice().reverse();
  }

  window.RockyXAdminTemplates = {
    createTemplate: createTemplate,
    getTemplate: getTemplate,
    getTemplates: getTemplates,
    reviewTemplate: reviewTemplate,
    setTemplateStatus: setTemplateStatus,
    setTemplateAccess: setTemplateAccess,
    reportTemplate: reportTemplate,
    getReports: getReports,
    updateReportStatus: updateReportStatus,
    getSummary: getSummary,
    getAuditLog: getAuditLog,

    getStatuses: function () {
      return STATUSES.slice();
    },

    getAccessTypes: function () {
      return ACCESS_TYPES.slice();
    },

    getReportStatuses: function () {
      return REPORT_STATUSES.slice();
    }
  };
})();