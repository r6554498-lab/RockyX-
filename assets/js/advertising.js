/* =========================================
   ROCKYX ADVERTISING SYSTEM
   Campaigns, budgets, and performance
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_advertising_campaigns";
  const EVENTS_KEY = "rockyx_advertising_events";

  const PLACEMENTS = [
    "social_feed",
    "music",
    "marketplace",
    "explore",
    "livestream",
    "search"
  ];

  const STATUSES = [
    "draft",
    "pending_review",
    "approved",
    "active",
    "paused",
    "completed",
    "rejected"
  ];

  function load(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function createId(prefix) {
    return prefix + "_" + Date.now() + "_" +
      Math.random().toString(36).slice(2, 9);
  }

  function getCurrentUser() {
    if (window.RockyXUserAccounts) {
      return window.RockyXUserAccounts.getCurrentUser();
    }

    return null;
  }

  function getPlacements() {
    return PLACEMENTS.slice();
  }

  function getStatuses() {
    return STATUSES.slice();
  }

  function createCampaign(options) {
    options = options || {};

    const user = getCurrentUser();
    const advertiserId = options.advertiserId || (user && user.id);

    const name = String(options.name || "").trim();
    const placement = String(options.placement || "");
    const currency = String(options.currency || "GHS").toUpperCase();

    const budget = Number(options.budget);
    const startDate = options.startDate || null;
    const endDate = options.endDate || null;

    if (!advertiserId) {
      return {
        success: false,
        message: "An advertiser profile is required."
      };
    }

    if (!name || name.length > 120) {
      return {
        success: false,
        message: "Enter a campaign name of 1–120 characters."
      };
    }

    if (!PLACEMENTS.includes(placement)) {
      return {
        success: false,
        message: "Choose a supported advertising placement."
      };
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      return {
        success: false,
        message: "The campaign budget must be greater than zero."
      };
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      return {
        success: false,
        message: "Enter a valid three-letter currency code."
      };
    }

    if (startDate && Number.isNaN(Date.parse(startDate))) {
      return {
        success: false,
        message: "The campaign start date is invalid."
      };
    }

    if (endDate && Number.isNaN(Date.parse(endDate))) {
      return {
        success: false,
        message: "The campaign end date is invalid."
      };
    }

    if (
      startDate &&
      endDate &&
      Date.parse(endDate) < Date.parse(startDate)
    ) {
      return {
        success: false,
        message: "The end date cannot be before the start date."
      };
    }

    const campaign = {
      id: createId("campaign"),
      advertiserId: String(advertiserId),
      name: name,
      description: String(options.description || "").trim(),
      placement: placement,
      destinationUrl: String(options.destinationUrl || "").trim(),
      creativeId: options.creativeId || null,
      currency: currency,
      budget: Math.round(budget * 100) / 100,
      spent: 0,
      startDate: startDate,
      endDate: endDate,
      status: "draft",
      targeting: {
        locations: Array.isArray(options.locations)
          ? options.locations.map(String)
          : [],
        interests: Array.isArray(options.interests)
          ? options.interests.map(String)
          : [],
        audienceAgeMin: options.audienceAgeMin || null,
        audienceAgeMax: options.audienceAgeMax || null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const campaigns = load(STORAGE_KEY);
    campaigns.push(campaign);
    save(STORAGE_KEY, campaigns);

    return {
      success: true,
      campaign: campaign
    };
  }

  function getCampaign(campaignId) {
    return load(STORAGE_KEY).find(function (campaign) {
      return campaign.id === campaignId;
    }) || null;
  }

  function getCampaigns(options) {
    options = options || {};

    let campaigns = load(STORAGE_KEY);

    if (options.advertiserId) {
      campaigns = campaigns.filter(function (campaign) {
        return campaign.advertiserId === String(options.advertiserId);
      });
    }

    if (options.status) {
      campaigns = campaigns.filter(function (campaign) {
        return campaign.status === options.status;
      });
    }

    if (options.placement) {
      campaigns = campaigns.filter(function (campaign) {
        return campaign.placement === options.placement;
      });
    }

    return campaigns.sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function updateCampaign(campaignId, updates) {
    updates = updates || {};

    const campaigns = load(STORAGE_KEY);

    const index = campaigns.findIndex(function (campaign) {
      return campaign.id === campaignId;
    });

    if (index === -1) {
      return {
        success: false,
        message: "Campaign not found."
      };
    }

    const campaign = campaigns[index];

    // Do not allow direct client-side changes to spending,
    // approval, or campaign ownership.
    const allowedFields = [
      "name",
      "description",
      "destinationUrl",
      "creativeId",
      "startDate",
      "endDate"
    ];

    allowedFields.forEach(function (field) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        campaign[field] = updates[field];
      }
    });

    campaign.updatedAt = new Date().toISOString();

    save(STORAGE_KEY, campaigns);

    return {
      success: true,
      campaign: campaign
    };
  }

  function submitForReview(campaignId) {
    return changeStatus(campaignId, "pending_review");
  }

  function changeStatus(campaignId, status) {
    if (!STATUSES.includes(status)) {
      return {
        success: false,
        message: "Invalid campaign status."
      };
    }

    const campaigns = load(STORAGE_KEY);

    const campaign = campaigns.find(function (item) {
      return item.id === campaignId;
    });

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found."
      };
    }

    const permittedTransitions = {
      draft: ["pending_review"],
      pending_review: ["draft"],
      approved: ["active", "paused"],
      active: ["paused", "completed"],
      paused: ["active", "completed"],
      completed: [],
      rejected: ["draft"]
    };

    if (
      !permittedTransitions[campaign.status] ||
      !permittedTransitions[campaign.status].includes(status)
    ) {
      return {
        success: false,
        message: "This campaign status change is not permitted."
      };
    }

    campaign.status = status;
    campaign.updatedAt = new Date().toISOString();

    save(STORAGE_KEY, campaigns);

    return {
      success: true,
      campaign: campaign
    };
  }

  function recordEvent(options) {
    options = options || {};

    const campaign = getCampaign(options.campaignId);

    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found."
      };
    }

    const eventType = String(options.type || "");

    if (!["impression", "click", "engagement"].includes(eventType)) {
      return {
        success: false,
        message: "Unsupported advertising event."
      };
    }

    const event = {
      id: createId("ad_event"),
      campaignId: campaign.id,
      type: eventType,
      contentId: options.contentId || null,
      createdAt: new Date().toISOString()
    };

    const events = load(EVENTS_KEY);
    events.push(event);
    save(EVENTS_KEY, events);

    return {
      success: true,
      event: event
    };
  }

  function getCampaignAnalytics(campaignId) {
    const campaign = getCampaign(campaignId);

    if (!campaign) {
      return null;
    }

    const events = load(EVENTS_KEY).filter(function (event) {
      return event.campaignId === campaignId;
    });

    const impressions = events.filter(function (event) {
      return event.type === "impression";
    }).length;

    const clicks = events.filter(function (event) {
      return event.type === "click";
    }).length;

    const engagements = events.filter(function (event) {
      return event.type === "engagement";
    }).length;

    return {
      campaignId: campaignId,
      impressions: impressions,
      clicks: clicks,
      engagements: engagements,
      clickThroughRate: impressions
        ? Number(((clicks / impressions) * 100).toFixed(2))
        : 0,
      budget: campaign.budget,
      spent: campaign.spent,
      remainingBudget: Math.max(0, campaign.budget - campaign.spent),
      currency: campaign.currency
    };
  }

  function getAdvertiserSummary(advertiserId) {
    const campaigns = getCampaigns({
      advertiserId: advertiserId
    });

    return campaigns.reduce(function (summary, campaign) {
      summary.campaignCount++;
      summary.totalBudget += campaign.budget;
      summary.totalSpent += campaign.spent;

      if (campaign.status === "active") {
        summary.activeCampaigns++;
      }

      return summary;
    }, {
      campaignCount: 0,
      activeCampaigns: 0,
      totalBudget: 0,
      totalSpent: 0
    });
  }

  function deleteCampaign(campaignId) {
    const campaigns = load(STORAGE_KEY);

    const updated = campaigns.filter(function (campaign) {
      return campaign.id !== campaignId;
    });

    if (updated.length === campaigns.length) {
      return {
        success: false,
        message: "Campaign not found."
      };
    }

    save(STORAGE_KEY, updated);

    return {
      success: true,
      message: "Campaign deleted from this browser."
    };
  }

  window.RockyXAdvertising = {
    createCampaign: createCampaign,
    getCampaign: getCampaign,
    getCampaigns: getCampaigns,
    updateCampaign: updateCampaign,
    submitForReview: submitForReview,
    changeStatus: changeStatus,
    recordEvent: recordEvent,
    getCampaignAnalytics: getCampaignAnalytics,
    getAdvertiserSummary: getAdvertiserSummary,
    deleteCampaign: deleteCampaign,
    getPlacements: getPlacements,
    getStatuses: getStatuses
  };

})();