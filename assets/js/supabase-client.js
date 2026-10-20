/* =========================================
   ROCKYX SUPABASE CLIENT
   Backend connection foundation
   ========================================= */

(function () {
  "use strict";

  const CONFIG_KEY = "rockyx_supabase_config";

  let client = null;
  let initialized = false;

  function configure(options) {
    options = options || {};

    const url = String(options.url || "").trim().replace(/\/+$/, "");
    const key = String(options.anonKey || "").trim();

    if (!url || !key) {
      return {
        success: false,
        message: "Supabase project URL and public key are required."
      };
    }

    try {
      const parsed = new URL(url);

      if (
        parsed.protocol !== "https:" &&
        parsed.hostname !== "localhost"
      ) {
        return {
          success: false,
          message: "Use HTTPS for your Supabase project URL."
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "The Supabase project URL is invalid."
      };
    }

    const config = {
      url: url,
      anonKey: key
    };

    // Configuration only. No secret service-role key belongs here.
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

    return {
      success: true,
      message: "Supabase configuration saved. Client initialization is separate."
    };
  }

  function getConfig() {
    try {
      const config = JSON.parse(localStorage.getItem(CONFIG_KEY));

      if (
        config &&
        typeof config.url === "string" &&
        typeof config.anonKey === "string"
      ) {
        return config;
      }
    } catch (error) {
      // Invalid configuration is treated as absent.
    }

    return null;
  }

  function isConfigured() {
    const config = getConfig();

    return Boolean(config && config.url && config.anonKey);
  }

  function initialize() {
    const config = getConfig();

    if (!config) {
      return {
        success: false,
        message: "Configure your Supabase project first."
      };
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      return {
        success: false,
        message: "Supabase library is not loaded yet."
      };
    }

    try {
      client = window.supabase.createClient(
        config.url,
        config.anonKey
      );

      initialized = true;

      return {
        success: true,
        message: "Supabase client initialized."
      };
    } catch (error) {
      client = null;
      initialized = false;

      return {
        success: false,
        message: "Could not initialize the Supabase client."
      };
    }
  }

  function getClient() {
    return initialized ? client : null;
  }

  function getStatus() {
    return {
      configured: isConfigured(),
      initialized: initialized,
      libraryLoaded: Boolean(
        window.supabase &&
        typeof window.supabase.createClient === "function"
      )
    };
  }

  function clearConfiguration() {
    client = null;
    initialized = false;

    localStorage.removeItem(CONFIG_KEY);

    return {
      success: true,
      message: "Saved Supabase configuration cleared from this browser."
    };
  }

  window.RockyXSupabase = {
    configure: configure,
    getConfig: getConfig,
    isConfigured: isConfigured,
    initialize: initialize,
    getClient: getClient,
    getStatus: getStatus,
    clearConfiguration: clearConfiguration
  };

})();