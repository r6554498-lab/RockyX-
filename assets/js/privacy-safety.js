/* =========================================
   ROCKYX PRIVACY & SAFETY
   Privacy preferences and user controls
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_privacy_safety";

  const DEFAULT_SETTINGS = {
    profileVisibility: "public",
    messaging: "everyone",
    comments: "everyone",
    mentions: "everyone",
    activityVisibility: "followers",
    showOnlineStatus: true,
    allowTagging: true,
    allowPersonalizedRecommendations: true
  };

  const VISIBILITY_OPTIONS = [
    "public",
    "private"
  ];

  const AUDIENCE_OPTIONS = [
    "everyone",
    "followers",
    "nobody"
  ];

  function loadData() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return {
          settings: {},
          blockedUsers: [],
          mutedUsers: [],
          hiddenContent: []
        };
      }

      return {
        settings: data.settings || {},
        blockedUsers: Array.isArray(data.blockedUsers)
          ? data.blockedUsers
          : [],
        mutedUsers: Array.isArray(data.mutedUsers)
          ? data.mutedUsers
          : [],
        hiddenContent: Array.isArray(data.hiddenContent)
          ? data.hiddenContent
          : []
      };
    } catch (error) {
      return {
        settings: {},
        blockedUsers: [],
        mutedUsers: [],
        hiddenContent: []
      };
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getCurrentUser() {
    if (window.RockyXUserAccounts) {
      return window.RockyXUserAccounts.getCurrentUser();
    }

    return null;
  }

  function resolveUserId(userId) {
    if (userId) {
      return String(userId);
    }

    const user = getCurrentUser();

    return user && user.id ? String(user.id) : null;
  }

  function getSettings(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }

    const data = loadData();

    return Object.assign(
      {},
      DEFAULT_SETTINGS,
      data.settings[userId] || {}
    );
  }

  function updateSettings(updates, userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    if (!updates || typeof updates !== "object") {
      return {
        success: false,
        message: "Valid settings are required."
      };
    }

    const data = loadData();
    const current = getSettings(userId);
    const next = Object.assign({}, current);

    const allowedKeys = [
      "profileVisibility",
      "messaging",
      "comments",
      "mentions",
      "activityVisibility",
      "showOnlineStatus",
      "allowTagging",
      "allowPersonalizedRecommendations"
    ];

    for (const key of Object.keys(updates)) {
      if (!allowedKeys.includes(key)) {
        return {
          success: false,
          message: "Unsupported privacy setting: " + key
        };
      }

      const value = updates[key];

      if (
        key === "profileVisibility" &&
        !VISIBILITY_OPTIONS.includes(value)
      ) {
        return {
          success: false,
          message: "Invalid profile visibility."
        };
      }

      if (
        [
          "messaging",
          "comments",
          "mentions",
          "activityVisibility"
        ].includes(key) &&
        !AUDIENCE_OPTIONS.includes(value)
      ) {
        return {
          success: false,
          message: "Invalid audience setting for " + key
        };
      }

      if (
        [
          "showOnlineStatus",
          "allowTagging",
          "allowPersonalizedRecommendations"
        ].includes(key) &&
        typeof value !== "boolean"
      ) {
        return {
          success: false,
          message: key + " must be true or false."
        };
      }

      next[key] = value;
    }

    data.settings[userId] = next;
    saveData(data);

    return {
      success: true,
      settings: next
    };
  }

  function resetSettings(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return {
        success: false,
        message: "A user profile is required."
      };
    }

    const data = loadData();
    data.settings[userId] = Object.assign({}, DEFAULT_SETTINGS);
    saveData(data);

    return {
      success: true,
      settings: data.settings[userId]
    };
  }

  function addToList(listName, targetUserId, userId) {
    userId = resolveUserId(userId);
    targetUserId = String(targetUserId || "");

    if (!userId || !targetUserId) {
      return {
        success: false,
        message: "Both user IDs are required."
      };
    }

    if (userId === targetUserId) {
      return {
        success: false,
        message: "You cannot add your own account."
      };
    }

    const data = loadData();

    if (!data[listName][userId]) {
      data[listName][userId] = [];
    }

    if (!data[listName][userId].includes(targetUserId)) {
      data[listName][userId].push(targetUserId);
    }

    saveData(data);

    return {
      success: true,
      users: data[listName][userId]
    };
  }

  function removeFromList(listName, targetUserId, userId) {
    userId = resolveUserId(userId);
    targetUserId = String(targetUserId || "");

    if (!userId || !targetUserId) {
      return {
        success: false,
        message: "Both user IDs are required."
      };
    }

    const data = loadData();

    if (!data[listName][userId]) {
      data[listName][userId] = [];
    }

    data[listName][userId] =
      data[listName][userId].filter(function (id) {
        return id !== targetUserId;
      });

    saveData(data);

    return {
      success: true,
      users: data[listName][userId]
    };
  }

  function getList(listName, userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return [];
    }

    const data = loadData();

    return Array.isArray(data[listName][userId])
      ? data[listName][userId].slice()
      : [];
  }

  function blockUser(targetUserId, userId) {
    return addToList("blockedUsers", targetUserId, userId);
  }

  function unblockUser(targetUserId, userId) {
    return removeFromList("blockedUsers", targetUserId, userId);
  }

  function getBlockedUsers(userId) {
    return getList("blockedUsers", userId);
  }

  function isBlocked(targetUserId, userId) {
    return getBlockedUsers(userId).includes(String(targetUserId));
  }

  function muteUser(targetUserId, userId) {
    return addToList("mutedUsers", targetUserId, userId);
  }

  function unmuteUser(targetUserId, userId) {
    return removeFromList("mutedUsers", targetUserId, userId);
  }

  function getMutedUsers(userId) {
    return getList("mutedUsers", userId);
  }

  function hideContent(contentType, contentId, userId) {
    userId = resolveUserId(userId);

    contentType = String(contentType || "");
    contentId = String(contentId || "");

    if (!userId || !contentType || !contentId) {
      return {
        success: false,
        message: "User ID, content type, and content ID are required."
      };
    }

    const data = loadData();

    const exists = data.hiddenContent.some(function (item) {
      return (
        item.userId === userId &&
        item.contentType === contentType &&
        item.contentId === contentId
      );
    });

    if (!exists) {
      data.hiddenContent.push({
        userId: userId,
        contentType: contentType,
        contentId: contentId,
        createdAt: new Date().toISOString()
      });
    }

    saveData(data);

    return {
      success: true,
      message: "Content hidden in this browser."
    };
  }

  function unhideContent(contentType, contentId, userId) {
    userId = resolveUserId(userId);

    const data = loadData();

    data.hiddenContent = data.hiddenContent.filter(function (item) {
      return !(
        item.userId === userId &&
        item.contentType === String(contentType) &&
        item.contentId === String(contentId)
      );
    });

    saveData(data);

    return {
      success: true
    };
  }

  function isContentHidden(contentType, contentId, userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return false;
    }

    return loadData().hiddenContent.some(function (item) {
      return (
        item.userId === userId &&
        item.contentType === String(contentType) &&
        item.contentId === String(contentId)
      );
    });
  }

  function getHiddenContent(userId) {
    userId = resolveUserId(userId);

    if (!userId) {
      return [];
    }

    return loadData().hiddenContent.filter(function (item) {
      return item.userId === userId;
    });
  }

  function getAudienceOptions() {
    return AUDIENCE_OPTIONS.slice();
  }

  function getVisibilityOptions() {
    return VISIBILITY_OPTIONS.slice();
  }

  window.RockyXPrivacySafety = {
    getSettings: getSettings,
    updateSettings: updateSettings,
    resetSettings: resetSettings,
    blockUser: blockUser,
    unblockUser: unblockUser,
    getBlockedUsers: getBlockedUsers,
    isBlocked: isBlocked,
    muteUser: muteUser,
    unmuteUser: unmuteUser,
    getMutedUsers: getMutedUsers,
    hideContent: hideContent,
    unhideContent: unhideContent,
    isContentHidden: isContentHidden,
    getHiddenContent: getHiddenContent,
    getAudienceOptions: getAudienceOptions,
    getVisibilityOptions: getVisibilityOptions
  };

})();