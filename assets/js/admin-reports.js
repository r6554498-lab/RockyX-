/* =====================================================
   ROCKYX ADMIN REPORTS
   Central reporting and summary foundation.
   LOCAL PROTOTYPE ONLY.
   Reports are not verified production analytics.
   ===================================================== */

(function () {
  "use strict";

  const REPORTS_KEY = "rockyx_admin_reports_v1";
  const SETTINGS_KEY = "rockyx_admin_reports_settings_v1";

  const REPORT_TYPES = [
    "overview",
    "users",
    "creators",
    "content",
    "finance",
    "marketplace",
    "advertising",
    "explore",
    "music",
    "security",
    "staff",
    "system"
  ];

  const DEFAULT_SETTINGS = {
    defaultPeriodDays: 30,
    includeDemoData: true,
    lastUpdated: null
  };

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("RockyX Reports: Storage read failed.", error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("RockyX Reports: Storage write failed.", error);
      return false;
    }
  }

  function makeId() {
    return "report_" +
      Date.now().toString(36) + "_" +
      Math.random().toString(36).slice(2, 10);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function cleanText(value, maxLength) {
    return String(value || "")
      .trim()
      .slice(0, maxLength || 300);
  }

  function getSettings() {
    return Object.assign(
      {},
      DEFAULT_SETTINGS,
      readJSON(SETTINGS_KEY, {})
    );
  }

  function getSavedReports() {
    const reports = readJSON(REPORTS_KEY, []);
    return Array.isArray(reports) ? reports : [];
  }

  /*
   * Read local data from another RockyX module.
   * Missing modules return null; no real data is invented.
   */
  function readModule(globalName, methodName, argument) {
    try {
      const module = window[globalName];

      if (
        !module ||
        typeof module[methodName] !== "function"
      ) {
        return null;
      }

      return module[methodName](argument);
    } catch (error) {
      console.warn(
        "RockyX Reports: Could not read " + globalName,
        error
      );

      return null;
    }
  }

  function countBy(items, key) {
    const result = {};

    if (!Array.isArray(items)) {
      return result;
    }

    items.forEach(function (item) {
      const value = item && item[key] != null
        ? String(item[key])
        : "unknown";

      result[value] = (result[value] || 0) + 1;
    });

    return result;
  }

  function getDateRange(options) {
    options = options || {};

    const settings = getSettings();
    const days = Number(
      options.days || settings.defaultPeriodDays
    );

    if (
      !Number.isInteger(days) ||
      days < 1 ||
      days > 3650
    ) {
      return {
        success: false,
        error: "Choose a reporting period from 1 to 3650 days."
      };
    }

    const end = options.to
      ? new Date(options.to)
      : new Date();

    const start = options.from
      ? new Date(options.from)
      : new Date(end.getTime() - days * 86400000);

    if (
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime()) ||
      start > end
    ) {
      return {
        success: false,
        error: "The report date range is invalid."
      };
    }

    return {
      success: true,
      from: start.toISOString(),
      to: end.toISOString(),
      days: Math.ceil(
        (end.getTime() - start.getTime()) / 86400000
      )
    };
  }

  function filterByDate(items, range, dateField) {
    if (!Array.isArray(items)) {
      return [];
    }

    const start = new Date(range.from).getTime();
    const end = new Date(range.to).getTime();

    return items.filter(function (item) {
      const raw = item && item[dateField];
      const timestamp = new Date(raw).getTime();

      return (
        Number.isFinite(timestamp) &&
        timestamp >= start &&
        timestamp <= end
      );
    });
  }

  function getAvailableSources() {
    return {
      staff: Boolean(window.RockyXAdminStaff),
      security: Boolean(window.RockyXAdminSecurity),
      finance: Boolean(window.RockyXAdminFinance),
      audit: Boolean(window.RockyXAdminAudit),
      demoOnly: true
    };
  }

  function getOverview(options) {
    const range = getDateRange(options);

    if (!range.success) {
      return range;
    }

    const staffSummary = readModule(
      "RockyXAdminStaff",
      "getSummary"
    );

    const securitySummary = readModule(
      "RockyXAdminSecurity",
      "getSummary"
    );

    const financeSummary = readModule(
      "RockyXAdminFinance",
      "getSummary"
    );

    const auditSummary = readModule(
      "RockyXAdminAudit",
      "getSummary"
    );

    return {
      reportType: "overview",
      period: range,
      generatedAt: nowISO(),
      dataSources: getAvailableSources(),

      sections: {
        staff: staffSummary,
        security: securitySummary,
        finance: financeSummary,
        audit: auditSummary
      },

      note: "Only data exposed by available local modules is included. Missing data is returned as null, not estimated.",
      demoOnly: true
    };
  }

  function getStaffReport(options) {
    const range = getDateRange(options);

    if (!range.success) {
      return range;
    }

    const records = readModule(
      "RockyXAdminStaff",
      "listStaff"
    );

    if (!Array.isArray(records)) {
      return {
        reportType: "staff",
        period: range,
        available: false,
        message: "The staff module is not loaded.",
        demoOnly: true
      };
    }

    const created = filterByDate(
      records,
      range,
      "createdAt"
    );

    return {
      reportType: "staff",
      period: range,
      totalStaffRecords: records.length,
      createdDuringPeriod: created.length,
      byRole: countBy(records, "role"),
      byStatus: countBy(records, "status"),
      byTeam: countBy(records, "teamId"),
      demoOnly: true
    };
  }

  function getSecurityReport(options) {
    const range = getDateRange(options);

    if (!range.success) {
      return range;
    }

    const incidents = readModule(
      "RockyXAdminSecurity",
      "listIncidents"
    );

    if (!Array.isArray(incidents)) {
      return {
        reportType: "security",
        period: range,
        available: false,
        message: "The security module is not loaded.",
        demoOnly: true
      };
    }

    const periodIncidents = filterByDate(
      incidents,
      range,
      "createdAt"
    );

    return {
      reportType: "security",
      period: range,
      incidentsCreatedDuringPeriod: periodIncidents.length,
      bySeverity: countBy(periodIncidents, "severity"),
      byStatus: countBy(periodIncidents, "status"),
      byType: countBy(periodIncidents, "type"),
      demoOnly: true
    };
  }

  function getFinanceReport(options) {
    const range = getDateRange(options);

    if (!range.success) {
      return range;
    }

    const records = readModule(
      "RockyXAdminFinance",
      "listRecords"
    );

    if (!Array.isArray(records)) {
      return {
        reportType: "finance",
        period: range,
        available: false,
        message: "The finance module is not loaded.",
        demoOnly: true
      };
    }

    const periodRecords = filterByDate(
      records,
      range,
      "createdAt"
    );

    const currencies = {};

    periodRecords.forEach(function (record) {
      if (
        !record ||
        !Number.isSafeInteger(record.amountMinor) ||
        record.amountMinor < 0 ||
        !record.currency
      ) {
        return;
      }

      const currency = record.currency;

      if (!currencies[currency]) {
        currencies[currency] = {
          currency: currency,
          recordCount: 0,
          amountByStatusMinor: {},
          amountByTypeMinor: {}
        };
      }

      const summary = currencies[currency];

      summary.recordCount += 1;

      summary.amountByStatusMinor[record.status] =
        (summary.amountByStatusMinor[record.status] || 0) +
        record.amountMinor;

      summary.amountByTypeMinor[record.type] =
        (summary.amountByTypeMinor[record.type] || 0) +
        record.amountMinor;
    });

    return {
      reportType: "finance",
      period: range,
      recordCount: periodRecords.length,
      byStatus: countBy(periodRecords, "status"),
      byType: countBy(periodRecords, "type"),
      currencies: currencies,
      note: "These are local finance records, not verified revenue or completed payments.",
      demoOnly: true
    };
  }

  function getAuditReport(options) {
    const range = getDateRange(options);

    if (!range.success) {
      return range;
    }

    const records = readModule(
      "RockyXAdminAudit",
      "listRecords"
    );

    if (!Array.isArray(records)) {
      return {
        reportType: "audit",
        period: range,
        available: false,
        message: "The audit module is not loaded.",
        demoOnly: true
      };
    }

    const periodRecords = filterByDate(
      records,
      range,
      "timestamp"
    );

    return {
      reportType: "audit",
      period: range,
      totalEvents: periodRecords.length,
      byCategory: countBy(periodRecords, "category"),
      bySeverity: countBy(periodRecords, "severity"),
      byOutcome: countBy(periodRecords, "outcome"),
      demoOnly: true
    };
  }

  function generateReport(type, options) {
    if (!REPORT_TYPES.includes(type)) {
      return {
        success: false,
        error: "Unsupported report type."
      };
    }

    options = options || {};

    let data;

    switch (type) {
      case "overview":
        data = getOverview(options);
        break;

      case "staff":
        data = getStaffReport(options);
        break;

      case "security":
        data = getSecurityReport(options);
        break;

      case "finance":
        data = getFinanceReport(options);
        break;

      case "system":
        data = {
          reportType: "system",
          period: getDateRange(options),
          dataSources: getAvailableSources(),
          generatedAt: nowISO(),
          demoOnly: true
        };
        break;

      default:
        data = {
          reportType: type,
          period: getDateRange(options),
          available: false,
          message: "A connected data source for this report has not been implemented.",
          demoOnly: true
        };
    }

    if (data && data.success === false) {
      return data;
    }

    return {
      success: true,
      report: data,
      demoOnly: true
    };
  }

  function saveReport(type, title, options, actorReference) {
    const result = generateReport(type, options);

    if (!result.success) {
      return result;
    }

    const reports = getSavedReports();

    const saved = {
      id: makeId(),
      type: type,
      title: cleanText(title, 160) || type + " report",
      generatedAt: nowISO(),
      generatedBy: cleanText(actorReference, 100) || "local-demo",
      report: result.report,
      environment: "local-demo"
    };

    reports.unshift(saved);

    if (!writeJSON(REPORTS_KEY, reports.slice(0, 500))) {
      return {
        success: false,
        error: "Could not save the report."
      };
    }

    return {
      success: true,
      savedReport: saved,
      demoOnly: true
    };
  }

  function listSavedReports(filters) {
    filters = filters || {};

    let reports = getSavedReports();

    if (filters.type) {
      reports = reports.filter(function (report) {
        return report.type === filters.type;
      });
    }

    if (filters.search) {
      const query = cleanText(filters.search, 200).toLowerCase();

      reports = reports.filter(function (report) {
        return report.title.toLowerCase().includes(query);
      });
    }

    return reports;
  }

  function getSavedReport(reportId) {
    return getSavedReports().find(function (report) {
      return report.id === reportId;
    }) || null;
  }

  function deleteSavedReport(reportId) {
    const reports = getSavedReports();

    const next = reports.filter(function (report) {
      return report.id !== reportId;
    });

    if (next.length === reports.length) {
      return {
        success: false,
        error: "Saved report not found."
      };
    }

    if (!writeJSON(REPORTS_KEY, next)) {
      return {
        success: false,
        error: "Could not delete the report."
      };
    }

    return {
      success: true,
      demoOnly: true
    };
  }

  function saveSettings(changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        error: "Provide report settings."
      };
    }

    const current = getSettings();
    const next = Object.assign({}, current);

    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        "defaultPeriodDays"
      )
    ) {
      const days = Number(changes.defaultPeriodDays);

      if (
        !Number.isInteger(days) ||
        days < 1 ||
        days > 3650
      ) {
        return {
          success: false,
          error: "Default period must be between 1 and 3650 days."
        };
      }

      next.defaultPeriodDays = days;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        changes,
        "includeDemoData"
      )
    ) {
      if (typeof changes.includeDemoData !== "boolean") {
        return {
          success: false,
          error: "includeDemoData must be true or false."
        };
      }

      next.includeDemoData = changes.includeDemoData;
    }

    next.lastUpdated = nowISO();

    if (!writeJSON(SETTINGS_KEY, next)) {
      return {
        success: false,
        error: "Could not save report settings."
      };
    }

    return {
      success: true,
      settings: next,
      demoOnly: true
    };
  }

  function exportReport(reportId) {
    const report = getSavedReport(reportId);

    if (!report) {
      return {
        success: false,
        error: "Saved report not found."
      };
    }

    return {
      success: true,
      exportedAt: nowISO(),
      environment: "local-demo",
      report: report,
      warning: "Prototype data only. Do not use this as a verified business or financial statement."
    };
  }

  window.RockyXAdminReports = {
    version: "1.0.0",
    demoOnly: true,

    reportTypes: REPORT_TYPES.slice(),

    getSettings: getSettings,
    saveSettings: saveSettings,

    getAvailableSources: getAvailableSources,
    generateReport: generateReport,

    getOverview: getOverview,
    getStaffReport: getStaffReport,
    getSecurityReport: getSecurityReport,
    getFinanceReport: getFinanceReport,
    getAuditReport: getAuditReport,

    saveReport: saveReport,
    listSavedReports: listSavedReports,
    getSavedReport: getSavedReport,
    deleteSavedReport: deleteSavedReport,
    exportReport: exportReport
  };

  console.log(
    "RockyX Admin Reports loaded. Local prototype only."
  );
})();