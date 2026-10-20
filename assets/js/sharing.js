/* =========================================
   ROCKYX SHARING & DEEP LINKS
   Share actions and content link foundation
   ========================================= */

(function () {
  "use strict";

  const HISTORY_KEY = "rockyx_shared_content_history";

  const ALLOWED_TYPES = [
    "video",
    "user",
    "creator",
    "song",
    "artist",
    "album",
    "playlist",
    "product",
    "seller",
    "template",
    "livestream",
    "place"
  ];

  function normalizeType(type) {
    if (typeof type !== "string") return null;

    const value = type.trim().toLowerCase();

    return ALLOWED_TYPES.includes(value) ? value : null;
  }

  function normalizeId(id) {
    if (typeof id !== "string" && typeof id !== "number") {
      return null;
    }

    const value = String(id).trim();

    return value ? value : null;
  }

  function getBaseUrl() {
    if (typeof window === "undefined" || !window.location) {
      return "";
    }

    return window.location.origin +
      window.location.pathname.replace(/\/[^/]*$/, "/");
  }

  function createLink(type, id) {
    const normalizedType = normalizeType(type);
    const normalizedId = normalizeId(id);

    if (!normalizedType || !normalizedId) {
      return {
        success: false,
        error: "A supported content type and valid ID are required."
      };
    }

    const baseUrl = getBaseUrl();

    if (!baseUrl) {
      return {
        success: false,
        error: "The current page URL is unavailable."
      };
    }

    const url = new URL(baseUrl);

    url.searchParams.set("rockyx", normalizedType);
    url.searchParams.set("id", normalizedId);

    return {
      success: true,
      type: normalizedType,
      id: normalizedId,
      url: url.toString()
    };
  }

  function getCurrentContent() {
    try {
      const params = new URLSearchParams(window.location.search);

      const type = params.get("rockyx");
      const id = params.get("id");

      if (!type || !id) return null;

      const normalizedType = normalizeType(type);
      const normalizedId = normalizeId(id);

      if (!normalizedType || !normalizedId) return null;

      return {
        type: normalizedType,
        id: normalizedId
      };
    } catch (error) {
      return null;
    }
  }

  function getHistory() {
    try {
      const history = JSON.parse(
        localStorage.getItem(HISTORY_KEY) || "[]"
      );

      return Array.isArray(history) ? history : [];
    } catch (error) {
      return [];
    }
  }

  function recordShare(type, id, url, method) {
    const normalizedType = normalizeType(type);
    const normalizedId = normalizeId(id);

    if (!normalizedType || !normalizedId) {
      return false;
    }

    try {
      const history = getHistory();

      history.unshift({
        type: normalizedType,
        id: normalizedId,
        url: url || "",
        method: method || "unknown",
        sharedAt: new Date().toISOString()
      });

      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, 100))
      );

      window.dispatchEvent(
        new CustomEvent("rockyx:content-shared", {
          detail: {
            type: normalizedType,
            id: normalizedId,
            method: method || "unknown"
          }
        })
      );

      return true;
    } catch (error) {
      console.error("RockyX share history could not be saved:", error);
      return false;
    }
  }

  async function copyLink(type, id) {
    const result = createLink(type, id);

    if (!result.success) return result;

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(result.url);
      } else {
        return {
          success: false,
          error: "Clipboard access is unavailable in this browser.",
          url: result.url
        };
      }

      recordShare(type, id, result.url, "copy");

      return {
        success: true,
        url: result.url,
        method: "copy"
      };
    } catch (error) {
      return {
        success: false,
        error: "Could not copy the link. Please try again.",
        url: result.url
      };
    }
  }

  async function shareContent(details) {
    if (!details || typeof details !== "object") {
      return {
        success: false,
        error: "Content details are required."
      };
    }

    const result = createLink(details.type, details.id);

    if (!result.success) return result;

    const title = typeof details.title === "string"
      ? details.title.trim()
      : "RockyX";

    const text = typeof details.text === "string"
      ? details.text.trim()
      : `Check this out on RockyX: ${title}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: title || "RockyX",
          text,
          url: result.url
        });

        recordShare(
          details.type,
          details.id,
          result.url,
          "native-share"
        );

        return {
          success: true,
          url: result.url,
          method: "native-share"
        };
      }

      return await copyLink(details.type, details.id);
    } catch (error) {
      if (error && error.name === "AbortError") {
        return {
          success: false,
          cancelled: true,
          error: "Sharing was cancelled."
        };
      }

      return {
        success: false,
        url: result.url,
        error: "Sharing was unsuccessful."
      };
    }
  }

  function getShareHistory(limit) {
    const maximum = Number.isInteger(limit)
      ? Math.max(0, Math.min(limit, 100))
      : 20;

    return getHistory()
      .slice(0, maximum)
      .map(item => ({ ...item }));
  }

  function clearShareHistory() {
    try {
      localStorage.removeItem(HISTORY_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  function isSupportedType(type) {
    return normalizeType(type) !== null;
  }

  window.RockyXSharing = {
    createLink,
    getCurrentContent,
    copyLink,
    shareContent,
    getShareHistory,
    clearShareHistory,
    getSupportedTypes: () => [...ALLOWED_TYPES],
    isSupportedType
  };

})();