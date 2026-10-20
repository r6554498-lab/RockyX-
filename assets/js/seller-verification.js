/*
 * RockyX Seller Verification
 *
 * Provides a local prototype for seller verification
 * applications and review statuses.
 *
 * IMPORTANT:
 * This is not real identity or business verification.
 * Production verification must use a secure backend,
 * authorized reviewers, and appropriate verification
 * providers. Never store identity documents in localStorage.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_seller_verification";
  const AUDIT_KEY = "rockyx_seller_verification_audit";

  const STATUSES = [
    "pending",
    "under_review",
    "approved",
    "rejected",
    "more_information_required",
    "withdrawn"
  ];

  const SELLER_TYPES = [
    "individual",
    "registered_business"
  ];

  function readStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
      console.error("RockyX verification storage error:", error);
      return [];
    }
  }

  function saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("RockyX verification save error:", error);
      return false;
    }
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function addAuditEntry(action, applicationId, details) {
    const audit = readStorage(AUDIT_KEY);

    audit.push({
      id: createId("audit"),
      action: action,
      applicationId: applicationId,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local prototype record; not a secure audit log."
    });

    return saveStorage(AUDIT_KEY, audit);
  }

  function submitApplication(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Application details are required."
      };
    }

    if (
      typeof details.sellerId !== "string" ||
      !details.sellerId.trim()
    ) {
      return {
        success: false,
        message: "A seller ID is required."
      };
    }

    if (
      typeof details.sellerType !== "string" ||
      !SELLER_TYPES.includes(details.sellerType)
    ) {
      return {
        success: false,
        message: "Choose a valid seller type."
      };
    }

    if (
      typeof details.businessName !== "string" ||
      !details.businessName.trim()
    ) {
      return {
        success: false,
        message: "Enter your business or seller name."
      };
    }

    if (
      typeof details.country !== "string" ||
      !details.country.trim()
    ) {
      return {
        success: false,
        message: "Enter your country."
      };
    }

    const applications = readStorage(STORAGE_KEY);

    const existing = applications.find(function (application) {
      return application.sellerId === details.sellerId &&
        [
          "pending",
          "under_review",
          "more_information_required"
        ].includes(application.status);
    });

    if (existing) {
      return {
        success: false,
        message: "You already have an application awaiting review.",
        application: existing
      };
    }

    const application = {
      id: createId("seller_verification"),
      sellerId: details.sellerId.trim(),
      sellerType: details.sellerType,
      businessName: details.businessName.trim(),
      country: details.country.trim(),
      businessCategory: details.businessCategory || "other",
      businessDescription: details.businessDescription || "",
      contactEmail: details.contactEmail || "",
      status: "pending",
      reviewerNotes: "",
      requestedInformation: "",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewedAt: null,
      note: "Demo application only. Identity and business details have not been verified."
    };

    applications.push(application);

    if (!saveStorage(STORAGE_KEY, applications)) {
      return {
        success: false,
        message: "Could not save the application."
      };
    }

    addAuditEntry("application_submitted", application.id, {
      sellerId: application.sellerId
    });

    return {
      success: true,
      application: application,
      message: "Demo verification application submitted."
    };
  }

  function getApplication(applicationId) {
    return readStorage(STORAGE_KEY).find(function (application) {
      return application.id === applicationId;
    }) || null;
  }

  function getSellerApplications(sellerId) {
    return readStorage(STORAGE_KEY).filter(function (application) {
      return application.sellerId === sellerId;
    });
  }

  function getApplications(status) {
    const applications = readStorage(STORAGE_KEY);

    if (!status) {
      return applications;
    }

    return applications.filter(function (application) {
      return application.status === status;
    });
  }

  /*
   * Prototype-only review method.
   * Production approval/rejection must require an authenticated
   * administrator and server-side permission checks.
   */
  function reviewApplication(applicationId, decision, notes) {
    const allowedDecisions = [
      "under_review",
      "approved",
      "rejected",
      "more_information_required"
    ];

    if (!allowedDecisions.includes(decision)) {
      return {
        success: false,
        message: "Invalid review decision."
      };
    }

    const applications = readStorage(STORAGE_KEY);

    const application = applications.find(function (item) {
      return item.id === applicationId;
    });

    if (!application) {
      return {
        success: false,
        message: "Application not found."
      };
    }

    application.status = decision;
    application.reviewerNotes = notes || "";
    application.updatedAt = new Date().toISOString();

    if (
      decision === "approved" ||
      decision === "rejected"
    ) {
      application.reviewedAt = new Date().toISOString();
    }

    if (decision === "more_information_required") {
      application.requestedInformation = notes || "";
    }

    if (!saveStorage(STORAGE_KEY, applications)) {
      return {
        success: false,
        message: "Could not save the review decision."
      };
    }

    addAuditEntry("application_reviewed", applicationId, {
      decision: decision,
      notes: notes || ""
    });

    return {
      success: true,
      application: application,
      message: "Demo application status updated."
    };
  }

  function withdrawApplication(applicationId, sellerId) {
    const applications = readStorage(STORAGE_KEY);

    const application = applications.find(function (item) {
      return item.id === applicationId &&
        item.sellerId === sellerId;
    });

    if (!application) {
      return {
        success: false,
        message: "Application not found for this seller."
      };
    }

    if (
      application.status === "approved" ||
      application.status === "rejected"
    ) {
      return {
        success: false,
        message: "A reviewed application cannot be withdrawn."
      };
    }

    application.status = "withdrawn";
    application.updatedAt = new Date().toISOString();

    if (!saveStorage(STORAGE_KEY, applications)) {
      return {
        success: false,
        message: "Could not withdraw the application."
      };
    }

    addAuditEntry("application_withdrawn", applicationId, {
      sellerId: sellerId
    });

    return {
      success: true,
      application: application,
      message: "Demo application withdrawn."
    };
  }

  function getAuditLog() {
    return readStorage(AUDIT_KEY).slice().reverse();
  }

  function getStatuses() {
    return STATUSES.slice();
  }

  function getSellerTypes() {
    return SELLER_TYPES.slice();
  }

  window.RockyXSellerVerification = {
    submitApplication: submitApplication,
    getApplication: getApplication,
    getSellerApplications: getSellerApplications,
    getApplications: getApplications,
    reviewApplication: reviewApplication,
    withdrawApplication: withdrawApplication,
    getAuditLog: getAuditLog,
    getStatuses: getStatuses,
    getSellerTypes: getSellerTypes
  };
})();