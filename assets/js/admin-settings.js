/*
 * RockyX Admin Settings
 *
 * Local prototype for platform configuration.
 *
 * SECURITY:
 * These settings are stored in the current browser.
 * They are NOT secure production admin controls.
 * Real platform settings must be validated and saved
 * by a protected backend.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_admin_settings";

  const DEFAULT_SETTINGS = {
    platform: {
      name: "RockyX",
      slogan: "One World. One Platform.",
      maintenanceMode: false,
      allowRegistration: true
    },

    social: {
      enabled: true,
      shortVideosEnabled: true,
      commentsEnabled: true,
      messagingEnabled: true,
      storiesEnabled: true,
      livestreamsEnabled: true,
      maximumCaptionLength: 5000
    },

    music: {
      enabled: true,
      musicUploadsEnabled: true,
      playlistsEnabled: true,
      downloadsEnabled: false,
      artistApplicationsEnabled: true
    },

    studio: {
      enabled: true,
      templatesEnabled: true,
      proTemplatesEnabled: true,
      templateApplicationsEnabled: true
    },

    marketplace: {
      enabled: true,
      sellerApplicationsEnabled: true,
      productListingsEnabled: true,
      reviewsEnabled: true,
      returnsEnabled: true,
      defaultCommissionPercent: 10
    },

    explore: {
      enabled: true,
      mapsEnabled: true,
      businessListingsEnabled: true,
      transportListingsEnabled: true,
      serviceListingsEnabled: true
    },

    creators: {
      creatorApplicationsEnabled: true,
      templateCreatorApplicationsEnabled: true,
      verificationApplicationsEnabled: true,
      creatorRewardsEnabled: true,
      templateCreatorRewardsEnabled: true
    },

    subscriptions: {
      proSubscriptionsEnabled: true,
      creatorSubscriptionsEnabled: true,
      individualTemplatePurchasesEnabled: true
    },

    advertising: {
      advertisingEnabled: true,
      boostsEnabled: true,
      campaignsRequireReview: true
    },

    safety: {
      reportingEnabled: true,
      blockingEnabled: true,
      contentReviewEnabled: true,
      minimumAge: 13
    },

    notifications: {
      announcementsEnabled: true,
      promotionalNotificationsEnabled: true
    }
  };

  const RESTRICTED_SETTINGS = [
    "platform.maintenanceMode",
    "platform.allowRegistration",
    "marketplace.defaultCommissionPercent",
    "safety.minimumAge"
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readSettings() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "null"
      );

      if (!saved || typeof saved !== "object") {
        return clone(DEFAULT_SETTINGS);
      }

      return mergeSettings(
        clone(DEFAULT_SETTINGS),
        saved
      );
    } catch (error) {
      console.error(
        "RockyX admin settings could not be read:",
        error
      );

      return clone(DEFAULT_SETTINGS);
    }
  }

  function mergeSettings(defaults, saved) {
    Object.keys(defaults).forEach(function (section) {
      if (
        saved[section] &&
        typeof saved[section] === "object" &&
        !Array.isArray(saved[section])
      ) {
        defaults[section] = Object.assign(
          {},
          defaults[section],
          saved[section]
        );
      }
    });

    return defaults;
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

      return true;
    } catch (error) {
      console.error(
        "RockyX admin settings could not be saved:",
        error
      );

      return false;
    }
  }

  function getSettings() {
    return clone(readSettings());
  }

  function getSection(section) {
    const settings = readSettings();

    if (
      !Object.prototype.hasOwnProperty.call(
        settings,
        section
      )
    ) {
      return null;
    }

    return clone(settings[section]);
  }

  function isValidSection(section) {
    return Object.prototype.hasOwnProperty.call(
      DEFAULT_SETTINGS,
      section
    );
  }

  function isValidSetting(section, key) {
    return (
      isValidSection(section) &&
      Object.prototype.hasOwnProperty.call(
        DEFAULT_SETTINGS[section],
        key
      )
    );
  }

  function validateValue(section, key, value) {
    const defaultValue = DEFAULT_SETTINGS[section][key];

    if (typeof defaultValue === "boolean") {
      return typeof value === "boolean";
    }

    if (typeof defaultValue === "number") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value)
      ) {
        return false;
      }

      if (key === "defaultCommissionPercent") {
        return value >= 0 && value <= 50;
      }

      if (key === "minimumAge") {
        return Number.isInteger(value) &&
          value >= 13 &&
          value <= 120;
      }

      if (key === "maximumCaptionLength") {
        return Number.isInteger(value) &&
          value >= 1 &&
          value <= 100000;
      }

      return value >= 0;
    }

    if (typeof defaultValue === "string") {
      return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.length <= 200
      );
    }

    return false;
  }

  /*
   * Updates one setting in local browser storage.
   * Restricted settings require an explicit option,
   * but this is NOT a substitute for backend admin security.
   */
  function updateSetting(section, key, value, options) {
    if (!isValidSetting(section, key)) {
      return {
        success: false,
        message: "Unknown settings section or setting."
      };
    }

    const settingPath = section + "." + key;
    const settingsOptions = options || {};

    if (
      RESTRICTED_SETTINGS.includes(settingPath) &&
      settingsOptions.confirmRestricted !== true
    ) {
      return {
        success: false,
        message:
          "This setting requires explicit confirmation.",
        requiresConfirmation: true
      };
    }

    if (!validateValue(section, key, value)) {
      return {
        success: false,
        message: "The supplied setting value is invalid."
      };
    }

    const settings = readSettings();
    const previousValue = settings[section][key];

    settings[section][key] = value;

    if (!saveSettings(settings)) {
      return {
        success: false,
        message: "Settings could not be saved."
      };
    }

    return {
      success: true,
      section: section,
      key: key,
      previousValue: previousValue,
      value: value,
      message: "Setting saved locally.",
      note: "This does not change the live platform."
    };
  }

  /*
   * Updates several settings within one section.
   */
  function updateSection(section, changes, options) {
    if (!isValidSection(section)) {
      return {
        success: false,
        message: "Unknown settings section."
      };
    }

    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return {
        success: false,
        message: "A settings object is required."
      };
    }

    const settingsOptions = options || {};

    for (const key of Object.keys(changes)) {
      if (!isValidSetting(section, key)) {
        return {
          success: false,
          message: "Unknown setting: " + key
        };
      }

      if (
        RESTRICTED_SETTINGS.includes(section + "." + key) &&
        settingsOptions.confirmRestricted !== true
      ) {
        return {
          success: false,
          message:
            "Restricted setting requires confirmation: " +
            key
        };
      }

      if (!validateValue(section, key, changes[key])) {
        return {
          success: false,
          message: "Invalid value for setting: " + key
        };
      }
    }

    const settings = readSettings();

    Object.keys(changes).forEach(function (key) {
      settings[section][key] = changes[key];
    });

    if (!saveSettings(settings)) {
      return {
        success: false,
        message: "Settings could not be saved."
      };
    }

    return {
      success: true,
      section: section,
      settings: clone(settings[section]),
      message: "Section saved locally.",
      note: "This does not change the live platform."
    };
  }

  function resetSection(section) {
    if (!isValidSection(section)) {
      return {
        success: false,
        message: "Unknown settings section."
      };
    }

    const settings = readSettings();
    settings[section] = clone(DEFAULT_SETTINGS[section]);

    if (!saveSettings(settings)) {
      return {
        success: false,
        message: "Section could not be reset."
      };
    }

    return {
      success: true,
      section: section,
      message: "Section restored to its default values."
    };
  }

  function resetAll() {
    if (!saveSettings(clone(DEFAULT_SETTINGS))) {
      return {
        success: false,
        message: "Settings could not be reset."
      };
    }

    return {
      success: true,
      message: "All settings restored to defaults."
    };
  }

  function getSections() {
    return Object.keys(DEFAULT_SETTINGS);
  }

  function getDefaults() {
    return clone(DEFAULT_SETTINGS);
  }

  window.RockyXAdminSettings = {
    getSettings: getSettings,
    getSection: getSection,
    updateSetting: updateSetting,
    updateSection: updateSection,
    resetSection: resetSection,
    resetAll: resetAll,
    getSections: getSections,
    getDefaults: getDefaults,
    getRestrictedSettings: function () {
      return RESTRICTED_SETTINGS.slice();
    }
  };
})();