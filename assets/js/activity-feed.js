/* =========================================
   ROCKYX ACTIVITY FEED
   Local activity feed foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_activity_feed";
  const FOLLOWING_KEY = "rockyx_following";
  const MAX_ACTIVITIES = 500;

  const ACTIVITY_TYPES = [
    "new_post",
    "new_video",
    "new_music",
    "new_template",
    "livestream_started",
    "new_product",
    "new_follower",
    "creator_milestone",
    "announcement"
  ];

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return "activity-" + Date.now() +
      "-" + Math.random().toString(36).slice(2, 10);
  }

  function normalizeId(value) {
    if (typeof value !== "string" && typeof value !== "number") {
      return null;
    }

    const id = String(value).trim();
    return id || null;
  }

  function cleanText(value, limit) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, limit || 500);
  }

  function loadActivities() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const activities = saved ? JSON.parse(saved) : [];

      return Array.isArray(activities) ? activities : [];
    } catch (error) {
      console.error(
        "RockyX activities could not be loaded:",
        error
      );

      return [];
    }
  }

  function saveActivities(activities) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(activities.slice(0, MAX_ACTIVITIES))
      );

      window.dispatchEvent(
        new CustomEvent("rockyx:activity-feed-updated", {
          detail: {
            count: activities.length
          }
        })
      );

      return true;
    } catch (error) {
      console.error(
        "RockyX activities could not be saved:",
        error
      );

      return false;
    }
  }

  function loadFollowing() {
    try {
      const saved = localStorage.getItem(FOLLOWING_KEY);
      const following = saved ? JSON.parse(saved) : {};

      return following &&
        typeof following === "object" &&
        !Array.isArray(following)
        ? following
        : {};
    } catch (error) {
      return {};
    }
  }

  function getFollowing(userId) {
    const id = normalizeId(userId);
    if (!id) return [];

    const following = loadFollowing();
    const list = following[id];

    return Array.isArray(list)
      ? [...new Set(list.map(normalizeId).filter(Boolean))]
      : [];
  }

  /*
   * Local prototype only.
   * Production following relationships must be stored
   * and verified by the backend.
   */
  function followAccount(userId, creatorId) {
    const user = normalizeId(userId);
    const creator = normalizeId(creatorId);

    if (!user || !creator || user === creator) {
      return false;
    }

    const following = loadFollowing();

    if (!Array.isArray(following[user])) {
      following[user] = [];
    }

    if (following[user].includes(creator)) {
      return true;
    }

    following[user].push(creator);

    try {
      localStorage.setItem(
        FOLLOWING_KEY,
        JSON.stringify(following)
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function unfollowAccount(userId, creatorId) {
    const user = normalizeId(userId);
    const creator = normalizeId(creatorId);

    if (!user || !creator) return false;

    const following = loadFollowing();

    if (!Array.isArray(following[user])) {
      return false;
    }

    following[user] = following[user].filter(
      id => id !== creator
    );

    try {
      localStorage.setItem(
        FOLLOWING_KEY,
        JSON.stringify(following)
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function publishActivity(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Activity details are required."
      };
    }

    const actorId = normalizeId(details.actorId);
    const type = details.type;

    if (!actorId) {
      return {
        success: false,
        error: "A valid creator or actor ID is required."
      };
    }

    if (!ACTIVITY_TYPES.includes(type)) {
      return {
        success: false,
        error: "Unsupported activity type."
      };
    }

    const activity = {
      id: createId(),
      actorId,
      actorName: cleanText(details.actorName, 100),
      actorImage: cleanText(details.actorImage, 1000),
      type,
      title: cleanText(details.title, 200),
      description: cleanText(details.description, 1000),
      contentId: normalizeId(details.contentId),
      contentType: cleanText(details.contentType, 60),
      contentImage: cleanText(details.contentImage, 1000),
      link: safeInternalLink(details.link),
      createdAt: new Date().toISOString()
    };

    const activities = loadActivities();
    activities.unshift(activity);

    if (!saveActivities(activities)) {
      return {
        success: false,
        error: "The activity could not be saved."
      };
    }

    window.dispatchEvent(
      new CustomEvent("rockyx:activity-published", {
        detail: { ...activity }
      })
    );

    return {
      success: true,
      activity: { ...activity }
    };
  }

  function safeInternalLink(link) {
    if (typeof link !== "string" || !link.trim()) {
      return "";
    }

    const value = link.trim();

    if (
      !value.startsWith("/") ||
      value.startsWith("//") ||
      value.startsWith("/\\")
    ) {
      return "";
    }

    return value.slice(0, 1000);
  }

  function getFeed(userId, options) {
    const user = normalizeId(userId);
    if (!user) return [];

    const settings = options || {};
    const followedIds = getFollowing(user);

    let activities = loadActivities().filter(
      activity => followedIds.includes(activity.actorId)
    );

    if (settings.types) {
      if (!Array.isArray(settings.types)) return [];

      activities = activities.filter(
        activity => settings.types.includes(activity.type)
      );
    }

    if (settings.excludeTypes) {
      if (!Array.isArray(settings.excludeTypes)) return [];

      activities = activities.filter(
        activity => !settings.excludeTypes.includes(activity.type)
      );
    }

    if (settings.since) {
      const since = new Date(settings.since).getTime();

      if (Number.isFinite(since)) {
        activities = activities.filter(
          activity =>
            new Date(activity.createdAt).getTime() >= since
        );
      }
    }

    const limit = Number.isInteger(settings.limit)
      ? Math.max(1, Math.min(settings.limit, MAX_ACTIVITIES))
      : 50;

    return activities
      .sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      .slice(0, limit)
      .map(activity => ({ ...activity }));
  }

  function getExploreActivities(options) {
    const settings = options || {};

    let activities = loadActivities();

    if (settings.type) {
      activities = activities.filter(
        activity => activity.type === settings.type
      );
    }

    const limit = Number.isInteger(settings.limit)
      ? Math.max(1, Math.min(settings.limit, MAX_ACTIVITIES))
      : 30;

    return activities
      .sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      .slice(0, limit)
      .map(activity => ({ ...activity }));
  }

  function removeActivity(activityId) {
    const id = normalizeId(activityId);
    if (!id) return false;

    const activities = loadActivities();
    const remaining = activities.filter(
      activity => activity.id !== id
    );

    if (remaining.length === activities.length) {
      return false;
    }

    return saveActivities(remaining);
  }

  function clearActivities() {
    return saveActivities([]);
  }

  function getActivityTypes() {
    return [...ACTIVITY_TYPES];
  }

  window.RockyXActivityFeed = {
    publishActivity,
    getFeed,
    getExploreActivities,
    removeActivity,
    clearActivities,
    followAccount,
    unfollowAccount,
    getFollowing,
    getActivityTypes
  };

})();