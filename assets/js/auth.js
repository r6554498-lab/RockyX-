/* =========================================
   ROCKYX AUTHENTICATION
   Supabase-ready authentication foundation
   ========================================= */

(function () {
  "use strict";

  const SESSION_KEY = "rockyx_auth_session";
  const CONFIG_KEY = "rockyx_auth_config";

  const ACCOUNT_STATUSES = [
    "active",
    "restricted",
    "suspended"
  ];

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch (error) {
      return null;
    }
  }

  function saveSession(session) {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  /*
   * Configure with your Supabase project URL and
   * publishable/anon key when the backend is ready.
   *
   * Never place a Supabase service-role key here.
   */
  function configure(options) {
    options = options || {};

    const projectUrl = String(options.projectUrl || "").trim();
    const publicKey = String(options.publicKey || "").trim();

    if (!projectUrl || !publicKey) {
      return {
        success: false,
        message: "Supabase project URL and public key are required."
      };
    }

    try {
      const parsed = new URL(projectUrl);

      if (!["https:", "http:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol.");
      }
    } catch (error) {
      return {
        success: false,
        message: "Enter a valid Supabase project URL."
      };
    }

    const config = {
      projectUrl: projectUrl.replace(/\/+$/, ""),
      publicKey: publicKey
    };

    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

    return {
      success: true,
      message: "Supabase configuration saved."
    };
  }

  function isConfigured() {
    const config = getConfig();

    return Boolean(config.projectUrl && config.publicKey);
  }

  function getConfigurationStatus() {
    return {
      configured: isConfigured(),
      provider: "Supabase Auth"
    };
  }

  /*
   * This function checks configuration only.
   * It does not authenticate the user.
   */
  function requireConfiguration() {
    if (!isConfigured()) {
      return {
        success: false,
        message: "Supabase Auth has not been configured yet."
      };
    }

    return {
      success: true,
      config: getConfig()
    };
  }

  /*
   * A real session must come from Supabase Auth.
   * This local helper is for UI state only.
   */
  function getSession() {
    return loadSession();
  }

  function getCurrentUser() {
    const session = loadSession();

    return session && session.user
      ? session.user
      : null;
  }

  /*
   * Only a future verified Supabase integration should
   * call this helper with an authenticated session.
   * Never treat manually stored session data as proof
   * of identity on the server.
   */
  function setSessionFromProvider(session) {
    if (
      !session ||
      !session.user ||
      !session.user.id
    ) {
      return {
        success: false,
        message: "A valid provider session is required."
      };
    }

    const safeSession = {
      user: {
        id: String(session.user.id),
        email: session.user.email || null
      },
      provider: "supabase",
      savedAt: new Date().toISOString()
    };

    saveSession(safeSession);

    return {
      success: true,
      user: safeSession.user
    };
  }

  function clearSession() {
    saveSession(null);

    return {
      success: true,
      message: "Local session cleared."
    };
  }

  /*
   * These methods describe the workflows to connect
   * to Supabase Auth later. They deliberately do not
   * pretend to register, log in, or reset passwords.
   */
  function signUp() {
    return {
      success: false,
      requiresBackend: true,
      message: "Connect Supabase Auth before registering."
    };
  }

  function signIn() {
    return {
      success: false,
      requiresBackend: true,
      message: "Connect Supabase Auth before signing in."
    };
  }

  function signOut() {
    const result = clearSession();

    return {
      success: true,
      localSessionCleared: result.success,
      requiresBackend: true,
      message: "Local session cleared. Provider sign-out is not connected."
    };
  }

  function requestPasswordReset() {
    return {
      success: false,
      requiresBackend: true,
      message: "Password recovery requires Supabase Auth."
    };
  }

  function requestEmailVerification() {
    return {
      success: false,
      requiresBackend: true,
      message: "Email verification requires Supabase Auth."
    };
  }

  function getAccountStatuses() {
    return ACCOUNT_STATUSES.slice();
  }

  window.RockyXAuth = {
    configure: configure,
    isConfigured: isConfigured,
    getConfigurationStatus: getConfigurationStatus,
    requireConfiguration: requireConfiguration,
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    setSessionFromProvider: setSessionFromProvider,
    clearSession: clearSession,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    requestPasswordReset: requestPasswordReset,
    requestEmailVerification: requestEmailVerification,
    getAccountStatuses: getAccountStatuses
  };

})();