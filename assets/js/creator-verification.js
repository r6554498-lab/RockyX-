/* =========================================
   ROCKYX CREATOR VERIFICATION
   Application and review foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_creator_verification";

  const CREATOR_TYPES = [
    "social",
    "music",
    "template"
  ];

  const APPLICATION_STATUSES = [
    "pending",
    "under_review",
    "approved",
    "rejected",
    "withdrawn"
  ];

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return "verification-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 10);
  }

  function normalizeId(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return null;
    }

    const id = String(value).trim();
    return id || null;
  }

  function cleanText(value, maxLength) {
    if (typeof value !== "string") return "";

    return value.trim().slice(0, maxLength);
  }

  function loadApplications() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const applications = saved ? JSON.parse(saved) : [];

      return Array.isArray(applications) ? applications : [];
    } catch (error) {
      console.error(
        "RockyX verification applications could not be loaded:",
        error
      );

      return [];
    }
  }

  function saveApplications(applications) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(applications)
      );

      window.dispatchEvent(
        new CustomEvent("rockyx:verification-updated", {
          detail: {
            applicationCount: applications.length
          }
        })
      );

      return true;
    } catch (error) {
      console.error(
        "RockyX verification applications could not be saved:",
        error
      );

      return false;
    }
  }

  function submitApplication(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Application details are required."
      };
    }

    const userId = normalizeId(details.userId);
    const creatorType = cleanText(details.creatorType, 30);
    const publicUsername = cleanText(details.username, 50);
    const reason = cleanText(details.reason, 1500);

    if (!userId) {
      return {
        success: false,
        error: "A valid account ID is required."
      };
    }

    if (!CREATOR_TYPES.includes(creatorType)) {
      return {
        success: false,
        error: "Choose a supported creator type."
      };
    }

    if (!publicUsername) {
      return {
        success: false,
        error: "Your public username is required."
      };
    }

    if (reason.length < 20) {
      return {
        success: false,
        error: "Explain why you qualify in at least 20 characters."
      };
    }

    const applications = loadApplications();

    const existing = applications.find(application =>
      application.userId === userId &&
      application.creatorType === creatorType &&
      ["pending", "under_review"].includes(application.status)
    );

    if (existing) {
      return {
        success: false,
        error: "You already have an active application for this creator type.",
        application: { ...existing }
      };
    }

    const application = {
      id: createId(),
      userId,
      creatorType,
      username: publicUsername,
      reason,
      evidenceLinks: normalizeEvidenceLinks(details.evidenceLinks),
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNote: ""
    };

    applications.unshift(application);

    if (!saveApplications(applications)) {
      return {
        success: false,
        error: "The application could not be saved."
      };
    }

    window.dispatchEvent(
      new CustomEvent("rockyx:verification-submitted", {
        detail: {
          applicationId: application.id,
          creatorType: application.creatorType
        }
      })
    );

    return {
      success: true,
      application: { ...application }
    };
  }

  function normalizeEvidenceLinks(links) {
    if (!Array.isArray(links)) return [];

    return links.slice(0, 5).map(value => {
      if (typeof value !== "string") return null;

      try {
        const url = new URL(value.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          return null;
        }

        return url.href;
      } catch (error) {
        return null;
      }
    }).filter(Boolean);
  }

  function getApplication(applicationId) {
    const id = normalizeId(applicationId);
    if (!id) return null;

    const application = loadApplications().find(
      item => item.id === id
    );

    return application ? { ...application } : null;
  }

  function getUserApplications(userId) {
    const id = normalizeId(userId);
    if (!id) return [];

    return loadApplications()
      .filter(application => application.userId === id)
      .map(application => ({ ...application }));
  }

  function getApplicationStatus(userId, creatorType) {
    const id = normalizeId(userId);

    if (!id || !CREATOR_TYPES.includes(creatorType)) {
      return null;
    }

    const application = loadApplications().find(
      item =>
        item.userId === id &&
        item.creatorType === creatorType
    );

    return application
      ? {
          id: application.id,
          status: application.status,
          submittedAt: application.submittedAt,
          reviewedAt: application.reviewedAt,
          reviewNote: application.reviewNote
        }
      : null;
  }

  /*
   * DEMO ONLY:
   * This local review function is not secure.
   * Production approval must be performed by an
   * authenticated administrator on the backend.
   */
  function reviewApplication(applicationId, decision, note) {
    const id = normalizeId(applicationId);

    if (!id || !["approved", "rejected"].includes(decision)) {
      return {
        success: false,
        error: "A valid application and review decision are required."
      };
    }

    const applications = loadApplications();

    const application = applications.find(
      item => item.id === id
    );

    if (!application) {
      return {
        success: false,
        error: "Application not found."
      };
    }

    if (
      !["pending", "under_review"].includes(application.status)
    ) {
      return {
        success: false,
        error: "This application has already been reviewed."
      };
    }

    application.status = decision;
    application.reviewedAt = new Date().toISOString();
    application.reviewNote = cleanText(note || "", 1000);

    if (!saveApplications(applications)) {
      return {
        success: false,
        error: "The review could not be saved."
      };
    }

    window.dispatchEvent(
      new CustomEvent("rockyx:verification-reviewed", {
        detail: {
          applicationId: application.id,
          status: application.status
        }
      })
    );

    return {
      success: true,
      application: { ...application }
    };
  }

  function withdrawApplication(applicationId, userId) {
    const id = normalizeId(applicationId);
    const ownerId = normalizeId(userId);

    if (!id || !ownerId) return false;

    const applications = loadApplications();

    const application = applications.find(
      item => item.id === id && item.userId === ownerId
    );

    if (
      !application ||
      !["pending", "under_review"].includes(application.status)
    ) {
      return false;
    }

    application.status = "withdrawn";
    application.reviewedAt = new Date().toISOString();

    return saveApplications(applications);
  }

  function getStatusOptions() {
    return [...APPLICATION_STATUSES];
  }

  function getCreatorTypes() {
    return [...CREATOR_TYPES];
  }

  window.RockyXCreatorVerification = {
    submitApplication,
    getApplication,
    getUserApplications,
    getApplicationStatus,
    reviewApplication,
    withdrawApplication,
    getStatusOptions,
    getCreatorTypes
  };

})();