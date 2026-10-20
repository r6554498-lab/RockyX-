/* =========================================
   ROCKYX ACCOUNT SETTINGS
   Local settings foundation
   ========================================= */

(function () {
  "use strict";

  const SETTINGS_KEY = "rockyx_account_settings";

  const DEFAULT_SETTINGS = {
    profile: {
      displayName: "",
      bio: "",
      profilePicture: "",
      website: ""
    },

    privacy: {
      privateAccount: false,
      showOnlineStatus: true,
      allowMessages: true,
      allowComments: true,
      allowMentions: true
    },

    notifications: {
      likes: true,
      comments: true,
      follows: true,
      messages: true,
      liveStreams: true,
      musicUpdates: true,
      marketplaceUpdates: true,
      promotional: false
    },

    preferences: {
      language: "en",
      theme: "system",
      autoplayVideos: true,
      dataSaver: false
    },

    security: {
      loginAlerts: true
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);

      if (!saved) {
        return clone(DEFAULT_SETTINGS);
      }

      const parsed = JSON.parse(saved);

      return {
        profile: {
          ...DEFAULT_SETTINGS.profile,
          ...(parsed.profile || {})
        },
        privacy: {
          ...DEFAULT_SETTINGS.privacy,
          ...(parsed.privacy || {})
        },
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(parsed.notifications || {})
        },
        preferences: {
          ...DEFAULT_SETTINGS.preferences,
          ...(parsed.preferences || {})
        },
        security: {
          ...DEFAULT_SETTINGS.security,
          ...(parsed.security || {})
        }
      };
    } catch (error) {
      console.error("RockyX settings could not be loaded:", error);
      return clone(DEFAULT_SETTINGS);
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(settings)
      );

      window.dispatchEvent(
        new CustomEvent("rockyx:settings-updated", {
          detail: clone(settings)
        })
      );

      return true;
    } catch (error) {
      console.error("RockyX settings could not be saved:", error);
      return false;
    }
  }

  function getSettings() {
    return clone(readSettings());
  }

  function getSection(section) {
    const settings = readSettings();

    if (!Object.prototype.hasOwnProperty.call(settings, section)) {
      return null;
    }

    return clone(settings[section]);
  }

  function updateSection(section, changes) {
    const settings = readSettings();

    if (
      !Object.prototype.hasOwnProperty.call(settings, section) ||
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return false;
    }

    settings[section] = {
      ...settings[section],
      ...changes
    };

    return saveSettings(settings);
  }

  function updateSetting(section, key, value) {
    const settings = readSettings();

    if (
      !Object.prototype.hasOwnProperty.call(settings, section) ||
      !Object.prototype.hasOwnProperty.call(settings[section], key)
    ) {
      return false;
    }

    settings[section][key] = value;

    return saveSettings(settings);
  }

  function resetSection(section) {
    if (
      !Object.prototype.hasOwnProperty.call(
        DEFAULT_SETTINGS,
        section
      )
    ) {
      return false;
    }

    const settings = readSettings();
    settings[section] = clone(DEFAULT_SETTINGS[section]);

    return saveSettings(settings);
  }

  function resetAll() {
    return saveSettings(clone(DEFAULT_SETTINGS));
  }

  function exportSettings() {
    return JSON.stringify(getSettings(), null, 2);
  }

  window.RockyXAccountSettings = {
    getSettings,
    getSection,
    updateSection,
    updateSetting,
    resetSection,
    resetAll,
    exportSettings
  };

})();