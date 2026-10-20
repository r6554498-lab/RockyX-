/* =========================================
   ROCKYX USER PREFERENCES
   Local preference management foundation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_user_preferences";

  const DEFAULT_PREFERENCES = {
    appearance: {
      theme: "system"
    },

    language: {
      selected: "en"
    },

    video: {
      autoplay: true,
      dataSaver: false,
      defaultQuality: "auto"
    },

    music: {
      autoplay: false,
      defaultVolume: 80,
      repeat: "off",
      shuffle: false
    },

    discovery: {
      preferredCategories: [],
      hideViewedContent: false
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return clone(DEFAULT_PREFERENCES);
      }

      const parsed = JSON.parse(saved);

      return {
        appearance: {
          ...DEFAULT_PREFERENCES.appearance,
          ...(parsed.appearance || {})
        },

        language: {
          ...DEFAULT_PREFERENCES.language,
          ...(parsed.language || {})
        },

        video: {
          ...DEFAULT_PREFERENCES.video,
          ...(parsed.video || {})
        },

        music: {
          ...DEFAULT_PREFERENCES.music,
          ...(parsed.music || {})
        },

        discovery: {
          ...DEFAULT_PREFERENCES.discovery,
          ...(parsed.discovery || {}),
          preferredCategories: Array.isArray(
            parsed.discovery?.preferredCategories
          )
            ? parsed.discovery.preferredCategories
            : []
        }
      };
    } catch (error) {
      console.error(
        "RockyX preferences could not be loaded:",
        error
      );

      return clone(DEFAULT_PREFERENCES);
    }
  }

  function savePreferences(preferences) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(preferences)
      );

      window.dispatchEvent(
        new CustomEvent("rockyx:preferences-updated", {
          detail: clone(preferences)
        })
      );

      return true;
    } catch (error) {
      console.error(
        "RockyX preferences could not be saved:",
        error
      );

      return false;
    }
  }

  function getAll() {
    return clone(loadPreferences());
  }

  function getSection(section) {
    const preferences = loadPreferences();

    if (
      !Object.prototype.hasOwnProperty.call(
        preferences,
        section
      )
    ) {
      return null;
    }

    return clone(preferences[section]);
  }

  function updateSection(section, changes) {
    const preferences = loadPreferences();

    if (
      !Object.prototype.hasOwnProperty.call(
        preferences,
        section
      ) ||
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return false;
    }

    preferences[section] = {
      ...preferences[section],
      ...changes
    };

    if (section === "discovery") {
      if (
        !Array.isArray(
          preferences.discovery.preferredCategories
        )
      ) {
        return false;
      }
    }

    return savePreferences(preferences);
  }

  function get(section, key) {
    const preferences = loadPreferences();

    if (
      !Object.prototype.hasOwnProperty.call(
        preferences,
        section
      ) ||
      !Object.prototype.hasOwnProperty.call(
        preferences[section],
        key
      )
    ) {
      return undefined;
    }

    return preferences[section][key];
  }

  function set(section, key, value) {
    const preferences = loadPreferences();

    if (
      !Object.prototype.hasOwnProperty.call(
        preferences,
        section
      ) ||
      !Object.prototype.hasOwnProperty.call(
        preferences[section],
        key
      )
    ) {
      return false;
    }

    if (
      section === "appearance" &&
      key === "theme" &&
      !["light", "dark", "system"].includes(value)
    ) {
      return false;
    }

    if (
      section === "video" &&
      key === "defaultQuality" &&
      !["auto", "low", "medium", "high"].includes(value)
    ) {
      return false;
    }

    if (
      section === "music" &&
      key === "defaultVolume" &&
      (!Number.isFinite(value) || value < 0 || value > 100)
    ) {
      return false;
    }

    if (
      section === "music" &&
      key === "repeat" &&
      !["off", "one", "all"].includes(value)
    ) {
      return false;
    }

    if (
      section === "discovery" &&
      key === "preferredCategories" &&
      !Array.isArray(value)
    ) {
      return false;
    }

    preferences[section][key] = value;

    return savePreferences(preferences);
  }

  function resetSection(section) {
    if (
      !Object.prototype.hasOwnProperty.call(
        DEFAULT_PREFERENCES,
        section
      )
    ) {
      return false;
    }

    const preferences = loadPreferences();

    preferences[section] = clone(
      DEFAULT_PREFERENCES[section]
    );

    return savePreferences(preferences);
  }

  function resetAll() {
    return savePreferences(clone(DEFAULT_PREFERENCES));
  }

  window.RockyXUserPreferences = {
    getAll,
    getSection,
    get,
    set,
    updateSection,
    resetSection,
    resetAll
  };

})();