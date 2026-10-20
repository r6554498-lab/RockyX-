/* =========================================
   ROCKYX CONTENT MODERATION
   Reports, review queues, and audit logs
   ========================================= */

(function () {
  "use strict";

  const REPORTS_KEY = "rockyx_moderation_reports";
  const ACTIONS_KEY = "rockyx_moderation_actions";

  const CONTENT_TYPES = [
    "video",
    "post",
    "comment",
    "livestream",
    "music",
    "template",
    "product",
    "profile",
    "message"
  ];

  const REPORT_REASONS = [
    "spam",
    "harassment",
    "hate",
    "violence",
    "sexual_content",
    "misinformation",
    "copyright",
    "scam",
    "unsafe_product",
    "other"
  ];

  const REPORT_STATUSES = [
    "pending",
    "reviewing",
    "resolved",
    "dismissed"
  ];

  function load(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function createId(prefix) {
    return prefix + "_" +
      Date.now() + "_" +
      Math.random().toString(36).slice(2, 9);
  }

  function getCurrentUser() {
    if (window.RockyXUserAccounts) {
      return window.RockyXUserAccounts.getCurrentUser();
    }

    return null;
  }

  function submitReport(options) {
    options = options || {};

    const user = getCurrentUser();
    const reporterId = options.reporterId || (user && user.id);

    const contentType = String(options.contentType || "");
    const contentId = String(options.contentId || "");
    const reason = String(options.reason || "");
    const details = String(options.details || "").trim();

    if (!reporterId) {
      return {
        success: false,
        message: "A user profile is required to submit a report."
      };
    }

    if (!CONTENT_TYPES.includes(contentType)) {
      return {
        success: false,
        message: "Unsupported content type."
      };
    }

    if (!contentId) {
      return {
        success: false,
        message: "A content ID is required."
      };
    }

    if (!REPORT_REASONS.includes(reason)) {
      return {
        success: false,
        message: "Please select a valid report reason."
      };
    }

    if (details.length > 2000) {
      return {
        success: false,
        message: "Report details cannot exceed 2,000 characters."
      };
    }

    const reports = load(REPORTS_KEY);

    const duplicate = reports.some(function (report) {
      return (
        report.reporterId === String(reporterId) &&
        report.contentType === contentType &&
        report.contentId === contentId &&
        report.status !== "dismissed"
      );
    });

    if (duplicate) {
      return {
        success: false,
        message: "You have already reported this content."
      };
    }

    const report = {
      id: createId("report"),
      reporterId: String(reporterId),
      contentType: contentType,
      contentId: contentId,
      reason: reason,
      details: details,
      status: "pending",
      moderatorId: null,
      decision: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reports.push(report);
    save(REPORTS_KEY, reports);

    return {
      success: true,
      report: report,
      message: "Report saved for review in this browser."
    };
  }

  function getReports(options) {
    options = options || {};

    let reports = load(REPORTS_KEY);

    if (options.status) {
      reports = reports.filter(function (report) {
        return report.status === options.status;
      });
    }

    if (options.contentType) {
      reports = reports.filter(function (report) {
        return report.contentType === options.contentType;
      });
    }

    if (options.reason) {
      reports = reports.filter(function (report) {
        return report.reason === options.reason;
      });
    }

    return reports.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function getReport(reportId) {
    return load(REPORTS_KEY).find(function (report) {
      return report.id === reportId;
    }) || null;
  }

  function recordAction(options) {
    options = options || {};

    const moderator = getCurrentUser();
    const moderatorId = options.moderatorId || (moderator && moderator.id);

    if (!moderatorId) {
      return {
        success: false,
        message: "A moderator identity is required."
      };
    }

    const allowedActions = [
      "review_started",
      "content_hidden",
      "content_restored",
      "content_removed",
      "account_warned",
      "account_suspended",
      "report_resolved",
      "report_dismissed"
    ];

    if (!allowedActions.includes(options.action)) {
      return {
        success: false,
        message: "Unsupported moderation action."
      };
    }

    const actions = load(ACTIONS_KEY);

    const entry = {
      id: createId("action"),
      moderatorId: String(moderatorId),
      reportId: options.reportId || null,
      contentType: options.contentType || null,
      contentId: options.contentId || null,
      action: options.action,
      reason: String(options.reason || "").trim().slice(0, 2000),
      createdAt: new Date().toISOString()
    };

    actions.push(entry);
    save(ACTIONS_KEY, actions);

    return {
      success: true,
      action: entry
    };
  }

  function updateReport(reportId, status, decision, moderatorId) {
    if (!REPORT_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid report status."
      };
    }

    if (status === "resolved" || status === "dismissed") {
      if (!String(decision || "").trim()) {
        return {
          success: false,
          message: "Please provide a decision note."
        };
      }
    }

    const reports = load(REPORTS_KEY);

    const report = reports.find(function (item) {
      return item.id === reportId;
    });

    if (!report) {
      return {
        success: false,
        message: "Report not found."
      };
    }

    const previousStatus = report.status;

    report.status = status;
    report.decision = String(decision || "").trim().slice(0, 2000);
    report.moderatorId = moderatorId ? String(moderatorId) : null;
    report.updatedAt = new Date().toISOString();

    save(REPORTS_KEY, reports);

    const actionByStatus = {
      reviewing: "review_started",
      resolved: "report_resolved",
      dismissed: "report_dismissed"
    };

    if (actionByStatus[status]) {
      recordAction({
        moderatorId: moderatorId,
        reportId: report.id,
        contentType: report.contentType,
        contentId: report.contentId,
        action: actionByStatus[status],
        reason: report.decision
      });
    }

    return {
      success: true,
      previousStatus: previousStatus,
      report: report
    };
  }

  function getModerationLog(options) {
    options = options || {};

    let actions = load(ACTIONS_KEY);

    if (options.moderatorId) {
      actions = actions.filter(function (action) {
        return action.moderatorId === String(options.moderatorId);
      });
    }

    if (options.contentId) {
      actions = actions.filter(function (action) {
        return action.contentId === String(options.contentId);
      });
    }

    return actions.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function getSummary() {
    const reports = load(REPORTS_KEY);

    const summary = {
      total: reports.length,
      pending: 0,
      reviewing: 0,
      resolved: 0,
      dismissed: 0
    };

    reports.forEach(function (report) {
      if (Object.prototype.hasOwnProperty.call(summary, report.status)) {
        summary[report.status]++;
      }
    });

    return summary;
  }

  window.RockyXContentModeration = {
    submitReport: submitReport,
    getReports: getReports,
    getReport: getReport,
    updateReport: updateReport,
    recordAction: recordAction,
    getModerationLog: getModerationLog,
    getSummary: getSummary,
    getContentTypes: function () {
      return CONTENT_TYPES.slice();
    },
    getReportReasons: function () {
      return REPORT_REASONS.slice();
    },
    getReportStatuses: function () {
      return REPORT_STATUSES.slice();
    }
  };

})();