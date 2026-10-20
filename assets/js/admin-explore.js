/*
 * RockyX Admin Explore
 *
 * Local prototype for Explore and map administration.
 *
 * IMPORTANT:
 * This module stores local records only.
 * It does not provide a live map, verify real businesses,
 * or change public listings.
 *
 * Production map features, listing moderation, location
 * verification, and administrator permissions require
 * secure backend integration.
 */

(function () {
  "use strict";

  const LISTINGS_KEY = "rockyx_admin_explore_listings";
  const REPORTS_KEY = "rockyx_admin_explore_reports";
  const SETTINGS_KEY = "rockyx_admin_explore_settings";
  const AUDIT_KEY = "rockyx_admin_explore_audit";

  const CATEGORIES = [
    "businesses",
    "transport",
    "healthcare",
    "fuel",
    "food",
    "shopping",
    "accommodation",
    "professional_services",
    "other_services"
  ];

  const LISTING_STATUSES = [
    "pending",
    "approved",
    "rejected",
    "suspended",
    "removed"
  ];

  const REPORT_STATUSES = [
    "open",
    "reviewing",
    "resolved",
    "dismissed"
  ];

  const DEFAULT_SETTINGS = {
    exploreEnabled: true,
    mapEnabled: true,
    listViewEnabled: true,
    directionsEnabled: true,
    businessListingsEnabled: true,
    transportListingsEnabled: true,
    healthcareListingsEnabled: true,
    fuelListingsEnabled: true,
    foodListingsEnabled: true,
    otherServicesEnabled: true,
    requireListingReview: true,
    showUnverifiedListings: false
  };

  const CATEGORY_SETTING = {
    businesses: "businessListingsEnabled",
    transport: "transportListingsEnabled",
    healthcare: "healthcareListingsEnabled",
    fuel: "fuelListingsEnabled",
    food: "foodListingsEnabled",
    shopping: "businessListingsEnabled",
    accommodation: "businessListingsEnabled",
    professional_services: "otherServicesEnabled",
    other_services: "otherServicesEnabled"
  };

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "null"
      );

      return value === null ? fallback : value;
    } catch (error) {
      console.error(
        "RockyX Admin Explore: storage read failed.",
        error
      );

      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(
        "RockyX Admin Explore: storage save failed.",
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
    const audit = readStorage(AUDIT_KEY, []);

    if (!Array.isArray(audit)) {
      return false;
    }

    audit.push({
      id: createId("explore_audit"),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local prototype log; not tamper-proof."
    });

    return saveStorage(AUDIT_KEY, audit);
  }

  function getSettings() {
    const saved = readStorage(SETTINGS_KEY, {});

    return Object.assign(
      {},
      DEFAULT_SETTINGS,
      saved
    );
  }

  function isValidCoordinates(latitude, longitude) {
    return (
      typeof latitude === "number" &&
      Number.isFinite(latitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      typeof longitude === "number" &&
      Number.isFinite(longitude) &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /*
   * Create a local Explore listing record.
   * This does not verify the location or publish a real listing.
   */
  function createListing(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Listing details are required."
      };
    }

    if (!CATEGORIES.includes(details.category)) {
      return {
        success: false,
        message: "Choose a supported Explore category."
      };
    }

    const name = cleanText(details.name, 180);
    const ownerId = cleanText(details.ownerId, 150);

    if (!name) {
      return {
        success: false,
        message: "A listing name is required."
      };
    }

    if (!ownerId) {
      return {
        success: false,
        message: "A listing owner ID is required."
      };
    }

    const hasLatitude =
      details.latitude !== undefined &&
      details.latitude !== null &&
      details.latitude !== "";

    const hasLongitude =
      details.longitude !== undefined &&
      details.longitude !== null &&
      details.longitude !== "";

    let latitude = null;
    let longitude = null;

    if (hasLatitude || hasLongitude) {
      latitude = Number(details.latitude);
      longitude = Number(details.longitude);

      if (!isValidCoordinates(latitude, longitude)) {
        return {
          success: false,
          message: "Enter valid latitude and longitude coordinates."
        };
      }
    }

    const settings = getSettings();

    if (!settings.exploreEnabled) {
      return {
        success: false,
        message: "Explore is disabled in the local settings."
      };
    }

    const categorySetting = CATEGORY_SETTING[details.category];

    if (
      categorySetting &&
      settings[categorySetting] === false
    ) {
      return {
        success: false,
        message: "This Explore category is disabled."
      };
    }

    const listings = readStorage(LISTINGS_KEY, []);

    if (!Array.isArray(listings)) {
      return {
        success: false,
        message: "Listing storage is invalid."
      };
    }

    const listing = {
      id: createId("explore_listing"),
      ownerId: ownerId,
      name: name,
      description: cleanText(details.description || "", 3000),
      category: details.category,
      address: cleanText(details.address || "", 500),
      city: cleanText(details.city || "", 100),
      country: cleanText(details.country || "", 100),
      latitude: latitude,
      longitude: longitude,
      phone: cleanText(details.phone || "", 40),
      website: cleanText(details.website || "", 500),
      status: settings.requireListingReview
        ? "pending"
        : "approved",
      verificationStatus: "unverified",
      reviewReason: "",
      reviewedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Local demo listing; not verified or published."
    };

    listings.push(listing);

    if (!saveStorage(LISTINGS_KEY, listings)) {
      return {
        success: false,
        message: "Could not save the listing."
      };
    }

    recordAudit("explore_listing_created", {
      listingId: listing.id,
      category: listing.category
    });

    return {
      success: true,
      listing: listing,
      message: "Explore listing saved locally."
    };
  }

  function getListing(listingId) {
    return readStorage(LISTINGS_KEY, []).find(
      function (listing) {
        return listing.id === listingId;
      }
    ) || null;
  }

  function getListings(filters) {
    const options = filters || {};

    return readStorage(LISTINGS_KEY, []).filter(
      function (listing) {
        if (
          options.category &&
          listing.category !== options.category
        ) {
          return false;
        }

        if (
          options.status &&
          listing.status !== options.status
        ) {
          return false;
        }

        if (
          options.ownerId &&
          listing.ownerId !== options.ownerId
        ) {
          return false;
        }

        if (
          options.country &&
          listing.country.toLowerCase() !==
            String(options.country).toLowerCase()
        ) {
          return false;
        }

        if (options.search) {
          const query = String(options.search).toLowerCase();

          const searchable = [
            listing.name,
            listing.description,
            listing.category,
            listing.address,
            listing.city,
            listing.country
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
   * Record a proposed moderation decision.
   * This does not change a real public listing.
   */
  function reviewListing(
    listingId,
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

    const listings = readStorage(LISTINGS_KEY, []);

    const listing = listings.find(function (item) {
      return item.id === listingId;
    });

    if (!listing) {
      return {
        success: false,
        message: "Listing not found."
      };
    }

    if (listing.status !== "pending") {
      return {
        success: false,
        message: "Only pending listings can be reviewed."
      };
    }

    listing.status = decision;
    listing.reviewReason = cleanText(reason || "", 2000);
    listing.reviewedBy = cleanText(reviewerId || "", 150) || null;
    listing.updatedAt = new Date().toISOString();

    if (!saveStorage(LISTINGS_KEY, listings)) {
      return {
        success: false,
        message: "Could not save the review decision."
      };
    }

    recordAudit("explore_listing_reviewed", {
      listingId: listingId,
      decision: decision,
      reviewerId: listing.reviewedBy
    });

    return {
      success: true,
      listing: listing,
      message: "Listing review recorded locally.",
      note: "This does not publish a real listing."
    };
  }

  /*
   * Record a proposed listing verification decision.
   * This does not verify a real business or its owner.
   */
  function reviewVerification(
    listingId,
    decision,
    reason,
    reviewerId
  ) {
    if (!["verified", "rejected", "unverified"].includes(decision)) {
      return {
        success: false,
        message: "Invalid verification decision."
      };
    }

    const listings = readStorage(LISTINGS_KEY, []);

    const listing = listings.find(function (item) {
      return item.id === listingId;
    });

    if (!listing) {
      return {
        success: false,
        message: "Listing not found."
      };
    }

    listing.verificationStatus = decision;
    listing.verificationReason = cleanText(reason || "", 2000);
    listing.reviewedBy = cleanText(reviewerId || "", 150) || null;
    listing.updatedAt = new Date().toISOString();

    if (!saveStorage(LISTINGS_KEY, listings)) {
      return {
        success: false,
        message: "Could not save verification status."
      };
    }

    recordAudit("explore_listing_verification_reviewed", {
      listingId: listingId,
      decision: decision,
      reviewerId: listing.reviewedBy
    });

    return {
      success: true,
      listing: listing,
      message: "Verification status saved locally.",
      note: "This does not verify a real location or business."
    };
  }

  /*
   * Create a local report about a listing or its location.
   */
  function createReport(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        message: "Report details are required."
      };
    }

    const listingId = cleanText(details.listingId, 150);

    if (!listingId || !getListing(listingId)) {
      return {
        success: false,
        message: "A valid listing ID is required."
      };
    }

    const reports = readStorage(REPORTS_KEY, []);

    const report = {
      id: createId("explore_report"),
      listingId: listingId,
      reporterId: cleanText(details.reporterId || "", 150) || null,
      reason: cleanText(details.reason || "Other", 150),
      description: cleanText(details.description || "", 3000),
      status: "open",
      reviewedBy: null,
      resolution: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      note: "Local report only; no real listing action taken."
    };

    reports.push(report);

    if (!saveStorage(REPORTS_KEY, reports)) {
      return {
        success: false,
        message: "Could not save the report."
      };
    }

    recordAudit("explore_report_created", {
      reportId: report.id,
      listingId: listingId
    });

    return {
      success: true,
      report: report,
      message: "Explore report saved locally."
    };
  }

  function getReports(filters) {
    const options = filters || {};

    return readStorage(REPORTS_KEY, []).filter(
      function (report) {
        if (
          options.status &&
          report.status !== options.status
        ) {
          return false;
        }

        if (
          options.listingId &&
          report.listingId !== options.listingId
        ) {
          return false;
        }

        return true;
      }
    );
  }

  function updateReportStatus(
    reportId,
    status,
    reviewerId,
    resolution
  ) {
    if (!REPORT_STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid report status."
      };
    }

    const reports = readStorage(REPORTS_KEY, []);

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
    report.reviewedBy = cleanText(reviewerId || "", 150) || null;
    report.resolution = cleanText(resolution || "", 2000);
    report.updatedAt = new Date().toISOString();

    if (!saveStorage(REPORTS_KEY, reports)) {
      return {
        success: false,
        message: "Could not update the report."
      };
    }

    recordAudit("explore_report_status_changed", {
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

  /*
   * Update local Explore configuration.
   * These values do not control the live app.
   */
  function updateSettings(changes) {
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return {
        success: false,
        message: "Settings changes are required."
      };
    }

    const settings = getSettings();
    const updated = Object.assign({}, settings);
    const allowed = Object.keys(DEFAULT_SETTINGS);

    for (const key of Object.keys(changes)) {
      if (!allowed.includes(key)) {
        return {
          success: false,
          message: "Unsupported setting: " + key
        };
      }

      if (typeof changes[key] !== "boolean") {
        return {
          success: false,
          message: key + " must be true or false."
        };
      }

      updated[key] = changes[key];
    }

    if (!saveStorage(SETTINGS_KEY, updated)) {
      return {
        success: false,
        message: "Could not save Explore settings."
      };
    }

    recordAudit("explore_settings_updated", {
      fields: Object.keys(changes)
    });

    return {
      success: true,
      settings: updated,
      message: "Explore settings saved locally.",
      note: "No live map or listing configuration was changed."
    };
  }

  /*
   * Return a local category overview for the admin dashboard.
   */
  function getSummary() {
    const listings = readStorage(LISTINGS_KEY, []);
    const reports = readStorage(REPORTS_KEY, []);

    const listingSummary = {
      total: listings.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
      removed: 0,
      verified: 0,
      unverified: 0,
      byCategory: {}
    };

    listings.forEach(function (listing) {
      if (
        Object.prototype.hasOwnProperty.call(
          listingSummary,
          listing.status
        )
      ) {
        listingSummary[listing.status]++;
      }

      if (listing.verificationStatus === "verified") {
        listingSummary.verified++;
      } else {
        listingSummary.unverified++;
      }

      listingSummary.byCategory[listing.category] =
        (listingSummary.byCategory[listing.category] || 0) + 1;
    });

    const reportSummary = {
      total: reports.length,
      open: 0,
      reviewing: 0,
      resolved: 0,
      dismissed: 0
    };

    reports.forEach(function (report) {
      if (
        Object.prototype.hasOwnProperty.call(
          reportSummary,
          report.status
        )
      ) {
        reportSummary[report.status]++;
      }
    });

    return {
      listings: listingSummary,
      reports: reportSummary,
      settings: getSettings(),
      generatedAt: new Date().toISOString(),
      note: "Statistics include local prototype records only."
    };
  }

  function getAuditLog() {
    return readStorage(AUDIT_KEY, []).slice().reverse();
  }

  window.RockyXAdminExplore = {
    createListing: createListing,
    getListing: getListing,
    getListings: getListings,
    reviewListing: reviewListing,
    reviewVerification: reviewVerification,
    createReport: createReport,
    getReports: getReports,
    updateReportStatus: updateReportStatus,
    getSettings: getSettings,
    updateSettings: updateSettings,
    getSummary: getSummary,
    getAuditLog: getAuditLog,

    getCategories: function () {
      return CATEGORIES.slice();
    },

    getListingStatuses: function () {
      return LISTING_STATUSES.slice();
    },

    getReportStatuses: function () {
      return REPORT_STATUSES.slice();
    }
  };
})();