/* =========================================
   ROCKYX USER ACCOUNTS
   Local profile prototype
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_user_accounts";
  const CURRENT_USER_KEY = "rockyx_current_user";

  const ALLOWED_ROLES = [
    "user",
    "creator",
    "template_creator",
    "seller",
    "admin"
  ];

  function readJSON(key, fallback) {
    try {
      return JSON.parse(
        localStorage.getItem(key) || JSON.stringify(fallback)
      );
    } catch (error) {
      return fallback;
    }
  }

  function readAccounts() {
    const accounts = readJSON(STORAGE_KEY, []);
    return Array.isArray(accounts) ? accounts : [];
  }

  function saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));

    window.dispatchEvent(
      new CustomEvent("rockyx:accounts-updated", {
        detail: { count: accounts.length }
      })
    );

    return accounts;
  }

  function cleanText(value, maxLength) {
    return String(value || "")
      .trim()
      .slice(0, maxLength);
  }

  function createProfile(data) {
    if (!data || typeof data !== "object") {
      return {
        success: false,
        message: "Profile information is required."
      };
    }

    const username = cleanText(data.username, 30)
      .toLowerCase()
      .replace(/[^a-z0-9_.]/g, "");

    const displayName = cleanText(data.displayName, 80);

    if (username.length < 3) {
      return {
        success: false,
        message: "Username must contain at least 3 valid characters."
      };
    }

    if (!displayName) {
      return {
        success: false,
        message: "A display name is required."
      };
    }

    const accounts = readAccounts();

    if (accounts.some(account => account.username === username)) {
      return {
        success: false,
        message: "That username is already in use in this browser."
      };
    }

    const now = new Date().toISOString();

    // Every new profile starts with the basic user role.
    // Privileged roles must be assigned by a trusted backend.
    const account = {
      id: "rxu_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 10),

      username,
      displayName,
      bio: cleanText(data.bio, 300),
      avatarUrl: cleanText(data.avatarUrl, 1000),
      coverUrl: cleanText(data.coverUrl, 1000),

      roles: ["user"],
      accountStatus: "active",

      preferences: {
        language: cleanText(data.language, 20) || "en",
        theme: "system",
        notificationsEnabled: true
      },

      createdAt: now,
      updatedAt: now
    };

    accounts.unshift(account);
    saveAccounts(accounts);

    return {
      success: true,
      account: account,
      message: "Local profile created. Authentication is not connected."
    };
  }

  function getProfile(userId) {
    return readAccounts().find(account =>
      account.id === String(userId)
    ) || null;
  }

  function getByUsername(username) {
    const normalized = cleanText(username, 30).toLowerCase();

    return readAccounts().find(account =>
      account.username === normalized
    ) || null;
  }

  function searchProfiles(query, limit) {
    const term = cleanText(query, 100).toLowerCase();
    const maxResults = Math.max(1, Number(limit) || 20);

    if (!term) {
      return [];
    }

    return readAccounts()
      .filter(account =>
        account.accountStatus === "active" &&
        (
          account.username.includes(term) ||
          account.displayName.toLowerCase().includes(term)
        )
      )
      .slice(0, maxResults);
  }

  function updateProfile(userId, changes) {
    if (!changes || typeof changes !== "object") {
      return {
        success: false,
        message: "Profile changes are required."
      };
    }

    const accounts = readAccounts();
    const index = accounts.findIndex(account =>
      account.id === String(userId)
    );

    if (index === -1) {
      return {
        success: false,
        message: "Profile not found."
      };
    }

    const account = { ...accounts[index] };

    if (changes.displayName !== undefined) {
      const displayName = cleanText(changes.displayName, 80);

      if (!displayName) {
        return {
          success: false,
          message: "Display name cannot be empty."
        };
      }

      account.displayName = displayName;
    }

    if (changes.bio !== undefined) {
      account.bio = cleanText(changes.bio, 300);
    }

    if (changes.avatarUrl !== undefined) {
      account.avatarUrl = cleanText(changes.avatarUrl, 1000);
    }

    if (changes.coverUrl !== undefined) {
      account.coverUrl = cleanText(changes.coverUrl, 1000);
    }

    if (changes.language !== undefined) {
      account.preferences = {
        ...account.preferences,
        language: cleanText(changes.language, 20) || "en"
      };
    }

    if (changes.theme !== undefined) {
      const theme = String(changes.theme);

      if (!["system", "light", "dark"].includes(theme)) {
        return {
          success: false,
          message: "Choose system, light, or dark theme."
        };
      }

      account.preferences = {
        ...account.preferences,
        theme
      };
    }

    if (changes.notificationsEnabled !== undefined) {
      account.preferences = {
        ...account.preferences,
        notificationsEnabled: Boolean(
          changes.notificationsEnabled
        )
      };
    }

    account.updatedAt = new Date().toISOString();
    accounts[index] = account;
    saveAccounts(accounts);

    return {
      success: true,
      account
    };
  }

  function setCurrentUser(userId) {
    const account = getProfile(userId);

    if (!account) {
      return {
        success: false,
        message: "Profile not found."
      };
    }

    // Convenience for local prototyping only.
    // This does not authenticate the user.
    localStorage.setItem(CURRENT_USER_KEY, account.id);

    window.dispatchEvent(
      new CustomEvent("rockyx:current-user-changed", {
        detail: { userId: account.id }
      })
    );

    return {
      success: true,
      account
    };
  }

  function getCurrentUser() {
    const userId = localStorage.getItem(CURRENT_USER_KEY);

    if (!userId) {
      return null;
    }

    return getProfile(userId);
  }

  function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);

    window.dispatchEvent(
      new CustomEvent("rockyx:current-user-changed", {
        detail: { userId: null }
      })
    );

    return true;
  }

  function getRoles(userId) {
    const account = getProfile(userId);

    return account ? account.roles.slice() : [];
  }

  function getAllowedRoles() {
    return ALLOWED_ROLES.slice();
  }

  window.RockyXUserAccounts = {
    createProfile,
    getProfile,
    getByUsername,
    searchProfiles,
    updateProfile,
    setCurrentUser,
    getCurrentUser,
    clearCurrentUser,
    getRoles,
    getAllowedRoles
  };

  console.log("RockyX User Accounts loaded.");
})();