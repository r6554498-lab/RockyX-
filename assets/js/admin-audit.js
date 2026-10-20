/* =====================================================
   ROCKYX ADMIN AUDIT LOG
   Centralized audit-record foundation.
   LOCAL PROTOTYPE ONLY.
   Production audit logs must be server-controlled.
   ===================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_admin_audit_records_v1";
  const SETTINGS_KEY = "rockyx_admin_audit_settings_v1";

  const CATEGORIES = [
    "authentication",
    "staff",
    "users",
    "security",
    "content",
    "creators",
    "templates",
    "finance",
    "marketplace",
    "advertising",
    "explore",
    "music",
    "settings",
    "system",
    "other"
  ];

  const SEVERITIES = [
    "info",
    "warning",
    "high",
    "critical"
  ];

  const DEFAULT_SETTINGS = {
    retentionDays: 180,
    recordSuccessfulActions: true,
    recordFailedActions: true,
    lastUpdated: null
  };

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("RockyX Audit: Storage read failed.", error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("RockyX Audit: Storage write failed.", error);
      return false;
    }
  }

  function makeId() {
    return "audit_" +
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

  function getRecords() {
    const records = readJSON(STORAGE_KEY, []);
    return Array.isArray(records) ? records : [];
  }

  function getSettings() {
    return Object.assign(
      {},
      DEFAULT_SETTINGS,
      readJSON(SETTINGS_KEY, {})
    );
  }

  /*
   * Record an administrative action.
   *
   * Never include passwords, access tokens, payment
   * secrets, private message contents, or unnecessary
   * personal information in audit records.
   */
  function recordAction(input) {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Provide audit event details."
      };
    }

    const action = cleanText(input.action, 120);
    const category = cleanText(input.category, 50);
    const severity = cleanText(input.severity || "info", 30);
    const outcome = cleanText(input.outcome || "success", 30);

    if (!action) {
      return {
        success: false,
        error: "Action name is required."
      };
    }

    if (!CATEGORIES.includes(category)) {
      return {
        success: false,
        error: "Unsupported audit category."
      };
    }

    if (!SEVERITIES.includes(severity)) {
      return {
        success: false,
        error: "Unsupported severity."
      };
    }

    if (!["success", "failed", "blocked", "unknown"].includes(outcome)) {
      return {
        success: false,
        error: "Unsupported outcome."
      };
    }

    const settings = getSettings();

    if (
      outcome === "success" &&
      !settings.recordSuccessfulActions
    ) {
      return {
        success: false,
        skipped: true,
        error: "Successful actions are disabled in local settings."
      };
    }

    if (
      outcome === "failed" &&
      !settings.recordFailedActions
    ) {
      return {
        success: false,
        skipped: true,
        error: "Failed actions are disabled in local settings."
      };
    }

    /*
     * Only accept explicitly allowed fields.
     * Do not copy arbitrary input objects into the log.
     */
    const entry = {
      id: makeId(),
      action: action,
      category: category,
      severity: severity,
      outcome: outcome,
      actorReference: cleanText(input.actorReference, 100) || null,
      targetType: cleanText(input.targetType, 80) || null,
      targetReference: cleanText(input.targetReference, 100) || null,
      description: cleanText(input.description, 500),
      changeSummary: cleanText(input.changeSummary, 500),
      timestamp: nowISO(),
      environment: "local-demo"
    };

    const records = getRecords();
    records.unshift(entry);

    if (!writeJSON(STORAGE_KEY, records)) {
      return {
        success: false,
        error: "Could not save the audit event."
      };
    }

    return {
      success: true,
      entry: entry,
      demoOnly: true,
      warning: "This record is stored locally and can be modified or deleted by someone with access to this browser."
    };
  }

  function listRecords(filters) {
    filters = filters || {};

    let records = getRecords();

    if (filters.category) {
      records = records.filter(function (entry) {
        return entry.category === filters.category;
      });
    }

    if (filters.severity) {
      records = records.filter(function (entry) {
        return entry.severity === filters.severity;
      });
    }

    if (filters.outcome) {
      records = records.filter(function (entry) {
        return entry.outcome === filters.outcome;
      });
    }

    if (filters.actorReference) {
      records = records.filter(function (entry) {
        return entry.actorReference === filters.actorReference;
      });
    }

    if (filters.targetReference) {
      records = records.filter(function (entry) {
        return entry.targetReference === filters.targetReference;
      });
    }

    if (filters.action) {
      records = records.filter(function (entry) {
        return entry.action === filters.action;
      });
    }

    if (filters.from) {
      const from = new Date(filters.from).getTime();

      if (Number.isFinite(from)) {
        records = records.filter(function (entry) {
          return new Date(entry.timestamp).getTime() >= from;
        });
      }
    }

    if (filters.to) {
      const to = new Date(filters.to).getTime();

      if (Number.isFinite(to)) {
        records = records.filter(function (entry) {
          return new Date(entry.timestamp).getTime() <= to;
        });
      }
    }

    if (filters.search) {
      const query = cleanText(filters.search, 200).toLowerCase();

      records = records.filter(function (entry) {
        return [
          entry.action,
          entry.category,
          entry.description,
          entry.changeSummary,
          entry.actorReference,
          entry.targetReference
        ].some(function (value) {
          return String(value || "").toLowerCase().includes(query);
        });
      });
    }

    const limit = Number(filters.limit);

    if (Number.isInteger(limit) && limit > 0) {
      records = records.slice(0, Math.min(limit, 1000));
    }

    return records;
  }

  function getRecord(recordId) {
    return getRecords().find(function (entry) {
      return entry.id === recordId;
    }) || null;
  }

  function getSummary() {
    const records = getRecords();

    const summary = {
      total: records.length,
      byCategory: {},
      bySeverity: {},
      byOutcome: {},
      criticalCount: 0,
      failedCount: 0,
      latestTimestamp: records.length
        ? records[0].timestamp
        : null,
      generatedAt: nowISO(),
      demoOnly: true
    };

    records.forEach(function (entry) {
      summary.byCategory[entry.category] =
        (summary.byCategory[entry.category] || 0) + 1;

      summary.bySeverity[entry.severity] =
        (summary.bySeverity[entry.severity] || 0) + 1;

      summary.byOutcome[entry.outcome] =
        (summary.byOutcome[entry.outcome] || 0) + 1;

      if (entry.severity === "critical") {
        summary.criticalCount += 1;
      }

      if (entry.outcome === "failed") {
        summary.failedCount += 1;
      }
    });

    return summary;
  }

  function saveSettings(changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        error: "Provide audit settings."
      };
    }

    const current = getSettings();
    const next = Object.assign({}, current);

    const booleanKeys = [
      "recordSuccessfulActions",
      "recordFailedActions"
    ];

    for (const key of booleanKeys) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        if (typeof changes[key] !== "boolean") {
          return {
            success: false,
            error: key + " must be true or false."
          };
        }

        next[key] = changes[key];
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(changes, "retentionDays")
    ) {
      const days = Number(changes.retentionDays);

      if (
        !Number.isInteger(days) ||
        days < 1 ||
        days > 3650
      ) {
        return {
          success: false,
          error: "Retention must be between 1 and 3650 days."
        };
      }

      next.retentionDays = days;
    }

    next.lastUpdated = nowISO();

    if (!writeJSON(SETTINGS_KEY, next)) {
      return {
        success: false,
        error: "Could not save audit settings."
      };
    }

    return {
      success: true,
      settings: next,
      demoOnly: true,
      warning: "These settings do not configure server-side audit retention."
    };
  }

  /*
   * Local cleanup for prototype data only.
   * Production retention must be enforced on the server
   * according to legal and business requirements.
   */
  function pruneLocalRecords() {
    const settings = getSettings();
    const cutoff = Date.now() -
      settings.retentionDays * 24 * 60 * 60 * 1000;

    const records = getRecords();

    const kept = records.filter(function (entry) {
      const timestamp = new Date(entry.timestamp).getTime();

      return Number.isFinite(timestamp) && timestamp >= cutoff;
    });

    const removedCount = records.length - kept.length;

    if (!writeJSON(STORAGE_KEY, kept)) {
      return {
        success: false,
        error: "Could not update local audit records."
      };
    }

    return {
      success: true,
      removedCount: removedCount,
      remainingCount: kept.length,
      demoOnly: true
    };
  }

  function exportRecords(filters) {
    return {
      exportedAt: nowISO(),
      environment: "local-demo",
      filters: filters || {},
      records: listRecords(filters),
      warning: "Prototype export only. It is not a tamper-proof or official audit report."
    };
  }

  window.RockyXAdminAudit = {
    version: "1.0.0",
    demoOnly: true,

    categories: CATEGORIES.slice(),
    severities: SEVERITIES.slice(),

    recordAction: recordAction,
    listRecords: listRecords,
    getRecord: getRecord,
    getSummary: getSummary,

    getSettings: getSettings,
    saveSettings: saveSettings,

    pruneLocalRecords: pruneLocalRecords,
    exportRecords: exportRecords
  };

  console.log(
    "RockyX Admin Audit loaded. Local prototype only."
  );
})();