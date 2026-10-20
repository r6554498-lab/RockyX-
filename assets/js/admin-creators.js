/*
 * RockyX Admin Creators
 *
 * Local prototype for managing creator programs.
 *
 * IMPORTANT:
 * Records are stored in this browser only.
 * This module does not grant real creator permissions,
 * approve real accounts, or issue actual rewards.
 * Production actions require secure backend authorization.
 */

(function () {
  "use strict";

  const APPLICATIONS_KEY = "rockyx_admin_creator_applications";
  const AUDIT_KEY = "rockyx_admin_creators_audit";

  const CREATOR_TYPES = [
    "rockyx_creator",
    "template_creator"
  ];

  const APPLICATION_STATUSES = [
    "pending",
    "under_review",
    "approved",
    "rejected",
    "withdrawn"
  ];

  const VERIFICATION_STATUSES = [
    "not_submitted",
    "pending",
    "approved",
    "rejected"
  ];

  const CREATOR_LEVELS = [
    "Starter",
    "Rising",
    "Emerging",
    "Established",
    "Expert",
    "Elite",
    "Master"
  ];

  const TASK_STATUSES = [
    "draft",
    "active",
    "paused",
    "ended"
  ];

  function readStorage(key) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(
        "RockyX Admin Creators: storage read failed.",
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
        "RockyX Admin Creators: storage save failed.",
        error
      );

      return false;
    }
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function cleanText(value, maxLength) {
    if (typeof value !== "string") {
      return "";
    }

    return value.trim().slice(0, maxLength);
  }

  function recordAudit(action, details) {
    const audit = readStorage(AUDIT_KEY);

    audit.push({
      id: createId("creator_audit"),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local demo audit record; not tamper-proof."
    });

    return saveStorage(AUDIT_KEY, audit);
  }

  function validateApplication(details) {
    if (!details || typeof details !== "object") {
      return "Application details are required.";
    }

    if (!CREATOR_TYPES.includes(details.creatorType)) {
      return "Choose a supported creator program.";
    }

    if (
      typeof details.userId !== "string" ||
      !details.userId.trim()
    ) {
      return "A user ID is required.";
    }

    if (
      typeof details.username !== "string" ||
      !details.username.trim()
    ) {
      return "A username is required.";
    }

    if (
      typeof details.reason !== "string" ||
      !details.reason.trim()
    ) {
      return "An application statement is required.";
    }

    return null;
  }

  /*
   * Create a local demonstration application record.
   * This does not submit a real user application.
   */
  function createApplication(details) {
    const error = validateApplication(details);

    if (error) {
      return {
        success: false,
        message: error
      };
    }

    const applications = readStorage(APPLICATIONS_KEY);

    const duplicate = applications.some(function (item) {
      return (
        item.userId === details.userId &&
        item.creatorType === details.creatorType &&
        ["pending", "under_review"].includes(item.status)
      );
    });

    if (duplicate) {
      return {
        success: false,
        message:
          "This user already has an application under review for this program."
      };
    }

    const application = {
      id: createId("creator_application"),
      userId: details.userId.trim(),
      username: cleanText(details.username, 80),
      creatorType: details.creatorType,
      reason: cleanText(details.reason, 3000),
      portfolioUrl: cleanText(details.portfolioUrl, 500),
      status: "pending",
      reviewReason: "",
      reviewedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Local demo record; not a real application."
    };

    applications.push(application);

    if (!saveStorage(APPLICATIONS_KEY, applications)) {
      return {
        success: false,
        message: "Could not save the application."
      };
    }

    recordAudit("creator_application_created", {
      applicationId: application.id,
      creatorType: application.creatorType
    });

    return {
      success: true,
      application: application,
      message: "Demo application record created."
    };
  }

  function getApplication(applicationId) {
    return readStorage(APPLICATIONS_KEY).find(
      function (item) {
        return item.id === applicationId;
      }
    ) || null;
  }

  function getApplications(filters) {
    const options = filters || {};

    return readStorage(APPLICATIONS_KEY).filter(
      function (application) {
        if (
          options.creatorType &&
          application.creatorType !== options.creatorType
        ) {
          return false;
        }

        if (
          options.status &&
          application.status !== options.status
        ) {
          return false;
        }

        if (
          options.userId &&
          application.userId !== options.userId
        ) {
          return false;
        }

        return true;
      }
    );
  }

  /*
   * Record an application review decision.
   * This does not grant roles or permissions to real accounts.
   */
  function reviewApplication(
    applicationId,
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

    const applications = readStorage(APPLICATIONS_KEY);

    const application = applications.find(
      function (item) {
        return item.id === applicationId;
      }
    );

    if (!application) {
      return {
        success: false,
        message: "Application not found."
      };
    }

    if (
      !["pending", "under_review"].includes(application.status)
    ) {
      return {
        success: false,
        message: "This application is no longer awaiting review."
      };
    }

    application.status = decision;
    application.reviewReason = cleanText(reason || "", 2000);
    application.reviewedBy = cleanText(reviewerId || "", 100) || null;
    application.updatedAt = new Date().toISOString();

    if (!saveStorage(APPLICATIONS_KEY, applications)) {
      return {
        success: false,
        message: "Could not save the review decision."
      };
    }

    recordAudit("creator_application_reviewed", {
      applicationId: applicationId,
      creatorType: application.creatorType,
      decision: decision,
      reviewerId: application.reviewedBy
    });

    return {
      success: true,
      application: application,
      message: "Demo review decision recorded.",
      note:
        "This does not grant or remove any real account permissions."
    };
  }

  function setApplicationUnderReview(applicationId, reviewerId) {
    const applications = readStorage(APPLICATIONS_KEY);

    const application = applications.find(
      function (item) {
        return item.id === applicationId;
      }
    );

    if (!application) {
      return {
        success: false,
        message: "Application not found."
      };
    }

    if (application.status !== "pending") {
      return {
        success: false,
        message: "Only pending applications can enter review."
      };
    }

    application.status = "under_review";
    application.reviewedBy = cleanText(reviewerId || "", 100) || null;
    application.updatedAt = new Date().toISOString();

    if (!saveStorage(APPLICATIONS_KEY, applications)) {
      return {
        success: false,
        message: "Could not update the application."
      };
    }

    recordAudit("creator_application_started_review", {
      applicationId: applicationId,
      reviewerId: application.reviewedBy
    });

    return {
      success: true,
      application: application,
      message: "Application marked under review locally."
    };
  }

  /*
   * Record a verification review for demonstration purposes.
   * This does not verify identity or connect to a real profile.
   */
  function reviewVerification(userId, status, reason, reviewerId) {
    if (!userId || typeof userId !== "string") {
      return {
        success: false,
        message: "A user ID is required."
      };
    }

    if (
      !["approved", "rejected", "pending"].includes(status)
    ) {
      return {
        success: false,
        message: "Invalid verification decision."
      };
    }

    const key = "rockyx_admin_creator_verification";
    const records = readStorage(key);

    const existing = records.find(function (item) {
      return item.userId === userId;
    });

    const record = {
      userId: userId,
      status: status,
      reason: cleanText(reason || "", 2000),
      reviewedBy: cleanText(reviewerId || "", 100) || null,
      updatedAt: new Date().toISOString(),
      note: "Demo verification record only."
    };

    if (existing) {
      Object.assign(existing, record);
    } else {
      records.push(record);
    }

    if (!saveStorage(key, records)) {
      return {
        success: false,
        message: "Could not save verification record."
      };
    }

    recordAudit("creator_verification_reviewed", {
      userId: userId,
      status: status,
      reviewerId: record.reviewedBy
    });

    return {
      success: true,
      verification: record,
      message: "Demo verification decision recorded."
    };
  }

  function getVerification(userId) {
    return readStorage(
      "rockyx_admin_creator_verification"
    ).find(function (item) {
      return item.userId === userId;
    }) || null;
  }

  /*
   * Creator levels are descriptive values only.
   * Actual levels should come from trusted backend calculations.
   */
  function getCreatorLevels() {
    return CREATOR_LEVELS.map(function (name, index) {
      return {
        name: name,
        order: index + 1
      };
    });
  }

  /*
   * Local overview of the two creator programs.
   */
  function getProgramSummary() {
    const applications = readStorage(APPLICATIONS_KEY);

    function summarize(creatorType) {
      const selected = applications.filter(function (item) {
        return item.creatorType === creatorType;
      });

      return {
        total: selected.length,
        pending: selected.filter(function (item) {
          return item.status === "pending";
        }).length,
        underReview: selected.filter(function (item) {
          return item.status === "under_review";
        }).length,
        approved: selected.filter(function (item) {
          return item.status === "approved";
        }).length,
        rejected: selected.filter(function (item) {
          return item.status === "rejected";
        }).length
      };
    }

    return {
      rockyXCreators: summarize("rockyx_creator"),
      templateCreators: summarize("template_creator"),
      generatedAt: new Date().toISOString(),
      note: "Counts include local demo applications only."
    };
  }

  function getAuditLog() {
    return readStorage(AUDIT_KEY).slice().reverse();
  }

  window.RockyXAdminCreators = {
    createApplication: createApplication,
    getApplication: getApplication,
    getApplications: getApplications,
    reviewApplication: reviewApplication,
    setApplicationUnderReview: setApplicationUnderReview,
    reviewVerification: reviewVerification,
    getVerification: getVerification,
    getCreatorLevels: getCreatorLevels,
    getProgramSummary: getProgramSummary,
    getAuditLog: getAuditLog,

    getCreatorTypes: function () {
      return CREATOR_TYPES.slice();
    },

    getApplicationStatuses: function () {
      return APPLICATION_STATUSES.slice();
    },

    getVerificationStatuses: function () {
      return VERIFICATION_STATUSES.slice();
    },

    getTaskStatuses: function () {
      return TASK_STATUSES.slice();
    }
  };
})();