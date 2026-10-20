/*
 * RockyX Admin Advertising
 *
 * Local prototype for advertising administration.
 *
 * IMPORTANT:
 * This module stores records in the current browser.
 * It does not deliver ads, charge advertisers, or approve
 * campaigns in the live platform.
 *
 * Production advertising, billing, targeting, and campaign
 * permissions must be handled by a secure backend.
 */

(function () {
  "use strict";

  const CAMPAIGNS_KEY = "rockyx_admin_ad_campaigns";
  const AUDIT_KEY = "rockyx_admin_advertising_audit";
  const SETTINGS_KEY = "rockyx_admin_advertising_settings";

  const CAMPAIGN_TYPES = [
    "standard_ad",
    "video_boost",
    "live_boost",
    "music_promotion",
    "marketplace_promotion",
    "explore_promotion"
  ];

  const PLACEMENTS = [
    "video_feed",
    "livestreams",
    "music",
    "marketplace",
    "explore",
    "search"
  ];

  const STATUSES = [
    "draft",
    "pending_review",
    "approved",
    "rejected",
    "active",
    "paused",
    "completed",
    "cancelled"
  ];

  const REVIEW_DECISIONS = [
    "approved",
    "rejected"
  ];

  const DEFAULT_SETTINGS = {
    advertisingEnabled: true,
    boostsEnabled: true,
    campaignsRequireReview: true,
    minimumBudgetMinor: 100,
    maximumBudgetMinor: 100000000,
    currency: "GHS"
  };

  function readStorage(key, fallback) {
    try {
      const value = JSON.parse(
        localStorage.getItem(key) || "null"
      );

      return value === null ? fallback : value;
    } catch (error) {
      console.error(
        "RockyX Admin Advertising: storage read failed.",
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
        "RockyX Admin Advertising: storage save failed.",
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

  function validMoneyMinor(value) {
    return Number.isSafeInteger(value) && value >= 0;
  }

  function getSettings() {
    const saved = readStorage(SETTINGS_KEY, {});

    return Object.assign(
      {},
      DEFAULT_SETTINGS,
      saved
    );
  }

  function recordAudit(action, details) {
    const audit = readStorage(AUDIT_KEY, []);

    if (!Array.isArray(audit)) {
      return false;
    }

    audit.push({
      id: createId("advertising_audit"),
      action: action,
      details: details || {},
      createdAt: new Date().toISOString(),
      note: "Local demo log; not tamper-proof."
    });

    return saveStorage(AUDIT_KEY, audit);
  }

  function validateCampaign(details) {
    if (!details || typeof details !== "object") {
      return "Campaign details are required.";
    }

    if (
      typeof details.ownerId !== "string" ||
      !details.ownerId.trim()
    ) {
      return "An advertiser or creator ID is required.";
    }

    if (
      typeof details.title !== "string" ||
      !details.title.trim()
    ) {
      return "A campaign title is required.";
    }

    if (details.title.trim().length > 150) {
      return "The campaign title cannot exceed 150 characters.";
    }

    if (!CAMPAIGN_TYPES.includes(details.type)) {
      return "Choose a supported campaign type.";
    }

    if (!PLACEMENTS.includes(details.placement)) {
      return "Choose a supported advertising placement.";
    }

    if (!validMoneyMinor(details.budgetMinor)) {
      return "The budget must be a non-negative integer in minor currency units.";
    }

    const settings = getSettings();

    if (
      details.budgetMinor < settings.minimumBudgetMinor ||
      details.budgetMinor > settings.maximumBudgetMinor
    ) {
      return "The campaign budget is outside the configured limits.";
    }

    const currency = cleanText(
      details.currency || settings.currency,
      3
    ).toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      return "Enter a valid three-letter currency code.";
    }

    return null;
  }

  /*
   * Creates a local campaign record.
   * This does not submit a real advertising campaign.
   */
  function createCampaign(details) {
    const settings = getSettings();

    if (!settings.advertisingEnabled) {
      return {
        success: false,
        message: "Advertising is disabled in the local settings."
      };
    }

    if (
      details &&
      details.type === "video_boost" &&
      !settings.boostsEnabled
    ) {
      return {
        success: false,
        message: "Video boosts are disabled in the local settings."
      };
    }

    const error = validateCampaign(details);

    if (error) {
      return {
        success: false,
        message: error
      };
    }

    const campaigns = readStorage(CAMPAIGNS_KEY, []);

    if (!Array.isArray(campaigns)) {
      return {
        success: false,
        message: "Campaign storage is invalid."
      };
    }

    const campaign = {
      id: createId("ad_campaign"),
      ownerId: details.ownerId.trim(),
      title: cleanText(details.title, 150),
      description: cleanText(details.description || "", 3000),
      type: details.type,
      placement: details.placement,
      budgetMinor: details.budgetMinor,
      currency: cleanText(
        details.currency || settings.currency,
        3
      ).toUpperCase(),
      targetCountry: cleanText(details.targetCountry || "", 100),
      targetAudience: cleanText(details.targetAudience || "", 500),
      creativeReference: cleanText(
        details.creativeReference || "",
        500
      ),
      status: settings.campaignsRequireReview
        ? "pending_review"
        : "draft",
      reviewReason: "",
      reviewedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startsAt: details.startsAt || null,
      endsAt: details.endsAt || null,
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0
      },
      note: "Local campaign record; no ad delivery or billing."
    };

    if (
      campaign.startsAt &&
      Number.isNaN(new Date(campaign.startsAt).getTime())
    ) {
      return {
        success: false,
        message: "The campaign start date is invalid."
      };
    }

    if (
      campaign.endsAt &&
      Number.isNaN(new Date(campaign.endsAt).getTime())
    ) {
      return {
        success: false,
        message: "The campaign end date is invalid."
      };
    }

    if (
      campaign.startsAt &&
      campaign.endsAt &&
      new Date(campaign.endsAt) <= new Date(campaign.startsAt)
    ) {
      return {
        success: false,
        message: "The campaign end date must follow the start date."
      };
    }

    campaigns.push(campaign);

    if (!saveStorage(CAMPAIGNS_KEY, campaigns)) {
      return {
        success: false,
        message: "Could not save the campaign."
      };
    }

    recordAudit("campaign_created", {
      campaignId: campaign.id,
      type: campaign.type,
      placement: campaign.placement
    });

    return {
      success: true,
      campaign: campaign,
      message: "Campaign saved locally."
    };
  }

  function getCampaign(campaignId) {
    const campaigns = readStorage(CAMPAIGNS_KEY, []);

    return campaigns.find(function (campaign) {
      return campaign.id === campaignId;
    }) || null;
  }

  function getCampaigns(filters) {
    const options = filters || {};
    const campaigns = readStorage(CAMPAIGNS_KEY, []);

    if (!Array.isArray(campaigns)) {
      return [];
    }

    return campaigns.filter(function (campaign) {
      if (
        options.status &&
        campaign.status !== options.status
      ) {
        return false;
      }

      if (
        options.type &&
        campaign.type !== options.type
      ) {
        return false;
      }

      if (
        options.placement &&
        campaign.placement !== options.placement
      ) {
        return false;
      }

      if (
        options.ownerId &&
        campaign.ownerId !== options.ownerId
      ) {
        return false;
      }

      if (options.search) {
        const query = String(options.search).toLowerCase();

        const searchable = [
          campaign.title,
          campaign.description,
          campaign.ownerId,
          campaign.targetCountry
        ].join(" ").toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  /*
   * Records an administrative review decision.
   * Approval does not activate real advertising.
   */
  function reviewCampaign(
    campaignId,
    decision,
    reason,
    reviewerId
  ) {
    if (!REVIEW_DECISIONS.includes(decision)) {
      return {
        success: false,
        message: "Choose approved or rejected."
      };
    }

    const campaigns = readStorage(CAMPAIGNS_KEY, []);

    const campaign = campaigns.find(function (item) {
      return item.id === campaignId;
    });

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found."
      };
    }

    if (campaign.status !== "pending_review") {
      return {
        success: false,
        message: "Only campaigns awaiting review can be reviewed."
      };
    }

    campaign.status = decision;
    campaign.reviewReason = cleanText(reason || "", 2000);
    campaign.reviewedBy = cleanText(reviewerId || "", 100) || null;
    campaign.updatedAt = new Date().toISOString();

    if (!saveStorage(CAMPAIGNS_KEY, campaigns)) {
      return {
        success: false,
        message: "Could not save the review decision."
      };
    }

    recordAudit("campaign_reviewed", {
      campaignId: campaignId,
      decision: decision,
      reviewerId: campaign.reviewedBy
    });

    return {
      success: true,
      campaign: campaign,
      message: "Review decision recorded locally.",
      note: "No real advertising has been approved or delivered."
    };
  }

  /*
   * Records a local campaign status change.
   * A real campaign scheduler must enforce dates and budgets.
   */
  function setCampaignStatus(campaignId, status, reviewerId) {
    if (!STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid campaign status."
      };
    }

    const campaigns = readStorage(CAMPAIGNS_KEY, []);

    const campaign = campaigns.find(function (item) {
      return item.id === campaignId;
    });

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found."
      };
    }

    if (
      status === "active" &&
      campaign.status !== "approved" &&
      campaign.status !== "paused"
    ) {
      return {
        success: false,
        message: "Only approved or paused campaigns can be activated."
      };
    }

    if (
      status === "active" &&
      !getSettings().advertisingEnabled
    ) {
      return {
        success: false,
        message: "Advertising is disabled in the local settings."
      };
    }

    if (
      status === "active" &&
      campaign.type === "video_boost" &&
      !getSettings().boostsEnabled
    ) {
      return {
        success: false,
        message: "Video boosts are disabled in the local settings."
      };
    }

    campaign.status = status;
    campaign.reviewedBy =
      cleanText(reviewerId || "", 100) ||
      campaign.reviewedBy ||
      null;
    campaign.updatedAt = new Date().toISOString();

    if (!saveStorage(CAMPAIGNS_KEY, campaigns)) {
      return {
        success: false,
        message: "Could not update campaign status."
      };
    }

    recordAudit("campaign_status_changed", {
      campaignId: campaignId,
      status: status,
      reviewerId: campaign.reviewedBy
    });

    return {
      success: true,
      campaign: campaign,
      message: "Campaign status updated locally.",
      note: "No live ad delivery is connected."
    };
  }

  /*
   * Update local advertising settings.
   * These settings do not control the production platform.
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

    const allowed = [
      "advertisingEnabled",
      "boostsEnabled",
      "campaignsRequireReview",
      "minimumBudgetMinor",
      "maximumBudgetMinor",
      "currency"
    ];

    const current = getSettings();
    const updated = Object.assign({}, current);

    for (const key of Object.keys(changes)) {
      if (!allowed.includes(key)) {
        return {
          success: false,
          message: "Unsupported setting: " + key
        };
      }

      const value = changes[key];

      if (
        [
          "advertisingEnabled",
          "boostsEnabled",
          "campaignsRequireReview"
        ].includes(key) &&
        typeof value !== "boolean"
      ) {
        return {
          success: false,
          message: key + " must be true or false."
        };
      }

      if (
        [
          "minimumBudgetMinor",
          "maximumBudgetMinor"
        ].includes(key) &&
        !validMoneyMinor(value)
      ) {
        return {
          success: false,
          message: key + " must be a non-negative integer."
        };
      }

      if (key === "currency") {
        const currency = cleanText(value, 3).toUpperCase();

        if (!/^[A-Z]{3}$/.test(currency)) {
          return {
            success: false,
            message: "Currency must be a three-letter code."
          };
        }

        updated.currency = currency;
      } else {
        updated[key] = value;
      }
    }

    if (
      updated.minimumBudgetMinor >
      updated.maximumBudgetMinor
    ) {
      return {
        success: false,
        message: "Minimum budget cannot exceed maximum budget."
      };
    }

    if (!saveStorage(SETTINGS_KEY, updated)) {
      return {
        success: false,
        message: "Could not save advertising settings."
      };
    }

    recordAudit("advertising_settings_updated", {
      fields: Object.keys(changes)
    });

    return {
      success: true,
      settings: updated,
      message: "Advertising settings updated locally."
    };
  }

  /*
   * Record sample metrics for testing the dashboard.
   * Real metrics must come from verified ad delivery events.
   */
  function recordDemoMetrics(campaignId, metrics) {
    if (!metrics || typeof metrics !== "object") {
      return {
        success: false,
        message: "Metrics are required."
      };
    }

    const allowed = [
      "impressions",
      "clicks",
      "conversions"
    ];

    for (const key of Object.keys(metrics)) {
      if (
        !allowed.includes(key) ||
        !Number.isSafeInteger(metrics[key]) ||
        metrics[key] < 0
      ) {
        return {
          success: false,
          message: "Invalid demo metric: " + key
        };
      }
    }

    const campaigns = readStorage(CAMPAIGNS_KEY, []);

    const campaign = campaigns.find(function (item) {
      return item.id === campaignId;
    });

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found."
      };
    }

    campaign.metrics = Object.assign(
      {
        impressions: 0,
        clicks: 0,
        conversions: 0
      },
      campaign.metrics || {},
      metrics
    );

    campaign.updatedAt = new Date().toISOString();

    if (!saveStorage(CAMPAIGNS_KEY, campaigns)) {
      return {
        success: false,
        message: "Could not save demo metrics."
      };
    }

    return {
      success: true,
      campaign: campaign,
      message: "Demo metrics saved locally.",
      note: "These are not verified advertising analytics."
    };
  }

  function getSummary() {
    const campaigns = readStorage(CAMPAIGNS_KEY, []);

    const summary = {
      total: campaigns.length,
      pendingReview: 0,
      approved: 0,
      rejected: 0,
      active: 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
      byType: {},
      byPlacement: {},
      demoMetrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0
      }
    };

    campaigns.forEach(function (campaign) {
      if (campaign.status === "pending_review") {
        summary.pendingReview++;
      } else if (
        Object.prototype.hasOwnProperty.call(
          summary,
          campaign.status
        )
      ) {
        summary[campaign.status]++;
      }

      summary.byType[campaign.type] =
        (summary.byType[campaign.type] || 0) + 1;

      summary.byPlacement[campaign.placement] =
        (summary.byPlacement[campaign.placement] || 0) + 1;

      const metrics = campaign.metrics || {};

      summary.demoMetrics.impressions +=
        Number(metrics.impressions) || 0;

      summary.demoMetrics.clicks +=
        Number(metrics.clicks) || 0;

      summary.demoMetrics.conversions +=
        Number(metrics.conversions) || 0;
    });

    return {
      success: true,
      summary: summary,
      generatedAt: new Date().toISOString(),
      note: "Statistics include local prototype records only."
    };
  }

  function getAuditLog() {
    return readStorage(AUDIT_KEY, []).slice().reverse();
  }

  window.RockyXAdminAdvertising = {
    createCampaign: createCampaign,
    getCampaign: getCampaign,
    getCampaigns: getCampaigns,
    reviewCampaign: reviewCampaign,
    setCampaignStatus: setCampaignStatus,
    getSettings: getSettings,
    updateSettings: updateSettings,
    recordDemoMetrics: recordDemoMetrics,
    getSummary: getSummary,
    getAuditLog: getAuditLog,

    getCampaignTypes: function () {
      return CAMPAIGN_TYPES.slice();
    },

    getPlacements: function () {
      return PLACEMENTS.slice();
    },

    getStatuses: function () {
      return STATUSES.slice();
    }
  };
})();