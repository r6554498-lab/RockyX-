/*
 * RockyX Notification Settings
 *
 * Local prototype for user notification preferences.
 *
 * IMPORTANT:
 * Settings are stored in this browser only.
 * Real push notifications, emails, SMS, and cross-device
 * synchronization require a secure backend.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_notification_settings";

  const DEFAULT_SETTINGS = {
    inApp: true,

    messages: true,
    messageRequests: true,

    comments: true,
    commentReplies: true,
    mentions: true,

    likes: true,
    follows: true,
    creatorActivity: true,

    liveStreams: true,
    liveInvitations: true,
    gifts: true,

    musicReleases: true,
    musicRecommendations: true,

    marketplaceOrders: true,
    shippingUpdates: true,
    returnRefundUpdates: true,
    disputeUpdates: true,

    templateUpdates: true,
    creatorTasks: true,
    creatorRewards: true,

    subscriptions: true,
    promotions: false,
    productRecommendations: false,

    securityAlerts: true,
    accountUpdates: true,

    email: false,
    sms: false,
    push: true,

    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00"
  };

  const BOOLEAN_KEYS = Object.keys(
    DEFAULT_SETTINGS
  ).filter(function (key) {
    return typeof DEFAULT_SETTINGS[key] === "boolean";
  });

  const TIME_KEYS = [
    "quietHoursStart",
    "quietHoursEnd"
  ];

  function readAll() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );

      return Object.assign(
        {},
        DEFAULT_SETTINGS,
        saved
      );
    } catch (error) {
      console.error(
        "RockyX notification settings error:",
        error
      );

      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveAll(settings) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

      return true;
    } catch (error) {
      console.error(
        "RockyX notification settings save error:",
        error
      );

      return false;
    }
  }

  function getSettings() {
    return readAll();
  }

  function getSetting(key) {
    const settings = readAll();

    if (
      !Object.prototype.hasOwnProperty.call(
        DEFAULT_SETTINGS,
        key
      )
    ) {
      return {
        success: false,
        message: "Unknown notification setting."
      };
    }

    return {
      success: true,
      key: key,
      value: settings[key]
    };
  }

  function isValidTime(value) {
    return typeof value === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function updateSetting(key, value) {
    if (
      !Object.prototype.hasOwnProperty.call(
        DEFAULT_SETTINGS,
        key
      )
    ) {
      return {
        success: false,
        message: "Unknown notification setting."
      };
    }

    if (
      BOOLEAN_KEYS.includes(key) &&
      typeof value !== "boolean"
    ) {
      return {
        success: false,
        message: "This setting must be true or false."
      };
    }

    if (
      TIME_KEYS.includes(key) &&
      !isValidTime(value)
    ) {
      return {
        success: false,
        message: "Time must use HH:MM format."
      };
    }

    const settings = readAll();
    settings[key] = value;

    if (!saveAll(settings)) {
      return {
        success: false,
        message: "Could not save the notification setting."
      };
    }

    return {
      success: true,
      key: key,
      value: value,
      message: "Notification setting updated locally."
    };
  }

  function updateSettings(changes) {
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return {
        success: false,
        message: "Provide notification setting changes."
      };
    }

    const current = readAll();

    for (const key of Object.keys(changes)) {
      if (
        !Object.prototype.hasOwnProperty.call(
          DEFAULT_SETTINGS,
          key
        )
      ) {
        return {
          success: false,
          message: "Unknown setting: " + key
        };
      }

      const value = changes[key];

      if (
        BOOLEAN_KEYS.includes(key) &&
        typeof value !== "boolean"
      ) {
        return {
          success: false,
          message: "Invalid value for setting: " + key
        };
      }

      if (
        TIME_KEYS.includes(key) &&
        !isValidTime(value)
      ) {
        return {
          success: false,
          message: "Invalid time for setting: " + key
        };
      }

      current[key] = value;
    }

    if (!saveAll(current)) {
      return {
        success: false,
        message: "Could not save notification settings."
      };
    }

    return {
      success: true,
      settings: current,
      message: "Notification preferences updated locally."
    };
  }

  function resetSettings() {
    const defaults = Object.assign(
      {},
      DEFAULT_SETTINGS
    );

    if (!saveAll(defaults)) {
      return {
        success: false,
        message: "Could not reset notification settings."
      };
    }

    return {
      success: true,
      settings: defaults,
      message: "Notification preferences reset."
    };
  }

  /*
   * Returns whether a category is enabled.
   * This checks preferences only; it does not deliver alerts.
   */
  function isEnabled(key) {
    if (
      !Object.prototype.hasOwnProperty.call(
        DEFAULT_SETTINGS,
        key
      )
    ) {
      return false;
    }

    return readAll()[key] === true;
  }

  /*
   * Check whether local time falls inside quiet hours.
   * Handles quiet hours that cross midnight.
   *
   * This function does not suppress notifications by itself.
   */
  function isQuietHours(date) {
    const settings = readAll();

    if (!settings.quietHoursEnabled) {
      return false;
    }

    const currentDate = date instanceof Date
      ? date
      : new Date();

    const currentMinutes =
      currentDate.getHours() * 60 +
      currentDate.getMinutes();

    const startParts = settings.quietHoursStart
      .split(":")
      .map(Number);

    const endParts = settings.quietHoursEnd
      .split(":")
      .map(Number);

    const startMinutes =
      startParts[0] * 60 + startParts[1];

    const endMinutes =
      endParts[0] * 60 + endParts[1];

    if (startMinutes === endMinutes) {
      return true;
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes &&
        currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes ||
      currentMinutes < endMinutes;
  }

  function getCategories() {
    return {
      social: [
        "comments",
        "commentReplies",
        "mentions",
        "likes",
        "follows",
        "creatorActivity"
      ],

      messaging: [
        "messages",
        "messageRequests"
      ],

      live: [
        "liveStreams",
        "liveInvitations",
        "gifts"
      ],

      music: [
        "musicReleases",
        "musicRecommendations"
      ],

      marketplace: [
        "marketplaceOrders",
        "shippingUpdates",
        "returnRefundUpdates",
        "disputeUpdates"
      ],

      creators: [
        "templateUpdates",
        "creatorTasks",
        "creatorRewards"
      ],

      account: [
        "subscriptions",
        "securityAlerts",
        "accountUpdates"
      ],

      marketing: [
        "promotions",
        "productRecommendations"
      ],

      deliveryChannels: [
        "inApp",
        "push",
        "email",
        "sms"
      ]
    };
  }

  window.RockyXNotificationSettings = {
    getSettings: getSettings,
    getSetting: getSetting,
    updateSetting: updateSetting,
    updateSettings: updateSettings,
    resetSettings: resetSettings,
    isEnabled: isEnabled,
    isQuietHours: isQuietHours,
    getCategories: getCategories
  };
})();