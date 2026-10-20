/* =====================================================
   ROCKYX ADMIN FINANCE
   Local finance records and review foundation.
   Demo only: does not transfer money or process payments.
   ===================================================== */

(function () {
  "use strict";

  const RECORDS_KEY = "rockyx_admin_finance_records_v1";
  const SETTINGS_KEY = "rockyx_admin_finance_settings_v1";
  const AUDIT_KEY = "rockyx_admin_finance_audit_v1";

  const RECORD_TYPES = [
    "payment",
    "platform_commission",
    "seller_payout",
    "creator_payout",
    "template_earning",
    "subscription",
    "refund"
  ];

  const RECORD_STATUSES = [
    "pending",
    "under_review",
    "approved",
    "rejected",
    "completed",
    "failed",
    "cancelled"
  ];

  const DEFAULT_SETTINGS = {
    defaultCurrency: "GHS",
    commissionRatePercent: 10,
    requireReviewForPayouts: true,
    requireReviewForRefunds: true,
    allowDemoRecords: true,
    lastUpdated: null
  };

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("RockyX Finance: Could not read storage.", error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("RockyX Finance: Could not save storage.", error);
      return false;
    }
  }

  function makeId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function getRecords() {
    const records = readJSON(RECORDS_KEY, []);
    return Array.isArray(records) ? records : [];
  }

  function getAuditLog() {
    const entries = readJSON(AUDIT_KEY, []);
    return Array.isArray(entries) ? entries : [];
  }

  function addAuditEntry(action, recordId, details) {
    const log = getAuditLog();

    log.unshift({
      id: makeId("audit"),
      action: String(action),
      recordId: recordId || null,
      details: String(details || ""),
      timestamp: nowISO(),
      environment: "local-demo"
    });

    return writeJSON(AUDIT_KEY, log.slice(0, 1000));
  }

  function validCurrency(currency) {
    return (
      typeof currency === "string" &&
      /^[A-Z]{3}$/.test(currency.trim().toUpperCase())
    );
  }

  function validAmount(amountMinor) {
    return (
      Number.isSafeInteger(amountMinor) &&
      amountMinor >= 0
    );
  }

  function cleanText(value, maxLength) {
    return String(value || "")
      .trim()
      .slice(0, maxLength || 200);
  }

  function getSettings() {
    const saved = readJSON(SETTINGS_KEY, {});
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  }

  function saveSettings(changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        error: "Settings must be provided as an object."
      };
    }

    const current = getSettings();
    const allowedKeys = [
      "defaultCurrency",
      "commissionRatePercent",
      "requireReviewForPayouts",
      "requireReviewForRefunds",
      "allowDemoRecords"
    ];

    const next = Object.assign({}, current);

    for (const key of allowedKeys) {
      if (!Object.prototype.hasOwnProperty.call(changes, key)) {
        continue;
      }

      if (key === "defaultCurrency") {
        const currency = String(changes[key]).trim().toUpperCase();

        if (!validCurrency(currency)) {
          return {
            success: false,
            error: "Currency must be a three-letter code."
          };
        }

        next.defaultCurrency = currency;
      } else if (key === "commissionRatePercent") {
        const rate = Number(changes[key]);

        if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
          return {
            success: false,
            error: "Commission rate must be between 0 and 100."
          };
        }

        next.commissionRatePercent = rate;
      } else {
        if (typeof changes[key] !== "boolean") {
          return {
            success: false,
            error: key + " must be true or false."
          };
        }

        next[key] = changes[key];
      }
    }

    next.lastUpdated = nowISO();

    if (!writeJSON(SETTINGS_KEY, next)) {
      return {
        success: false,
        error: "Could not save settings on this device."
      };
    }

    addAuditEntry(
      "settings_updated",
      null,
      "Local finance settings changed."
    );

    return {
      success: true,
      settings: next,
      demoOnly: true
    };
  }

  function createRecord(input) {
    if (!input || typeof input !== "object") {
      return {
        success: false,
        error: "Provide a finance record."
      };
    }

    const settings = getSettings();

    if (!settings.allowDemoRecords) {
      return {
        success: false,
        error: "Creating demo records is currently disabled."
      };
    }

    const type = cleanText(input.type, 50);
    const amountMinor = input.amountMinor;
    const currency = String(
      input.currency || settings.defaultCurrency
    ).trim().toUpperCase();

    if (!RECORD_TYPES.includes(type)) {
      return {
        success: false,
        error: "Unsupported finance record type."
      };
    }

    if (!validAmount(amountMinor)) {
      return {
        success: false,
        error: "Amount must be a non-negative safe integer in minor currency units."
      };
    }

    if (!validCurrency(currency)) {
      return {
        success: false,
        error: "Currency must be a three-letter code."
      };
    }

    const records = getRecords();

    const record = {
      id: makeId("finance"),
      referenceId: cleanText(input.referenceId, 100) || makeId("ref"),
      type: type,
      amountMinor: amountMinor,
      currency: currency,
      status: "pending",
      ownerId: cleanText(input.ownerId, 100) || null,
      description: cleanText(input.description, 300),
      reviewReason: "",
      reviewedBy: null,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      environment: "local-demo"
    };

    records.unshift(record);

    if (!writeJSON(RECORDS_KEY, records)) {
      return {
        success: false,
        error: "Could not save the record on this device."
      };
    }

    addAuditEntry(
      "record_created",
      record.id,
      "Created local demo record of type " + type + "."
    );

    return {
      success: true,
      record: record,
      demoOnly: true
    };
  }

  function getRecord(recordId) {
    return getRecords().find(function (record) {
      return record.id === recordId;
    }) || null;
  }

  function reviewRecord(recordId, decision, reviewerId, reason) {
    const allowedDecisions = [
      "under_review",
      "approved",
      "rejected",
      "cancelled"
    ];

    if (!allowedDecisions.includes(decision)) {
      return {
        success: false,
        error: "Unsupported review decision."
      };
    }

    const records = getRecords();
    const index = records.findIndex(function (record) {
      return record.id === recordId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Finance record not found."
      };
    }

    const record = records[index];

    if (
      record.status === "completed" ||
      record.status === "failed" ||
      record.status === "cancelled"
    ) {
      return {
        success: false,
        error: "This record is closed and cannot be reviewed."
      };
    }

    record.status = decision;
    record.reviewReason = cleanText(reason, 500);
    record.reviewedBy = cleanText(reviewerId, 100) || "local-demo-reviewer";
    record.updatedAt = nowISO();

    records[index] = record;

    if (!writeJSON(RECORDS_KEY, records)) {
      return {
        success: false,
        error: "Could not save the review."
      };
    }

    addAuditEntry(
      "record_" + decision,
      record.id,
      record.reviewReason || "No review note provided."
    );

    return {
      success: true,
      record: record,
      demoOnly: true,
      warning: "This changes only a local record. It does not approve or transfer real money."
    };
  }

  function markRecordStatus(recordId, status, note) {
    if (!RECORD_STATUSES.includes(status)) {
      return {
        success: false,
        error: "Unsupported status."
      };
    }

    const records = getRecords();
    const index = records.findIndex(function (record) {
      return record.id === recordId;
    });

    if (index === -1) {
      return {
        success: false,
        error: "Finance record not found."
      };
    }

    const record = records[index];

    if (record.status === "completed") {
      return {
        success: false,
        error: "Completed records cannot be changed."
      };
    }

    if (
      status === "completed" &&
      record.status !== "approved"
    ) {
      return {
        success: false,
        error: "Only approved demo records can be marked completed."
      };
    }

    record.status = status;
    record.updatedAt = nowISO();

    if (note !== undefined) {
      record.reviewReason = cleanText(note, 500);
    }

    records[index] = record;

    if (!writeJSON(RECORDS_KEY, records)) {
      return {
        success: false,
        error: "Could not update the record."
      };
    }

    addAuditEntry(
      "record_status_changed",
      record.id,
      "Local status changed to " + status + ". " +
        cleanText(note, 300)
    );

    return {
      success: true,
      record: record,
      demoOnly: true,
      warning: "This status change is for demonstration only. No payment or payout occurred."
    };
  }

  function listRecords(filters) {
    filters = filters || {};

    let records = getRecords();

    if (filters.type) {
      records = records.filter(function (record) {
        return record.type === filters.type;
      });
    }

    if (filters.status) {
      records = records.filter(function (record) {
        return record.status === filters.status;
      });
    }

    if (filters.currency) {
      const currency = String(filters.currency).toUpperCase();

      records = records.filter(function (record) {
        return record.currency === currency;
      });
    }

    if (filters.ownerId) {
      records = records.filter(function (record) {
        return record.ownerId === filters.ownerId;
      });
    }

    return records;
  }

  function getSummary() {
    const records = getRecords();
    const currencies = {};

    records.forEach(function (record) {
      const currency = record.currency;

      if (!currencies[currency]) {
        currencies[currency] = {
          currency: currency,
          recordCount: 0,
          byStatus: {},
          byType: {},
          totalByStatusMinor: {},
          totalByTypeMinor: {}
        };
      }

      const summary = currencies[currency];

      summary.recordCount += 1;

      summary.byStatus[record.status] =
        (summary.byStatus[record.status] || 0) + 1;

      summary.byType[record.type] =
        (summary.byType[record.type] || 0) + 1;

      summary.totalByStatusMinor[record.status] =
        (summary.totalByStatusMinor[record.status] || 0) +
        record.amountMinor;

      summary.totalByTypeMinor[record.type] =
        (summary.totalByTypeMinor[record.type] || 0) +
        record.amountMinor;
    });

    return {
      recordCount: records.length,
      currencies: currencies,
      generatedAt: nowISO(),
      demoOnly: true
    };
  }

  function previewCommission(amountMinor, ratePercent) {
    if (!validAmount(amountMinor)) {
      return {
        success: false,
        error: "Amount must be a non-negative safe integer."
      };
    }

    const rate = ratePercent === undefined
      ? getSettings().commissionRatePercent
      : Number(ratePercent);

    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return {
        success: false,
        error: "Commission rate must be between 0 and 100."
      };
    }

    const commissionMinor = Math.round(
      amountMinor * rate / 100
    );

    return {
      success: true,
      grossAmountMinor: amountMinor,
      commissionRatePercent: rate,
      commissionAmountMinor: commissionMinor,
      sellerAmountMinor: amountMinor - commissionMinor,
      demoOnly: true,
      note: "Estimate only. This does not calculate taxes, fees, refunds, or transfer funds."
    };
  }

  function getAuditLog(filters) {
    let entries = readJSON(AUDIT_KEY, []);

    if (!Array.isArray(entries)) {
      entries = [];
    }

    filters = filters || {};

    if (filters.recordId) {
      entries = entries.filter(function (entry) {
        return entry.recordId === filters.recordId;
      });
    }

    if (filters.action) {
      entries = entries.filter(function (entry) {
        return entry.action === filters.action;
      });
    }

    return entries;
  }

  function formatAmount(amountMinor, currency) {
    if (!validAmount(amountMinor) || !validCurrency(currency)) {
      return null;
    }

    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(amountMinor / 100);
  }

  function exportRecords() {
    return {
      exportedAt: nowISO(),
      environment: "local-demo",
      records: getRecords(),
      settings: getSettings(),
      auditLog: getAuditLog(),
      warning: "Local demonstration data only. Not an official financial statement."
    };
  }

  window.RockyXAdminFinance = {
    version: "1.0.0",
    demoOnly: true,

    recordTypes: RECORD_TYPES.slice(),
    recordStatuses: RECORD_STATUSES.slice(),

    getSettings: getSettings,
    saveSettings: saveSettings,

    createRecord: createRecord,
    getRecord: getRecord,
    listRecords: listRecords,

    reviewRecord: reviewRecord,
    markRecordStatus: markRecordStatus,

    getSummary: getSummary,
    previewCommission: previewCommission,
    getAuditLog: getAuditLog,
    formatAmount: formatAmount,
    exportRecords: exportRecords
  };

  console.log(
    "RockyX Admin Finance loaded. Local demo only; no money is moved."
  );
})();