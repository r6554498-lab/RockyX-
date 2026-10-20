/* =========================================
   ROCKYX PRIVACY & SAFETY
   Local prototype for privacy and moderation
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_privacy_safety";

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return {
          blockedUsers: [],
          mutedUsers: [],
          reports: [],
          hiddenContent: [],
          settings: {
            filterSensitiveContent: true,
            allowTagging: true
          }
        };
      }

      const data = JSON.parse(saved);

      return {
        blockedUsers: Array.isArray(data.blockedUsers)
          ? data.blockedUsers
          : [],
        mutedUsers: Array.isArray(data.mutedUsers)
          ? data.mutedUsers
          : [],
        reports: Array.isArray(data.reports)
          ? data.reports
          : [],
        hiddenContent: Array.isArray(data.hiddenContent)
          ? data.hiddenContent
          : [],
        settings: {
          filterSensitiveContent: true,
          allowTagging: true,
          ...(data.settings || {})
        }
      };
    } catch (error) {
      console.error("RockyX privacy data could not be loaded:", error);

      return {
        blockedUsers: [],
        mutedUsers: [],
        reports: [],
        hiddenContent: [],
        settings: {
          filterSensitiveContent: true,
          allowTagging: true
        }
      };
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      window.dispatchEvent(
        new CustomEvent("rockyx:privacy-updated", {
          detail: {
            blockedUsers: data.blockedUsers.length,
            mutedUsers: data.mutedUsers.length,
            reports: data.reports.length
          }
        })
      );

      return true;
    } catch (error) {
      console.error("RockyX privacy data could not be saved:", error);
      return false;
    }
  }

  function normalizeId(id) {
    if (typeof id !== "string" && typeof id !== "number") {
      return null;
    }

    const normalized = String(id).trim();

    return normalized ? normalized : null;
  }

  function blockUser(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    const data = loadData();

    if (data.blockedUsers.includes(id)) {
      return true;
    }

    data.blockedUsers.push(id);
    return saveData(data);
  }

  function unblockUser(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    const data = loadData();

    data.blockedUsers = data.blockedUsers.filter(
      user => user !== id
    );

    return saveData(data);
  }

  function muteUser(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    const data = loadData();

    if (data.mutedUsers.includes(id)) {
      return true;
    }

    data.mutedUsers.push(id);
    return saveData(data);
  }

  function unmuteUser(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    const data = loadData();

    data.mutedUsers = data.mutedUsers.filter(
      user => user !== id
    );

    return saveData(data);
  }

  function isBlocked(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    return loadData().blockedUsers.includes(id);
  }

  function isMuted(userId) {
    const id = normalizeId(userId);
    if (!id) return false;

    return loadData().mutedUsers.includes(id);
  }

  function getBlockedUsers() {
    return [...loadData().blockedUsers];
  }

  function getMutedUsers() {
    return [...loadData().mutedUsers];
  }

  function hideContent(contentId) {
    const id = normalizeId(contentId);
    if (!id) return false;

    const data = loadData();

    if (data.hiddenContent.includes(id)) {
      return true;
    }

    data.hiddenContent.push(id);
    return saveData(data);
  }

  function unhideContent(contentId) {
    const id = normalizeId(contentId);
    if (!id) return false;

    const data = loadData();

    data.hiddenContent = data.hiddenContent.filter(
      content => content !== id
    );

    return saveData(data);
  }

  function isContentHidden(contentId) {
    const id = normalizeId(contentId);
    if (!id) return false;

    return loadData().hiddenContent.includes(id);
  }

  function reportContent(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Report details are required."
      };
    }

    const targetId = normalizeId(details.targetId);
    const targetType = details.targetType;
    const reason = typeof details.reason === "string"
      ? details.reason.trim()
      : "";

    const allowedTypes = [
      "user",
      "video",
      "comment",
      "message",
      "music",
      "product",
      "livestream",
      "template"
    ];

    if (!targetId || !allowedTypes.includes(targetType)) {
      return {
        success: false,
        error: "A valid target and content type are required."
      };
    }

    if (!reason || reason.length > 500) {
      return {
        success: false,
        error: "Provide a reason of up to 500 characters."
      };
    }

    const data = loadData();

    const report = {
      id: createId(),
      targetId,
      targetType,
      reason,
      details: typeof details.details === "string"
        ? details.details.trim().slice(0, 1000)
        : "",
      status: "pending",
      createdAt: new Date().toISOString()
    };

    data.reports.push(report);

    if (!saveData(data)) {
      return {
        success: false,
        error: "The report could not be saved."
      };
    }

    window.dispatchEvent(
      new CustomEvent("rockyx:report-created", {
        detail: { ...report }
      })
    );

    return {
      success: true,
      report: { ...report }
    };
  }

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return "report-" +
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 10);
  }

  function getReports() {
    return loadData().reports.map(report => ({ ...report }));
  }

  function updateSettings(changes) {
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes)
    ) {
      return false;
    }

    const allowedKeys = [
      "filterSensitiveContent",
      "allowTagging"
    ];

    const data = loadData();

    for (const key of allowedKeys) {
      if (typeof changes[key] === "boolean") {
        data.settings[key] = changes[key];
      }
    }

    return saveData(data);
  }

  function getSettings() {
    return { ...loadData().settings };
  }

  window.RockyXPrivacySafety = {
    blockUser,
    unblockUser,
    muteUser,
    unmuteUser,
    isBlocked,
    isMuted,
    getBlockedUsers,
    getMutedUsers,
    hideContent,
    unhideContent,
    isContentHidden,
    reportContent,
    getReports,
    updateSettings,
    getSettings
  };

})();