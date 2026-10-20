/* =========================================
   ROCKYX BOOST SYSTEM
   Video Boost + LIVE Boost
   One World. One Platform.
   =========================================

   Foundation only.
   Real payments, campaign delivery, and
   verified analytics require a secure backend.
*/

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_boost_campaigns";
  const SETTINGS_KEY = "rockyx_boost_settings";

  const CAMPAIGN_TYPES = {
    VIDEO: "video",
    LIVE: "live"
  };

  const CAMPAIGN_STATUSES = [
    "draft",
    "pending_review",
    "approved",
    "active",
    "paused",
    "completed",
    "rejected",
    "cancelled"
  ];

  const CAMPAIGN_GOALS = [
    "views",
    "profile_visits",
    "followers",
    "website_visits",
    "live_viewers"
  ];

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error("RockyX Boost: Could not read storage.", error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("RockyX Boost: Could not save data.", error);
      return false;
    }
  }

  function createId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return (
      "boost_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function getCampaigns() {
    const campaigns = readJSON(STORAGE_KEY, []);
    return Array.isArray(campaigns) ? campaigns : [];
  }

  function getSettings() {
    return readJSON(SETTINGS_KEY, {
      defaultCurrency: "GHS",
      minimumBudgetMinor: 1000,
      maximumBudgetMinor: 10000000,
      defaultDurationDays: 3,
      maximumDurationDays: 30
    });
  }

  function getCampaign(campaignId) {
    return getCampaigns().find(
      campaign => campaign.id === campaignId
    ) || null;
  }

  function validateCampaign(input) {
    const errors = [];

    if (!input || typeof input !== "object") {
      return {
        valid: false,
        errors: ["Campaign information is required."]
      };
    }

    if (
      !Object.values(CAMPAIGN_TYPES).includes(input.type)
    ) {
      errors.push("Choose video or LIVE promotion.");
    }

    if (
      typeof input.contentId !== "string" ||
      !input.contentId.trim()
    ) {
      errors.push("A video or livestream ID is required.");
    }

    if (
      typeof input.ownerId !== "string" ||
      !input.ownerId.trim()
    ) {
      errors.push("The campaign owner ID is required.");
    }

    if (!CAMPAIGN_GOALS.includes(input.goal)) {
      errors.push("Choose a supported campaign goal.");
    }

    const budget = Number(input.budgetMinor);

    if (
      !Number.isSafeInteger(budget) ||
      budget <= 0
    ) {
      errors.push(
        "Enter a positive whole-number budget in minor currency units."
      );
    }

    const duration = Number(input.durationDays);

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 30
    ) {
      errors.push(
        "Campaign duration must be between 1 and 30 days."
      );
    }

    if (
      input.type === CAMPAIGN_TYPES.LIVE &&
      input.goal !== "live_viewers" &&
      input.goal !== "profile_visits" &&
      input.goal !== "followers"
    ) {
      errors.push(
        "Choose a suitable goal for LIVE promotion."
      );
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function createCampaign(input) {
    const validation = validateCampaign(input);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    const settings = getSettings();
    const budget = Number(input.budgetMinor);

    if (
      budget < settings.minimumBudgetMinor ||
      budget > settings.maximumBudgetMinor
    ) {
      return {
        success: false,
        errors: [
          "The budget is outside the currently configured demo limits."
        ]
      };
    }

    const now = new Date().toISOString();

    const campaign = {
      id: createId(),
      ownerId: input.ownerId.trim(),
      contentId: input.contentId.trim(),
      type: input.type,
      goal: input.goal,
      budgetMinor: budget,
      currency: String(
        input.currency || settings.defaultCurrency
      ).toUpperCase(),
      durationDays: Number(input.durationDays),
      audience: {
        mode: input.audience?.mode || "automatic",
        country: input.audience?.country || null,
        interests: Array.isArray(input.audience?.interests)
          ? input.audience.interests
          : []
      },
      status: "draft",
      reviewNotes: "",
      metrics: {
        impressions: 0,
        views: 0,
        profileVisits: 0,
        followers: 0,
        clicks: 0,
        spendMinor: 0
      },
      createdAt: now,
      updatedAt: now
    };

    const campaigns = getCampaigns();
    campaigns.push(campaign);

    if (!writeJSON(STORAGE_KEY, campaigns)) {
      return {
        success: false,
        errors: ["Could not save the campaign."]
      };
    }

    return {
      success: true,
      campaign: { ...campaign }
    };
  }

  function getOwnerCampaigns(ownerId) {
    if (!ownerId) return [];

    return getCampaigns()
      .filter(campaign => campaign.ownerId === ownerId)
      .map(campaign => ({ ...campaign }));
  }

  function updateCampaign(campaignId, ownerId, changes) {
    const campaigns = getCampaigns();
    const index = campaigns.findIndex(
      campaign =>
        campaign.id === campaignId &&
        campaign.ownerId === ownerId
    );

    if (index === -1) {
      return {
        success: false,
        error: "Campaign not found."
      };
    }

    const campaign = campaigns[index];

    if (
      !["draft", "paused"].includes(campaign.status)
    ) {
      return {
        success: false,
        error: "Only draft or paused campaigns can be edited in this demo."
      };
    }

    const allowedFields = [
      "goal",
      "budgetMinor",
      "durationDays",
      "audience"
    ];

    allowedFields.forEach(field => {
      if (
        Object.prototype.hasOwnProperty.call(changes, field)
      ) {
        campaign[field] = changes[field];
      }
    });

    campaign.updatedAt = new Date().toISOString();

    const validation = validateCampaign(campaign);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    if (!writeJSON(STORAGE_KEY, campaigns)) {
      return {
        success: false,
        error: "Could not save the campaign."
      };
    }

    return {
      success: true,
      campaign: { ...campaign }
    };
  }

  function submitForReview(campaignId, ownerId) {
    return updateStatus(
      campaignId,
      ownerId,
      "pending_review"
    );
  }

  function updateStatus(campaignId, ownerId, newStatus) {
    const allowedStatuses = [
      "pending_review",
      "paused",
      "cancelled"
    ];

    if (!allowedStatuses.includes(newStatus)) {
      return {
        success: false,
        error: "This status requires an authorized backend workflow."
      };
    }

    const campaigns = getCampaigns();
    const index = campaigns.findIndex(
      campaign =>
        campaign.id === campaignId &&
        campaign.ownerId === ownerId
    );

    if (index === -1) {
      return {
        success: false,
        error: "Campaign not found."
      };
    }

    campaigns[index].status = newStatus;
    campaigns[index].updatedAt = new Date().toISOString();

    if (!writeJSON(STORAGE_KEY, campaigns)) {
      return {
        success: false,
        error: "Could not save the status."
      };
    }

    return {
      success: true,
      campaign: { ...campaigns[index] }
    };
  }

  function getCampaignTypes() {
    return { ...CAMPAIGN_TYPES };
  }

  function getCampaignGoals() {
    return [...CAMPAIGN_GOALS];
  }

  function getCampaignStatuses() {
    return [...CAMPAIGN_STATUSES];
  }

  window.RockyXBoosts = {
    createCampaign,
    getCampaign,
    getOwnerCampaigns,
    updateCampaign,
    submitForReview,
    getSettings,
    getCampaignTypes,
    getCampaignGoals,
    getCampaignStatuses
  };

  window.dispatchEvent(
    new CustomEvent("rockyx:boosts-ready")
  );
})();